// Oval açma/kapama anahtarı (erişilebilir switch).
interface Props {
  acik: boolean;
  degisti: (yeni: boolean) => void;
  etiket: string;
  aciklama?: string;
}

export function Anahtar({ acik, degisti, etiket, aciklama }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      onClick={() => degisti(!acik)}
      className="flex w-full items-center justify-between gap-3 rounded-full px-3 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-gunes"
      style={{ minHeight: 48 }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium break-words">{etiket}</span>
        {aciklama && <span className="text-metin2 block text-xs break-words">{aciklama}</span>}
      </span>
      <span
        className="relative inline-block h-7 w-12 shrink-0 rounded-full transition"
        style={{ background: acik ? "linear-gradient(90deg,#FFC928,#FFE36A)" : "rgba(255,255,255,0.14)", boxShadow: acik ? "0 0 14px rgba(255,201,40,0.5)" : "inset 0 2px 6px rgba(0,0,0,0.5)" }}
      >
        <span className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: acik ? 24 : 4 }} />
      </span>
    </button>
  );
}
