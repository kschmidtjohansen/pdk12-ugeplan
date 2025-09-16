const calibration = {
  title: "Kalibreringsrapporter",
  newReport: "Ny rapport",
  manuals: "Kalibreringsmanualer", 
  form: {
    departmentAndEmployee: "Afdeling og medarbejdernavn",
    reportNumber: "Rapport nr.",
    controlDate: "Dato for kontrol",
    notes: "Bemærkninger",
    status: "Status",
    draft: "Kladde",
    completed: "Færdig"
  },
  equipment: {
    title: "Kontrollerede enheder",
    number: "Enhed nr.",
    productName: "Produktnavn",
    productNumber: "Produktnummer", 
    approvedMargin: "Godkendt margen (jf. producent)",
    measuredResult: "Resultat (målt værdi)",
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
    viewManuals: "Se manualer"
  },
  messages: {
    saveSuccess: "Rapporten blev gemt",
    saveError: "Fejl ved gem af rapport",
    pdfGenerating: "PDF genereres...",
    pdfGenerated: "PDF er klar til download"
  }
};

export default calibration;