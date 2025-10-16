export const warehouse = {
  title: "Lagerliste",
  addNew: "Tilføj ny vare",
  editItem: "Rediger vare",
  deleteItem: "Slet vare",
  
  fields: {
    address: "Adresse",
    caseNumber: "Sagsnummer",
    isCleaned: "Er rengjort?",
    quantity: "Antal",
    notes: "Noter",
    createdAt: "Oprettet",
    updatedAt: "Opdateret"
  },
  
  placeholders: {
    address: "Indtast adresse...",
    caseNumber: "Indtast sagsnummer...",
    quantity: "Indtast antal...",
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
    addSuccess: "Vare tilføjet succesfuldt",
    updateSuccess: "Vare opdateret succesfuldt",
    deleteSuccess: "Vare slettet succesfuldt",
    addError: "Kunne ikke tilføje vare",
    updateError: "Kunne ikke opdatere vare",
    deleteError: "Kunne ikke slette vare",
    loadError: "Kunne ikke indlæse lagerliste"
  },
  
  validation: {
    addressRequired: "Adresse er påkrævet",
    quantityRequired: "Antal er påkrævet",
    quantityMin: "Antal skal være minimum 0"
  },
  
  deleteConfirm: {
    title: "Slet lagervare",
    message: "Er du sikker på, at du vil slette denne vare? Denne handling kan ikke fortrydes.",
    confirm: "Ja, slet",
    cancel: "Annuller"
  },
  
  empty: {
    title: "Ingen varer i lageret",
    description: "Begynd ved at tilføje din første lagervare"
  },
  
  cleaned: "Rengjort",
  notCleaned: "Ikke rengjort"
};
