// Test ortamı (Node) için asgari tarayıcı nesneleri. Testler izin ve ağ durumunu bu nesneler üzerinden simüle eder.
export const sahteNavigator = { onLine: true, userAgent: "vitest" } as { onLine: boolean; userAgent: string };

Object.defineProperty(globalThis, "navigator", { value: sahteNavigator, configurable: true, writable: true });
