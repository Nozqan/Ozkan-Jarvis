// Altın çizgili AKREP amblemi (SVG). "cizim" 0..1 arası ilerleme ile çizgiler tek tek belirir.
interface Props {
  cizim: number;
  className?: string;
}

export function AkrepAmblemi({ cizim, className }: Props) {
  const c = Math.max(0, Math.min(1, cizim));
  const cizgi = (kalinlik: number, opaklik = 1) => ({
    fill: "none",
    stroke: "url(#altinGradyan)",
    strokeWidth: kalinlik,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeOpacity: opaklik,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - c,
  });
  const bacak = (
    <g>
      <path d="M86 98 L62 100 L48 118" {...cizgi(3)} />
      <path d="M85 110 L58 122 L50 142" {...cizgi(3)} />
      <path d="M86 122 L64 138 L60 158" {...cizgi(3)} />
      <path d="M90 133 L76 152 L76 170" {...cizgi(3)} />
    </g>
  );
  const kiskac = (
    <g>
      <path d="M90 84 C72 80 58 66 52 48" {...cizgi(4)} />
      <path d="M52 48 C40 44 36 28 46 20 C46 32 54 36 64 36" {...cizgi(3.2)} />
      <path d="M52 48 C48 40 54 30 62 28" {...cizgi(2.6)} />
    </g>
  );
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="AKREP amblemi"
      style={{ filter: "drop-shadow(0 0 10px rgba(255,201,40,0.75)) drop-shadow(0 0 28px rgba(255,150,40,0.45))", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="altinGradyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE36A" />
          <stop offset="0.55" stopColor="#FFC928" />
          <stop offset="1" stopColor="#FF8A2E" />
        </linearGradient>
      </defs>
      {/* Kuyruk (arkada, hafif soluk) ve iğne */}
      <path d="M100 148 C98 184 160 184 160 134 C160 100 140 70 106 52" {...cizgi(6, 0.55)} />
      <path d="M106 52 L96 38 L112 44 Z" {...cizgi(3)} />
      {/* Bacaklar ve kıskaçlar (sol + ayna görüntüsü) */}
      {bacak}
      <g transform="translate(200,0) scale(-1,1)">{bacak}</g>
      {kiskac}
      <g transform="translate(200,0) scale(-1,1)">{kiskac}</g>
      {/* Gövde bölümleri */}
      <ellipse cx="100" cy="143" rx="9" ry="8" {...cizgi(3)} />
      <ellipse cx="100" cy="128" rx="12" ry="9" {...cizgi(3)} />
      <ellipse cx="100" cy="112" rx="14" ry="10" {...cizgi(3)} />
      <ellipse cx="100" cy="92" rx="15" ry="14" {...cizgi(3.4)} />
      <circle cx="94" cy="88" r="2" fill="#FFE36A" opacity={c} />
      <circle cx="106" cy="88" r="2" fill="#FFE36A" opacity={c} />
    </svg>
  );
}
