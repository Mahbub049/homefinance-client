import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../../services/authStorage';
import HFIcon from '../design/HFIcon';

const headings = {
  '/': ['হোম', 'এই মাসের হিসাব'], '/dashboard': ['হোম', 'এই মাসের হিসাব'],
  '/ledger': ['আয়-খরচ', 'সব লেনদেন এক জায়গায়'], '/wallet': ['টাকার হিসাব', 'বাকি টাকা ও দেনা-পাওনা'],
  '/fixed': ['নিয়মিত বিল', 'প্রতি মাসের পরিচিত খরচ'], '/grocery': ['বাজার', 'কেনাকাটা ও রসিদের হিসাব'],
  '/emi': ['কিস্তি', 'কিস্তির বিল ও পরিশোধ'], '/shared-purchases': ['ভাগ করে কেনাকাটা', 'মাসে মাসে ভাগ ও টাকা ফেরত'],
  '/savings': ['সঞ্চয়', 'জমানো টাকার হিসাব'], '/carry-forward': ['মাস শেষে হিসাব', 'অ্যাকাউন্ট মিলিয়ে মাস বন্ধ করুন'],
  '/year-overview': ['বছরের হিসাব', 'বারো মাসের সারসংক্ষেপ'], '/settings': ['সেটিংস', 'সদস্য, অ্যাকাউন্ট ও ক্যাটাগরি'],
  '/individual-summary': ['ব্যক্তিগত হিসাব', 'সদস্যভিত্তিক হিসাব'], '/planned-purchases': ['ভবিষ্যতের কেনাকাটা', 'পরবর্তী কেনাকাটার পরিকল্পনা'],
  '/shopping-list': ['বাজারের তালিকা', 'যা কিনবেন তার চলমান তালিকা'],
  '/tax-center': ['কর সংক্রান্ত হিসাব', 'সংরক্ষিত পুরোনো ফিচার'],
};

function initialTheme() {
  try { const saved = localStorage.getItem('homefinance-theme');
    return saved === 'dark' ? true : saved === 'light' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch { return false; }
}

export default function Topbar({ onOpenDrawer }) {
  const navigate = useNavigate(); const location = useLocation();
  const user = getUser();
  const [isDark, setIsDark] = useState(initialTheme);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDark); }, [isDark]);
  const [title, subtitle] = headings[location.pathname] || ['হিসাব নিকাশ', 'সহজে নিজের টাকা বুঝুন'];
  const userName = user?.name || '';
  const initials = (userName.trim()[0] || 'H').toUpperCase();

  function switchTheme() {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem('homefinance-theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  }
  function logout() { clearAuth(); navigate('/login', {replace:true}); }

  return <header className="hf-shell-topbar sticky top-0 z-30 border-b backdrop-blur-lg">
    <div className="hf-shell-topbar-inner flex min-h-[68px] items-center justify-between gap-2 px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenDrawer && <button type="button" className="hf-toolbar-button md:hidden" onClick={onOpenDrawer} aria-label="নেভিগেশন মেনু খুলুন"><HFIcon name="menu" size={19}/></button>}
        <div className="min-w-0"><div className="hf-shell-title truncate text-[15px] sm:text-[17px]">{title}</div><div className="hf-shell-subtitle hidden truncate sm:block">{subtitle}</div></div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button type="button" className="hf-toolbar-button" title={isDark?'লাইট মোড':'ডার্ক মোড'} onClick={switchTheme} aria-label={isDark?'লাইট মোড চালু করুন':'ডার্ক মোড চালু করুন'} aria-pressed={isDark}>
          <HFIcon name={isDark?'sun':'moon'} size={16}/><span className="hidden sm:inline">{isDark?'লাইট':'ডার্ক'}</span>
        </button>
        <div className="hidden max-w-[140px] truncate text-right text-[12px] font-semibold md:block" title={userName}>{userName}</div>
        <div className="hf-user-avatar" title={userName} aria-label="ব্যবহারকারী">{initials}</div>
        {user && <button type="button" onClick={logout} className="hf-toolbar-button" title="লগআউট" aria-label="লগআউট"><HFIcon name="logout" size={16}/><span className="hidden sm:inline">বের হন</span></button>}
      </div>
    </div>
  </header>;
}
