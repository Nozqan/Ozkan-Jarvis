// Kamera önizlemesinin üstündeki fütüristik HUD katmanı: 3B tarama ızgarası, tarama çizgisi, hedef kilitleme halkaları.
import { useEffect, useRef } from "react";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";
import type { Kilit } from "./KameraViewModel";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  kilitler: Kilit[];
  analizde: boolean;
  aktif: boolean;
}

function yuvarlakDikdortgen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function KameraHudKatmani({ videoRef, kilitler, analizde, aktif }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const perf = usePerformans();
  const veri = useRef({ kilitler, analizde, aktif });
  const perfRef = useRef(perf);

  useEffect(() => {
    veri.current = { kilitler, analizde, aktif };
    perfRef.current = perf;
  }, [kilitler, analizde, aktif, perf]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const boyutla = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, perfRef.current.dpr);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    boyutla();
    const ro = new ResizeObserver(boyutla);
    ro.observe(canvas);

    let raf = 0;
    let t = 0;
    let son = performance.now();
    const kare = (simdi: number) => {
      raf = requestAnimationFrame(kare);
      const p = perfRef.current;
      if (document.hidden || simdi - son < 1000 / p.maksFps - 1) return;
      const dt = Math.min(0.05, (simdi - son) / 1000);
      son = simdi;
      t += dt * (p.hareketAzalt ? 0.3 : 1);
      const { kilitler: kl, analizde: an, aktif: ak } = veri.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!ak) return;

      // --- 3B perspektif ızgara (zemin + tavan)
      const ufuk = h * 0.5;
      const cizgiSayisi = p.seviye === "dusuk" ? 8 : 14;
      ctx.lineWidth = 1;
      for (let yon = -1; yon <= 1; yon += 2) {
        for (let i = 0; i < 10; i++) {
          const k = ((i + (t * 0.6) % 1) / 10) ** 2.2;
          const y = ufuk + yon * k * h * 0.5;
          ctx.strokeStyle = `rgba(255,201,40,${0.05 + k * 0.28})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let i = -cizgiSayisi; i <= cizgiSayisi; i++) {
          const ux = w / 2 + (i / cizgiSayisi) * w * 1.1;
          ctx.strokeStyle = `rgba(103,199,255,${0.1})`;
          ctx.beginPath();
          ctx.moveTo(w / 2 + (i / cizgiSayisi) * w * 0.04, ufuk);
          ctx.lineTo(ux, ufuk + yon * h * 0.5);
          ctx.stroke();
        }
      }

      // --- Tarama çizgisi
      const periyot = an ? 1.3 : 3.6;
      const sy = ((t % periyot) / periyot) * h;
      const g = ctx.createLinearGradient(0, sy - 46, 0, sy + 3);
      const rengi = an ? "255,77,56" : "84,227,142";
      g.addColorStop(0, `rgba(${rengi},0)`);
      g.addColorStop(1, `rgba(${rengi},${an ? 0.5 : 0.3})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, sy - 46, w, 49);
      ctx.strokeStyle = `rgba(${rengi},0.95)`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `rgba(${rengi},0.9)`;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(w * 0.04, sy);
      ctx.lineTo(w * 0.96, sy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // --- Merkez nişan halkası (dönen yaylar)
      const cx = w / 2;
      const cy = h / 2;
      const rr = Math.min(w, h) * 0.13;
      ctx.lineCap = "round";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const a = t * (an ? 2.6 : 0.8) + (i * Math.PI) / 2;
        ctx.strokeStyle = i % 2 ? "rgba(255,77,56,0.75)" : "rgba(255,227,106,0.85)";
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a, a + 0.9);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,227,106,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rr * 1.35, -t * 0.5, -t * 0.5 + Math.PI * 1.2);
      ctx.stroke();

      // --- Yuvarlak çerçeve köşe yayları
      ctx.strokeStyle = "rgba(255,201,40,0.8)";
      ctx.lineWidth = 3;
      const m = 14;
      const L = Math.min(w, h) * 0.12;
      const rad = 18;
      const koseler: [number, number, number, number][] = [[m, m, 1, 1], [w - m, m, -1, 1], [w - m, h - m, -1, -1], [m, h - m, 1, -1]];
      for (const [x, y, sx, sy2] of koseler) {
        ctx.beginPath();
        ctx.moveTo(x, y + sy2 * L);
        ctx.arcTo(x, y, x + sx * L, y, rad);
        ctx.lineTo(x + sx * L, y);
        ctx.stroke();
      }

      // --- Hedef kilitleme halkaları (video koordinatlarını object-cover ile ekrana eşle)
      const v = videoRef.current;
      if (v && v.videoWidth && kl.length) {
        const olcek = Math.max(w / v.videoWidth, h / v.videoHeight);
        const ox = (w - v.videoWidth * olcek) / 2;
        const oy = (h - v.videoHeight * olcek) / 2;
        for (const k of kl) {
          const x = ox + k.x * olcek;
          const y = oy + k.y * olcek;
          const bw = k.w * olcek;
          const bh = k.h * olcek;
          const nabiz = 0.6 + 0.4 * Math.sin(t * 6);
          ctx.strokeStyle = k.renk;
          ctx.globalAlpha = k.etiket ? 0.95 : 0.7;
          ctx.lineWidth = k.etiket ? 2.5 : 1.5;
          yuvarlakDikdortgen(ctx, x, y, bw, bh, k.etiket ? 16 : 6);
          ctx.stroke();
          if (k.etiket) {
            // dönen kilit halkası
            const kx = x + bw / 2;
            const ky = y + bh / 2;
            const kr = Math.min(bw, bh) * 0.28 + 6;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              const a = t * 2.4 + (i * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.arc(kx, ky, kr * (0.9 + nabiz * 0.15), a, a + 1.2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.font = "600 12px system-ui, sans-serif";
            const tw = ctx.measureText(k.etiket).width + 18;
            const ly = Math.max(4, y - 26);
            ctx.fillStyle = "rgba(5,8,18,0.78)";
            yuvarlakDikdortgen(ctx, x, ly, tw, 22, 11);
            ctx.fill();
            ctx.strokeStyle = k.renk;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "#F7F8FC";
            ctx.fillText(k.etiket, x + 9, ly + 15);
          }
          ctx.globalAlpha = 1;
        }
      }
    };
    raf = requestAnimationFrame(kare);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [videoRef]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
