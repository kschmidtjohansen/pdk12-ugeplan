import { describe, it, expect } from 'vitest';
import { buildMobileTabs } from './mobileNavTabs';

describe('Mobil navigation – feature-flag for Vagter', () => {
  it('viser Vagter-fanen når afdelingen har vagtmodulet slået til', () => {
    const tabs = buildMobileTabs({ isDa: true, isDutyEnabled: true, totalUnread: 0 });
    expect(tabs.map((t) => t.to)).toEqual(['/dashboard', '/planner', '/duty']);
  });

  it('skjuler Vagter-fanen når vagtmodulet er slået fra (som på desktop)', () => {
    const tabs = buildMobileTabs({ isDa: true, isDutyEnabled: false, totalUnread: 0 });
    expect(tabs.map((t) => t.to)).toEqual(['/dashboard', '/planner']);
    expect(tabs.some((t) => t.to === '/duty')).toBe(false);
  });

  it('bruger danske etiketter og viser ulæst-badge på Ugeplan', () => {
    const tabs = buildMobileTabs({ isDa: true, isDutyEnabled: true, totalUnread: 3 });
    expect(tabs[0].label).toBe('Min Dag');
    expect(tabs[1].label).toBe('Ugeplan');
    expect(tabs[1].badge).toBe(3);
    expect(tabs[2].label).toBe('Vagter');
  });

  it('bruger engelske etiketter når sproget er engelsk', () => {
    const tabs = buildMobileTabs({ isDa: false, isDutyEnabled: true, totalUnread: 0 });
    expect(tabs.map((t) => t.label)).toEqual(['My Day', 'Planner', 'Duties']);
  });
});
