// Kullanıcıya "ne oldu + ne yapabilirsin" gösteren oval cam hata paneli.
import type { UygulamaHatasi } from "@/veri/model/tipler";

interface Props {
  hata: UygulamaHatasi;
  tekrarDene?: () => void;
  ayarlaraGit?: () => void;
  kapat?: () => void;
}

export function HataKutusu({ hata, tekrarDene, ayarlaraGit, kapat }: Props) {
  return (
    <div role="alert" className="cam anim-giris p-4 sm:p-5" style={{ borderColor: "rgba(255,94,108,0.55)" }}>
      <p className="text-hata font-semibold break-words">⚠ {hata.mesaj}</p>
      <p className="text-metin2 mt-1 text-sm break-words">{hata.oneri}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tekrarDene && hata.tekrarDenenebilir && (
          <button className="dugme dugme-altin" onClick={tekrarDene}>
            Tekrar dene
          </button>
        )}
        {ayarlaraGit && (
          <button className="dugme" onClick={ayarlaraGit}>
            Ayarlara git
          </button>
        )}
        {kapat && (
          <button className="dugme" onClick={kapat}>
            Kapat
          </button>
        )}
      </div>
    </div>
  );
}
