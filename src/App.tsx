// AKREP JARVIS — uygulama kökü: açılış animasyonu → ana HUD ve ekranlar arası gezinme.
// Geliştirici: Nebi Özkan
import { useCallback, useEffect, useState } from "react";
import { AnaHudEkrani } from "@/ana_hud/AnaHudEkrani";
import { useAnaHudViewModel } from "@/ana_hud/AnaHudViewModel";
import { AyarlarEkrani } from "@/ayarlar/AyarlarEkrani";
import { GizlilikEkrani } from "@/ayarlar/GizlilikEkrani";
import { useAnahtarVar } from "@/ayarlar/GuvenliAnahtarDeposu";
import { KameraEkrani } from "@/canli_kamera/KameraEkrani";
import { Gezinme } from "@/gezinme/Gezinme";
import type { GezinmeHedefi } from "@/gezinme/GezinmeTipleri";
import { GirisEkrani } from "@/giris_ekrani/GirisEkrani";
import { GorevMerkeziEkrani } from "@/gorev_merkezi/GorevMerkeziEkrani";
import { hatirlaticiDinleyiciAyarla, hatirlaticilariKur } from "@/gorev_merkezi/HatirlaticiYoneticisi";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";
import { AktiflikGostergesi } from "@/ortak/bilesenler/AktiflikGostergesi";
import { UzayArkaplani } from "@/ortak/bilesenler/UzayArkaplani";
import { HataSinirlayici } from "@/ortak/hata/HataSinirlayici";
import { cihazDurumuBildir } from "@/sistem_izleyici/CihazDurumu";
import { useAyarlar } from "@/veri/depo/AyarDeposu";
import type { Hatirlatici } from "@/veri/model/tipler";
import { yapayZekaDurumuHesapla } from "@/yapay_zeka/YapayZekaDurumu";

function Uygulama() {
  const [giris, setGiris] = useState(true);
  const [ekran, setEkran] = useState<GezinmeHedefi>("hud");
  const [kisitli, setKisitli] = useState(false);
  const [uyari, setUyari] = useState<{ h: Hatirlatici; kacirildi: boolean } | null>(null);
  const ayar = useAyarlar();
  const perf = usePerformans();
  const openaiVar = useAnahtarVar("openai");
  const geminiVar = useAnahtarVar("gemini");

  const gezin = useCallback((h: GezinmeHedefi) => setEkran(h), []);
  const vm = useAnaHudViewModel(gezin);
  const { duyur } = vm;

  // Performans ve erişilebilirlik sınıfları
  useEffect(() => {
    const k = document.documentElement.classList;
    k.toggle("dusuk-performans", perf.seviye === "dusuk");
    k.toggle("hareket-azalt", perf.hareketAzalt);
  }, [perf.seviye, perf.hareketAzalt]);

  // Yapay zekâ bağlantı durumu (monitörde görünür)
  useEffect(() => {
    const anahtarVar = ayar.saglayici === "openai" ? openaiVar : ayar.saglayici === "gemini" ? geminiVar : false;
    cihazDurumuBildir({ yapayZeka: yapayZekaDurumuHesapla(ayar, anahtarVar, vm.cevrimici) });
  }, [ayar, openaiVar, geminiVar, vm.cevrimici]);

  // Hatırlatıcılar: açılışta kur, tetiklenince sesli + ekranda bildir
  useEffect(() => {
    hatirlaticiDinleyiciAyarla((h, kacirildi) => {
      setUyari({ h, kacirildi });
      duyur(`${kacirildi ? "Kaçırılan hatırlatıcı" : "Hatırlatıcı"}: ${h.metin}`);
    });
    hatirlaticilariKur();
    return () => hatirlaticiDinleyiciAyarla(null);
  }, [duyur]);

  const girisBitti = useCallback((asama: "hazir" | "kisitli" | "hata") => {
    setKisitli(asama !== "hazir");
    setGiris(false);
  }, []);

  const hudDinlemeyiDurdur = useCallback(() => {
    if (vm.dinliyor) void vm.dinlemeDegistir();
  }, [vm]);

  return (
    <div className="relative min-h-screen text-metin">
      <UzayArkaplani />
      {giris ? (
        <GirisEkrani bitti={girisBitti} />
      ) : (
        <div className="relative z-10 anim-giris">
          <AktiflikGostergesi />
          {kisitli && ekran === "hud" && (
            <div className="cam-ince mx-auto mt-14 max-w-3xl px-4 py-2 text-center text-xs text-uyari">
              Kısıtlı mod: bu tarayıcıda bazı özellikler (konuşma, kamera veya güvenli depolama) sınırlı olabilir. Metinle komut girmeye devam edebilirsiniz.
            </div>
          )}
          {uyari && (
            <div role="alert" className="cam anim-giris fixed top-[max(3.2rem,env(safe-area-inset-top))] left-1/2 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center justify-between gap-3 px-4 py-3" style={{ borderRadius: 28, borderColor: "rgba(255,227,106,0.7)" }}>
              <p className="min-w-0 text-sm break-words">
                <b className="text-gunes">⏰ {uyari.kacirildi ? "Kaçırılan hatırlatıcı" : "Hatırlatıcı"}</b>
                <br />
                {uyari.h.metin}
              </p>
              <button className="dugme min-h-9 shrink-0 px-3 py-1 text-xs" onClick={() => setUyari(null)}>Tamam</button>
            </div>
          )}
          <main>
            <HataSinirlayici ad="Bu ekran" key={ekran}>
              {ekran === "hud" && <AnaHudEkrani vm={vm} gezin={gezin} />}
              {ekran === "kamera" && <KameraEkrani />}
              {ekran === "gorev" && <GorevMerkeziEkrani hudDinlemeyiDurdur={hudDinlemeyiDurdur} />}
              {ekran === "ayarlar" && <AyarlarEkrani gizlilikAc={() => setEkran("gizlilik")} acilisiOynat={() => setGiris(true)} />}
              {ekran === "gizlilik" && <GizlilikEkrani />}
            </HataSinirlayici>
          </main>
          <Gezinme aktif={ekran} gezin={gezin} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HataSinirlayici ad="AKREP JARVIS">
      <Uygulama />
    </HataSinirlayici>
  );
}
