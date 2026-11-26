// Açılış durumları ve gerçek sistem kontrolü (ağ çağrısı YAPMAZ; açılışı bloke etmez).
export type GirisAsamasi = "aciliyor" | "sistem_kontrolu" | "hazir" | "kisitli" | "hata";

export const GIRIS_ETIKETLERI: Record<GirisAsamasi, string> = {
  aciliyor: "Açılıyor",
  sistem_kontrolu: "Sistem kontrolü",
  hazir: "Hazır",
  kisitli: "Kısıtlı mod",
  hata: "Hata",
};

export interface KontrolSonucu {
  asama: "hazir" | "kisitli" | "hata";
  /** Desteklenmeyen/eksik özelliklerin Türkçe açıklamaları */
  eksikler: string[];
}

export async function sistemKontroluYap(): Promise<KontrolSonucu> {
  try {
    const eksikler: string[] = [];
    // Yerel depolama gerçekten yazılabiliyor mu?
    try {
      localStorage.setItem("akrep.kontrol", "1");
      localStorage.removeItem("akrep.kontrol");
    } catch {
      eksikler.push("Yerel depolama kullanılamıyor; notlar kalıcı olmayabilir");
    }
    if (!window.isSecureContext) eksikler.push("Güvenli bağlam (HTTPS) yok; kamera, mikrofon ve anahtar şifreleme kısıtlı");
    const w = window as unknown as Record<string, unknown>;
    if (!("SpeechRecognition" in w) && !("webkitSpeechRecognition" in w)) eksikler.push("Konuşma tanıma desteklenmiyor; metinle komut girilebilir");
    if (!("speechSynthesis" in window)) eksikler.push("Sesli yanıt (TTS) desteklenmiyor");
    if (!navigator.mediaDevices?.getUserMedia) eksikler.push("Kamera/mikrofon erişimi desteklenmiyor");
    return { asama: eksikler.length ? "kisitli" : "hazir", eksikler };
  } catch {
    return { asama: "hata", eksikler: ["Sistem kontrolü tamamlanamadı"] };
  }
}
