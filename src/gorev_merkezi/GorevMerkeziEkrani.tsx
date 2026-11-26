// Komut ve Görev Merkezi: notlar, hatırlatıcılar, hesap makinesi, tarama arşivi ve sohbet geçmişi.
import { useState } from "react";

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
    <div className="mx-auto h-[calc(100dvh-4.5rem)] w-full max-w-3xl px-3 pt-14 pb-28 sm:px-6">
      <h1 className="altin-yazi mb-3 text-xl font-extrabold sm:text-2xl">Görev Merkezi</h1>
      <div className="cam cam-oval mb-4 flex gap-1 overflow-x-auto p-1.5" role="tablist" aria-label="Görev merkezi bölümleri">
        {SEKMELER.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sekme === s.id}
            onClick={() => setSekme(s.id)}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition"
            style={sekme === s.id ? { background: "linear-gradient(160deg,#FFE36A,#FFC928)", color: "#1a1204", boxShadow: "0 0 16px rgba(255,201,40,0.4)" } : { color: "#A9B3C7" }}
          >
            {s.ad}
          </button>
        ))}
      </div>
      <section className="cam flex min-h-48 items-center justify-center p-6 text-center">
        <div>
          <p className="text-altin text-lg font-bold">Yakında gelecek</p>
          <p className="text-metin2 mt-2 text-sm">Görev merkezi özellikleri hazırlanıyor.</p>
        </div>
      </section>
    </div>
  );
}
