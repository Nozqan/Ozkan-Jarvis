import { arsivDeposu } from "./ArsivDeposu";
import { ayarDeposu, VARSAYILAN_AYARLAR } from "./AyarDeposu";
import { hatirlaticiDeposu } from "./HatirlaticiDeposu";
import { notDeposu } from "./NotDeposu";
import { sohbetDeposu } from "./SohbetDeposu";
import type { Ayarlar, ArsivKaydi, Hatirlatici, Not, SohbetMesaji } from "@/veri/model/tipler";

const FORMAT = "akrep-jarvis-backup";
const SURUM = 1;
const ITERASYON = 310_000;
const EN_FAZLA_VERI_BYTE = 10 * 1024 * 1024;
const EN_FAZLA_DOSYA_BYTE = 14 * 1024 * 1024;
const UTF8 = new TextEncoder();
const UTF8_COZUCU = new TextDecoder();

export interface UygulamaYedegi {
  ayarlar: Ayarlar;
  notlar: Not[];
  hatirlaticilar: Hatirlatici[];
  arsiv: ArsivKaydi[];
  sohbet: SohbetMesaji[];
}

interface SifreliDosya {
  format: typeof FORMAT;
  version: typeof SURUM;
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function base64(b: Uint8Array): string {
  let binary = "";
  for (const byte of b) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64Coz(s: string): Uint8Array {
  const binary = atob(s);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function metin(x: unknown, max = 100_000): x is string {
  return typeof x === "string" && x.length <= max;
}

function sonluSayi(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0;
}

function ayarlarMi(x: unknown): x is Ayarlar {
  if (!x || typeof x !== "object") return false;
  const a = x as Record<string, unknown>;
  return (
    (a.saglayici === "yerel" || a.saglayici === "openai" || a.saglayici === "gemini") &&
    metin(a.openaiUcNokta, 2048) &&
    metin(a.openaiModel, 256) &&
    metin(a.geminiUcNokta, 2048) &&
    metin(a.geminiModel, 256) &&
    typeof a.hariciVeriIzni === "boolean" &&
    typeof a.sesliYanit === "boolean" &&
    typeof a.uyandirmaKelimesi === "boolean" &&
    typeof a.performans === "string" &&
    (a.performans === "otomatik" || a.performans === "yuksek") &&
    typeof a.hareketAzalt === "boolean" &&
    typeof a.tamAcilis === "boolean" &&
    typeof a.sohbetGecmisiniSakla === "boolean" &&
    typeof a.acilisGorulduMu === "boolean" &&
    typeof a.sesHizi === "number" &&
    Number.isFinite(a.sesHizi) &&
    a.sesHizi >= 0.5 &&
    a.sesHizi <= 2 &&
    typeof a.sesTonu === "number" &&
    Number.isFinite(a.sesTonu) &&
    a.sesTonu >= 0.5 &&
    a.sesTonu <= 2
  );
}

function notMi(x: unknown): x is Not {
  if (!x || typeof x !== "object") return false;
  const n = x as Record<string, unknown>;
  return metin(n.id, 128) && metin(n.metin) && sonluSayi(n.olusturma) && (n.kaynak === "metin" || n.kaynak === "ses" || n.kaynak === "komut");
}

function hatirlaticiMi(x: unknown): x is Hatirlatici {
  if (!x || typeof x !== "object") return false;
  const h = x as Record<string, unknown>;
  return metin(h.id, 128) && metin(h.metin) && sonluSayi(h.zaman) && typeof h.tamamlandi === "boolean";
}

function arsivKaydiMi(x: unknown): x is ArsivKaydi {
  if (!x || typeof x !== "object") return false;
  const a = x as Record<string, unknown>;
  return (
    metin(a.id, 128) &&
    metin(a.baslik, 1024) &&
    metin(a.metin) &&
    sonluSayi(a.tarih) &&
    (a.tur === "ocr" || a.tur === "nesne" || a.tur === "ortam" || a.tur === "jest" || a.tur === "kod")
  );
}

function sohbetMesajiMi(x: unknown): x is SohbetMesaji {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    metin(m.id, 128) &&
    metin(m.metin) &&
    sonluSayi(m.tarih) &&
    (m.rol === "kullanici" || m.rol === "jarvis") &&
    (m.kaynak === undefined || m.kaynak === "yerel" || m.kaynak === "yapay_zeka" || m.kaynak === "sistem")
  );
}

function diziMi<T>(x: unknown, guard: (item: unknown) => item is T, max = 10_000): x is T[] {
  return Array.isArray(x) && x.length <= max && x.every(guard);
}

export function yedekVerisiGecerliMi(x: unknown): x is UygulamaYedegi {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return (
    ayarlarMi(d.ayarlar) &&
    diziMi(d.notlar, notMi) &&
    diziMi(d.hatirlaticilar, hatirlaticiMi) &&
    diziMi(d.arsiv, arsivKaydiMi, 500) &&
    diziMi(d.sohbet, sohbetMesajiMi, 300)
  );
}

function yedekVerisiAl(): UygulamaYedegi {
  return {
    ayarlar: ayarDeposu.al(),
    notlar: notDeposu.al(),
    hatirlaticilar: hatirlaticiDeposu.al(),
    arsiv: arsivDeposu.al(),
    sohbet: sohbetDeposu.al(),
  };
}

async function parolaAnahtari(parola: string, salt: Uint8Array): Promise<CryptoKey> {
  const anahtar = await crypto.subtle.importKey("raw", UTF8.encode(parola), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: Uint8Array.from(salt), iterations: ITERASYON },
    anahtar,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sifreliYedekOlustur(parola: string, veri = yedekVerisiAl()): Promise<string> {
  if (parola.length < 8) throw new Error("Yedek parolası en az 8 karakter olmalı.");
  if (typeof crypto === "undefined" || !crypto.subtle) throw new Error("Bu cihaz güvenli şifreli yedeklemeyi desteklemiyor.");
  if (!yedekVerisiGecerliMi(veri)) throw new Error("Yedeklenecek uygulama verisi doğrulanamadı.");
  const acikMetin = UTF8.encode(JSON.stringify(veri));
  if (acikMetin.length > EN_FAZLA_VERI_BYTE) throw new Error("Yedeklenecek veriler izin verilen boyutu aşıyor.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await parolaAnahtari(parola, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, acikMetin);
  const dosya: SifreliDosya = {
    format: FORMAT,
    version: SURUM,
    kdf: "PBKDF2-SHA-256",
    iterations: ITERASYON,
    salt: base64(salt),
    iv: base64(iv),
    ciphertext: base64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(dosya);
}

export async function sifreliYedekCoz(dosyaMetni: string, parola: string): Promise<UygulamaYedegi> {
  if (dosyaMetni.length > EN_FAZLA_DOSYA_BYTE) throw new Error("Yedek dosyası izin verilen boyutu aşıyor.");
  if (parola.length < 8) throw new Error("Parola en az 8 karakter olmalı.");

  let dosya: SifreliDosya;
  try {
    const x: unknown = JSON.parse(dosyaMetni);
    if (!x || typeof x !== "object") throw new Error();
    const d = x as Record<string, unknown>;
    if (
      d.format !== FORMAT ||
      d.version !== SURUM ||
      d.kdf !== "PBKDF2-SHA-256" ||
      d.iterations !== ITERASYON ||
      typeof d.salt !== "string" ||
      typeof d.iv !== "string" ||
      typeof d.ciphertext !== "string"
    ) throw new Error();
    dosya = d as unknown as SifreliDosya;
  } catch {
    throw new Error("Yedek dosyası geçersiz veya desteklenmeyen biçimde.");
  }

  try {
    const salt = base64Coz(dosya.salt);
    const iv = base64Coz(dosya.iv);
    const ciphertext = base64Coz(dosya.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length > EN_FAZLA_VERI_BYTE) throw new Error();
    const key = await parolaAnahtari(parola, salt);
    const acik = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(iv) }, key, Uint8Array.from(ciphertext));
    const veri: unknown = JSON.parse(UTF8_COZUCU.decode(acik));
    if (!yedekVerisiGecerliMi(veri)) throw new Error();
    return veri;
  } catch {
    throw new Error("Yedek açılamadı. Parolayı ve dosyanın bozulmadığını kontrol edin.");
  }
}

export function yedekVerisiniGeriYukle(veri: UygulamaYedegi): void {
  if (!yedekVerisiGecerliMi(veri)) throw new Error("Yedek içeriği doğrulanamadı.");
  ayarDeposu.ata(veri.ayarlar);
  notDeposu.ata(veri.notlar);
  hatirlaticiDeposu.ata(veri.hatirlaticilar);
  arsivDeposu.ata(veri.arsiv);
  sohbetDeposu.ata(veri.sohbet);
}

export function varsayilanAyarlariKopyala(): Ayarlar {
  return { ...VARSAYILAN_AYARLAR };
}
