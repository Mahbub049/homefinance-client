import test from 'node:test';
import assert from 'node:assert/strict';
import {rowsForMemberReport} from '../src/utils/memberLedgerExport.js';
const members=[{_id:'m',name:'Mahbub Sarwar'},{_id:'f',name:'Jannatul Ferdous Mirza'}];
const accounts=[{_id:'am',name:'EBL',owner:'Mahbub'},{_id:'af',name:'TBL',owner:'Mirza'},{_id:'j',name:'Joint Account',owner:'Joint'}];
const data=[
 {_id:'1',txType:'income',amount:100,receivedByUserId:'m'},
 {_id:'2',txType:'income',amount:200,receivedByUserId:'f'},
 {_id:'3',txType:'expense',amount:60,paidByUserId:'m',paymentMode:'single',fromAccountId:'am',split:{type:'equal'}},
 {_id:'4',txType:'expense',amount:80,paidByUserId:'f',paymentMode:'single',fromAccountId:'af',split:{type:'equal'}},
 {_id:'5',txType:'expense',amount:70,paymentMode:'split',paymentParts:[{userId:'m',accountId:'am',amount:30},{userId:'f',accountId:'af',amount:40}]},
 {_id:'6',txType:'transfer',amount:500,fromAccountId:'af',toAccountId:'am'},
 {_id:'7',txType:'transfer',amount:100,fromAccountId:'j',toAccountId:'j'},
 {_id:'8',txType:'expense',amount:100,paymentMode:'split',paymentParts:[{userId:'f',accountId:'af',amount:100}],split:{type:'equal'}},
];
test('Mahbub: own income, paid expenses and relevant transfer only',()=>{
 const r=rowsForMemberReport(data,'m',members,accounts);
 assert.deepEqual(r.map(x=>x._id),['1','3','5','6']);
 assert.deepEqual(r.filter(x=>x.txType==='expense').map(x=>x.amount),[60,30]);
});
test('Mirza: no Mahbub income or Mahbub-only payments',()=>{
 const r=rowsForMemberReport(data,'f',members,accounts);
 assert.deepEqual(r.map(x=>x._id),['2','4','5','6','8']);
 assert.equal(r.find(x=>x._id==='5').amount,40);
});
test('Expense-share allocation alone does not become a paid expense',()=>{
 const r=rowsForMemberReport([data[2]],'f',members,accounts);
 assert.equal(r.length,0);
});
test('Joint account transfer without explicit attribution is not attributed to everybody',()=>{
 assert.equal(rowsForMemberReport([data[6]],'m',members,accounts).length,0);
 assert.equal(rowsForMemberReport([data[6]],'f',members,accounts).length,0);
});
test('Explicit sender or recipient of joint-account transfer can appear',()=>{
 const r=rowsForMemberReport([{...data[6],paidByUserId:'m',receivedByUserId:'f'}],'m',members,accounts);
 assert.equal(r.length,1);
});
test('All members includes unmodified complete transactions',()=>{
 const r=rowsForMemberReport(data,'all',members,accounts);
 assert.equal(r.length,8); assert.equal(r.find(x=>x._id==='5').amount,70);
});
test('Unknown user gets no rows',()=> assert.deepEqual(rowsForMemberReport(data,'unknown',members,accounts),[]));
test('Populated references are supported',()=>{
 const r=rowsForMemberReport([{...data[0],receivedByUserId:{_id:'m',name:'Mahbub'}}],'m',members,accounts);
 assert.equal(r.length,1);
});
