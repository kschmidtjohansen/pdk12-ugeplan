# UI Guidelines

Denne mappe beskriver de visuelle standarder for projektet. Alle nye komponenter skal følge disse retningslinjer.

## Farver og tema

- **Brug altid semantiske tema-variabler** fra `index.css` og `tailwind.config.ts`
- Aldrig hardcoded farver som `text-gray-500` — brug `text-muted-foreground`
- Alle farver skal fungere i både light og dark mode
- Primære tokens: `--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--card`, `--border`

## Visningstyper

Planlæggeren understøtter 3 visninger, og nye komponenter skal fungere i alle:

1. **Standard** — Fuld kortvisning med alle detaljer
2. **Kompakt** — Reduceret visning med mindre padding og færre detaljer
3. **Gitter** — 3-kolonne grid-layout på desktop (`md:grid-cols-3`)

## Typografi

- Side-titler: `text-2xl font-bold tracking-tight text-foreground`
- Beskrivelser: `text-sm text-muted-foreground leading-relaxed`
- Kort-headers: `font-semibold`

## Kort og containere

- Standard afrunding: `rounded-xl` (kort) / `rounded-2xl` (page headers)
- Skygger: `shadow-sm` (kort) / `shadow-md` (page headers)
- Border: `border border-border/50`
- Hover: `hover:shadow-xl transition-all duration-200`

## Tomme tilstande (Empty States)

- Brug `shared/EmptyState` komponenten eller følg mønsteret:
  - Centreret ikon (f.eks. `CalendarX2`) i `text-muted-foreground/50`
  - Beskrivende tekst i `text-muted-foreground`
  - Baggrund: `bg-muted/20`
  - Padding: `py-8` / `py-12`
  - Afrunding: `rounded-xl`

## Responsivt design

- Mobile-first tilgang med Tailwind breakpoints
- Pull-to-refresh på listevisninger
- Mobile kort-varianter for tabeller (f.eks. `MobileCarCard`, `MobileEmployeeCard`)
- Touch-venlige knapstørrelser (minimum 44x44px)

## Animationer

- Hover-transitions: `transition-all duration-200`
- Brug `framer-motion` til komplekse animationer (ikke installeret endnu)
- Undgå layout-shifts ved state-ændringer
