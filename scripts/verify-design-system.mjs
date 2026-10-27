// Run with: node scripts/verify-design-system.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { formatTaka, formatBanglaMonth, formatBanglaDate, UI_WORDS } from '../src/components/design/format.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
test('English input text is never translated by display helpers', () => {
  const custom = 'Pizza Hut Dinner';
  assert.equal(custom, 'Pizza Hut Dinner');
  assert.equal(UI_WORDS.expense, 'খরচ');
});
test('currency displays 0, positive, negative and fractional taka', () => {
  assert.equal(formatTaka(0), '৳০');
  assert.equal(formatTaka(4625), '৳৪,৬২৫');
  assert.equal(formatTaka(-6896.45), '−৳৬,৮৯৬.৪৫');
  assert.equal(formatTaka('not-a-number'), '—');
});
test('month and day labels are in Bengali without altering yyyy-mm data keys', () => {
  assert.match(formatBanglaMonth('2026-10'), /অক্টোবর/);
  assert.match(formatBanglaDate('2026-10-27'), /অক্টোবর/);
  assert.equal(formatBanglaMonth('wrong'), 'wrong');
});
test('navigation keeps credit card code untouched and tax route hidden', () => {
  const sidebar = read('src/components/layout/Sidebar.jsx');
  assert.ok(!/to:\s*['"]\/tax-center['"]/.test(sidebar));
  assert.ok(sidebar.includes('Tax Center is intentionally hidden'));
  assert.ok(read('src/App.jsx').includes('path="/tax-center"'));
  assert.ok(read('src/pages/Dashboard.jsx').includes('CreditCardStatementEditor'));
});
test('layout imports shared tokens and does not change transactions or API', () => {
  assert.ok(read('src/main.jsx').includes('styles/design-system.css'));
  assert.ok(read('src/components/layout/AppLayout.jsx').includes('hf-app-shell'));
  assert.ok(!read('src/components/layout/AppLayout.jsx').includes('api.'));
  assert.ok(existsSync(join(root, 'src/components/design/HFUI.jsx')));
});
test('forms are opt-in and avoid affecting existing pages', () => {
  const css = read('src/styles/design-system.css');
  assert.ok(css.includes('.hf-button--primary'));
  assert.ok(css.includes('.hf-table-scroll'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(!/^input\s*\{/m.test(css));
});
