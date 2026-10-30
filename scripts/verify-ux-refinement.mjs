import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..','src');
const read=p=>readFileSync(resolve(root,p),'utf8');
const cases=[
  ['Planner: preserved add/edit/delete and completed flows',()=>{const x=read('pages/PlannedPurchases.jsx');for(const part of ['/api/planned-purchases','mark-bought','mark-planned','api.delete','api.put','api.post','কিনতে হবে','কেনা হয়েছে']) assert(x.includes(part),part)}],
  ['Year Overview: backend route, month table, CSV',()=>{const x=read('pages/YearOverview.jsx');for(const part of ['/api/year-overview','budgetRemaining','netCashflow','text/csv','মাসভিত্তিক হিসাব','বছরের হিসাব'])assert(x.includes(part),part)}],
  ['Grocery: month and exact date, edit and deletion',()=>{const x=read('pages/Grocery.jsx');for(const part of ['filterDate','type="date"','পুরো মাস','আজকের বাজার','openEditModal(t)','deleteTxn(t._id)'])assert(x.includes(part),part)}],
  ['Wallet: purchase explanation appears below individual member cards',()=>{const x=read('pages/Wallet.jsx');const i=x.indexOf('filteredUsers.map((u) => <WalletPersonCard');const j=x.indexOf('বড় কেনাকাটার মাসিক ভাগ দেখুন');const k=x.indexOf('দেনা-পাওনার হিসাব কীভাবে হয়েছে?');assert(i>=0 && j>i && k>j)}],
  ['Dashboard: card UI removed without changing statements API',()=>{const x=read('pages/Dashboard.jsx');assert(!x.includes('<summary>সংরক্ষিত ক্রেডিট কার্ডের বিবরণ</summary>'));assert(x.includes('/api/credit-card-statements/'))}],
  ['Topbar: mobile menu on right rather than before heading',()=>{const x=read('components/layout/Topbar.jsx');assert(x.indexOf('onOpenDrawer &&')>x.indexOf('flex shrink-0 items-center'))}],
  ['Ledger: Bengali print-ready PDF workflow',()=>{const x=read('pages/Ledger.jsx');assert(x.includes("'Nirmala UI'"));assert(x.includes('PDF হিসেবে সংরক্ষণ / প্রিন্ট'));assert(x.includes('window.print()'))}],
  ['Accounts: action buttons in responsive cards rather than clipped table',()=>{const x=read('pages/Accounts.jsx');assert(x.includes('grid grid-cols-1 gap-3 p-3 2xl:grid-cols-2'));assert(x.includes('onClick={() => startEdit(account)}'));assert(x.includes('onClick={() => remove(account._id)}'))}],
  ['Styles imported after existing styles',()=>{const x=read('main.jsx');assert(x.includes("./styles/hishab-page-refinement.css"))}],
];
let failed=0;
for(const [label,check] of cases){try{check();console.log('✓',label)}catch(error){failed++;console.error('✗',label,error.message)}}
console.log(`${cases.length-failed}/${cases.length} source checks passed`);
if(failed)process.exit(1);
