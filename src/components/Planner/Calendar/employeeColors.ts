/**
 * Faste, individuelle medarbejderfarver — bruges KUN i kalendervisningen
 * (Outlook-stil). Andre visninger i ugeplanen er bevidst uberørte.
 *
 * Farverne er HSL-baserede og valgt, så de er tydeligt adskilte og læsbare
 * i både lys og mørk tilstand.
 */

export interface EmployeeColor {
  /** Kraftig kant/prik-farve */
  border: string;
  /** Svag baggrund til opgaveblokke */
  background: string;
  /** Lidt kraftigere baggrund til hover/valgt */
  backgroundStrong: string;
  /** Læsbar tekstfarve oven på baggrunden */
  text: string;
}

const HUES = [210, 152, 28, 340, 265, 186, 45, 0, 120, 300, 20, 240, 170, 320, 60, 200];

const makeColor = (hue: number): EmployeeColor => ({
  border: `hsl(${hue} 70% 45%)`,
  background: `hsl(${hue} 78% 94%)`,
  backgroundStrong: `hsl(${hue} 72% 88%)`,
  text: `hsl(${hue} 75% 22%)`,
});

/** Stabil hash, så den samme medarbejder altid får den samme farve. */
const hashId = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
};

export const getEmployeeColor = (employeeId: string, index?: number): EmployeeColor => {
  const hueIndex =
    typeof index === 'number' && index >= 0
      ? index % HUES.length
      : hashId(employeeId) % HUES.length;
  return makeColor(HUES[hueIndex]);
};
