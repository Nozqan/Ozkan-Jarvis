// Notların kalıcı deposu.
import { kaliciDepo } from "@/ortak/yardimci/kaliciDepo";
import type { Not } from "@/veri/model/tipler";

export const notDeposu = kaliciDepo<Not[]>("akrep.notlar", []);
