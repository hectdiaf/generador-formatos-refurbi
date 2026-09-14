// ============================================================
// Generador de PDF - Formato Refurbi
// Media Carta HORIZONTAL (8.5 x 5.5 pulgadas)
// Layout redistribuido en 2x2
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';
import { generarCodigoBarras } from './barcodeGenerator';

// Dimensiones Media Carta HORIZONTAL en mm
const PAGE_WIDTH = 215.9;  // 8.5 inches
const PAGE_HEIGHT = 139.7; // 5.5 inches

// Paleta de colores Refurbi - Tonos azules unificados
const COLORS = {
  brand: [2, 48, 71] as const,
  brandLight: [3, 78, 113] as const,
  blue: [37, 99, 235] as const,
  blueBg: [239, 246, 255] as const,
  section: [30, 64, 175] as const,
  sectionBg: [219, 234, 254] as const,
  accent: [59, 130, 246] as const,
  accentBg: [224, 242, 254] as const,
  navy: [15, 23, 42] as const,
  slate: [51, 65, 85] as const,
  slateLight: [100, 116, 139] as const,
  gray: [148, 163, 184] as const,
  grayLight: [241, 245, 249] as const,
  white: [255, 255, 255] as const,
  border: [191, 219, 254] as const,
};

function formatCurrency(value: string | number): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setOpacity(pdf: jsPDF, opacity: number) {
  const p = pdf as any;
  if (p.GState) {
    try {
      p.setGState(new p.GState({ opacity }));
    } catch (e) {
      // Ignorar errores
    }
  }
}

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

async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 5;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // Fondo blanco
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // ============ ENCABEZADO ============
  const headerHeight = 22;
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, headerHeight, COLORS.brand, COLORS.brandLight, 8);
  
  // Elementos decorativos
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.08);
  pdf.circle(PAGE_WIDTH - 15, 11, 20, 'F');
  setOpacity(pdf, 1);

  // Logo de Refurbi
  drawRefurbiLogo(pdf, margin + 2, 3, 9);
  
  // Texto REFURBI
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('REFURBI', margin + 15, 8);

  // Propósito
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 15, 11.5);

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('Formato de remisión de pedidos', margin + 2, 16);

  // Canal/MKP y Fecha (más grande) debajo del título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(200, 220, 240);
  pdf.text(`${pedido.mkp}  |  ${pedido.fecha}`, margin + 2, 20);

  // Número de pedido destacado (lado derecho)
  const pedidoBoxX = PAGE_WIDTH - margin - 35;
  
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 2, 37, 12, 2, 2, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 225);
  pdf.text('PEDIDO', pedidoBoxX, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 12);

  // QR pequeño al lado del número de pedido
  const qrSize = 10;
  const qrX = pedidoBoxX - qrSize - 2;
  const qrY = 3;
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    // Placeholder
  }

  // Código de barras Code 128 debajo del número de pedido
  const barcodeY = 15;
  const barcodeHeight = 6;
  const barcodeWidth = 35;
  
  try {
    const barcodeDataUrl = await generarCodigoBarras(String(pedido.pedido));
    if (barcodeDataUrl) {
      pdf.addImage(barcodeDataUrl, 'PNG', pedidoBoxX, barcodeY, barcodeWidth, barcodeHeight);
    }
  } catch (e) {
    // Si falla, dibujar placeholder
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.3);
    pdf.rect(pedidoBoxX, barcodeY, barcodeWidth, barcodeHeight);
  }

  currentY = headerHeight + 2;

  // ============ LAYOUT EN 2x2 ============
  const halfWidth = (contentWidth - 2) / 2; // 2mm de gap central
  const leftX = margin;
  const rightX = margin + halfWidth + 2;
  
  // Calcular alturas disponibles
  const topSectionHeight = 55; // Altura para las secciones superiores
  const bottomSectionHeight = PAGE_HEIGHT - currentY - topSectionHeight - margin - 3;
  
  const topY = currentY;
  const bottomY = currentY + topSectionHeight + 2;

  // ============ ARRIBA IZQUIERDA: DATOS DEL CLIENTE ============
  drawSectionTitle(pdf, leftX, topY, 'DATOS DEL CLIENTE', COLORS.blue, COLORS.blueBg, halfWidth);
  let dataY = topY + 8;

  // Datos en columna vertical
  const dataBoxHeight = 10;
  
  // Nombre
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, dataY, halfWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(leftX, dataY, halfWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('NOMBRE', leftX + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 30), leftX + 2, dataY + 7.5);

  dataY += dataBoxHeight + 1;

  // Cédula y Celular lado a lado
  const halfDataWidth = (halfWidth - 1) / 2;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(leftX, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('C.C.', leftX + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), leftX + 2, dataY + 7.5);

  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX + halfDataWidth + 1, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  pdf.roundedRect(leftX + halfDataWidth + 1, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('CELULAR', leftX + halfDataWidth + 3, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), leftX + halfDataWidth + 3, dataY + 7.5);

  // ============ ARRIBA DERECHA: DETALLE DEL PRODUCTO ============
  drawSectionTitle(pdf, rightX, topY, 'DETALLE DEL PRODUCTO', COLORS.section, COLORS.sectionBg, halfWidth);
  let tableY = topY + 8;

  // Tabla de productos
  const cols = [
    { label: 'SKU', width: halfWidth * 0.40, align: 'left' as const },
    { label: 'BASE', width: halfWidth * 0.15, align: 'right' as const },
    { label: 'PANEL', width: halfWidth * 0.12, align: 'right' as const },
    { label: 'G.A.I', width: halfWidth * 0.12, align: 'right' as const },
    { label: 'G.TOT', width: halfWidth * 0.11, align: 'right' as const },
  ];

  // Calcular alto de fila dinámico
  const numProductos = pedido.productos.length;
  const availableTableHeight = topSectionHeight - 10; // espacio disponible para tabla
  const headerRowHeight = 6;
  const rowHeight = Math.min(8, Math.max(6, (availableTableHeight - headerRowHeight - 8) / numProductos));

  const fontSize = 7;
  const textOffsetY = rowHeight / 2 + 1;

  // Encabezados
  drawGradientRect(pdf, rightX, tableY, halfWidth, headerRowHeight, COLORS.brand, COLORS.brandLight, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = rightX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * fontSize / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 1 : colX + 1;
    pdf.text(col.label, textX, tableY + textOffsetY);
    colX += col.width;
  });
  
  tableY += headerRowHeight;

  // Filas
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.grayLight;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(rightX, tableY, halfWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
    
    colX = rightX;
    const values = [
      producto.sku,
      formatCurrency(producto.base),
      formatCurrency(producto.panel),
      formatCurrency(producto.garantiaAI),
      formatCurrency(producto.garantiaTotal),
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
        const textW = pdf.getStringUnitWidth(values[i]) * fontSize / pdf.internal.scaleFactor;
        pdf.text(values[i], colX + col.width - textW - 1, tableY + textOffsetY);
      } else {
        pdf.text(values[i], colX + 1, tableY + textOffsetY);
      }
      colX += col.width;
    });
    
    tableY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.4);
  const tableStartY = tableY - (pedido.productos.length * rowHeight) - headerRowHeight;
  pdf.roundedRect(rightX, tableStartY, halfWidth, tableY - tableStartY, 1, 1, 'S');

  // Total destacado
  tableY += 1;
  const totalBoxW = halfWidth * 0.6;
  const totalBoxX = rightX + halfWidth - totalBoxW;
  
  drawGradientRect(pdf, totalBoxX, tableY, totalBoxW, 7, COLORS.accent, COLORS.section, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 2, tableY + 3);
  
  pdf.setFontSize(8);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 2, tableY + 6.5);

  // ============ ABAJO IZQUIERDA: DETALLES DEL PEDIDO ============
  drawSectionTitle(pdf, leftX, bottomY, 'DETALLES DEL PEDIDO', COLORS.section, COLORS.sectionBg, halfWidth);
  let detailY = bottomY + 8;

  const detailBoxHeight = 11;

  // Pasarela
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, detailY, halfWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX, detailY, halfWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(leftX, detailY, halfWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('PASARELA', leftX + 2, detailY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', leftX + 2, detailY + 9.5);

  detailY += detailBoxHeight + 1;

  // Outlet / Combo
  const halfDetailWidth = (halfWidth - 1) / 2;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(leftX, detailY, halfDetailWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('OUTLET', leftX + 2, detailY + 5.5);
  
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX + 2, detailY + 7, 3, 3, 0.5, 0.5, 'S');
  
  if (pedido.outlet) {
    pdf.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.roundedRect(leftX + 2.5, detailY + 7.5, 2, 2, 0.3, 0.3, 'F');
  }

  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(leftX + halfDetailWidth + 1, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX + halfDetailWidth + 1, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(leftX + halfDetailWidth + 1, detailY, halfDetailWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('COMBO', leftX + halfDetailWidth + 3, detailY + 5.5);
  
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(leftX + halfDetailWidth + 3, detailY + 7, 3, 3, 0.5, 0.5, 'S');

  // ============ ABAJO DERECHA: DILIGENCIAMIENTO OPERATIVO ============
  drawSectionTitle(pdf, rightX, bottomY, 'DILIGENCIAMIENTO OPERATIVO', COLORS.accent, COLORS.accentBg, halfWidth);
  let opY = bottomY + 8;

  const opWidth = halfWidth / 3;
  const opHeight = bottomSectionHeight - 10;

  // Factura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(rightX, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('FACTURA', rightX + 2, opY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('N.________________', rightX + 2, opY + 9);

  // Observaciones
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX + opWidth, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX + opWidth, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(rightX + opWidth, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('OBSERVACIONES', rightX + opWidth + 2, opY + 5.5);

  // Proceso
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(rightX + opWidth * 2, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(rightX + opWidth * 2, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(rightX + opWidth * 2, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('PROCESO', rightX + opWidth * 2 + 2, opY + 5.5);
}

export async function generarPDFPedido(pedido: Pedido): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT]
  });

  await dibujarPaginaPedido(pdf, pedido);
  return pdf;
}

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
