import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/api';
import HFIcon from '../components/design/HFIcon';
import '../styles/member-settings-shopping.css';

const errorText = (error, fallback) => error?.response?.data?.message || fallback;

function ChecklistRow({ item, change, remove, busy }) {
  const [name, setName] = useState(item.name || '');
  const [quantity, setQuantity] = useState(item.quantity || '');
  const [saving, setSaving] = useState(false);
  const edits = useRef({ name: item.name || '', quantity: item.quantity || '' });
  useEffect(()=> { setName(item.name || '');setQuantity(item.quantity || '');edits.current={name:item.name||'',quantity:item.quantity||''}; },[item._id, item.name, item.quantity]);
  const saveField = async (field, value) => {
    const trimmed = value.trim();
    if (edits.current[field] === trimmed) return;
    setSaving(true);
    const success = await change(item._id, {[field]:trimmed});
    if(success) edits.current[field]=trimmed;
    setSaving(false);
  };
  return <article className={`hn-check-row ${item.checked ? 'is-done' : ''}`}>
    <label className="hn-check-box"><input type="checkbox" aria-label={`${item.name||'নতুন পণ্য'} কেনা হয়েছে`} checked={Boolean(item.checked)} onChange={e=>change(item._id,{checked:e.target.checked})} disabled={busy}/><span aria-hidden="true"><HFIcon name="check" size={17}/></span></label>
    <div className="hn-check-fields"><input className="hn-check-name" aria-label="পণ্যের নাম" placeholder="কী কিনবেন?" value={name} maxLength={160} onChange={e=>setName(e.target.value)} onBlur={()=>saveField('name',name)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/><div className="hn-check-sub"><input aria-label="পরিমাণ" placeholder="পরিমাণ (যেমন ২ কেজি)" maxLength={80} value={quantity} onChange={e=>setQuantity(e.target.value)} onBlur={()=>saveField('quantity',quantity)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>{saving&&<span className="hn-saving-indicator">সংরক্ষণ হচ্ছে…</span>}</div></div>
    <button type="button" className="hn-check-remove" aria-label="পণ্যটি মুছুন" title="মুছুন" onClick={()=>remove(item)} disabled={busy}><HFIcon name="close" size={17}/></button>
  </article>;
}

export default function GroceryChecklist(){
  const [items,setItems]=useState([]);
  const [input,setInput]=useState('');
  const [quantity,setQuantity]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const inputRef=useRef(null);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const res=await api.get('/api/grocery-checklist');setItems(res.data?.items||[]);}
    catch(e){setError(errorText(e,'তালিকা আনা যায়নি।'));}finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const add=async(e)=>{
    e?.preventDefault();setBusy(true);setError('');
    try {const res=await api.post('/api/grocery-checklist',{name:input.trim(),quantity:quantity.trim()});setItems(prev=>[...prev,res.data.item]);setInput('');setQuantity('');inputRef.current?.focus();}
    catch(e){setError(errorText(e,'পণ্য যোগ করা যায়নি।'));}finally{setBusy(false);}
  };
  const change=async(id, update)=>{
    const old=items.find(i=>i._id===id);
    if(!old)return false;
    setItems(prev=>prev.map(i=>i._id===id?{...i,...update}:i));
    try{const res=await api.patch(`/api/grocery-checklist/${id}`,update);setItems(prev=>prev.map(i=>i._id===id?res.data.item:i));return true;}
    catch(e){setItems(prev=>prev.map(i=>i._id===id?old:i));setError(errorText(e,'পরিবর্তন সংরক্ষণ হয়নি।'));return false;}
  };
  const remove=async(item)=>{
    setBusy(true);setError('');
    try {await api.delete(`/api/grocery-checklist/${item._id}`);setItems(prev=>prev.filter(i=>i._id!==item._id));}
    catch(e){setError(errorText(e,'পণ্য মুছে ফেলা যায়নি।'));}finally{setBusy(false);}
  };
  const pending=items.filter(i=>!i.checked), done=items.filter(i=>i.checked);
  return <AppLayout><div className="hn-page hn-shopping-page">
    <header className="hn-page-head hn-shopping-page-head"><div><span className="hn-eyebrow">পরিকল্পনা / বাজার</span><h1>বাজারের তালিকা</h1><p>যা যা কিনতে হবে লিখে রাখুন। কেনা হলে টিক দিন—একটাই তালিকা, সবসময় এখানেই থাকবে।</p></div><button type="button" className="hn-btn hn-btn-soft" onClick={load} disabled={loading} aria-label="বাজারের তালিকা রিফ্রেশ করুন"><HFIcon name="refresh" size={17}/> রিফ্রেশ</button></header>
    <div className="hn-shopping-sheet">
      <div className="hn-shopping-top"><div className="hn-shopping-icon-stack"><div className="hn-shopping-roundicon"><HFIcon name="grocery" size={30}/></div><button type="button" className="hn-shopping-mobile-refresh" onClick={load} disabled={loading} aria-label="বাজারের তালিকা রিফ্রেশ করুন" title="তালিকা রিফ্রেশ করুন"><HFIcon name="refresh" size={19}/></button></div><div className="hn-shopping-top-copy"><span className="hn-eyebrow">আপনার চলমান তালিকা</span><h2>পরের বাজারে যা লাগবে</h2><p>দুজনই একই তালিকায় পণ্য যোগ করতে বা চেক করতে পারবেন।</p></div></div>
      <div className="hn-shopping-progress-head"><strong>{pending.length.toLocaleString('bn-BD')}টি কেনা বাকি</strong><span>{done.length.toLocaleString('bn-BD')}টি কেনা হয়েছে</span></div>
      <div className="hn-shopping-progress"><div style={{width:`${items.length ? done.length/items.length*100 : 0}%`}}/></div>
      <form className="hn-shopping-add" onSubmit={add}><div className="hn-shopping-entry"><HFIcon name="plus" size={20}/><input ref={inputRef} aria-label="নতুন পণ্যের নাম" placeholder="পণ্যের নাম (ঐচ্ছিক)" maxLength={160} value={input} onChange={e=>setInput(e.target.value)} /><input aria-label="নতুন পণ্যের পরিমাণ" placeholder="পরিমাণ (ঐচ্ছিক)" maxLength={80} value={quantity} onChange={e=>setQuantity(e.target.value)}/></div><button className="hn-btn hn-btn-primary" type="submit" disabled={busy}>যোগ করুন <HFIcon name="right" size={17}/></button></form>
      {error&&<div className="hn-notice hn-error" role="alert">{error}</div>}
      {loading ? <div className="hn-empty-inline">তালিকা লোড হচ্ছে…</div> : <>
        <div className="hn-check-section-heading"><h3>কিনতে হবে</h3><span>{pending.length.toLocaleString('bn-BD')}</span></div>
        {pending.length ? <div className="hn-check-list">{pending.map(i=><ChecklistRow key={i._id} item={i} change={change} remove={remove} busy={busy}/>)}</div> : <div className="hn-check-empty"><HFIcon name="check" size={26}/><strong>আপাতত কিছু কেনা বাকি নেই!</strong><small>নতুন পণ্য যোগ করতে ওপরের ঘরটি ব্যবহার করুন।</small></div>}
        {done.length>0&&<section className="hn-completed-section"><div className="hn-check-section-heading"><h3>কেনা হয়ে গেছে</h3><span>{done.length.toLocaleString('bn-BD')}</span></div><div className="hn-check-list">{done.map(i=><ChecklistRow key={i._id} item={i} change={change} remove={remove} busy={busy}/>)}</div></section>}
      </>}
      <div className="hn-shopping-note"><HFIcon name="info" size={17}/><span>এটি শুধু কেনাকাটার প্রস্তুতির তালিকা। টিক দিলে আয়-খরচের হিসাবে কোনো টাকা যোগ বা বাদ হবে না। বাজারের খরচ যোগ করতে “বাজার” পেজ ব্যবহার করুন।</span></div>
    </div>
  </div></AppLayout>;
}
