// ============================================================
// Generador de PDF - Formato Refurbi
// Media Carta VERTICAL (5.5 x 8.5 pulgadas)
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';

// Dimensiones Media Carta VERTICAL en mm
const PAGE_WIDTH = 139.7;  // 5.5 inches
const PAGE_HEIGHT = 215.9; // 8.5 inches

// Paleta de colores Refurbi
const COLORS = {
  brand: [2, 48, 71] as const,
  brandLight: [3, 78, 113] as const,
  blue: [37, 99, 235] as const,
  blueBg: [239, 246, 255] as const,
  green: [16, 150, 120] as const,
  greenBg: [230, 248, 240] as const,
  purple: [108, 72, 196] as const,
  purpleBg: [243, 238, 255] as const,
  orange: [234, 112, 34] as const,
  orangeBg: [255, 244, 232] as const,
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

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

// Helper para setGState
function setOpacity(pdf: jsPDF, opacity: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pdf as any;
  if (p.GState) {
    try {
      p.setGState(new p.GState({ opacity }));
    } catch (e) {
      // Ignorar errores de opacidad
    }
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
  const circleSize = size * 0.4;
  const offset = size * 0.22;
  
  pdf.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  setOpacity(pdf, 0.9);
  
  pdf.circle(x + circleSize, y + size / 2, circleSize, 'F');
  pdf.circle(x + circleSize + offset, y + size / 2, circleSize, 'F');
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
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y, width, 8, 1.5, 1.5, 'F');
  
  pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
  pdf.roundedRect(x, y, 3, 8, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
  pdf.text(title, x + 6, y + 5.5);
}

/**
 * Dibuja una página de pedido en el PDF
 */
async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 8;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // Fondo blanco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // ============ ENCABEZADO ============
  const headerHeight = 28;
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, headerHeight, COLORS.brand, COLORS.brandLight, 12);
  
  // Elementos decorativos
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.08);
  pdf.circle(PAGE_WIDTH - 15, 14, 25, 'F');
  setOpacity(pdf, 1);

  // Logo de Refurbi
  drawRefurbiLogo(pdf, margin + 2, 4, 12);
  
  // Texto REFURBI
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('REFURBI', margin + 20, 10);

  // Propósito
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 210, 225);
  pdf.text('Estamos convencidos que las segundas oportunidades', margin + 20, 15);
  pdf.text('no son solo para las personas.', margin + 20, 18);

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('Formato de remisión de pedidos', margin + 2, 24);

  // Badge Ecommerce
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin + 55, 21, 42, 5, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('Ecommerce / Marketplace', margin + 57, 24.5);

  // Número de pedido destacado
  const pedidoBoxX = PAGE_WIDTH - margin - 45;
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 3, 47, 22, 2.5, 2.5, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 210, 225);
  pdf.text('PEDIDO', pedidoBoxX, 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 17);

  // Canal y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 210, 225);
  pdf.text(`Canal: ${pedido.mkp}`, pedidoBoxX, 22);
  pdf.text(`Fecha: ${pedido.fecha}`, pedidoBoxX + 22, 22);

  currentY = headerHeight + 5;

  // ============ DATOS DEL CLIENTE ============
  drawSectionTitle(pdf, margin, currentY, 'DATOS DEL CLIENTE', COLORS.blue, COLORS.blueBg, contentWidth);
  currentY += 10;

  // Datos en 3 columnas
  const colWidth = (contentWidth - 4) / 3;
  const dataY = currentY;
  const dataH = 14;

  // Nombre
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('NOMBRE', margin + 3, dataY + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 20), margin + 3, dataY + 9);

  // Cédula
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + colWidth, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(margin + colWidth, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('C.C.', margin + colWidth + 3, dataY + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), margin + colWidth + 3, dataY + 9);

  // Celular
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + colWidth * 2, dataY, colWidth - 1, dataH, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(margin + colWidth * 2, dataY, colWidth - 1, dataH, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('CELULAR', margin + colWidth * 2 + 3, dataY + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), margin + colWidth * 2 + 3, dataY + 9);

  currentY += dataH + 6;

  // ============ DETALLE DEL PRODUCTO ============
  drawSectionTitle(pdf, margin, currentY, 'DETALLE DEL PRODUCTO', COLORS.orange, COLORS.orangeBg, contentWidth);
  currentY += 10;

  // Tabla
  const cols = [
    { label: 'SKU', width: contentWidth * 0.35, align: 'left' as const },
    { label: 'PRECIO BASE', width: contentWidth * 0.16, align: 'right' as const },
    { label: 'PANEL', width: contentWidth * 0.13, align: 'right' as const },
    { label: 'GAR. A.I', width: contentWidth * 0.13, align: 'right' as const },
    { label: 'GAR. TOTAL', width: contentWidth * 0.13, align: 'right' as const },
    { label: 'TOTAL', width: contentWidth * 0.10, align: 'right' as const }
  ];

  const rowHeight = 7;
  const tableX = margin;

  // Encabezados
  drawGradientRect(pdf, tableX, currentY, contentWidth, rowHeight, COLORS.brand, COLORS.brandLight, 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = tableX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * 6 / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 2 : colX + 2;
    pdf.text(col.label, textX, currentY + 5);
    colX += col.width;
  });
  
  currentY += rowHeight;

  // Filas
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.grayLight;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(tableX, currentY, contentWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
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
        const textW = pdf.getStringUnitWidth(values[i]) * 6 / pdf.internal.scaleFactor;
        pdf.text(values[i], colX + col.width - textW - 2, currentY + 5);
      } else {
        pdf.text(values[i], colX + 2, currentY + 5);
      }
      colX += col.width;
    });
    
    currentY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.5);
  const tableStartY = currentY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.roundedRect(tableX, tableStartY, contentWidth, currentY - tableStartY, 1.5, 1.5, 'S');

  // Total destacado
  currentY += 3;
  const totalBoxW = 70;
  const totalBoxX = margin + contentWidth - totalBoxW;
  
  drawGradientRect(pdf, totalBoxX, currentY, totalBoxW, 10, COLORS.green, [10, 120, 95], 8);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 3, currentY + 4.5);
  
  pdf.setFontSize(10);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 3, currentY + 9);

  currentY += 13;

  // ============ QR CODE ============
  const qrSize = 30;
  const qrX = margin + contentWidth - qrSize;
  const qrY = currentY;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 12, 2, 2, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 12, 2, 2, 'S');
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    // Si falla el QR, dibujar placeholder
    pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'S');
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  const qrLabel = `Pedido #${pedido.pedido}`;
  const qrLabelW = pdf.getStringUnitWidth(qrLabel) * 5 / pdf.internal.scaleFactor;
  pdf.text(qrLabel, qrX + (qrSize - qrLabelW) / 2, qrY + qrSize + 6);

  currentY += qrSize + 15;

  // ============ DETALLES DEL PEDIDO ============
  drawSectionTitle(pdf, margin, currentY, 'DETALLES DEL PEDIDO', COLORS.purple, COLORS.purpleBg, contentWidth);
  currentY += 10;

  const detailWidth = contentWidth / 2;

  // Pasarela
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 2, 15, 2, 2, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, currentY, detailWidth - 2, 15, 2, 2, 'S');
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 2, 3, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('PASARELA', margin + 3, currentY + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', margin + 3, currentY + 12);

  // Outlet / Combo
  const checkboxX = margin + detailWidth;
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 2, 15, 2, 2, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 2, 15, 2, 2, 'S');
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 2, 3, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('OUTLET', checkboxX + 3, currentY + 7);
  pdf.text('COMBO', checkboxX + detailWidth / 2, currentY + 7);
  
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(checkboxX + 3, currentY + 9, 4, 4, 0.5, 0.5, 'S');
  pdf.roundedRect(checkboxX + detailWidth / 2, currentY + 9, 4, 4, 0.5, 0.5, 'S');

  currentY += 20;

  // ============ DILIGENCIAMIENTO OPERATIVO ============
  drawSectionTitle(pdf, margin, currentY, 'DILIGENCIAMIENTO OPERATIVO', COLORS.green, COLORS.greenBg, contentWidth);
  currentY += 10;

  const opWidth = contentWidth / 3;
  const remainingHeight = PAGE_HEIGHT - currentY - margin - 5;
  const boxHeight = Math.min(remainingHeight, 35);

  // Factura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin, currentY, opWidth - 2, 3, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('FACTURA', margin + 3, currentY + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('N.________________________', margin + 3, currentY + 12);

  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < 4; i++) {
    pdf.line(margin + 3, currentY + 16 + i * 5, margin + opWidth - 5, currentY + 16 + i * 5);
  }

  // Observaciones
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin + opWidth, currentY, opWidth - 2, 3, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('OBSERVACIONES', margin + opWidth + 3, currentY + 7);

  for (let i = 0; i < 5; i++) {
    pdf.line(margin + opWidth + 3, currentY + 12 + i * 5, margin + opWidth * 2 - 5, currentY + 12 + i * 5);
  }

  // Proceso
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight, 2, 2, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight, 2, 2, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(margin + opWidth * 2, currentY, opWidth - 2, 3, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('PROCESO', margin + opWidth * 2 + 3, currentY + 7);

  for (let i = 0; i < 5; i++) {
    pdf.line(margin + opWidth * 2 + 3, currentY + 12 + i * 5, margin + opWidth * 3 - 5, currentY + 12 + i * 5);
  }

  // ============ FOOTER ============
  drawGradientRect(pdf, margin, PAGE_HEIGHT - 5, contentWidth, 2, COLORS.brand, COLORS.green, 4);
  
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Refurbi - Dando segundas oportunidades', margin + 2, PAGE_HEIGHT - 2);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, PAGE_WIDTH - margin - 32, PAGE_HEIGHT - 2);
}

/**
 * Genera un PDF para un pedido individual
 */
export async function generarPDFPedido(pedido: Pedido): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT]
  });

  await dibujarPaginaPedido(pdf, pedido);
  return pdf;
}

/**
 * Genera un PDF consolidado con todos los pedidos
 */
export async function generarPDFConsolidado(pedidos: Pedido[]): Promise<jsPDF> {
  if (pedidos.length === 0) throw new Error('No hay pedidos para generar');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT]
  });

  for (let i = 0; i < pedidos.length; i++) {
    if (i > 0) {
      pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
    }
    await dibujarPaginaPedido(pdf, pedidos[i]);
  }

  return pdf;
}
