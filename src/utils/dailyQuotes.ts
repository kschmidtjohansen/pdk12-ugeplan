/**
 * Dagens citat – en samling af motiverende og anerkendende citater på dansk.
 * Citatet skifter automatisk hver dag (baseret på dagen i året + årstallet),
 * så medarbejderne får ny inspiration hver eneste dag året rundt.
 */

const danishMotivationalQuotes: string[] = [
  // Anerkendelse
  "Din dedikation gør en forskel hver dag – tak for dit hårde arbejde!",
  "Du er en værdifuld del af vores team, og dit bidrag betyder meget.",
  "Tak fordi du giver dit bedste – det bliver bemærket og værdsat!",
  "Din professionalisme og engagement inspirerer os alle.",
  "Hver opgave du løser, gør vores virksomhed stærkere – tak!",
  "Du er grunden til, at vi leverer kvalitet hver dag.",
  "Din positive attitude smitter af på hele teamet – fortsæt sådan!",
  "Tak for din trofasthed og det arbejde du lægger i alt, hvad du gør.",
  "Du gør en forskel – ikke bare i dag, men hver dag.",
  "Din ekspertise og erfaring er uvurderlig for os alle.",

  // Faglig stolthed
  "Godt håndværk ses ikke altid, men det mærkes altid.",
  "Kvalitet er ikke en tilfældighed – det er en vane.",
  "Det er detaljerne, der gør forskellen mellem godt og fremragende.",
  "Gør det ordentligt første gang, så holder det i mange år.",
  "Du efterlader hvert sted bedre, end du fandt det.",
  "Stolthed i arbejdet er den bedste kvalitetskontrol.",
  "En god dag på jobbet starter med en god forberedelse.",
  "Ægte fagfolk kendes på, hvordan de rydder op efter sig.",
  "Din faglighed er din underskrift – sæt den med stolthed.",
  "Det, du gør godt i dag, sparer nogen for bekymring i morgen.",

  // Samarbejde
  "Alene når vi langt – sammen når vi hele vejen.",
  "Et godt team er ikke perfekte folk, men folk der hjælper hinanden.",
  "Spørg om hjælp i tide – det er styrke, ikke svaghed.",
  "Den bedste kollega er den, der deler sin viden.",
  "Vi løfter i flok, og derfor bliver ingen opgave for tung.",
  "En god overlevering er en gave til din kollega.",
  "Tal pænt om hinanden – også når kunden ikke hører det.",
  "Når én af os lykkes, lykkes vi alle sammen.",
  "Et smil til en kollega koster ingenting og betyder alt.",
  "Tak fordi du deler din viden og hjælper dine kolleger.",

  // Handlekraft i pressede situationer
  "Ro i stemmen skaber ro i rummet.",
  "Tag den næste rigtige beslutning – ikke den perfekte.",
  "Når det brænder på, er det din rutine, der bærer dig.",
  "En travl dag bliver kortere, når man tager én opgave ad gangen.",
  "Du kan ikke styre vejret, men du kan styre din indsats.",
  "Pres viser ikke, hvem du er – det viser, hvad du har trænet.",
  "Der er altid en vej videre, også når planen brister.",
  "Det, der føles uoverskueligt nu, er en historie du griner af senere.",
  "Træk vejret, se på opgaven, og tag første skridt.",
  "Kunden husker ikke skaden – de husker, hvordan du hjalp.",

  // Kunden og mennesket
  "Bag hver skade står et menneske, der har brug for tryghed.",
  "Et venligt ord kan betyde mere end det tekniske arbejde.",
  "Lyt færdigt, før du svarer – folk vil gerne høres.",
  "Fortæl kunden, hvad der sker – uvished er det værste.",
  "Vi sælger ikke timer, vi leverer tryghed.",
  "Man glemmer, hvad du sagde, men husker, hvordan du fik dem til at føle.",
  "Hold hvad du lover, og lov kun det du kan holde.",
  "Din ærlighed er firmaets bedste omdømme.",

  // Vedholdenhed og udvikling
  "Små forbedringer hver dag bliver til store resultater.",
  "Du behøver ikke være perfekt – bare lidt bedre end i går.",
  "Erfaring er summen af de dage, hvor man blev ved.",
  "Den, der aldrig laver fejl, prøver aldrig noget nyt.",
  "Lær af i går, arbejd i dag, glæd dig til i morgen.",
  "Vaner slår viljestyrke – byg de gode vaner.",
  "Det svære i dag er det nemme om et halvt år.",
  "Bliv ved lidt længere end du havde lyst til – der sker udviklingen.",

  // Godt humør og energi
  "Godt humør er arbejdstøj, man aldrig glemmer derhjemme.",
  "Start dagen med et smil – det holder længere end kaffen.",
  "Grin lidt undervejs, dagen bliver kortere af det.",
  "Den bedste stemning på en arbejdsplads skaber vi selv.",
  "En kop kaffe med en kollega er også en investering.",
  "Din energi bestemmer dagens tempo – vælg den bevidst.",
  "Musik i bilen og styr på dagen – så kan det hele lade sig gøre.",

  // Sikkerhed og omtanke
  "Ingen opgave haster så meget, at sikkerheden kan vente.",
  "Tag de to minutter ekstra – de er billigere end en skade.",
  "Pas på dig selv, så du kan passe på andre.",
  "Løft med benene og bed om hjælp – kroppen skal holde i mange år.",
  "Husk pausen – den gør dig hurtigere resten af dagen.",

  // Afrunding af dagen
  "Slut dagen med at spørge: hvad gik godt i dag?",
  "Du har gjort dit bedste i dag – det er rigeligt.",
  "Læg arbejdet på jobbet, og tag roen med hjem.",
  "Fri betyder fri – du har fortjent den.",
  "Tak for i dag – i morgen er en ny mulighed.",
];

/** Dagen i året, 1-365/366. */
const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

/**
 * Returnerer dagens citat. Kombinationen af dagen i året og årstallet sikrer,
 * at citatet skifter hver dag – og ikke gentager samme dato hvert år.
 */
export const getDailyQuote = (date: Date = new Date()): string => {
  const seed = getDayOfYear(date) + date.getFullYear() * 7;
  const index = ((seed % danishMotivationalQuotes.length) + danishMotivationalQuotes.length) % danishMotivationalQuotes.length;
  return danishMotivationalQuotes[index];
};

export const dailyQuotesCount = danishMotivationalQuotes.length;
