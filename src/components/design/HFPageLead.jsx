import React, { useState } from 'react';
import HFIcon from './HFIcon';
import { formatTaka, formatBanglaMonth } from './format';

const guidance = {
  'হোম': ['এই মাসের আয় থেকে খরচ ও সঞ্চয় বাদ দেওয়ার পর কত বাকি আছে, তা প্রথমে দেখুন।', 'বড় কেনাকাটার মাসিক ভাগ বাস্তব ব্যাংক লেনদেন থেকে আলাদা।', 'দেনা-পাওনা মেটাতে টাকার হিসাব পেজ ব্যবহার করুন।'],
  'আয়-খরচ': ['নতুন হিসাব থেকে আয়, খরচ বা ট্রান্সফার যোগ করুন।', 'খরচের জন্য কে টাকা দিয়েছেন এবং কার ভাগ কত, তা আলাদা করে দিন।', 'তারিখ ও ধরন দিয়ে পুরোনো এন্ট্রি খুঁজুন।'],
  'নিয়মিত বিল': ['একবার নিয়ম তৈরি করুন; পরের মাসে একই বিল সহজে যোগ করুন।', 'টাকার অঙ্ক বদলালে পরিশোধের সময় আসল অঙ্ক লিখুন।', 'বিল দেওয়ার পরই খরচ হিসাবে ধরা হবে।'],
  'বাজার': ['দোকানের নাম, কেনা জিনিস, দাম ও অতিরিক্ত খরচ যোগ করুন।', 'প্রতিটি বাজারের জন্য আলাদা হিসাব রাখুন।'],
  'কিস্তি': ['মাসের বিল তৈরি করলেই টাকা কাটা হয় না।', 'যেদিন পরিশোধ করবেন, সেদিন নির্দিষ্ট অ্যাকাউন্ট থেকে টাকা কাটবে।', 'সম্পন্ন কিস্তি বিস্তারিত অংশে পাবেন।'],
  'ভাগ করে কেনাকাটা': ['পুরো দাম প্রথমবার যিনি দিয়েছেন তাঁর অ্যাকাউন্ট থেকে একবারই কাটা হয়।', 'মাসিক ভাগ আলাদা হিসাবে দেখানো হয়।', 'অন্য সদস্য টাকা দিলে ফেরত পরিশোধ হিসেবে রেকর্ড করুন।'],
  'সঞ্চয়': ['DPS-এ জমা দেওয়া টাকা এই মাসের ব্যবহারযোগ্য টাকা কমায়।', 'জমা টাকা কিন্তু আপনার সঞ্চিত সম্পদ হিসেবেই থাকে।'],
  'টাকার হিসাব': ['প্রথমে শুধু এই মাসের আয় থেকে কত বাকি আছে দেখুন।', 'ব্যক্তিগত দেনা-পাওনা টাকা আদান-প্রদানের পরে বদলায়।', 'আগের মাসসহ ব্যাংকের ব্যালেন্স মাস শেষে হিসাব পেজে দেখুন।'],
  'মাস শেষে হিসাব': ['ব্যাংক ও নগদে বাস্তবে কত আছে, অ্যাপের অঙ্কের সঙ্গে মিলিয়ে নিন।', 'মিলিয়ে খসড়া সংরক্ষণ করুন এবং প্রস্তুত হলে মাস বন্ধ করুন।'],
};
function Value({item}) {
  const n = item?.value;
  if(n === undefined || n === null || !Number.isFinite(Number(n))) return <strong className="hf-v2-number">—</strong>;
  return <strong className="hf-v2-number">{item.kind === 'count' ? Number(n).toLocaleString('bn-BD') : formatTaka(n)}</strong>;
}
export default function HFPageLead({title,description,month,onMonthChange,metrics=[],onAdd,addLabel,onExtra,extraLabel,extraBefore,onRefresh,more,onToggleMore,addDisabled=false}) {
 const [showHelp,setShowHelp] = useState(false);
 const [explain,setExplain] = useState(false);
 const primary = metrics.find(x=>x.primary) || metrics[0];
 const secondary = metrics.filter(x=>x!==primary).slice(0,2);
 return <header className="hf-v2-head">
  <div className="hf-v2-head-top"><div className="hf-v2-head-title"><span className="hf-v2-eyebrow">আমাদের হিসাব</span><h1>{title}</h1><p>{description}</p></div>
   <div className="hf-v2-actions">
    {month && onMonthChange && <label className="hf-v2-month"><HFIcon name="calendar" size={16}/><span>{formatBanglaMonth(month)}</span><input aria-label="মাস পরিবর্তন" type="month" value={month} onChange={e=>onMonthChange(e.target.value)}/></label>}
    {onRefresh && <button className="hf-v2-btn hf-v2-btn--icon" type="button" aria-label="তথ্য নতুন করে আনুন" onClick={onRefresh}><HFIcon name="refresh" size={17}/></button>}
    {extraBefore && <div className="hn-pagelead-extra-before">{extraBefore}</div>}
    {onExtra && <button className="hf-v2-btn hf-v2-btn--soft" type="button" onClick={onExtra}><HFIcon name="download" size={16}/>{extraLabel}</button>}
    {onAdd && <button className="hf-v2-btn hf-v2-btn--main" type="button" disabled={addDisabled} onClick={onAdd}><HFIcon name="plus" size={16}/>{addLabel}</button>}
    <button className="hf-v2-btn hf-v2-btn--icon" type="button" title="ব্যবহারের নিয়ম" aria-expanded={showHelp} onClick={()=>setShowHelp(x=>!x)}><HFIcon name="info" size={17}/></button>
   </div>
  </div>
  {!!metrics.length && <div className="hf-v2-head-finances">
    <div className="hf-v2-head-primary"><span>{primary.label}</span><Value item={primary}/></div>
    {secondary.map((m,i)=><div className="hf-v2-head-mini" key={i}><span>{m.label}</span><Value item={m}/></div>)}
  </div>}
  {!!metrics.length && <div className="hf-v2-explanation-trigger"><button type="button" onClick={()=>setExplain(v=>!v)} aria-expanded={explain}>{explain?'ব্যাখ্যা বন্ধ করুন':'এই অঙ্কের অর্থ কী?'}</button></div>}
  {explain && <aside className="hf-v2-help" role="note"><strong>{primary?.label}</strong><p>{(guidance[title]||[])[0]||'নির্বাচিত মাসের রেকর্ড থেকে অঙ্কটি হিসাব করা হয়েছে।'}</p><p>এটি হিসাবের সাধারণ ব্যাখ্যা। নির্দিষ্ট এন্ট্রি যাচাই করতে আয়-খরচের তালিকা দেখুন।</p></aside>}
  {showHelp && <aside className="hf-v2-help" role="note" aria-label="ব্যবহারের নিয়ম"><div className="hf-v2-help-heading"><strong>এই পেজ কীভাবে ব্যবহার করবেন</strong><button type="button" onClick={()=>setShowHelp(false)} aria-label="বন্ধ করুন">✕</button></div><ol>{(guidance[title] || [description]).map((line,i)=><li key={i}>{line}</li>)}</ol></aside>}
  {onToggleMore && <div className="hf-v2-more"><button type="button" onClick={onToggleMore} aria-expanded={!!more}>{more ? 'বিস্তারিত লুকান' : 'আরও বিস্তারিত'} <HFIcon name={more?'chevron-up':'chevron-down'} size={14}/></button></div>}
 </header>;
}
