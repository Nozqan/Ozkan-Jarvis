// Bellek bilgisi: yalnızca tarayıcının sunduğu güvenilir değerler. Yoksa null → "Kullanılamıyor".
export interface BellekBilgisi {
  /** Uygulamanın JS yığın kullanımı (Chromium). */
  uygulamaKullanilan: number | null;
  uygulamaLimit: number | null;
  /** Yaklaşık cihaz RAM'i (GB, yuvarlanmış değer; gizlilik için tarayıcı kaba verir). */
  cihazGB: number | null;
}

export const BELLEK_YOK: BellekBilgisi = { uygulamaKullanilan: null, uygulamaLimit: null, cihazGB: null };

export function bellekOku(): BellekBilgisi {
  const perf = performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
  const nav = navigator as unknown as { deviceMemory?: number };
  return {
    uygulamaKullanilan: perf.memory?.usedJSHeapSize ?? null,
    uygulamaLimit: perf.memory?.jsHeapSizeLimit ?? null,
    cihazGB: nav.deviceMemory ?? null,
  };
}
