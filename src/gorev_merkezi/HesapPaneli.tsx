// Hızlı hesap makinesi paneli (güvenli ayrıştırıcı; eval yok).
import { useState } from "react";
import { hesapla, sonucMetni } from "./HesapMakinesi";

const TUSLAR: { e: string; d: string; tur?: "op" | "ozel" | "esit" }[] = [
  { e: "C", d: "C", tur: "ozel" }, { e: "(", d: "(", tur: "op" }, { e: ")", d: ")", tur: "op" }, { e: "÷", d: "/", tur: "op" },
  { e: "7", d: "7" }, { e: "8", d: "8" }, { e: "9", d: "9" }, { e: "×", d: "*", tur: "op" },
  { e: "4", d: "4" }, { e: "5", d: "5" }, { e: "6", d: "6" }, { e: "−", d: "-", tur: "op" },
  { e: "1", d: "1" }, { e: "2", d: "2" }, { e: "3", d: "3" }, { e: "+", d: "+", tur: "op" },
  { e: "0", d: "0" }, { e: ",", d: "." }, { e: "%", d: "%", tur: "op" }, { e: "=", d: "=", tur: "esit" },
  { e: "√", d: "sqrt(", tur: "op" }, { e: "xʸ", d: "^", tur: "op" }, { e: "⌫", d: "SIL", tur: "ozel" }, { e: "Ans", d: "ANS", tur: "ozel" },
];

export function HesapPaneli() {
  const [ifade, setIfade] = useState("");
  const [sonuc, setSonuc] = useState("");
  const [hata, setHata] = useState("");
  const [gecmis, setGecmis] = useState<string[]>([]);
  const [son, setSon] = useState<number | null>(null);

  const hesapEt = () => {
    const r = hesapla(ifade);
    if (!r.basarili) {
      setHata(`${r.hata.mesaj} ${r.hata.oneri}`);
      return;
    }
    setHata("");
    const m = sonucMetni(r.deger);
    setSonuc(m);
    setSon(r.deger);
    setGecmis((g) => [`${ifade.replace(/\*/g, "×").replace(/\//g, "÷")} = ${m}`, ...g].slice(0, 12));
    setIfade(String(r.deger));
  };

  const tus = (d: string) => {
    setHata("");
    if (d === "C") {
      setIfade("");
      setSonuc("");
    } else if (d === "SIL") setIfade((x) => (x.endsWith("sqrt(") ? x.slice(0, -5) : x.slice(0, -1)));
    else if (d === "ANS") {
      if (son != null) setIfade((x) => x + String(son));
    } else if (d === "=") hesapEt();
    else setIfade((x) => x + d);
  };

  return (
    <div className="space-y-3">
      <div className="cam p-3 sm:p-4">
        <label htmlFor="hesap-giris" className="sr-only">İfade</label>
        <input
          id="hesap-giris"
          className="alan text-right text-xl tabular-nums"
          inputMode="decimal"
          placeholder="12 * (3 + 4)"
          value={ifade}
          onChange={(e) => setIfade(e.target.value.replace(/[×]/g, "*").replace(/[÷]/g, "/").replace(/,/g, "."))}
          onKeyDown={(e) => e.key === "Enter" && hesapEt()}
        />
        <p className="text-enerji-yesil mt-2 min-h-7 text-right text-2xl font-bold break-all tabular-nums" aria-live="polite">{sonuc}</p>
        {hata && <p className="text-hata text-right text-xs">{hata}</p>}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TUSLAR.map((t) => (
            <button
              key={t.e}
              onClick={() => tus(t.d)}
              className={`dugme px-0 text-lg ${t.tur === "esit" ? "dugme-altin" : t.tur === "op" ? "text-gunes" : t.tur === "ozel" ? "text-uyari" : ""}`}
              aria-label={t.e === "⌫" ? "Sil" : t.e === "xʸ" ? "Üs" : t.e === "√" ? "Karekök" : t.e}
            >
              {t.e}
            </button>
          ))}
        </div>
      </div>
      <div className="cam-ince p-3 text-sm">
        <p className="text-metin2 mb-1 text-xs font-semibold">Geçmiş</p>
        {gecmis.length === 0 ? <p className="text-metin2 text-xs">Henüz hesap yok. Ana ekranda “25 çarpı 4” demeyi de deneyebilirsiniz.</p> : gecmis.map((g, i) => <p key={i} className="break-all tabular-nums">{g}</p>)}
      </div>
    </div>
  );
}
