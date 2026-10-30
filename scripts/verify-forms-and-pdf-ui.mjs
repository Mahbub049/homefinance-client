/** Read-only source checks for Hishab Nikash UX correction. No API/database calls. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
 ['mobile-only drawer',()=>assert.match(get('src/components/layout/Topbar.jsx'),/md:hidden.*onOpenDrawer/)],
 ['PDF selection in header',()=>assert.match(get('src/pages/Ledger.jsx'),/extraBefore=\{<label className="hn-pagelead-pdf-select"/)],
 ['PDF uses independent filtered rows',()=>assert.match(get('src/pages/Ledger.jsx'),/allItems\.filter\(participated\)/)],
 ['ledger form 2 columns',()=>assert.match(get('src/pages/Ledger.jsx'),/hn-ledger-form-grid/)],
 ['fixed template form',()=>assert.match(get('src/pages/Fixed.jsx'),/hn-fixed-template-fields/)],
 ['savings deposit form',()=>assert.match(get('src/pages/Savings.jsx'),/hn-savings-deposit-grid/)],
 ['savings inline edit action',()=>assert.match(get('src/pages/Savings.jsx'),/hn-account-inline-edit/)],
 ['EMI direct edit control',()=>assert.match(get('src/pages/EMI.jsx'),/onClick=\{\(\)=>onEdit\(plan\)\}>সম্পাদনা/)],
 ['EMI confirm deletion dialog',()=>assert.match(get('src/pages/EMI.jsx'),/role="alertdialog"/)],
 ['shared purchase metadata dialog',()=>assert.match(get('src/pages/SharedPurchases.jsx'),/hn-shared-edit-form/)],
 ['planned actions remain grouped',()=>assert.match(get('src/pages/PlannedPurchases.jsx'),/role="group" aria-label=\{`\$\{item\.productName\}/)],
 ['new Bengali login',()=>assert.match(get('src/pages/Login.jsx'),/আপনার হিসাবে প্রবেশ করুন/)],
 ['refinement styles imported',()=>assert.match(get('src/main.jsx'),/hishab-final-polish\.css/)],
];
for(const [name,fn] of checks){fn();console.log('PASS',name);}
console.log(`${checks.length} read-only UI source checks passed.`);
