// ============================================================
// Generador de PDF - Formato Refurbi
// Media Carta HORIZONTAL (8.5 x 5.5 pulgadas)
// Layout redistribuido con nuevas proporciones
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';
import { generarCodigoBarras } from './barcodeGenerator';

// Dimensiones Media Carta HORIZONTAL en mm
const PAGE_WIDTH = 215.9;  // 8.5 inches
const PAGE_HEIGHT = 139.7; // 5.5 inches

// Paleta de colores Refurbi - Tonos azules y negros (optimizado para impresión)
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
  slateLight: [0, 0, 0] as const, // Negro puro para impresión
  white: [255, 255, 255] as const,
  border: [30, 64, 175] as const, // Borde azul en lugar de gris
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
  // Logo oficial Refurbi: 3 círculos superpuestos con centros huecos
  const circleRadius = size * 0.35;
  const offset = size * 0.28;
  
  pdf.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  setOpacity(pdf, 0.85);
  
  // Dibujar 3 círculos superpuestos
  pdf.circle(x + circleRadius, y + size / 2, circleRadius, 'F');
  pdf.circle(x + circleRadius + offset, y + size / 2, circleRadius, 'F');
  pdf.circle(x + circleRadius + offset * 2, y + size / 2, circleRadius, 'F');
  
  // Crear los centros huecos (efecto Venn)
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 1);
  const innerRadius = circleRadius * 0.45;
  pdf.circle(x + circleRadius, y + size / 2, innerRadius, 'F');
  pdf.circle(x + circleRadius + offset, y + size / 2, innerRadius, 'F');
  pdf.circle(x + circleRadius + offset * 2, y + size / 2, innerRadius, 'F');
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
  const headerHeight = 32;
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, headerHeight, COLORS.brand, COLORS.brandLight, 8);
  
  // Elementos decorativos
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.08);
  pdf.circle(PAGE_WIDTH - 15, 16, 20, 'F');
  setOpacity(pdf, 1);

  // Logo de Refurbi + Título al mismo nivel del QR (izquierda)
  const titleY = 8; // Mismo nivel vertical que el QR
  drawRefurbiLogo(pdf, margin + 2, titleY - 1, 15); // Reducido de 18 a 15
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('REFURBI', margin + 18, titleY + 5);
  
  // Título al mismo nivel del QR
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('FORMATO DE REMISIÓN DE PEDIDOS', margin + 2, titleY + 14);

  // Canal/MKP y Fecha en la misma línea
  const mkpY = titleY + 20;
  
  // Icono carrito (simplificado)
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.line(margin + 2, mkpY - 1, margin + 4, mkpY - 1);
  pdf.line(margin + 2.5, mkpY - 1, margin + 3, mkpY + 1);
  pdf.line(margin + 3.5, mkpY - 1, margin + 4, mkpY + 1);
  pdf.circle(margin + 2.8, mkpY + 1.5, 0.3, 'F');
  pdf.circle(margin + 3.7, mkpY + 1.5, 0.3, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(pedido.mkp, margin + 6, mkpY);

  // Fecha en la misma línea que MKP
  const fechaX = margin + 6 + pdf.getStringUnitWidth(pedido.mkp) * 10 / pdf.internal.scaleFactor + 5;
  
  // Icono calendario (simplificado)
  pdf.setDrawColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.setLineWidth(0.4);
  pdf.rect(fechaX, mkpY - 1.5, 3, 3);
  pdf.line(fechaX, mkpY - 0.5, fechaX + 3, mkpY - 0.5);
  pdf.line(fechaX + 0.8, mkpY - 2, fechaX + 0.8, mkpY - 1.2);
  pdf.line(fechaX + 2.2, mkpY - 2, fechaX + 2.2, mkpY - 1.2);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(pedido.fecha, fechaX + 4, mkpY);

  // QR centrado, bajado para que su parte inferior se alinee con la línea de MKP/fecha
  const qrSize = 18;
  const qrX = (PAGE_WIDTH - qrSize) / 2;
  const qrY = mkpY - qrSize; // Parte inferior del QR alineada con mkpY
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (e) {
    // Placeholder
  }

  // Número de pedido destacado (lado derecho, parte superior)
  const pedidoBoxX = PAGE_WIDTH - margin - 45;
  
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 2, 47, 12, 2, 2, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('PEDIDO', pedidoBoxX, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 13);

  // Código de barras Code 128 justo debajo del número de pedido
  const barcodeY = 15;
  const barcodeHeight = 10;
  const barcodeWidth = 45;
  
  // Recuadro blanco alrededor del código de barras
  pdf.setFillColor(255, 255, 255);
  pdf.rect(pedidoBoxX - 1, barcodeY - 1, barcodeWidth + 2, barcodeHeight + 2, 'F');
  
  try {
    const barcodeDataUrl = await generarCodigoBarras(String(pedido.pedido));
    if (barcodeDataUrl) {
      pdf.addImage(barcodeDataUrl, 'PNG', pedidoBoxX, barcodeY, barcodeWidth, barcodeHeight);
    }
  } catch (e) {
    // Si falla, dibujar placeholder
    pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(pedidoBoxX, barcodeY, barcodeWidth, barcodeHeight);
  }

  currentY = headerHeight + 2;

  // ============ LAYOUT EN 2x2 CON NUEVAS PROPORCIONES ============
  // Fila superior: 30% datos cliente, 70% detalle producto
  const clientWidth = contentWidth * 0.30;
  const productWidth = contentWidth * 0.70 - 2; // 2mm gap
  
  // Fila inferior: 40% detalles pedido, 60% diligenciamiento
  const detailsWidth = contentWidth * 0.40;
  const operativeWidth = contentWidth * 0.60 - 2; // 2mm gap
  
  const clientX = margin;
  const productX = margin + clientWidth + 2;
  const detailsX = margin;
  const operativeX = margin + detailsWidth + 2;

  // Calcular alturas disponibles
  const topSectionHeight = 55;
  const bottomY = currentY + topSectionHeight + 2;

  // ============ ARRIBA IZQUIERDA: DATOS DEL CLIENTE (30%) ============
  drawSectionTitle(pdf, clientX, currentY, 'DATOS DEL CLIENTE', COLORS.blue, COLORS.blueBg, clientWidth);
  let dataY = currentY + 8;

  const dataBoxHeight = 10;
  
  // Nombre
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(clientX, dataY, clientWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(clientX, dataY, clientWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('NOMBRE', clientX + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 30), clientX + 2, dataY + 7.5);

  dataY += dataBoxHeight + 1;

  // Cédula y Celular lado a lado
  const halfDataWidth = (clientWidth - 1) / 2;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(clientX, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.roundedRect(clientX, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('C.C.', clientX + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), clientX + 2, dataY + 7.5);

  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(clientX + halfDataWidth + 1, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.roundedRect(clientX + halfDataWidth + 1, dataY, halfDataWidth, dataBoxHeight, 1.5, 1.5, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('CELULAR', clientX + halfDataWidth + 3, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), clientX + halfDataWidth + 3, dataY + 7.5);

  // Código de barras de la cédula
  dataY += dataBoxHeight + 1;
  const cedulaBarcodeWidth = clientWidth;
  const cedulaBarcodeHeight = 8;
  
  // Recuadro blanco alrededor del código de barras
  pdf.setFillColor(255, 255, 255);
  pdf.rect(clientX, dataY, cedulaBarcodeWidth, cedulaBarcodeHeight, 'F');
  
  try {
    const cedulaBarcodeDataUrl = await generarCodigoBarras(String(pedido.cedula));
    if (cedulaBarcodeDataUrl) {
      pdf.addImage(cedulaBarcodeDataUrl, 'PNG', clientX, dataY, cedulaBarcodeWidth, cedulaBarcodeHeight);
    }
  } catch (e) {
    // Si falla, dibujar placeholder
    pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(clientX, dataY, cedulaBarcodeWidth, cedulaBarcodeHeight);
  }

  // ============ ARRIBA DERECHA: DETALLE DEL PRODUCTO (70%) ============
  drawSectionTitle(pdf, productX, currentY, 'DETALLE DEL PRODUCTO', COLORS.section, COLORS.sectionBg, productWidth);
  let tableY = currentY + 8;

  const cols = [
    { label: 'SKU', width: productWidth * 0.40, align: 'left' as const },
    { label: 'BASE', width: productWidth * 0.15, align: 'right' as const },
    { label: 'PANEL', width: productWidth * 0.12, align: 'right' as const },
    { label: 'G.A.I', width: productWidth * 0.12, align: 'right' as const },
    { label: 'G.TOT', width: productWidth * 0.11, align: 'right' as const },
  ];

  const numProductos = pedido.productos.length;
  const availableTableHeight = topSectionHeight - 10;
  const headerRowHeight = 6;
  const rowHeight = Math.min(8, Math.max(6, (availableTableHeight - headerRowHeight - 8) / numProductos));

  const fontSize = 7;
  const textOffsetY = rowHeight / 2 + 1;

  // Encabezados
  drawGradientRect(pdf, productX, tableY, productWidth, headerRowHeight, COLORS.brand, COLORS.brandLight, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = productX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * fontSize / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 1 : colX + 1;
    pdf.text(col.label, textX, tableY + textOffsetY);
    colX += col.width;
  });
  
  tableY += headerRowHeight;

  // Filas
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.blueBg;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(productX, tableY, productWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
    
    colX = productX;
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
  pdf.roundedRect(productX, tableStartY, productWidth, tableY - tableStartY, 1, 1, 'S');

  // Total destacado
  tableY += 1;
  const totalBoxW = productWidth * 0.6;
  const totalBoxX = productX + productWidth - totalBoxW;
  
  drawGradientRect(pdf, totalBoxX, tableY, totalBoxW, 7, COLORS.accent, COLORS.section, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 2, tableY + 3);
  
  pdf.setFontSize(8);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 2, tableY + 6.5);

  // ============ ABAJO IZQUIERDA: DETALLES DEL PEDIDO (40%) ============
  drawSectionTitle(pdf, detailsX, bottomY, 'DETALLES DEL PEDIDO', COLORS.section, COLORS.sectionBg, detailsWidth);
  let detailY = bottomY + 8;

  const detailBoxHeight = 11;

  // Pasarela
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(detailsX, detailY, detailsWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(detailsX, detailY, detailsWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(detailsX, detailY, detailsWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('PASARELA', detailsX + 2, detailY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', detailsX + 2, detailY + 9.5);

  detailY += detailBoxHeight + 1;

  // Outlet / Combo
  const halfDetailWidth = (detailsWidth - 1) / 2;
  
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(detailsX, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(detailsX, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(detailsX, detailY, halfDetailWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('OUTLET', detailsX + 2, detailY + 5.5);
  
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(detailsX + 2, detailY + 7, 3, 3, 0.5, 0.5, 'S');
  
  if (pedido.outlet) {
    pdf.setFillColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
    pdf.roundedRect(detailsX + 2.5, detailY + 7.5, 2, 2, 0.3, 0.3, 'F');
  }

  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(detailsX + halfDetailWidth + 1, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(detailsX + halfDetailWidth + 1, detailY, halfDetailWidth, detailBoxHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.roundedRect(detailsX + halfDetailWidth + 1, detailY, halfDetailWidth, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.section[0], COLORS.section[1], COLORS.section[2]);
  pdf.text('COMBO', detailsX + halfDetailWidth + 3, detailY + 5.5);
  
  pdf.setDrawColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(detailsX + halfDetailWidth + 3, detailY + 7, 3, 3, 0.5, 0.5, 'S');

  // ============ ABAJO DERECHA: DILIGENCIAMIENTO OPERATIVO (60%) ============
  drawSectionTitle(pdf, operativeX, bottomY, 'DILIGENCIAMIENTO OPERATIVO', COLORS.accent, COLORS.accentBg, operativeWidth);
  let opY = bottomY + 8;

  const opWidth = operativeWidth / 3;
  const opHeight = 25; // Altura fija para evitar que se estire hasta el final

  // Factura
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(operativeX, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(operativeX, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(operativeX, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('FACTURA', operativeX + 2, opY + 5.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.brand[0], COLORS.brand[1], COLORS.brand[2]);
  pdf.text('N.________________', operativeX + 2, opY + 9);

  // Observaciones
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(operativeX + opWidth, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(operativeX + opWidth, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(operativeX + opWidth, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('OBSERVACIONES', operativeX + opWidth + 2, opY + 5.5);

  // Proceso
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(operativeX + opWidth * 2, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'F');
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(operativeX + opWidth * 2, opY, opWidth - 0.5, opHeight, 1.5, 1.5, 'S');
  pdf.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.roundedRect(operativeX + opWidth * 2, opY, opWidth - 0.5, 2.5, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('PROCESO', operativeX + opWidth * 2 + 2, opY + 5.5);
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
