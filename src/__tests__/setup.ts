// Test environment setup.
//
// Previously this file hand-rolled a single `toBeInTheDocument` matcher with a
// `declare global namespace Vi` block. That declaration did not register with
// the installed Vitest version, which is what produced 147 TS2339
// "Property 'toBeInTheDocument' does not exist" errors across the suite.
// The real @testing-library/jest-dom package registers all matchers properly.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does not implement matchMedia.
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      addListener: () => {},
      removeListener: () => {},
      matches: false,
    } as any;
  };

afterEach(() => cleanup());
