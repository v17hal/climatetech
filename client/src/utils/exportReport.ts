import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ReportRow {
  [key: string]: string | number
}

const BRAND = {
  darkBlue: [6, 25, 44] as [number, number, number],
  cyan: [64, 187, 185] as [number, number, number],
  green: [152, 207, 89] as [number, number, number],
  lightGray: [244, 248, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export function exportPDF(title: string, subtitle: string, columns: string[], rows: ReportRow[], filename: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  /* Header bar */
  doc.setFillColor(...BRAND.darkBlue)
  doc.rect(0, 0, 297, 28, 'F')

  /* Accent stripe */
  doc.setFillColor(...BRAND.cyan)
  doc.rect(0, 28, 297, 2, 'F')

  /* Logo placeholder text */
  doc.setTextColor(...BRAND.cyan)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CarbonSmart Solutions Africa', 10, 12)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.green)
  doc.text('Climate Solutions Rooted in African Soil', 10, 18)

  /* Title */
  doc.setTextColor(...BRAND.white)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 10, 25)

  /* Subtitle & date */
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`${subtitle}   |   Generated: ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`, 10, 32)

  /* Table */
  const tableRows = rows.map((row) => columns.map((col) => String(row[col] ?? '')))

  autoTable(doc, {
    head: [columns],
    body: tableRows,
    startY: 38,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: BRAND.darkBlue,
    },
    headStyles: {
      fillColor: BRAND.darkBlue,
      textColor: BRAND.white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: BRAND.lightGray },
    bodyStyles: { fillColor: BRAND.white },
    columnStyles: {},
    margin: { left: 10, right: 10 },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1,
  })

  /* Footer */
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...BRAND.darkBlue)
    doc.rect(0, 198, 297, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('CarbonSmart Solutions Africa · info@carbonsmartsolutionsafrica.co.za · www.carbonsmartsolutionsafrica.co.za', 10, 206)
    doc.text(`Page ${i} of ${pageCount}`, 280, 206, { align: 'right' })
  }

  doc.save(`${filename}.pdf`)
}

export function exportCSV(columns: string[], rows: ReportRow[], filename: string) {
  const header = columns.join(',')
  const body = rows.map((row) => columns.map((col) => {
    const val = String(row[col] ?? '')
    return val.includes(',') ? `"${val}"` : val
  }).join(',')).join('\n')

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportXLS(sheetName: string, columns: string[], rows: ReportRow[], filename: string) {
  const wsData = [columns, ...rows.map((row) => columns.map((col) => row[col] ?? ''))]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  /* Column widths */
  ws['!cols'] = columns.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
