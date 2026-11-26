// İsteğe bağlı sohbet geçmişi: yalnızca ayarlardan açıldıysa konuşmalar burada saklanır.
import { useDepo } from "@/ortak/yardimci/kaliciDepo";
import { sohbetDeposu, sohbetTemizle } from "@/veri/depo/SohbetDeposu";
import { ayarGuncelle, useAyarlar } from "@/veri/depo/AyarDeposu";
import { tarihSaat } from "@/ortak/yardimci/yardimcilar";

export function SohbetGecmisiPaneli() {
  const liste = useDepo(sohbetDeposu);
  const ayar = useAyarlar();
  return (
    <div className="space-y-3">
      <div className="cam flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <p className="min-w-0 flex-1 basis-56 text-sm">
          Sohbet geçmişi saklama: <b className={ayar.sohbetGecmisiniSakla ? "text-enerji-yesil" : "text-uyari"}>{ayar.sohbetGecmisiniSakla ? "Açık" : "Kapalı"}</b>
          <span className="text-metin2 mt-1 block text-xs">Kapalıyken konuşmalar yalnızca oturum boyunca ekranda kalır, cihaza kaydedilmez.</span>
        </p>
        <button className="dugme" onClick={() => ayarGuncelle({ sohbetGecmisiniSakla: !ayar.sohbetGecmisiniSakla })} aria-pressed={ayar.sohbetGecmisiniSakla}>
          {ayar.sohbetGecmisiniSakla ? "Saklamayı kapat" : "Saklamayı aç"}
        </button>
      </div>
      {liste.length === 0 ? (
        <div className="cam-ince p-4 text-center text-sm text-metin2">Kayıtlı sohbet yok.</div>
      ) : (
        <>
          <ul className="space-y-2">
            {[...liste].reverse().map((m) => (
              <li key={m.id} className={`flex ${m.rol === "kullanici" ? "justify-end" : "justify-start"}`}>
                <div className="cam-ince max-w-[90%] px-4 py-2 text-sm break-words" style={{ borderRadius: 22 }}>
                  {m.metin}
                  <span className="text-metin2 mt-1 block text-[0.65rem]">{m.rol === "kullanici" ? "Siz" : "Jarvis"} · {tarihSaat(m.tarih)}</span>
                </div>
              </li>
            ))}
          </ul>
          <button className="dugme dugme-kirmizi" onClick={sohbetTemizle}>Sohbet geçmişini sil</button>
        </>
      )}
    </div>
  );
}
