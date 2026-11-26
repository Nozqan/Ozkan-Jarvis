// Hatırlatıcılar: oluşturma, listeleme, silme; alarm uygulamasına yönlendirme; bildirim izni açıklaması.
import { useEffect, useState } from "react";
import { useDepo } from "@/ortak/yardimci/kaliciDepo";
import { hatirlaticiDeposu } from "@/veri/depo/HatirlaticiDeposu";
import { tarihSaat } from "@/ortak/yardimci/yardimcilar";
import { HataKutusu } from "@/ortak/hata/HataKutusu";
import type { UygulamaHatasi } from "@/veri/model/tipler";
import { alarmUygulamasiniAc, bildirimDurumu, hatirlaticiOlustur, hatirlaticiSil, sureyiMsYap, type BildirimDurumu } from "./HatirlaticiYoneticisi";

function kalanMetin(ms: number): string {
  if (ms <= 0) return "şimdi";
  const dk = Math.round(ms / 60000);
  if (dk < 1) return `${Math.round(ms / 1000)} sn sonra`;
  if (dk < 60) return `${dk} dk sonra`;
  const s = Math.floor(dk / 60);
  return s < 24 ? `${s} sa ${dk % 60} dk sonra` : `${Math.floor(s / 24)} gün sonra`;
}

function yerelDatetime(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export function HatirlaticilarPaneli() {
  const liste = useDepo(hatirlaticiDeposu);
  const [metin, setMetin] = useState("");
  const [zaman, setZaman] = useState(() => yerelDatetime(Date.now() + 10 * 60000));
  const [hata, setHata] = useState<UygulamaHatasi | null>(null);
  const [bilgi, setBilgi] = useState("");
  const [bildirim, setBildirim] = useState<BildirimDurumu>(() => bildirimDurumu());
  const [, tik] = useState(0);

  useEffect(() => {
    const z = setInterval(() => tik((n) => n + 1), 15000);
    return () => clearInterval(z);
  }, []);

  const olustur = async (hedef: number) => {
    setHata(null);
    setBilgi("");
    const r = await hatirlaticiOlustur(metin, hedef);
    setBildirim(bildirimDurumu());
    if (!r.basarili) return setHata(r.hata);
    setMetin("");
    setBilgi(`Hatırlatıcı kuruldu: ${tarihSaat(r.deger.hatirlatici.zaman)}`);
  };

  const bekleyen = liste.filter((h) => !h.tamamlandi);
  const biten = liste.filter((h) => h.tamamlandi);

  return (
    <div className="space-y-3">
      <div className="cam p-3 sm:p-4">
        <label htmlFor="hat-metin" className="text-metin2 mb-1 block text-xs font-semibold">Ne hatırlatılsın?</label>
        <input id="hat-metin" className="alan" placeholder="Örn. İlaç saati" value={metin} onChange={(e) => setMetin(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {[5, 15, 30, 60].map((dk) => (
            <button key={dk} className="dugme min-h-9 px-3 py-1 text-xs" disabled={!metin.trim()} onClick={() => void olustur(Date.now() + sureyiMsYap(dk, "dakika"))}>
              {dk === 60 ? "1 saat" : `${dk} dk`} sonra
            </button>
          ))}
        </div>
        <label htmlFor="hat-zaman" className="text-metin2 mt-3 mb-1 block text-xs font-semibold">veya belirli bir zaman</label>
        <div className="flex flex-wrap gap-2">
          <input id="hat-zaman" type="datetime-local" className="alan min-w-0 flex-1 basis-52" value={zaman} onChange={(e) => setZaman(e.target.value)} />
          <button className="dugme dugme-altin" disabled={!metin.trim()} onClick={() => void olustur(new Date(zaman).getTime())}>Hatırlatıcı kur</button>
        </div>
        {bilgi && <p className="text-enerji-yesil mt-2 text-xs">{bilgi}</p>}
        <p className="text-metin2 mt-3 text-xs leading-relaxed">
          Bildirim izni yalnızca hatırlatıcı kurduğunuzda istenir. Durum:{" "}
          <b className={bildirim === "izinli" ? "text-enerji-yesil" : "text-uyari"}>
            {{ izinli: "izin verildi", reddedildi: "reddedildi", desteklenmiyor: "bu tarayıcıda desteklenmiyor", sorulmadi: "henüz sorulmadı" }[bildirim]}
          </b>
          . Web sürümünde hatırlatıcılar <b>uygulama açıkken</b> sesli ve ekranda uyarır; kapalıyken kaçırılanlar yeniden açtığınızda bildirilir.
          {bildirim === "reddedildi" && " Bildirimleri tarayıcı site ayarlarından (adres çubuğu kilit simgesi) açabilirsiniz."}
        </p>
      </div>

      {hata && <HataKutusu hata={hata} kapat={() => setHata(null)} />}

      <div className="cam p-3 sm:p-4">
        <p className="font-semibold">Alarm</p>
        <p className="text-metin2 mt-1 text-xs">Kesin zamanlı alarm için telefonunuzun alarm uygulaması en güvenilir yoldur (yalnızca Android).</p>
        <button
          className="dugme mt-2"
          onClick={() => {
            const r = alarmUygulamasiniAc();
            if (!r.basarili) setHata(r.hata);
          }}
        >
          ⏰ Alarm uygulamasını aç
        </button>
      </div>

      <h2 className="text-lg font-bold">Bekleyenler</h2>
      {bekleyen.length === 0 ? (
        <div className="cam-ince p-4 text-center text-sm text-metin2">Bekleyen hatırlatıcı yok.</div>
      ) : (
        <ul className="space-y-2">
          {bekleyen.map((h) => (
            <li key={h.id} className="cam flex items-center justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{h.metin}</p>
                <p className="text-metin2 text-xs">{tarihSaat(h.zaman)} · {kalanMetin(h.zaman - Date.now())}</p>
              </div>
              <button className="dugme dugme-kirmizi min-h-9 shrink-0 px-3 py-1 text-xs" onClick={() => hatirlaticiSil(h.id)}>İptal</button>
            </li>
          ))}
        </ul>
      )}
      {biten.length > 0 && (
        <>
          <h2 className="text-metin2 text-sm font-bold">Tamamlananlar</h2>
          <ul className="space-y-2">
            {biten.slice(-8).reverse().map((h) => (
              <li key={h.id} className="cam-ince flex items-center justify-between gap-3 p-3 opacity-80">
                <p className="min-w-0 text-sm break-words">✓ {h.metin} <span className="text-metin2 text-xs">· {tarihSaat(h.zaman)}</span></p>
                <button className="dugme min-h-9 shrink-0 px-3 py-1 text-xs" onClick={() => hatirlaticiSil(h.id)}>Sil</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
