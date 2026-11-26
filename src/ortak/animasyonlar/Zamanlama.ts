// Zaman çizelgesi yardımcıları: [a,b] aralığında 0..1 ilerleme ve yumuşatma eğrileri.
export const sinirla01 = (x: number) => Math.max(0, Math.min(1, x));

export function aralik(t: number, a: number, b: number): number {
  return sinirla01((t - a) / (b - a));
}

/** smoothstep: başı ve sonu yumuşak geçiş */
export function yumusat(x: number): number {
  const k = sinirla01(x);
  return k * k * (3 - 2 * k);
}

export const dogrusal = (a: number, b: number, k: number) => a + (b - a) * k;
