// Komut ve Görev Merkezi: notlar, hatırlatıcılar, hesap makinesi, tarama arşivi ve sohbet geçmişi.
import { useState } from "react";
import { ArsivPaneli } from "./ArsivPaneli";
import { HatirlaticilarPaneli } from "./HatirlaticilarPaneli";
import { HesapPaneli } from "./HesapPaneli";
import { NotlarPaneli } from "./NotlarPaneli";
import { SohbetGecmisiPaneli } from "./SohbetGecmisiPaneli";

const SEKMELER = [
  { id: "notlar", ad: "📝 Notlar" },
  { id: "hatirlatici", ad: "⏰ Hatırlatıcı" },
  { id: "hesap", ad: "🧮 Hesap" },
  { id: "arsiv", ad: "🗂 Arşiv" },
  { id: "sohbet", ad: "💬 Sohbet" },
] as const;
type SekmeId = (typeof SEKMELER)[number]["id"];

interface Props {
  hudDinlemeyiDurdur: () => void;
}

export function GorevMerkeziEkrani({ hudDinlemeyiDurdur }: Props) {
  const [sekme, setSekme] = useState<SekmeId>("notlar");
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden px-3 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6">
      <h1 className="altin-yazi mb-3 shrink-0 text-xl font-extrabold sm:text-2xl">Görev Merkezi</h1>
      <div className="cam cam-oval mb-4 flex shrink-0 gap-1 overflow-x-auto p-1.5" role="tablist" aria-label="Görev merkezi bölümleri">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            id={`gorev-tab-${s.id}`}
            role="tab"
            aria-controls="gorev-panel"
            aria-selected={sekme === s.id}
            tabIndex={sekme === s.id ? 0 : -1}
            onClick={() => setSekme(s.id)}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition"
            style={sekme === s.id ? { background: "linear-gradient(160deg,#FFE36A,#FFC928)", color: "#1a1204", boxShadow: "0 0 16px rgba(255,201,40,0.4)" } : { color: "#A9B3C7" }}
          >
            {s.ad}
          </button>
        ))}
      </div>
      <section
        id="gorev-panel"
        role="tabpanel"
        aria-labelledby={`gorev-tab-${sekme}`}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2"
      >
        {sekme === "notlar" && <NotlarPaneli hudDinlemeyiDurdur={hudDinlemeyiDurdur} />}
        {sekme === "hatirlatici" && <HatirlaticilarPaneli />}
        {sekme === "hesap" && <HesapPaneli />}
        {sekme === "arsiv" && <ArsivPaneli />}
        {sekme === "sohbet" && <SohbetGecmisiPaneli />}
      </section>
    </div>
  );
}
