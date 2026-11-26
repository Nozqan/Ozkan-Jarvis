// Ekranlar arası gezinme hedefleri.
export type GezinmeHedefi = "hud" | "kamera" | "gorev" | "ayarlar" | "gizlilik";

export const GEZINME_ETIKETLERI: Record<GezinmeHedefi, string> = {
  hud: "HUD",
  kamera: "Kamera",
  gorev: "Görevler",
  ayarlar: "Ayarlar",
  gizlilik: "Gizlilik",
};
