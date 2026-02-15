

## Visuel konsistens-gennemgang

### Audit-resultat

| Kategori | Fund | Prioritet |
|----------|------|-----------|
| Hardcoded farver vs. tema-variabler | 124 `text-gray-*` i 11 filer (dark mode-inkompatibelt) | Medium |
| Uguardede console.logs (overset) | 50+ i AssignmentCard, DaySection, EmployeeSelector, ResponsibleUserSelector, AssignmentFormFields | Hoej |
| Inkonsistente tomme tilstande | 4 forskellige patterns | Medium |
| Planner EmptyState ubrugt | `Planner/EmptyState.tsx` bruges ikke | Lav |

---

### 1. KRITISK: 50+ uguardede console.logs i Planner-komponenter

Disse blev overset i de to forrige performance-runder:

| Fil | Antal uguardede logs |
|-----|---------------------|
| `AssignmentCard.tsx` | 15 (inkl. per-card debug med fulde objekter - MASSIV per-render overhead) |
| `DaySection.tsx` | 2 (linje 52, 63) |
| `EmployeeSelector.tsx` | 8 (linje 76, 101-107, 179) |
| `ResponsibleUserSelector.tsx` | 9 (linje 20-24, 41-43, 55, 69, 77) |
| `AssignmentFormFields.tsx` | 4 (linje 77, 88, 94, 104) |

`AssignmentCard.tsx` er vaerst: 15 console.log-kald koerer for HVERT kort i listen. Med 20 opgaver = 300 log-linjer per render.

**Rettelse:** Wrap alle i `import.meta.env.DEV` guard.

---

### 2. Hardcoded `text-gray-*` farver (dark mode problem)

Disse steder bruger hardcoded Tailwind-gra-farver i stedet for tema-variabler (`text-foreground`, `text-muted-foreground`). Det betyder, at teksten bliver ulaeselig i dark mode.

**Vigtigste steder:**

| Fil | Problem |
|-----|---------|
| `PageHeader.tsx` | `text-gray-900` og `text-gray-600` paa overskrift/beskrivelse |
| `shared/EmptyState.tsx` | `text-gray-900`, `text-gray-500`, `text-gray-400` |
| `Planner/EmptyState.tsx` | `text-gray-900`, `text-gray-400`, `bg-gray-100` |
| `CompactAssignmentRow.tsx` | 5x `text-gray-900` paa tabel-celler |
| `EmployeesList.tsx` | `text-gray-900`, `text-gray-600`, `text-gray-300`, `text-gray-500` |
| `LoginPage.tsx` | `bg-gray-50`, `text-gray-900`, `text-gray-600` |
| `MobileCarCard.tsx` | 5x `text-gray-900` |
| `CarsTable.tsx` | 3x `text-gray-900` |
| `AssignmentCard.tsx` | `text-gray-600`, `text-gray-800` |
| `DaySection.tsx` | `text-gray-500` |

**Rettelse:** Erstat med tema-variabler:
- `text-gray-900` -> `text-foreground`
- `text-gray-600/700` -> `text-muted-foreground`
- `text-gray-400/500` -> `text-muted-foreground`
- `bg-gray-100` -> `bg-muted`
- `bg-gray-50` -> `bg-background`

---

### 3. Inkonsistente tomme tilstande

Der er 4 forskellige patterns for "tom liste" paa tvaers af appen:

| Sted | Pattern |
|------|---------|
| `DaySection.tsx` (linje 129) | `border-dashed` div med tekst |
| `DutyList.tsx` (linje 70) | Card med `text-muted-foreground` |
| `CarsList.tsx` (linje 34) | Lucide-ikon + `text-muted-foreground` |
| `EmployeesList.tsx` (linje 75) | Ikon + titel + beskrivelse + retry-knap |
| `PlannerContent.tsx` (linje 127) | Simpel `text-center py-8 text-muted-foreground` |

**Rettelse:** Standardiser alle tomme tilstande til at bruge temafarver og ensartet spacing:
- Ikon i cirkel (bg-muted/50)
- Tekst i `text-muted-foreground` (ikke hardcoded graa)
- Ensartet `py-12` spacing

---

### 4. Ubrugt Planner/EmptyState.tsx

`src/components/Planner/EmptyState.tsx` eksporterer en komponent, men den bruges ingen steder i kodebasen. `PlannerContent.tsx` bruger i stedet en inline div. Komponenten kan slettes.

---

### Konkrete aendringer

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/AssignmentCard.tsx` | Wrap 15 console.log i `import.meta.env.DEV` guard |
| `src/components/Planner/DaySection.tsx` | Wrap 2 console.log i DEV guard. Erstat `text-gray-500` med `text-muted-foreground` |
| `src/components/Planner/EmployeeSelector.tsx` | Wrap 8 console.log i DEV guard |
| `src/components/Planner/ResponsibleUserSelector.tsx` | Wrap 9 console.log i DEV guard |
| `src/components/Planner/AssignmentFormFields.tsx` | Wrap 4 console.log i DEV guard |
| `src/components/Layout/PageHeader.tsx` | Erstat `text-gray-900` -> `text-foreground`, `text-gray-600` -> `text-muted-foreground` |
| `src/components/shared/EmptyState.tsx` | Erstat hardcoded gra-farver med tema-variabler |
| `src/components/Planner/EmptyState.tsx` | Slet filen (ubrugt) |
| `src/components/Planner/CompactAssignmentRow.tsx` | Erstat 5x `text-gray-900` med `text-foreground` |
| `src/components/Employees/EmployeesList.tsx` | Erstat hardcoded gra-farver med tema-variabler |
| `src/components/Planner/AssignmentCard.tsx` | Erstat `text-gray-600`/`text-gray-800` med tema-variabler |
| `CHANGELOG.md` | Tilfoej alle aendringer |

### Hvad der IKKE aendres

- Ingen aaendringer i UI-layout, stoerrelse eller funktionalitet
- LoginPage beholder sin nuvaerende stil (login-siden bruger bevidst lyse farver)
- CarsTable og MobileCarCard: aendres ikke i denne runde for at begranse scope (kan tages separat)
