import { defineConfig, devices } from '@playwright/test'

const isCI = Boolean(globalThis.process?.env?.CI)
const useDevServer = Boolean(globalThis.process?.env?.PLAYWRIGHT_USE_DEV)
const port = useDevServer ? 5173 : 4173

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 45_000,
  workers: 1,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: useDevServer
      ? 'npm run dev -- --host 127.0.0.1 --force'
      : 'npm run build && npm run preview -- --host 127.0.0.1',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iphone-13',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
