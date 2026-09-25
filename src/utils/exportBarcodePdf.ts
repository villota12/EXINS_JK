import jsPDF from 'jspdf';
import { generateBars } from './barcode';

export interface BarcodePdfItem {
  id: string;
  name: string;
  barcode: string;
  sellingPrice: number;
  size?: string;
}

/**
 * Draw a single EXINS standard barcode label onto a jsPDF document context
 */
function drawBarcodeLabel(
  doc: jsPDF,
  item: BarcodePdfItem,
  x: number,
  y: number,
  width: number,
  height: number
) {
  // Label border (cut line / sticker outline)
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');

  const centerX = x + width / 2;
  let currentY = y + 4;

  // 1. Header: EXINS Jksur+
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('EXINS Jksur+', centerX, currentY, { align: 'center' });

  // Thin separator line
  currentY += 1.8;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(x + 3, currentY, x + width - 3, currentY);

  // 2. Product Name & Size
  currentY += 3.4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 15, 15);

  // Truncate name if it exceeds label width (width - 6mm padding)
  const maxTextWidth = width - 6;
  let displayName = item.name || 'EXINS Apparel Item';
  if (doc.getTextWidth(displayName) > maxTextWidth) {
    while (displayName.length > 3 && doc.getTextWidth(displayName + '...') > maxTextWidth) {
      displayName = displayName.slice(0, -1);
    }
    displayName += '...';
  }
  doc.text(displayName, centerX, currentY, { align: 'center' });

  if (item.size) {
    currentY += 2.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`Size: ${item.size}`, centerX, currentY, { align: 'center' });
  } else {
    currentY += 1.5;
  }

  // 3. Barcode Vector Lines
  currentY += 1.2;
  const barcodeValue = item.barcode || 'EXINS-0000';
  const { bars, totalWidth } = generateBars(barcodeValue);

  const barcodeAreaWidth = width - 14; // e.g. 46mm
  const barcodeHeight = 8.5; // mm
  const scale = barcodeAreaWidth / totalWidth;
  const barcodeStartX = centerX - barcodeAreaWidth / 2;

  doc.setFillColor(0, 0, 0);
  bars.forEach((bar) => {
    const barX = barcodeStartX + bar.x * scale;
    const barW = Math.max(0.25, bar.w * scale);
    doc.rect(barX, currentY, barW, barcodeHeight, 'F');
  });

  // 4. Barcode alphanumeric string (EXINS-XXXX)
  currentY += barcodeHeight + 2.8;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text(barcodeValue, centerX, currentY, { align: 'center' });

  // Thin separator line
  currentY += 1.4;
  doc.setDrawColor(210, 210, 210);
  doc.line(x + 3, currentY, x + width - 3, currentY);

  // 5. Retail Price (in PHP)
  currentY += 3.3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  const formattedPrice = `PHP ${Number(item.sellingPrice || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  doc.text(formattedPrice, centerX, currentY, { align: 'center' });
}

/**
 * Export selected barcodes as a multi-page A4 sticker sheet PDF
 * 3 columns × 7 rows = 21 standard labels per A4 sheet
 */
export async function exportBarcodesToPdf(
  items: BarcodePdfItem[],
  fileName = 'EXINS-Barcode-Labels.pdf'
): Promise<void> {
  if (!items || items.length === 0) {
    throw new Error('No barcodes selected for export');
  }

  // Create A4 document in mm (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Grid Layout
  const cols = 3;
  const rows = 7;
  const labelWidth = 58; // mm
  const labelHeight = 35; // mm
  const colGap = 5; // mm
  const rowGap = 3.5; // mm

  const totalGridWidth = cols * labelWidth + (cols - 1) * colGap; // 174 + 10 = 184mm
  const totalGridHeight = rows * labelHeight + (rows - 1) * rowGap; // 245 + 21 = 266mm

  const startX = (pageWidth - totalGridWidth) / 2; // ~13mm left margin
  const startY = 14; // mm top margin

  const itemsPerPage = cols * rows; // 21
  const totalPages = Math.ceil(items.length / itemsPerPage);

  items.forEach((item, index) => {
    const pageIndex = Math.floor(index / itemsPerPage);
    const indexOnPage = index % itemsPerPage;

    if (index > 0 && indexOnPage === 0) {
      doc.addPage();
    }

    // Optional header strip on top of each page
    if (indexOnPage === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `EXINS Jksur+ Barcode Sheet — Page ${pageIndex + 1} of ${totalPages} (${items.length} total labels)`,
        startX,
        startY - 5
      );
      doc.text(
        `Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        pageWidth - startX,
        startY - 5,
        { align: 'right' }
      );
    }

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const x = startX + col * (labelWidth + colGap);
    const y = startY + row * (labelHeight + rowGap);

    drawBarcodeLabel(doc, item, x, y, labelWidth, labelHeight);
  });

  // Save / trigger browser download
  try {
    doc.save(fileName);
  } catch (err) {
    console.warn('Standard doc.save failed, trying blob download fallback:', err);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

/**
 * Export a single barcode label PDF (Single Tag Sheet or Label Printer 60x36mm)
 */
export async function exportSingleBarcodeToPdf(
  item: BarcodePdfItem,
  fileName?: string
): Promise<void> {
  const safeName = (item.name || 'product')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 20);
  const outName = fileName || `EXINS-Barcode-${item.barcode || safeName}.pdf`;

  // Standard compact label format (60mm x 36mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [60, 36],
  });

  drawBarcodeLabel(doc, item, 1, 1, 58, 34);

  try {
    doc.save(outName);
  } catch (err) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
