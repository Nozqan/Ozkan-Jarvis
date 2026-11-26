// Ayarlara göre doğru sağlayıcıyı üretir. Yeni sağlayıcı eklemek için buraya bir dal eklemek yeterlidir.
import { anahtarOku } from "@/ayarlar/GuvenliAnahtarDeposu";
import type { Ayarlar } from "@/veri/model/tipler";
import { GeminiSaglayici } from "./GeminiSaglayici";
import { OpenAiUyumluSaglayici } from "./OpenAiUyumluSaglayici";
import type { YapayZekaSaglayici } from "./YapayZekaSaglayici";
import type { YerelKomutMotoru } from "./YerelKomutMotoru";
import { YerelKomutSaglayici } from "./YerelKomutSaglayici";

export function saglayiciOlustur(a: Ayarlar, yerel: YerelKomutMotoru): YapayZekaSaglayici {
  switch (a.saglayici) {
    case "openai":
      return new OpenAiUyumluSaglayici(a.openaiUcNokta, a.openaiModel, () => anahtarOku("openai"));
    case "gemini":
      return new GeminiSaglayici(a.geminiUcNokta, a.geminiModel, () => anahtarOku("gemini"));
    default:
      return new YerelKomutSaglayici(yerel);
  }
}
