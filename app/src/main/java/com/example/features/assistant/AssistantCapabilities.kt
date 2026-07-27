package com.example.features.assistant

object AssistantCapabilities {

    val FEATURES_LIST = listOf(
        "1. Gemini Canlı Gerçek İnsan Sesi Sentezleme (Puck, Kore, Fenrir, Aoede)",
        "2. Çevrimdışı Türkçe & Kürtçe Ses Tanıma ve Dinleme Engine",
        "3. Tam Otomatik API Anahtarsız (Zero-Config) Asistan Motoru",
        "4. Özelleştirilebilir API Key Tanımlama Desteği",
        "5. Sesli Uyandırma Komutu ('Akrep')",
        "6. Arka Plan Sürekli Dinleme & Servis Yönetimi (Foreground Service)",
        "7. Kamera Donanım Kontrolü ve Fotoğraf Modu",
        "8. Kamera Flaşı & El Feneri Açma/Kapatma",
        "9. Wi-Fi Bağlantı Yönetimi ve Hızlı Ayarlar",
        "10. Bluetooth Cihaz Eşleşme ve Açma/Kapatma Paneli",
        "11. Batarya Seviyesi Anlık Sorgulama (% Doluluk)",
        "12. Batarya Sıcaklığı (°C) ve Şarj Durumu Tespiti",
        "13. Güç Tasarrufu Modu Durum Analizi",
        "14. Medya Oynatıcı Kontrolü (Oynat/Duraklat)",
        "15. Sonraki Şarkıya Geçiş Komutu",
        "16. Önceki Şarkıya Geçiş Komutu",
        "17. Medya Ses Düzeyi Yükseltme ve Yüzdelik Ayarlama",
        "18. Medya Sesi Tamamen Sessize Alma / Mute",
        "19. Zil Sesi ve Bildirim Sesi Düzeyi Yönetimi",
        "20. Ekran Parlaklık Seviyesi Analizi ve Ayarları",
        "21. Sistem RAM Kullanım Analizi (Kullanılan / Toplam GB)",
        "22. Cihaz Dahili Depolama Alanı Analizi (GB)",
        "23. Çalışma Süresi (Uptime) Hesaplayıcısı",
        "24. Cihaz Modeli ve Android Sürüm Detayları",
        "25. İsimle Uygulama Başlatma (WhatsApp, YouTube, Spotify vb.)",
        "26. İsim veya Numara ile Sesli Arama Başlatma",
        "27. SMS ve Mesajlar Uygulamasına Hızlı Erişim",
        "28. Sesli Not Alma ve Hafızaya Kaydetme",
        "29. Hafızadaki Notları Sesli Olarak Listeleme",
        "30. Hafıza & Not Temizleme Komutu",
        "31. Cyberpunk Neon Dalga Boyu Ses Görselleştiricisi (Waveform Visualizer)",
        "32. Gemini Konuşurken Çalışan Canlı Equalizer Barları",
        "33. HUD Sistem Raporu & Çekirdek Sıcaklık Sentezi",
        "34. Siber Rastgele Karşılama ve Hitap Modülü ('kral', 'dostum')",
        "35. Haptik Titreşim Geri Bildirimi",
        "36. Mikrofon İzin Kontrol Paneli",
        "37. Kamera İzin Kontrol Paneli",
        "38. Rehber ve Arama İzin Yönetim Paneli",
        "39. Arka Plan Wake Lock Uykusuzluk Yönetimi",
        "40. Dinleme / Düşünme / Konuşma Canlı Renk Temaları",
        "41. Sesli Konuşmayı Tekrar Oynatma Butonu",
        "42. Geçmiş Sohbeti Temizleme Düğmesi",
        "43. Mikrofon Bas-Konuş Dokunsal Düğmesi",
        "44. Matrix Yeşili & Akrep Kırmızısı Siber Arayüz Teması",
        "45. Tek Tıkla Tüm İzinleri İstemci Ekranı",
        "46. Otomatik Düşük Gecikmeli Ses Çalma (PCM/WAV Sentezleyici)",
        "47. Şebeke & İnternet Bağlantı Türü Tespiti (Wi-Fi/4G/5G)",
        "48. Cihaz Ayarlar Menülerine Doğrudan Kısayol Sağlama",
        "49. Güvenli Ön Bellek Ses Dosya Yöneticisi",
        "50. Nebi Özkan Özel Akrep JARVIS Lisans ve Hakları"
    )

    fun getSummary(): String {
        return "AKREP JARVIS sisteminde toplam ${FEATURES_LIST.size} adet üst düzey özellik ve modül aktif durumdadır."
    }
}
