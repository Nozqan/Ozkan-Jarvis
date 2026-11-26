// OCR: Tesseract (WASM) ile TÜRKÇE metin okuma. Tanıma cihazda yapılır; görüntü hiçbir yere gönderilmez.
// İlk kullanımda motor ve Türkçe dil verisi CDN'den indirilir (sonra tarayıcı önbelleğinden gelir).
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import { betikYukle } from "@/ortak/yardimci/yardimcilar";
import type { Sonuc } from "@/veri/model/tipler";

export interface OcrKelime {
  metin: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface OcrSonucu {
  metin: string;
  guven: number;
  kelimeler: OcrKelime[];
}

interface TesseractKelime {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}
interface TesseractIsci {
  recognize(g: HTMLCanvasElement): Promise<{
    data: {
      text: string;
      confidence: number;
      words?: TesseractKelime[];
      blocks?: { paragraphs: { lines: { words: TesseractKelime[] }[] }[] }[];
    };
  }>;
  terminate(): Promise<unknown>;
}
interface TesseractGenel {
  createWorker(dil: string, oem?: number, secenekler?: { logger?: (m: { status: string; progress: number }) => void }): Promise<TesseractIsci>;
}

let isci: TesseractIsci | null = null;
let ilerlemeGeriCagrisi: ((p: number, durum: string) => void) | null = null;

async function iscıAl(): Promise<TesseractIsci> {
  if (isci) return isci;
  await betikYukle("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
  const T = (window as unknown as { Tesseract?: TesseractGenel }).Tesseract;
  if (!T) throw new Error("ocr_yok");
  isci = await T.createWorker("tur", 1, { logger: (m) => ilerlemeGeriCagrisi?.(m.progress, m.status) });
  return isci;
}

export async function metinOku(tuval: HTMLCanvasElement, ilerleme?: (p: number, durum: string) => void): Promise<Sonuc<OcrSonucu>> {
  ilerlemeGeriCagrisi = ilerleme ?? null;
  try {
    const w = await iscıAl();
    const { data } = await w.recognize(tuval);
    const ham = data.words ?? data.blocks?.flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words))) ?? [];
    const kelimeler = ham
      .filter((k) => k.text.trim() && k.confidence > 40)
      .map((k) => ({ metin: k.text, x0: k.bbox.x0, y0: k.bbox.y0, x1: k.bbox.x1, y1: k.bbox.y1 }));
    const metin = data.text.replace(/\n{3,}/g, "\n\n").trim();
    if (!metin) {
      return basarisiz(hata("ocr_bos", "Görüntüde okunabilir metin bulunamadı.", "Metni çerçevenin ortasına alın, ışığı artırın ve kamerayı sabit tutup tekrar deneyin."));
    }
    return basarili({ metin, guven: Math.round(data.confidence), kelimeler });
  } catch (e) {
    const cevrimdisi = !navigator.onLine;
    void e;
    return basarisiz(
      hata(
        "ocr_hata",
        cevrimdisi ? "OCR motoru ilk kullanımda indirilmeli, şu an çevrimdışısınız." : "Metin okuma motoru yüklenemedi.",
        "İnternete bağlanıp tekrar deneyin. Motor bir kez indirildikten sonra tarayıcı önbelleğinden çalışır.",
      ),
    );
  } finally {
    ilerlemeGeriCagrisi = null;
  }
}

/** Ekrandan çıkılınca OCR çalışanını kapatıp belleği serbest bırakır. */
export async function metinTarayiciKapat(): Promise<void> {
  const w = isci;
  isci = null;
  try {
    await w?.terminate();
  } catch {
    /* yoksay */
  }
}
