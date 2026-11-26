// Batarya bilgisi (Battery Status API). Tarayıcı/cihaz sağlamıyorsa veri uydurulmaz → null.
export interface BataryaBilgisi {
  desteklenir: boolean;
  yuzde: number | null;
  sarjOluyor: boolean | null;
  /** Web platformu batarya sıcaklığını sunmaz; her zaman null ("Kullanılamıyor"). */
  sicaklikC: number | null;
}

interface BataryaYoneticisi extends EventTarget {
  level: number;
  charging: boolean;
}

export const BATARYA_YOK: BataryaBilgisi = { desteklenir: false, yuzde: null, sarjOluyor: null, sicaklikC: null };

let yonetici: BataryaYoneticisi | null = null;

async function yoneticiAl(): Promise<BataryaYoneticisi | null> {
  if (yonetici) return yonetici;
  const nav = navigator as unknown as { getBattery?: () => Promise<BataryaYoneticisi> };
  if (!nav.getBattery) return null;
  try {
    yonetici = await nav.getBattery();
    return yonetici;
  } catch {
    return null;
  }
}

function bilgiye(y: BataryaYoneticisi): BataryaBilgisi {
  return { desteklenir: true, yuzde: Math.round(y.level * 100), sarjOluyor: y.charging, sicaklikC: null };
}

import { AkrepSystem, androidCapinda } from '@/yerel_android/AkrepNative';

export async function bataryaOku(): Promise<BataryaBilgisi> {
  if (androidCapinda()) {
    try {
      const s = await AkrepSystem.getStatus();
      return {
        desteklenir: s.battery.supported,
        yuzde: s.battery.percent,
        sarjOluyor: s.battery.charging,
        sicaklikC: s.battery.temperatureC,
      };
    } catch {
      return BATARYA_YOK;
    }
  }
  const y = await yoneticiAl();
  return y ? bilgiye(y) : BATARYA_YOK;
}

/** Olay tabanlı dinleme: sorgulama yapmadığı için pil dostudur. */
export function bataryaDinle(geriCagri: (b: BataryaBilgisi) => void): () => void {
  let iptal = false;
  let temizle = () => {};
  yoneticiAl().then((y) => {
    if (!y || iptal) return;
    const f = () => geriCagri(bilgiye(y));
    y.addEventListener("levelchange", f);
    y.addEventListener("chargingchange", f);
    temizle = () => {
      y.removeEventListener("levelchange", f);
      y.removeEventListener("chargingchange", f);
    };
  });
  return () => {
    iptal = true;
    temizle();
  };
}
