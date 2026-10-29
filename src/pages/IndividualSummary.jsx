import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/api';
import HFIcon from '../components/design/HFIcon';
import '../styles/member-settings-shopping.css';

const monthToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };
const money = (n) => `৳ ${Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
const monthLabel = (month) => {
  const [year, m] = String(month).split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
};
const niceDate = (date) => date ? new Date(date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) : '';

export default function IndividualSummary() {
  const [month, setMonth] = useState(monthToday);
  const [report, setReport] = useState(null);
  const [userId, setUserId] = useState('');
  const [limitText, setLimitText] = useState('10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/api/individual-summary', { params: { month, topLimit: 100 } });
      const next = response.data?.data;
      setReport(next || null);
      setUserId((previous) => next?.users?.some((u) => String(u.userId) === String(previous)) ? previous : String(next?.users?.[0]?.userId || ''));
    } catch (e) {
      setError(e?.response?.data?.message || 'সদস্যের হিসাব আনা যায়নি। আবার চেষ্টা করুন।');
    } finally { setLoading(false); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const users = report?.users || [];
  const current = users.find((user) => String(user.userId) === String(userId)) || users[0];
  const summary = current?.summary || {};
  const categories = current?.categoryBreakdown || [];
  const numberRequested = Math.max(1, Math.min(100, Number.parseInt(limitText, 10) || 10));
  const expenses = useMemo(() => (current?.topExpenses || []).filter((expense) => {
    const query = filter.trim().toLowerCase();
    return !query || [expense.note, expense.category, expense.typeLabel, expense.paidBy].some((v) => String(v || '').toLowerCase().includes(query));
  }).slice(0, numberRequested), [current, filter, numberRequested]);
  const highest = categories[0];
  const maxCategory = Math.max(1, ...categories.map(c => Number(c.amount || 0)));

  return <AppLayout>
    <div className="hn-page hn-member-page">
      <header className="hn-page-head">
        <div><span className="hn-eyebrow">হিসাব নিকাশ / ব্যক্তিগত হিসাব</span><h1>সদস্যভিত্তিক হিসাব</h1><p>কার আয় কত, খরচ কোথায় বেশি এবং সবচেয়ে বড় খরচগুলো এক জায়গায়।</p></div>
        <div className="hn-actions"><label className="hn-date-field"><HFIcon name="calendar" size={17}/><input aria-label="মাস বেছে নিন" type="month" value={month} onChange={e=>setMonth(e.target.value)} /></label><button className="hn-btn hn-btn-soft" type="button" onClick={load} title="হিসাব নতুন করে আনুন"><HFIcon name="refresh" size={17}/> <span>রিফ্রেশ</span></button></div>
      </header>
      <nav className="hn-member-tabs" aria-label="সদস্য বেছে নিন">
        {users.map(u => <button type="button" className={`hn-member-tab ${String(current?.userId) === String(u.userId) ? 'is-selected' : ''}`} key={u.userId} onClick={()=>setUserId(String(u.userId))}>
          <span className="hn-avatar">{(u.name || 'স').trim().charAt(0)}</span><span className="hn-tab-name">{u.name}</span>
        </button>)}
      </nav>
      {loading && <div className="hn-notice">হিসাব লোড হচ্ছে…</div>}
      {error && <div className="hn-notice hn-error" role="alert">{error}</div>}
      {!loading && !current && <div className="hn-empty"><HFIcon name="individual" size={32}/><strong>এই মাসে কোনো সদস্যের হিসাব পাওয়া যায়নি।</strong></div>}
      {current && <>
        <div className="hn-mini-heading"><div><strong>{current.name}</strong><span>{monthLabel(month)}-এর হিসাব</span></div></div>
        <section className="hn-stats-grid" aria-label="ব্যক্তিগত মাসিক সারসংক্ষেপ">
          <div className="hn-stat hn-stat-accent"><small>এই মাসে আয়</small><strong>{money(summary.income)}</strong><span>এই সদস্যের নামে রেকর্ড করা আয়</span></div>
          <div className="hn-stat"><small>নিজের খরচের ভাগ</small><strong>{money(summary.spent)}</strong><span>সাধারণ খরচ ও নির্ধারিত বড় কেনাকাটার ভাগ</span></div>
          <div className="hn-stat"><small>নিজে পরিশোধ করেছেন</small><strong>{money(summary.paid)}</strong><span>নিয়মিত খরচের জন্য নিজের অ্যাকাউন্ট থেকে দেওয়া</span></div>
          <div className="hn-stat"><small>এই মাসে টাকার পরিবর্তন</small><strong className={Number(summary.monthlyCashRemaining || 0) < 0 ? 'hn-negative' : 'hn-positive'}>{money(summary.monthlyCashRemaining)}</strong><span>আসল টাকা আসা-যাওয়া ও সঞ্চয়ের জমা বিবেচনায়</span></div>
        </section>
        <div className="hn-two-col">
          <section className="hn-panel"><div className="hn-panel-head"><div><h2>কোথায় সবচেয়ে বেশি খরচ?</h2><p>নিজের ভাগ অনুযায়ী সবচেয়ে বড় খরচের খাত</p></div></div>
            {highest ? <div className="hn-top-highlight"><span>সবচেয়ে বেশি খরচ হয়েছে</span><strong>{highest.name}</strong><b>{money(highest.amount)}</b></div> : null}
            {categories.length ? <div className="hn-category-list">{categories.map((c,i)=><div className="hn-category" key={`${c.name}-${i}`}><div className="hn-category-text"><span><b className="hn-rank">{(i+1).toLocaleString('bn-BD')}</b>{c.name}</span><strong>{money(c.amount)}</strong></div><div className="hn-progress"><div style={{width:`${Math.max(1,Number(c.amount||0)/maxCategory*100)}%`}}/></div></div>)}</div> : <div className="hn-empty-inline">এই মাসে কোনো খরচের খাত পাওয়া যায়নি।</div>}
          </section>
          <section className="hn-panel"><div className="hn-panel-head"><div><h2>আরও দরকারি হিসাব</h2><p>এক নজরে নিজের হিসাবের গুরুত্বপূর্ণ তথ্য</p></div></div>
            <div className="hn-metric-list">
              <div><span>মাসের আয় থেকে নিজের ভাগ বাদে</span><strong>{money(summary.netRemaining)}</strong></div>
              <div><span>এই মাসে সঞ্চয়ে জমা</span><strong>{money(summary.savingsDeposited)}</strong></div>
              <div><span>বড় কেনাকাটার নির্ধারিত ভাগ</span><strong>{money(summary.sharedPurchaseAllocation)}</strong></div>
              <div><span>অ্যাকাউন্টে মোট নগদ ও ব্যাংক টাকা</span><strong>{money(summary.cashRemaining)}</strong></div>
            </div>
            <p className="hn-fine-print">এখানে অ্যাকাউন্টের মোট টাকা আগের মাসের টাকাও ধরে। আর মাসের আয়-খরচ শুধু নির্বাচিত মাসের হিসাব। মোট দেনা-পাওনা দেখতে “টাকার হিসাব” পেজে যান।</p>
          </section>
        </div>
        <section className="hn-panel hn-top-expenses"><div className="hn-panel-head hn-flex-head"><div><h2>সবচেয়ে বড় পরিশোধগুলো</h2><p>এই সদস্য বাস্তবে যে নিয়মিত খরচগুলো দিয়েছেন, তার বড় থেকে ছোট তালিকা। এটি নিজের ভাগের তালিকা নয়।</p></div>
          <div className="hn-top-controls"><label>কতটি দেখবেন?<input type="number" min="1" max="100" value={limitText} onChange={e=>setLimitText(e.target.value)} aria-label="সর্বোচ্চ কতটি খরচ" /></label><div className="hn-top-presets">{[5,10,20].map(n=><button type="button" key={n} onClick={()=>setLimitText(String(n))} className={numberRequested===n?'is-selected':''}>সেরা {n.toLocaleString('bn-BD')}</button>)}</div><input className="hn-search" type="search" placeholder="খরচ খুঁজুন" value={filter} onChange={e=>setFilter(e.target.value)} aria-label="খরচ খুঁজুন"/></div>
          </div>
          {expenses.length ? <div className="hn-expense-table" role="table" aria-label="সবচেয়ে বড় খরচ"><div role="row" className="hn-expense-table-head"><span>ক্রম</span><span>খরচ ও খাত</span><span>তারিখ</span><span>পরিশোধ</span></div>{expenses.map((e, idx)=><div role="row" className="hn-expense-row" key={`${e.entryId}-${idx}`}><span className="hn-expense-index">{(idx+1).toLocaleString('bn-BD')}</span><div className="hn-expense-main"><strong>{e.note || e.category || 'খরচ'}</strong><small>{e.category}{e.note && e.category ? ' · ' : ''}{e.typeLabel || ''}</small></div><span className="hn-expense-date">{niceDate(e.date)}</span><strong className="hn-expense-value">{money(e.paidAmount)}</strong></div>)}</div> : <div className="hn-empty-inline">এই ফিল্টারে কোনো খরচ পাওয়া যায়নি।</div>}
        </section>
      </>}
    </div>
  </AppLayout>;
}
