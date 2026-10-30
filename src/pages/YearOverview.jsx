import { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/api';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '../styles/hishab-page-refinement.css';

const money = value => { const n = Number(value || 0); return `${n < 0 ? '−' : ''}৳ ${Math.abs(n).toLocaleString('bn-BD', { maximumFractionDigits: 2 })}`; };
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
function monthName(month) { const [y,m] = String(month || '').split('-').map(Number); if (!y || !m) return month || '—'; return new Date(y,m-1,1).toLocaleDateString('bn-BD', { month:'long' }); }
function safeCell(v) { return `"${String(v ?? '').replaceAll('"','""')}"`; }

export default function YearOverview() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(false);
  const load = useCallback(async () => {
    try { setLoading(true); setError(''); const res = await api.get('/api/year-overview', { params: { year } }); setData(res.data); }
    catch (e) { setError(e?.response?.data?.message || 'বছরের হিসাব পাওয়া যায়নি।'); }
    finally { setLoading(false); }
  }, [year]);
  useEffect(() => { load(); }, [load]);
  const months = useMemo(() => Array.isArray(data?.months) ? data.months : [], [data]);
  const totals = data?.totals || {};
  const plot = useMemo(() => months.map(m => ({ month: monthName(m.month), income:num(m.income), expense:num(m.expense), cash:num(m.netCashflow) })), [months]);
  const yearOptions = Array.from({ length: 13 }, (_,i) => new Date().getFullYear() + 3 - i);
  function exportCSV() {
    const headings = ['মাস','মোট আয়','মাসের হিসাবে খরচ','বড় কেনাকাটার ভাগ','সঞ্চয়ে জমা','মাসিক হিসাবের বাকি','বাস্তবে টাকা বেড়েছে/কমেছে','মাসের শুরুর টাকা','মাসের শেষের টাকা'];
    const rows = months.map(m => [monthName(m.month),m.income,m.expense,m.sharedAllocation,m.savingsIn,m.budgetRemaining,m.netCashflow,m.openingBalance,m.closingBalance]);
    const text = '\ufeff' + [headings, ...rows].map(r => r.map(safeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `Hishab-Nikash-${year}.csv`; a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  return <AppLayout><div className="hn-page hn-year">
    <header className="hn-page-header"><div><span className="hn-kicker">হিসাব</span><h1>বছরের হিসাব</h1><p>এক নজরে বারো মাসের আয়, খরচ ও জমা টাকা।</p></div>
      <div className="hn-year-actions"><label className="hn-year-select"><span>বছর</span><select value={year} onChange={e => setYear(Number(e.target.value))}>{yearOptions.map(y => <option key={y} value={y}>{y.toLocaleString('bn-BD', { useGrouping:false })}</option>)}</select></label><button className="hn-btn hn-btn-light" onClick={load} disabled={loading}>↻ রিফ্রেশ</button><button className="hn-btn hn-btn-primary" onClick={exportCSV} disabled={!months.length}>↓ হিসাব নামান</button></div>
    </header>
    {error && <div className="hn-notice hn-error" role="alert">{error}</div>}
    {loading && !data ? <section className="hn-empty">হিসাব প্রস্তুত হচ্ছে…</section> : !data ? <section className="hn-empty">এই বছরের কোনো তথ্য পাওয়া যায়নি।</section> : <>
      <div className="hn-year-stats">
        <article className="hn-year-stat"><span>বছরের মোট আয়</span><strong>{money(totals.income)}</strong></article>
        <article className="hn-year-stat"><span>মাসের হিসাবে মোট খরচ</span><strong>{money(totals.expense)}</strong><small>নির্ধারিত বড় কেনাকাটার ভাগসহ</small></article>
        <article className="hn-year-stat"><span>বাস্তবে টাকা বেড়েছে/কমেছে</span><strong className={num(totals.netCashflow) < 0 ? 'hn-negative' : 'hn-positive'}>{money(totals.netCashflow)}</strong><small>শুধু রেকর্ড করা টাকা আসা-যাওয়া</small></article>
        <article className="hn-year-stat"><span>সঞ্চয়ে জমা</span><strong>{money(totals.savingsIn)}</strong><small>এটি সাধারণ খরচ নয়</small></article>
      </div>
      <section className="hn-surface hn-year-chart"><div className="hn-panel-heading"><div><h2>মাস অনুযায়ী আয়-খরচ</h2><p>মাসভিত্তিক পরিবর্তন দেখতে পারবেন</p></div></div><div className="hn-chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={plot} margin={{left:0,top:12,right:16,bottom:6}}><CartesianGrid vertical={false} stroke="var(--hf-line)" strokeDasharray="3 5"/><XAxis dataKey="month" tick={{fontSize:12,fill:'var(--hf-muted)'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:12,fill:'var(--hf-muted)'}} width={68} tickFormatter={v => Number(v).toLocaleString('bn-BD')}/><Tooltip formatter={v => money(v)}/><Legend/><Line type="monotone" dataKey="income" name="আয়" stroke="#10a788" strokeWidth={2.8} dot={false}/><Line type="monotone" dataKey="expense" name="খরচের হিসাব" stroke="#e66a76" strokeWidth={2.8} dot={false}/></LineChart></ResponsiveContainer></div></section>
      <section className="hn-surface hn-year-list"><div className="hn-panel-heading"><div><h2>মাসভিত্তিক হিসাব</h2><p>প্রতিটি মাসের প্রধান অঙ্কগুলো</p></div><button className="hn-btn hn-btn-light" onClick={() => setDetails(v => !v)}>{details ? 'কম দেখুন' : 'আরও বিস্তারিত'}</button></div>
        <div className="hn-table-scroll"><table><thead><tr><th>মাস</th><th>আয়</th><th>খরচের হিসাব</th><th>সঞ্চয়</th><th>মাসের হিসাবে বাকি</th>{details && <><th>বাস্তব টাকা বেড়েছে/কমেছে</th><th>আগের টাকা</th><th>শেষের টাকা</th></>}</tr></thead><tbody>{months.map(m => <tr key={m.month}><th scope="row">{monthName(m.month)}</th><td>{money(m.income)}</td><td>{money(m.expense)}</td><td>{money(m.savingsIn)}</td><td className={num(m.budgetRemaining) < 0 ? 'hn-negative' : 'hn-positive'}>{money(m.budgetRemaining)}</td>{details && <><td>{money(m.netCashflow)}</td><td>{m.openingBalance == null ? '—' : money(m.openingBalance)}</td><td>{m.closingBalance == null ? '—' : money(m.closingBalance)}</td></>}</tr>)}</tbody></table></div>
      </section>
      <details className="hn-help-note"><summary>মাসের হিসাব আর বাস্তব অ্যাকাউন্টের টাকা কেন আলাদা?</summary><p>মাসের হিসাবের খরচে বড় কেনাকাটার নির্ধারিত ভাগ থাকতে পারে। কিন্তু বাস্তব টাকা কমে শুধু অ্যাকাউন্ট থেকে অর্থ বের হলে। সঞ্চয়ে পাঠানো টাকাও খরচ নয়, তবে ব্যবহারযোগ্য নগদ কমায়।</p></details>
      {num(totals.warningCount) > 0 && <p className="hn-year-warning">কয়েকটি অ্যাকাউন্টের হিসাব মিলিয়ে নেওয়া প্রয়োজন। মাস শেষে হিসাব পেজে পরীক্ষা করুন।</p>}
    </>}
  </div></AppLayout>;
}
