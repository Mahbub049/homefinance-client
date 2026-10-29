import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Accounts from './Accounts';
import api from '../services/api';
import HFIcon from '../components/design/HFIcon';
import '../styles/member-settings-shopping.css';

const sections = [
  {key:'accounts', label:'অ্যাকাউন্ট', note:'ব্যাংক, নগদ, বিকাশ ও সঞ্চয়ের অ্যাকাউন্ট',icon:'wallet'},
  {key:'incomeCats',label:'আয়ের খাত',note:'বেতন ও অন্যান্য আয়ের ধরন',icon:'arrowUp'},
  {key:'expenseCats',label:'খরচের খাত',note:'খাবার, যাতায়াত, বিল ও অন্যান্য',icon:'ledger'},
  {key:'methods',label:'পেমেন্ট পদ্ধতি',note:'নগদ, ব্যাংক, কার্ড বা মোবাইল ব্যাংকিং',icon:'wallet'},
  {key:'shops',label:'বাজারের দোকান',note:'নিয়মিত বাজারের দোকানের নাম',icon:'grocery'},
  {key:'cards',label:'কার্ডের নাম',note:'সংরক্ষিত কার্ডের নাম ও শেষ ৪ সংখ্যা',icon:'emi'},
];
const endpoints = { incomeCats:'/api/categories', expenseCats:'/api/categories', methods:'/api/payment-methods', shops:'/api/grocery-shops',cards:'/api/card-labels' };
const names = (section) => section === 'cards' ? 'label' : 'name';
const getMessage = (e, fallback) => e?.response?.data?.message || fallback;
export default function Settings() {
  const [active,setActive] = useState('accounts');
  const [data,setData] = useState({incomeCats:[],expenseCats:[],methods:[],shops:[],cards:[]});
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [search,setSearch] = useState('');
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:'',label:'',location:'',last4:''});
  const section = sections.find(s=>s.key===active) || sections[0];
  const isCategory = active === 'incomeCats' || active === 'expenseCats';

  const reload = useCallback(async () => {
    if(active==='accounts') return;
    setLoading(true); setError('');
    try {
      const response = await api.get(endpoints[active], {params:isCategory?{kind:active==='incomeCats'?'income':'expense'}:{}});
      setData(prev=>({...prev,[active]:response.data?.items || []}));
    } catch(e){setError(getMessage(e,'তথ্য আনা যায়নি।'));}
    finally{setLoading(false);}
  },[active,isCategory]);
  useEffect(()=>{reload();},[reload]);
  const filtered = useMemo(()=> (data[active]||[]).filter(item=>[item.name,item.label,item.location,item.last4].join(' ').toLowerCase().includes(search.trim().toLowerCase())),[data,active,search]);

  const openForm = (item=null) => {setEditing(item || {});setError('');setForm({name:item?.name||'',label:item?.label||'',location:item?.location||'',last4:item?.last4||''});};
  const save = async (event) => {
    event.preventDefault(); const field = names(active);
    const value = form[field].trim();
    if(!value){setError('একটি নাম লিখুন।');return;}
    setBusy(true);setError('');
    const payload = active==='cards' ? {label:value,last4:form.last4.trim()} : active==='shops' ? {name:value,location:form.location.trim()} : isCategory ? {name:value,kind:active==='incomeCats'?'income':'expense'} : {name:value};
    try {if(editing?._id) await api.put(`${endpoints[active]}/${editing._id}`,payload);else await api.post(endpoints[active],payload);setEditing(null);await reload();}
    catch(e){setError(getMessage(e,'সংরক্ষণ করা যায়নি।'));}finally{setBusy(false);}
  };
  const remove = async item => {
    if(!window.confirm(`“${item.label||item.name}” মুছে ফেলবেন?`))return;
    setBusy(true);setError('');
    try{await api.delete(`${endpoints[active]}/${item._id}`);await reload();}
    catch(e){setError(getMessage(e,'মুছে ফেলা যায়নি।'));}finally{setBusy(false);}
  };
  return <AppLayout><div className="hn-page hn-settings-page">
    <header className="hn-page-head"><div><span className="hn-eyebrow">হিসাব নিকাশ</span><h1>সেটিংস</h1><p>অ্যাকাউন্ট, খরচের খাত ও প্রয়োজনীয় তালিকা পরিচালনা করুন।</p></div></header>
    <div className="hn-settings-layout"><nav className="hn-settings-nav" aria-label="সেটিংস মেনু">{sections.map(s=><button key={s.key} type="button" className={`hn-settings-option ${active===s.key?'is-selected':''}`} onClick={()=>{setActive(s.key);setSearch('');setEditing(null);setError('');}}><span className="hn-setting-icon"><HFIcon name={s.icon} size={19}/></span><span><strong>{s.label}</strong><small>{s.note}</small></span></button>)}</nav>
    <section className="hn-panel hn-settings-content"><div className="hn-panel-head hn-flex-head"><div><h2>{section.label}</h2><p>{section.note}</p></div>{active!=='accounts' && <button className="hn-btn hn-btn-primary" type="button" onClick={()=>openForm()}><HFIcon name="plus" size={17}/> নতুন যোগ করুন</button>}</div>
    {active==='accounts' ? <div className="hn-settings-accounts"><Accounts /></div> : <>
      <div className="hn-settings-search"><HFIcon name="search" size={18}/><input placeholder="তালিকায় খুঁজুন..." aria-label="সেটিংসে খুঁজুন" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {loading && <div className="hn-notice">তালিকা লোড হচ্ছে…</div>}
      {error && <div className="hn-notice hn-error" role="alert">{error}</div>}
      <div className="hn-settings-rows">{!loading && filtered.map(item=><div className="hn-settings-row" key={item._id}><div><strong>{item.label || item.name}</strong>{(active==='shops'||active==='cards') && <small>{active==='shops' ? (item.location || 'লোকেশন দেওয়া নেই') : (item.last4 ? `শেষ ৪ সংখ্যা: ${item.last4}` : 'অতিরিক্ত তথ্য নেই')}</small>}</div><div className="hn-row-actions"><button type="button" title="সম্পাদনা" aria-label="সম্পাদনা" onClick={()=>openForm(item)}><HFIcon name="ledger" size={17}/></button><button type="button" title="মুছুন" aria-label="মুছুন" disabled={busy} onClick={()=>remove(item)} className="hn-danger-action"><HFIcon name="close" size={17}/></button></div></div>)}{!loading && !filtered.length && <div className="hn-empty-inline">এই তালিকায় কিছু পাওয়া যায়নি।</div>}</div>
    </>}
    </section></div>
    {editing && <div className="hn-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null);}}><div className="hn-modal" role="dialog" aria-modal="true" aria-label={editing?._id?'তথ্য সম্পাদনা':'নতুন তথ্য'}><div className="hn-modal-head"><div><span className="hn-eyebrow">{section.label}</span><h2>{editing?._id?'তথ্য পরিবর্তন করুন':'নতুন যোগ করুন'}</h2></div><button type="button" className="hn-icon-btn" aria-label="বন্ধ করুন" onClick={()=>setEditing(null)}><HFIcon name="close" size={19}/></button></div><form onSubmit={save}><label className="hn-field"><span>{active==='cards'?'কার্ডের নাম':'নাম'}</span><input autoFocus value={form[names(active)]} onChange={e=>setForm(prev=>({...prev,[names(active)]:e.target.value}))} placeholder="নাম লিখুন" /></label>{active==='shops'&&<label className="hn-field"><span>লোকেশন (ঐচ্ছিক)</span><input value={form.location} onChange={e=>setForm(prev=>({...prev,location:e.target.value}))}/></label>}{active==='cards'&&<label className="hn-field"><span>শেষ ৪ সংখ্যা (ঐচ্ছিক)</span><input value={form.last4} maxLength={4} inputMode="numeric" onChange={e=>setForm(prev=>({...prev,last4:e.target.value}))}/></label>}{error&&<div role="alert" className="hn-notice hn-error">{error}</div>}<div className="hn-modal-footer"><button type="button" className="hn-btn hn-btn-soft" onClick={()=>setEditing(null)}>বাতিল</button><button type="submit" disabled={busy} className="hn-btn hn-btn-primary">{busy?'সংরক্ষণ হচ্ছে…':'সংরক্ষণ করুন'}</button></div></form></div></div>}
  </div></AppLayout>;
}
