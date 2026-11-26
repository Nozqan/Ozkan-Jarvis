import { asciiyeCevir } from "@/gorev_merkezi/HesapMakinesi";
import { zamanAsimliFetch } from "./YapayZekaSaglayici";

export type CanliBilgiIstegi =
  | { tur: "hava"; sehir: string }
  | { tur: "arama"; sorgu: string };

export function canliBilgiIstegiAl(komut: string): CanliBilgiIstegi | null {
  const normal = asciiyeCevir(komut);
  if (/\b(hava\s*(?:durum\w*|nasil\w*|kac\w*)|sicaklik|yagmur)\b/.test(normal)) {
    const sehir = komut
      .replace(/\b(jarvis|akrep|hava|durumu|durumunu|nasil|nasıl|kac|kaç|derece|sicaklik|sıcaklık|yagmur|yağmur|bugun|bugün|su an|şu an|bana|soyle|söyle|lütfen)\b/gi, " ")
      .replace(/(?:'da|'de|'ta|'te)\b/gi, "")
      .replace(/[?!,.:;]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { tur: "hava", sehir };
  }
  const arama = normal.match(/(?:^|\s)(?:internetten|internette|webde|google'da)\s+ara\s+(.+)$/);
  if (arama?.index !== undefined) {
    const sorguBaslangici = arama.index + arama[0].lastIndexOf(arama[1]);
    return { tur: "arama", sorgu: komut.slice(sorguBaslangici).trim() };
  }
  return null;
}

function havaDurumuAdi(kod: number): string {
  if (kod === 0) return "açık";
  if (kod === 1) return "çoğunlukla açık";
  if (kod === 2) return "parçalı bulutlu";
  if (kod === 3) return "kapalı";
  if (kod >= 45 && kod <= 48) return "sisli";
  if (kod >= 51 && kod <= 57) return "çiseli";
  if (kod >= 61 && kod <= 67) return "yağmurlu";
  if (kod >= 71 && kod <= 77) return "karlı";
  if (kod >= 80 && kod <= 82) return "sağanak yağışlı";
  if (kod === 85 || kod === 86) return "kar sağanaklı";
  if (kod === 95 || kod === 96 || kod === 99) return "gök gürültülü fırtınalı";
  return "durum bilgisi yok";
}

async function havaBilgisiAl(sehir: string): Promise<string> {
  if (!sehir) return "Hangi şehir için hava durumunu öğrenmek istersiniz? Örneğin: Ankara hava durumu.";
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.search = new URLSearchParams({ name: sehir, count: "1", language: "tr", format: "json" }).toString();
  const geoResponse = await zamanAsimliFetch(geoUrl.toString(), {}, 10_000);
  if (!geoResponse.ok) throw new Error("Hava durumu için şehir bilgisi alınamadı.");
  const geo = await geoResponse.json() as { results?: { name: string; latitude: number; longitude: number; country?: string }[] };
  const yer = geo.results?.[0];
  if (!yer) return `${sehir} için şehir bulunamadı. Şehir adını kontrol edip tekrar deneyin.`;

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.search = new URLSearchParams({
    latitude: String(yer.latitude),
    longitude: String(yer.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    timezone: "auto",
  }).toString();
  const weatherResponse = await zamanAsimliFetch(weatherUrl.toString(), {}, 10_000);
  if (!weatherResponse.ok) throw new Error("Hava durumu servisi yanıt vermedi.");
  const hava = await weatherResponse.json() as {
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };
  const c = hava.current;
  if (!c || typeof c.temperature_2m !== "number" || typeof c.weather_code !== "number") {
    throw new Error("Hava durumu servisi geçerli bir güncel ölçüm döndürmedi.");
  }
  return `${yer.name}${yer.country ? `, ${yer.country}` : ""} için güncel hava: ${c.temperature_2m} °C, ${havaDurumuAdi(c.weather_code)}.` +
    `${typeof c.apparent_temperature === "number" ? ` Hissedilen ${c.apparent_temperature} °C.` : ""}` +
    `${typeof c.relative_humidity_2m === "number" ? ` Nem %${c.relative_humidity_2m}.` : ""}` +
    `${typeof c.wind_speed_10m === "number" ? ` Rüzgâr ${c.wind_speed_10m} km/sa.` : ""} Kaynak: Open-Meteo.`;
}

function metniTemizle(html: string): string {
  if (typeof DOMParser !== "undefined") {
    return new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() ?? "";
  }
  return html.replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

async function wikipediaAra(sorgu: string): Promise<string> {
  if (!sorgu) return "İnternette ne aramamı istersiniz? Örneğin: İnternetten ara güneş sistemi.";
  const url = new URL("https://tr.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: sorgu,
    srlimit: "3",
    format: "json",
    origin: "*",
  }).toString();
  const response = await zamanAsimliFetch(url.toString(), {}, 10_000);
  if (!response.ok) throw new Error("Wikipedia arama servisi yanıt vermedi.");
  const data = await response.json() as { query?: { search?: { title: string; snippet: string }[] } };
  const results = data.query?.search ?? [];
  if (!results.length) return `"${sorgu}" için Wikipedia'da sonuç bulunamadı.`;
  return `Wikipedia arama sonuçları: ${results.map((r, i) => `${i + 1}. ${r.title}: ${metniTemizle(r.snippet)}`).join(" ")} Kaynak: Türkçe Wikipedia.`;
}

export async function canliBilgiGetir(istek: CanliBilgiIstegi): Promise<string> {
  return istek.tur === "hava" ? havaBilgisiAl(istek.sehir) : wikipediaAra(istek.sorgu);
}
