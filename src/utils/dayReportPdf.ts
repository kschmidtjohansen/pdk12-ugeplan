import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

interface DayReportOptions {
  dateKey: string;
  /** Human readable date, e.g. "Mandag 21. september 2026" */
  dateLabel: string;
  departmentLabel: string;
  assignments: Assignment[];
  cars: Car[];
  /** Resolves employee ids to names (assignedEmployees is used first). */
  employeeNames?: Map<string, string>;
}

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;

/** Latin-1 safe text for the standard PDF fonts used by pdf-lib. */
const sanitize = (value: string): string =>
  (value || '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\xFF]/g, '');

const getCarNames = (assignment: Assignment, cars: Car[]): string[] => {
  const names: string[] = [];
  if (Array.isArray(assignment.cars) && assignment.cars.length > 0) {
    assignment.cars.forEach(carId => {
      const car = cars.find(c => c.id === carId);
      if (car) names.push(car.name);
    });
  } else if (assignment.car) {
    if (typeof assignment.car === 'string') {
      const car = cars.find(c => c.id === assignment.car);
      if (car) names.push(car.name);
    } else if (assignment.car.name) {
      names.push(assignment.car.name);
    }
  }
  return names;
};

const getEmployeeNames = (assignment: Assignment, lookup?: Map<string, string>): string[] => {
  const ids = new Set<string>();
  assignment.assignedEmployees?.forEach(emp => ids.add(emp.id));
  if (Array.isArray(assignment.employees)) assignment.employees.forEach(id => ids.add(id));
  return Array.from(ids)
    .map(id => assignment.assignedEmployees?.find(e => e.id === id)?.name || lookup?.get(id))
    .filter((name): name is string => !!name);
};

const wrap = (text: string, maxChars: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach(word => {
    if ((line + ' ' + word).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [''];
};

/**
 * Builds the A4 "dagsseddel" for a single day, grouped by car/team,
 * and triggers a browser download. pdf-lib is loaded on demand.
 */
export const generateDayReportPdf = async ({
  dateKey,
  dateLabel,
  departmentLabel,
  assignments,
  cars,
  employeeNames,
}: DayReportOptions): Promise<void> => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Group by car/team
  const groups = new Map<string, Assignment[]>();
  assignments.forEach(assignment => {
    const carNames = getCarNames(assignment, cars);
    const key = carNames.length > 0 ? carNames.join(' + ') : 'Uden bil';
    const list = groups.get(key) ?? [];
    list.push(assignment);
    groups.set(key, list);
  });
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'Uden bil') return 1;
    if (b === 'Uden bil') return -1;
    return a.localeCompare(b, 'da');
  });

  let page = pdfDoc.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;
  const pageNumbers: number[] = [];

  const newPage = () => {
    page = pdfDoc.addPage([A4.width, A4.height]);
    y = A4.height - MARGIN;
    drawHeader();
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 30) newPage();
  };

  function drawHeader() {
    page.drawText(sanitize('Dagsseddel'), { x: MARGIN, y: y - 4, size: 16, font: bold, color: rgb(0.1, 0.1, 0.12) });
    page.drawText(sanitize(departmentLabel), {
      x: MARGIN,
      y: y - 22,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.4),
    });
    const dateText = sanitize(dateLabel);
    page.drawText(dateText, {
      x: A4.width - MARGIN - bold.widthOfTextAtSize(dateText, 11),
      y: y - 4,
      size: 11,
      font: bold,
      color: rgb(0.1, 0.1, 0.12),
    });
    page.drawLine({
      start: { x: MARGIN, y: y - 32 },
      end: { x: A4.width - MARGIN, y: y - 32 },
      thickness: 1,
      color: rgb(0.85, 0.86, 0.9),
    });
    y -= 50;
    pageNumbers.push(pdfDoc.getPageCount());
  }

  drawHeader();

  if (sortedGroups.length === 0) {
    page.drawText(sanitize('Ingen opgaver planlagt denne dag.'), {
      x: MARGIN,
      y,
      size: 11,
      font,
      color: rgb(0.4, 0.4, 0.45),
    });
  }

  sortedGroups.forEach(([groupName, groupAssignments]) => {
    ensureSpace(60);
    page.drawRectangle({
      x: MARGIN,
      y: y - 6,
      width: A4.width - MARGIN * 2,
      height: 20,
      color: rgb(0.94, 0.95, 0.97),
    });
    page.drawText(sanitize(groupName), { x: MARGIN + 6, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.12) });
    const countText = sanitize(`${groupAssignments.length} opgave${groupAssignments.length === 1 ? '' : 'r'}`);
    page.drawText(countText, {
      x: A4.width - MARGIN - 6 - font.widthOfTextAtSize(countText, 9),
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.45),
    });
    y -= 26;

    const sorted = [...groupAssignments].sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''));

    sorted.forEach(assignment => {
      const employeesList = getEmployeeNames(assignment, employeeNames);
      const address = [assignment.location, assignment.zip_code, assignment.city].filter(Boolean).join(', ');
      const descriptionLines = assignment.description ? wrap(sanitize(assignment.description), 95).slice(0, 2) : [];
      const blockHeight = 44 + (employeesList.length > 0 ? 12 : 0) + descriptionLines.length * 11;
      ensureSpace(blockHeight);

      const time = `${(assignment.fromTime || '').slice(0, 5)} - ${(assignment.toTime || '').slice(0, 5)}`;
      page.drawText(sanitize(time), { x: MARGIN, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.12) });

      const title = sanitize(
        [assignment.case_number, assignment.title].filter(Boolean).join(' · ') || 'Opgave'
      );
      page.drawText(title.slice(0, 70), { x: MARGIN + 80, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.12) });

      if (!assignment.published) {
        const draft = sanitize('KLADDE');
        page.drawText(draft, {
          x: A4.width - MARGIN - bold.widthOfTextAtSize(draft, 8),
          y,
          size: 8,
          font: bold,
          color: rgb(0.78, 0.45, 0.05),
        });
      }
      y -= 13;

      if (address) {
        page.drawText(sanitize(address).slice(0, 95), {
          x: MARGIN + 80,
          y,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.4),
        });
        y -= 12;
      }

      const responsible = assignment.responsibleUser?.name
        ? `Ansvarlig: ${assignment.responsibleUser.name}`
        : '';
      const team = employeesList.length > 0 ? `Hold: ${employeesList.join(', ')}` : '';
      const metaLine = [responsible, team].filter(Boolean).join('   ');
      if (metaLine) {
        page.drawText(sanitize(metaLine).slice(0, 110), {
          x: MARGIN + 80,
          y,
          size: 9,
          font,
          color: rgb(0.35, 0.35, 0.4),
        });
        y -= 12;
      }

      descriptionLines.forEach(line => {
        page.drawText(line, { x: MARGIN + 80, y, size: 8.5, font, color: rgb(0.45, 0.45, 0.5) });
        y -= 11;
      });

      y -= 8;
      page.drawLine({
        start: { x: MARGIN, y: y + 4 },
        end: { x: A4.width - MARGIN, y: y + 4 },
        thickness: 0.5,
        color: rgb(0.9, 0.91, 0.94),
      });
      y -= 6;
    });

    y -= 8;
  });

  // Footer on every page
  const printedAt = new Date().toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
  const pages = pdfDoc.getPages();
  pages.forEach((p, index) => {
    const footer = sanitize(`Udskrevet ${printedAt}`);
    p.drawText(footer, { x: MARGIN, y: 24, size: 8, font, color: rgb(0.55, 0.55, 0.6) });
    const pageLabel = sanitize(`Side ${index + 1} af ${pages.length}`);
    p.drawText(pageLabel, {
      x: A4.width - MARGIN - font.widthOfTextAtSize(pageLabel, 8),
      y: 24,
      size: 8,
      font,
      color: rgb(0.55, 0.55, 0.6),
    });
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dagsseddel-${dateKey}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
