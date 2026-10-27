import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
test('brand displays হিসাব নিকাশ and retains existing app identifier', () => {
  assert.match(read('index.html'), /<title>হিসাব নিকাশ<\/title>/);
  assert.match(read('src/components/layout/Sidebar.jsx'), /হিসাব নিকাশ/);
  assert.match(read('capacitor.config.json'), /"appId": "com\.mahbub\.homefinance"/);
});
test('dashboard has income, actual spending, living and paid EMI separate', () => {
  const s=read('src/pages/Dashboard.jsx');
  for (const t of ['মোট আয়','মোট খরচ হয়েছে','সাধারণ খরচ','কিস্তি পরিশোধ']) assert.ok(s.includes(t),t);
  assert.ok(s.includes('cashRemaining'));
  assert.ok(s.includes('/api/wallet/summary'));
});
test('wallet preserves managed shared purchase payment workflow', () => {
  const s=read('src/pages/Wallet.jsx');
  assert.ok(s.includes('href="/shared-purchases"'));
  assert.ok(s.includes('mustPaySharedFirst'));
  assert.ok(s.includes('saveSettlement'));
});
test('operational lists are compact with original actions intact', () => {
  for (const [page,token] of [['Fixed','hf-hishab-fixed-list'],['SharedPurchases','hf-hishab-purchase-row'],['Savings','hf-hishab-savings-list']]) assert.ok(read(`src/pages/${page}.jsx`).includes(token),page);
  assert.ok(read('src/pages/Fixed.jsx').includes('openPaymentModalForInstance'));
  assert.ok(read('src/pages/SharedPurchases.jsx').includes('openPayment(plan'));
  assert.ok(read('src/pages/Savings.jsx').includes('openDeposit'));
});
test('ledger list names are Bengali and form actions retained', () => {
  const s=read('src/pages/Ledger.jsx');
  assert.ok(s.includes('if (t === "income") return "আয়"'));
  assert.ok(s.includes('saveTx'));
  assert.ok(s.includes('exportTransactionsPdf'));
});
test('new CSS theme is imported', () => {
  assert.ok(read('src/main.jsx').includes("import './styles/hishab-compact.css'"));
});
