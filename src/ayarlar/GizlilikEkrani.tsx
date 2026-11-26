// Türkçe gizlilik bilgilendirmesi: kamera, mikrofon, veri işleme, harici yapay zekâ, API anahtarı, silme.
const BOLUMLER: { baslik: string; simge: string; maddeler: string[] }[] = [
  {
    baslik: "Kamera ne zaman kullanılır?",
    simge: "📷",
    maddeler: [
      "Kamera yalnızca Kamera ekranında “Kamerayı başlat” dediğinizde veya “Feneri aç” komutunu verdiğinizde açılır.",
      "Kamera açıkken ekranın üstünde kırmızı “Kamera açık” göstergesi görünür.",
      "Ekrandan çıkınca, sekme gizlenince veya ekran kapanınca kamera otomatik kapatılır.",
      "Kamera kareleri yalnızca bellekte analiz edilir; kaydedilmez, diske yazılmaz ve hiçbir sunucuya gönderilmez. Arşive yalnızca sonuç METNİ kaydedilir.",
    ],
  },
  {
    baslik: "Mikrofon ne zaman aktif olur?",
    simge: "🎙",
    maddeler: [
      "Mikrofon yalnızca “Dinlemeyi başlat” veya “Sesli not” düğmesine dokunduğunuzda açılır ve tek dokunuşla kapanır.",
      "Aktifken ekranın üstünde kırmızı “Mikrofon dinliyor” göstergesi görünür.",
      "Sesiniz kaydedilmez. Ses seviyesi yalnızca Güneş HUD animasyonu için anlık hesaplanır ve saklanmaz.",
      "Konuşmadan metne çeviri tarayıcınızın konuşma tanıma servisi ile yapılır. Tarayıcı çevrimdışı tanımayı ve Türkçe dil paketini destekliyorsa çevrimdışı çalışabilir; aksi halde Chrome/Edge sesi kendi çevrimiçi servisine gönderebilir. AKREP JARVIS ses kaydı saklamaz.",
      "Uyandırma kelimesi açıksa kelimeyi içermeyen konuşmalar yok sayılır ve kaydedilmez.",
      "Web uygulamaları arka planda sürekli mikrofon dinleyemez; ekran kapanınca dinleme durur.",
    ],
  },
  {
    baslik: "Veriler cihazda mı işleniyor?",
    simge: "📱",
    maddeler: [
      "Yerel komutlar (fener, batarya, depolama, ağ, not, hesaplama, hatırlatıcı vb.) tamamen cihazınızda çalışır ve internet gerektirmez.",
      "Notlar, hatırlatıcılar, arşiv ve ayarlar yalnızca bu tarayıcının yerel depolamasında tutulur.",
      "OCR (metin okuma), nesne tanıma ve jest algılama cihazınızda çalışır. İlk kullanımda model dosyaları CDN’den indirilir (jsDelivr, Google Storage); bu indirmeler görüntünüzü içermez.",
    ],
  },
  {
    baslik: "Harici servislere ne gönderilebilir?",
    simge: "☁️",
    maddeler: [
      "Varsayılan olarak hiçbir şey gönderilmez. Yerel komutlar cihazda çözülür.",
      "Ayarlar'da “Harici servislerde canlı bilgi ve yapay zekâ izni” açıkken, açıkça istediğiniz hava durumu sorgusundaki şehir Open-Meteo'ya; “İnternetten ara …” isteğindeki sorgu Türkçe Wikipedia'ya gönderilir.",
      "Ayrıca bir yapay zekâ sağlayıcısı seçip API anahtarı eklediyseniz, izni açtıktan sonra yalnızca yerelde çözülemeyen komutun metni ve son birkaç mesaj seçilen sağlayıcıya gönderilir.",
      "Kamera görüntüsü, ses kaydı, notlarınız ve arşiviniz bu servislere gönderilmez.",
      "Üçüncü taraf analiz veya reklam sistemi kullanılmaz.",
    ],
  },
  {
    baslik: "API anahtarı nasıl korunur?",
    simge: "🔐",
    maddeler: [
      "Anahtar AES‑GCM 256 ile şifrelenir; şifreleme anahtarı tarayıcıda “çıkarılamaz” olarak üretilir (Android Keystore’un web karşılığı). Düz metin olarak saklanmaz.",
      "Anahtar ekranda her zaman maskeli gösterilir ve günlüklere yazılmaz.",
      "Anahtarı Ayarlar bölümünden istediğiniz an silebilirsiniz. HTTPS dışı bağlamda anahtar kalıcı kaydedilmez, yalnızca oturum belleğinde tutulur.",
      "Parolalı yedek dosyaları API anahtarlarını içermez; geri yükleme bu cihazda kayıtlı anahtarları değiştirmez.",
    ],
  },
  {
    baslik: "Geçmiş nasıl silinir?",
    simge: "🗑",
    maddeler: [
      "Ayarlar → “Veri ve gizlilik” bölümünden notları, hatırlatıcıları, tarama arşivini, sohbet geçmişini veya hepsini silebilirsiniz.",
      "Sohbet geçmişi varsayılan olarak saklanmaz; isterseniz Ayarlar’dan açabilirsiniz.",
      "Tarayıcı site verilerini silmek de tüm uygulama verilerini ve şifreli anahtarları kaldırır.",
    ],
  },
];

export function GizlilikEkrani() {
  return (
    <div className="mx-auto h-[calc(100dvh-4.5rem)] max-w-3xl space-y-4 overflow-y-auto px-3 pt-14 pb-28 sm:px-6">
      <h1 className="altin-yazi text-xl font-extrabold sm:text-2xl">Gizlilik</h1>
      <p className="text-metin2 text-sm">AKREP JARVIS verilerinizi nasıl kullanır? Aşağıda kamera, mikrofon, veri işleme ve yapay zekâ ile ilgili her şey açıkça anlatılmıştır.</p>
      {BOLUMLER.map((b) => (
        <details key={b.baslik} className="cam px-4 py-3 sm:px-5">
          <summary className="cursor-pointer list-none text-base font-bold">
            <span aria-hidden="true" className="mr-2">{b.simge}</span>
            {b.baslik}
          </summary>
          <ul className="text-metin2 mt-3 space-y-2 text-sm leading-relaxed">
            {b.maddeler.map((m) => (
              <li key={m} className="flex gap-2">
                <span className="text-altin" aria-hidden="true">•</span>
                <span className="min-w-0 break-words">{m}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
