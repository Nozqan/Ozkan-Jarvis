// API anahtarlarını güvenli saklar. (Android Keystore'un web karşılığı)
// - AES-GCM 256 anahtarı "çıkarılamaz" (non-extractable) olarak IndexedDB'de tutulur.
// - Şifreli metin (iv + ct) saklanır; düz metin anahtar ASLA kalıcı depolanmaz ve loglanmaz.
// - Güvenli depolama yoksa (ör. HTTPS dışı bağlam) anahtar yalnızca oturum belleğinde tutulur ve kullanıcı bilgilendirilir.
import { oku, yaz, sil } from "@/ortak/yardimci/yerelDepo";
import { kaliciDepo, useDepo } from "@/ortak/yardimci/kaliciDepo";
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";

const VERITABANI = "akrep-guvenli";
const TABLO = "anahtarlar";
const ANA_ANAHTAR = "ana-aes";
const oturumBellegi = new Map<string, string>();
const surum = kaliciDepo<number>("akrep.anahtar.surum", 0, false);

interface SifreliKayit {
  iv: string;
  ct: string;
}

const kayitAdi = (s: string) => `akrep.sifreli.${s}`;

function guvenliMi(): boolean {
  return (
    typeof crypto !== "undefined" &&
    !!crypto.subtle &&
    typeof indexedDB !== "undefined"
  );
}

function dbAc(): Promise<IDBDatabase> {
  return new Promise((coz, reddet) => {
    const istek = indexedDB.open(VERITABANI, 1);
    istek.onupgradeneeded = () => istek.result.createObjectStore(TABLO);
    istek.onsuccess = () => coz(istek.result);
    istek.onerror = () => reddet(istek.error);
  });
}

async function anaAnahtariAl(): Promise<CryptoKey> {
  const db = await dbAc();
  try {
    const mevcut = await new Promise<CryptoKey | undefined>((coz, reddet) => {
      const r = db.transaction(TABLO).objectStore(TABLO).get(ANA_ANAHTAR);
      r.onsuccess = () => coz(r.result as CryptoKey | undefined);
      r.onerror = () => reddet(r.error);
    });
    if (mevcut) return mevcut;
    const yeni = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await new Promise<void>((coz, reddet) => {
      const r = db.transaction(TABLO, "readwrite").objectStore(TABLO).put(yeni, ANA_ANAHTAR);
      r.onsuccess = () => coz();
      r.onerror = () => reddet(r.error);
    });
    return yeni;
  } finally {
    db.close();
  }
}

const b64 = (b: ArrayBuffer | Uint8Array) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  u.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s);
};
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function anahtarKaydet(saglayici: string, anahtar: string): Promise<Sonuc<{ kalici: boolean }>> {
  const temiz = anahtar.trim();
  if (temiz.length < 8) {
    return basarisiz(hata("anahtar_kisa", "API anahtarı çok kısa görünüyor.", "Anahtarı sağlayıcı panelinden tekrar kopyalayıp yapıştırın.", false));
  }
  if (!guvenliMi()) {
    oturumBellegi.set(saglayici, temiz);
    surum.ata((n) => n + 1);
    return basarili({ kalici: false });
  }
  try {
    const k = await anaAnahtariAl();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(temiz));
    yaz(kayitAdi(saglayici), { iv: b64(iv), ct: b64(ct) } satisfies SifreliKayit);
    oturumBellegi.delete(saglayici);
    surum.ata((n) => n + 1);
    return basarili({ kalici: true });
  } catch {
    oturumBellegi.set(saglayici, temiz);
    surum.ata((n) => n + 1);
    return basarili({ kalici: false });
  }
}

export async function anahtarOku(saglayici: string): Promise<string | null> {
  const oturum = oturumBellegi.get(saglayici);
  if (oturum) return oturum;
  const kayit = oku<SifreliKayit | null>(kayitAdi(saglayici), null);
  if (!kayit || !guvenliMi()) return null;
  try {
    const k = await anaAnahtariAl();
    const acik = await crypto.subtle.decrypt({ name: "AES-GCM", iv: deB64(kayit.iv) }, k, deB64(kayit.ct));
    return new TextDecoder().decode(acik);
  } catch {
    return null;
  }
}

export function anahtarVarMi(saglayici: string): boolean {
  return oturumBellegi.has(saglayici) || oku<SifreliKayit | null>(kayitAdi(saglayici), null) !== null;
}

export async function anahtarSil(saglayici: string): Promise<void> {
  oturumBellegi.delete(saglayici);
  sil(kayitAdi(saglayici));
  surum.ata((n) => n + 1);
}

export async function guvenliAnahtarlariTemizle(): Promise<void> {
  oturumBellegi.clear();
  sil(kayitAdi("openai"));
  sil(kayitAdi("gemini"));
  surum.ata((n) => n + 1);
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((coz, reddet) => {
    const istek = indexedDB.deleteDatabase(VERITABANI);
    istek.onsuccess = () => coz();
    istek.onerror = () => reddet(new Error("Şifreleme anahtarı güvenli depodan silinemedi."));
    istek.onblocked = () => reddet(new Error("Güvenli depo açık kaldı. Uygulamayı kapatıp tekrar deneyin."));
  });
}

/** Ekranda her zaman maskeli gösterim; gerçek anahtar arayüze verilmez. */
export const MASKELI_ANAHTAR = "••••••••••••••••";

export function useAnahtarVar(saglayici: string): boolean {
  useDepo(surum);
  return anahtarVarMi(saglayici);
}
