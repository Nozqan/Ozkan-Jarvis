// Tüm izleyicileri birleştirir. Kaynak dostu: ekran/sekme gizliyken izleme yapmaz,
// pil için olay tabanlı dinleme ve 15 sn'lik seyrek yenileme kullanır.
import { useEffect } from "react";
import { kaliciDepo, useDepo } from "@/ortak/yardimci/kaliciDepo";
import { BATARYA_YOK, bataryaDinle, bataryaOku, type BataryaBilgisi } from "./BataryaIzleyici";
import { DEPOLAMA_YOK, depolamaOku, type DepolamaBilgisi } from "./DepolamaIzleyici";
import { BELLEK_YOK, bellekOku, type BellekBilgisi } from "./BellekIzleyici";
import { agDinle, agOku, gecikmeOlc, type AgBilgisi } from "./AgIzleyici";

export interface SistemDurumu {
  batarya: BataryaBilgisi;
  depolama: DepolamaBilgisi;
  bellek: BellekBilgisi;
  ag: AgBilgisi;
  gecikmeMs: number | null;
  guncelleme: number;
}

export const sistemDeposu = kaliciDepo<SistemDurumu>(
  "akrep.sistem",
  { batarya: BATARYA_YOK, depolama: DEPOLAMA_YOK, bellek: BELLEK_YOK, ag: agOku(), gecikmeMs: null, guncelleme: 0 },
  false,
);

const YENILEME_MS = 15000;

/** Hızlı (batarya hariç) alanları günceller. */
async function tazele(gecikmeyiOlc: boolean): Promise<void> {
  const [depolama, batarya] = await Promise.all([depolamaOku(), bataryaOku()]);
  const ag = agOku();
  const gecikme = gecikmeyiOlc && ag.cevrimici ? await gecikmeOlc() : null;
  sistemDeposu.ata((o) => ({
    batarya,
    depolama,
    bellek: bellekOku(),
    ag,
    gecikmeMs: ag.cevrimici ? (gecikmeyiOlc ? gecikme : o.gecikmeMs) : null,
    guncelleme: Date.now(),
  }));
}

/** Komutlar için anlık, taze durum (ör. "batarya durumu"). */
export async function anlikDurum(): Promise<SistemDurumu> {
  await tazele(false);
  return sistemDeposu.al();
}

export function izlemeBaslat(): () => void {
  let sayac = 0;
  const calistir = () => {
    if (document.hidden) return; // Ekran kapalı/sekme gizli: gereksiz izleme yok.
    tazele(sayac % 2 === 0).catch(() => {});
    sayac++;
  };
  calistir();
  const zamanlayici = setInterval(calistir, YENILEME_MS);
  const gorunurluk = () => {
    if (!document.hidden) calistir();
  };
  document.addEventListener("visibilitychange", gorunurluk);
  const bataryaDurdur = bataryaDinle((b) => sistemDeposu.ata((o) => ({ ...o, batarya: b })));
  const agDurdur = agDinle(() => {
    sistemDeposu.ata((o) => ({ ...o, ag: agOku(), gecikmeMs: navigator.onLine ? o.gecikmeMs : null }));
    if (navigator.onLine) gecikmeOlc().then((g) => sistemDeposu.ata((o) => ({ ...o, gecikmeMs: g })));
  });
  return () => {
    clearInterval(zamanlayici);
    document.removeEventListener("visibilitychange", gorunurluk);
    bataryaDurdur();
    agDurdur();
  };
}

/** Uygulama açıkken izlemeyi başlatan kanca. */
export function useSistemIzleme(): SistemDurumu {
  useEffect(() => izlemeBaslat(), []);
  return useDepo(sistemDeposu);
}
