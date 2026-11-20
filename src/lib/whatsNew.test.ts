import { describe, expect, it } from 'vitest';
import { parseWhatsNew } from './whatsNew';

describe('parseWhatsNew', () => {
  it('tager dato, titel og første punkt fra CHANGELOG-afsnit', () => {
    const md = [
      '# Changelog', '',
      '## 2026-11-20 – Facet fase 4: **Felten**', '', '- Min Dag er et `kortsæt`.', '- Andet punkt.', '',
      '## 2026-11-13', '- Uden titel springes over.', '',
      '## 2026-11-12 - Ny skærm', 'Skærmen er ny.',
    ].join('\n');
    expect(parseWhatsNew(md)).toEqual([
      { date: '2026-11-20', title: 'Facet fase 4: Felten', summary: 'Min Dag er et kortsæt.' },
      { date: '2026-11-12', title: 'Ny skærm', summary: 'Skærmen er ny.' },
    ]);
    expect(parseWhatsNew(md, 1)).toHaveLength(1);
  });
});
