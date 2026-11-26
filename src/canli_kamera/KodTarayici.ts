import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";

interface AlgilananKod {
  rawValue: string;
  format: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

interface BarkodAlgilayici {
  detect(source: HTMLCanvasElement): Promise<AlgilananKod[]>;
}

interface BarkodAlgilayiciKurucu {
  new(options?: { formats?: string[] }): BarkodAlgilayici;
  getSupportedFormats(): Promise<string[]>;
}

export interface KodTaramasi {
  metin: string;
  bicim: string;
  kutu?: { x: number; y: number; w: number; h: number };
}

function kurucuAl(): BarkodAlgilayiciKurucu | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: BarkodAlgilayiciKurucu }).BarcodeDetector ?? null;
}

export async function kodlariTani(kare: HTMLCanvasElement): Promise<Sonuc<KodTaramasi[]>> {
  const Kurucu = kurucuAl();
  if (!Kurucu) {
    return basarisiz(hata(
      "kod_tarama_desteklenmiyor",
      "Bu cihazın tarayıcısı QR/barkod taramayı desteklemiyor.",
      "Android'de güncel Chrome kullanın. Görüntü cihazda işlenir ve kaydedilmez.",
      false,
    ));
  }
  try {
    const desteklenen = await Kurucu.getSupportedFormats();
    const bicimler = ["qr_code", "aztec", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "data_matrix", "pdf417"]
      .filter((bicim) => desteklenen.includes(bicim));
    if (!bicimler.length) {
      return basarisiz(hata("kod_bicimi_desteklenmiyor", "Bu tarayıcı desteklenen QR/barkod biçimi bulamadı.", "Güncel Chrome sürümünü deneyin.", false));
    }
    const bulunanlar = await new Kurucu({ formats: bicimler }).detect(kare);
    return basarili(bulunanlar
      .filter((kod) => kod.rawValue.trim())
      .map((kod) => ({
        metin: kod.rawValue.trim(),
        bicim: kod.format,
        kutu: kod.boundingBox
          ? { x: kod.boundingBox.x, y: kod.boundingBox.y, w: kod.boundingBox.width, h: kod.boundingBox.height }
          : undefined,
      })));
  } catch {
    return basarisiz(hata("kod_taranamadi", "QR/barkod görüntüsü analiz edilemedi.", "Kodu aydınlatıp kameraya yaklaştırarak tekrar deneyin.", true));
  }
}
