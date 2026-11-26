// OpenAI uyumlu (Chat Completions) sağlayıcı. Özel uç nokta ile başka uyumlu servisler de kullanılabilir.
import { basarili, basarisiz, hata } from "@/ortak/hata/hataYardimcilari";
import type { BaglantiDurumu, Sonuc, YapayZekaIstegi, YapayZekaYaniti } from "@/veri/model/tipler";
import { SISTEM_ISTEMI, agHatasi, httpHatasi, ucNoktaTemizle, zamanAsimliFetch, type YapayZekaSaglayici } from "./YapayZekaSaglayici";

export class OpenAiUyumluSaglayici implements YapayZekaSaglayici {
  constructor(
    private ucNokta: string,
    private model: string,
    /** Anahtar yalnızca istek anında şifreli depodan çözülür; bu sınıfta saklanmaz. */
    private anahtarGetir: () => Promise<string | null>,
  ) {}

  async yanitOlustur(istek: YapayZekaIstegi): Promise<Sonuc<YapayZekaYaniti>> {
    const anahtar = await this.anahtarGetir();
    if (!anahtar) return basarisiz(hata("anahtar_yok", "OpenAI uyumlu API anahtarı kayıtlı değil.", "Ayarlar'dan API anahtarınızı ekleyin.", false));
    const mesajlar = [
      { role: "system", content: SISTEM_ISTEMI },
      ...istek.gecmis.slice(-6).map((m) => ({ role: m.rol === "kullanici" ? "user" : "assistant", content: m.metin })),
      { role: "user", content: istek.komut },
    ];
    try {
      const r = await zamanAsimliFetch(`${ucNoktaTemizle(this.ucNokta)}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${anahtar}` },
        body: JSON.stringify({ model: this.model, messages: mesajlar, temperature: 0.5, max_tokens: 450 }),
      });
      if (!r.ok) return basarisiz(httpHatasi(r.status));
      const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const metin = j.choices?.[0]?.message?.content?.trim();
      if (!metin) return basarisiz(hata("bos_yanit", "Servis boş yanıt döndürdü.", "Komutu farklı ifade edip tekrar deneyin."));
      return basarili({ metin, saglayici: "OpenAI uyumlu", model: this.model });
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
      const r = await zamanAsimliFetch(`${ucNoktaTemizle(this.ucNokta)}/models`, { headers: { Authorization: `Bearer ${anahtar}` } }, 12000);
      const gecikmeMs = Math.round(performance.now() - t0);
      if (r.ok) return { kod: "bagli", mesaj: `Bağlantı başarılı (${gecikmeMs} ms)`, gecikmeMs };
      if (r.status === 429) return { kod: "kota", mesaj: "Kota veya istek sınırı aşıldı" };
      return { kod: "bagli_degil", mesaj: httpHatasi(r.status).mesaj };
    } catch (e) {
      return { kod: "bagli_degil", mesaj: agHatasi(e).mesaj };
    }
  }
}
