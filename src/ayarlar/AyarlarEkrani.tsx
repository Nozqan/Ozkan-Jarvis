// Ayarlar: ses, görünüm/performans, yapay zekâ sağlayıcısı + güvenli API anahtarı, veri silme.
import { useState } from "react";
import { Anahtar } from "@/ortak/bilesenler/Anahtar";
import { HataKutusu } from "@/ortak/hata/HataKutusu";
import { ayarDeposu, ayarGuncelle, useAyarlar } from "@/veri/depo/AyarDeposu";
import { notlariTemizle } from "@/gorev_merkezi/NotYoneticisi";
import { arsivTemizle } from "@/veri/depo/ArsivDeposu";
import { sohbetTemizle } from "@/veri/depo/SohbetDeposu";
import { hatirlaticiDeposu } from "@/veri/depo/HatirlaticiDeposu";
import { hatirlaticiSil } from "@/gorev_merkezi/HatirlaticiYoneticisi";
import { cihazDurumuBildir } from "@/sistem_izleyici/CihazDurumu";
import { TurkceMetinSeslendirici } from "@/ses_motoru/TurkceMetinSeslendirici";
import { saglayiciOlustur } from "@/yapay_zeka/SaglayiciFabrikasi";
import { YerelKomutMotoru } from "@/yapay_zeka/YerelKomutMotoru";
import type { BaglantiDurumu, SaglayiciTuru, UygulamaHatasi } from "@/veri/model/tipler";
import { anahtarKaydet, anahtarSil, guvenliAnahtarlariTemizle, MASKELI_ANAHTAR, useAnahtarVar } from "./GuvenliAnahtarDeposu";
import { YedeklemePaneli } from "./YedeklemePaneli";

const OPENAI_MODELLERI = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"];
const GEMINI_MODELLERI = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-2.0-flash"];

function Bolum({ baslik, aktif = true, children }: { baslik: string; aktif?: boolean; children: React.ReactNode }) {
  if (!aktif) return null;
  return (
    <section className="cam p-3 sm:p-5" aria-label={baslik}>
      <h2 className="altin-yazi mb-2 px-2 text-lg font-bold">{baslik}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Kaydirici({ etiket, deger, min, max, adim, degisti }: { etiket: string; deger: number; min: number; max: number; adim: number; degisti: (v: number) => void }) {
  return (
    <label className="block px-3 py-2">
      <span className="flex justify-between text-sm"><span>{etiket}</span><span className="text-gunes tabular-nums">{deger.toFixed(2)}×</span></span>
      <input type="range" className="mt-2 w-full accent-[#FFC928]" min={min} max={max} step={adim} value={deger} onChange={(e) => degisti(Number(e.target.value))} />
    </label>
  );
}

export function AyarlarEkrani() {
  const a = useAyarlar();
  const [ayarArama, setAyarArama] = useState("");
  const openaiVar = useAnahtarVar("openai");
  const geminiVar = useAnahtarVar("gemini");
  const [anahtar, setAnahtar] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "uyari"; metin: string } | null>(null);
  const [hata, setHata] = useState<UygulamaHatasi | null>(null);
  const [test, setTest] = useState<BaglantiDurumu | null>(null);
  const [testte, setTestte] = useState(false);
  const [silOnay, setSilOnay] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const [ttsOrnek, setTtsOrnek] = useState("Merhaba Nebi, ben AKREP JARVIS. Sizi dinliyorum.");

  const aktifSaglayici = a.saglayici;
  const anahtarVar = aktifSaglayici === "openai" ? openaiVar : aktifSaglayici === "gemini" ? geminiVar : false;
  const harici = aktifSaglayici !== "yerel";

  const kaydet = async () => {
    setHata(null);
    setMesaj(null);
    const r = await anahtarKaydet(aktifSaglayici, anahtar);
    setAnahtar(""); // Düz metin anahtar ekranda/durumda tutulmaz.
    if (!r.basarili) return setHata(r.hata);
    setMesaj(
      r.deger.kalici
        ? { tur: "ok", metin: "Anahtar şifrelenerek kaydedildi (AES‑GCM, çıkarılamaz cihaz anahtarı)." }
        : { tur: "uyari", metin: "Güvenli depolama bu bağlamda kullanılamadı (HTTPS gerekli). Anahtar yalnızca bu oturumda bellekte tutulur, kalıcı kaydedilmedi." },
    );
  };

  const sil = async () => {
    await anahtarSil(aktifSaglayici);
    setMesaj({ tur: "ok", metin: "API anahtarı silindi." });
    setTest(null);
  };

  const baglantiTest = async () => {
    setTestte(true);
    setTest(null);
    const motor = new YerelKomutMotoru({ gezin: () => {}, cevrimiciMi: () => navigator.onLine, uygulamaOzeti: () => "" });
    const d = await saglayiciOlustur(a, motor).baglantiKontrolu();
    setTest(d);
    setTestte(false);
    cihazDurumuBildir({ yapayZeka: d });
  };

  const sesiDene = () => {
    if (!TurkceMetinSeslendirici.destekleniyor()) return setHata({ kod: "tts_yok", mesaj: "Bu tarayıcı sesli yanıtı desteklemiyor.", oneri: "Chrome veya Edge deneyin; yanıtlar ekranda metin olarak görünmeye devam eder.", tekrarDenenebilir: false });
    const t = new TurkceMetinSeslendirici();
    void t.konus(ttsOrnek.trim() || "AKREP JARVIS hazır.", { hiz: a.sesHizi, ton: a.sesTonu }, { bitti: () => t.yokEt() });
  };

  const veriSil = async (ne: string) => {
    if (silOnay !== ne) return setSilOnay(ne);
    setSiliniyor(true);
    setHata(null);
    if (ne === "hatirlaticilar" || ne === "hepsi") {
      try {
        await Promise.all(hatirlaticiDeposu.al().map((h) => hatirlaticiSil(h.id)));
      } catch {
        setHata({
          kod: "hatirlatici_silinmedi",
          mesaj: "Hatırlatıcı bildirimleri iptal edilemedi.",
          oneri: "Bildirim izinlerini kontrol edin ve tekrar deneyin.",
          tekrarDenenebilir: true,
        });
        setSiliniyor(false);
        return;
      }
    }
    if (ne === "hepsi") {
      try {
        await guvenliAnahtarlariTemizle();
      } catch (e) {
        setHata({
          kod: "guvenli_depo_silinmedi",
          mesaj: "API anahtarlarının güvenli deposu tamamen silinemedi.",
          oneri: e instanceof Error ? e.message : "Uygulamayı kapatıp tekrar deneyin.",
          tekrarDenenebilir: true,
        });
        setSiliniyor(false);
        return;
      }
    }
    if (ne === "notlar" || ne === "hepsi") notlariTemizle();
    if (ne === "arsiv" || ne === "hepsi") arsivTemizle();
    if (ne === "sohbet" || ne === "hepsi") sohbetTemizle();
    if (ne === "hepsi") ayarDeposu.sifirla();
    setSilOnay(null);
    setMesaj({ tur: "ok", metin: ne === "hepsi" ? "Tüm uygulama verileri, ayarlar ve API anahtarları silindi." : "Seçilen veriler silindi." });
    setSiliniyor(false);
  };

  const modeller = aktifSaglayici === "gemini" ? GEMINI_MODELLERI : OPENAI_MODELLERI;
  const testRenk = !test ? "#A9B3C7" : test.kod === "bagli" || test.kod === "yerel" ? "#54E38E" : test.kod === "kota" ? "#FFB547" : "#FF5E6C";
  const ayarEslesiyor = (metin: string) => {
    const aranan = ayarArama.toLocaleLowerCase("tr").trim();
    return !aranan || metin.toLocaleLowerCase("tr").includes(aranan);
  };

  return (
    <div className="mx-auto h-[100dvh] max-w-3xl space-y-4 overflow-y-auto overscroll-contain px-3 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
      <h1 className="altin-yazi text-xl font-extrabold sm:text-2xl">Ayarlar</h1>
      <label className="cam flex items-center gap-2 px-3 py-2">
        <span aria-hidden="true">🔎</span>
        <span className="sr-only">Ayarlarda ara</span>
        <input
          className="alan border-0 bg-transparent shadow-none"
          type="search"
          placeholder="Ayarlarda ara…"
          value={ayarArama}
          onChange={(e) => setAyarArama(e.target.value)}
        />
      </label>
      {ayarArama && (
        <p className="text-metin2 text-xs">Aranan: <b className="text-gunes">{ayarArama}</b>. Ses, performans, yapay zekâ, API anahtarı ve veri seçenekleri filtrelenebilir alanlardır.</p>
      )}
      {hata && <HataKutusu hata={hata} kapat={() => setHata(null)} />}
      {mesaj && (
        <div role="status" className="cam cam-oval anim-giris px-4 py-2 text-sm" style={{ color: mesaj.tur === "ok" ? "#54E38E" : "#FFB547" }}>
          {mesaj.metin}
        </div>
      )}

      <Bolum baslik="Ses ve iletişim" aktif={ayarEslesiyor("Ses iletişim konuşma sesli uyandırma hız tonu")}>
        <Anahtar acik={a.sesliYanit} degisti={(v) => ayarGuncelle({ sesliYanit: v })} etiket="Sesli yanıt" aciklama="Kapalıyken yanıtlar yalnızca ekranda akan metin olarak gösterilir." />
        <Anahtar acik={a.uyandirmaKelimesi} degisti={(v) => ayarGuncelle({ uyandirmaKelimesi: v })} etiket="Uyandırma kelimesi (“Jarvis” / “Akrep”)" aciklama="Açıkken dinleme sırasında yalnızca bu kelimelerle başlayan konuşmalar komut sayılır." />
        <p className="text-metin2 px-3 py-1 text-xs">Çevrimdışıyken tarayıcınız yerel konuşma tanımayı ve Türkçe dil paketini destekliyorsa sesli komutlar cihazda işlenir; desteklemiyorsa komutu metin kutusuna yazabilirsiniz.</p>
        <Anahtar acik={a.tamAcilis} degisti={(v) => ayarGuncelle({ tamAcilis: v })} etiket="Her açılışta tam animasyon" aciklama="Kapalıyken ilk açılıştan sonra daha kısa animasyon kullanılır." />
        <Kaydirici etiket="Konuşma hızı" deger={a.sesHizi} min={0.7} max={1.4} adim={0.05} degisti={(v) => ayarGuncelle({ sesHizi: v })} />
        <Kaydirici etiket="Ses tonu" deger={a.sesTonu} min={0.6} max={1.5} adim={0.05} degisti={(v) => ayarGuncelle({ sesTonu: v })} />
        <label className="block px-3 py-2">
          <span className="text-sm">Ses önizleme metni</span>
          <input className="alan mt-1" value={ttsOrnek} onChange={(e) => setTtsOrnek(e.target.value)} />
        </label>
        <div className="px-3 py-2"><button className="dugme" onClick={sesiDene}>🔊 Bu metni dinle</button></div>
      </Bolum>

      <Bolum baslik="Görünüm ve performans" aktif={ayarEslesiyor("Görünüm performans tema profil hareket büyük yazı yüksek kontrast renk")}>
        <label className="block px-3 py-2">
          <span className="text-sm">Kullanım profili</span>
          <select
            className="alan mt-1"
            value={a.kullanimProfili}
            onChange={(e) => {
              const kullanimProfili = e.target.value as typeof a.kullanimProfili;
              ayarGuncelle({
                kullanimProfili,
                performans: kullanimProfili === "performans" ? "yuksek" : "otomatik",
                hareketAzalt: kullanimProfili === "tasarruf",
              });
            }}
          >
            <option value="tasarruf">Tasarruf — daha az animasyon</option>
            <option value="dengeli">Dengeli — önerilen</option>
            <option value="performans">Performans — yüksek hedef</option>
          </select>
        </label>
        <label className="block px-3 py-2">
          <span className="text-sm">Performans profili</span>
          <select className="alan mt-1" value={a.performans} onChange={(e) => ayarGuncelle({ performans: e.target.value as typeof a.performans })}>
            <option value="otomatik">Otomatik</option>
            <option value="yuksek">Yüksek (120 FPS hedefi)</option>
          </select>
        </label>
        <Anahtar acik={a.hareketAzalt} degisti={(v) => ayarGuncelle({ hareketAzalt: v })} etiket="Animasyonları azalt" aciklama="Güneş HUD ve arayüz animasyonlarını azaltır. Cihazın erişilebilirlik tercihi de dikkate alınır." />
        <Anahtar acik={a.buyukYazi} degisti={(v) => ayarGuncelle({ buyukYazi: v })} etiket="Büyük yazı" aciklama="Uygulama metinlerini ve düğmeleri daha büyük, okunur boyutta gösterir." />
        <Anahtar acik={a.yuksekKontrast} degisti={(v) => ayarGuncelle({ yuksekKontrast: v })} etiket="Yüksek kontrast" aciklama="Metin ve cam sınırlarını daha belirgin hale getirir." />
        <label className="block px-3 py-2">
          <span className="text-sm">Tema vurgu rengi</span>
          <select className="alan mt-1" value={a.vurguRengi} onChange={(e) => ayarGuncelle({ vurguRengi: e.target.value as typeof a.vurguRengi })}>
            <option value="gunes">Altın güneş</option>
            <option value="yesil">Enerji yeşili</option>
            <option value="mavi">Bilgi mavisi</option>
          </select>
        </label>
        <div className="px-3 py-2">
          <div className="flex gap-2" aria-label="Tema önizlemesi">
            {(["gunes", "yesil", "mavi"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className="h-10 w-10 rounded-full border-2 border-white/30"
                style={{ background: r === "gunes" ? "#FFC928" : r === "yesil" ? "#54E38E" : "#67C7FF", boxShadow: a.vurguRengi === r ? `0 0 18px ${r === "gunes" ? "#FFC928" : r === "yesil" ? "#54E38E" : "#67C7FF"}` : "none" }}
                onClick={() => ayarGuncelle({ vurguRengi: r })}
                aria-label={`${r} vurgu rengini seç`}
              />
            ))}
          </div>
        </div>
      </Bolum>

      <Bolum baslik="Yapay zekâ sağlayıcısı" aktif={ayarEslesiyor("Yapay zekâ sağlayıcı OpenAI Gemini API anahtar model uç nokta")}>
        <label className="block px-3 py-2">
          <span className="text-sm">Sağlayıcı</span>
          <select
            className="alan mt-1"
            value={a.saglayici}
            onChange={(e) => {
              ayarGuncelle({ saglayici: e.target.value as SaglayiciTuru });
              setTest(null);
              setMesaj(null);
            }}
          >
            <option value="yerel">Yalnızca yerel komut motoru (internetsiz)</option>
            <option value="openai">OpenAI uyumlu API</option>
            <option value="gemini">Google Gemini API</option>
          </select>
        </label>

        <Anahtar
          acik={a.hariciVeriIzni}
          degisti={(v) => ayarGuncelle({ hariciVeriIzni: v })}
          etiket="Harici servislerde canlı bilgi ve yapay zekâ izni"
          aciklama="Açıkken açıkça istediğiniz hava durumu/arama sorgusu Open-Meteo veya Wikipedia'ya; yerelde çözülemeyen komut metni seçili yapay zekâ sağlayıcısına gönderilebilir. Kamera görüntüsü, mikrofon kaydı, not ve arşiv gönderilmez."
        />

        {harici ? (
          <>
            <label className="block px-3 py-2">
              <span className="text-sm">API uç noktası</span>
              <input
                className="alan mt-1"
                value={aktifSaglayici === "openai" ? a.openaiUcNokta : a.geminiUcNokta}
                onChange={(e) => ayarGuncelle(aktifSaglayici === "openai" ? { openaiUcNokta: e.target.value } : { geminiUcNokta: e.target.value })}
                autoCapitalize="none"
                spellCheck={false}
                inputMode="url"
              />
            </label>
            <label className="block px-3 py-2">
              <span className="text-sm">Model</span>
              <input
                className="alan mt-1"
                list="model-listesi"
                value={aktifSaglayici === "openai" ? a.openaiModel : a.geminiModel}
                onChange={(e) => ayarGuncelle(aktifSaglayici === "openai" ? { openaiModel: e.target.value } : { geminiModel: e.target.value })}
                autoCapitalize="none"
                spellCheck={false}
              />
              <datalist id="model-listesi">{modeller.map((m) => <option key={m} value={m} />)}</datalist>
            </label>

            <div className="px-3 py-2">
              <label htmlFor="api-anahtari" className="text-sm">API anahtarı</label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  id="api-anahtari"
                  className="alan min-w-0 flex-1 basis-48"
                  type="password"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={anahtarVar ? `${MASKELI_ANAHTAR} (kayıtlı)` : "Anahtarı yapıştırın"}
                  value={anahtar}
                  onChange={(e) => setAnahtar(e.target.value)}
                />
                <button className="dugme dugme-altin" onClick={() => void kaydet()} disabled={anahtar.trim().length < 8}>Kaydet</button>
                <button className="dugme dugme-kirmizi" onClick={() => void sil()} disabled={!anahtarVar}>Anahtarı sil</button>
              </div>
              <p className="text-metin2 mt-2 text-xs">
                Durum: <b className={anahtarVar ? "text-enerji-yesil" : "text-uyari"}>{anahtarVar ? "Anahtar kayıtlı (şifreli)" : "Anahtar yok"}</b>. Anahtar ekranda hiçbir zaman açık gösterilmez ve günlüklere yazılmaz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-3 py-2">
              <button className="dugme" onClick={() => void baglantiTest()} disabled={testte}>{testte ? "Test ediliyor…" : "🔌 Bağlantıyı test et"}</button>
              {test && (
                <span className="flex items-center gap-2 text-sm" style={{ color: testRenk }} role="status">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: testRenk, boxShadow: `0 0 8px ${testRenk}` }} />
                  {test.mesaj}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-metin2 px-3 py-2 text-sm">
            Yerel yapay zekâ modu seçili. Yerel komutlar cihazda kalır. Harici servis iznini açıp açıkça canlı hava durumu ya da Wikipedia araması istemeniz halinde yalnızca arama sorgusu ilgili servise gider.
          </p>
        )}
      </Bolum>

      <Bolum baslik="Veriler" aktif={ayarEslesiyor("Veri gizlilik sohbet not arşiv hatırlatıcı sil")}>
        <Anahtar acik={a.sohbetGecmisiniSakla} degisti={(v) => ayarGuncelle({ sohbetGecmisiniSakla: v })} etiket="Sohbet geçmişini cihazda sakla" aciklama="Kapalıyken konuşmalar kalıcı kaydedilmez." />
        <div className="flex flex-wrap gap-2 px-3 py-2">
          {[
            ["notlar", "Notları sil"],
            ["hatirlaticilar", "Hatırlatıcıları sil"],
            ["arsiv", "Tarama arşivini sil"],
            ["sohbet", "Sohbet geçmişini sil"],
            ["hepsi", "Tüm verileri sil"],
          ].map(([id, ad]) => (
            <button key={id} className={`dugme min-h-10 px-3 py-1 text-xs ${silOnay === id ? "dugme-kirmizi" : ""}`} onClick={() => void veriSil(id)} disabled={siliniyor}>
              {siliniyor && silOnay === id ? "Siliniyor…" : silOnay === id ? "Emin misiniz? Tekrar dokunun" : ad}
            </button>
          ))}
          {silOnay && <button className="dugme min-h-10 px-3 py-1 text-xs" onClick={() => setSilOnay(null)} disabled={siliniyor}>Vazgeç</button>}
        </div>
        <p className="text-metin2 px-3 text-xs">“Tüm verileri sil” ayarları ve kayıtlı API anahtarlarını da siler. Ayrı ayrı silme seçenekleri yalnızca seçilen veriyi etkiler.</p>
      </Bolum>

      <Bolum baslik="Yedekleme ve geri yükleme" aktif={ayarEslesiyor("Yedekleme geri yükleme dışa aktarma içe aktar parola")}>
        <YedeklemePaneli />
      </Bolum>

      <p className="text-metin2 pb-2 text-center text-xs">AKREP JARVIS · Geliştirici: Nebi Özkan</p>
    </div>
  );
}
