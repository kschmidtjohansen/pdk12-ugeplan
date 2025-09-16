const calibration = {
  title: "Calibration Reports",
  subtitle: "Manage calibration reports and view equipment manuals",
  newReport: "New Report",
  manuals: "Calibration Manuals",
  tabs: {
    reports: "Reports",
    form: "New Report",
    manuals: "Manuals"
  },
  form: {
    departmentAndEmployee: "Department and Employee Name",
    reportNumber: "Report Number",
    controlDate: "Control Date",
    notes: "Notes",
    status: "Status",
    draft: "Draft",
    completed: "Completed",
    required: "Required",
    placeholders: {
      departmentEmployee: "e.g. Damage Service - John Doe",
      reportNumber: "e.g. 12TRE-0001",
      productName: "e.g. Tramex MRH III",
      productNumber: "Probe number if applicable",
      approvedMargin: "e.g. ±2%",
      measuredResult: "e.g. 1.3",
      initials: "e.g. JD",
      notes: "Brief notes, special observations or comments...",
      select: "Select"
    }
  },
  equipment: {
    title: "Controlled Equipment",
    number: "No.",
    productName: "Product Name",
    productNumber: "Product Number",
    approvedMargin: "Approved Margin",
    measuredResult: "Measured Value",
    assessment: "Assessment",
    initials: "Initials",
    addEquipment: "Add Equipment",
    removeEquipment: "Remove Equipment"
  },
  assessment: {
    ok: "OK",
    notOk: "Not OK"
  },
  actions: {
    save: "Save",
    saveDraft: "Save as Draft",
    generatePdf: "Generate PDF",
    download: "Download",
    viewManuals: "View Manuals",
    cancel: "Cancel",
    complete: "Save and Complete",
    generating: "Generating..."
  },
  messages: {
    saveSuccess: "Report saved successfully",
    saveError: "Error saving report",
    pdfGenerating: "Generating PDF...",
    pdfGenerated: "PDF ready for download",
    pdfComingSoon: "PDF functionality coming soon",
    pdfError: "Could not generate PDF",
    error: "Error"
  },
  reportsSection: {
    title: "Calibration Reports",
    description: "Overview of all created calibration reports"
  },
  formSection: {
    description: "Fill out the calibration report for moisture equipment"
  },
  manualsSection: {
    title: "Calibration Manuals for All Equipment",
    description: "Manuals for calibrating all equipment",
    cardDescription: "Complete manual for moisture measurement equipment calibration",
    introText: "This manual contains detailed instructions for calibrating the following equipment:",
    equipment: {
      gann: "Gann Uni 1",
      lufftXA: "Lufft XA1000",
      lufftXP: "Lufft XP200",
      tramex: "Tramex MRH III",
      more: "And much more..."
    },
    openManuals: "Open Calibration Manuals",
    importantNotes: "Important Notes",
    warningTitle: "⚠️ Calibration should only be performed by trained personnel",
    warningText: "Ensure proper measuring equipment and references are available",
    tipsTitle: "💡 Calibration Tips", 
    tips: {
      tip1: "Hold the sensor as far back as possible",
      tip2: "Avoid hand interference with measurement results",
      tip3: "Verify measurements are within manufacturer tolerances",
      tip4: "Document all observations in the notes field"
    }
  },
  reportsList: {
    noReports: "No reports yet",
    noReportsDescription: "Create your first calibration report by clicking the 'New Report' button.",
    reportNumber: "Report #",
    controlDate: "Control date:",
    notesLabel: "Notes:",
    createdLabel: "Created:",
    downloadPdf: "PDF"
  }
};

export default calibration;