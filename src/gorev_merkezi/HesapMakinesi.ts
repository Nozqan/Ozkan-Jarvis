// Güvenli hesap makinesi: eval KULLANMAZ. Özyinelemeli ayrıştırıcı + Türkçe konuşma ifadeleri.
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";

type Belirtec = { t: "sayi"; v: number } | { t: "op"; v: string } | { t: "fn"; v: string };

function ayristir(ifade: string): Belirtec[] | null {
  const s = ifade.replace(/\s+/g, "");
  const b: Belirtec[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const n = Number(s.slice(i, j));
      if (!isFinite(n)) return null;
      b.push({ t: "sayi", v: n });
      i = j;
    } else if ("+-*/^()%".includes(c)) {
      b.push({ t: "op", v: c });
      i++;
    } else if (s.startsWith("sqrt", i)) {
      b.push({ t: "fn", v: "sqrt" });
      i += 4;
    } else return null;
  }
  return b;
}

class Ayristirici {
  private k = 0;
  constructor(private b: Belirtec[]) {}
  private bak = () => this.b[this.k];
  private opMu(v: string) {
    const x = this.bak();
    return x && x.t === "op" && x.v === v;
  }
  calistir(): number {
    const d = this.toplama();
    if (this.k < this.b.length) throw new Error("fazla");
    return d;
  }
  private toplama(): number {
    let d = this.carpma();
    while (this.opMu("+") || this.opMu("-")) {
      const o = (this.b[this.k++] as { v: string }).v;
      const r = this.carpma();
      d = o === "+" ? d + r : d - r;
    }
    return d;
  }
  private carpma(): number {
    let d = this.us();
    while (this.opMu("*") || this.opMu("/")) {
      const o = (this.b[this.k++] as { v: string }).v;
      const r = this.us();
      if (o === "/" && r === 0) throw new Error("sifira_bolme");
      d = o === "*" ? d * r : d / r;
    }
    return d;
  }
  private us(): number {
    const taban = this.tekli();
    if (this.opMu("^")) {
      this.k++;
      return Math.pow(taban, this.us()); // sağdan birleşimli
    }
    return taban;
  }
  private tekli(): number {
    if (this.opMu("-")) {
      this.k++;
      return -this.tekli();
    }
    if (this.opMu("+")) {
      this.k++;
      return this.tekli();
    }
    return this.sonEk();
  }
  private sonEk(): number {
    let d = this.birincil();
    while (this.opMu("%")) {
      this.k++;
      d = d / 100;
    }
    return d;
  }
  private birincil(): number {
    const x = this.b[this.k++];
    if (!x) throw new Error("eksik");
    if (x.t === "sayi") return x.v;
    if (x.t === "fn") {
      const a = this.birincil();
      if (a < 0) throw new Error("negatif_kok");
      return Math.sqrt(a);
    }
    if (x.v === "(") {
      const d = this.toplama();
      if (!this.opMu(")")) throw new Error("parantez");
      this.k++;
      return d;
    }
    throw new Error("beklenmeyen");
  }
}

export function hesapla(ifade: string): Sonuc<number> {
  const b = ayristir(ifade);
  if (!b || b.length === 0) {
    return basarisiz(hata("hesap_gecersiz", "Bu ifadeyi hesaplayamadım.", "Örnek: 12 * (3 + 4) veya 25 bölü 5 yazın.", false));
  }
  try {
    const d = new Ayristirici(b).calistir();
    if (!isFinite(d)) throw new Error("sonsuz");
    return basarili(d);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "sifira_bolme") return basarisiz(hata("sifira_bolme", "Sıfıra bölme tanımsızdır.", "Böleni sıfırdan farklı bir sayı yapın.", false));
    if (m === "negatif_kok") return basarisiz(hata("negatif_kok", "Negatif sayının karekökü gerçek sayı değildir.", "Pozitif bir sayı deneyin.", false));
    return basarisiz(hata("hesap_gecersiz", "İfade eksik veya hatalı görünüyor.", "Parantezleri ve işleçleri kontrol edin.", false));
  }
}

export function sonucMetni(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 10 }).format(n);
}

const ASCII: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
export const asciiyeCevir = (s: string) => s.replace(/[çğıöşüİÇĞÖŞÜ]/g, (c) => ASCII[c]).toLowerCase();

const BIRLER: Record<string, number> = { sifir: 0, bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9 };
const ONLAR: Record<string, number> = { on: 10, yirmi: 20, otuz: 30, kirk: 40, elli: 50, altmis: 60, yetmis: 70, seksen: 80, doksan: 90 };

/** "yirmi beş" → 25, "yüz" → 100, "iki bin" → 2000 gibi basit sayı kelimelerini rakama çevirir. */
function sayiKelimeleri(kelimeler: string[]): string[] {
  const cikti: string[] = [];
  let i = 0;
  while (i < kelimeler.length) {
    const k = kelimeler[i];
    if (k in BIRLER || k in ONLAR || k === "yuz" || k === "bin") {
      let toplam = 0;
      let grup = 0;
      let j = i;
      while (j < kelimeler.length) {
        const w = kelimeler[j];
        if (w in BIRLER) grup += BIRLER[w];
        else if (w in ONLAR) grup += ONLAR[w];
        else if (w === "yuz") grup = (grup || 1) * 100;
        else if (w === "bin") {
          toplam += (grup || 1) * 1000;
          grup = 0;
        } else break;
        j++;
      }
      cikti.push(String(toplam + grup));
      i = j;
    } else {
      cikti.push(k);
      i++;
    }
  }
  return cikti;
}

const DOLGU = new Set([
  "hesapla", "kac", "eder", "ederdir", "kactir", "nedir", "esittir", "bana", "soyle", "ne", "sonuc", "sonucu", "yap", "peki", "lutfen", "ile", "islem", "cevir", "jarvis", "akrep", "kaca", "esit",
]);

/** Konuşma dilindeki ifadeyi sayısal sonuca çevirir. Hesap ifadesi değilse null döner. */
export function turkcedenHesapla(metin: string): { ifade: string; sonuc: number } | null {
  let s = asciiyeCevir(metin).replace(/(\d),(\d)/g, "$1.$2").replace(/[?=!]/g, " ");
  // "200'ün yüzde 15'i" → 200 * 15 / 100
  const yuzde = s.match(/(\d+(?:\.\d+)?)\s*'?\s*\w*\s+yuzde\s+(\d+(?:\.\d+)?)/);
  if (yuzde) {
    const r = hesapla(`${yuzde[1]}*${yuzde[2]}/100`);
    if (r.basarili) return { ifade: `${yuzde[1]} sayısının %${yuzde[2]}'i`, sonuc: r.deger };
  }
  s = s
    .replace(/\bartı\b|\barti\b|\bcarpi\b|\bkere\b|\bbolu\b|\beksi\b|\buzeri\b|\bkarekok\b|\bkok\b/g, (m) =>
      ({ arti: "+", carpi: "*", kere: "*", bolu: "/", eksi: "-", uzeri: "^", karekok: "sqrt", kok: "sqrt" } as Record<string, string>)[m] ?? m,
    )
    .replace(/(\d)\s*x\s*(\d)/g, "$1*$2")
    .replace(/'\w+/g, " ");
  const kelimeler = sayiKelimeleri(s.split(/\s+/).filter(Boolean)).filter((k) => !DOLGU.has(k));
  const ifade = kelimeler.join("").replace(/[×]/g, "*").replace(/[÷:]/g, "/");
  if (!/\d/.test(ifade) || !/[+\-*/^%]|sqrt/.test(ifade)) return null;
  if (/[a-z]/.test(ifade.replace(/sqrt/g, ""))) return null;
  const r = hesapla(ifade);
  return r.basarili ? { ifade, sonuc: r.deger } : null;
}
