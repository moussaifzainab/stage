import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Incidents');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(file, 'incidents.xlsx');
};

export const exportToPDF = (data) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text('Liste des Incidents', 14, 15);
  autoTable(doc, {
    startY: 20,
    head: [['ID', 'Titre', 'Statut', 'Priorité', 'Technicien', 'Date']],
    body: data.map((i) => [
      i.id,
      i.titre,
      i.statut,
      i.priorite,
      i.technicien?.nom || 'Non assigné',
      i.dateCreation?.split('T')[0] || '',
    ]),
  });
  doc.save('incidents.pdf');
};
