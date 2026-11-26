// Uygulama genelinde kullanılan veri modelleri.

/** Hata modeli: ne oldu + ne yapılabilir. Stack trace asla kullanıcıya gösterilmez. */
export interface UygulamaHatasi {
  kod: string;
  mesaj: string;
  oneri: string;
  tekrarDenenebilir: boolean;
}

export type Sonuc<T> = { basarili: true; deger: T } | { basarili: false; hata: UygulamaHatasi };

export type HudDurumu = "hazir" | "dinliyor" | "dusunuyor" | "konusuyor" | "hata" | "cevrimdisi";

export type SaglayiciTuru = "yerel" | "openai" | "gemini";

export interface Ayarlar {
  saglayici: SaglayiciTuru;
  openaiUcNokta: string;
  openaiModel: string;
  geminiUcNokta: string;
  geminiModel: string;
  /** Kullanıcı açıkça izin vermeden hiçbir komut harici servise gönderilmez. */
  hariciVeriIzni: boolean;
  sesliYanit: boolean;
  sesHizi: number;
  sesTonu: number;
  uyandirmaKelimesi: boolean;
  performans: "otomatik" | "yuksek";
  hareketAzalt: boolean;
  tamAcilis: boolean;
  sohbetGecmisiniSakla: boolean;
  acilisGorulduMu: boolean;
  kullanimProfili: "tasarruf" | "dengeli" | "performans";
  vurguRengi: "gunes" | "yesil" | "mavi";
  ozellikRehberiGorulduMu: boolean;
}

export interface Not {
  id: string;
  metin: string;
  olusturma: number;
  kaynak: "metin" | "ses" | "komut";
}

export interface Hatirlatici {
  id: string;
  metin: string;
  zaman: number;
  tamamlandi: boolean;
}

export type ArsivTuru = "ocr" | "nesne" | "ortam" | "jest" | "kod";

export interface ArsivKaydi {
  id: string;
  tur: ArsivTuru;
  baslik: string;
  metin: string;
  tarih: number;
}

export interface SohbetMesaji {
  id: string;
  rol: "kullanici" | "jarvis";
  metin: string;
  tarih: number;
  kaynak?: "yerel" | "yapay_zeka" | "sistem";
}

export type BaglantiKodu = "bagli" | "bagli_degil" | "anahtar_yok" | "kota" | "cevrimdisi" | "izin_yok" | "yerel";

export interface BaglantiDurumu {
  kod: BaglantiKodu;
  mesaj: string;
  gecikmeMs?: number;
}

export interface YapayZekaIstegi {
  komut: string;
  gecmis: { rol: "kullanici" | "jarvis"; metin: string }[];
}

export interface YapayZekaYaniti {
  metin: string;
  saglayici: string;
  model?: string;
}
