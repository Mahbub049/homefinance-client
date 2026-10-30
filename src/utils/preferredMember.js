// Chooses logged-in member only as the initial selection; users can choose another.
export function preferredMemberId(members, user) {
  const id = String(user?._id || user?.id || user?.userId || '');
  const matching = (members || []).find(m => String(m?.id || m?._id || m?.userId || '') === id);
  return String(matching?.id || matching?._id || matching?.userId || members?.[0]?.id || members?.[0]?._id || '');
}
