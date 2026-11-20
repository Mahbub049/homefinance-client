/**
 * Receipt OCR is opt-in and runs inside the user's browser.
 * Only the Tesseract engine and trained language models are downloaded;
 * selected photographs are never transmitted by this feature.
 * OCR/receipt layouts vary by POS vendor: these are proposed values, not a posting.
 */
const OCR_JS = "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";
let engineLoad;

export function loadReceiptEngine() {
  if (typeof window === "undefined") return Promise.reject(new Error("OCR শুধু ব্রাউজারে ব্যবহার করা যায়"));
  if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
  if (engineLoad) return engineLoad;
  engineLoad = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = OCR_JS;
    script.crossOrigin = "anonymous";
    script.onload = () => window.Tesseract?.createWorker
      ? resolve(window.Tesseract)
      : reject(new Error("OCR ইঞ্জিন লোড হয়নি"));
    script.onerror = () => reject(new Error("OCR ইঞ্জিন ডাউনলোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।"));
    document.head.appendChild(script);
  }).catch((error) => { engineLoad = null; throw error; });
  return engineLoad;
}

export async function recognizeReceipt(file, onProgress = () => {}) {
  if (!file || !file.type.startsWith("image/")) throw new Error("রসিদের ছবি বা স্ক্রিনশট নির্বাচন করুন।");
  if (file.size > 15 * 1024 * 1024) throw new Error("১৫ MB-এর ছোট ছবি ব্যবহার করুন।");
  const tesseract = await loadReceiptEngine();
  let worker;
  try {
    worker = await tesseract.createWorker(["eng", "ben"], 1, {
      logger: ({ status, progress }) => {
        if (status === "recognizing text") onProgress(Math.round((progress || 0) * 100));
      },
    });
    const result = await worker.recognize(file);
    let text = String(result?.data?.text || "");
    let confidence = Number(result?.data?.confidence || 0);
    // A second, enhanced pass helps with small, faint thermal receipts.
    if (text.trim().length < 25) {
      try {
        const enhanced = await enhanceReceipt(file);
        const retry = await worker.recognize(enhanced);
        if (String(retry?.data?.text || "").trim().length > text.trim().length) {
          text = String(retry.data.text);
          confidence = Number(retry.data.confidence || 0);
        }
      } catch { /* keep first recognition, never lose it */ }
    }
    if (!text.trim()) throw new Error("ছবিতে কোনো লেখা পাওয়া যায়নি। আরও পরিষ্কার ছবি দিন।");
    return { text, confidence };
  } finally {
    if (worker) await worker.terminate().catch(() => {});
  }
}

async function enhanceReceipt(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(2.5, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const gray = .299 * image.data[i] + .587 * image.data[i + 1] + .114 * image.data[i + 2];
      const contrast = Math.max(0, Math.min(255, (gray - 125) * 1.65 + 165));
      image.data[i] = contrast;
      image.data[i + 1] = contrast;
      image.data[i + 2] = contrast;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  } finally { bitmap.close(); }
}

const BN = "০১২৩৪৫৬৭৮৯";
export function asciiDigits(value) {
  return String(value || "")
    .replace(/[০-৯]/g, (n) => String(BN.indexOf(n)))
    .replace(/[৳₹]/g, " ").replace(/\u00a0/g, " ");
}

const PRICE = "([0-9][0-9,]*(?:\\.[0-9]{1,2})?)";
const CURRENCY = /\b(?:bdt|taka|tk|rs|inr)\b/gi;
const moneyNumber = (value) => {
  const n = Number(asciiDigits(value).replace(/[,\s]/g, "").replace(/\/-$/, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};
const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const RE_TOTAL = /(?:\b(?:grand\s*total|net\s*(?:amount|total|payable)|amount\s*(?:paid|due|payable)|bill\s*amount|total\s*payable|payable|total\s*amount|total)\b|মোট\s*(?:টাকা|বিল|দাম)|সর্বমোট|পরিশোধযোগ্য|সর্বমোট)/i;
const RE_SUBTOTAL = /(?:\b(?:sub\s*total|gross\s*total|total\s*sales)\b|মোট\s*মূল্য)/i;
const RE_DISCOUNT = /(?:discount|disc\.?|less|saving|promo|ছাড়|ডিসকাউন্ট)/i;
const RE_TAX = /(?:\bvat\b|\btax\b|\bsdt\b|ভ্যাট|কর)/i;
const RE_DELIVERY = /(?:delivery|service\s*charge|packaging|shipping|ডেলিভারি|সার্ভিস\s*চার্জ)/i;
const RE_META = /(?:invoice|receipt|cash\s*memo|cashier|\bpos\b|\bsku\b|transaction|\btrx\b|\btid\b|\bmid\b|\bqty\b|\bunit\b|\brate\b|\bprice\b|\bitem\b|order\s*no|\bsl\b|table\s*no|\btoken\b|\bmobile\b|\bphone\b|\btel\b|thank|welcome|\breturn\b|\bexchange\b|\bchange\b|\bcard\b|\bvisa\b|\bcash\b|\bbkash\b|\bnagad\b|\bpaid\b|ডেবিট|নগদ|ধন্যবাদ|ফোন|চালান)/i;
const RE_DATE = /(?:\bdate\b|তারিখ|\btime\b)/i;
const RE_FOOTER = /(?:\bhttp|www\.|@\w+\.com|facebook|\bqr\b|barcode|\bvat\s*reg|bin\s*no|mushak|tin\s*no)/i;
const RE_ADDRESS = /(?:address|outlet|branch|location|shop\s*at|ঠিকানা|শাখা)/i;
const UNITS = { pc: "pcs", pcs: "pcs", piece: "pcs", pieces: "pcs", kg: "kg", kgs: "kg", gm: "g", g: "g", gram: "g", ltr: "liter", litre: "liter", liter: "liter", ml: "ml", pkt: "pack", pack: "pack", bottle: "bottle", box: "box", dozen: "dozen", dz: "dozen", lb: "lb" };
const UNIT_WORDS = Object.keys(UNITS).join("|");
const KNOWN_SHOPS = [
  [/meena\s*ba[sz]ar|মীনা\s*বাজার/i, "Meena Bazar"],
  [/sh[wou]apno|স্বপ্ন|শপনো/i, "Shwapno"],
  [/\bbata\b/i, "Bata"],
  [/mr\.?\s*d\.?i\.?y\.?/i, "MR DIY"],
  [/\bsoya\b/i, "Soya"],
  [/unimart/i, "Unimart"],
  [/agora/i, "Agora"],
  [/foodpanda/i, "Foodpanda"],
];

function getAmounts(line) {
  // Amounts with numeric punctuation; avoid reading an entire phone/date/transaction id as a price.
  const cleaned = line.replace(CURRENCY, " ").replace(/\/-\b/g, "");
  const out = [];
  for (const match of cleaned.matchAll(/(?:^|\s)(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,7}\.\d{1,2})(?=\s|$|\/\-|\*)/g)) {
    const amount = moneyNumber(match[1]);
    if (amount !== null) out.push({ amount, start: match.index + match[0].indexOf(match[1]), end: match.index + match[0].indexOf(match[1]) + match[1].length });
  }
  return out;
}

function lastPrice(line) {
  const amounts = getAmounts(line);
  return amounts.length ? amounts[amounts.length - 1].amount : null;
}

function findDate(lines) {
  const dateRe = /(?:^|\D)(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?=\D|$)/;
  for (const line of lines) {
    const m = line.match(dateRe);
    if (!m) continue;
    let y, month, day;
    if (m[1].length === 4) [y, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
    else {
      [day, month, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
      if (y < 100) y += y >= 70 ? 1900 : 2000;
    }
    if (y < 2015 || y > 2100 || month < 1 || month > 12 || day < 1 || day > 31) continue;
    const valid = new Date(Date.UTC(y, month - 1, day));
    if (valid.getUTCDate() !== day || valid.getUTCMonth() !== month - 1) continue;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

function paymentHintFor(lines) {
  const candidates = lines.filter((line) => /(?:payment|paid\s*by|tender\s*type|mode|\bbkash\b|\bnagad\b|card\s*payment|cash\s*payment|পেমেন্ট|টাকা\s*দেওয়া)/i.test(line));
  const text = candidates.slice(-6).join(" ");
  if (/bkash|বিকাশ/i.test(text)) return "bkash";
  if (/nagad|নগদ\s*অ্যাকাউন্ট/i.test(text)) return "nagad";
  if (/visa|mastercard|debit|credit|\bcard\b/i.test(text)) return "card";
  if (/\bcash\b|নগদ/i.test(text)) return "cash";
  return "";
}

function invoiceNumber(lines) {
  for (const line of lines.slice(0, 22)) {
    const m = line.match(/(?:invoice|receipt|bill)\s*(?:no\.?|number|#|id)?\s*[:#-]\s*([A-Z0-9/-]{3,30})/i);
    if (m) return m[1];
  }
  return "";
}

function guessMerchant(lines) {
  const top = lines.slice(0, 10);
  for (const line of top) {
    for (const [regex, name] of KNOWN_SHOPS) if (regex.test(line)) return name;
  }
  for (const line of top.slice(0, 6)) {
    if (line.length < 3 || line.length > 75 || RE_META.test(line) || RE_DATE.test(line) || RE_ADDRESS.test(line) || RE_FOOTER.test(line)) continue;
    if (/\d{3,}/.test(line) || /\b\d{1,2}:\d{2}\b/.test(line) || /^[-\d.=* ]+$/.test(line)) continue;
    if (/[a-zA-Z\u0980-\u09ff]{3,}/.test(line)) return line.replace(/^[*#\- ]+|[*#\- ]+$/g, "").trim();
  }
  return "";
}

function guessLocation(lines) {
  for (const line of lines.slice(0, 16)) {
    const m = line.match(/(?:address|branch|outlet|location|ঠিকানা|শাখা)\s*[:\-]\s*(.+)/i);
    if (m && m[1].trim().length > 3 && !/\b\d{9,}\b/.test(m[1])) return m[1].trim();
  }
  return "";
}

function isSummary(line) {
  return RE_TOTAL.test(line) || RE_SUBTOTAL.test(line) || RE_DISCOUNT.test(line) || RE_TAX.test(line) || RE_DELIVERY.test(line)
    || RE_META.test(line) || RE_FOOTER.test(line) || RE_DATE.test(line) || RE_ADDRESS.test(line)
    || /\b(?:balance|payment|rounded|rounding|due|tendered|received|pay\s*by|cashback)\b/i.test(line);
}

function parseLineItem(line) {
  if (isSummary(line)) return null;
  let text = line.replace(/^\s*(?:\d{1,3}[.)-]?|\d{8,14})\s+/, "").replace(/\s+\d{8,14}\s+/g, " ").trim();
  text = text.replace(/\s+(?:tk|bdt|৳)\s*/gi, " ");
  const amounts = getAmounts(text);
  if (!amounts.length) return null;

  // Price must appear at the end; reject line numbers, barcodes and addresses.
  if (/[^\d\s.,/\-]*[a-zA-Z\u0980-\u09ff][^\d]*$/.test(text) && !/\/-\s*$/.test(text)) return null;
  if (amounts[amounts.length - 1].end < text.length - 4 && !/\/-\s*$/.test(text)) return null;

  let qty = 1, unit = "pcs", unitPrice, total;
  const found = text.match(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(${UNIT_WORDS})\\b`, "i"));
  if (found) {
    qty = Number(found[1]);
    unit = UNITS[found[2].toLowerCase()] || "pcs";
  }
  const xQty = text.match(/(?:\b|\s)(\d+(?:\.\d+)?)\s*[x×@]\s*(\d{1,6}(?:\.\d{1,2})?)/i);
  if (xQty) { qty = Number(xQty[1]); unitPrice = Number(xQty[2]); }

  total = amounts[amounts.length - 1].amount;
  // Patterns: product 2 100.00 200.00; product 2 pcs 100.00 200.00
  if (!found && !xQty && amounts.length >= 3) {
    const lastThree = amounts.slice(-3).map((p) => p.amount);
    if (lastThree[0] > 0 && lastThree[0] <= 999 && Math.abs(lastThree[0] * lastThree[1] - lastThree[2]) < .12) {
      qty = lastThree[0]; unitPrice = lastThree[1];
    } else if (lastThree[1] > 0 && lastThree[1] <= 999 && Math.abs(lastThree[1] * lastThree[0] - lastThree[2]) < .12) {
      qty = lastThree[1]; unitPrice = lastThree[0];
    }
  }
  if (!found && !xQty && qty === 1 && amounts.length === 2) {
    const [first, second] = amounts.map((p) => p.amount);
    if (first > 0 && first <= 999 && Math.abs(first * second - total) < .12 && first !== second) qty = first;
  }
  if (found && amounts.length >= 2) {
    const beforeTotal = amounts[amounts.length - 2].amount;
    if (Math.abs(beforeTotal * qty - total) < .15) unitPrice = beforeTotal;
  }
  if (!Number.isFinite(unitPrice)) unitPrice = round(total / qty);

  const first = amounts[0].start;
  let name = text.slice(0, first).replace(/\s*\d{1,3}\s*[x×@]\s*$/, "").trim();
  name = name.replace(/\s*\d+(?:\.\d+)?\s*(?:pcs|pc|kg|g|gm|ml|ltr|liter|litre|pack|pkt|bottle|box|dozen)\s*$/i, "").trim();
  if (!name && amounts.length >= 2) name = text.slice(0, amounts[amounts.length - 1].start).replace(/\s*[\d.,]+\s*$/, "").trim();
  if (!/[a-zA-Z\u0980-\u09ff]{2,}/.test(name) || name.length > 110) return null;
  if (!(qty > 0 && qty < 10000) || total < 0) return null;
  // Keep the printed line total by adjusting unit price only if arithmetic agrees.
  return { name, unit, qty, unitPrice, lineTotal: total };
}

/** Parse English/Bangla receipts from grocery, restaurant, clothing & retail POS. */
export function parseReceiptText(rawText) {
  const lines = asciiDigits(rawText)
    .replace(/\r/g, "\n").replace(/[|]/g, " ")
    .split(/\n+/).map((s) => s.replace(/[\t ]+/g, " ").trim()).filter(Boolean);
  const detected = { shopName: guessMerchant(lines), location: guessLocation(lines), txnDate: findDate(lines), paymentHint: paymentHintFor(lines), invoiceNo: invoiceNumber(lines), items: [], discountTotal: 0, deliveryFee: 0, vatAmount: 0, vatIncluded: true, receiptTotal: null, warnings: [] };
  const totals = [];
  let subtotal = null;
  let sawItemHeader = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/\b(?:item\s*(?:name|description)|description|product\s*name|পণ্যের\s*নাম)\b/i.test(line)) sawItemHeader = true;
    const amount = lastPrice(line);
    if (amount !== null && !/\b(?:cash\s*(?:received|tendered)|change\s*(?:due|back)|balance|paid\s*by|card\s*(?:no|number))\b/i.test(line)) {
      if (RE_SUBTOTAL.test(line)) subtotal = amount;
      else if (RE_TOTAL.test(line)) totals.push({ amount, priority: /grand|net|payable|due|bill\s*amount|সর্বমোট|পরিশোধযোগ্য/i.test(line) ? 3 : 1 });
      else if (RE_DISCOUNT.test(line)) detected.discountTotal = amount;
      else if (RE_TAX.test(line) && !/%/.test(line)) detected.vatAmount = amount;
      else if (RE_DELIVERY.test(line)) detected.deliveryFee += amount;
    }
    // Skip headers, merchant details, and trailing legal/payment metadata.
    if (i < 2 && !sawItemHeader) continue;
    const item = parseLineItem(line);
    if (item) detected.items.push(item);
  }
  totals.sort((a, b) => b.priority - a.priority);
  if (totals.length) detected.receiptTotal = totals[0].amount;
  const itemSum = round(detected.items.reduce((sum, i) => sum + i.lineTotal, 0));
  const included = round(itemSum - detected.discountTotal + detected.deliveryFee);
  const excluded = round(included + detected.vatAmount);
  if (detected.receiptTotal !== null && Math.abs(excluded - detected.receiptTotal) < Math.abs(included - detected.receiptTotal) - .02) detected.vatIncluded = false;
  if (detected.receiptTotal !== null && detected.items.length && Math.abs((detected.vatIncluded ? included : excluded) - detected.receiptTotal) > .2) {
    detected.warnings.push("রসিদের মোট টাকা এবং শনাক্ত পণ্যের যোগফল মেলেনি। পণ্য, ছাড় ও ভ্যাট যাচাই করুন।");
  }
  if (!detected.items.length) {
    detected.warnings.push("পণ্যের লাইন পরিষ্কার পাওয়া যায়নি। পণ্যগুলো হাতে সংশোধন করুন।");
    // Do not fabricate an item name or silently post a total as a purchase.
  }
  if (!detected.txnDate) detected.warnings.push("রসিদের তারিখ পাওয়া যায়নি; ফর্মে আগের তারিখ অপরিবর্তিত আছে।");
  if (!detected.shopName) detected.warnings.push("দোকানের নাম স্পষ্ট নয়; হাতে লিখুন।");
  if (subtotal !== null && detected.items.length && Math.abs(itemSum - subtotal) > 1) {
    detected.warnings.push("পণ্যের মোট এবং প্রিন্টেড সাবটোটাল আলাদা।");
  }
  return detected;
}
