import "@testing-library/jest-dom/vitest";

// Mock IntersectionObserver for tests - triggers callback immediately
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options ?? null;
  }
  observe = (target: Element) => {
    // Immediately trigger callback to simulate element being in view
    this.callback?.(
      [
        {
          isIntersecting: true,
          target,
          boundingClientRect: new DOMRect(0, 0, 0, 0),
          intersectionRatio: 1,
          intersectionRect: new DOMRect(0, 0, 0, 0),
          rootBounds: null,
          time: performance.now(),
        } as IntersectionObserverEntry,
      ],
      this,
    );
  };
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
  root = null;
  rootMargin = "";
  scrollMargin = "";
  thresholds = [];
  callback: IntersectionObserverCallback | null = null;
  options: IntersectionObserverInit | null = null;
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock performance.now for animation tests
global.performance = {
  now: () => Date.now(),
} as unknown as Performance;

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(performance.now()), 0);
  return id as unknown as number;
};
global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};