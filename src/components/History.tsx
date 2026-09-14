// ============================================================
// Componente de Historial - Búsqueda y reimpresión de pedidos
// ============================================================

import { useState, useEffect } from 'react';
import type { HistorialEntry } from '../types';
import { obtenerHistorial, buscarEnHistorial, eliminarDelHistorial } from '../utils/db';
import { generarPDFPedido } from '../utils/pdfGenerator';

export default function History() {
  const [entries, setEntries] = useState<HistorialEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistorialEntry | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerHistorial();
      setEntries(data);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
    setIsLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      const data = await obtenerHistorial();
      setEntries(data);
      return;
    }
    const results = await buscarEnHistorial(query);
    setEntries(results);
  };

  const handleDownloadPdf = async (entry: HistorialEntry) => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generarPDFPedido(entry.data);
      pdf.save(`${entry.pedido}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF');
    }
    setIsGeneratingPdf(false);
  };

  const handlePrint = async (entry: HistorialEntry) => {
    try {
      const pdf = await generarPDFPedido(entry.data);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error al imprimir:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este registro del historial?')) return;
    await eliminarDelHistorial(id);
    await loadHistory();
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1B2B5B] mb-2">Historial de Pedidos</h2>
        <p className="text-gray-500">Busca, visualiza y reimprime pedidos anteriores</p>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por pedido, nombre, cédula, celular, SKU, canal o fecha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#1B2B5B] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'No se encontraron resultados' : 'No hay pedidos en el historial'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery ? 'Intenta con otro término de búsqueda' : 'Genera formatos desde un archivo Excel para verlos aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl border transition-all ${
                selectedEntry?.id === entry.id
                  ? 'border-[#4A90D9] shadow-md ring-1 ring-[#4A90D9]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1B2B5B] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{entry.pedido.slice(-3)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1B2B5B]">Pedido #{entry.pedido}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{entry.canal}</span>
                    </div>
                    <p className="text-sm text-gray-600">{entry.nombre}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>C.C. {entry.cedula}</span>
                      <span>•</span>
                      <span>{entry.celular}</span>
                      <span>•</span>
                      <span>{entry.sku}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-bold text-[#1B2B5B]">{typeof entry.total === 'number' ? `$${entry.total.toLocaleString('es-CO')}` : entry.total}</p>
                    <p className="text-xs text-gray-400">{entry.fecha}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(entry)}
                      disabled={isGeneratingPdf}
                      className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                      title="Descargar PDF"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePrint(entry)}
                      className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                      title="Imprimir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => entry.id && handleDelete(entry.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalle expandible */}
              {selectedEntry?.id === entry.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Pedido</p>
                      <p className="font-medium text-[#1B2B5B]">#{entry.data.pedido}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Canal</p>
                      <p className="font-medium">{entry.data.mkp}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Cliente</p>
                      <p className="font-medium">{entry.data.nombre}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Cédula</p>
                      <p className="font-medium">{entry.data.cedula}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Celular</p>
                      <p className="font-medium">{entry.data.celular}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Pasarela</p>
                      <p className="font-medium">{entry.data.pasarela}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Fecha</p>
                      <p className="font-medium">{entry.data.fecha}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Generado</p>
                      <p className="font-medium">{new Date(entry.data.fechaGeneracion).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-gray-500 text-xs mb-1">Productos:</p>
                    {entry.data.productos.map((prod, i) => (
                      <p key={i} className="text-xs font-mono text-gray-600">{prod.sku}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {!isLoading && entries.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          {entries.length} registro{entries.length !== 1 ? 's' : ''} encontrado{entries.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
