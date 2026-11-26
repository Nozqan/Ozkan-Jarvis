// Kamera ekranı iş mantığı: kamera yaşam döngüsü, OCR, nesne tanıma, ortam analizi, jest algılama ve arşivleme.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arsivle } from "@/veri/depo/ArsivDeposu";
import { saatMetni, yeniKimlik } from "@/ortak/yardimci/yardimcilar";
import { hata as hataOlustur } from "@/ortak/hata/hataYardimcilari";
import type { ArsivTuru, UygulamaHatasi } from "@/veri/model/tipler";
import { KameraYoneticisi, type KameraDurumu, type KameraYuzu } from "./KameraYoneticisi";
import { metinOku, metinTarayiciKapat } from "./MetinTarayici";
import { nesneleriTani } from "./NesneAnalizcisi";
import { ortamiAnalizEt, parlaklikOlc } from "./OrtamAnalizcisi";
import { jestAlgila, jestHazirla, jestKapat } from "./JestAlgilayici";

export interface TaramaKarti {
  id: string;
  tur: ArsivTuru;
  baslik: string;
  metin: string;
  tarih: number;
  kaydedildi: boolean;
}

/** Hedef kilitleme kutusu (video piksel koordinatlarında). */
export interface Kilit {
  x: number;
  y: number;
  w: number;
  h: number;
  etiket: string;
  renk: string;
}

export interface Metrik {
  genislik: number | null;
  yukseklik: number | null;
  fps: number | null;
  parlaklik: number | null;
}

export function useKameraViewModel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const yonetici = useMemo(() => new KameraYoneticisi(), []);
  const [durum, setDurum] = useState<KameraDurumu>("kapali");
  const [hata, setHata] = useState<UygulamaHatasi | null>(null);
  const [kartlar, setKartlar] = useState<TaramaKarti[]>([]);
  const [kilitler, setKilitler] = useState<Kilit[]>([]);
  const [ilerleme, setIlerleme] = useState<{ oran: number; metin: string } | null>(null);
  const [jestAktif, setJestAktif] = useState(false);
  const [jestYukleniyor, setJestYukleniyor] = useState(false);
  const [jestAdi, setJestAdi] = useState<string | null>(null);
  const [yuz, setYuz] = useState<KameraYuzu>("environment");
  const [metrik, setMetrik] = useState<Metrik>({ genislik: null, yukseklik: null, fps: null, parlaklik: null });
  const [gunluk, setGunluk] = useState<string[]>([]);
  const [meşgul, setMeşgul] = useState(false);

  const kilitZamani = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jestDongusu = useRef<ReturnType<typeof setInterval> | null>(null);
  const kareSayaci = useRef(0);
  const sonJestKarti = useRef<string | null>(null);
  const jestKararlilik = useRef({ ad: "", sayi: 0 });

  const gunlukEkle = useCallback((m: string) => setGunluk((g) => [`${saatMetni(Date.now())}  ${m}`, ...g].slice(0, 6)), []);

  const jestiDurdur = useCallback(() => {
    if (jestDongusu.current) clearInterval(jestDongusu.current);
    jestDongusu.current = null;
    setJestAktif(false);
    setJestAdi(null);
    setKilitler((k) => k.filter((x) => x.renk !== "#54E38E"));
  }, []);

  const kapat = useCallback(() => {
    jestiDurdur();
    yonetici.kapat();
    setKilitler([]);
    setIlerleme(null);
    setMetrik({ genislik: null, yukseklik: null, fps: null, parlaklik: null });
    setDurum("kapali");
    void metinTarayiciKapat();
    jestKapat();
  }, [yonetici, jestiDurdur]);

  const ac = useCallback(
    async (istenenYuz?: KameraYuzu) => {
      const video = videoRef.current;
      if (!video) return;
      const y = istenenYuz ?? yuz;
      setHata(null);
      setDurum("izin_bekleniyor");
      const r = await yonetici.ac(video, y);
      if (!r.basarili) {
        setHata(r.hata);
        setDurum(r.hata.kod === "kamera_izin_yok" ? "izin_bekleniyor" : "basarisiz");
        return;
      }
      setYuz(y);
      setDurum("hazir");
      setMetrik((m) => ({ ...m, genislik: r.deger.genislik, yukseklik: r.deger.yukseklik }));
      gunlukEkle(`Kamera açıldı ${r.deger.genislik}×${r.deger.yukseklik}`);
    },
    [yonetici, yuz, gunlukEkle],
  );

  const cevir = useCallback(() => {
    jestiDurdur();
    void ac(yuz === "environment" ? "user" : "environment");
  }, [ac, yuz, jestiDurdur]);

  // Canlı veri: gerçek kare hızı ve parlaklık (kare saklanmaz)
  useEffect(() => {
    if (durum === "kapali" || durum === "izin_bekleniyor") return;
    const video = videoRef.current;
    if (!video) return;
    let iptal = false;
    const v = video as unknown as { requestVideoFrameCallback?: (f: () => void) => number; cancelVideoFrameCallback?: (n: number) => void };
    let id = 0;
    const say = () => {
      kareSayaci.current++;
      if (!iptal) id = v.requestVideoFrameCallback!(say);
    };
    if (v.requestVideoFrameCallback) id = v.requestVideoFrameCallback(say);
    const ara = document.createElement("canvas");
    let son = performance.now();
    const z = setInterval(() => {
      const simdi = performance.now();
      const fps = v.requestVideoFrameCallback ? Math.round((kareSayaci.current * 1000) / (simdi - son)) : null;
      kareSayaci.current = 0;
      son = simdi;
      setMetrik((m) => ({ ...m, fps, parlaklik: parlaklikOlc(video, ara), genislik: video.videoWidth || m.genislik, yukseklik: video.videoHeight || m.yukseklik }));
    }, 1000);
    return () => {
      iptal = true;
      clearInterval(z);
      if (v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(id);
    };
  }, [durum === "kapali" || durum === "izin_bekleniyor"]); // eslint-disable-line react-hooks/exhaustive-deps

  const kilitleriGoster = useCallback((liste: Kilit[], ms = 9000) => {
    setKilitler((onceki) => [...onceki.filter((k) => k.renk === "#54E38E"), ...liste]);
    if (kilitZamani.current) clearTimeout(kilitZamani.current);
    kilitZamani.current = setTimeout(() => setKilitler((k) => k.filter((x) => x.renk === "#54E38E")), ms);
  }, []);

  const kartEkle = useCallback((tur: ArsivTuru, baslik: string, metin: string) => {
    setKartlar((k) => [{ id: yeniKimlik(), tur, baslik, metin, tarih: Date.now(), kaydedildi: false }, ...k].slice(0, 30));
  }, []);

  const kareAl = useCallback((): HTMLCanvasElement | null => {
    if (!yonetici.acik) {
      setHata(hataOlustur("kamera_kapali", "Kamera kapalı.", "Önce kamerayı başlatın."));
      return null;
    }
    const k = yonetici.kareYakala();
    if (!k) {
      setHata(hataOlustur("kare_yok", "Kamera görüntüsü henüz hazır değil.", "Birkaç saniye bekleyip tekrar deneyin."));
      setDurum("basarisiz");
    }
    return k;
  }, [yonetici]);

  const islemBasarisiz = useCallback(
    (h: UygulamaHatasi) => {
      setHata(h);
      setDurum("basarisiz");
      gunlukEkle(`Başarısız: ${h.mesaj}`);
    },
    [gunlukEkle],
  );

  const metinOkuEylemi = useCallback(async () => {
    if (meşgul) return;
    const kare = kareAl();
    if (!kare) return;
    setMeşgul(true);
    setHata(null);
    setDurum("metin_analiz");
    setIlerleme({ oran: 0, metin: "Motor hazırlanıyor" });
    gunlukEkle("Metin analizi başladı");
    const r = await metinOku(kare, (p, d) => setIlerleme({ oran: p, metin: d === "recognizing text" ? "Metin okunuyor" : "Türkçe dil verisi hazırlanıyor" }));
    setIlerleme(null);
    setMeşgul(false);
    if (!r.basarili) return islemBasarisiz(r.hata);
    const oran = (videoRef.current?.videoWidth ?? kare.width) / kare.width;
    kilitleriGoster(
      r.deger.kelimeler.slice(0, 60).map((k) => ({ x: k.x0 * oran, y: k.y0 * oran, w: (k.x1 - k.x0) * oran, h: (k.y1 - k.y0) * oran, etiket: "", renk: "#FFC928" })),
    );
    kartEkle("ocr", `Metin okuma · güven %${r.deger.guven}`, r.deger.metin);
    gunlukEkle(`Metin okundu (${r.deger.metin.length} karakter)`);
    setDurum("sonuc_hazir");
  }, [meşgul, kareAl, kilitleriGoster, kartEkle, gunlukEkle, islemBasarisiz]);

  const nesneTaniEylemi = useCallback(async () => {
    if (meşgul) return;
    const kare = kareAl();
    if (!kare) return;
    setMeşgul(true);
    setHata(null);
    setDurum("nesne_analiz");
    setIlerleme({ oran: 0, metin: "Model hazırlanıyor (ilk kullanımda indirilir)" });
    gunlukEkle("Nesne analizi başladı");
    const r = await nesneleriTani(kare);
    setIlerleme(null);
    setMeşgul(false);
    if (!r.basarili) return islemBasarisiz(r.hata);
    const oran = (videoRef.current?.videoWidth ?? kare.width) / kare.width;
    kilitleriGoster(r.deger.map((n) => ({ x: n.x * oran, y: n.y * oran, w: n.w * oran, h: n.h * oran, etiket: `${n.ad} %${n.guven}`, renk: "#FF4D38" })));
    kartEkle("nesne", `Nesne tanıma · ${r.deger.length} nesne`, r.deger.map((n) => `${n.ad} (%${n.guven})`).join(", "));
    gunlukEkle(`${r.deger.length} nesne tanındı`);
    setDurum("sonuc_hazir");
  }, [meşgul, kareAl, kilitleriGoster, kartEkle, gunlukEkle, islemBasarisiz]);

  const ortamAnalizEylemi = useCallback(() => {
    const kare = kareAl();
    if (!kare) return;
    setHata(null);
    const r = ortamiAnalizEt(kare);
    kartEkle("ortam", "Ortam analizi", r.aciklama);
    gunlukEkle("Ortam analizi tamamlandı");
    setDurum("sonuc_hazir");
  }, [kareAl, kartEkle, gunlukEkle]);

  const jestDegistir = useCallback(async () => {
    if (jestAktif) {
      jestiDurdur();
      return;
    }
    if (!yonetici.acik) {
      setHata(hataOlustur("kamera_kapali", "Kamera kapalı.", "Önce kamerayı başlatın."));
      return;
    }
    setHata(null);
    setJestYukleniyor(true);
    setIlerleme({ oran: 0, metin: "Jest modeli hazırlanıyor (ilk kullanımda indirilir)" });
    const r = await jestHazirla();
    setIlerleme(null);
    setJestYukleniyor(false);
    if (!r.basarili) return islemBasarisiz(r.hata);
    setJestAktif(true);
    gunlukEkle("Jest algılama açıldı");
    jestDongusu.current = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      const s = jestAlgila(v);
      if (!s) return;
      setKilitler((onceki) => {
        const digerleri = onceki.filter((k) => k.renk !== "#54E38E");
        return s.kutu ? [...digerleri, { ...s.kutu, etiket: s.ad ? `${s.ad} %${s.guven}` : "El", renk: "#54E38E" }] : digerleri;
      });
      setJestAdi(s.ad);
      // Aynı jest ~5 ardışık karede görülürse kararlı kabul edip kart ekle.
      const k = jestKararlilik.current;
      if (s.ad && s.ad === k.ad) k.sayi++;
      else {
        k.ad = s.ad ?? "";
        k.sayi = s.ad ? 1 : 0;
      }
      if (s.ad && k.sayi === 5 && sonJestKarti.current !== s.ad) {
        sonJestKarti.current = s.ad;
        kartEkle("jest", "Jest algılandı", `${s.ad} (güven %${s.guven})`);
        gunlukEkle(`Jest: ${s.ad}`);
      }
      if (!s.ad && k.sayi === 0) sonJestKarti.current = null;
    }, 130);
  }, [jestAktif, jestiDurdur, yonetici, islemBasarisiz, gunlukEkle, kartEkle]);

  const arsivleEylemi = useCallback((id: string) => {
    setKartlar((liste) => {
      const k = liste.find((x) => x.id === id);
      if (k && !k.kaydedildi) arsivle({ tur: k.tur, baslik: k.baslik, metin: k.metin });
      return liste.map((x) => (x.id === id ? { ...x, kaydedildi: true } : x));
    });
  }, []);

  const kartSil = useCallback((id: string) => setKartlar((l) => l.filter((x) => x.id !== id)), []);

  // Ekran açılınca: izin zaten verilmişse otomatik başlat; değilse kullanıcıdan açık onay bekle.
  useEffect(() => {
    let iptal = false;
    const perm = navigator.permissions?.query?.({ name: "camera" as PermissionName });
    perm
      ?.then((p) => {
        if (!iptal && p.state === "granted") void ac();
      })
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sekme gizlenince/ekran kapanınca ve ekrandan çıkınca kamera serbest bırakılır.
  useEffect(() => {
    const f = () => {
      if (document.hidden && yonetici.acik) kapat();
    };
    document.addEventListener("visibilitychange", f);
    return () => {
      document.removeEventListener("visibilitychange", f);
      if (kilitZamani.current) clearTimeout(kilitZamani.current);
      jestiDurdur();
      yonetici.kapat();
      void metinTarayiciKapat();
      jestKapat();
    };
  }, [yonetici, kapat, jestiDurdur]);

  return {
    videoRef,
    durum,
    hata,
    kartlar,
    kilitler,
    ilerleme,
    jestAktif,
    jestYukleniyor,
    jestAdi,
    yuz,
    metrik,
    gunluk,
    meşgul,
    ac,
    kapat,
    cevir,
    metinOku: metinOkuEylemi,
    nesneTani: nesneTaniEylemi,
    ortamAnaliz: ortamAnalizEylemi,
    jestDegistir,
    arsivle: arsivleEylemi,
    kartSil,
    hatayiKapat: () => setHata(null),
  };
}

export type KameraViewModel = ReturnType<typeof useKameraViewModel>;
