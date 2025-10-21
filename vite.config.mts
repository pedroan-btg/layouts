/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig, UserConfig } from 'vite';
import os from 'os';

export default defineConfig((): UserConfig => {
  const totalCPUs = os.cpus().length;
  const maxWorkerCount = Math.floor(totalCPUs * 0.7);
  const isCoverage = process.argv.includes('--coverage');

  return {
    plugins: [angular()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./scripts/vitest/env-setup.cjs', './scripts/vitest/setup-vitest.ts'],
      include: ['src/**/*.spec.ts'],
      reporters: isCoverage
        ? [
            ['default', { summary: false }],
            ['junit', { suiteName: 'Unit Tests', outputFile: './reports/junit-report.xml' }],
          ]
        : ['default'],
      clearMocks: true,
      restoreMocks: true,
      mockReset: true,
      watch: false,
      isolate: true,
      silent: true,
      coverage: {
        all: false,
        reporter: ['text', 'text-summary', 'json', 'lcov'],
        thresholds: {
          perFile: true,
          lines: 85,
          functions: 85,
          branches: 85,
          statements: 85,
        },
      },
      poolOptions: {
        threads: { minThreads: 1, maxThreads: maxWorkerCount },
      },
    },
  };
});
