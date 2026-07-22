import { chromium } from '@playwright/test';

const OUT = process.env.SHOT_DIR;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

const errors = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (/error|exception|throw|assert/i.test(t)) errors.push(t.slice(0, 500));
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 500)));

await page.goto('http://127.0.0.1:61182/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);
await page.screenshot({ path: `${OUT}/r-boot.png` });

// Bottom tab bar: Settings is the right-most tab. Click bottom-right region.
await page.mouse.click(420 - 45, 900 - 28);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/r-settings.png` });

// Scroll the settings list
await page.mouse.move(210, 500);
await page.mouse.wheel(0, 700);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/r-settings-2.png` });

console.log('CONSOLE ERRORS:', errors.length);
for (const e of errors.slice(0, 12)) console.log('---', e);
await browser.close();
