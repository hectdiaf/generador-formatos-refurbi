// ============================================================
// Generador de PDF - Formato Refurbi (Diseño Moderno)
// Media Carta Horizontal (5.5 x 8.5 pulgadas)
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsPDFAny = jsPDF as any;

// Dimensiones Media Carta Horizontal en mm
const PAGE_WIDTH = 215.9;
const PAGE_HEIGHT = 139.7;

// Paleta de colores moderna y vibrante
const COLORS = {
  primary: [37, 99, 235] as const,      // Azul vibrante #2563EB
  primaryDark: [30, 64, 175] as const,  // Azul oscuro #1E40AF
  primaryLight: [191, 219, 254] as const, // Azul claro #BFDBFE
  primaryBg: [239, 246, 255] as const,  // Azul fondo #EFF6FF
  accent: [16, 185, 129] as const,      // Verde esmeralda #10B981
  accentLight: [209, 250, 229] as const, // Verde claro #D1FAE5
  navy: [15, 23, 42] as const,          // Navy profundo #0F172A
  slate: [51, 65, 85] as const,         // Slate #334155
  slateLight: [100, 116, 139] as const, // Slate claro #64748B
  gray: [148, 163, 184] as const,       // Gris #94A3B8
  grayLight: [241, 245, 249] as const,  // Gris claro #F1F5F9
  white: [255, 255, 255] as const,
  orange: [249, 115, 22] as const,      // Naranja #F97316
  orangeLight: [255, 237, 213] as const, // Naranja claro #FFEDD5
  purple: [139, 92, 246] as const,      // Púrpura #8B5CF6
  purpleLight: [237, 233, 254] as const, // Púrpura claro #EDE9FE
};

function formatCurrency(value: string | number): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Función para dibujar un gradiente simulado (degradado vertical)
function drawGradientRect(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  colorTop: readonly number[], colorBottom: readonly number[],
  steps: number = 8
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

// Helper para setGState sin errores de TypeScript
function setOpacity(pdf: jsPDF, opacity: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = pdf as any;
  if (p.GState) {
    p.setGState(new p.GState({ opacity }));
  }
}

// Función para dibujar un badge/pill
function drawBadge(
  pdf: jsPDF,
  x: number, y: number, text: string,
  bgColor: readonly number[], textColor: readonly number[],
  fontSize: number = 6
) {
  const textWidth = pdf.getStringUnitWidth(text) * fontSize / pdf.internal.scaleFactor;
  const padding = 3;
  const badgeWidth = textWidth + padding * 2;
  const badgeHeight = fontSize * 0.55 + 2;
  
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.roundedRect(x, y - badgeHeight / 2, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fontSize);
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(text, x + padding, y + fontSize * 0.15);
  
  return badgeWidth;
}

// Función para dibujar una tarjeta con sombra
function drawCard(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  options: { shadow?: boolean; radius?: number; borderColor?: readonly number[] } = {}
) {
  const { shadow = true, radius = 2, borderColor } = options;
  
  // Sombra
  if (shadow) {
    pdf.setFillColor(0, 0, 0);
    setOpacity(pdf, 0.05);
    pdf.roundedRect(x + 1, y + 1, w, h, radius, radius, 'F');
    setOpacity(pdf, 1);
  }
  
  // Tarjeta
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(x, y, w, h, radius, radius, 'F');
  
  // Borde sutil
  if (borderColor) {
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, w, h, radius, radius, 'S');
  } else {
    pdf.setDrawColor(COLORS.grayLight[0], COLORS.grayLight[1], COLORS.grayLight[2]);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(x, y, w, h, radius, radius, 'S');
  }
}

// Función para dibujar un icono decorativo (círculo con símbolo)
function drawIcon(
  pdf: jsPDF,
  x: number, y: number, size: number,
  bgColor: readonly number[], symbol: string,
  textColor: readonly number[]
) {
  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  pdf.circle(x + size / 2, y + size / 2, size / 2, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(size * 1.8);
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  const textWidth = pdf.getStringUnitWidth(symbol) * (size * 1.8) / pdf.internal.scaleFactor;
  pdf.text(symbol, x + size / 2 - textWidth / 2, y + size / 2 + size * 0.2);
}

/**
 * Dibuja una página de pedido en el PDF
 */
async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 7;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // ============ FONDO SUTIL ============
  pdf.setFillColor(250, 252, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Patrón decorativo sutil (puntos)
  pdf.setFillColor(COLORS.primaryLight[0], COLORS.primaryLight[1], COLORS.primaryLight[2]);
  setOpacity(pdf, 0.3);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      pdf.circle(PAGE_WIDTH - 25 + i * 6, 5 + j * 6, 0.5, 'F');
    }
  }
  setOpacity(pdf, 1);

  // ============ ENCABEZADO CON GRADIENTE ============
  drawGradientRect(pdf, 0, 0, PAGE_WIDTH, 24, COLORS.primary, COLORS.primaryDark, 10);
  
  // Elementos decorativos en el header
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.08);
  pdf.circle(PAGE_WIDTH - 15, 12, 25, 'F');
  pdf.circle(PAGE_WIDTH - 35, 5, 15, 'F');
  setOpacity(pdf, 1);

  // Logo Refurbi
  pdf.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.roundedRect(margin + 2, 4, 18, 7, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text('REFURBI', margin + 4, 8.5);

  // Icono de reciclaje
  pdf.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.setLineWidth(0.7);
  pdf.circle(margin + 17, 7.5, 2, 'S');
  pdf.setLineWidth(0.5);
  pdf.line(margin + 16, 7.5, margin + 18, 7.5);
  pdf.line(margin + 17.5, 7, margin + 18, 7.5);
  pdf.line(margin + 17.5, 8, margin + 18, 7.5);

  // Propósito
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5);
  pdf.setTextColor(200, 220, 255);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 22, 7);

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('Formato de remisión de pedidos', margin + 22, 12);

  // Subtítulo con badge
  drawBadge(pdf, margin + 22, 17.5, 'Ecommerce / Marketplace', [255, 255, 255], COLORS.primary, 5);

  // Número de pedido destacado (lado derecho)
  const pedidoBoxX = PAGE_WIDTH - margin - 50;
  
  // Caja del pedido
  pdf.setFillColor(255, 255, 255);
  setOpacity(pdf, 0.15);
  pdf.roundedRect(pedidoBoxX - 2, 3, 52, 18, 3, 3, 'F');
  setOpacity(pdf, 1);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 255);
  pdf.text('PEDIDO N.°', pedidoBoxX, 7);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text(String(pedido.pedido), pedidoBoxX, 15);

  // Canal y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(180, 210, 255);
  pdf.text(`Canal: ${pedido.mkp}`, pedidoBoxX, 20);
  pdf.text(`Fecha: ${pedido.fecha}`, pedidoBoxX + 25, 20);

  currentY = 27;

  // ============ DATOS DEL CLIENTE (Tarjeta) ============
  const clientCardY = currentY;
  drawCard(pdf, margin, currentY, contentWidth, 18, { borderColor: COLORS.primaryLight });
  
  // Icono de usuario
  drawIcon(pdf, margin + 3, currentY + 2, 5, COLORS.primaryBg, '👤', COLORS.primary);

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  pdf.text('DATOS DEL CLIENTE', margin + 10, currentY + 5);

  // Datos en cards internas
  const colWidth = (contentWidth - 14) / 3;
  const dataStartX = margin + 4;
  const dataY = currentY + 8;

  // Nombre
  pdf.setFillColor(COLORS.primaryBg[0], COLORS.primaryBg[1], COLORS.primaryBg[2]);
  pdf.roundedRect(dataStartX, dataY, colWidth - 2, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('NOMBRE', dataStartX + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(pedido.nombre.toUpperCase().substring(0, 30), dataStartX + 2, dataY + 6.5);

  // Cédula
  pdf.setFillColor(COLORS.primaryBg[0], COLORS.primaryBg[1], COLORS.primaryBg[2]);
  pdf.roundedRect(dataStartX + colWidth, dataY, colWidth - 2, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('C.C.', dataStartX + colWidth + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.cedula), dataStartX + colWidth + 2, dataY + 6.5);

  // Celular
  pdf.setFillColor(COLORS.primaryBg[0], COLORS.primaryBg[1], COLORS.primaryBg[2]);
  pdf.roundedRect(dataStartX + colWidth * 2, dataY, colWidth - 2, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('CELULAR', dataStartX + colWidth * 2 + 2, dataY + 3);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  pdf.text(String(pedido.celular), dataStartX + colWidth * 2 + 2, dataY + 6.5);

  currentY += 21;

  // ============ DETALLE DEL PRODUCTO ============
  const tableAreaWidth = contentWidth - 35; // Dejar espacio para QR
  
  // Título con icono
  drawIcon(pdf, margin, currentY, 5, COLORS.orangeLight, '📦', COLORS.orange);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  pdf.text('DETALLE DEL PRODUCTO', margin + 7, currentY + 3.5);
  currentY += 7;

  // Tabla moderna
  const cols = [
    { label: 'SKU', width: tableAreaWidth * 0.30, align: 'left' as const },
    { label: 'PRECIO BASE', width: tableAreaWidth * 0.14, align: 'right' as const },
    { label: 'PANEL', width: tableAreaWidth * 0.12, align: 'right' as const },
    { label: 'GAR. A.I', width: tableAreaWidth * 0.12, align: 'right' as const },
    { label: 'GAR. TOTAL', width: tableAreaWidth * 0.14, align: 'right' as const },
    { label: 'TOTAL', width: tableAreaWidth * 0.18, align: 'right' as const }
  ];

  const rowHeight = 5.5;
  const tableX = margin;

  // Encabezados con gradiente
  drawGradientRect(pdf, tableX, currentY, tableAreaWidth, rowHeight, COLORS.primary, COLORS.primaryDark, 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  
  let colX = tableX;
  cols.forEach(col => {
    const textW = pdf.getStringUnitWidth(col.label) * 4.5 / pdf.internal.scaleFactor;
    const textX = col.align === 'right' ? colX + col.width - textW - 2 : colX + 2;
    pdf.text(col.label, textX, currentY + 3.5);
    colX += col.width;
  });
  
  currentY += rowHeight;

  // Filas de productos
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? COLORS.white : COLORS.grayLight;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(tableX, currentY, tableAreaWidth, rowHeight, 'F');
    
    // Línea separadora sutil
    if (index > 0) {
      pdf.setDrawColor(COLORS.grayLight[0], COLORS.grayLight[1], COLORS.grayLight[2]);
      pdf.setLineWidth(0.2);
      pdf.line(tableX, currentY, tableX + tableAreaWidth, currentY);
    }
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(4.5);
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
      if (col.align === 'right') {
        const textW = pdf.getStringUnitWidth(values[i]) * 4.5 / pdf.internal.scaleFactor;
        pdf.text(values[i], colX + col.width - textW - 2, currentY + 3.5);
      } else {
        pdf.setFont(i === 0 ? 'helvetica' : 'helvetica', i === 0 ? 'bold' : 'normal');
        pdf.text(values[i], colX + 2, currentY + 3.5);
      }
      colX += col.width;
    });
    
    currentY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(COLORS.primaryLight[0], COLORS.primaryLight[1], COLORS.primaryLight[2]);
  pdf.setLineWidth(0.4);
  const tableStartY = currentY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.roundedRect(tableX, tableStartY, tableAreaWidth, currentY - tableStartY, 1.5, 1.5, 'S');

  // Total destacado con badge grande
  currentY += 2;
  const totalBoxW = 60;
  const totalBoxX = tableX + tableAreaWidth - totalBoxW;
  
  // Gradiente para el total
  drawGradientRect(pdf, totalBoxX, currentY, totalBoxW, 8, COLORS.accent, [5, 150, 105], 6);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  pdf.text('TOTAL VENTA', totalBoxX + 3, currentY + 3.5);
  
  pdf.setFontSize(7);
  pdf.text(formatCurrency(pedido.totalVenta), totalBoxX + 3, currentY + 7);

  // ============ QR CODE (lado derecho, arriba) ============
  const qrSize = 24;
  const qrX = margin + contentWidth - qrSize - 2;
  const qrY = tableStartY - 2;
  
  // Fondo del QR
  drawCard(pdf, qrX - 2, qrY - 2, qrSize + 4, qrSize + 10, { borderColor: COLORS.primaryLight });
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    pdf.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'S');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('QR', qrX + 10, qrY + 13);
  }
  
  // Etiqueta del QR
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(3.5);
  pdf.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  const qrLabel = `#${pedido.pedido}`;
  const qrLabelW = pdf.getStringUnitWidth(qrLabel) * 3.5 / pdf.internal.scaleFactor;
  pdf.text(qrLabel, qrX + (qrSize - qrLabelW) / 2, qrY + qrSize + 5);

  currentY += 11;

  // ============ DETALLES DEL PEDIDO ============
  drawIcon(pdf, margin, currentY, 5, COLORS.purpleLight, '📋', COLORS.purple);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('DETALLES DEL PEDIDO', margin + 7, currentY + 3.5);
  currentY += 7;

  const detailWidth = (tableAreaWidth) / 2;

  // Pasarela
  drawCard(pdf, margin, currentY, detailWidth - 3, 12, { shadow: false, borderColor: COLORS.purpleLight });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('PASARELA', margin + 3, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(COLORS.slate[0], COLORS.slate[1], COLORS.slate[2]);
  pdf.text(pedido.pasarela || '-', margin + 3, currentY + 9);

  // Outlet / Combo
  const checkboxX = margin + detailWidth;
  drawCard(pdf, checkboxX, currentY, detailWidth - 3, 12, { shadow: false, borderColor: COLORS.purpleLight });
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.purple[0], COLORS.purple[1], COLORS.purple[2]);
  pdf.text('OUTLET', checkboxX + 3, currentY + 4);
  pdf.text('COMBO', checkboxX + detailWidth / 2, currentY + 4);
  
  // Checkboxes modernos
  pdf.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(checkboxX + 3, currentY + 6, 3.5, 3.5, 0.5, 0.5, 'S');
  pdf.roundedRect(checkboxX + detailWidth / 2, currentY + 6, 3.5, 3.5, 0.5, 0.5, 'S');

  // Observaciones del sistema
  currentY += 14;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.slateLight[0], COLORS.slateLight[1], COLORS.slateLight[2]);
  pdf.text('OBSERVACIONES DEL SISTEMA', margin + 3, currentY);

  currentY += 4;

  // ============ DILIGENCIAMIENTO OPERATIVO ============
  drawIcon(pdf, margin, currentY, 5, COLORS.accentLight, '✏️', COLORS.accent);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('DILIGENCIAMIENTO OPERATIVO', margin + 7, currentY + 3.5);
  currentY += 7;

  const opWidth = tableAreaWidth / 3;
  const remainingHeight = PAGE_HEIGHT - currentY - margin - 2;
  const boxHeight = Math.min(remainingHeight, 26);

  // Factura
  drawCard(pdf, margin, currentY, opWidth - 2, boxHeight, { shadow: false, borderColor: COLORS.accentLight });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('FACTURA', margin + 3, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('N.º ________________________', margin + 3, currentY + 9);

  // Líneas para escribir
  pdf.setDrawColor(COLORS.grayLight[0], COLORS.grayLight[1], COLORS.grayLight[2]);
  pdf.setLineWidth(0.2);
  for (let i = 0; i < 3; i++) {
    pdf.line(margin + 3, currentY + 13 + i * 4, margin + opWidth - 5, currentY + 13 + i * 4);
  }

  // Observaciones
  drawCard(pdf, margin + opWidth, currentY, opWidth - 2, boxHeight, { shadow: false, borderColor: COLORS.accentLight });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('OBSERVACIONES', margin + opWidth + 3, currentY + 4);

  // Líneas para escribir
  for (let i = 0; i < 4; i++) {
    pdf.line(margin + opWidth + 3, currentY + 8 + i * 4, margin + opWidth * 2 - 5, currentY + 8 + i * 4);
  }

  // Proceso
  drawCard(pdf, margin + opWidth * 2, currentY, opWidth - 2, boxHeight, { shadow: false, borderColor: COLORS.accentLight });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  pdf.text('PROCESO', margin + opWidth * 2 + 3, currentY + 4);

  // Líneas para escribir
  for (let i = 0; i < 4; i++) {
    pdf.line(margin + opWidth * 2 + 3, currentY + 8 + i * 4, margin + opWidth * 3 - 5, currentY + 8 + i * 4);
  }

  // ============ FOOTER DECORATIVO ============
  // Línea decorativa inferior con gradiente
  drawGradientRect(pdf, margin, PAGE_HEIGHT - 4, contentWidth, 1.5, COLORS.primary, COLORS.accent, 4);
  
  // Texto del footer
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(3.5);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Refurbi — Dando segundas oportunidades', margin + 2, PAGE_HEIGHT - 1.5);
  
  // Página y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(3.5);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, PAGE_WIDTH - margin - 30, PAGE_HEIGHT - 1.5);
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
