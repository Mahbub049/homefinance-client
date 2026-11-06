import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const styles = file('src/styles/android-safe-area.css');
const entrypoint = file('src/main.jsx');
const confirm = file('src/components/ui/ConfirmModal.jsx');
const capConfig = JSON.parse(file('capacitor.config.json'));

assert.equal(capConfig.plugins.SystemBars.insetsHandling, 'css', 'Capacitor must provide safe-area CSS insets');
assert.ok(entrypoint.indexOf("./styles/android-safe-area.css") > entrypoint.indexOf("./styles/hishab-final-polish.css"), 'Safe-area overrides must load after older modal styles');
for (const area of ['top', 'right', 'bottom', 'left']) {
  assert.match(styles, new RegExp(`--hn-inset-${area}\\s*:\\s*var\\(--safe-area-inset-${area}`), `${area} inset must support Capacitor`);
  assert.match(styles, new RegExp(`${area}: var\\(--hn-inset-${area}\\) !important`), `${area} must bound fixed overlays`);
}
for (const modal of ['app-modal-overlay', 'app-modal-overlay--center', 'hn-modal-backdrop', 'hn-finance-modal-overlay', 'hn-confirm-modal-overlay']) {
  assert.ok(styles.includes(`.${modal}`), `Missing coverage for ${modal}`);
}
assert.match(styles, /\.app-modal-overlay\s*>\s*\.ledger-modal-panel/);
assert.match(styles, /\.app-modal-overlay\s*>\s*\.ledger-batch-panel/);
assert.match(styles, /\.ledger-batch-panel\s*>\s*main/);
assert.match(styles, /max-height:\s*100%\s*!important/);
assert.match(confirm, /className="hn-confirm-modal-overlay /);
assert.match(confirm, /className="hn-confirm-modal-panel /);
console.log('Android form/modal safe-area source checks passed');
