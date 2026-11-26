// Ana HUD: ortada Güneş çekirdeği, köşelerde sistem göstergeleri, altta sesli/yazılı komut paneli.
import { useEffect, useRef, useState } from "react";
import { GunesHud, HUD_ETIKETLERI } from "@/gunes_hud/GunesHud";
import { AgKarti, BataryaKarti, DepolamaKarti, DurumKarti } from "@/sistem_izleyici/SistemPaneli";
import { useSistemIzleme } from "@/sistem_izleyici/SistemIzleyici";
import { HataKutusu } from "@/ortak/hata/HataKutusu";
import { saatMetni } from "@/ortak/yardimci/yardimcilar";
import type { GezinmeHedefi } from "@/gezinme/GezinmeTipleri";
import type { HudDurumu } from "@/veri/model/tipler";
import { AkanMetin } from "./AkanMetin";
import type { AnaHudViewModel } from "./AnaHudViewModel";
import { useAyarlar } from "@/veri/depo/AyarDeposu";

const DURUM_RENK: Record<HudDurumu, string> = {
  hazir: "#FFC928",
  dinliyor: "#54E38E",
  dusunuyor: "#FFE36A",
  konusuyor: "#FF4D38",
  hata: "#FF5E6C",
  cevrimdisi: "#67C7FF",
};

interface Props {
  vm: AnaHudViewModel;
  gezin: (h: GezinmeHedefi) => void;
}

export function AnaHudEkrani({ vm, gezin }: Props) {
  const sistem = useSistemIzleme();
  const ayar = useAyarlar();
  const [giris, setGiris] = useState("");
  const [saat, setSaat] = useState(() => Date.now());
  const [havaMetni, setHavaMetni] = useState("Konum yok");
  const [havaYukleniyor, setHavaYukleniyor] = useState(false);
  const [komutZinciriCalisiyor, setKomutZinciriCalisiyor] = useState(false);
  const panikTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meşgul = vm.hudDurumu === "dusunuyor";

  useEffect(() => {
    const z = setInterval(() => setSaat(Date.now()), 1000);
    return () => {
      clearInterval(z);
      if (panikTimer.current) clearTimeout(panikTimer.current);
    };
  }, []);

  const konumHavasiniTazele = () => {
    if (!ayar.hariciVeriIzni) {
      setHavaMetni("Konum izni kapalı");
      return;
    }
    if (!navigator.onLine) {
      setHavaMetni("Çevrimdışı");
      return;
    }
    if (!navigator.geolocation) {
      setHavaMetni("Konum desteklenmiyor");
      return;
    }
    setHavaYukleniyor(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&timezone=auto`;
          const yanit = await fetch(url);
          if (!yanit.ok) throw new Error("hava_alinamadi");
          const veri = await yanit.json();
          const derece = Math.round(veri.current?.temperature_2m ?? 0);
          setHavaMetni(`${derece}°C · Konumda`);
        } catch {
          setHavaMetni("Hava alınamadı");
        } finally {
          setHavaYukleniyor(false);
        }
      },
      () => {
        setHavaMetni("Konum reddedildi");
        setHavaYukleniyor(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15 * 60 * 1000 },
    );
  };

  const gonder = (e?: React.FormEvent) => {
    e?.preventDefault();
    const m = giris.trim();
    if (!m) return;
    setGiris("");
    void vm.komutGonder(m, "yazi");
  };

  const hizliKomutlar = [
    { ikon: "🔋", metin: "Batarya durumu" },
    { ikon: "💾", metin: "Depolama durumu" },
    { ikon: "📷", metin: "Kamerayı aç" },
  ];

  const komutZinciriCalistir = async () => {
    if (komutZinciriCalisiyor) return;
    setKomutZinciriCalisiyor(true);
    for (const metin of ["Batarya durumu", "Depolama durumu", "Ağ durumu"]) {
      await vm.komutGonder(metin, "yazi");
    }
    setKomutZinciriCalisiyor(false);
  };

  const panikBaslat = () => {
    if (panikTimer.current) clearTimeout(panikTimer.current);
    panikTimer.current = setTimeout(() => {
      void vm.dinlemeDegistir();
      gezin("gizlilik");
    }, 900);
  };

  const panikBirak = () => {
    if (panikTimer.current) clearTimeout(panikTimer.current);
  };

  const renk = DURUM_RENK[vm.hudDurumu];
  const sesHatasi = vm.hata && /konusma|mikrofon|dil_/.test(vm.hata.kod);

  return (
    <div className="hud-screen mx-auto flex h-[100dvh] max-w-6xl flex-col overflow-hidden px-3 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
      <header className="hud-header mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="altin-yazi text-xl font-extrabold tracking-[0.12em] sm:text-2xl">AKREP JARVIS</h1>
          <p className="text-metin2 text-xs">Geliştirici: Nebi Özkan</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="cam cam-oval px-3 py-1.5 text-xs font-medium" onClick={konumHavasiniTazele} disabled={havaYukleniyor} aria-label="Konum ve hava durumunu yenile">
            {havaYukleniyor ? "Hava alınıyor…" : `☁️ ${havaMetni}`}
          </button>
          <div className="cam cam-oval px-3 py-1.5 text-xs font-medium tabular-nums">
            {new Date(saat).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · {saatMetni(saat)}
          </div>
        </div>
      </header>

      <div className="hud-durum-grid grid min-h-0 flex-1 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] lg:grid-rows-2">
        <BataryaKarti d={sistem} className="hud-card order-1 lg:order-none lg:col-start-1 lg:row-start-1" />
        <AgKarti d={sistem} className="hud-card order-2 lg:order-none lg:col-start-3 lg:row-start-1" />

        <div className="hud-center order-3 col-span-2 flex flex-col items-center lg:order-none lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-center">
          <div className="aspect-square w-full max-w-[min(100%,460px)] sm:max-w-[460px]">
            <GunesHud durum={vm.hudDurumu} />
          </div>
          <div
            className="cam cam-oval -mt-2 flex max-w-full items-center gap-2 px-4 py-2 text-sm font-semibold"
            style={{ color: renk, borderColor: `${renk}88`, boxShadow: `0 0 22px ${renk}33` }}
            role="status"
            aria-live="polite"
          >
            <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${vm.hudDurumu === "hazir" ? "" : "anim-nabiz"}`} style={{ background: renk, boxShadow: `0 0 10px ${renk}` }} />
            <span className="break-words">{HUD_ETIKETLERI[vm.hudDurumu]}</span>
          </div>
          {!vm.cevrimici && vm.hudDurumu !== "cevrimdisi" && (
            <p className="text-bilgi mt-2 text-xs">Çevrimdışı yerel komut modu</p>
          )}
        </div>

        <DepolamaKarti d={sistem} className="hud-card order-4 lg:order-none lg:col-start-1 lg:row-start-2" />
        <DurumKarti className="hud-card order-5 lg:order-none lg:col-start-3 lg:row-start-2" />
      </div>

      {/* Komut paneli */}
      <section className="hud-command cam mt-4 p-3 sm:p-5" aria-label="Komut paneli">
        <div className="mb-2 flex items-center gap-2 overflow-hidden" aria-label="Hızlı komutlar">
          {hizliKomutlar.map((k) => (
            <button key={k.metin} type="button" className="dugme min-h-9 shrink-0 px-3 py-1 text-xs" onClick={() => void vm.komutGonder(k.metin, "yazi")}>
              {k.ikon} {k.metin}
            </button>
          ))}
          <button type="button" className="dugme min-h-9 shrink-0 px-3 py-1 text-xs" disabled={komutZinciriCalisiyor} onClick={() => void komutZinciriCalistir()}>
            {komutZinciriCalisiyor ? "Zincir çalışıyor…" : "⚡ Komut zinciri"}
          </button>
        </div>
        <div className="hud-command-message min-h-[3.5rem]">
          {vm.araMetin ? (
            <div className="flex items-center gap-2" aria-live="polite">
              <div className="flex h-7 items-end gap-0.5" aria-hidden="true">
                {[45, 70, 100, 55, 85, 40].map((h, i) => (
                  <span key={i} className="anim-nabiz w-1 rounded-full bg-enerji-yesil" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
                ))}
              </div>
              <p className="text-enerji-yesil min-w-0 text-base italic break-words">🎙 {vm.araMetin}…</p>
            </div>
          ) : vm.sonYanit ? (
            <AkanMetin metin={vm.sonYanit} />
          ) : (
            <p className="text-metin2 text-sm">
              {vm.dinliyor
                ? vm.uyanikBekliyor
                  ? "Uyandırma kelimesi bekleniyor: “Jarvis” veya “Akrep” deyin."
                  : "Dinliyorum… Komutunuzu söyleyin."
                : "Mikrofon düğmesine bir kez dokunun ve konuşun ya da komutu yazın. Örnek: “Feneri aç”, “Batarya durumu”, “25 çarpı 4”, “Not al süt ekmek”."}
            </p>
          )}
        </div>

        {vm.hata && (
          <div className="mt-3">
            <HataKutusu
              hata={vm.hata}
              tekrarDene={sesHatasi ? () => void vm.dinlemeDegistir() : undefined}
              ayarlaraGit={vm.hata.kod === "anahtar_gecersiz" || vm.hata.kod === "anahtar_yok" || vm.hata.kod === "model_yok" ? () => gezin("ayarlar") : undefined}
              kapat={vm.hatayiKapat}
            />
            {sesHatasi && <p className="text-uyari mt-2 text-xs">Tekrar deneyin veya komutu aşağıdaki metin kutusuna yazın.</p>}
          </div>
        )}

        <form onSubmit={gonder} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="komut-girisi">Komut</label>
          <input
            id="komut-girisi"
            className="alan min-w-0 flex-1 basis-48"
            placeholder="Komut yazın…"
            value={giris}
            onChange={(e) => setGiris(e.target.value)}
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" className="dugme dugme-altin" disabled={!giris.trim() || meşgul}>
            Gönder
          </button>
          <button
            type="button"
            onClick={() => void vm.dinlemeDegistir()}
            onPointerDown={panikBaslat}
            onPointerUp={panikBirak}
            onPointerCancel={panikBirak}
            onPointerLeave={panikBirak}
            className={`dugme ${vm.dinliyor ? "dugme-kirmizi" : "dugme-yesil"}`}
            aria-pressed={vm.dinliyor}
            title={vm.sesTaniyiciVar ? undefined : "Bu tarayıcı konuşma tanımayı desteklemiyor"}
          >
            <span aria-hidden="true">{vm.dinliyor ? "⏹" : "🎙"}</span>
            {vm.dinliyor ? "Dinlemeyi durdur" : "Dinlemeyi başlat"}
          </button>
          {vm.hudDurumu === "konusuyor" && (
            <button type="button" className="dugme" onClick={vm.yanitiDurdur}>
              Sesi sustur
            </button>
          )}
          <button type="button" className="dugme dugme-altin" onClick={() => gezin("kamera")}>📷 Kamera</button>
        </form>

        {vm.mesajlar.length > 0 && (
          <details className="hud-history mt-3">
            <summary className="text-metin2 inline-block cursor-pointer rounded-full px-3 py-1 text-xs hover:text-gunes">Konuşma geçmişi ({vm.mesajlar.length})</summary>
            <div className="mt-2 max-h-64 space-y-2 overflow-hidden pr-1">
              {vm.mesajlar.map((m) => (
                <div key={m.id} className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[88%] rounded-3xl px-4 py-2 text-sm break-words"
                    style={
                      m.rol === "kullanici"
                        ? { background: "rgba(255,201,40,0.14)", border: "1px solid rgba(255,201,40,0.3)" }
                        : { background: "rgba(103,199,255,0.1)", border: "1px solid rgba(103,199,255,0.25)" }
                    }
                  >
                    {m.metin}
                    {m.kaynak && m.rol === "jarvis" && (
                      <span className="text-metin2 mt-1 block text-[0.65rem]">
                        {m.kaynak === "yerel" ? "Yerel komut" : m.kaynak === "yapay_zeka" ? "Yapay zekâ" : "Sistem"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="dugme mt-2 min-h-9 px-3 py-1 text-xs" onClick={vm.mesajlariTemizle}>Geçmişi temizle</button>
          </details>
        )}
      </section>
    </div>
  );
}
