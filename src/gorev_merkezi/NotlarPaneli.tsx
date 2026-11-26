// Notlar: metinle veya sesle not oluşturma, listeleme, arama ve silme.
import { useEffect, useMemo, useRef, useState } from "react";
import { useDepo } from "@/ortak/yardimci/kaliciDepo";
import { notDeposu } from "@/veri/depo/NotDeposu";
import { tarihSaat } from "@/ortak/yardimci/yardimcilar";
import { HataKutusu } from "@/ortak/hata/HataKutusu";
import { KonusmaTaniyici } from "@/ses_motoru/KonusmaTaniyici";
import { MikrofonYoneticisi } from "@/ses_motoru/MikrofonYoneticisi";
import type { UygulamaHatasi } from "@/veri/model/tipler";
import { notAra, notEkle, notSil } from "./NotYoneticisi";

interface Props {
  /** Ana HUD dinliyorsa, sesli not öncesi durdurmak için */
  hudDinlemeyiDurdur: () => void;
}

export function NotlarPaneli({ hudDinlemeyiDurdur }: Props) {
  const tum = useDepo(notDeposu);
  const [metin, setMetin] = useState("");
  const [sorgu, setSorgu] = useState("");
  const [hata, setHata] = useState<UygulamaHatasi | null>(null);
  const [sesliAktif, setSesliAktif] = useState(false);
  const taniyici = useRef<KonusmaTaniyici | null>(null);
  const mikrofon = useMemo(() => new MikrofonYoneticisi(), []);

  const liste = useMemo(() => (sorgu.trim() ? notAra(sorgu) : tum), [sorgu, tum]);

  const sesliDurdur = () => {
    taniyici.current?.durdur();
    taniyici.current = null;
    mikrofon.durdur();
    setSesliAktif(false);
  };

  useEffect(() => () => sesliDurdur(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const sesliBaslat = async () => {
    if (sesliAktif) return sesliDurdur();
    setHata(null);
    hudDinlemeyiDurdur();
    const r = await mikrofon.baslat(false);
    if (!r.basarili) return setHata(r.hata);
    taniyici.current = new KonusmaTaniyici({
      araSonuc: (m) => setMetin(m),
      sonuc: (m) => {
        // Sesli not: duyulan cümle kaydedilir ve dinleme kapanır.
        const s = notEkle(m, "ses");
        if (s.basarili) setMetin("");
        else setHata(s.hata);
        sesliDurdur();
      },
      hata: (h, kalici) => {
        setHata(h);
        if (kalici) sesliDurdur();
      },
      dinlemeDurumu: (a) => {
        if (!a) setSesliAktif(false);
      },
    });
    setSesliAktif(true);
    taniyici.current.baslat();
  };

  const kaydet = (e: React.FormEvent) => {
    e.preventDefault();
    const r = notEkle(metin, "metin");
    if (r.basarili) {
      setMetin("");
      setHata(null);
    } else setHata(r.hata);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={kaydet} className="cam p-3 sm:p-4">
        <label htmlFor="not-metni" className="text-metin2 mb-1 block text-xs font-semibold">Yeni not</label>
        <textarea id="not-metni" className="alan" rows={2} placeholder="Notunuzu yazın…" value={metin} onChange={(e) => setMetin(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="submit" className="dugme dugme-altin" disabled={!metin.trim()}>Notu kaydet</button>
          <button type="button" className={`dugme ${sesliAktif ? "dugme-kirmizi" : "dugme-yesil"}`} onClick={() => void sesliBaslat()} aria-pressed={sesliAktif}>
            {sesliAktif ? "⏹ Dinlemeyi bitir" : "🎙 Sesli not"}
          </button>
        </div>
        {sesliAktif && <p className="text-enerji-yesil mt-2 text-xs">Dinleniyor… Notunuzu söyleyin; cümle bitince otomatik kaydedilir.</p>}
      </form>
      {hata && <HataKutusu hata={hata} kapat={() => setHata(null)} />}
      <input className="alan" type="search" placeholder="Notlarda ara…" aria-label="Notlarda ara" value={sorgu} onChange={(e) => setSorgu(e.target.value)} />
      {liste.length === 0 ? (
        <div className="cam-ince p-4 text-center text-sm text-metin2">{tum.length === 0 ? "Henüz not yok. Yukarıdan ekleyin ya da “not al: …” komutunu kullanın." : "Aramaya uyan not bulunamadı."}</div>
      ) : (
        <ul className="space-y-2">
          {liste.map((n) => (
            <li key={n.id} className="cam anim-giris flex items-start justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-sm break-words whitespace-pre-wrap">{n.metin}</p>
                <p className="text-metin2 mt-1 text-[0.7rem]">
                  {tarihSaat(n.olusturma)} · {n.kaynak === "ses" ? "Sesli" : n.kaynak === "komut" ? "Komutla" : "Yazıyla"}
                </p>
              </div>
              <button className="dugme dugme-kirmizi min-h-9 shrink-0 px-3 py-1 text-xs" onClick={() => notSil(n.id)} aria-label="Notu sil">Sil</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
