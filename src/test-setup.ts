import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Mock IntersectionObserver globally
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: class IntersectionObserver {
    observe(): void {
      // Mock implementation
    }

    unobserve(): void {
      // Mock implementation
    }

    disconnect(): void {
      // Mock implementation
    }
  },
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
