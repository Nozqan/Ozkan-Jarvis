// Ağ durumu: bağlantı türü (tarayıcı destekliyorsa) ve uygulamanın kendi sunucusuna ölçülen gecikme.
// Üçüncü taraf sunuculara ping atılmaz.
export interface AgBilgisi {
  cevrimici: boolean;
  /** wifi / cellular / ethernet ... (Network Information API) */
  tur: string | null;
  /** 4g, 3g ... */
  etkinTur: string | null;
  indirmeMbps: number | null;
  rttMs: number | null;
  veriTasarrufu: boolean | null;
}

interface BaglantiNesnesi extends EventTarget {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

function baglanti(): BaglantiNesnesi | null {
  return (navigator as unknown as { connection?: BaglantiNesnesi }).connection ?? null;
}

export function agOku(): AgBilgisi {
  const b = baglanti();
  return {
    cevrimici: navigator.onLine,
    tur: b?.type ?? null,
    etkinTur: b?.effectiveType ?? null,
    indirmeMbps: b?.downlink ?? null,
    rttMs: b?.rtt ?? null,
    veriTasarrufu: b?.saveData ?? null,
  };
}

export function agDinle(geriCagri: () => void): () => void {
  window.addEventListener("online", geriCagri);
  window.addEventListener("offline", geriCagri);
  const b = baglanti();
  b?.addEventListener("change", geriCagri);
  return () => {
    window.removeEventListener("online", geriCagri);
    window.removeEventListener("offline", geriCagri);
    b?.removeEventListener("change", geriCagri);
  };
}

export const TUR_ADI: Record<string, string> = {
  wifi: "Wi‑Fi",
  cellular: "Mobil veri",
  ethernet: "Ethernet",
  bluetooth: "Bluetooth",
  none: "Bağlantı yok",
  other: "Diğer",
  unknown: "Bilinmiyor",
};

/** Uygulamanın kendi kaynağına HEAD isteği ile gecikme ölçer. http(s) değilse null. */
export async function gecikmeOlc(): Promise<number | null> {
  if (!navigator.onLine || !/^https?:$/.test(location.protocol)) return null;
  const ac = new AbortController();
  const zaman = setTimeout(() => ac.abort(), 5000);
  try {
    const t0 = performance.now();
    await fetch(`${location.origin}${location.pathname}?ping=${Date.now()}`, { method: "HEAD", cache: "no-store", signal: ac.signal });
    return Math.round(performance.now() - t0);
  } catch {
    return null;
  } finally {
    clearTimeout(zaman);
  }
}
