// Açılış canvas animasyonu: yıldız akışı → güneş çekirdeğinin birleşmesi → dönen enerji halkaları.
// Zaman çizelgesi (saniye, "normal" hızda): 0–1 yıldızlar · 1–2.2 çekirdek birleşir · 2–2.8 halkalar belirir
import { useEffect, useRef, type MutableRefObject } from "react";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";
import { aralik, yumusat } from "@/ortak/animasyonlar/Zamanlama";
import { halkalariCiz, type RGB } from "@/gunes_hud/EnerjiHalkalari";

interface Props {
  /** Üst bileşen her karede günceller (saniye) */
  zaman: MutableRefObject<number>;
  /** Amblem merkezinin dikey konumu (0..1) */
  merkezY: number;
  /** Çekirdek/halka ölçeği için referans boyut (css piksel) */
  boyut: number;
}

const SARI: RGB = [255, 201, 40];
const KIRMIZI: RGB = [255, 77, 56];
const YESIL: RGB = [84, 227, 142];

export function GirisKanvasi({ zaman, merkezY, boyut }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const perf = usePerformans();
  const perfRef = useRef(perf);
  const gir = useRef({ merkezY, boyut });

  useEffect(() => {
    perfRef.current = perf;
    gir.current = { merkezY, boyut };
  }, [perf, merkezY, boyut]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const boyutla = () => {
      dpr = Math.min(window.devicePixelRatio || 1, perfRef.current.dpr);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    boyutla();
    window.addEventListener("resize", boyutla);

    const p0 = perfRef.current;
    const yildizlar = Array.from({ length: Math.round(260 * p0.parcacik) + 40 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 0.95 + 0.05,
    }));
    const toplayici = Array.from({ length: Math.round(150 * p0.parcacik) + 30 }, () => ({
      aci: Math.random() * Math.PI * 2,
      uzak: 0.55 + Math.random() * 0.75,
      gecikme: Math.random() * 0.25,
      boy: 0.8 + Math.random() * 2,
      renk: (Math.random() < 0.6 ? SARI : Math.random() < 0.5 ? KIRMIZI : YESIL) as RGB,
    }));

    let raf = 0;
    let son = performance.now();
    const kare = (simdi: number) => {
      raf = requestAnimationFrame(kare);
      const dt = Math.min(0.05, (simdi - son) / 1000);
      son = simdi;
      const t = zaman.current;
      const p = perfRef.current;
      const { merkezY: my, boyut: S } = gir.current;
      const cx = (w * dpr) / 2;
      const cy = h * my * dpr;
      const Rr = S * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Yıldızlar: başta hızlı akış, sonra sakin süzülme
      const hiz = p.hareketAzalt ? 0.03 : 0.04 + 0.5 * (1 - aralik(t, 0.2, 2.4));
      ctx.globalCompositeOperation = "lighter";
      const acilis = yumusat(aralik(t, 0, 0.6));
      for (const y of yildizlar) {
        const oncekiZ = y.z;
        y.z -= dt * hiz;
        if (y.z <= 0.03) {
          y.z = 1;
          y.x = Math.random() * 2 - 1;
          y.y = Math.random() * 2 - 1;
        }
        const olcek = (Math.max(w, h) * dpr) / 2;
        const sx = cx + (y.x / y.z) * olcek * 0.28;
        const sy = h * dpr * 0.5 + (y.y / y.z) * olcek * 0.28;
        const ox = cx + (y.x / oncekiZ) * olcek * 0.28;
        const oy = h * dpr * 0.5 + (y.y / oncekiZ) * olcek * 0.28;
        if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) continue;
        const parlak = (1 - y.z) * 0.9 * acilis;
        ctx.strokeStyle = `rgba(255,${230 - y.z * 40},${170 + y.z * 60},${parlak})`;
        ctx.lineWidth = (0.6 + (1 - y.z) * 1.6) * dpr;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      // --- Güneş çekirdeği parçacıkları amblemin merkezine birleşir
      const birles = aralik(t, 1.0, 2.2);
      if (birles > 0 && birles < 1.001) {
        for (const q of toplayici) {
          const k = yumusat(aralik(t, 1.0 + q.gecikme, 2.2));
          const yar = q.uzak * Rr * 1.5 * Math.pow(1 - k, 1.6);
          const aci = q.aci + k * 3.2;
          const x = cx + Math.cos(aci) * yar;
          const y = cy + Math.sin(aci) * yar * 0.9;
          const k0 = Math.max(0, k - 0.07);
          const yar0 = q.uzak * Rr * 1.5 * Math.pow(1 - k0, 1.6);
          const aci0 = q.aci + k0 * 3.2;
          const alfa = Math.min(1, k * 4) * (1 - Math.pow(k, 6));
          ctx.strokeStyle = `rgba(${q.renk[0]},${q.renk[1]},${q.renk[2]},${alfa * 0.6})`;
          ctx.lineWidth = q.boy * dpr * 0.8;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(aci0) * yar0, cy + Math.sin(aci0) * yar0 * 0.9);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = `rgba(255,240,180,${alfa})`;
          ctx.beginPath();
          ctx.arc(x, y, q.boy * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Çekirdek parlaması
      const cekirdek = yumusat(aralik(t, 1.5, 2.5));
      if (cekirdek > 0) {
        const nabiz = 1 + Math.sin(t * 5) * 0.04 * cekirdek;
        const r = Rr * 0.34 * cekirdek * nabiz;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
        g.addColorStop(0, "rgba(255,252,220,0.95)");
        g.addColorStop(0.22, "rgba(255,227,106,0.85)");
        g.addColorStop(0.5, "rgba(255,160,40,0.4)");
        g.addColorStop(1, "rgba(255,77,56,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
        // Birleşme anında genişleyen ışık dalgası
        const dalga = aralik(t, 2.1, 3.0);
        if (dalga > 0 && dalga < 1) {
          ctx.strokeStyle = `rgba(255,227,106,${(1 - dalga) * 0.8})`;
          ctx.lineWidth = (5 - dalga * 4) * dpr;
          ctx.beginPath();
          ctx.arc(cx, cy, Rr * (0.3 + dalga * 1.5), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- Dönen enerji halkaları (sarı, kırmızı, yeşil)
      const halka = yumusat(aralik(t, 2.0, 2.9));
      if (halka > 0.01) {
        const prm = {
          t: t * 1.6,
          cx,
          cy,
          R: Rr * 1.02,
          guc: [1.25 * halka, 1.15 * halka, 1.1 * halka] as [number, number, number],
          renkler: [SARI, KIRMIZI, YESIL] as [RGB, RGB, RGB],
          bantlar: [0, 0, 0] as [number, number, number],
          parcacik: p.parcacik,
          segment: p.seviye === "dusuk" ? 40 : 84,
          hiz: p.hareketAzalt ? 0.8 : 2.2,
        };
        halkalariCiz(ctx, prm, false);
        halkalariCiz(ctx, prm, true);
      }
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(kare);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", boyutla);
    };
  }, [zaman]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
