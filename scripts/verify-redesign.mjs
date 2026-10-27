import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = path.resolve(import.meta.dirname,'..');
const pages = ['Dashboard','Ledger','Fixed','Grocery','EMI','SharedPurchases','Savings','Wallet','CarryForward'];
let checks=0;
function verify(test,msg){assert.ok(test,msg); checks++;}
for(const page of pages){const s=fs.readFileSync(path.join(root,'src/pages',page+'.jsx'),'utf8');verify(s.includes('hf-v2-page') || page==='Dashboard',page+' missing new page scope');verify(s.includes('HFPageLead'),page+' missing common Bengali header');}
const dash=fs.readFileSync(path.join(root,'src/pages/Dashboard.jsx'),'utf8');
verify(dash.includes('hf-v2-feature')&&dash.includes('hf-v2-dashboard-panels'),'Dashboard incomplete');
verify(dash.includes('PieChart')&&dash.includes('LineChart'),'Charts unavailable');
verify(!dash.slice(dash.indexOf('  return (\n    <AppLayout>',dash.indexOf('export default function Dashboard()'))).includes('Living expenses'),'Old visible Living summary retained');
const ledger=fs.readFileSync(path.join(root,'src/pages/Ledger.jsx'),'utf8');verify(ledger.includes('exportTransactionsPdf')&&ledger.includes('openEditModal'),'Ledger edit/export handlers missing');
const emi=fs.readFileSync(path.join(root,'src/pages/EMI.jsx'),'utf8');verify(emi.includes('hf-v2-emi-row')&&emi.includes('generateMonth'),'EMI list/bill action missing');
const shared=fs.readFileSync(path.join(root,'src/pages/SharedPurchases.jsx'),'utf8');verify(shared.includes('hf-v2-shared-facts')&&shared.includes('openPayment(plan, installment)')&&shared.includes('undoPayment(plan, installment)'),'Shared reimbursement buttons missing');
const wallet=fs.readFileSync(path.join(root,'src/pages/Wallet.jsx'),'utf8');verify(wallet.includes('hf-v2-wallet-person')&&wallet.includes('<SettlementCenter'),'Settlement center missing');
const carry=fs.readFileSync(path.join(root,'src/pages/CarryForward.jsx'),'utf8');verify(carry.includes('saveDraft')&&carry.includes('closeMonth'),'Monthly closing actions missing');
const lead=fs.readFileSync(path.join(root,'src/components/design/HFPageLead.jsx'),'utf8');verify(lead.includes('এই পেজ কীভাবে ব্যবহার করবেন')&&lead.includes('এই অঙ্কের অর্থ কী?'),'Help missing');
const main=fs.readFileSync(path.join(root,'src/main.jsx'),'utf8');verify(main.includes('hf-v2-pages.css'),'Stylesheet not imported');
console.log(`${checks} source-contract checks passed. These are NOT browser/database tests.`);
