import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function safeFileName(baseName) {
  const suffix = new Date().toISOString().slice(0, 10);
  return `${baseName}-${suffix}`;
}

export function exportRowsToXlsx({ baseName, sheetName, rows }) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows || []);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${safeFileName(baseName)}.xlsx`);
}

export function exportRowsToPdf({ baseName, title, head, body }) {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  pdf.setFontSize(16);
  pdf.text(title, 40, 40);

  autoTable(pdf, {
    startY: 60,
    head,
    body,
    styles: {
      fontSize: 9,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [36, 27, 47],
    },
    alternateRowStyles: {
      fillColor: [248, 244, 238],
    },
    margin: {
      left: 32,
      right: 32,
    },
  });

  pdf.save(`${safeFileName(baseName)}.pdf`);
}
