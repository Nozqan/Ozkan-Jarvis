// Kamera tarama arşivi: gelişmiş arama (metin + tür + tarih aralığı), silme, tümünü temizleme.
import { useMemo, useState } from "react";
import { useDepo } from "@/ortak/yardimci/kaliciDepo";
import { arsivAra, arsivDeposu, arsivSil, arsivTemizle } from "@/veri/depo/ArsivDeposu";
import { tarihSaat } from "@/ortak/yardimci/yardimcilar";
import type { ArsivTuru } from "@/veri/model/tipler";

const TURLER: { id: ArsivTuru | "hepsi"; ad: string }[] = [
  { id: "hepsi", ad: "Tümü" },
  { id: "ocr", ad: "Metin" },
  { id: "nesne", ad: "Nesne" },
  { id: "ortam", ad: "Ortam" },
  { id: "jest", ad: "Jest" },
];

export function ArsivPaneli() {
  const tum = useDepo(arsivDeposu);
  const [sorgu, setSorgu] = useState("");
  const [tur, setTur] = useState<ArsivTuru | "hepsi">("hepsi");
  const [bas, setBas] = useState("");
  const [bit, setBit] = useState("");
  const [onay, setOnay] = useState(false);

  const liste = useMemo(
    () =>
      arsivAra({
        sorgu,
        tur,
        baslangic: bas ? new Date(bas).getTime() : undefined,
        bitis: bit ? new Date(bit).getTime() + 86_399_999 : undefined,
      }),
    [sorgu, tur, bas, bit, tum],
  );

  return (
    <div className="space-y-3">
      <div className="cam p-3 sm:p-4">
        <input className="alan" type="search" placeholder="Arşivde ara (metin, nesne adı…)" aria-label="Arşivde ara" value={sorgu} onChange={(e) => setSorgu(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Tür filtresi">
          {TURLER.map((t) => (
            <button key={t.id} className={`dugme min-h-9 px-3 py-1 text-xs ${tur === t.id ? "dugme-altin" : ""}`} aria-pressed={tur === t.id} onClick={() => setTur(t.id)}>
              {t.ad}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-metin2">
          <label className="flex items-center gap-2">Başlangıç <input type="date" className="alan min-h-9 w-auto py-1" value={bas} onChange={(e) => setBas(e.target.value)} /></label>
          <label className="flex items-center gap-2">Bitiş <input type="date" className="alan min-h-9 w-auto py-1" value={bit} onChange={(e) => setBit(e.target.value)} /></label>
        </div>
      </div>

      {liste.length === 0 ? (
        <div className="cam-ince p-4 text-center text-sm text-metin2">
          {tum.length === 0 ? "Arşiv boş. Kamera ekranında bir tarama yapıp “Arşive kaydet” düğmesine dokunun. Yalnızca metin sonuçlar saklanır; görüntü saklanmaz." : "Filtreye uyan kayıt bulunamadı."}
        </div>
      ) : (
        <ul className="space-y-2">
          {liste.map((k) => (
            <li key={k.id} className="cam anim-giris p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-altin min-w-0 text-sm font-semibold break-words">{k.baslik}</p>
                <span className="text-metin2 text-[0.7rem]">{tarihSaat(k.tarih)}</span>
              </div>
              <p className="mt-1 text-sm break-words whitespace-pre-wrap">{k.metin}</p>
              <button className="dugme dugme-kirmizi mt-2 min-h-9 px-3 py-1 text-xs" onClick={() => arsivSil(k.id)}>Sil</button>
            </li>
          ))}
        </ul>
      )}

      {tum.length > 0 &&
        (onay ? (
          <div className="cam flex flex-wrap items-center gap-2 p-3 text-sm">
            <span>Tüm arşiv ({tum.length} kayıt) silinsin mi?</span>
            <button className="dugme dugme-kirmizi min-h-9 px-3 py-1 text-xs" onClick={() => { arsivTemizle(); setOnay(false); }}>Evet, sil</button>
            <button className="dugme min-h-9 px-3 py-1 text-xs" onClick={() => setOnay(false)}>Vazgeç</button>
          </div>
        ) : (
          <button className="dugme" onClick={() => setOnay(true)}>Tüm arşivi temizle</button>
        ))}
    </div>
  );
}
