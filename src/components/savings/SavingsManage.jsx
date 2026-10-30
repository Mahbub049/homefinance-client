import {useCallback,useEffect,useMemo,useState} from 'react';
import api from '../../services/api';
import {getUser} from '../../services/authStorage';
import toast from 'react-hot-toast';
const id=v=>String(v?._id||v?.id||v||'');
const monthNow=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
const taka=v=>`৳ ${Number(v||0).toLocaleString('bn-BD',{maximumFractionDigits:2})}`;
export default function SavingsManage({members=[],accounts=[],onChanged}) {
  const me=getUser();
  const current=members.find(m=>id(m)===id(me?.id||me?._id));
  const sourceAccounts=accounts.filter(a=>a.isActive!==false&&['bank','cash','wallet'].includes(a.type));
  const targetAccounts=accounts.filter(a=>['savings','investment'].includes(a.type));
  const [rules,setRules]=useState([]);
  const [deposits,setDeposits]=useState([]);
  const [expanded,setExpanded]=useState('');
  const [editAccount,setEditAccount]=useState(null);
  const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({paidByUserId:'',fromAccountId:'',toAccountId:'',amount:'',dayOfMonth:'10',startMonth:monthNow(),endMonth:'',note:''});
  const refresh=useCallback(async()=>{
    try {
      const [a,b]=await Promise.all([api.get('/api/savings/auto/rules'),api.get('/api/savings/deposits')]);
      setRules(a.data?.items||[]);setDeposits(b.data?.items||[]);
    } catch(e){toast.error(e?.response?.data?.message||'সঞ্চয়ের নিয়ম বা ইতিহাস আনা যায়নি।');}
  },[]);
  useEffect(()=>{refresh()},[refresh]);
  const memberName=userId=>members.find(m=>id(m)===id(userId))?.name||'—';
  const ownerOf=userId=>{const n=memberName(userId).toLowerCase();return n.includes('mahbub')?'Mahbub':n.includes('mirza')?'Mirza':'Joint'};
  const chosenOwner=ownerOf(form.paidByUserId);
  const owned=account=>account.owner==='Joint'||account.owner===chosenOwner;
  const filteredSource=sourceAccounts.filter(owned),filteredTarget=targetAccounts.filter(a=>a.isActive!==false&&owned(a));
  function startRule(){
    const member=id(current)||id(members[0])||'';
    const owner=ownerOf(member);
    const allowed=a=>a.owner===owner||a.owner==='Joint';
    setForm({paidByUserId:member,fromAccountId:sourceAccounts.find(allowed)?._id||'',toAccountId:targetAccounts.find(allowed)?._id||'',amount:'',dayOfMonth:'10',startMonth:monthNow(),endMonth:'',note:''});
    setExpanded('new');
  }
  async function createRule(e){
    e.preventDefault();if(busy)return;
    try {
      setBusy(true);
      await api.post('/api/savings/auto/rules',{...form,amount:Number(form.amount),dayOfMonth:Number(form.dayOfMonth)});
      toast.success('স্বয়ংক্রিয় সঞ্চয়ের নিয়ম সংরক্ষিত হয়েছে।');setExpanded('');await refresh();
    }catch(e){toast.error(e?.response?.data?.message||'নিয়ম সংরক্ষণ করা যায়নি।');}finally{setBusy(false)}
  }
  async function toggle(rule){
    try{setBusy(true);await api.patch(`/api/savings/auto/rules/${rule._id}`,{active:!rule.active});await refresh();toast.success('নিয়মের অবস্থা পরিবর্তন হয়েছে।')}
    catch(e){toast.error(e?.response?.data?.message||'পরিবর্তন করা যায়নি।')}finally{setBusy(false)}
  }
  async function saveAccount(e){
    e.preventDefault();if(!editAccount?.name?.trim())return;
    try{setBusy(true);await api.put(`/api/accounts/${editAccount._id}`,{name:editAccount.name.trim(),isActive:editAccount.isActive});setEditAccount(null);await onChanged?.();toast.success('সঞ্চয় অ্যাকাউন্টের তথ্য সংরক্ষিত।')}
    catch(e){toast.error(e?.response?.data?.message||'অ্যাকাউন্ট পরিবর্তন করা যায়নি।')}finally{setBusy(false)}
  }
  async function undoDeposit(row){
    if(!window.confirm(`${taka(row.amount)} জমার এন্ট্রি বাতিল করবেন? বাস্তবে ব্যাংক থেকে কোনো টাকা ফেরত পাঠানো হবে না।`))return;
    try{setBusy(true);await api.delete(`/api/savings/deposits/${row._id}`);await refresh();await onChanged?.();toast.success('নতুন সঞ্চয় এন্ট্রি বাতিল হয়েছে।')}
    catch(e){toast.error(e?.response?.data?.message||'এন্ট্রি বাতিল করা যায়নি।')}finally{setBusy(false)}
  }
  const allowedUndo=row=>row.month===monthNow()&&row.month>='2026-10';
  return <section className="hn-savings-manage">
    <div className="hn-savings-manage-head"><div><h2>সঞ্চয় পরিচালনা</h2><p>অ্যাকাউন্ট, মাসিক জমার নিয়ম ও আগের জমা—সব এক জায়গায়</p></div></div>
    <div className="hn-savings-manage-tabs" role="group" aria-label="সঞ্চয় পরিচালনার অংশ">
      {['accounts','auto','history'].map((key,i)=><button key={key} type="button" className={expanded===key?'active':''} onClick={()=>setExpanded(expanded===key?'':key)}>{['অ্যাকাউন্ট সম্পাদনা','মাসিক স্বয়ংক্রিয় জমা','জমার ইতিহাস'][i]}</button>)}
    </div>
    {expanded==='accounts'&&<div className="hn-manage-list">{targetAccounts.map(a=><div key={a._id} className="hn-manage-row"><div><b>{a.name}</b><small>{a.owner==='Mahbub'?'Mahbub':a.owner==='Mirza'?'Mim':'যৌথ'} · {a.type==='savings'?'সঞ্চয়':'বিনিয়োগ'}</small></div><button type="button" onClick={()=>setEditAccount({_id:a._id,name:a.name,isActive:a.isActive!==false})}>সম্পাদনা</button></div>)}</div>}
    {expanded==='auto'&&<><div className="hn-manage-intro"><p>এটি ব্যাংক থেকে টাকা পাঠাবে না; নির্ধারিত দিনে অ্যাপে জমার হিসাব স্বয়ংক্রিয়ভাবে যোগ করবে। অ্যাকাউন্টের প্রকৃত লেনদেন মিলিয়ে নেবেন।</p><button type="button" onClick={startRule}>+ নতুন নিয়ম</button></div><div className="hn-manage-list">{rules.map(r=><div className="hn-manage-row" key={r._id}><div><b>{taka(r.amount)} · প্রতি মাসের {Number(r.dayOfMonth).toLocaleString('bn-BD')} তারিখ</b><small>{accounts.find(a=>id(a)===id(r.fromAccountId))?.name||'অ্যাকাউন্ট'} → {accounts.find(a=>id(a)===id(r.toAccountId))?.name||'সঞ্চয়'} · {memberName(r.paidByUserId)} · {r.active?'চালু':'বন্ধ'}</small></div><button type="button" disabled={busy} onClick={()=>toggle(r)}>{r.active?'বিরতি দিন':'চালু করুন'}</button></div>)}{!rules.length&&<p className="hn-manage-empty">এখনো কোনো মাসিক নিয়ম নেই।</p>}</div></>}
    {expanded==='history'&&<div className="hn-manage-list">{deposits.map(row=><div className="hn-manage-row" key={row._id}><div><b>{taka(row.amount)}</b><small>{new Date(row.date).toLocaleDateString('bn-BD')} · {row.fromAccountId?.name||'—'} → {row.toAccountId?.name||'—'} {row.sourceType==='savings_auto'?'· স্বয়ংক্রিয় হিসাব':''}</small></div>{allowedUndo(row)&&<button type="button" disabled={busy} onClick={()=>undoDeposit(row)}>এন্ট্রি বাতিল</button>}</div>)}{!deposits.length&&<p className="hn-manage-empty">কোনো জমার ইতিহাস নেই।</p>}</div>}
    {expanded==='new'&&<form className="hn-manage-form" onSubmit={createRule}>
      <h3>মাসিক জমার নিয়ম</h3>
      <label>সদস্য<select value={form.paidByUserId} onChange={e=>setForm(f=>({...f,paidByUserId:e.target.value,fromAccountId:'',toAccountId:''}))}>{members.map(m=><option key={id(m)} value={id(m)}>{m.name}</option>)}</select></label>
      <label>কোন অ্যাকাউন্ট থেকে<select value={form.fromAccountId} required onChange={e=>setForm(f=>({...f,fromAccountId:e.target.value}))}><option value="">নির্বাচন করুন</option>{filteredSource.map(a=><option key={a._id} value={a._id}>{a.name}</option>)}</select></label>
      <label>কোন সঞ্চয়ে<select value={form.toAccountId} required onChange={e=>setForm(f=>({...f,toAccountId:e.target.value}))}><option value="">নির্বাচন করুন</option>{filteredTarget.map(a=><option key={a._id} value={a._id}>{a.name}</option>)}</select></label>
      <label>প্রতি মাসে টাকা<input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></label>
      <label>মাসের কত তারিখ<input type="number" min="1" max="31" required value={form.dayOfMonth} onChange={e=>setForm(f=>({...f,dayOfMonth:e.target.value}))}/></label>
      <label>শুরু হবে<input type="month" required min={monthNow()} value={form.startMonth} onChange={e=>setForm(f=>({...f,startMonth:e.target.value}))}/></label>
      <label>শেষ মাস (ঐচ্ছিক)<input type="month" min={form.startMonth} value={form.endMonth} onChange={e=>setForm(f=>({...f,endMonth:e.target.value}))}/></label>
      <label>নোট (ঐচ্ছিক)<input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></label>
      <div className="hn-form-actions"><button type="button" onClick={()=>setExpanded('auto')}>বাতিল</button><button type="submit" disabled={busy}>নিয়ম সংরক্ষণ</button></div>
    </form>}
    {editAccount&&<div className="hn-modal-backdrop" role="presentation"><form className="hn-modal hn-manage-form" onSubmit={saveAccount} role="dialog" aria-modal="true" aria-label="সঞ্চয় অ্যাকাউন্ট সম্পাদনা"><h3>অ্যাকাউন্ট সম্পাদনা</h3><label>অ্যাকাউন্টের নাম<input required value={editAccount.name} onChange={e=>setEditAccount(a=>({...a,name:e.target.value}))}/></label><label className="hn-inline-check"><input type="checkbox" checked={editAccount.isActive} onChange={e=>setEditAccount(a=>({...a,isActive:e.target.checked}))}/> অ্যাকাউন্ট চালু আছে</label><p>পুরোনো লেনদেন থাকলে মালিক, ধরন বা opening balance পরিবর্তন করা যাবে না।</p><div className="hn-form-actions"><button type="button" onClick={()=>setEditAccount(null)}>বাতিল</button><button type="submit" disabled={busy}>সংরক্ষণ</button></div></form></div>}
  </section>;
}
