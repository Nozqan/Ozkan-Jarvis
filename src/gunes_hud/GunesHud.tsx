// Dinamik 3B Güneş çekirdeği HUD'ı (Canvas 2B ile 3B derinlik). Durum ve ses genliğine göre davranır.
import { useEffect, useRef } from "react";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";
import { fpsRaporla } from "@/ortak/animasyonlar/PerformansProfili";
import type { HudDurumu } from "@/veri/model/tipler";
import { halkalariCiz, type RGB } from "./EnerjiHalkalari";
import { sesGorsellestirici } from "./SesGorsellestirici";

const SARI: RGB = [255, 201, 40];
const GUNES: RGB = [255, 227, 106];
const KIRMIZI: RGB = [255, 77, 56];
const YESIL: RGB = [84, 227, 142];
const MAVI: RGB = [120, 160, 205];
const HATA: RGB = [255, 94, 108];

interface DurumHedefi {
  hiz: number;
  agirlik: { sari: number; kirmizi: number; yesil: number; mavi: number };
  guc: [number, number, number];
  nabiz: number;
  nabizHizi: number;
  sesEtkisi: number;
}

const HEDEFLER: Record<HudDurumu, DurumHedefi> = {
  hazir: { hiz: 0.6, agirlik: { sari: 0.75, kirmizi: 0.3, yesil: 0.05, mavi: 0 }, guc: [1, 0.9, 0.8], nabiz: 0.025, nabizHizi: 1.1, sesEtkisi: 0 },
  dinliyor: { hiz: 1.7, agirlik: { sari: 0.25, kirmizi: 0, yesil: 0.95, mavi: 0 }, guc: [0.7, 0.6, 1.5], nabiz: 0.03, nabizHizi: 2, sesEtkisi: 1 },
  dusunuyor: { hiz: 1.15, agirlik: { sari: 1, kirmizi: 0.08, yesil: 0, mavi: 0 }, guc: [1.5, 0.8, 0.55], nabiz: 0.13, nabizHizi: 2.4, sesEtkisi: 0 },
  konusuyor: { hiz: 1.25, agirlik: { sari: 0.5, kirmizi: 0.75, yesil: 0, mavi: 0 }, guc: [1.2, 1.5, 0.5], nabiz: 0.02, nabizHizi: 3, sesEtkisi: 1 },
  hata: { hiz: 0.4, agirlik: { sari: 0, kirmizi: 1, yesil: 0, mavi: 0 }, guc: [0.5, 1.5, 0.3], nabiz: 0.05, nabizHizi: 3.2, sesEtkisi: 0 },
  cevrimdisi: { hiz: 0.35, agirlik: { sari: 0, kirmizi: 0, yesil: 0, mavi: 1 }, guc: [0.65, 0.65, 0.65], nabiz: 0.02, nabizHizi: 0.8, sesEtkisi: 0 },
};

export const HUD_ETIKETLERI: Record<HudDurumu, string> = {
  hazir: "Hazır",
  dinliyor: "Dinliyor",
  dusunuyor: "Düşünüyor",
  konusuyor: "Konuşuyor",
  hata: "Hata",
  cevrimdisi: "Çevrimdışı yerel komut modu",
};

interface Kor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  omur: number;
  boy: number;
}

interface Ic {
  hiz: number;
  ag: { sari: number; kirmizi: number; yesil: number; mavi: number };
  guc: [number, number, number];
  nabiz: number;
  nabizHizi: number;
  sesEtkisi: number;
  t: number;
  hataT: number;
  oncekiDurum: HudDurumu;
  korlar: Kor[];
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const rgba = (c: RGB | number[], a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

function cekirdekRengi(a: Ic["ag"]): RGB {
  const top = a.sari + a.kirmizi + a.yesil + a.mavi || 1;
  const f = (i: number) => (SARI[i] * a.sari + KIRMIZI[i] * a.kirmizi + YESIL[i] * a.yesil + MAVI[i] * a.mavi) / top;
  return [f(0), f(1), f(2)];
}

interface Props {
  durum: HudDurumu;
  className?: string;
}

export function GunesHud({ durum, className }: Props) {
  const tuval = useRef<HTMLCanvasElement>(null);
  const durumRef = useRef(durum);
  const perf = usePerformans();
  const perfRef = useRef(perf);

  useEffect(() => {
    durumRef.current = durum;
  }, [durum]);
  useEffect(() => {
    perfRef.current = perf;
  }, [perf]);

  useEffect(() => {
    const canvas = tuval.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const ic: Ic = {
      hiz: 0.6,
      ag: { sari: 0.75, kirmizi: 0.3, yesil: 0, mavi: 0 },
      guc: [1, 0.9, 0.8],
      nabiz: 0.02,
      nabizHizi: 1,
      sesEtkisi: 0,
      t: 0,
      hataT: 0,
      oncekiDurum: durumRef.current,
      korlar: [],
    };

    const boyutla = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, perfRef.current.dpr);
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    boyutla();
    const ro = new ResizeObserver(boyutla);
    ro.observe(canvas);

    let raf = 0;
    let son = performance.now();
    let fpsSayac = 0;
    let fpsZaman = son;

    const kare = (simdi: number) => {
      raf = requestAnimationFrame(kare);
      if (document.hidden) {
        son = simdi;
        return;
      }
      const p = perfRef.current;
      if (simdi - son < 1000 / p.maksFps - 1) return;
      const dt = Math.min(0.05, (simdi - son) / 1000);
      son = simdi;

      // FPS ölçümü → performans profili
      fpsSayac++;
      if (simdi - fpsZaman >= 1000) {
        fpsRaporla((fpsSayac * 1000) / (simdi - fpsZaman), p.maksFps);
        fpsSayac = 0;
        fpsZaman = simdi;
      }

      const d = durumRef.current;
      const hedef = HEDEFLER[d];
      const azalt = p.hareketAzalt;
      const k = 1 - Math.exp(-dt * 3.2);
      ic.hiz = mix(ic.hiz, hedef.hiz * (azalt ? 0.3 : 1), k);
      ic.ag.sari = mix(ic.ag.sari, hedef.agirlik.sari, k);
      ic.ag.kirmizi = mix(ic.ag.kirmizi, hedef.agirlik.kirmizi, k);
      ic.ag.yesil = mix(ic.ag.yesil, hedef.agirlik.yesil, k);
      ic.ag.mavi = mix(ic.ag.mavi, hedef.agirlik.mavi, k);
      ic.guc = ic.guc.map((g, i) => mix(g, hedef.guc[i], k)) as [number, number, number];
      ic.nabiz = mix(ic.nabiz, azalt ? hedef.nabiz * 0.3 : hedef.nabiz, k);
      ic.nabizHizi = mix(ic.nabizHizi, hedef.nabizHizi, k);
      ic.sesEtkisi = mix(ic.sesEtkisi, hedef.sesEtkisi, k);
      ic.t += dt * (azalt ? 0.5 : 1);
      if (d === "hata" && ic.oncekiDurum !== "hata") ic.hataT = 1.4;
      ic.oncekiDurum = d;
      ic.hataT = Math.max(0, ic.hataT - dt);

      sesGorsellestirici.guncelle(dt);
      const genlik = sesGorsellestirici.genlik * ic.sesEtkisi * (azalt ? 0.4 : 1);
      const bantlar = sesGorsellestirici.bantlar.map((b) => b * ic.sesEtkisi * (azalt ? 0.4 : 1)) as [number, number, number];

      const cx = (w * dpr) / 2;
      const cy = (h * dpr) / 2;
      const R = (Math.min(w, h) * dpr) / 2 * 0.94;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const renk = cekirdekRengi(ic.ag);
      const nabiz = Math.sin(ic.t * ic.nabizHizi * Math.PI * 2) * ic.nabiz;
      const cekR = R * 0.3 * (1 + nabiz + genlik * 0.22);

      // Halka renkleri: çevrimdışıyken mavi-gri tonuna kayar.
      const soluk = ic.ag.mavi;
      const tonla = (c: RGB): RGB => [mix(c[0], MAVI[0], soluk), mix(c[1], MAVI[1], soluk), mix(c[2], MAVI[2], soluk)];
      const halkaParam = {
        t: ic.t,
        cx,
        cy,
        R,
        guc: ic.guc,
        renkler: [tonla(SARI), tonla(KIRMIZI), tonla(YESIL)] as [RGB, RGB, RGB],
        bantlar,
        parcacik: p.parcacik,
        segment: p.seviye === "dusuk" ? 40 : 84,
        hiz: ic.hiz,
      };

      // 1) Dış ışıma
      ctx.globalCompositeOperation = "lighter";
      const isima = ctx.createRadialGradient(cx, cy, cekR * 0.6, cx, cy, R * 1.0);
      isima.addColorStop(0, rgba(renk, 0.38 + genlik * 0.25));
      isima.addColorStop(0.45, rgba(renk, 0.1 + genlik * 0.1));
      isima.addColorStop(1, rgba(renk, 0));
      ctx.fillStyle = isima;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2) Halkaların arka yarısı
      halkalariCiz(ctx, halkaParam, false);

      // 3) Korona ışınları
      ctx.globalCompositeOperation = "lighter";
      const isinSayisi = Math.round(34 * (0.5 + 0.5 * p.parcacik));
      for (let i = 0; i < isinSayisi; i++) {
        const a = (i / isinSayisi) * Math.PI * 2 + ic.t * 0.12 * ic.hiz;
        const dalga = 0.5 + 0.5 * Math.sin(ic.t * 2.2 * ic.hiz + i * 1.7) * Math.sin(ic.t * 1.3 + i * 0.6);
        const uzun = cekR * (1.18 + 0.38 * dalga + genlik * 0.7 + bantlar[i % 3] * 0.35);
        const gen = (Math.PI * 2) / isinSayisi * 0.32;
        const g = ctx.createLinearGradient(cx + Math.cos(a) * cekR, cy + Math.sin(a) * cekR, cx + Math.cos(a) * uzun, cy + Math.sin(a) * uzun);
        g.addColorStop(0, rgba(renk, 0.55));
        g.addColorStop(1, rgba(renk, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - gen) * cekR * 0.95, cy + Math.sin(a - gen) * cekR * 0.95);
        ctx.lineTo(cx + Math.cos(a) * uzun, cy + Math.sin(a) * uzun);
        ctx.lineTo(cx + Math.cos(a + gen) * cekR * 0.95, cy + Math.sin(a + gen) * cekR * 0.95);
        ctx.closePath();
        ctx.fill();
      }

      // 4) Çekirdek küre (3B gölgelendirme)
      ctx.globalCompositeOperation = "source-over";
      const kure = ctx.createRadialGradient(cx - cekR * 0.32, cy - cekR * 0.34, cekR * 0.05, cx, cy, cekR);
      const acik: RGB = [mix(renk[0], 255, 0.75), mix(renk[1], 255, 0.75), mix(renk[2], 255, 0.6)];
      kure.addColorStop(0, rgba(acik, 1));
      kure.addColorStop(0.35, rgba(GUNES.map((c, i) => mix(c, renk[i], 0.45)), 1));
      kure.addColorStop(0.8, rgba(renk, 1));
      kure.addColorStop(1, rgba(renk.map((c) => c * 0.35), 1));
      ctx.fillStyle = kure;
      ctx.beginPath();
      ctx.arc(cx, cy, cekR, 0, Math.PI * 2);
      ctx.fill();

      // plazma lekeleri (küre içinde kırpılmış)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cekR, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = "lighter";
      const leke = p.seviye === "dusuk" ? 4 : 8;
      for (let i = 0; i < leke; i++) {
        const a = ic.t * (0.35 + (i % 3) * 0.18) * ic.hiz + i * 2.4;
        const uz = cekR * (0.25 + 0.4 * ((i * 37) % 10) / 10);
        const lx = cx + Math.cos(a) * uz;
        const ly = cy + Math.sin(a * 0.9 + i) * uz * 0.8;
        const lr = cekR * (0.38 + 0.12 * Math.sin(ic.t * 1.5 + i));
        const c = i % 2 ? KIRMIZI : GUNES;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
        g.addColorStop(0, rgba(c.map((v, j) => mix(v, renk[j], 0.5)), 0.38));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - cekR, cy - cekR, cekR * 2, cekR * 2);
      }
      // kenar kararması (3B hacim hissi)
      ctx.globalCompositeOperation = "source-over";
      const kenar = ctx.createRadialGradient(cx, cy, cekR * 0.55, cx, cy, cekR);
      kenar.addColorStop(0, "rgba(0,0,0,0)");
      kenar.addColorStop(1, "rgba(20,4,0,0.55)");
      ctx.fillStyle = kenar;
      ctx.fillRect(cx - cekR, cy - cekR, cekR * 2, cekR * 2);
      ctx.restore();

      // 5) Halkaların ön yarısı
      halkalariCiz(ctx, halkaParam, true);

      // 6) Dışa savrulan enerji kıvılcımları
      if (!azalt) {
        const maks = Math.round(46 * p.parcacik);
        while (ic.korlar.length < maks && Math.random() < 0.6) {
          const a = Math.random() * Math.PI * 2;
          const v = (28 + Math.random() * 60) * (0.5 + ic.hiz * 0.5) * (R / 200);
          ic.korlar.push({ x: cx + Math.cos(a) * cekR, y: cy + Math.sin(a) * cekR, vx: Math.cos(a) * v, vy: Math.sin(a) * v, omur: 1, boy: 0.8 + Math.random() * 1.8 });
        }
        ctx.globalCompositeOperation = "lighter";
        ic.korlar = ic.korlar.filter((o) => {
          o.x += o.vx * dt;
          o.y += o.vy * dt;
          o.omur -= dt * 0.55;
          if (o.omur <= 0) return false;
          ctx.fillStyle = rgba(renk, o.omur * 0.8);
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.boy * dpr * o.omur + 0.4, 0, Math.PI * 2);
          ctx.fill();
          return true;
        });
      }

      // 7) Hata uyarı halkası (kısa kırmızı genişleyen halka)
      if (ic.hataT > 0) {
        const ilerleme = 1 - ic.hataT / 1.4;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 2; i++) {
          const pr = Math.max(0, ilerleme - i * 0.18);
          ctx.strokeStyle = rgba(HATA, (1 - pr) * 0.9);
          ctx.lineWidth = (4 - pr * 3) * dpr;
          ctx.beginPath();
          ctx.arc(cx, cy, cekR * 1.1 + pr * R * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(kare);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={tuval}
      className={className}
      role="img"
      aria-label={`Güneş çekirdeği göstergesi: ${HUD_ETIKETLERI[durum]}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
