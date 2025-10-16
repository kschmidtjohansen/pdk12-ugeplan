export const warehouse = {
  title: "Lager",
  addNew: "Tilføj til opbevaring",
  editItem: "Rediger opbevaring",
  deleteItem: "Slet opbevaring",
  
  fields: {
    address: "Adresse",
    caseNumber: "Sagsnummer",
    isCleaned: "Er rengjort?",
    quantity: "Antal",
    hall: "Hal",
    notes: "Noter",
    createdAt: "Oprettet",
    updatedAt: "Opdateret"
  },
  
  placeholders: {
    address: "Indtast adresse...",
    caseNumber: "Indtast sagsnummer...",
    quantity: "Indtast antal...",
    selectHall: "Vælg hal...",
    notes: "Tilføj eventuelle noter..."
  },
  
  actions: {
    save: "Gem",
    cancel: "Annuller",
    edit: "Rediger",
    delete: "Slet",
    confirm: "Bekræft"
  },
  
  messages: {
    addSuccess: "Opbevaring tilføjet succesfuldt",
    updateSuccess: "Opbevaring opdateret succesfuldt",
    deleteSuccess: "Opbevaring slettet succesfuldt",
    addError: "Kunne ikke tilføje opbevaring",
    updateError: "Kunne ikke opdatere opbevaring",
    deleteError: "Kunne ikke slette opbevaring",
    loadError: "Kunne ikke indlæse lagerliste"
  },
  
  validation: {
    addressRequired: "Adresse er påkrævet",
    quantityRequired: "Antal er påkrævet",
    quantityMin: "Antal skal være minimum 0"
  },
  
  deleteConfirm: {
    title: "Slet opbevaring",
    message: "Er du sikker på, at du vil slette denne opbevaring? Denne handling kan ikke fortrydes.",
    confirm: "Ja, slet",
    cancel: "Annuller"
  },
  
  empty: {
    title: "Ingen opbevaringer på lageret",
    description: "Begynd ved at tilføje din første opbevaring"
  },
  
  cleaned: "Rengjort",
  notCleaned: "Ikke rengjort",
  
  halls: {
    hal1: "Hal 1",
    sortHal: "Sort Hal"
  }
};
