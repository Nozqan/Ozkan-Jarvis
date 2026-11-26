// Alt gezinme çubuğu: oval cam hap. Büyük yazı boyutunda taşmaz (yatay kaydırılabilir).
import { GEZINME_ETIKETLERI, type GezinmeHedefi } from "./GezinmeTipleri";

const SIMGELER: Record<GezinmeHedefi, string> = { hud: "☀️", kamera: "📷", gorev: "🗂", ayarlar: "⚙️", gizlilik: "🔒" };
const SIRA: GezinmeHedefi[] = ["hud", "kamera", "gorev", "ayarlar", "gizlilik"];

interface Props {
  aktif: GezinmeHedefi;
  gezin: (h: GezinmeHedefi) => void;
}

export function Gezinme({ aktif, gezin }: Props) {
  return (
    <nav
      aria-label="Ana gezinme"
      className="cam cam-oval fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 gap-1 overflow-x-auto p-1.5"
    >
      {SIRA.map((h) => (
        <button
          key={h}
          onClick={() => gezin(h)}
          aria-current={aktif === h ? "page" : undefined}
          className="flex shrink-0 flex-col items-center rounded-full px-3 py-1.5 text-[0.7rem] font-semibold transition sm:flex-row sm:gap-1.5 sm:px-4 sm:text-sm"
          style={aktif === h ? { background: "linear-gradient(160deg,#FFE36A,#FFC928)", color: "#1a1204", boxShadow: "0 0 18px rgba(255,201,40,0.45)" } : { color: "#A9B3C7" }}
        >
          <span aria-hidden="true" className="text-base leading-none">{SIMGELER[h]}</span>
          <span>{GEZINME_ETIKETLERI[h]}</span>
        </button>
      ))}
    </nav>
  );
}
