// Google Gemini (generateContent) sağlayıcısı. Anahtar URL'ye değil başlığa (x-goog-api-key) konur; böylece adres/loglara sızmaz.
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { BaglantiDurumu, Sonuc, YapayZekaIstegi, YapayZekaYaniti } from "@/veri/model/tipler";
import { SISTEM_ISTEMI, agHatasi, httpHatasi, ucNoktaTemizle, zamanAsimliFetch, type YapayZekaSaglayici } from "./YapayZekaSaglayici";

export class GeminiSaglayici implements YapayZekaSaglayici {
  constructor(
    private ucNokta: string,
    private model: string,
    private anahtarGetir: () => Promise<string | null>,
  ) {}

  async yanitOlustur(istek: YapayZekaIstegi): Promise<Sonuc<YapayZekaYaniti>> {
    const anahtar = await this.anahtarGetir();
    if (!anahtar) return basarisiz(hata("anahtar_yok", "Gemini API anahtarı kayıtlı değil.", "Ayarlar'dan API anahtarınızı ekleyin.", false));
    const icerik = [
      ...istek.gecmis.slice(-6).map((m) => ({ role: m.rol === "kullanici" ? "user" : "model", parts: [{ text: m.metin }] })),
      { role: "user", parts: [{ text: istek.komut }] },
    ];
    try {
      const r = await zamanAsimliFetch(`${ucNoktaTemizle(this.ucNokta)}/models/${encodeURIComponent(this.model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": anahtar },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEM_ISTEMI }] },
          contents: icerik,
          generationConfig: { temperature: 0.5, maxOutputTokens: 450 },
        }),
      });
      if (!r.ok) return basarisiz(httpHatasi(r.status));
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const metin = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      if (!metin) return basarisiz(hata("bos_yanit", "Servis yanıt üretmedi (içerik filtresi olabilir).", "Komutu farklı ifade edip tekrar deneyin."));
      return basarili({ metin, saglayici: "Gemini", model: this.model });
    } catch (e) {
      return basarisiz(agHatasi(e));
    }
  }

  async baglantiKontrolu(): Promise<BaglantiDurumu> {
    if (!navigator.onLine) return { kod: "cevrimdisi", mesaj: "İnternet bağlantısı yok" };
    const anahtar = await this.anahtarGetir();
    if (!anahtar) return { kod: "anahtar_yok", mesaj: "API anahtarı kayıtlı değil" };
    try {
      const t0 = performance.now();
      const r = await zamanAsimliFetch(
        `${ucNoktaTemizle(this.ucNokta)}/models/${encodeURIComponent(this.model)}`,
        { headers: { "x-goog-api-key": anahtar } },
        12000,
      );
      const gecikmeMs = Math.round(performance.now() - t0);
      if (r.ok) return { kod: "bagli", mesaj: `Bağlantı başarılı (${gecikmeMs} ms)`, gecikmeMs };
      if (r.status === 429) return { kod: "kota", mesaj: "Kota veya istek sınırı aşıldı" };
      return { kod: "bagli_degil", mesaj: httpHatasi(r.status).mesaj };
    } catch (e) {
      return { kod: "bagli_degil", mesaj: agHatasi(e).mesaj };
    }
  }
}
