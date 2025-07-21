
const danishMotivationalQuotes = [
  "Din dedikation gør en forskel hver dag - tak for dit hårde arbejde!",
  "Du er en værdifuld del af vores team, og dit bidrag betyder meget.",
  "Tak fordi du giver dit bedste - det bliver bemærket og værdsat!",
  "Din professionalisme og engagement inspirerer os alle.",
  "Hver opgave du løser, gør vores virksomhed stærkere - tak!",
  "Du er grunden til, at vi leverer kvalitet hver dag.",
  "Din positive attitude smitter af på hele teamet - fortsæt sådan!",
  "Tak for din trofasthed og det arbejde du lægger i alt, hvad du gør.",
  "Du gør en forskel - ikke bare i dag, men hver dag.",
  "Din ekspertise og erfaring er uvurderlig for os alle.",
  "Tak fordi du altid stræber efter at gøre dit bedste.",
  "Du er en sand professionel - dit arbejde taler for sig selv.",
  "Din indsats hjælper os med at nå vores mål sammen.",
  "Tak for din fleksibilitet og villighed til at hjælpe.",
  "Du er en inspirerende kollega og en værdsat medarbejder.",
  "Din kreativitet og løsningsorientering gør dig unik.",
  "Tak for den energi og entusiasme du bringer til arbejdet.",
  "Du er med til at skabe en fantastisk arbejdsplads for os alle.",
  "Din pålidelighed er noget vi alle kan regne med - tak!",
  "Tak fordi du deler din viden og hjælper dine kolleger.",
  "Du viser hver dag, hvad ægte teamwork betyder.",
  "Din omhu og opmærksomhed på detaljer gør forskellen.",
  "Tak for din tålmodighed og forståelse i udfordrende situationer.",
  "Du er en rollemodel for, hvad det vil sige at være professionel.",
  "Din positive energi løfter hele arbejdspladsen - tak!",
  "Tak for din dedikation til at levere kvalitet i alt, hvad du gør.",
  "Du gør vores team stærkere med din tilstedeværelse.",
  "Din arbejdsglæde og engagement er smittende - fortsæt sådan!",
  "Tak fordi du tager ansvar og viser initiativ hver dag.",
  "Du er en ægte teamplayer, og vi sætter stor pris på dig!"
];

export const getDailyQuote = (): string => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Use day 1-30, if day 31 then use quote for day 30
  const quoteIndex = Math.min(dayOfMonth - 1, 29);
  
  return danishMotivationalQuotes[quoteIndex];
};
