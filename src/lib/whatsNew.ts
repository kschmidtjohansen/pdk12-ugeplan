/** "Hvad er nyt": the newest entries of CHANGELOG.md as cards (date, title, first line). */
export interface WhatsNewEntry {
  date: string;   // yyyy-MM-dd
  title: string;
  summary: string;
}

const clean = (s: string) => s
  .replace(/`([^`]*)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

export const parseWhatsNew = (markdown: string, limit = 30): WhatsNewEntry[] => {
  const out: WhatsNewEntry[] = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length && out.length < limit; i++) {
    const m = lines[i].match(/^##\s+(\d{4}-\d{2}-\d{2})\s*[–-]\s*(.+)$/);
    if (!m) continue;
    let summary = '';
    for (let j = i + 1; j < lines.length && !lines[j].startsWith('## '); j++) {
      const b = lines[j].match(/^\s*[-*]\s+(.+)$/);
      if (b) { summary = clean(b[1]); break; }
      if (!summary && lines[j].trim() && !lines[j].startsWith('#')) { summary = clean(lines[j]); break; }
    }
    out.push({ date: m[1], title: clean(m[2]), summary });
  }
  return out;
};
