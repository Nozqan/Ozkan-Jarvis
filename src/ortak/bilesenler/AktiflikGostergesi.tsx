// Mikrofon veya kamera açıkken HER ekranda görünen oval uyarı (gizlilik: aktiflik her zaman görünür).
import { useCihazDurumu } from "@/sistem_izleyici/CihazDurumu";

export function AktiflikGostergesi() {
  const c = useCihazDurumu();
  const mik = c.mikrofon === "aktif";
  const kam = c.kamera === "aktif";
  if (!mik && !kam) return null;
  return (
    <div className="pointer-events-none fixed top-[max(0.5rem,env(safe-area-inset-top))] left-1/2 z-40 flex -translate-x-1/2 gap-2" role="status" aria-live="polite">
      {mik && (
        <span className="cam cam-oval anim-giris flex items-center gap-2 px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "rgba(255,94,108,0.6)" }}>
          <span className="anim-nabiz inline-block h-2.5 w-2.5 rounded-full bg-hata" style={{ boxShadow: "0 0 10px #FF5E6C" }} />
          Mikrofon dinliyor
        </span>
      )}
      {kam && (
        <span className="cam cam-oval anim-giris flex items-center gap-2 px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "rgba(255,94,108,0.6)" }}>
          <span className="anim-nabiz inline-block h-2.5 w-2.5 rounded-full bg-hata" style={{ boxShadow: "0 0 10px #FF5E6C" }} />
          Kamera açık{c.kameraNedeni ? ` · ${c.kameraNedeni}` : ""}
        </span>
      )}
    </div>
  );
}
