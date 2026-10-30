import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import api from '../services/api';
import {setAuth} from '../services/authStorage';

const WelcomeIcon = ({name}) => {
  const paths = {
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M16 14h2"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeoff: <><path d="m3 3 18 18M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6"/><path d="M17.8 17.8A12.8 12.8 0 0 1 12 19C7 19 3.7 16.1 2 12c.8-1.9 2-3.5 3.6-4.7M9.9 5.2A11 11 0 0 1 12 5c5 0 8.3 2.9 10 7a12.2 12.2 0 0 1-2.2 3.4"/></>,
  };
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

export default function Login() {
  const navigate=useNavigate();
  const [form,setForm]=useState({email:'',password:''});
  const [showPassword,setShowPassword]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem('homefinance-theme')!=='light';}catch{return true;}});
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('homefinance-theme',dark?'dark':'light');}catch{}},[dark]);
  const canSubmit=useMemo(()=>!!(form.email.trim()&&form.password&&!loading),[form,loading]);
  async function handleSubmit(e){
    e.preventDefault();if(!canSubmit)return;
    setLoading(true);setError('');
    try{
      const {data}=await api.post('/api/auth/login',{email:form.email.trim().toLowerCase(),password:form.password});
      setAuth(data.token,data.user);navigate('/dashboard',{replace:true});
    }catch(err){setError(err?.response?.data?.message||'প্রবেশ করা যায়নি। ইমেইল ও পাসওয়ার্ড আবার যাচাই করুন।');}
    finally{setLoading(false);}
  }
  return <div className="hn-login-page">
    <div className="hn-login-shell">
      <section className="hn-login-story" aria-label="হিসাব নিকাশ পরিচিতি">
        <div className="hn-login-brand"><span className="hn-login-mark">হি</span><span><strong>হিসাব নিকাশ</strong><small>আমাদের প্রতিদিনের হিসাব</small></span></div>
        <div className="hn-login-story-content">
          <span className="hn-login-eyebrow"><span className="hn-login-led"/> নিজের টাকা, নিজের নিয়ন্ত্রণে</span>
          <h1>হিসাব সহজ হলে,<br/><em>সিদ্ধান্তও সহজ হয়।</em></h1>
          <p>প্রতিদিনের আয়-খরচ, মাসের সঞ্চয়, কিস্তি আর দুজনের দেনা-পাওনা—সব থাকুক এক নির্ভরযোগ্য জায়গায়।</p>
          <div className="hn-login-highlights"><div><WelcomeIcon name="wallet"/><span>মাসের বাকি টাকা এক নজরে</span></div><div><WelcomeIcon name="shield"/><span>নিজের ও পরিবারের হিসাব আলাদা</span></div></div>
        </div>
        <div className="hn-login-story-footer">প্রয়োজনীয় হিসাব। অপ্রয়োজনীয় জটিলতা নয়।</div>
      </section>
      <main className="hn-login-form-area">
        <div className="hn-login-form-top"><span className="hn-login-mobile-brand"><span className="hn-login-mark">হি</span> হিসাব নিকাশ</span><button type="button" onClick={()=>setDark(v=>!v)} className="hn-login-theme">{dark?'☀ লাইট':'☾ ডার্ক'}</button></div>
        <div className="hn-login-form-card">
          <div className="hn-login-form-heading"><span className="hn-login-eyebrow">আবার স্বাগতম</span><h2>আপনার হিসাবে প্রবেশ করুন</h2><p>আপনার সংরক্ষিত হিসাব দেখতে নিচের তথ্য দিন।</p></div>
          <form onSubmit={handleSubmit} className="hn-login-fields">
            <label htmlFor="hn-login-email">ইমেইল অ্যাড্রেস</label>
            <input id="hn-login-email" type="email" autoComplete="username" required value={form.email} placeholder="name@example.com" onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            <label htmlFor="hn-login-password">পাসওয়ার্ড</label>
            <div className="hn-login-password"><input id="hn-login-password" type={showPassword?'text':'password'} autoComplete="current-password" required value={form.password} placeholder="আপনার পাসওয়ার্ড" onChange={e=>setForm(f=>({...f,password:e.target.value}))}/><button type="button" aria-label={showPassword?'পাসওয়ার্ড লুকান':'পাসওয়ার্ড দেখুন'} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}><WelcomeIcon name={showPassword?'eyeoff':'eye'}/></button></div>
            {error&&<div role="alert" className="hn-login-error">{error}</div>}
            <button type="submit" className="hn-login-submit" disabled={!canSubmit}><span>{loading?'প্রবেশ করা হচ্ছে…':'প্রবেশ করুন'}</span><WelcomeIcon name="arrow"/></button>
          </form>
          <div className="hn-login-register">নতুন ব্যবহারকারী? <Link to="/register">অ্যাকাউন্ট তৈরি করুন</Link></div>
        </div>
        <div className="hn-login-form-footer">© {new Date().getFullYear()} হিসাব নিকাশ · নিরাপদে নিজের তথ্য সংরক্ষণ করুন</div>
      </main>
    </div>
  </div>;
}
