export const warehouse = {
  title: "Warehouse List",
  addNew: "Add New Item",
  editItem: "Edit Item",
  deleteItem: "Delete Item",
  
  fields: {
    address: "Address",
    caseNumber: "Case Number",
    isCleaned: "Is Cleaned?",
    quantity: "Quantity",
    hall: "Hall",
    notes: "Notes",
    createdAt: "Created",
    updatedAt: "Updated"
  },
  
  placeholders: {
    address: "Enter address...",
    caseNumber: "Enter case number...",
    quantity: "Enter quantity...",
    selectHall: "Select hall...",
    notes: "Add any notes..."
  },
  
  actions: {
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    markAsDelivered: "Mark as delivered"
  },
  
  messages: {
    addSuccess: "Item added successfully",
    updateSuccess: "Item updated successfully",
    deleteSuccess: "Item deleted successfully",
    addError: "Failed to add item",
    updateError: "Failed to update item",
    deleteError: "Failed to delete item",
    loadError: "Failed to load warehouse list"
  },
  
  validation: {
    addressRequired: "Address is required",
    quantityRequired: "Quantity is required",
    quantityMin: "Quantity must be at least 0"
  },
  
  deleteConfirm: {
    title: "Delete Warehouse Item",
    message: "Are you sure you want to delete this item? This action cannot be undone.",
    confirm: "Yes, delete",
    cancel: "Cancel"
  },
  
  empty: {
    title: "No items in warehouse",
    description: "Start by adding your first warehouse item"
  },
  
  cleanedStatus: {
    ja: "Yes",
    nej: "No",
    ikkeNoedvendigt: "Not necessary"
  },
  
  halls: {
    hal1: "Hall 1",
    sortHal: "Black Hall"
  }
};
