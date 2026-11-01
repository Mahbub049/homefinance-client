// Report actual income received and money paid by the selected member.
// Do NOT confuse expense-sharing responsibility with the payer's bank outflow.
export function identity(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value._id != null) return identity(value._id);
  if (value.id != null) return identity(value.id);
  if (typeof value.toHexString === 'function') return value.toHexString();
  return '';
}

export function accountBelongsToMember(account, member) {
  const owner = String(account?.owner || '').trim().toLowerCase();
  const name = String(member?.name || '').trim().toLowerCase();
  if (!owner || !name || ['joint','shared','family'].includes(owner)) return false;
  // This app's account owner enum uses Mahbub, Mirza, Joint, not user IDs.
  if (owner === 'mahbub') return name.includes('mahbub');
  if (owner === 'mirza') return name.includes('mirza') || name.includes('jannatul');
  return name === owner;
}

function roundCents(value) { return Math.round(Number(value || 0) * 100); }

export function rowsForMemberReport(transactions, selectedId, members = [], accounts = []) {
  if (selectedId === 'all') return [...(transactions || [])];
  const selected = String(selectedId || '');
  if (!selected) return [];
  const member = members.find(m => identity(m) === selected);
  if (!member) return [];
  const accountsById = new Map(accounts.map(a => [identity(a), a]));
  const ownerOfAccount = v => {
    const account = typeof v === 'object' && v?.owner ? v : accountsById.get(identity(v));
    return accountBelongsToMember(account, member);
  };
  const result = [];
  for (const transaction of transactions || []) {
    if (transaction.txType === 'income') {
      // Only the recipient's income; never a different member's income.
      if (identity(transaction.receivedByUserId) !== selected) continue;
      result.push({...transaction, _memberReportKind: 'income'});
    } else if (transaction.txType === 'expense') {
      if (transaction.paymentMode === 'split') {
        const memberParts = (transaction.paymentParts || []).filter(p => identity(p.userId) === selected);
        const memberCents = memberParts.reduce((sum, p) => sum + roundCents(p.amount), 0);
        if (memberCents <= 0) continue;
        // A member's paid contribution, NOT the complete shared transaction
        // and NOT a Ledger responsibility allocation they haven't paid.
        result.push({
          ...transaction, amount: memberCents / 100, paymentMode: 'single',
          paymentParts: [], paidByUserId: member,
          fromAccountId: memberParts[0].accountId,
          _memberPaymentAccounts: memberParts.map(part => part.accountId),
          _memberReportKind: 'split-payment',
        });
      } else if (identity(transaction.paidByUserId) === selected) {
        result.push({...transaction, _memberReportKind: 'expense'});
      }
    } else if (transaction.txType === 'transfer') {
      const outgoing = identity(transaction.paidByUserId) === selected || ownerOfAccount(transaction.fromAccountId);
      const incoming = identity(transaction.receivedByUserId) === selected || ownerOfAccount(transaction.toAccountId);
      if (!outgoing && !incoming) continue;
      result.push({...transaction, _memberReportKind: outgoing && incoming ? 'internal-transfer' : outgoing ? 'outgoing-transfer' : 'incoming-transfer'});
    }
  }
  return result;
}
