// ============================================================
// Tipos de datos para el Generador de Formatos de Pedidos Refurbi
// ============================================================

export interface PedidoRaw {
  Pedido: string | number;
  MKP: string;
  CEDULA: string | number;
  SKU: string;
  DESCRIPCION: string;
  VENTA: string | number;
  BASE: string | number;
  Panel: string | number;
  'Garantia AI': string | number;
  'Garantia TOTAL': string | number;
  'TOTAL VENTA': string | number;
  FECHA: string | number;
  NOMBRE: string;
  Celular: string | number;
  Pasarela: string;
}

export interface Producto {
  sku: string;
  descripcion: string;
  venta: string | number;
  base: string | number;
  panel: string | number;
  garantiaAI: string | number;
  garantiaTotal: string | number;
  totalVenta: string | number;
}

export interface Pedido {
  id: string; // Token único para QR
  pedido: string;
  mkp: string;
  cedula: string;
  productos: Producto[];
  fecha: string;
  nombre: string;
  celular: string;
  pasarela: string;
  totalVenta: string | number;
  fechaGeneracion: string;
}

export interface ValidacionError {
  fila: number;
  pedido: string;
  problema: string;
}

export interface ResultadoValidacion {
  totalRegistros: number;
  validos: Pedido[];
  errores: ValidacionError[];
}

export interface HistorialEntry {
  id?: number;
  pedidoId: string;
  pedido: string;
  fecha: string;
  nombre: string;
  cedula: string;
  celular: string;
  canal: string;
  sku: string;
  total: string | number;
  fechaGeneracion: string;
  p: Pedido; // Datos completos para reimprimir
}
