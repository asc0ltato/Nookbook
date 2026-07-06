type YMapsWindow = Window & {
  ymaps?: {
    ready: (cb: () => void) => void;
    Map: new (el: HTMLElement, opts: object) => { destroy: () => void };
  };
};

let loadPromise: Promise<void> | null = null;

function waitForYmaps(timeoutMs = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      const w = window as YMapsWindow;
      if (w.ymaps && typeof w.ymaps.ready === "function") {
        w.ymaps.ready(() => resolve());
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("Yandex Maps failed to load"));
        return;
      }
      setTimeout(poll, 150);
    };
    poll();
  });
}
      
export function loadYandexMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const w = window as YMapsWindow;

  if (w.ymaps && typeof w.ymaps.ready === "function") {
    return new Promise((resolve) => {
      w.ymaps!.ready(() => resolve());
    });
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
  if (!apiKey) {
    console.warn("Yandex Map API key is not set");
    return Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    const onReady = () => {
      waitForYmaps(12000).then(resolve).catch(reject);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="api-maps.yandex.ru/2.1"]',
    );

    if (existing) {
      if (w.ymaps) {
        onReady();
      } else {
        existing.addEventListener("load", onReady, { once: true });
        existing.addEventListener(
          "error",
          () => {
            waitForYmaps(8000).then(resolve).catch(() => {
              loadPromise = null;
              reject(new Error("Failed to load Yandex Maps script"));
            });
          },
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => {
      waitForYmaps(8000)
        .then(resolve)
        .catch(() => {
          loadPromise = null;
          reject(new Error("Failed to load Yandex Maps script"));
        });
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
