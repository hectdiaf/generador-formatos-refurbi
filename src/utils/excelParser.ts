// ============================================================
// Parser de archivo Excel - Lee y valida datos de pedidos
// ============================================================

import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Pedido, PedidoRaw, Producto, ResultadoValidacion, ValidacionError } from '../types';

const COLUMNAS_REQUERIDAS = [
  'Pedido',
  'NOMBRE',
  'CEDULA',
  'SKU',
  'FECHA',
  'TOTAL VENTA'
];

function limpiarValor(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  return String(valor).trim();
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

function formatearFecha(fecha: string | number): string {
  if (!fecha) return '';
  
  // Si es un número serial de Excel
  if (typeof fecha === 'number') {
    const date = XLSX.SSF.parse_date_code(fecha);
    if (date) {
      return `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
    }
  }
  
  const str = String(fecha).trim();
  
  // Intentar parsear como fecha
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return str;
}

export function parsearExcel(buffer: ArrayBuffer): ResultadoValidacion {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  // Tomar la primera hoja
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  
  if (rawData.length === 0) {
    return {
      totalRegistros: 0,
      validos: [],
      errores: [{ fila: 0, pedido: '-', problema: 'El archivo no contiene datos' }]
    };
  }
  
  // Validar columnas requeridas
  const headers = Object.keys(rawData[0]);
  const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(col => !headers.includes(col));
  
  if (columnasFaltantes.length > 0) {
    return {
      totalRegistros: rawData.length,
      validos: [],
      errores: [{
        fila: 0,
        pedido: '-',
        problema: `Columnas faltantes: ${columnasFaltantes.join(', ')}`
      }]
    };
  }
  
  const errores: ValidacionError[] = [];
  const pedidosMap = new Map<string, Pedido>();
  
  rawData.forEach((row, index) => {
    const fila = index + 2; // +2 porque la fila 1 es el encabezado
    const raw = row as unknown as PedidoRaw;
    
    const pedidoNum = limpiarValor(raw.Pedido);
    const nombre = limpiarValor(raw.NOMBRE);
    const cedula = limpiarValor(raw.CEDULA);
    const sku = limpiarValor(raw.SKU);
    const fecha = formatearFecha(raw.FECHA);
    const totalVenta = limpiarValor(raw['TOTAL VENTA']);
    
    // Validaciones
    const erroresFila: string[] = [];
    
    if (!pedidoNum) erroresFila.push('Falta número de pedido');
    if (!nombre) erroresFila.push('Falta nombre del cliente');
    if (!cedula) erroresFila.push('Falta cédula');
    if (!sku) erroresFila.push('Falta SKU');
    if (!fecha) erroresFila.push('Falta fecha');
    if (!totalVenta) erroresFila.push('Falta total de venta');
    
    if (erroresFila.length > 0) {
      errores.push({
        fila,
        pedido: pedidoNum || `Fila ${fila}`,
        problema: erroresFila.join(', ')
      });
      return; // Saltar esta fila
    }
    
    // Crear producto
    const producto: Producto = {
      sku,
      descripcion: limpiarValor(raw.DESCRIPCION),
      venta: raw.VENTA ?? '',
      base: raw.BASE ?? '',
      panel: raw.Panel ?? '',
      garantiaAI: raw['Garantia AI'] ?? '',
      garantiaTotal: raw['Garantia TOTAL'] ?? '',
      totalVenta: raw['TOTAL VENTA'] ?? ''
    };
    
    // Agrupar por número de pedido
    if (pedidosMap.has(pedidoNum)) {
      // Agregar producto al pedido existente
      const pedidoExistente = pedidosMap.get(pedidoNum)!;
      pedidoExistente.productos.push(producto);
      
      // Sumar el total de venta del nuevo producto
      const nuevoTotal = parseNumber(pedidoExistente.totalVenta) + parseNumber(producto.totalVenta);
      pedidoExistente.totalVenta = nuevoTotal;
    } else {
      // Crear nuevo pedido
      const pedido: Pedido = {
        id: uuidv4(),
        pedido: pedidoNum,
        mkp: limpiarValor(raw.MKP),
        cedula,
        productos: [producto],
        fecha,
        nombre,
        celular: limpiarValor(raw.Celular),
        pasarela: limpiarValor(raw.Pasarela),
        totalVenta,
        fechaGeneracion: new Date().toISOString()
      };
      pedidosMap.set(pedidoNum, pedido);
    }
  });
  
  return {
    totalRegistros: rawData.length,
    validos: Array.from(pedidosMap.values()),
    errores
  };
}
