import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Generate HTML content for PDF
    const htmlContent = generatePdfHtml(report, equipment || [])

    // For now, return the HTML content
    // In a production environment, you would use a library like Puppeteer to convert to PDF
    const pdfBase64 = btoa(htmlContent) // Temporary solution
    
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

function generatePdfHtml(report: any, equipment: any[]) {
  const equipmentRows = Array.from({ length: 10 }, (_, i) => {
    const entry = equipment.find(e => e.equipment_number === i + 1)
    return `
      <tr>
        <td style="border: 1px solid #333; padding: 8px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.product_name || ''}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.product_number || ''}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.approved_margin || ''}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.measured_result || ''}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.assessment || ''}</td>
        <td style="border: 1px solid #333; padding: 8px;">${entry?.initials || ''}</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Kalibreringsrapport</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          font-size: 24px; 
          margin: 0 0 10px 0; 
        }
        .header h2 { 
          font-size: 18px; 
          margin: 0; 
        }
        .form-fields { 
          margin-bottom: 30px; 
        }
        .form-field { 
          margin-bottom: 15px; 
        }
        .form-field label { 
          font-weight: bold; 
          display: inline-block; 
          width: 200px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        th { 
          background-color: #f0f0f0; 
          border: 1px solid #333; 
          padding: 8px; 
          font-weight: bold; 
          text-align: center; 
          font-size: 10px;
        }
        td { 
          border: 1px solid #333; 
          padding: 8px; 
          text-align: center; 
        }
        .notes { 
          margin-top: 20px; 
        }
        .notes h3 { 
          margin-bottom: 10px; 
        }
        .notes-content { 
          border: 1px solid #333; 
          min-height: 60px; 
          padding: 10px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>POLYGON</h1>
        <h2>Kalibreringsrapport – Fugtudstyr</h2>
      </div>

      <div class="form-fields">
        <div class="form-field">
          <label>Afdeling og medarbejdernavn:</label> ${report.department_and_employee}
        </div>
        <div class="form-field">
          <label>Rapport nr.:</label> ${report.report_number}
        </div>
        <div class="form-field">
          <label>Dato for kontrol:</label> ${new Date(report.control_date).toLocaleDateString('da-DK')}
        </div>
      </div>

      <h3>Kontrollerede enheder</h3>
      <table>
        <thead>
          <tr>
            <th>Enhed nr.</th>
            <th>Produktnavn</th>
            <th>Produktnummer</th>
            <th>Godkendt margen<br>(jf. producent)</th>
            <th>Resultat<br>(målt værdi)</th>
            <th>Vurdering<br>(OK/Ikke OK)</th>
            <th>Initialer</th>
          </tr>
        </thead>
        <tbody>
          ${equipmentRows}
        </tbody>
      </table>

      <div class="notes">
        <h3>Bemærkninger:</h3>
        <div class="notes-content">
          ${report.notes || ''}
        </div>
      </div>
    </body>
    </html>
  `
}