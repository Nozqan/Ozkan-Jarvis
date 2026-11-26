// Holografik "akan metin": yanıt harf harf belirir. Hareket azaltma açıksa metin anında gösterilir.
import { useEffect, useState } from "react";
import { usePerformans } from "@/ortak/animasyonlar/PerformansProfili";

export function AkanMetin({ metin }: { metin: string }) {
  const { hareketAzalt } = usePerformans();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (hareketAzalt) {
      setN(metin.length);
      return;
    }
    setN(0);
    const z = setInterval(() => setN((x) => (x >= metin.length ? (clearInterval(z), x) : x + 2)), 22);
    return () => clearInterval(z);
  }, [metin, hareketAzalt]);

  const bitti = n >= metin.length;
  return (
    <p
      className="text-[0.98rem] leading-relaxed break-words sm:text-lg"
      style={{ color: "#dff4ff", textShadow: "0 0 12px rgba(103,199,255,0.6), 0 0 2px rgba(255,255,255,0.5)" }}
      aria-live="polite"
    >
      {metin.slice(0, n)}
      {!bitti && <span className="anim-yanip text-bilgi">▍</span>}
    </p>
  );
}
