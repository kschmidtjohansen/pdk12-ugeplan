## Gør topbjælken lidt mindre

Topbjælken (titel, uge, klokke, profil og søgefelt) gøres lavere og strammere, så den fylder mindre i højden. Alt indhold og alle funktioner er de samme.

- Mindre luft over/under og mellem de to rækker (ca. 8 px mindre i alt).
- Sidemenu-knappen ca. 36 px i stedet for 44 px.
- Søgerækken får mindre afstand til første række.

### Teknisk
- `src/components/Layout/AppTopBar.tsx`: container `py-2 gap-y-2` -> `py-1.5 gap-y-1.5`; SidebarTrigger `min-h-11 min-w-11` -> `min-h-9 min-w-9`; søgerække `pt-2` -> `pt-1.5`.
- Klokke, profil og søgefelt beholder egne komponenter uændret. CHANGELOG opdateres, ingen publicering.
