// Tüm uygulamanın arkasındaki uzay: hareketli yıldızlar ve yavaş akan enerji çizgileri.
// Düşük performansta parçacık sayısı azalır; "hareket azalt" açıkken tek kare statik çizilir.
import { useEffect, useRef } from "react";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";

export function UzayArkaplani() {
  const ref = useRef<HTMLCanvasElement>(null);
  const perf = usePerformans();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, perf.seviye === "dusuk" ? 1 : 1.5);
    const yildizlar = Array.from({ length: Math.round(130 * perf.parcacik) + 20 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      v: Math.random() * 0.012 + 0.002,
      f: Math.random() * 6.28,
      renk: Math.random() < 0.8 ? "255,247,230" : Math.random() < 0.5 ? "255,201,40" : "103,199,255",
    }));
    const cizgiler = Array.from({ length: Math.round(6 * perf.parcacik) }, () => ({
      x: Math.random(),
      y: Math.random(),
      u: 0.08 + Math.random() * 0.15,
      v: 0.01 + Math.random() * 0.02,
      renk: Math.random() < 0.5 ? "255,201,40" : "84,227,142",
    }));

    const boyutla = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ciz(0, 0);
    };

    const ciz = (t: number, dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const y of yildizlar) {
        y.y += y.v * dt * 0.6;
        if (y.y > 1) y.y = 0;
        const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.4 + y.f));
        ctx.fillStyle = `rgba(${y.renk},${a})`;
        ctx.beginPath();
        ctx.arc(y.x * w, y.y * h, y.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const c of cizgiler) {
        c.x += c.v * dt;
        if (c.x > 1.2) {
          c.x = -0.3;
          c.y = Math.random();
        }
        const x = c.x * w;
        const y = c.y * h;
        const g = ctx.createLinearGradient(x, y, x + c.u * w, y - c.u * w * 0.25);
        g.addColorStop(0, `rgba(${c.renk},0)`);
        g.addColorStop(0.5, `rgba(${c.renk},0.18)`);
        g.addColorStop(1, `rgba(${c.renk},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + c.u * w, y - c.u * w * 0.25);
        ctx.stroke();
      }
    };

    boyutla();
    window.addEventListener("resize", boyutla);
    let raf = 0;
    if (!perf.hareketAzalt) {
      let son = performance.now();
      let t = 0;
      const kare = (simdi: number) => {
        raf = requestAnimationFrame(kare);
        if (document.hidden) {
          son = simdi;
          return;
        }
        const aralik = 1000 / Math.min(perf.maksFps, 40);
        if (simdi - son < aralik) return;
        const dt = (simdi - son) / 1000;
        son = simdi;
        t += dt;
        ciz(t, dt);
      };
      raf = requestAnimationFrame(kare);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", boyutla);
    };
  }, [perf.seviye, perf.parcacik, perf.hareketAzalt, perf.maksFps]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse at 20% 10%, rgba(255,201,40,0.06), transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(255,77,56,0.06), transparent 50%), radial-gradient(ellipse at 50% 50%, #0b1224 0%, #050812 75%)",
      }}
      aria-hidden="true"
    >
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
