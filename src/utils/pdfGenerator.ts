// ============================================================
// Generador de PDF - Formato Refurbi
// Media Carta HORIZONTAL (8.5 x 5.5 pulgadas)
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';

// Dimensiones Media Carta HORIZONTAL en mm
const PAGE_WIDTH = 215.9;  // 8.5 inches
const PAGE_HEIGHT = 139.7; // 5.5 inches

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

// Dibujar gradiente
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

// Dibujar título de sección
function drawSectionTitle(
  pdf: jsPDF,
  x: number, y: number,
  title: string,
  barColor: readonly number[],
  bgColor: readonly number[],
  width: number
) {
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y, width, 6, 1.5, 1.5, 'F');
  
  pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
  pdf.roundedRect(x, y, 2.5, 6, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
  pdf.text(title, x + 5, y + 4.5);
}

/**
 * Dibuja una página de pedido en el PDF
 */
async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 6;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // Fondo blanco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // ============ ENCABEZADO ============
  const headerHeight = 22;
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, headerHeight, COLORS.brand, COLORS.brandLight, 10);
  
  // Elementos decorativos
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.08);
  pdf.circle(PAGE_WIDTH - 15, 11, 20, 'F');
  setOpacity(pdf, 1);

  // Logo de Refurbi
  drawRefurbiLogo(pdf, margin + 2, 3, 10);
  
  // Texto REFURBI
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('REFURBI', margin + 16, 8);

  // Propósito
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 16, 12);

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('Formato de remisión de pedidos', margin + 2, 18);

  // Badge Ecommerce
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin + 50, 16, 38, 4, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('Ecommerce / Marketplace', margin + 52, 18.5);

  // Número de pedido destacado
  const pedidoBoxX = PAGE_WIDTH - margin - 40;
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 2, 42, 18, 2, 2, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('PEDIDO', pedidoBoxX, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 13);

  // Canal y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 225);
  pdf.text(`${pedido.mkp} | ${pedido.fecha}`, pedidoBoxX, 18);

  currentY = headerHeight + 3;

  // ============ LAYOUT EN DOS COLUMNAS ============
  const leftColumnWidth = contentWidth * 0.65;
  const rightColumnWidth = contentWidth * 0.33;
  const leftX = margin;
  const rightX = margin + leftColumnWidth + contentWidth * 0.02;

  // ============ COLUMNA IZQUIERDA ============
  let leftY = currentY;

  // DATOS DEL CLIENTE
  drawSectionTitle(pdf, leftX, leftY, 'DATOS DEL CLIENTE', COLORS.blue, COLORS.blueBg, leftColumnWidth);
  leftY += 8;

  // Datos en 3 columnas compactas
  const colWidth = (leftColumnWidth - 3) / 3;
  
  // Nombre
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, leftY, colWidth - 1, 11, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(leftX, leftY, colWidth - 1, 11, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('NOMBRE', leftX + 2, leftY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 18), leftX + 2, leftY + 7);

  // Cédula
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX + colWidth, leftY, colWidth - 1, 11, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(leftX + colWidth, leftY, colWidth - 1, 11, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('C.C.', leftX + colWidth + 2, leftY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), leftX + colWidth + 2, leftY + 7);

  // Celular
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX + colWidth * 2, leftY, colWidth - 1, 11, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(leftX + colWidth * 2, leftY, colWidth - 1, 11, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('CELULAR', leftX + colWidth * 2 + 2, leftY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), leftX + colWidth * 2 + 2, leftY + 7);

  leftY += 14;

  // DETALLE DEL PRODUCTO
  drawSectionTitle(pdf, leftX, leftY, 'DETALLE DEL PRODUCTO', COLORS.orange, COLORS.orangeBg, leftColumnWidth);
  leftY += 8;

  // Tabla compacta
  const cols = [
    { label: 'SKU', width: leftColumnWidth * 0.35, align: 'left' as const },
    { label: 'BASE', width: leftColumnWidth * 0.13, align: 'right' as const },
    { label: 'PANEL', width: leftColumnWidth * 0.12, align: 'right' as const },
    { label: 'G.A.I', width: leftColumnWidth * 0.12, align: 'right' as const },
    { label: 'G.TOT', width: leftColumnWidth * 0.13, align: 'right' as const },
    { label: 'TOTAL', width: leftColumnWidth * 0.15, align: 'right' as const }
  ];

  const rowHeight = 5.5;

  // Encabezados
  drawGradientRect(pdf, leftX, leftY, leftColumnWidth, rowHeight, COLORS.brand, COLORS.brandLight, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = leftX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * 5 / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 1.5 : colX + 1.5;
    pdf.text(col.label, textX, leftY + 3.8);
    colX += col.width;
  });
  
  leftY += rowHeight;

  // Filas
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.grayLight;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(leftX, leftY, leftColumnWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
    
    colX = leftX;
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
        const textW = pdf.getStringUnitWidth(values[i]) * 5 / pdf.internal.scaleFactor;
        pdf.text(values[i], colX + col.width - textW - 1.5, leftY + 3.8);
      } else {
        pdf.text(values[i], colX + 1.5, leftY + 3.8);
      }
      colX += col.width;
    });
    
    leftY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.4);
  const tableStartY = leftY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.roundedRect(leftX, tableStartY, leftColumnWidth, leftY - tableStartY, 1, 1, 'S');

  // Total destacado
  leftY += 2;
  const totalBoxW = 60;
  const totalBoxX = leftX + leftColumnWidth - totalBoxW;
  
  drawGradientRect(pdf, totalBoxX, leftY, totalBoxW, 8, COLORS.green, [10, 120, 95], 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 2, totalBoxX + 3.5);
  
  pdf.setFontSize(8);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 2, leftY + 7);

  leftY += 10;

  // DETALLES DEL PEDIDO
  drawSectionTitle(pdf, leftX, leftY, 'DETALLES DEL PEDIDO', COLORS.purple, COLORS.purpleBg, leftColumnWidth);
  leftY += 8;

  const detailWidth = leftColumnWidth / 2;

  // Pasarela
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, leftY, detailWidth - 1.5, 12, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX, leftY, detailWidth - 1.5, 12, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(leftX, leftY, detailWidth - 1.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('PASARELA', leftX + 2, leftY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', leftX + 2, leftY + 10);

  // Outlet / Combo
  const checkboxX = leftX + detailWidth;
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(checkboxX, leftY, detailWidth - 1.5, 12, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(checkboxX, leftY, detailWidth - 1.5, 12, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.roundedRect(checkboxX, leftY, detailWidth - 1.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('OUTLET', checkboxX + 2, leftY + 5.5);
  pdf.text('COMBO', checkboxX + detailWidth / 2, leftY + 5.5);
  
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(checkboxX + 2, leftY + 7, 3, 3, 0.5, 0.5, 'S');
  pdf.roundedRect(checkboxX + detailWidth / 2, leftY + 7, 3, 3, 0.5, 0.5, 'S');

  // ============ COLUMNA DERECHA ============
  let rightY = currentY;

  // QR CODE
  const qrSize = 28;
  const qrX = rightX;
  const qrY = rightY;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 10, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 10, 1.5, 1.5, 'S');
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'S');
  }
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  const qrLabel = `Pedido #${pedido.pedido}`;
  const qrLabelW = pdf.getStringUnitWidth(qrLabel) * 4.5 / pdf.internal.scaleFactor;
  pdf.text(qrLabel, qrX + (qrSize - qrLabelW) / 2, qrY + qrSize + 5);

  rightY += qrSize + 12;

  // DILIGENCIAMIENTO OPERATIVO
  drawSectionTitle(pdf, rightX, rightY, 'DILIGENCIAMIENTO OPERATIVO', COLORS.green, COLORS.greenBg, rightColumnWidth);
  rightY += 8;

  const opHeight = PAGE_HEIGHT - rightY - margin - 3;

  // Factura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('FACTURA', rightX + 2, rightY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('N.______________________', rightX + 2, rightY + 9);

  rightY += opHeight / 3 + 1;

  // Observaciones
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('OBSERVACIONES', rightX + 2, rightY + 5.5);

  rightY += opHeight / 3 + 1;

  // Proceso
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, opHeight / 3, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.roundedRect(rightX, rightY, rightColumnWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.green[0], COLORS.green[1], COLORS.green[2]);
  pdf.text('PROCESO', rightX + 2, rightY + 5.5);

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
 * Genera un PDF consolidado con todos los pedidos
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
