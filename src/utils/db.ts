// ============================================================
// Base de datos IndexedDB con Dexie para persistencia del historial
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { HistorialEntry } from '../types';

export class RefurbiDB extends Dexie {
  historial!: Table<HistorialEntry, number>;

  constructor() {
    super('RefurbiDB');
    this.version(1).stores({
      historial: '++id, pedido, nombre, cedula, celular, canal, sku, fechaGeneracion'
    });
  }
}

export const db = new RefurbiDB();

// Funciones de acceso a datos
export async function guardarEnHistorial(entry: Omit<HistorialEntry, 'id'>): Promise<number> {
  return await db.historial.add(entry);
}

export async function guardarLoteEnHistorial(entries: Omit<HistorialEntry, 'id'>[]): Promise<void> {
  await db.historial.bulkAdd(entries);
}

export async function obtenerHistorial(): Promise<HistorialEntry[]> {
  return await db.historial.orderBy('fechaGeneracion').reverse().toArray();
}

export async function buscarEnHistorial(query: string): Promise<HistorialEntry[]> {
  const q = query.toLowerCase().trim();
  if (!q) return await obtenerHistorial();
  
  const all = await db.historial.toArray();
  return all.filter(entry => 
    entry.pedido.toLowerCase().includes(q) ||
    entry.nombre.toLowerCase().includes(q) ||
    entry.cedula.toLowerCase().includes(q) ||
    entry.celular.toLowerCase().includes(q) ||
    entry.sku.toLowerCase().includes(q) ||
    entry.canal.toLowerCase().includes(q) ||
    entry.fecha.toLowerCase().includes(q)
  );
}

export async function obtenerPedidoPorId(pedidoId: string): Promise<HistorialEntry | undefined> {
  return await db.historial.where('pedidoId').equals(pedidoId).first();
}

export async function obtenerPedidoPorNumero(pedido: string): Promise<HistorialEntry | undefined> {
  return await db.historial.where('pedido').equals(pedido).first();
}

export async function eliminarDelHistorial(id: number): Promise<void> {
  await db.historial.delete(id);
}
