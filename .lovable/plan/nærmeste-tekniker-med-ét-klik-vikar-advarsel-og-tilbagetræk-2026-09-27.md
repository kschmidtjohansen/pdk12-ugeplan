# Nærmeste tekniker med ét klik, vikar-advarsel og tilbagetræk af byttetilbud

## 1. "Nærmeste lige nu" når man opretter en opgave
Når adressen er udfyldt i opgaveformularen, vises en lille boks lige over medarbejdervælgeren:

```text
Nærmeste lige nu:  Jens Hansen · 3,2 km · fra Ribevej 4 (kl. 11-13)   [ + Tilføj ]
                   Anne Holm · 5,8 km · hjemmeadresse                 [ + Tilføj ]
```
- Den viser de 2 nærmeste, som kan tages den dag og det tidsrum. Syge, fraværende, udløbne vikarer og folk, der allerede er booket i tidsrummet, er sorteret fra.
- Afstanden måles fra personens seneste opgave den dag, eller hjemmeadressen hvis personen ikke har andre opgaver. Det er samme beregning, som ugeplanen bruger i dag.
- "Tilføj" sætter personen på opgaven med ét klik. Man kan stadig vælge frit i den fulde liste som før.
- Hvis ingen er ledige i nærheden, står der "Ingen ledige i nærheden", og boksen fylder næsten intet.

## 2. Advarsel 3 dage før en vikar udløber
- På Medarbejdere får vikarer, der udløber inden for 3 dage, et gult mærke: "Udløber om 2 dage". Mærket har en knap til at forlænge med det samme, som bruger de hurtigknapper, der allerede findes.
- Skadeledere og administratorer får et lille kort på forsiden: "2 vikarer udløber snart" med navne og et link til at forlænge. Kortet vises kun, når der er nogen på listen.
- I medarbejdervælgeren i ugeplanen står der "udløber snart" ud for vikaren, så skadelederen ser det, mens han/hun planlægger.

## 3. Trække sit byttetilbud tilbage
Knappen "Træk tilbage" findes allerede på egne ventende tilbud. Den forbedres sådan her:
- Man bliver spurgt om bekræftelse, før tilbuddet trækkes tilbage, så man ikke gør det ved et uheld.
- Knappen vises kun, så længe ingen har taget vagten. Tager en kollega vagten samtidig, får man en venlig besked i stedet for en fejl.
- Kollegaerne, der fik tilbuddet, får en besked og en push-besked: "Byttetilbuddet på [vagt] den [dato] er trukket tilbage". Så ingen prøver at tage en vagt, der ikke længere er til rådighed.

## Teknisk
- Ny komponent `NearestNowSuggestion` i `AssignmentFormFields`. Den genbruger `proximityRanking` (selectLastAssignment/selectProximityRankingDay), haversine og de eksisterende tilgængelighedsregler (`employeeAvailability`, sick_days, vikarens expires_at, konflikter). Ingen ekstra DAWA-kald, fordi opgavens koordinater allerede findes.
- En fælles hjælper `getTempExpiryStatus(expires_at)`, som returnerer `expiringSoon` når der er 3 dage eller mindre tilbage. Den bruges i EmployeeTableRow, MobileEmployeeCard, EmployeeSelector og et nyt dashboard-kort, der kun vises for admins og skadeledere.
- Migration: udvid `notify_duty_swap_status()`, så en ændring fra `pending` til `cancelled` opretter 'duty'-notifikationer til candidate_ids. `cancel_duty_swap` beholder sit tjek, der kun tillader status pending. Klienten viser en besked, hvis tilbuddet allerede er taget.
- Vi opdaterer CHANGELOG og docs/implementation-plan/tasks.md. Til sidst tjekker vi typerne og ser hver del efter i preview.
