// Saves recent analyses in the browser (localStorage), so they survive a page
// refresh. Everything is wrapped in try/catch because localStorage can be
// blocked (private browsing, strict privacy settings) and the app must still work.

const KEY = 'resume-analyzer:history';
const MAX_ITEMS = 6;

export function loadHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: history just won't persist, the app still works.
  }
}

export function addToHistory(list, { fileName, jobDescription, result }) {
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    fileName,
    jobDescription,
    createdAt: new Date().toISOString(),
    result,
  };
  const next = [entry, ...list].slice(0, MAX_ITEMS);
  saveHistory(next);
  return { entry, list: next };
}

export function removeFromHistory(list, id) {
  const next = list.filter((item) => item.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory() {
  saveHistory([]);
  return [];
}
