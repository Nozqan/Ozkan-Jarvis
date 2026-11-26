// Performans profilleri: cihaza göre parçacık/animasyon yoğunluğunu otomatik azaltır.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ayarDeposu, useAyarlar } from "@/veri/depo/AyarDeposu";

export type PerformansSeviyesi = "yuksek" | "dengeli" | "dusuk";

export interface PerformansAyari {
  seviye: PerformansSeviyesi;
  /** 0..1 parçacık yoğunluğu çarpanı */
  parcacik: number;
  dpr: number;
  maksFps: number;
  hareketAzalt: boolean;
}

const SIRA: PerformansSeviyesi[] = ["yuksek", "dengeli", "dusuk"];
let calisma: PerformansSeviyesi | null = null;
const dinleyiciler = new Set<() => void>();
let dusukFpsSayaci = 0;

/** Donanım ipuçlarından başlangıç seviyesi (ağ/izin gerektirmez). */
export function otomatikSeviye(): PerformansSeviyesi {
  const n = typeof navigator !== "undefined" ? navigator : undefined;
  const cekirdek = n?.hardwareConcurrency ?? 4;
  const bellek = (n as unknown as { deviceMemory?: number } | undefined)?.deviceMemory ?? 4;
  if (bellek <= 2 || cekirdek <= 2) return "dusuk";
  if (bellek <= 4 || cekirdek <= 4) return "dengeli";
  return "yuksek";
}

/** HUD her saniye ölçtüğü FPS değerini bildirir; sürekli düşükse seviye bir kademe düşer. */
export function fpsRaporla(fps: number, hedefFps: number): void {
  if (ayarDeposu.al().performans !== "otomatik") return;
  // Hedefin %60'ının altı "yetişemiyor" sayılır (ör. 60 FPS hedefinde 36 altı).
  dusukFpsSayaci = fps < hedefFps * 0.6 ? dusukFpsSayaci + 1 : Math.max(0, dusukFpsSayaci - 1);
  if (dusukFpsSayaci >= 3) {
    dusukFpsSayaci = 0;
    const simdiki = calisma ?? otomatikSeviye();
    const sonraki = SIRA[Math.min(SIRA.length - 1, SIRA.indexOf(simdiki) + 1)];
    if (sonraki !== simdiki) {
      calisma = sonraki;
      dinleyiciler.forEach((d) => d());
    }
  }
}

const abone = (d: () => void) => {
  dinleyiciler.add(d);
  return () => dinleyiciler.delete(d);
};

export function profilAyari(seviye: PerformansSeviyesi, hareketAzalt: boolean): PerformansAyari {
  const tablo = {
    yuksek: { parcacik: 1, dpr: 2, maksFps: 60 },
    dengeli: { parcacik: 0.6, dpr: 1.5, maksFps: 45 },
    dusuk: { parcacik: 0.3, dpr: 1, maksFps: 30 },
  }[seviye];
  return { seviye, ...tablo, hareketAzalt };
}

export function usePerformans(): PerformansAyari {
  const ayar = useAyarlar();
  const calismaSeviyesi = useSyncExternalStore(abone, () => calisma, () => null);
  const [sistemHareketAzalt, setSistem] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setSistem(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  return useMemo(() => {
    const seviye: PerformansSeviyesi =
      ayar.performans === "otomatik" ? (calismaSeviyesi ?? otomatikSeviye()) : ayar.performans;
    return profilAyari(seviye, ayar.hareketAzalt || sistemHareketAzalt);
  }, [ayar.performans, ayar.hareketAzalt, calismaSeviyesi, sistemHareketAzalt]);
}
