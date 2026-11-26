// Hatırlatıcıların kalıcı deposu.
import { kaliciDepo } from "@/ortak/yardimci/kaliciDepo";
import type { Hatirlatici } from "@/veri/model/tipler";

export const hatirlaticiDeposu = kaliciDepo<Hatirlatici[]>("akrep.hatirlaticilar", []);
