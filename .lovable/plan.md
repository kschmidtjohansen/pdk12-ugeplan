# Mobilfixes + bil-noter for alle medarbejdere

## 1. Kan ikke scrolle til "Log ud" i brugermenuen (mobil)
Brugermenuen (avatar øverst til højre) viser afdelinger, underafdelinger, profil, tema og sprog. På mobil bliver listen højere end skærmen, og indholdet kan ikke scrolles, så "Log ud" nederst er utilgængelig.

Løsning: gør menuens indhold scrollbart med en maks-højde bundet til skærmhøjden, så alle punkter kan nås. "Log ud" gøres samtidig altid synlig i bunden af menuen (fastholdt nederst), så den ikke kræver scroll.

## 2. Sagsansvarlig og medarbejdere kan ikke vælges på mobil
På mobil åbnes begge vælgere som en bundskuffe (drawer) oven på opgave-dialogen. Skuffen ligger inde i dialogen, og tryk på et navn registreres ikke som et valg — listen ser rigtig ud, men intet bliver valgt.

Løsning: gør listepunkterne til rigtige knapper og reagér på selve trykket (pointer/touch) i stedet for et klik, der opsluges af den overliggende dialog. Samme rettelse i:
- Sagsansvarlig-vælgeren
- Medarbejder-vælgeren (flervalg — skuffen skal blive åben mens man vælger flere)

Efter rettelsen verificeres flowet i mobilvisning: opret opgave → vælg Kasper som sagsansvarlig → vælg Anders som medarbejder → gem.

## 3. Alle medarbejdere skal kunne tilføje en note på en bil
I dag kan kun administratorer/skadeledere redigere biler, og noten ligger i bil-redigeringsdialogen. Databasen tillader kun skriv til biler for admin/skadeleder.

Løsning:
- Ny handling "Tilføj/rediger note" på hver bil (både tabel- og mobilkortvisning), synlig for alle roller.
- Lille dialog med tekstfelt, gem/annullér, hvor eksisterende note vises og kan ændres.
- Noten vises fortsat som i dag på bil-listen.
- Adgang: en dedikeret databasefunktion, der kun kan opdatere feltet `notes` på en bil, og som alle indloggede brugere må kalde. Øvrige bilfelter forbliver låst til admin/skadeleder.
- Ændringen skrives i systemloggen som hidtil for bil-ændringer.

## Teknisk
- `src/components/Layout/NavComponents/UserMenu.tsx`: `max-h-[75dvh] overflow-y-auto` på `DropdownMenuContent`, sticky logout-item.
- `src/components/Planner/ResponsibleUserSelector.tsx` og `src/components/Planner/EmployeeSelector.tsx`: erstat `div onClick` med `<button type="button">` + `onPointerUp`/`onTouchEnd`-håndtering i drawer-varianten; behold popover-adfærd på desktop.
- Migration: `public.update_car_note(_car_id uuid, _note text)` — `SECURITY DEFINER`, `SET search_path = ''`, opdaterer kun `notes` og `updated_at`; `GRANT EXECUTE` til `authenticated`. Ingen ændring af eksisterende RLS-politikker på `cars`.
- Ny komponent `src/components/Cars/CarNoteDialog.tsx`; kaldes fra `CarsTable.tsx` og `MobileCarCard.tsx` via `CarsList.tsx`; ny action i `src/hooks/car/useCarActions.ts` der kalder RPC'en og refetcher.
- Danske/engelske tekster tilføjes i `src/translations/{da,en}/cars.ts`.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres efter implementering.
