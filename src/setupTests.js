import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom tidak mengimplementasikan method DOM berikut
window.scrollTo = vi.fn();

window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));