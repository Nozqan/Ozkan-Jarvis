// Ana HUD iş mantığı: ses akışı + komut yönlendirme + HUD durumu.
// Akış: Mikrofon → konuşmadan metne → (uyandırma kelimesi) → komut yönlendirme → yanıt → Türkçe TTS → HUD durumu.
// Ekranlar donanıma doğrudan erişmez; her şey bu sınıf ve alt servisler üzerinden yapılır.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hata as hataOlustur } from "@/ortak/hata/hataYardimcilari";
import { sesGorsellestirici } from "@/gunes_hud/SesGorsellestirici";
import { MikrofonYoneticisi } from "@/ses_motoru/MikrofonYoneticisi";
import { KonusmaTaniyici } from "@/ses_motoru/KonusmaTaniyici";
import { TurkceMetinSeslendirici } from "@/ses_motoru/TurkceMetinSeslendirici";
import { uyandirmaAyikla } from "@/ses_motoru/UyandirmaKelimesi";
import { YerelKomutMotoru, type KomutBaglami } from "@/yapay_zeka/YerelKomutMotoru";
import { KomutYonlendirici } from "@/yapay_zeka/KomutYonlendirici";
import { cihazDurumDeposu, DONANIM_ETIKET } from "@/sistem_izleyici/CihazDurumu";
import { ayarDeposu } from "@/veri/depo/AyarDeposu";
import { sohbetEkle } from "@/veri/depo/SohbetDeposu";
import { yeniKimlik } from "@/ortak/yardimci/yardimcilar";
import { profilAyari, otomatikSeviye } from "@/ortak/animasyonlar/PerformansProfili";
import type { GezinmeHedefi } from "@/gezinme/GezinmeTipleri";
import type { HudDurumu, SohbetMesaji, UygulamaHatasi } from "@/veri/model/tipler";

type TemelDurum = "hazir" | "dusunuyor" | "konusuyor";

export interface AnaHudViewModel {
  hudDurumu: HudDurumu;
  dinliyor: boolean;
  araMetin: string;
  mesajlar: SohbetMesaji[];
  sonYanit: string;
  hata: UygulamaHatasi | null;
  cevrimici: boolean;
  uyanikBekliyor: boolean;
  sesTaniyiciVar: boolean;
  komutGonder: (metin: string, kaynak?: "yazi" | "ses") => Promise<void>;
  dinlemeDegistir: () => Promise<void>;
  yanitiDurdur: () => void;
  hatayiKapat: () => void;
  duyur: (metin: string) => void;
  mesajlariTemizle: () => void;
}

export function useAnaHudViewModel(gezin: (h: GezinmeHedefi) => void): AnaHudViewModel {
  const [temel, setTemel] = useState<TemelDurum>("hazir");
  const [dinliyor, setDinliyor] = useState(false);
  const [araMetin, setAraMetin] = useState("");
  const [mesajlar, setMesajlar] = useState<SohbetMesaji[]>([]);
  const [sonYanit, setSonYanit] = useState("");
  const [hata, setHata] = useState<UygulamaHatasi | null>(null);
  const [hataAktif, setHataAktif] = useState(false);
  const [cevrimici, setCevrimici] = useState(() => navigator.onLine);
  const [uyanikBekliyor, setUyanikBekliyor] = useState(false);

  const gezinRef = useRef(gezin);
  const mesajRef = useRef<SohbetMesaji[]>([]);
  const isleniyor = useRef(false);
  const uyanikBitis = useRef(0);
  const dinliyorRef = useRef(false);
  const konusmaNo = useRef(0);
  const hataZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sesIsleRef = useRef<(m: string) => void>(() => {});

  useEffect(() => {
    gezinRef.current = gezin;
  }, [gezin]);

  const mikrofon = useMemo(() => new MikrofonYoneticisi(), []);
  const seslendirici = useMemo(() => new TurkceMetinSeslendirici(), []);

  const baglam = useMemo<KomutBaglami>(
    () => ({
      gezin: (h) => gezinRef.current(h),
      cevrimiciMi: () => navigator.onLine,
      uygulamaOzeti: () => {
        const c = cihazDurumDeposu.al();
        const a = ayarDeposu.al();
        const seviye = a.performans === "otomatik" ? otomatikSeviye() : a.performans;
        return (
          `AKREP JARVIS çalışıyor. ${navigator.onLine ? "Çevrimiçi" : "Çevrimdışı yerel komut modu"}. ` +
          `Mikrofon: ${DONANIM_ETIKET[c.mikrofon]}. Kamera: ${DONANIM_ETIKET[c.kamera]}. ` +
          `Yapay zekâ: ${c.yapayZeka.mesaj}. Performans profili: ${profilAyari(seviye, false).seviye}.`
        );
      },
    }),
    [],
  );
  const motor = useMemo(() => new YerelKomutMotoru(baglam), [baglam]);
  const yonlendirici = useMemo(
    () =>
      new KomutYonlendirici(
        motor,
        () => ayarDeposu.al(),
        () => navigator.onLine,
        () => mesajRef.current.slice(-8).map((m) => ({ rol: m.rol, metin: m.metin })),
      ),
    [motor],
  );

  const mesajEkle = useCallback((rol: SohbetMesaji["rol"], metin: string, kaynak?: SohbetMesaji["kaynak"]) => {
    const m: SohbetMesaji = { id: yeniKimlik(), rol, metin, tarih: Date.now(), kaynak };
    mesajRef.current = [...mesajRef.current, m].slice(-60);
    setMesajlar(mesajRef.current);
    if (ayarDeposu.al().sohbetGecmisiniSakla) sohbetEkle({ rol, metin, kaynak });
  }, []);

  const hatayiGoster = useCallback((h: UygulamaHatasi) => {
    setHata(h);
    setHataAktif(true);
    if (hataZaman.current) clearTimeout(hataZaman.current);
    hataZaman.current = setTimeout(() => setHataAktif(false), 2600); // kısa kırmızı uyarı halkası
  }, []);

  const bosaDon = useCallback(() => {
    isleniyor.current = false;
    setTemel("hazir");
  }, []);

  const yanitVer = useCallback(
    (metin: string, kaynak: SohbetMesaji["kaynak"]) => {
      mesajEkle("jarvis", metin, kaynak);
      setSonYanit(metin);
      const ayar = ayarDeposu.al();
      if (ayar.sesliYanit && TurkceMetinSeslendirici.destekleniyor()) {
        const no = ++konusmaNo.current;
        const bitir = () => {
          if (konusmaNo.current !== no) return;
          bosaDon();
          if (dinliyorRef.current) taniyici.current?.surdur();
        };
        setTemel("konusuyor");
        taniyici.current?.duraklat();
        seslendirici.konus(metin, { hiz: ayar.sesHizi, ton: ayar.sesTonu }, { bitti: bitir });
        // Güvenlik ağı: TTS hiç başlamazsa (otomatik oynatma kısıtı vb.) HUD takılı kalmasın.
        setTimeout(() => {
          if (konusmaNo.current === no && !seslendirici.aktif) bitir();
        }, 3500);
        setTimeout(() => {
          if (konusmaNo.current === no) bitir();
        }, 4000 + (metin.length * 110) / Math.max(0.5, ayar.sesHizi));
      } else {
        bosaDon();
      }
    },
    [mesajEkle, bosaDon, seslendirici],
  );

  const komutGonder = useCallback(
    async (ham: string, kaynak: "yazi" | "ses" = "yazi") => {
      const metin = ham.trim();
      if (!metin || isleniyor.current) return;
      isleniyor.current = true;
      seslendirici.durdur();
      konusmaNo.current++;
      setHata(null);
      setAraMetin("");
      setTemel("dusunuyor");
      mesajEkle("kullanici", metin);
      void kaynak;
      try {
        const s = await yonlendirici.yonlendir(metin);
        if (s.hata) hatayiGoster(s.hata);
        if (s.gezinti) gezinRef.current(s.gezinti);
        yanitVer(s.metin, s.kaynak);
      } catch {
        const h = hataOlustur("komut_hatasi", "Komut işlenirken bir sorun oluştu.", "Tekrar deneyin. Sorun sürerse uygulamayı yenileyin.");
        hatayiGoster(h);
        yanitVer(`${h.mesaj} ${h.oneri}`, "sistem");
      }
    },
    [yonlendirici, mesajEkle, hatayiGoster, yanitVer, seslendirici],
  );

  // Konuşma tanıyıcı (geri çağrılar güncel işlevlere ref ile bağlanır)
  const taniyici = useRef<KonusmaTaniyici | null>(null);
  useEffect(() => {
    taniyici.current = new KonusmaTaniyici({
      araSonuc: (m) => setAraMetin(m),
      sonuc: (m) => sesIsleRef.current(m),
      hata: (h, kalici) => {
        hatayiGoster(h);
        if (kalici) {
          dinliyorRef.current = false;
          setDinliyor(false);
          mikrofon.durdur();
        }
      },
      dinlemeDurumu: (aktif) => {
        dinliyorRef.current = aktif;
        setDinliyor(aktif);
        if (!aktif) {
          setAraMetin("");
          setUyanikBekliyor(false);
          mikrofon.durdur();
        }
      },
    });
    return () => {
      taniyici.current?.durdur();
      taniyici.current = null;
    };
  }, [hatayiGoster, mikrofon]);

  // Uyandırma kelimesi ve sesli komut işleme
  useEffect(() => {
    sesIsleRef.current = (metin: string) => {
      setAraMetin("");
      if (isleniyor.current) return;
      const ayar = ayarDeposu.al();
      let komut = metin;
      if (ayar.uyandirmaKelimesi) {
        const u = uyandirmaAyikla(metin);
        const uyanik = Date.now() < uyanikBitis.current;
        if (u.bulundu) {
          komut = u.komut;
          if (!komut) {
            uyanikBitis.current = Date.now() + 8000;
            isleniyor.current = true;
            mesajEkle("kullanici", metin);
            yanitVer("Dinliyorum.", "sistem");
            return;
          }
        } else if (!uyanik) {
          return; // Uyandırma kelimesi yok: konuşma yok sayılır, saklanmaz.
        }
        uyanikBitis.current = 0;
      }
      void komutGonder(komut, "ses");
    };
  }, [komutGonder, mesajEkle, yanitVer]);

  // "Uyandırma kelimesi bekleniyor" göstergesi
  useEffect(() => {
    setUyanikBekliyor(dinliyor && ayarDeposu.al().uyandirmaKelimesi);
  }, [dinliyor]);

  // Çevrimiçi/çevrimdışı takibi
  useEffect(() => {
    const a = () => setCevrimici(true);
    const k = () => setCevrimici(false);
    window.addEventListener("online", a);
    window.addEventListener("offline", k);
    return () => {
      window.removeEventListener("online", a);
      window.removeEventListener("offline", k);
    };
  }, []);

  const dinlemeyiKapat = useCallback(() => {
    taniyici.current?.durdur();
    mikrofon.durdur();
    dinliyorRef.current = false;
    setDinliyor(false);
  }, [mikrofon]);

  // Ekran/sekme gizlenince mikrofon ve TTS kaynaklarını serbest bırak.
  useEffect(() => {
    const f = () => {
      if (document.hidden) {
        seslendirici.durdur();
        konusmaNo.current++;
        if (dinliyorRef.current) dinlemeyiKapat();
        setTemel((t) => (t === "konusuyor" ? "hazir" : t));
        if (!isleniyor.current) return;
        if (isleniyor.current) isleniyor.current = false;
      }
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [seslendirici, dinlemeyiKapat]);

  useEffect(
    () => () => {
      seslendirici.yokEt();
      mikrofon.durdur();
      if (hataZaman.current) clearTimeout(hataZaman.current);
    },
    [seslendirici, mikrofon],
  );

  const dinlemeDegistir = useCallback(async () => {
    if (dinliyorRef.current) {
      dinlemeyiKapat();
      return;
    }
    if (!KonusmaTaniyici.destekleniyor()) {
      hatayiGoster(
        hataOlustur("konusma_desteklenmiyor", "Bu tarayıcı konuşma tanımayı desteklemiyor.", "Chrome veya Edge kullanın ya da komutu metin kutusuna yazın.", false),
      );
      return;
    }
    setHata(null);
    seslendirici.durdur();
    konusmaNo.current++;
    setTemel("hazir");
    isleniyor.current = false;
    // Android'de konuşma tanıma ile eşzamanlı mikrofon analizi çakışabildiği için seviye analizi yalnızca masaüstünde yapılır.
    const analizEt = !/Android/i.test(navigator.userAgent);
    const r = await mikrofon.baslat(analizEt);
    if (!r.basarili) {
      hatayiGoster(r.hata);
      return;
    }
    taniyici.current?.baslat();
  }, [dinlemeyiKapat, hatayiGoster, mikrofon, seslendirici]);

  const yanitiDurdur = useCallback(() => {
    seslendirici.durdur();
    konusmaNo.current++;
    bosaDon();
    if (dinliyorRef.current) taniyici.current?.surdur();
    sesGorsellestirici.sifirla();
  }, [seslendirici, bosaDon]);

  const duyur = useCallback(
    (metin: string) => {
      if (isleniyor.current) {
        mesajEkle("jarvis", metin, "sistem");
        return;
      }
      isleniyor.current = true;
      yanitVer(metin, "sistem");
    },
    [mesajEkle, yanitVer],
  );

  const hudDurumu: HudDurumu = hataAktif
    ? "hata"
    : temel === "konusuyor"
      ? "konusuyor"
      : temel === "dusunuyor"
        ? "dusunuyor"
        : dinliyor
          ? "dinliyor"
          : !cevrimici
            ? "cevrimdisi"
            : "hazir";

  return {
    hudDurumu,
    dinliyor,
    araMetin,
    mesajlar,
    sonYanit,
    hata,
    cevrimici,
    uyanikBekliyor,
    sesTaniyiciVar: KonusmaTaniyici.destekleniyor(),
    komutGonder,
    dinlemeDegistir,
    yanitiDurdur,
    hatayiKapat: () => setHata(null),
    duyur,
    mesajlariTemizle: () => {
      mesajRef.current = [];
      setMesajlar([]);
      setSonYanit("");
    },
  };
}
