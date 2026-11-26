// Animasyonlu açılış ekranı. Tam sürüm ~4,6 sn; sonraki açılışlarda ~2,8 sn (ayarlardan tam animasyon açılabilir).
// Sistem kontrolü yerel ve hızlıdır; ağ çağrısı açılışı bloke etmez.
import { useEffect, useRef, useState } from "react";
import { AkrepAmblemi } from "@/ortak/bilesenler/AkrepAmblemi";
import { aralik, yumusat } from "@/ortak/animasyonlar/Zamanlama";
import { ayarGuncelle, ayarDeposu } from "@/veri/depo/AyarDeposu";
import { GirisKanvasi } from "./GirisAnimasyonlari";
import { GIRIS_ETIKETLERI, sistemKontroluYap, type GirisAsamasi, type KontrolSonucu } from "./GirisDurumu";

const NORMAL_SURE = 4.6;

interface Props {
  bitti: (asama: "hazir" | "kisitli" | "hata") => void;
}

function boyutHesapla() {
  return Math.max(120, Math.min(window.innerWidth * 0.5, window.innerHeight * 0.26, 250));
}

export function GirisEkrani({ bitti }: Props) {
  const zaman = useRef(0);
  const [t, setT] = useState(0);
  const [kontrol, setKontrol] = useState<KontrolSonucu | null>(null);
  const [kapaniyor, setKapaniyor] = useState(false);
  const [boyut, setBoyut] = useState(boyutHesapla);
  const [hataBekliyor, setHataBekliyor] = useState(false);
  const bitirildi = useRef(false);

  // Tam/kısa animasyon seçimi açılışta bir kez yapılır.
  const [tam] = useState(() => {
    const a = ayarDeposu.al();
    return a.tamAcilis || !a.acilisGorulduMu;
  });
  const toplam = tam ? NORMAL_SURE : 2.8;
  const hizCarpani = NORMAL_SURE / toplam;
  const bittiRef = useRef(bitti);
  useEffect(() => {
    bittiRef.current = bitti;
  }, [bitti]);

  useEffect(() => {
    const f = () => setBoyut(boyutHesapla());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const kontrolEt = () => {
    setKontrol(null);
    setHataBekliyor(false);
    sistemKontroluYap().then(setKontrol);
  };

  useEffect(() => {
    kontrolEt();
  }, []);

  useEffect(() => {
    let raf = 0;
    let son = performance.now();
    const kare = (simdi: number) => {
      raf = requestAnimationFrame(kare);
      const dt = Math.min(0.05, (simdi - son) / 1000);
      son = simdi;
      zaman.current += dt * hizCarpani;
      setT(zaman.current);
    };
    raf = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(raf);
  }, [hizCarpani]);

  // Süre dolunca ve kontrol bitince geçiş yap.
  useEffect(() => {
    if (bitirildi.current || t < NORMAL_SURE || !kontrol) return;
    if (kontrol.asama === "hata") {
      if (!hataBekliyor) setHataBekliyor(true);
      return;
    }
    bitirildi.current = true;
    setKapaniyor(true);
    ayarGuncelle({ acilisGorulduMu: true });
    const asama = kontrol.asama;
    setTimeout(() => bittiRef.current(asama), 550); // Bilerek temizlenmez: geçiş mutlaka tamamlanmalı.
  }, [t, kontrol, hataBekliyor]);

  const devamEt = () => {
    bitirildi.current = true;
    setKapaniyor(true);
    ayarGuncelle({ acilisGorulduMu: true });
    setTimeout(() => bittiRef.current("hata"), 450);
  };

  let asama: GirisAsamasi = "aciliyor";
  if (t >= 1.8) asama = "sistem_kontrolu";
  if (t >= 3.9 && kontrol) asama = kontrol.asama;

  const emblemOpak = yumusat(aralik(t, 0.3, 1.3)) * (1 - 0.65 * yumusat(aralik(t, 1.7, 2.6)));
  const emblemOlcek = 1 - 0.12 * yumusat(aralik(t, 1.5, 2.5));
  const baslik = yumusat(aralik(t, 2.4, 3.1));
  const imza = yumusat(aralik(t, 3.1, 3.7));
  const MERKEZ_Y = 0.36;
  const renkAsama = asama === "hata" ? "#FF5E6C" : asama === "kisitli" ? "#FFB547" : asama === "hazir" ? "#54E38E" : "#FFC928";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0b1224 0%, #050812 70%)", opacity: kapaniyor ? 0 : 1, transition: "opacity 0.55s ease", pointerEvents: kapaniyor ? "none" : "auto" }}
    >
      <GirisKanvasi zaman={zaman} merkezY={MERKEZ_Y} boyut={boyut} />

      {/* Amblem */}
      <div
        className="absolute left-1/2"
        style={{ top: `${MERKEZ_Y * 100}%`, width: boyut * 1.1, height: boyut * 1.1, transform: `translate(-50%,-50%) scale(${emblemOlcek})`, opacity: emblemOpak }}
      >
        <AkrepAmblemi cizim={aralik(t, 0.35, 1.6)} className="h-full w-full" />
      </div>

      {/* Başlık ve imza */}
      <div className="absolute inset-x-0 px-4 text-center" style={{ top: `calc(${MERKEZ_Y * 100}% + ${boyut * 1.0}px)` }}>
        <h1
          className="altin-yazi text-[clamp(1.6rem,7vw,3.2rem)] font-extrabold break-words"
          style={{ opacity: baslik, letterSpacing: `${0.4 - 0.22 * baslik}em`, transform: `translateY(${(1 - baslik) * 14}px)`, textShadow: "0 0 30px rgba(255,201,40,0.4)" }}
        >
          AKREP JARVIS
        </h1>
        <p className="text-metin2 mt-2 text-[clamp(0.85rem,3.2vw,1.1rem)]" style={{ opacity: imza, transform: `translateY(${(1 - imza) * 8}px)` }}>
          Geliştirici: Nebi Özkan
        </p>
      </div>

      {/* Durum göstergesi */}
      <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3 px-4">
        {hataBekliyor ? (
          <div className="cam anim-giris max-w-md p-4 text-center" style={{ borderColor: "rgba(255,94,108,0.55)" }}>
            <p className="text-hata font-semibold">Sistem kontrolü tamamlanamadı.</p>
            <p className="text-metin2 mt-1 text-sm">Uygulama sınırlı çalışabilir. Tekrar deneyebilir veya yine de devam edebilirsiniz.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button className="dugme dugme-altin" onClick={kontrolEt}>Tekrar dene</button>
              <button className="dugme" onClick={devamEt}>Yine de devam et</button>
            </div>
          </div>
        ) : (
          <>
            <div className="cam cam-oval flex max-w-full items-center gap-2 px-4 py-2 text-sm" role="status" aria-live="polite">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${asama === "hazir" ? "" : "anim-nabiz"}`} style={{ background: renkAsama, boxShadow: `0 0 10px ${renkAsama}` }} />
              <span style={{ color: renkAsama }} className="font-semibold">{GIRIS_ETIKETLERI[asama]}</span>
            </div>
            {asama === "kisitli" && kontrol && (
              <div className="cam-ince max-w-md px-4 py-2 text-center text-xs text-uyari">{kontrol.eksikler.join(" · ")}</div>
            )}
            <div className="h-1.5 w-48 max-w-[60vw] overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (t / NORMAL_SURE) * 100)}%`, background: "linear-gradient(90deg,#FF4D38,#FFC928,#54E38E)" }} />
            </div>
            {t > 1 && (
              <button
                className="dugme min-h-9 px-4 py-1 text-xs opacity-70"
                onClick={() => {
                  zaman.current = Math.max(zaman.current, NORMAL_SURE);
                }}
              >
                Atla
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
