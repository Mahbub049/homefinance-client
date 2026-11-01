import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const planner=fs.readFileSync(new URL('../src/pages/PlannedPurchases.jsx',import.meta.url),'utf8');
const style=fs.readFileSync(new URL('../src/styles/hishab-planned-buttons-fix.css',import.meta.url),'utf8');
const settings=fs.readFileSync(new URL('../src/styles/member-settings-shopping.css',import.meta.url),'utf8');
const shared=fs.readFileSync(new URL('../src/pages/SharedPurchases.jsx',import.meta.url),'utf8');
test('Planner actions use their own scoped class',()=>{
 assert.match(planner,/className="hn-plan-actions"/);
 assert.doesNotMatch(planner,/className="hn-row-actions"/);
 assert.match(style,/\.hn-planned \.hn-plan-actions button/);
});
test('Planner action buttons never get the global settings 36px rule',()=>{
 assert.doesNotMatch(settings,/(^|})\.hn-row-actions button\s*\{/);
 assert.match(settings,/\.hn-settings-row \.hn-row-actions button/);
 assert.match(style,/width:auto !important/);
 assert.match(style,/white-space:nowrap !important/);
});
test('Planner controls remain visible and reachable',()=>{
 for(const title of ['বিস্তারিত','সম্পাদনা','কেনা হয়েছে']) assert.ok(planner.includes(title));
 assert.match(planner,/aria-label=\{`\$\{item\.productName\} মুছুন`\}/);
});
test('Shared Purchase edit exposes meaningful safe settings',()=>{
 assert.match(shared,/remainingMonths/);assert.match(shared,/reviseSchedule/);
 assert.match(shared,/পরবর্তী কিস্তির দিন/);assert.match(shared,/খরচের খাত/);
 assert.match(shared,/expectedUpdatedAt/);
});
