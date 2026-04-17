

## Plan: Faktisk fix af scrollbar + altid synlig luk-knap

### Rod-årsager identificeret

1. **Scrollbar går uden for `rounded-2xl`-kanten**: Den indre wrapper `<div className="overflow-y-auto max-h-[90vh] p-8 pr-12">` ligger inden i den ydre Content (som har `rounded-2xl overflow-hidden`), men scrollbaren tegnes på det indre div's højre kant — som er `pr-12` fra højre, men selve scrollbaren ligger HELT yderst i wrapperen. Resultat: visuel scrollbar tæt på den afrundede hjørne-kant.

2. **Luk-knappen forsvinder bag indhold ved scroll**: Knappen er `absolute top-4 right-4` på det ydre Content. Den indre scroll-wrapper renderer Tabs/Form-indhold i topen. Når der scrolles, er luk-knappen ovenpå, men dens baggrund (`bg-background/90 backdrop-blur-sm`) er **half-transparent** og kontrasten mod scrollende formularfelter er for lav — derfor "forsvinder" den visuelt.

3. **Submit-knap scroller med indholdet**: I `AssignmentForm` er bunden (`<div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">`) en almindelig div, ikke sticky. Det giver indtryk af "to scrollbars" fordi indhold er højt og knappen først ses efter scroll.

### Løsning

**Fil 1: `src/components/ui/dialog.tsx`** — restrukturer Content så scrollbaren ligger pænt INDEN for den afrundede ramme, og luk-knappen er tydelig på alle baggrunde:
- Fjern `max-h-[90vh]` fra det ydre Content (så det shrinker til indhold) — behold `max-h-[90vh]` kun på den indre scroll-wrapper.
- Fjern `before:` gradient overlay (den interfererer med klik på luk-knappen og laver visuel støj).
- Tilføj `mr-1 my-1` på den indre scroll-div så scrollbaren ikke rører den afrundede kant.
- Tilføj custom scrollbar-styling (`scrollbar-thin`-lignende klasser) for diskret look.
- Luk-knap: stærkere baggrund (`bg-background` solid + `border-border` solid + `shadow-md`), så den altid er tydelig over scrollende indhold.
- Behold luk-knappens `z-[60]` og `top-3 right-3` (lidt tættere på hjørnet).

**Fil 2: `src/components/Planner/AssignmentForm.tsx`** — gør submit-bunden sticky inden for scroll-containeren:
- Wrap form-indholdet og bunden så bunden får `sticky bottom-0 -mx-8 -mb-8 px-8 py-4 bg-background/95 backdrop-blur border-t` (negativ margin neutraliserer dialogens `p-8`).
- Det fjerner indtrykket af "ekstra scrollbar" og holder Opdater-knappen altid synlig.

**Fil 3: `CHANGELOG.md`** — log korrekt fix.

### Ingen logik-ændringer
Kun CSS-omstrukturering. Ingen API-ændringer i `DialogContent`-props, så alle 50+ kald-steder virker uændret.

### Scope
- 3 filer
- Ingen DB-ændringer
- Ingen test/build-impact ud over visuelt

