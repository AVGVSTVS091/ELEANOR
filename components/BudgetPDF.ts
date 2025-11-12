import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Budget, Client } from '../types';
import { AppSettings } from '../hooks/useSettings';

// Extend jsPDF with the autoTable method and properties
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDFWithAutoTable;
  lastAutoTable: {
    finalY: number;
  };
};

export const generateBudgetPDF = (budget: Budget, client: Client, settings: AppSettings, action: 'preview' | 'share' | 'download' = 'preview') => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  // --- Header ---
  // Logo
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', margin, 10, 30, 30);
    } catch (e) {
        console.error("Error adding logo to PDF", e);
        doc.setFontSize(20).setFont(undefined, 'bold');
        doc.text(settings.companyName || "My Company", margin, 20);
    }
  } else {
    doc.setFontSize(20).setFont(undefined, 'bold');
    doc.text(settings.companyName || "My Company", margin, 20);
  }

  // Client and Date info
  doc.setFontSize(10).setFont(undefined, 'normal');
  doc.text(`Date: ${new Date(budget.date).toLocaleDateString()}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`Budget for: ${client.companyName}`, pageWidth - margin, 22, { align: 'right' });
  doc.text(`${client.countryCode} ${client.phoneNumber}`, pageWidth - margin, 29, { align: 'right' });

  // --- Title ---
  doc.setFontSize(16).setFont(undefined, 'bold');
  doc.text(`Budget #${budget.id.substring(7,13)}`, margin, 50);

  // --- Table ---
  const tableColumn = ["Code", "Product", "Unit Price", "Quantity", "Total"];
  const tableRows: any[][] = [];

  budget.items.forEach(item => {
    const itemData = [
      item.product.code,
      item.product.name,
      `$${item.product.price.toFixed(2)}`,
      item.quantity,
      `$${(item.product.price * item.quantity).toFixed(2)}`
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
    }
  });

  // --- Totals ---
  const finalY = doc.lastAutoTable.finalY;
  const totalsX = pageWidth - margin;
  doc.setFontSize(11);
  doc.text(`Subtotal:`, totalsX - 35, finalY + 10, { align: 'left' });
  doc.text(`$${budget.subtotal.toFixed(2)}`, totalsX, finalY + 10, { align: 'right' });

  if (budget.discount > 0) {
    doc.text(`Discount (${budget.discount}%):`, totalsX - 35, finalY + 17, { align: 'left' });
    doc.text(`-$${(budget.subtotal * budget.discount / 100).toFixed(2)}`, totalsX, finalY + 17, { align: 'right' });
  }

  doc.setFontSize(12).setFont(undefined, 'bold');
  doc.text(`Total:`, totalsX - 35, finalY + 24, { align: 'left' });
  doc.text(`$${budget.total.toFixed(2)}`, totalsX, finalY + 24, { align: 'right' });

  // --- Footer ---
  // You can add a footer here if needed
  
  // --- Action ---
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const fileName = `Budget-${client.companyName.replace(/\s/g, '_')}.pdf`;

  if (action === 'preview') {
    window.open(pdfUrl, '_blank');
  } else if (action === 'download') {
    doc.save(fileName);
  } else if (action === 'share' && navigator.share) {
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    navigator.share({
        title: `Budget for ${client.companyName}`,
        text: `Here is the budget you requested.`,
        files: [pdfFile]
    }).catch(e => console.error("Share failed", e));
  } else {
    // Fallback for browsers that don't support share API
    window.open(pdfUrl, '_blank');
  }
};