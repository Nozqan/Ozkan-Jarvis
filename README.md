# AKREP JARVIS

Geliştirici: **Nebi Özkan**

Türkçe sesli iletişim, canlı kamera taraması, yerel komutlar ve 3B Güneş HUD arayüzü sunan React uygulaması. Capacitor ile web ve Android olarak paketlenir; Android sürümü Kotlin/Jetpack Compose ile yeniden yazılmış bir uygulama değildir.

## Klasör yapısı (`src/`)

```
ortak/        tema, bileşenler, animasyonlar, hata, yardımcılar
veri/         model (tipler), depo (Ayar, Not, Arşiv, Sohbet, Hatırlatıcı, şifreli yedekleme)
giris_ekrani/ GirisEkrani, GirisDurumu, GirisAnimasyonlari
ana_hud/      AnaHudEkrani, AnaHudViewModel, AkanMetin
gunes_hud/    GunesHud, EnerjiHalkalari, SesGorsellestirici
canli_kamera/ KameraEkrani, KameraViewModel, KameraYoneticisi, MetinTarayici (OCR),
              NesneAnalizcisi, OrtamAnalizcisi, JestAlgilayici, FeneriYoneticisi, KameraHudKatmani
ses_motoru/   MikrofonYoneticisi, KonusmaTaniyici, TurkceMetinSeslendirici, UyandirmaKelimesi
yapay_zeka/   YapayZekaSaglayici, OpenAiUyumluSaglayici, GeminiSaglayici, YerelKomutMotoru,
              YerelKomutSaglayici, CanliBilgi, KomutYonlendirici, SaglayiciFabrikasi
sistem_izleyici/ SistemIzleyici, Batarya/Depolama/Bellek/AgIzleyici, CihazDurumu, SistemPaneli
gorev_merkezi/ NotYoneticisi, HatirlaticiYoneticisi, HesapMakinesi + görev panelleri
ayarlar/      AyarlarEkrani, GizlilikEkrani, GuvenliAnahtarDeposu
gezinme/      Gezinme, GezinmeTipleri
testler/      Birim, izin akışı, yedekleme, tarama, konuşma ve çevrimdışı mod testleri (vitest)
```

## Android ↔ Web eşleşmesi

| Özellik                         | Web                                               | Android (Capacitor) |
|---------------------------------|---------------------------------------------------|---------------------|
| Kamera                          | `getUserMedia` (`KameraYoneticisi`)               | WebView kamera izni |
| QR / barkod                     | Yerel `BarcodeDetector` destekleniyorsa           | WebView desteğine bağlı |
| OCR / nesne / jest              | Tesseract / COCO‑SSD / MediaPipe (cihazda)        | Aynı web modülleri |
| Konuşma tanıma                  | Web Speech API (`tr-TR`); tarayıcı desteklerse çevrimdışı tanıma | WebView motoru ve dil paketi desteğine bağlı |
| Sesli yanıt                     | `speechSynthesis`                                 | WebView TTS desteği |
| Hatırlatıcı bildirimi           | Uygulama açıkken zamanlayıcı                      | Capacitor Local Notifications |
| Şifreli yedek                   | PBKDF2-SHA-256 + AES-GCM; API anahtarları hariç   | Aynı web modülü |

## Geliştirme ve derleme

Gereksinimler: Node.js 24, npm; Android APK için ayrıca JDK 21 ve Android SDK Platform 36 / Build Tools 36.0.0.

```
npm ci
npm run test          # Birim ve davranış testleri
npm run typecheck     # TypeScript tür denetimi
npm run build         # Web uygulamasını dist/index.html olarak derler
npm run android:apk   # Capacitor senkronizasyonu + Android debug APK
```

Android SDK konumu `ANDROID_HOME` veya `ANDROID_SDK_ROOT` ile belirtilmelidir. `.github/workflows/android-apk.yml`, testleri çalıştırır ve debug APK’yı GitHub Actions artifact’i olarak saklar. Bu APK geliştirme/test içindir; imzalı mağaza sürümü değildir. Release imzalama anahtarları ve dağıtım süreci henüz yapılandırılmamıştır.

## Canlı bilgi ve gizlilik

- Hava durumu, açıkça şehir belirtilerek sorulabilir (ör. “Ankara hava durumu”); arama için “İnternetten ara …” biçimini kullanın. Canlı servis çağrıları için Ayarlar’daki harici servis izni gerekir.
- Hava durumu Open-Meteo’dan, arama sonuçları Türkçe Wikipedia’dan alınır. Bu servisler yalnızca şehir/sorgu bilgisini alır; fotoğraf, kamera görüntüsü, mikrofon kaydı, not ve arşiv gönderilmez.
- Harici yapay zekâ sağlayıcısına çözülemeyen komut metni ancak sağlayıcı yapılandırılmış ve harici servis izni açıksa gönderilir.
- Yedek parola ile şifrelenir. API anahtarları güvenlik nedeniyle yedeğe dahil edilmez. Geri yükleme yerel uygulama verilerinin üzerine yazar.

## Platform sınırları

- Web’de batarya **sıcaklığı** ve cihazın **toplam disk** bilgisi okunamaz → “Kullanılamıyor” gösterilir.
- Fener yalnızca arka kamerada `torch` destekleyen Android/Chrome cihazlarda çalışır.
- Web’de arka planda sürekli mikrofon dinleme mümkün değildir. Web hatırlatıcıları uygulama açıkken çalışır; Android sistem bildirimleri izin ve işletim sistemi kısıtlarına bağlıdır.
- Web Speech konuşmayı tarayıcı servisine gönderebilir. Tarayıcı `processLocally` desteği sağlıyor ve Türkçe dil paketi kuruluysa çevrimdışı dinleme kullanılabilir; aksi halde kullanıcıya metin girişi önerilir.
- QR/barkod tanıma tarayıcının `BarcodeDetector` desteğine bağlıdır; desteklenmeyen cihazda özellik kullanılamaz.
- OCR, nesne ve jest modelleri ilk kullanımda CDN’den indirilir; sonra önbellekten çalışır.
