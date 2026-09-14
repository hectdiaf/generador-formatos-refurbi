// ============================================================
// Generador de PDF - Formato de remisión de pedidos Refurbi
// Media Carta Horizontal (5.5 x 8.5 pulgadas)
// ============================================================

import jsPDF from 'jspdf';
import type { Pedido } from '../types';
import { generarQR } from './qrGenerator';

// Dimensiones Media Carta Horizontal en mm
const PAGE_WIDTH = 215.9; // 8.5 inches
const PAGE_HEIGHT = 139.7; // 5.5 inches

// Colores corporativos
const NAVY = [27, 43, 91] as const; // #1B2B5B
const BLUE_LIGHT = [74, 144, 217] as const; // #4A90D9
const GRAY_TEXT = [100, 100, 100] as const;
const GRAY_LIGHT = [240, 243, 248] as const;
const WHITE = [255, 255, 255] as const;

function formatCurrency(value: string | number): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Genera el logo de Refurbi como texto estilizado en el PDF
 */
function dibujarLogo(pdf: jsPDF, x: number, y: number) {
  // Logo textual de Refurbi
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('REFURBI', x, y);
  
  // Símbolo de reciclaje simplificado
  pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  pdf.setLineWidth(0.8);
  const circleX = x + 33;
  const circleY = y - 2;
  pdf.circle(circleX, circleY, 3, 'S');
  
  // Flecha dentro del círculo
  pdf.setLineWidth(0.6);
  pdf.line(circleX - 1.5, circleY, circleX + 1.5, circleY);
  pdf.line(circleX + 0.5, circleY - 1, circleX + 1.5, circleY);
  pdf.line(circleX + 0.5, circleY + 1, circleX + 1.5, circleY);
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

  const margin = 8;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // ============ ENCABEZADO ============
  // Barra superior navy
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 28, 'F');

  // Logo
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('REFURBI', margin + 2, 10);

  // Icono circular
  pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  pdf.setLineWidth(0.8);
  pdf.circle(margin + 32, 7.5, 3, 'S');

  // Propósito
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5.5);
  pdf.setTextColor(200, 215, 240);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 2, 16);

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text('Formato de remisión de pedidos', margin + 2, 22);

  // Subtítulo
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(180, 200, 230);
  pdf.text('Ecommerce / Marketplace', margin + 2, 26);

  // Número de pedido (lado derecho)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 200, 230);
  pdf.text('PEDIDO', PAGE_WIDTH - margin - 30, 9);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text(String(pedido.pedido), PAGE_WIDTH - margin - 30, 18);

  // Canal y fecha
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 200, 230);
  pdf.text(`Canal: ${pedido.mkp}`, PAGE_WIDTH - margin - 30, 23);
  pdf.text(`Fecha: ${pedido.fecha}`, PAGE_WIDTH - margin - 30, 27);

  currentY = 32;

  // ============ DATOS DEL CLIENTE ============
  // Fondo de sección
  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'F');

  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DATOS DEL CLIENTE', margin + 3, currentY + 5);

  // Datos en columnas
  const colWidth = contentWidth / 3;
  
  // Nombre
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('Nombre', margin + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(pedido.nombre.toUpperCase(), margin + 3, currentY + 13);

  // Cédula
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('C.C.', margin + colWidth + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(String(pedido.cedula), margin + colWidth + 3, currentY + 13);

  // Celular
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('Celular', margin + colWidth * 2 + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(String(pedido.celular), margin + colWidth * 2 + 3, currentY + 13);

  currentY += 19;

  // ============ DETALLE DEL PRODUCTO ============
  const tableX = margin;
  const tableWidth = contentWidth - 40; // Dejar espacio para QR
  const rowHeight = 6;
  
  // Título de sección
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DETALLE DEL PRODUCTO', margin + 3, currentY + 4);
  currentY += 6;

  // Encabezados de tabla
  const cols = [
    { label: 'SKU', width: tableWidth * 0.28 },
    { label: 'PRECIO BASE', width: tableWidth * 0.15 },
    { label: 'COMBO PANEL', width: tableWidth * 0.14 },
    { label: 'GARANTÍA A.I', width: tableWidth * 0.14 },
    { label: 'GARANTÍA TOTAL', width: tableWidth * 0.15 },
    { label: 'TOTAL', width: tableWidth * 0.14 }
  ];

  // Header de tabla
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  
  let colX = tableX;
  cols.forEach(col => {
    pdf.text(col.label, colX + 2, currentY + 4);
    colX += col.width;
  });
  
  currentY += rowHeight;

  // Filas de productos
  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? WHITE : GRAY_LIGHT;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    
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
      pdf.text(values[i], colX + 2, currentY + 4);
      colX += col.width;
    });
    
    currentY += rowHeight;
  });

  // Borde de tabla
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  const tableStartY = currentY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.rect(tableX, tableStartY, tableWidth, currentY - tableStartY);

  // Total destacado
  currentY += 2;
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.roundedRect(tableX + tableWidth - 55, currentY, 55, 8, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text('TOTAL VENTA:', tableX + tableWidth - 53, currentY + 5.5);
  
  pdf.setFontSize(7);
  pdf.text(formatCurrency(pedido.totalVenta), tableX + tableWidth - 30, currentY + 5.5);

  // ============ QR CODE (lado derecho) ============
  const qrSize = 25;
  const qrX = margin + contentWidth - qrSize - 2;
  const qrY = currentY - (pedido.productos.length * rowHeight) - rowHeight - 5;
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    // Si falla el QR, dibujar un placeholder
    pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
    pdf.rect(qrX, qrY, qrSize, qrSize);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
    pdf.text('QR', qrX + 10, qrY + 14);
  }

  currentY += 12;

  // ============ DETALLES DEL PEDIDO ============
  const detailWidth = (contentWidth - 40) / 2;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DETALLES DEL PEDIDO', margin + 3, currentY + 4);
  currentY += 7;

  // Pasarela
  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 5, 12, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('PASARELA', margin + 3, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.text(pedido.pasarela || '-', margin + 3, currentY + 9);

  // Outlet / Combo
  const checkboxX = margin + detailWidth;
  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 5, 12, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('OUTLET', checkboxX + 3, currentY + 4);
  pdf.text('COMBO', checkboxX + detailWidth / 2 - 2, currentY + 4);
  
  // Checkboxes
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(checkboxX + 3, currentY + 6, 3, 3);
  pdf.rect(checkboxX + detailWidth / 2 - 2, currentY + 6, 3, 3);

  // Observaciones del sistema
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('OBSERVACIONES DEL SISTEMA', margin + 3, currentY + 11);

  currentY += 14;

  // ============ DILIGENCIAMIENTO OPERATIVO ============
  const opWidth = contentWidth / 3;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DILIGENCIAMIENTO OPERATIVO', margin + 3, currentY + 4);
  currentY += 7;

  const remainingHeight = PAGE_HEIGHT - currentY - margin;
  const boxHeight = Math.min(remainingHeight, 28);

  // Factura
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('FACTURA', margin + 2, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('N.º __________________________', margin + 2, currentY + 9);

  // Observaciones
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(margin + opWidth, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('OBSERVACIONES', margin + opWidth + 2, currentY + 4);

  // Proceso
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('PROCESO', margin + opWidth * 2 + 2, currentY + 4);

  // Línea inferior decorativa
  pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, PAGE_HEIGHT - 3, PAGE_WIDTH - margin, PAGE_HEIGHT - 3);

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

/**
 * Dibuja una página de pedido en un PDF existente
 */
async function dibujarPaginaPedido(pdf: jsPDF, pedido: Pedido): Promise<void> {
  const margin = 8;
  const contentWidth = PAGE_WIDTH - margin * 2;
  let currentY = margin;

  // ============ ENCABEZADO ============
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 28, 'F');

  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('REFURBI', margin + 2, 10);

  pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  pdf.setLineWidth(0.8);
  pdf.circle(margin + 32, 7.5, 3, 'S');

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5.5);
  pdf.setTextColor(200, 215, 240);
  pdf.text('Estamos convencidos que las segundas oportunidades no son solo para las personas.', margin + 2, 16);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text('Formato de remisión de pedidos', margin + 2, 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(180, 200, 230);
  pdf.text('Ecommerce / Marketplace', margin + 2, 26);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 200, 230);
  pdf.text('PEDIDO', PAGE_WIDTH - margin - 30, 9);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text(String(pedido.pedido), PAGE_WIDTH - margin - 30, 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(180, 200, 230);
  pdf.text(`Canal: ${pedido.mkp}`, PAGE_WIDTH - margin - 30, 23);
  pdf.text(`Fecha: ${pedido.fecha}`, PAGE_WIDTH - margin - 30, 27);

  currentY = 32;

  // ============ DATOS DEL CLIENTE ============
  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(margin, currentY, contentWidth, 16, 1.5, 1.5, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DATOS DEL CLIENTE', margin + 3, currentY + 5);

  const colWidth = contentWidth / 3;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('Nombre', margin + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(pedido.nombre.toUpperCase(), margin + 3, currentY + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('C.C.', margin + colWidth + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(String(pedido.cedula), margin + colWidth + 3, currentY + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('Celular', margin + colWidth * 2 + 3, currentY + 9);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text(String(pedido.celular), margin + colWidth * 2 + 3, currentY + 13);

  currentY += 19;

  // ============ DETALLE DEL PRODUCTO ============
  const tableX = margin;
  const tableWidth = contentWidth - 40;
  const rowHeight = 6;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DETALLE DEL PRODUCTO', margin + 3, currentY + 4);
  currentY += 6;

  const cols = [
    { label: 'SKU', width: tableWidth * 0.28 },
    { label: 'PRECIO BASE', width: tableWidth * 0.15 },
    { label: 'COMBO PANEL', width: tableWidth * 0.14 },
    { label: 'GARANTÍA A.I', width: tableWidth * 0.14 },
    { label: 'GARANTÍA TOTAL', width: tableWidth * 0.15 },
    { label: 'TOTAL', width: tableWidth * 0.14 }
  ];

  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  
  let colX = tableX;
  cols.forEach(col => {
    pdf.text(col.label, colX + 2, currentY + 4);
    colX += col.width;
  });
  
  currentY += rowHeight;

  pedido.productos.forEach((producto, index) => {
    const bgColor = index % 2 === 0 ? WHITE : GRAY_LIGHT;
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(tableX, currentY, tableWidth, rowHeight, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    
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
      pdf.text(values[i], colX + 2, currentY + 4);
      colX += col.width;
    });
    
    currentY += rowHeight;
  });

  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  const tableStartY = currentY - (pedido.productos.length * rowHeight) - rowHeight;
  pdf.rect(tableX, tableStartY, tableWidth, currentY - tableStartY);

  // Total
  currentY += 2;
  pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.roundedRect(tableX + tableWidth - 55, currentY, 55, 8, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.text('TOTAL VENTA:', tableX + tableWidth - 53, currentY + 5.5);
  
  pdf.setFontSize(7);
  pdf.text(formatCurrency(pedido.totalVenta), tableX + tableWidth - 30, currentY + 5.5);

  // QR
  const qrSize = 25;
  const qrX = margin + contentWidth - qrSize - 2;
  const qrY = currentY - (pedido.productos.length * rowHeight) - rowHeight - 5;
  
  try {
    const qrDataUrl = await generarQR(pedido.id);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
    pdf.rect(qrX, qrY, qrSize, qrSize);
  }

  currentY += 12;

  // ============ DETALLES DEL PEDIDO ============
  const detailWidth = (contentWidth - 40) / 2;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DETALLES DEL PEDIDO', margin + 3, currentY + 4);
  currentY += 7;

  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(margin, currentY, detailWidth - 5, 12, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('PASARELA', margin + 3, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.text(pedido.pasarela || '-', margin + 3, currentY + 9);

  const checkboxX = margin + detailWidth;
  pdf.setFillColor(GRAY_LIGHT[0], GRAY_LIGHT[1], GRAY_LIGHT[2]);
  pdf.roundedRect(checkboxX, currentY, detailWidth - 5, 12, 1, 1, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('OUTLET', checkboxX + 3, currentY + 4);
  pdf.text('COMBO', checkboxX + detailWidth / 2 - 2, currentY + 4);
  
  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(checkboxX + 3, currentY + 6, 3, 3);
  pdf.rect(checkboxX + detailWidth / 2 - 2, currentY + 6, 3, 3);

  currentY += 14;

  // ============ DILIGENCIAMIENTO OPERATIVO ============
  const opWidth = contentWidth / 3;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('DILIGENCIAMIENTO OPERATIVO', margin + 3, currentY + 4);
  currentY += 7;

  const remainingHeight = PAGE_HEIGHT - currentY - margin;
  const boxHeight = Math.min(remainingHeight, 28);

  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('FACTURA', margin + 2, currentY + 4);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(GRAY_TEXT[0], GRAY_TEXT[1], GRAY_TEXT[2]);
  pdf.text('N.º __________________________', margin + 2, currentY + 9);

  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(margin + opWidth, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('OBSERVACIONES', margin + opWidth + 2, currentY + 4);

  pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.rect(margin + opWidth * 2, currentY, opWidth - 2, boxHeight);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5);
  pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  pdf.text('PROCESO', margin + opWidth * 2 + 2, currentY + 4);

  // Línea inferior
  pdf.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, PAGE_HEIGHT - 3, PAGE_WIDTH - margin, PAGE_HEIGHT - 3);
}
