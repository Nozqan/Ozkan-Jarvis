// Temel el/jest algılama: MediaPipe Gesture Recognizer (cihaz üzerinde WASM/GPU). Model ilk kullanımda CDN'den indirilir.
// Algılanan jestler: yumruk, açık avuç, işaret parmağı yukarı, başparmak yukarı/aşağı, zafer işareti, "seni seviyorum".
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { Sonuc } from "@/veri/model/tipler";

const SURUM = "0.10.14";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${SURUM}`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

interface JestTanici {
  recognizeForVideo(v: HTMLVideoElement, ts: number): {
    gestures: { categoryName: string; score: number }[][];
    landmarks: { x: number; y: number }[][];
  };
  close(): void;
}

const TR: Record<string, string> = {
  Closed_Fist: "Yumruk",
  Open_Palm: "Açık avuç",
  Pointing_Up: "İşaret parmağı yukarı",
  Thumb_Down: "Başparmak aşağı",
  Thumb_Up: "Başparmak yukarı",
  Victory: "Zafer (V) işareti",
  ILoveYou: "Seni seviyorum işareti",
};

export interface JestSonucu {
  ad: string | null;
  guven: number;
  /** Eli çevreleyen kutu (video piksel koordinatları) */
  kutu: { x: number; y: number; w: number; h: number } | null;
}

let tanici: JestTanici | null = null;
let sonZaman = 0;

export async function jestHazirla(): Promise<Sonuc<true>> {
  if (tanici) return basarili(true);
  try {
    const url = `${CDN}/vision_bundle.mjs`;
    const mod = (await import(/* @vite-ignore */ url)) as {
      FilesetResolver: { forVisionTasks(yol: string): Promise<unknown> };
      GestureRecognizer: { createFromOptions(v: unknown, o: unknown): Promise<JestTanici> };
    };
    const vision = await mod.FilesetResolver.forVisionTasks(`${CDN}/wasm`);
    const olustur = (delegate: "GPU" | "CPU") =>
      mod.GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: "VIDEO",
        numHands: 1,
      });
    try {
      tanici = await olustur("GPU");
    } catch {
      tanici = await olustur("CPU");
    }
    return basarili(true);
  } catch {
    return basarisiz(
      hata(
        "jest_model",
        navigator.onLine ? "Jest algılama modeli yüklenemedi." : "Jest modeli ilk kullanımda indirilmeli, şu an çevrimdışısınız.",
        "İnternete bağlanıp tekrar deneyin. Model indirildikten sonra tarayıcı önbelleğinden çalışır.",
      ),
    );
  }
}

export function jestAlgila(video: HTMLVideoElement): JestSonucu | null {
  if (!tanici || video.videoWidth === 0) return null;
  const ts = Math.max(performance.now(), sonZaman + 1);
  sonZaman = ts;
  try {
    const s = tanici.recognizeForVideo(video, ts);
    const el = s.landmarks[0];
    if (!el) return { ad: null, guven: 0, kutu: null };
    const xs = el.map((p) => p.x * video.videoWidth);
    const ys = el.map((p) => p.y * video.videoHeight);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const jest = s.gestures[0]?.[0];
    const ad = jest && jest.categoryName !== "None" && jest.score > 0.55 ? (TR[jest.categoryName] ?? null) : null;
    return { ad, guven: jest ? Math.round(jest.score * 100) : 0, kutu: { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y } };
  } catch {
    return null;
  }
}

export function jestKapat(): void {
  try {
    tanici?.close();
  } catch {
    /* yoksay */
  }
  tanici = null;
}
