# AKREP JARVIS

Geliştirici: **Nebi Özkan**

Türkçe sesli iletişim, canlı kamera taraması, çevrimdışı yerel komutlar ve 3B Güneş HUD arayüzü sunan modüler asistan.

> **Platform notu:** Bu depo, bulunduğu ortamda derlenebilen **web (React + Vite + Tailwind)** sürümüdür.
> Android (Kotlin / Jetpack Compose) APK’sı değildir. Aynı modül yapısı ve davranışlar, Android sürümüne
> birebir taşınabilecek şekilde Türkçe klasörlerle ayrılmıştır (bkz. aşağıdaki eşleşme tablosu).

## Klasör yapısı (`src/`)

```
ortak/        tema, bilesenler, animasyonlar, hata, yardimci
veri/         model (tipler), depo (Ayar, Not, Arsiv, Sohbet, Hatirlatici)
giris_ekrani/ GirisEkrani, GirisDurumu, GirisAnimasyonlari
ana_hud/      AnaHudEkrani, AnaHudViewModel, AkanMetin
gunes_hud/    GunesHud, EnerjiHalkalari, SesGorsellestirici
canli_kamera/ KameraEkrani, KameraViewModel, KameraYoneticisi, MetinTarayici (OCR),
              NesneAnalizcisi, OrtamAnalizcisi, JestAlgilayici, FeneriYoneticisi, KameraHudKatmani
ses_motoru/   MikrofonYoneticisi, KonusmaTaniyici, TurkceMetinSeslendirici, UyandirmaKelimesi
yapay_zeka/   YapayZekaSaglayici, OpenAiUyumluSaglayici, GeminiSaglayici, YerelKomutMotoru,
              YerelKomutSaglayici, KomutYonlendirici, SaglayiciFabrikasi, YapayZekaDurumu
sistem_izleyici/ SistemIzleyici, Batarya/Depolama/Bellek/AgIzleyici, CihazDurumu, SistemPaneli
gorev_merkezi/ NotYoneticisi, HatirlaticiYoneticisi, HesapMakinesi + paneller
ayarlar/      AyarlarEkrani, GizlilikEkrani, GuvenliAnahtarDeposu
gezinme/      Gezinme, GezinmeTipleri
testler/      Birim, izin akışı, OCR arşiv ve çevrimdışı mod testleri (vitest)
```

## Android ↔ Web eşleşmesi

| Android                         | Bu sürüm                                           |
|---------------------------------|----------------------------------------------------|
| CameraX                         | `getUserMedia` (KameraYoneticisi)                  |
| ML Kit OCR                      | Tesseract (WASM, `tur` dili, cihazda)              |
| ML Kit nesne / el modeli        | COCO‑SSD (TF.js) / MediaPipe Gesture Recognizer    |
| SpeechRecognizer                | Web Speech API (`tr-TR`)                           |
| TextToSpeech                    | `speechSynthesis` (tr‑TR en iyi ses seçimi)        |
| Android Keystore                | WebCrypto AES‑GCM + çıkarılamaz anahtar (IndexedDB) |
| DataStore                       | `kaliciDepo` (localStorage)                        |
| WorkManager / AlarmManager      | Uygulama açıkken zamanlayıcı + Android alarm intent |

## Komutlar

```
npm run build        # dist/index.html üretir
npx vitest run       # birim testleri
```

## Bilinen platform sınırları (dürüst liste)

- Web’de batarya **sıcaklığı** ve cihazın **toplam disk** bilgisi okunamaz → “Kullanılamıyor” gösterilir.
- Fener yalnızca arka kamerada `torch` destekleyen Android/Chrome cihazlarda çalışır.
- Arka planda sürekli mikrofon ve kapalıyken hatırlatıcı/alarm tetikleme web’de mümkün değildir.
- Konuşma tanıma Chrome/Edge’de çevrimiçi servis kullanır (Gizlilik ekranında belirtilmiştir).
- OCR, nesne ve jest modelleri ilk kullanımda CDN’den indirilir; sonra önbellekten çalışır.
