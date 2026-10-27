// Display-only formatting. Never use these strings when writing to APIs or MongoDB.
const bnMoney = new Intl.NumberFormat('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const bnMonth = new Intl.DateTimeFormat('bn-BD', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const bnDay = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatTaka(value, { digits = 'bn' } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const formatter = digits === 'en' ? new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }) : bnMoney;
  return `${number < 0 ? '−' : ''}৳${formatter.format(Math.abs(number))}`;
}

export function formatBanglaMonth(monthKey) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey))) return String(monthKey || '—');
  return bnMonth.format(new Date(`${monthKey}-01T00:00:00.000Z`));
}

export function formatBanglaDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(date))) return String(date || '—');
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? String(date) : bnDay.format(parsed);
}

export const UI_WORDS = Object.freeze({
  income: 'আয়', expense: 'খরচ', transfer: 'টাকা পাঠানো', savings: 'সঞ্চয়',
  paid: 'পরিশোধ হয়েছে', unpaid: 'বাকি আছে', settle: 'টাকা মিটিয়ে দিন',
  remaining: 'এই মাসে বাকি', details: 'হিসাব দেখুন', help: 'সাহায্য',
  cancel: 'বাতিল', save: 'সংরক্ষণ করুন', close: 'বন্ধ করুন', loading: 'লোড হচ্ছে…',
});
