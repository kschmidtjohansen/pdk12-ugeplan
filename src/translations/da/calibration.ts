const calibration = {
  title: "Kalibreringsrapporter",
  subtitle: "Administrer kalibreringsrapporter og se udstyrsmanualer",
  newReport: "Ny rapport",
  manuals: "Kalibreringsmanualer",
  tabs: {
    reports: "Rapporter",
    form: "Ny rapport",
    manuals: "Manualer"
  },
  form: {
    departmentAndEmployee: "Afdeling og medarbejdernavn",
    reportNumber: "Rapport nr.",
    controlDate: "Dato for kontrol",
    notes: "Bemærkninger",
    status: "Status",
    draft: "Kladde",
    completed: "Færdig",
    required: "Påkrævet",
    placeholders: {
      departmentEmployee: "F.eks. Skadeservice - John Doe",
      reportNumber: "F.eks. 12TRE-0001",
      productName: "F.eks. Tramex MRH III",
      productNumber: "Evt. probe nummer",
      approvedMargin: "F.eks. ±2%",
      measuredResult: "F.eks. 1,3",
      initials: "F.eks. JD",
      notes: "Korte noter, særlige observationer eller kommentarer...",
      select: "Vælg"
    }
  },
  equipment: {
    title: "Kontrollerede enheder",
    number: "Nr.",
    productName: "Produktnavn",
    productNumber: "Produktnummer", 
    approvedMargin: "Godkendt margen",
    measuredResult: "Målt værdi",
    assessment: "Vurdering",
    initials: "Initialer",
    addEquipment: "Tilføj udstyr",
    removeEquipment: "Fjern udstyr"
  },
  assessment: {
    ok: "OK",
    notOk: "Ikke OK"
  },
  actions: {
    save: "Gem",
    saveDraft: "Gem som kladde",
    generatePdf: "Generer PDF",
    download: "Download",
    viewManuals: "Se manualer",
    cancel: "Annuller",
    complete: "Gem og færdiggør",
    generating: "Genererer..."
  },
  messages: {
    saveSuccess: "Rapporten blev gemt",
    saveError: "Fejl ved gem af rapport",
    pdfGenerating: "PDF genereres...",
    pdfGenerated: "PDF er klar til download",
    pdfComingSoon: "PDF funktionalitet kommer snart",
    pdfError: "Kunne ikke generere PDF",
    error: "Fejl"
  },
  reportsSection: {
    title: "Kalibreringsrapporter",
    description: "Oversigt over alle oprettede kalibreringsrapporter"
  },
  formSection: {
    description: "Udfyld kalibreringsrapporten for fugtudstyr"
  },
  manualsSection: {
    title: "Kalibreringsmanualer for alt udstyr",
    description: "Manualer til kalibrering af alt udstyr",
    cardDescription: "Komplet manual til kalibrering af fugtmålingsudstyr",
    introText: "Denne manual indeholder detaljerede instruktioner til kalibrering af følgende udstyr:",
    equipment: {
      gann: "Gann Uni 1",
      lufftXA: "Lufft XA1000",
      lufftXP: "Lufft XP200",
      tramex: "Tramex MRH III",
      more: "Og meget mere..."
    },
    openManuals: "Åbn kalibreringsmanualer",
    importantNotes: "Vigtige bemærkninger",
    warningTitle: "⚠️ Kalibrering bør kun udføres af uddannet personale",
    warningText: "Sørg for at have passende måleudstyr og referencer tilgængelige",
    tipsTitle: "💡 Tips til kalibrering",
    tips: {
      tip1: "Hold sensoren så langt tilbage som muligt",
      tip2: "Undgå at hånden påvirker måleresultatet", 
      tip3: "Kontroller at målinger er inden for producent tolerancer",
      tip4: "Dokumenter alle observationer i bemærkningsfeltet"
    }
  },
  reportsList: {
    noReports: "Ingen rapporter endnu",
    noReportsDescription: "Opret din første kalibreringsrapport ved at klikke på 'Ny rapport' knappen.",
    reportNumber: "Rapport #",
    controlDate: "Kontrol dato:",
    notesLabel: "Bemærkninger:",
    createdLabel: "Oprettet:",
    downloadPdf: "PDF"
  }
};

export default calibration;