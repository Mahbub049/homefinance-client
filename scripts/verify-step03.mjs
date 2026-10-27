import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const cwd = new URL('../', import.meta.url);
const get = (file) => fs.readFileSync(new URL(file, cwd), 'utf8');
const pages = ['Dashboard', 'Ledger', 'Fixed', 'Grocery', 'EMI', 'SharedPurchases', 'Savings', 'Wallet', 'CarryForward'];
for (const page of pages) {
  test(`${page}: compact Bengali header, month switching and original page preserved`, () => {
    const source = get(`src/pages/${page}.jsx`);
    assert.match(source, /<HFPageLead /);
    assert.match(source, /month=\{month\} onMonthChange=\{setMonth\}/);
    assert.match(source, /hf-step3-legacy-hero/);
    assert.match(source, /hf-step3-page/);
    assert.match(source, /<AppLayout>/);
    assert.match(source, /onToggleMore=\{/);
  });
}
test('Ledger retains entry, PDF and split-payment flows', () => {
  const source = get('src/pages/Ledger.jsx');
  for(const label of ['exportTransactionsPdf','openModal','Split Payment']){
    assert.ok(source.toLowerCase().includes(label.toLowerCase()), `Missing ${label}`);
  }
});
test('EMI retains bill-generation and actual payment as distinct actions', () => {
 const code=get('src/pages/EMI.jsx');
 for(const str of ['generateSinglePlan','payModalOpen','Confirm Payment']){
   assert.ok(code.includes(str)||code.includes(str==='Confirm Payment'?'পরিশোধ নিশ্চিত করুন':str));
 }
});
test('Dashboard trend includes a full 12 months', () => {
 const route=get('../server/src/routes/dashboard.route.js');
 assert.match(route, /for \(let i = 11; i >= 0; i--\)/);
});
test('Legacy details are hidden visually, without deleting financial forms', () => {
 const stylesheet=get('src/styles/design-system.css');
 assert.match(stylesheet, /hf-step3-advanced \{display:none!important/);
 assert.match(stylesheet, /hf-step3-expanded/);
 assert.ok(get('src/pages/SharedPurchases.jsx').includes('recordPayment'));
 assert.ok(get('src/pages/CarryForward.jsx').includes('saveEdit'));
});
