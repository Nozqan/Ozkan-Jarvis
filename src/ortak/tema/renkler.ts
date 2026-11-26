// AKREP JARVIS renk paleti — tüm canvas çizimleri bu değerleri kullanır.
export const RENK = {
  uzay: "#050812",
  lacivert: "#0B1224",
  cam: "#172033",
  altin: "#FFC928",
  gunes: "#FFE36A",
  kirmizi: "#FF4D38",
  yesil: "#54E38E",
  mavi: "#67C7FF",
  uyari: "#FFB547",
  hata: "#FF5E6C",
  metin: "#F7F8FC",
  metin2: "#A9B3C7",
} as const;

/** "#RRGGBB" değerini canvas için rgba() metnine çevirir. */
export function rgba(hex: string, alfa: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

/** İki rengi 0..1 oranında karıştırır, [r,g,b] döndürür. */
export function karistir(a: string, b: string, t: number): [number, number, number] {
  const x = parseInt(a.replace("#", ""), 16);
  const y = parseInt(b.replace("#", ""), 16);
  const k = Math.max(0, Math.min(1, t));
  const f = (s: number) => Math.round(((x >> s) & 255) * (1 - k) + ((y >> s) & 255) * k);
  return [f(16), f(8), f(0)];
}
