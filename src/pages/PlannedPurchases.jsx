import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/api';
import '../styles/hishab-page-refinement.css';

const emptyForm = {
  productName: '', expectedPrice: '', category: '', brand: '', notes: '', productLink: '',
  priority: 'medium', ownershipType: 'shared', personalForUserId: '', paymentMode: 'undecided',
};
const priorityNames = { high: 'জরুরি', medium: 'মাঝারি', low: 'পরে কেনা যাবে' };
const paymentNames = { cash: 'একবারে', emi: 'কিস্তিতে', either: 'যেকোনোভাবে', undecided: 'ঠিক হয়নি' };
const currency = n => `৳ ${Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 2 })}`;
const normalId = v => String(v?._id || v?.id || v || '');

export default function PlannedPurchases() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('planned');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setMessage('');
      const [a, m] = await Promise.all([api.get('/api/planned-purchases'), api.get('/api/family/members')]);
      setItems(Array.isArray(a.data?.items) ? a.data.items : []);
      setMembers(Array.isArray(m.data?.members) ? m.data.members : []);
    } catch (err) { setMessage(err?.response?.data?.message || 'তথ্য লোড করা যাচ্ছে না।'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!open) return; const onKey = e => { if (e.key === 'Escape' && !busy) setOpen(false); }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open, busy]);

  const active = useMemo(() => items.filter(x => x.status === 'planned'), [items]);
  const purchased = useMemo(() => items.filter(x => x.status === 'bought'), [items]);
  const shown = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (tab === 'planned' ? active : purchased)
      .filter(x => priority === 'all' || x.priority === priority)
      .filter(x => !search || [x.productName, x.category, x.brand, x.notes].some(v => String(v || '').toLowerCase().includes(search)))
      .sort((a, b) => tab === 'planned' ? (a.sortOrder || 0) - (b.sortOrder || 0) : new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [active, purchased, query, priority, tab]);
  const estimated = active.reduce((sum, x) => sum + Number(x.expectedPrice || 0), 0);
  const memberName = id => members.find(m => normalId(m) === normalId(id))?.name || 'ব্যক্তিগত';

  function edit(item) {
    setEditing(item._id);
    setForm({ ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).map(k => [k, item[k] ?? emptyForm[k]])), expectedPrice: String(item.expectedPrice ?? '') });
    setFormError(''); setOpen(true);
  }
  function add() { setEditing(null); setForm({ ...emptyForm }); setFormError(''); setOpen(true); }
  async function save(e) {
    e.preventDefault();
    if (!form.productName.trim()) { setFormError('কেনাকাটার নাম লিখুন।'); return; }
    if (form.expectedPrice !== '' && (!Number.isFinite(Number(form.expectedPrice)) || Number(form.expectedPrice) < 0)) { setFormError('সঠিক সম্ভাব্য দাম লিখুন।'); return; }
    if (form.ownershipType === 'personal' && !form.personalForUserId) { setFormError('কার জন্য কিনবেন, সেটি বাছুন।'); return; }
    try {
      setBusy(true); setFormError('');
      const payload = {
        ...form, productName: form.productName.trim(), expectedPrice: Number(form.expectedPrice || 0),
        category: form.category.trim(), brand: form.brand.trim(), notes: form.notes.trim(), productLink: form.productLink.trim(),
        personalForUserId: form.ownershipType === 'personal' ? form.personalForUserId : null, status: 'planned',
      };
      if (editing) await api.put(`/api/planned-purchases/${editing}`, payload);
      else await api.post('/api/planned-purchases', payload);
      setOpen(false); await load(); setMessage('তালিকা সংরক্ষিত হয়েছে।');
    } catch (err) { setFormError(err?.response?.data?.message || 'সংরক্ষণ করা যায়নি।'); }
    finally { setBusy(false); }
  }
  async function act(item, type) {
    const messages = { delete: 'এই কেনাকাটাটি তালিকা থেকে মুছে ফেলবেন?', bought: 'কেনা হয়েছে হিসেবে চিহ্নিত করবেন?', planned: 'আবার কেনার তালিকায় ফেরত আনবেন?' };
    if (!window.confirm(messages[type])) return;
    try {
      setBusy(true);
      if (type === 'delete') await api.delete(`/api/planned-purchases/${item._id}`);
      else await api.patch(`/api/planned-purchases/${item._id}/${type === 'bought' ? 'mark-bought' : 'mark-planned'}`);
      await load();
    } catch (err) { setMessage(err?.response?.data?.message || 'কাজটি করা যায়নি।'); }
    finally { setBusy(false); }
  }
  const change = (k, v) => setForm(p => ({ ...p, [k]: v, ...(k === 'ownershipType' && v !== 'personal' ? { personalForUserId: '' } : {}) }));

  return <AppLayout>
    <div className="hn-page hn-planned">
      <header className="hn-page-header">
        <div><span className="hn-kicker">পরিকল্পনা</span><h1>পরিকল্পিত কেনাকাটা</h1><p>কী কিনবেন, কত টাকা লাগতে পারে—সব এক জায়গায় রাখুন।</p></div>
        <button type="button" className="hn-btn hn-btn-primary" onClick={add}>＋ নতুন পরিকল্পনা</button>
      </header>
      {message && <div role="status" className="hn-notice">{message}</div>}
      <div className="hn-plan-overview">
        <div><span>কেনার তালিকায়</span><strong>{active.length.toLocaleString('bn-BD')}টি</strong></div>
        <div><span>আনুমানিক মোট দাম</span><strong>{currency(estimated)}</strong></div>
        <div><span>কেনা হয়েছে</span><strong>{purchased.length.toLocaleString('bn-BD')}টি</strong></div>
      </div>
      <section className="hn-surface hn-plan-section">
        <div className="hn-plan-toolbar">
          <div className="hn-tabs" role="tablist" aria-label="কেনাকাটার ধরন">
            <button type="button" role="tab" aria-selected={tab === 'planned'} className={tab === 'planned' ? 'active' : ''} onClick={() => setTab('planned')}>কিনতে হবে <span>{active.length}</span></button>
            <button type="button" role="tab" aria-selected={tab === 'bought'} className={tab === 'bought' ? 'active' : ''} onClick={() => setTab('bought')}>কেনা হয়েছে <span>{purchased.length}</span></button>
          </div>
          <div className="hn-plan-filters">
            <input aria-label="কেনাকাটা খুঁজুন" placeholder="নাম বা খাত দিয়ে খুঁজুন…" value={query} onChange={e => setQuery(e.target.value)}/>
            <select aria-label="অগ্রাধিকার" value={priority} onChange={e => setPriority(e.target.value)}><option value="all">সব অগ্রাধিকার</option><option value="high">জরুরি</option><option value="medium">মাঝারি</option><option value="low">পরে</option></select>
          </div>
        </div>
        {loading ? <div className="hn-empty">তালিকা আসছে…</div> : !shown.length ? <div className="hn-empty"><b>{tab === 'planned' ? 'এখন কেনার কোনো পরিকল্পনা নেই' : 'এখনও কোনো কেনাকাটা সম্পন্ন হয়নি'}</b><p>প্রয়োজনে উপরের খোঁজার শর্ত বদলান।</p></div> :
          <div className="hn-plan-list">{shown.map(item => <article className="hn-plan-row" key={item._id}>
            <div className="hn-plan-ident"><span className={`hn-priority-dot ${item.priority || 'medium'}`}/><div className="hn-plan-copy"><h2>{item.productName}</h2><p>{[item.brand, item.category].filter(Boolean).join(' · ') || 'কেনাকাটার পরিকল্পনা'}</p></div></div>
            <div className="hn-plan-price"><small>আনুমানিক দাম</small><strong>{currency(item.expectedPrice)}</strong></div>
            <span className={`hn-priority-pill ${item.priority || 'medium'}`}>{priorityNames[item.priority] || 'মাঝারি'}</span>
            <div className="hn-row-actions" role="group" aria-label={`${item.productName} পরিবর্তন`}>
              <button type="button" className="hn-btn hn-btn-light" onClick={() => setDetailId(detailId === item._id ? null : item._id)}>{detailId === item._id ? 'বন্ধ' : 'বিস্তারিত'}</button>
              {tab === 'planned' ? <><button type="button" className="hn-btn hn-btn-light" onClick={() => edit(item)}>সম্পাদনা</button><button type="button" className="hn-btn hn-btn-primary" disabled={busy} onClick={() => act(item, 'bought')}>কেনা হয়েছে</button></> : <button type="button" className="hn-btn hn-btn-light" disabled={busy} onClick={() => act(item, 'planned')}>ফিরিয়ে আনুন</button>}
              <button type="button" className="hn-icon-danger" disabled={busy} onClick={() => act(item, 'delete')} aria-label={`${item.productName} মুছুন`} title="মুছুন">×</button>
            </div>
            {detailId === item._id && <div className="hn-plan-detail"><span>কার জন্য: {item.ownershipType === 'personal' ? memberName(item.personalForUserId) : 'দুজনের'}</span><span>পরিশোধ: {paymentNames[item.paymentMode] || 'ঠিক হয়নি'}</span>{item.notes && <p>{item.notes}</p>}{item.productLink && /^https?:\/\//i.test(item.productLink) && <a href={item.productLink} target="_blank" rel="noopener noreferrer">পণ্যের লিংক খুলুন ↗</a>}</div>}
          </article>)}</div>}
      </section>
      {open && <div className="hn-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
        <div className="hn-modal" role="dialog" aria-modal="true" aria-labelledby="planned-modal-title">
          <header><div><span className="hn-kicker">পরিকল্পনা</span><h2 id="planned-modal-title">{editing ? 'পরিকল্পনা সম্পাদনা' : 'নতুন কেনাকাটা'}</h2></div><button type="button" className="hn-close" onClick={() => setOpen(false)} aria-label="বন্ধ করুন">×</button></header>
          <form onSubmit={save} className="hn-plan-form">
            <label className="hn-full">পণ্যের নাম *<input value={form.productName} onChange={e => change('productName', e.target.value)} required placeholder="যেমন: নতুন মনিটর"/></label>
            <label>সম্ভাব্য দাম<input type="number" min="0" step="0.01" value={form.expectedPrice} onChange={e => change('expectedPrice', e.target.value)} placeholder="৳ ০"/></label>
            <label>অগ্রাধিকার<select value={form.priority} onChange={e => change('priority', e.target.value)}><option value="high">জরুরি</option><option value="medium">মাঝারি</option><option value="low">পরে কেনা যাবে</option></select></label>
            <label>খাত<input value={form.category} onChange={e => change('category', e.target.value)} placeholder="যেমন: ইলেকট্রনিক্স"/></label>
            <label>ব্র্যান্ড<input value={form.brand} onChange={e => change('brand', e.target.value)} placeholder="ঐচ্ছিক"/></label>
            <label>কার জন্য<select value={form.ownershipType} onChange={e => change('ownershipType', e.target.value)}><option value="shared">দুজনের</option><option value="personal">ব্যক্তিগত</option></select></label>
            <label>কীভাবে কিনবেন<select value={form.paymentMode} onChange={e => change('paymentMode', e.target.value)}><option value="undecided">এখনও ঠিক হয়নি</option><option value="cash">একবারে</option><option value="emi">কিস্তিতে</option><option value="either">যেকোনোভাবে</option></select></label>
            {form.ownershipType === 'personal' && <label className="hn-full">সদস্য<select value={form.personalForUserId} onChange={e => change('personalForUserId', e.target.value)} required><option value="">সদস্য বাছুন</option>{members.map(m => <option key={normalId(m)} value={normalId(m)}>{m.name}</option>)}</select></label>}
            <details className="hn-full"><summary>অতিরিক্ত তথ্য (ঐচ্ছিক)</summary><div className="hn-plan-form-extra"><label>পণ্যের লিংক<input value={form.productLink} onChange={e => change('productLink', e.target.value)}/></label><label>নোট<textarea value={form.notes} onChange={e => change('notes', e.target.value)} rows="3"/></label></div></details>
            {formError && <p className="hn-full hn-error" role="alert">{formError}</p>}
            <footer className="hn-full"><button type="button" className="hn-btn hn-btn-light" disabled={busy} onClick={() => setOpen(false)}>বাতিল</button><button type="submit" className="hn-btn hn-btn-primary" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : editing ? 'পরিবর্তন সংরক্ষণ' : 'তালিকায় যোগ করুন'}</button></footer>
          </form>
        </div>
      </div>}
    </div>
  </AppLayout>;
}
