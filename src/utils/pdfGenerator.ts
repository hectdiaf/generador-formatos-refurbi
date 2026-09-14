// ============================================================
// Generador de PDF - Formato Refurbi (Diseño Mejorado)
// Media Carta Horizontal (5.5 x 8.5 pulgadas)
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';

// Dimensiones Media Carta Horizontal en mm
const PAGE_WIDTH = 215.9;
const PAGE_HEIGHT = 139.7;

// Paleta de colores Refurbi
const COLORS = {
  brand: [2, 48, 71] as const,        // #023047 - Color oficial Refurbi
  brandLight: [3, 78, 113] as const,  // #034E71
  brandSoft: [232, 243, 248] as const, // Fondo suave
  blue: [37, 99, 235] as const,       // Azul vibrante
  blueBg: [239, 246, 255] as const,   // Azul fondo
  green: [16, 150, 120] as const,     // Verde
  greenBg: [230, 248, 240] as const,  // Verde fondo
  purple: [108, 72, 196] as const,    // Púrpura
  purpleBg: [243, 238, 255] as const, // Púrpura fondo
  orange: [234, 112, 34] as const,    // Naranja
  orangeBg: [255, 244, 232] as const, // Naranja fondo
  navy: [15, 23, 42] as const,
  slate: [51, 65, 85] as const,
  slateLight: [100, 116, 139] as const,
  gray: [148, 163, 184] as const,
  grayLight: [241, 245, 249] as const,
  white: [255, 255, 255] as const,
  border: [226, 232, 240] as const,
};

function formatCurrency(value: string | number): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper para setGState sin errores de TypeScript
function setOpacity(pdf: jsPDF, opacity: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pdf as any;
  if (p.GState) {
    p.setGState(new p.GState({ opacity }));
  }
}

// Dibujar gradiente vertical
function drawGradientRect(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  colorTop: readonly number[], colorBottom: readonly number[],
  steps: number = 10
) {
  const stepHeight = h / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(colorTop[0] + (colorBottom[0] - colorTop[0]) * ratio);
    const g = Math.round(colorTop[1] + (colorBottom[1] - colorTop[1]) * ratio);
    const b = Math.round(colorTop[2] + (colorBottom[2] - colorTop[2]) * ratio);
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y + i * stepHeight, w, stepHeight + 0.1, 'F');
  }
}

// Dibujar el logo de Refurbi (3 círculos superpuestos)
function drawRefurbiLogo(pdf: jsPDF, x: number, y: number, size: number) {
  const circleSize = size * 0.45;
  const offset = size * 0.25;
  
  pdf.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  setOpacity(pdf, 0.85);
  
  // Círculo izquierdo
  pdf.circle(x + circleSize, y + size / 2, circleSize, 'F');
  // Círculo central
  pdf.circle(x + circleSize + offset, y + size / 2, circleSize, 'F');
  // Círculo derecho
  pdf.circle(x + circleSize + offset * 2, y + size / 2, circleSize, 'F');
  
  setOpacity(pdf, 1);
}

// Dibujar título de sección con barra lateral de color
function drawSectionTitle(
  pdf: jsPDF,
  x: number, y: number,
  title: string,
  barColor: readonly number[],
  bgColor: readonly number[],
  width: number
) {
  // Fondo de la sección
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y, width, 7, 1.5, 1.5, 'F');
  
  // Barra lateral de color
  pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
  pdf.roundedRect(x, y, 3, 7, 1.5, 1.5, 'F');
  
  // Texto
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
  pdf.text(title, x + 5, y + 5);
}

/**
 * Dibuja una página de pedido en el PDF
 */
async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 6;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // ============ FONDO ============
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // ============ ENCABEZADO COMPACTO CON GRADIENTE ============
  const headerHeight = 22;
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, headerHeight, COLORS.brand, COLORS.brandLight, 10);
  
  // Elementos decorativos
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.06);
  pdf.circle(PAGE_WIDTH - 10, 11, 20, 'F');
  pdf.circle(PAGE_WIDTH - 30, 4, 12, 'F');
  setOpacity(pdf, 1);

  // Logo de Refurbi (3 círculos)
  drawRefurbiLogo(pdf, margin + 2, 3, 9);
  
  // Texto REFURBI al lado del logo
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('REFURBI', margin + 16, 9);

  // Propósito (compacto)
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5.5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 16, 13.5);

  // Título y subtítulo
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('Formato de remisión de pedidos', margin + 16, 18);

  // Badge Ecommerce
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin + 75, 14.5, 38, 5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('Ecommerce / Marketplace', margin + 77, 18);

  // Número de pedido (lado derecho) - DESTACADO
  const pedidoBoxX = PAGE_WIDTH - margin - 48;
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 2, 50, 18, 2.5, 2.5, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('PEDIDO', pedidoBoxX, 6.5);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 14.5);

  // Canal y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(180, 210, 225);
  pdf.text(`${pedido.mkp}  |  ${pedido.fecha}`, pedidoBoxX, 19);

  currentY = headerHeight + 3;

  // ============ DATOS DEL CLIENTE ============
  const clientWidth = contentWidth;
  drawSectionTitle(pdf, margin, currentY, 'DATOS DEL CLIENTE', COLORS.blue, COLORS.blueBg, clientWidth);
  currentY += 9;

  // Datos en 3 columnas con fondos diferenciados
  const colWidth = (clientWidth - 4) / 3;
  const dataY = currentY;
  const dataH = 10;

  // Nombre
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('NOMBRE', margin + 3, dataY + 3.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 28), margin + 3, dataY + 7.5);

  // Cédula
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + colWidth, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(margin + colWidth, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('C.C.', margin + colWidth + 3, dataY + 3.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), margin + colWidth + 3, dataY + 7.5);

  // Celular
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + colWidth * 2, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(margin + colWidth * 2, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('CELULAR', margin + colWidth * 2 + 3, dataY + 3.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), margin + colWidth * 2 + 3, dataY + 7.5);

  currentY += dataH + 4;

  // ============ DETALLE DEL PRODUCTO ============
  const tableAreaWidth = contentWidth - 32; // Dejar espacio para QR
  
  drawSectionTitle(pdf, margin, currentY, 'DETALLE DEL PRODUCTO', COLORS.orange, COLORS.orangeBg, tableAreaWidth);
  currentY += 9;

  // Tabla
  const cols = [
    { label: 'SKU', width: tableAreaWidth * 0.30, align: 'left' as const },
    { label: 'PRECIO BASE', width: tableAreaWidth * 0.14, align: 'right' as const },
    { label: 'PANEL', width: tableAreaWidth * 0.12, align: 'right' as const },
    { label: 'GAR. A.I', width: tableAreaWidth * 0.12, align: 'right' as const },
    { label: 'GAR. TOTAL', width: tableAreaWidth * 0.14, align: 'right' as const },
    { label: 'TOTAL', width: tableAreaWidth * 0.18, align: 'right' as const }
  ];

  const rowHeight = 6.5;
  const tableX = margin;

  // Encabezados
  drawGradientRect(pdf, tableX, currentY, tableAreaWidth, rowHeight, COLORS.brand, COLORS.brandLight, 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = tableX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * 5.5 / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 2 : colX + 2;
    pdf.text(col.label, textX, currentY + 4.5);
    colX += col.width;
  });
  
  currentY += rowHeight;

  // Filas
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.grayLight;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(tableX, currentY, tableAreaWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
    
    colX = tableX;
    const values = [
      producto.sku,
      formatCurrency(producto.base),
      formatCurrency(producto.panel),
      formatCurrency(producto.garantiaAI),
      formatCurrency(producto.garantiaTotal),
      formatCurrency(producto.totalVenta)
    ];
    
    cols.forEach((col, i) => {
      if (i === 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
      }
      
      if (col.align === 'right') {
        const textW = pdf.getStringUnitWidth(values[i]) * 5.5 / pdf.internal.scaleFactor;
        pdf.text(values[i], colX + col.width - textW - 2, currentY + 4.5);
      } else {
        pdf.text(values[i], colX + 2, currentY + 4.5);
      }
      colX += col.width;
    });
    
    currentY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.5);
  const tableStartY = currentY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.roundedRect(tableX, tableStartY, tableAreaWidth, currentY - tableStartY, 1.5, 1.5, 'S');

  // Total destacado
  currentY += 2;
  const totalBoxW = 65;
  const totalBoxX = tableX + tableAreaWidth - totalBoxW;
  
  drawGradientRect(pdf, totalBoxX, currentY, totalBoxW, 9, COLORS.green, [10, 120, 95], 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 3, currentY + 4);
  
  pdf.setFontSize(9);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 3, currentY + 8);

  // ============ QR CODE (lado derecho) ============
  const qrSize = 26;
  const qrX = margin + contentWidth - qrSize - 1;
  const qrY = tableStartY - 1;
  
  // Fondo del QR con borde
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 12, 2, 2, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 12, 2, 2, 'S');
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'S');
  }
  
  // Etiqueta del QR
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  const qrLabel = `Pedido #${pedido.pedido}`;
  const qrLabelW = pdf.getStringUnitWidth(qrLabel) * 4.5 / pdf.internal.scaleFactor;
  pdf.text(qrLabel, qrX + (qrSize - qrLabelW) / 2, qrY + qrSize + 6);

  currentY += 12;

  // ============ DETALLES DEL PEDIDO ============
  drawSectionTitle(pdf, margin, currentY, 'DETALLES DEL PEDIDO', COLORS.purple, COLORS.purpleBg, contentWidth);
  currentY += 9;

  const detailWidth = (contentWidth) / 2;

  // Pasarela - Card con borde púrpura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 3, 13, 2, 2, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, currentY, detailWidth - 3, 13, 2, 2, 'S');
  
  // Barra superior púrpura
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 3, 2.5, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('PASARELA', margin + 3, currentY + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', margin + 3, currentY + 10.5);

  // Outlet / Combo
  const checkboxX = margin + detailWidth;
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 3, 13, 2, 2, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 3, 13, 2, 2, 'S');
  
  // Barra superior
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 3, 2.5, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('OUTLET', checkboxX + 3, currentY + 6);
  pdf.text('COMBO', checkboxX + detailWidth / 2, currentY + 6);
  
  // Checkboxes
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(checkboxX + 3, currentY + 8, 4, 4, 0.5, 0.5, 'S');
  pdf.roundedRect(checkboxX + detailWidth / 2, currentY + 8, 4, 4, 0.5, 0.5, 'S');

  currentY += 16;

  // ============ DILIGENCIAMIENTO OPERATIVO ============
  drawSectionTitle(pdf, margin, currentY, 'DILIGENCIAMIENTO OPERATIVO', COLORS.green, COLORS.greenBg, contentWidth);
  currentY += 9;

  const opWidth = contentWidth / 3;
  const remainingHeight = PAGE_HEIGHT - currentY - margin - 3;
  const boxHeight = Math.min(remainingHeight, 28);

  // Factura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  // Barra superior verde
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin, currentY, opWidth - 2, 2.5, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('FACTURA', margin + 3, currentY + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('N.________________________', margin + 3, currentY + 10);

  // Líneas para escribir
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < 3; i++) {
    pdf.line(margin + 3, currentY + 14 + i * 4.5, margin + opWidth - 5, currentY + 14 + i * 4.5);
  }

  // Observaciones
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, 2.5, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('OBSERVACIONES', margin + opWidth + 3, currentY + 6);

  for (let i = 0; i < 4; i++) {
    pdf.line(margin + opWidth + 3, currentY + 10 + i * 4.5, margin + opWidth * 2 - 5, currentY + 10 + i * 4.5);
  }

  // Proceso
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, 2.5, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('PROCESO', margin + opWidth * 2 + 3, currentY + 6);

  for (let i = 0; i < 4; i++) {
    pdf.line(margin + opWidth * 2 + 3, currentY + 10 + i * 4.5, margin + opWidth * 3 - 5, currentY + 10 + i * 4.5);
  }

  // ============ FOOTER ============
  drawGradientRect(pdf, margin, PAGE_HEIGHT - 4, contentWidth, 1.5, COLORS.brand, COLORS.green, 4);
  
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(4);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Refurbi - Dando segundas oportunidades', margin + 2, PAGE_HEIGHT - 1.5);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, PAGE_WIDTH - margin - 28, PAGE_HEIGHT - 1.5);
}

/**
 * Genera un PDF para un pedido individual
 */
export async function generarPDFPedido(pedido: Pedido): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT]
  });

  await dibujarPaginaPedido(pdf, pedido);
  return pdf;
}

/**
 * Genera un PDF consolidado con todos los pedidos (uno por página)
 */
export async function generarPDFConsolidado(pedidos: Pedido[]): Promise<jsPDF> {
  if (pedidos.length === 0) throw new Error('No hay pedidos para generar');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT]
  });

  for (let i = 0; i < pedidos.length; i++) {
    if (i > 0) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'landscape');
    }
    await dibujarPaginaPedido(pdf, pedidos[i]);
  }

  return pdf;
}
