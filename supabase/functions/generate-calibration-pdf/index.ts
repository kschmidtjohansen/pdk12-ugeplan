import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@^1.17.1/dist/pdf-lib.esm.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { reportId } = await req.json()
    
    if (!reportId) {
      throw new Error('Report ID is required')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch report data
    const { data: report, error: reportError } = await supabase
      .from('calibration_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError) throw reportError

    // Fetch equipment entries
    const { data: equipment, error: equipmentError } = await supabase
      .from('calibration_equipment_entries')
      .select('*')
      .eq('report_id', reportId)
      .order('equipment_number')

    if (equipmentError) throw equipmentError

    // Generate PDF document
    const pdfBytes = await generatePdfBytes(report, equipment || [])
    
    // Convert to base64 using TextEncoder and btoa for proper encoding
    const uint8Array = new Uint8Array(pdfBytes)
    const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('')
    const pdfBase64 = btoa(binaryString)
    
    return new Response(
      JSON.stringify({ 
        pdfBase64,
        filename: `Kalibreringsrapport_${report.report_number}_${report.control_date}.pdf`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generatePdfBytes(report: any, equipment: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size in points
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  let currentY = height - 50

  // Header
  page.drawText('POLYGON', {
    x: width / 2 - 40,
    y: currentY,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  currentY -= 30

  page.drawText('Kalibreringsrapport – Fugtudstyr', {
    x: width / 2 - 100,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  currentY -= 50

  // Report fields
  const fields = [
    { label: 'Afdeling og medarbejdernavn:', value: report.department_and_employee },
    { label: 'Rapport nr.:', value: report.report_number },
    { label: 'Dato for kontrol:', value: new Date(report.control_date).toLocaleDateString('da-DK') }
  ]

  fields.forEach(field => {
    page.drawText(field.label, {
      x: 50,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    page.drawText(field.value || '', {
      x: 250,
      y: currentY,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    })
    currentY -= 20
  })

  currentY -= 20

  // Table header
  page.drawText('Kontrollerede enheder', {
    x: 50,
    y: currentY,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  currentY -= 30

  // Table headers
  const headers = ['Nr.', 'Produktnavn', 'Produktnr.', 'Margin', 'Resultat', 'Vurdering', 'Init.']
  const columnWidths = [40, 100, 80, 70, 70, 80, 50]
  let startX = 50

  headers.forEach((header, index) => {
    page.drawRectangle({
      x: startX,
      y: currentY - 15,
      width: columnWidths[index],
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    })
    page.drawText(header, {
      x: startX + 5,
      y: currentY - 10,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    })
    startX += columnWidths[index]
  })
  currentY -= 20

  // Table rows
  for (let i = 0; i < 10; i++) {
    const entry = equipment.find(e => e.equipment_number === i + 1)
    const rowData = [
      (i + 1).toString(),
      entry?.product_name || '',
      entry?.product_number || '',
      entry?.approved_margin || '',
      entry?.measured_result || '',
      entry?.assessment || '',
      entry?.initials || ''
    ]

    startX = 50
    rowData.forEach((data, index) => {
      page.drawRectangle({
        x: startX,
        y: currentY - 15,
        width: columnWidths[index],
        height: 20,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      })
      page.drawText(data, {
        x: startX + 5,
        y: currentY - 10,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      })
      startX += columnWidths[index]
    })
    currentY -= 20
  }

  // Notes section
  currentY -= 20
  page.drawText('Bemærkninger:', {
    x: 50,
    y: currentY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  currentY -= 20

  page.drawRectangle({
    x: 50,
    y: currentY - 60,
    width: width - 100,
    height: 60,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  })

  if (report.notes) {
    page.drawText(report.notes, {
      x: 55,
      y: currentY - 15,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: width - 110,
    })
  }

  return await pdfDoc.save()
}