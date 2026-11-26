// Nesne tanıma: TensorFlow.js + COCO-SSD (80 sınıf), cihaz üzerinde çalışır. Görüntü dışarı gönderilmez.
// Model ilk kullanımda CDN'den indirilir.
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import { betikYukle } from "@/ortak/yardimci/yardimcilar";
import type { Sonuc } from "@/veri/model/tipler";

export interface TanınanNesne {
  ad: string;
  guven: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CocoModel {
  detect(g: HTMLCanvasElement, maks?: number): Promise<{ bbox: [number, number, number, number]; class: string; score: number }[]>;
}
interface CocoGenel {
  load(o?: { base?: string }): Promise<CocoModel>;
}

const TR: Record<string, string> = {
  person: "İnsan", bicycle: "Bisiklet", car: "Araba", motorcycle: "Motosiklet", airplane: "Uçak", bus: "Otobüs", train: "Tren", truck: "Kamyon", boat: "Tekne",
  "traffic light": "Trafik ışığı", "fire hydrant": "Yangın musluğu", "stop sign": "Dur işareti", "parking meter": "Parkmetre", bench: "Bank", bird: "Kuş", cat: "Kedi",
  dog: "Köpek", horse: "At", sheep: "Koyun", cow: "İnek", elephant: "Fil", bear: "Ayı", zebra: "Zebra", giraffe: "Zürafa", backpack: "Sırt çantası", umbrella: "Şemsiye",
  handbag: "El çantası", tie: "Kravat", suitcase: "Bavul", frisbee: "Frizbi", skis: "Kayak", snowboard: "Snowboard", "sports ball": "Top", kite: "Uçurtma",
  "baseball bat": "Beyzbol sopası", "baseball glove": "Beyzbol eldiveni", skateboard: "Kaykay", surfboard: "Sörf tahtası", "tennis racket": "Tenis raketi", bottle: "Şişe",
  "wine glass": "Şarap kadehi", cup: "Fincan/Bardak", fork: "Çatal", knife: "Bıçak", spoon: "Kaşık", bowl: "Kase", banana: "Muz", apple: "Elma", sandwich: "Sandviç",
  orange: "Portakal", broccoli: "Brokoli", carrot: "Havuç", "hot dog": "Sosisli", pizza: "Pizza", donut: "Donut", cake: "Pasta", chair: "Sandalye", couch: "Kanepe",
  "potted plant": "Saksı bitkisi", bed: "Yatak", "dining table": "Yemek masası", toilet: "Tuvalet", tv: "Televizyon", laptop: "Dizüstü bilgisayar", mouse: "Fare",
  remote: "Kumanda", keyboard: "Klavye", "cell phone": "Cep telefonu", microwave: "Mikrodalga", oven: "Fırın", toaster: "Tost makinesi", sink: "Lavabo",
  refrigerator: "Buzdolabı", book: "Kitap", clock: "Saat", vase: "Vazo", scissors: "Makas", "teddy bear": "Oyuncak ayı", "hair drier": "Saç kurutma makinesi", toothbrush: "Diş fırçası",
};

let model: CocoModel | null = null;

async function modelAl(): Promise<CocoModel> {
  if (model) return model;
  await betikYukle("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
  await betikYukle("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
  const c = (window as unknown as { cocoSsd?: CocoGenel }).cocoSsd;
  if (!c) throw new Error("model_yok");
  model = await c.load({ base: "lite_mobilenet_v2" });
  return model;
}

export async function nesneleriTani(tuval: HTMLCanvasElement): Promise<Sonuc<TanınanNesne[]>> {
  try {
    const m = await modelAl();
    const sonuc = await m.detect(tuval, 12);
    const liste = sonuc
      .filter((s) => s.score >= 0.45)
      .map((s) => ({ ad: TR[s.class] ?? s.class, guven: Math.round(s.score * 100), x: s.bbox[0], y: s.bbox[1], w: s.bbox[2], h: s.bbox[3] }));
    if (!liste.length) {
      return basarisiz(hata("nesne_yok", "Tanınabilir bir nesne bulunamadı.", "Nesneyi çerçeveye alın, ışığı artırın ve tekrar deneyin. Model günlük yaygın 80 nesneyi tanır.", true));
    }
    return basarili(liste);
  } catch {
    return basarisiz(
      hata(
        "nesne_model",
        navigator.onLine ? "Nesne tanıma modeli yüklenemedi." : "Nesne tanıma modeli ilk kullanımda indirilmeli, şu an çevrimdışısınız.",
        "İnternete bağlanıp tekrar deneyin. Model bir kez indirildikten sonra tarayıcı önbelleğinden çalışır.",
      ),
    );
  }
}
