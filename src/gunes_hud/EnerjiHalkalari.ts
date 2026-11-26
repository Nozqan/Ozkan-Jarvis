// Güneş çekirdeğinin etrafındaki 3 eğik enerji halkası (sarı, kırmızı, yeşil).
// Halkalar 3B uzayda döndürülüp perspektifle izdüşürülür; arka yarı çekirdeğin arkasına, ön yarı önüne çizilir.
export type RGB = [number, number, number];

export interface HalkaParametreleri {
  t: number;
  cx: number;
  cy: number;
  R: number;
  /** Her halkanın parlaklık çarpanı (durumdan gelir). */
  guc: [number, number, number];
  renkler: [RGB, RGB, RGB];
  /** Ses frekans bantları (düşük/orta/yüksek) → halka dalgalanması. */
  bantlar: [number, number, number];
  parcacik: number;
  segment: number;
  /** Dönme hız çarpanı. */
  hiz: number;
}

interface HalkaTanimi {
  yaricap: number;
  egim: number;
  donus: number;
  faz: number;
  kalinlik: number;
}

const HALKALAR: HalkaTanimi[] = [
  { yaricap: 0.6, egim: 1.15, donus: 0.34, faz: 0, kalinlik: 2.2 },
  { yaricap: 0.76, egim: 0.5, donus: -0.27, faz: 2.1, kalinlik: 2 },
  { yaricap: 0.92, egim: -0.38, donus: 0.2, faz: 4.2, kalinlik: 1.8 },
];

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** Halka üzerindeki bir noktanın ekran konumu ve derinliği. */
function nokta(h: HalkaTanimi, aci: number, yaricapCarpani: number, t: number, hiz: number, p: HalkaParametreleri) {
  const r = h.yaricap * yaricapCarpani;
  const x0 = r * Math.cos(aci);
  const y0 = r * Math.sin(aci);
  // X ekseni etrafında eğim
  const y1 = y0 * Math.cos(h.egim);
  const z1 = y0 * Math.sin(h.egim);
  // Y ekseni etrafında yavaş presesyon
  const ph = t * h.donus * hiz + h.faz;
  const x2 = x0 * Math.cos(ph) + z1 * Math.sin(ph);
  const z2 = -x0 * Math.sin(ph) + z1 * Math.cos(ph);
  const persp = 1 / (1 - z2 * 0.28);
  return { x: p.cx + x2 * p.R * persp, y: p.cy + y1 * p.R * persp, z: z2 / (h.yaricap || 1), persp };
}

/** onPlan=false: çekirdeğin ARKASINDAKİ yarı, true: ÖNÜNDEKİ yarı. */
export function halkalariCiz(ctx: CanvasRenderingContext2D, p: HalkaParametreleri, onPlan: boolean): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  HALKALAR.forEach((h, i) => {
    const renk = p.renkler[i];
    const guc = p.guc[i];
    const bant = p.bantlar[i];
    const dalga = (a: number) => 1 + bant * 0.1 * Math.sin(a * 7 + p.t * 9 + i);

    // --- Halka çizgisi (akan kesikli enerji)
    let onceki = nokta(h, 0, dalga(0), p.t, p.hiz, p);
    for (let k = 1; k <= p.segment; k++) {
      const a = (k / p.segment) * Math.PI * 2;
      const s = nokta(h, a, dalga(a), p.t, p.hiz, p);
      const ortaZ = (s.z + onceki.z) / 2;
      if (ortaZ >= 0 === onPlan) {
        const derinlik = 0.35 + 0.65 * ((ortaZ + 1) / 2);
        const akis = 0.45 + 0.55 * Math.sin(a * 3 - p.t * 2.4 * p.hiz + i * 2);
        ctx.strokeStyle = rgba(renk, (0.16 + 0.5 * akis) * derinlik * guc);
        ctx.lineWidth = h.kalinlik * s.persp * (0.8 + bant * 0.9);
        ctx.beginPath();
        ctx.moveTo(onceki.x, onceki.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      onceki = s;
    }

    // --- Halka üzerinde dönen enerji parçacıkları
    const adet = Math.max(6, Math.round(26 * p.parcacik));
    for (let k = 0; k < adet; k++) {
      const a = (k / adet) * Math.PI * 2 + p.t * (0.5 + i * 0.22) * p.hiz * (i % 2 ? -1 : 1);
      const s = nokta(h, a, dalga(a), p.t, p.hiz, p);
      if (s.z >= 0 !== onPlan) continue;
      const derinlik = 0.4 + 0.6 * ((s.z + 1) / 2);
      const r = (1.6 + (k % 3) * 0.9 + bant * 2.5) * s.persp * (0.7 + derinlik * 0.6);
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.2);
      g.addColorStop(0, rgba([255, 255, 255], 0.9 * derinlik * Math.min(1, guc)));
      g.addColorStop(0.25, rgba(renk, 0.75 * derinlik * guc));
      g.addColorStop(1, rgba(renk, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}
