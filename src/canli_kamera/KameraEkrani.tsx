// Canlı kamera tarama ekranı: gerçek kamera + HUD katmanları + OCR / nesne / ortam / jest işlevleri + sonuç kartları.
import { useEffect, useState } from "react";
import { HataKutusu } from "@/ortak/hata/HataKutusu";
import { saatMetni, tarihSaat } from "@/ortak/yardimci/yardimcilar";
import { KameraHudKatmani } from "./KameraHudKatmani";
import { izinAyarlariniAc, KAMERA_ETIKETLERI, KameraYoneticisi, type KameraDurumu } from "./KameraYoneticisi";
import { useKameraViewModel } from "./KameraViewModel";
import type { UygulamaHatasi } from "@/veri/model/tipler";

const DURUM_RENK: Record<KameraDurumu, string> = {
  kapali: "#A9B3C7",
  izin_bekleniyor: "#FFB547",
  hazirlaniyor: "#FFB547",
  hazir: "#54E38E",
  metin_analiz: "#FFE36A",
  nesne_analiz: "#FF4D38",
  kod_analiz: "#67C7FF",
  sonuc_hazir: "#54E38E",
  basarisiz: "#FF5E6C",
};

const TUR_ETIKET = { ocr: "Metin", nesne: "Nesne", ortam: "Ortam", jest: "Jest", kod: "QR / barkod" } as const;

export function KameraEkrani() {
  const vm = useKameraViewModel();
  const [simdi, setSimdi] = useState(() => Date.now());
  const [ayarHatasi, setAyarHatasi] = useState<UygulamaHatasi | null>(null);
  const [kopyalandi, setKopyalandi] = useState<string | null>(null);
  const [kopyalamaHatasi, setKopyalamaHatasi] = useState<string | null>(null);

  useEffect(() => {
    const z = setInterval(() => setSimdi(Date.now()), 1000);
    return () => clearInterval(z);
  }, []);

  const acik = vm.metrik.genislik !== null;
  const analizde = vm.durum === "metin_analiz" || vm.durum === "nesne_analiz" || vm.durum === "kod_analiz";
  const renk = DURUM_RENK[vm.durum];
  const izinPaneli = vm.durum === "izin_bekleniyor" && vm.hata?.kod === "kamera_izin_yok";
  const desteklenmiyor = !KameraYoneticisi.destekleniyor();
  const sonKart = vm.kartlar[0];
  const kopyala = async (id: string, metin: string) => {
    setKopyalamaHatasi(null);
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(id);
      setTimeout(() => setKopyalandi(null), 1800);
    } catch {
      setKopyalamaHatasi("Panoya kopyalanamadı. Metni seçip elle kopyalayabilirsiniz.");
    }
  };

  return (
    <div className="camera-screen mx-auto flex h-[100dvh] max-w-4xl flex-col overflow-hidden px-3 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
      <header className="camera-header mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="altin-yazi text-xl font-extrabold sm:text-2xl">Canlı Kamera Tarama</h1>
        <div className="cam cam-oval flex items-center gap-2 px-3 py-1.5 text-xs font-semibold" style={{ color: renk, borderColor: `${renk}88` }} role="status" aria-live="polite">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${analizde ? "anim-nabiz" : ""}`} style={{ background: renk, boxShadow: `0 0 10px ${renk}` }} />
          {KAMERA_ETIKETLERI[vm.durum]}
        </div>
      </header>

      {/* Önizleme + HUD */}
      <div className="camera-preview cam relative mx-auto w-full max-w-3xl shrink overflow-hidden" style={{ borderRadius: 32, padding: 0 }}>
        <video ref={vm.videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted aria-label="Canlı kamera önizlemesi" style={{ background: "#050812" }} />
        <KameraHudKatmani videoRef={vm.videoRef} kilitler={vm.kilitler} analizde={analizde || vm.jestYukleniyor} aktif={acik} />

        {acik && (
          <>
            <div className="cam cam-oval absolute top-3 right-3 px-3 py-1 text-[0.7rem] font-medium tabular-nums">
              {new Date(simdi).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })} · {saatMetni(simdi)}
            </div>
            <div className="cam-ince absolute bottom-3 left-3 max-w-[62%] px-3 py-2 text-[0.68rem] leading-snug sm:max-w-[48%]" style={{ background: "rgba(5,8,18,0.62)" }} aria-label="Canlı veri akışı">
              <p className="text-gunes font-semibold tabular-nums">
                {vm.metrik.genislik}×{vm.metrik.yukseklik} · {vm.metrik.fps != null ? `${vm.metrik.fps} kare/sn` : "kare hızı: Kullanılamıyor"} · ışık {vm.metrik.parlaklik != null ? `%${vm.metrik.parlaklik}` : "—"}
              </p>
              {vm.jestAktif && <p className="text-enerji-yesil">El: {vm.jestAdi ?? "jest yok"}</p>}
              <p className="text-metin2">Hedef: {vm.kilitler.filter((k) => k.etiket).length}</p>
              {vm.gunluk.slice(0, 3).map((g, i) => (
                <p key={g + i} className="text-metin2 truncate" style={{ opacity: 1 - i * 0.25 }}>
                  {g}
                </p>
              ))}
            </div>
          </>
        )}

        {vm.ilerleme && (
          <div className="cam absolute top-14 left-1/2 w-[80%] max-w-sm -translate-x-1/2 px-4 py-3 text-center text-xs">
            <p className="text-gunes font-semibold">{vm.ilerleme.metin}…</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${Math.max(6, vm.ilerleme.oran * 100)}%`, background: "linear-gradient(90deg,#FF4D38,#FFC928)", transition: "width .3s" }} />
            </div>
          </div>
        )}

        {acik && sonKart && !analizde && (
          <div className="cam absolute right-3 bottom-3 hidden max-w-[44%] p-3 text-xs sm:block" style={{ borderRadius: 22 }}>
            <p className="text-altin font-semibold">{sonKart.baslik}</p>
            <p className="text-metin mt-1 line-clamp-4 break-words whitespace-pre-line">{sonKart.metin}</p>
          </div>
        )}

        {/* Kamera kapalı / izin paneli */}
        {!acik && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {desteklenmiyor ? (
              <div className="cam max-w-sm p-5 text-center">
                <p className="text-hata font-semibold">Bu tarayıcı kamera erişimini desteklemiyor.</p>
                <p className="text-metin2 mt-2 text-sm">Chrome ile HTTPS üzerinden açın. Bu arada ana ekrandan metinle komut verebilirsiniz.</p>
              </div>
            ) : izinPaneli ? (
              <div className="cam max-w-sm p-5 text-center" role="alertdialog" aria-labelledby="izin-baslik">
                <p id="izin-baslik" className="text-uyari font-semibold">Kamera izni gerekiyor</p>
                <p className="text-metin2 mt-2 text-sm">
                  Metin okuma, nesne tanıma ve ortam analizi için kamera görüntüsüne ihtiyaç var. Görüntü cihazınızda işlenir; kaydedilmez ve gönderilmez.
                </p>
                <p className="text-metin2 mt-2 text-xs">{vm.hata?.oneri}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button className="dugme dugme-altin" onClick={() => void vm.ac()}>Tekrar dene</button>
                  <button
                    className="dugme"
                    onClick={() => {
                      const r = izinAyarlariniAc();
                      setAyarHatasi(r.basarili ? null : r.hata);
                    }}
                  >
                    Sistem ayarlarını aç
                  </button>
                </div>
                {ayarHatasi && <p className="text-metin2 mt-3 text-xs">{ayarHatasi.mesaj} {ayarHatasi.oneri}</p>}
              </div>
            ) : (
              <div className="cam max-w-sm p-5 text-center">
                <p className="text-lg font-bold">Kamera kapalı</p>
                <p className="text-metin2 mt-2 text-sm">
                  Kamera yalnızca siz başlattığınızda açılır ve ekrandan çıkınca ya da ekran kapanınca otomatik kapanır.
                </p>
                <button className="dugme dugme-altin mt-4" onClick={() => void vm.ac()} disabled={vm.durum === "izin_bekleniyor"}>
                  {vm.durum === "izin_bekleniyor" ? "İzin bekleniyor…" : "📷 Kamerayı başlat"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Denetimler */}
      <div className="camera-controls mt-3 flex shrink-0 flex-wrap items-center justify-center gap-2" role="group" aria-label="Tarama denetimleri">
        <button className="dugme dugme-altin" onClick={() => void vm.metinOku()} disabled={!acik || vm.meşgul}>📄 Metin oku</button>
        <button className="dugme dugme-altin" onClick={() => void vm.nesneTani()} disabled={!acik || vm.meşgul}>🎯 Nesne tanı</button>
        <button className="dugme dugme-altin" onClick={() => void vm.kodTani()} disabled={!acik || vm.meşgul}>▦ QR / barkod</button>
        <button className="dugme" onClick={vm.ortamAnaliz} disabled={!acik || vm.meşgul}>🌗 Ortam analizi</button>
        <button className={`dugme ${vm.jestAktif ? "dugme-yesil" : ""}`} onClick={() => void vm.jestDegistir()} disabled={!acik || vm.jestYukleniyor} aria-pressed={vm.jestAktif}>
          ✋ Jest {vm.jestAktif ? "açık" : "algıla"}
        </button>
        <button className="dugme" onClick={vm.cevir} disabled={!acik || vm.meşgul}>🔄 Kamerayı çevir</button>
        {acik && <button className="dugme dugme-kirmizi" onClick={vm.kapat}>⏹ Kamerayı kapat</button>}
      </div>

      {vm.hata && !izinPaneli && (
        <div className="camera-error mt-3">
          <HataKutusu hata={vm.hata} tekrarDene={() => (acik ? undefined : void vm.ac())} kapat={vm.hatayiKapat} />
        </div>
      )}

      {/* Sonuç kartları */}
      <section className="camera-results mt-5 min-h-0 flex-1 overflow-hidden" aria-label="Tarama sonuçları">
        <h2 className="mb-2 text-lg font-bold">Sonuçlar</h2>
        {vm.kartlar.length === 0 ? (
          <div className="camera-empty cam-ince p-3 text-center text-xs text-metin2">
            Henüz sonuç yok. Kamerayı başlatıp “Metin oku”, “Nesne tanı” veya “Ortam analizi” düğmelerinden birine dokunun.
          </div>
        ) : (
          <ul className="camera-result-list max-h-full space-y-3 overflow-hidden">
            {vm.kartlar.map((k) => (
              <li key={k.id} className="cam anim-giris p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-altin min-w-0 font-semibold break-words">
                    <span className="cam-oval mr-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-metin">{TUR_ETIKET[k.tur]}</span>
                    {k.baslik}
                  </p>
                  <span className="text-metin2 text-xs">{tarihSaat(k.tarih)}</span>
                </div>
                <p className="camera-result-copy text-metin mt-2 text-sm break-words whitespace-pre-wrap">{k.metin}</p>
                <div className="camera-result-actions mt-2 flex flex-wrap gap-2">
                  <button className={`dugme min-h-9 px-3 py-1 text-xs ${k.kaydedildi ? "dugme-yesil" : "dugme-altin"}`} onClick={() => vm.arsivle(k.id)} disabled={k.kaydedildi}>
                    {k.kaydedildi ? "✓ Arşive kaydedildi" : "Arşive kaydet"}
                  </button>
                  <button className="dugme min-h-9 px-3 py-1 text-xs" onClick={() => void kopyala(k.id, k.metin)}>
                    {kopyalandi === k.id ? "Kopyalandı ✓" : "Kopyala"}
                  </button>
                  <button className="dugme min-h-9 px-3 py-1 text-xs" onClick={() => vm.kartSil(k.id)}>Kartı kaldır</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {kopyalamaHatasi && <p className="text-uyari mt-1 text-xs" role="status">{kopyalamaHatasi}</p>}
      </section>
    </div>
  );
}
