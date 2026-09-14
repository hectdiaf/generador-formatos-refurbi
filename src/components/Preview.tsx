// ============================================================
// Componente de vista previa - Muestra el primer pedido generado
// Diseño moderno y visualmente atractivo
// ============================================================

import { useState, useEffect } from 'react';
import type { Pedido } from '../types';
import { generarPDFPedido, generarPDFConsolidado } from '../utils/pdfGenerator';
import { generarQR } from '../utils/qrGenerator';
import JSZip from 'jszip';
import { guardarLoteEnHistorial } from '../utils/db';

interface PreviewProps {
  pedidos: Pedido[];
  onReset: () => void;
}

function formatCurrency(value: string | number): string {
  if (!value && value !== 0) return '-';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Preview({ pedidos, onReset }: PreviewProps) {
  const [currentPreview, setCurrentPreview] = useState(0);
  const [qrImage, setQrImage] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<'consolidated' | 'individual' | null>(null);

  const pedido = pedidos[currentPreview];

  useEffect(() => {
    if (pedido) {
      generarQR(pedido.id).then(setQrImage).catch(() => setQrImage(''));
    }
  }, [pedido]);

  const handleDownloadConsolidated = async () => {
    setIsDownloading(true);
    setDownloadType('consolidated');
    try {
      const pdf = await generarPDFConsolidado(pedidos);
      pdf.save(`formatos_pedidos_refurbi.pdf`);
      
      const entries = pedidos.map(p => ({
        pedidoId: p.id,
        pedido: p.pedido,
        fecha: p.fecha,
        nombre: p.nombre,
        cedula: p.cedula,
        celular: p.celular,
        canal: p.mkp,
        sku: p.productos.map(pr => pr.sku).join(', '),
        total: p.totalVenta,
        fechaGeneracion: new Date().toISOString(),
        data: p
      }));
      await guardarLoteEnHistorial(entries);
    } catch (err) {
      console.error('Error al generar PDF consolidado:', err);
      alert('Error al generar el PDF consolidado');
    }
    setIsDownloading(false);
    setDownloadType(null);
  };

  const handleDownloadIndividual = async () => {
    setIsDownloading(true);
    setDownloadType('individual');
    try {
      const zip = new JSZip();
      
      for (const p of pedidos) {
        const pdf = await generarPDFPedido(p);
        const pdfBlob = pdf.output('blob');
        zip.file(`${p.pedido}.pdf`, pdfBlob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatos_individuales_refurbi.zip';
      a.click();
      URL.revokeObjectURL(url);
      
      const entries = pedidos.map(p => ({
        pedidoId: p.id,
        pedido: p.pedido,
        fecha: p.fecha,
        nombre: p.nombre,
        cedula: p.cedula,
        celular: p.celular,
        canal: p.mkp,
        sku: p.productos.map(pr => pr.sku).join(', '),
        total: p.totalVenta,
        fechaGeneracion: new Date().toISOString(),
        data: p
      }));
      await guardarLoteEnHistorial(entries);
    } catch (err) {
      console.error('Error al generar ZIP:', err);
      alert('Error al generar los archivos individuales');
    }
    setIsDownloading(false);
    setDownloadType(null);
  };

  const handleDownloadSingle = async () => {
    try {
      const pdf = await generarPDFPedido(pedido);
      pdf.save(`${pedido.pedido}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  if (!pedido) return null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E40AF]">
            ✨ {pedidos.length} formato{pedidos.length !== 1 ? 's' : ''} generado{pedidos.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-500">Vista previa del pedido #{pedido.pedido}</p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Nuevo archivo
        </button>
      </div>

      {/* Navegación de pedidos */}
      {pedidos.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentPreview(Math.max(0, currentPreview - 1))}
            disabled={currentPreview === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
            {currentPreview + 1} de {pedidos.length}
          </span>
          <button
            onClick={() => setCurrentPreview(Math.min(pedidos.length - 1, currentPreview + 1))}
            disabled={currentPreview === pedidos.length - 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Vista previa del formato */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-2 flex items-center justify-center gap-2 border-b">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-500 ml-2">Pedido #{pedido.pedido} — Vista previa</span>
        </div>
        
        <div className="p-4 bg-[#fafcff] flex justify-center overflow-auto">
          <div className="bg-white shadow-xl border border-gray-200 rounded-lg overflow-hidden" style={{ width: '680px', minHeight: '440px' }}>
            {/* Encabezado con gradiente */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 overflow-hidden">
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 right-20 w-16 h-16 bg-white/5 rounded-full translate-y-1/2"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2">
                  {/* Logo */}
                  <div className="bg-white rounded-md px-2 py-1">
                    <span className="text-blue-600 font-bold text-sm">REFURBI</span>
                  </div>
                  <div className="w-4 h-4 border-2 border-emerald-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-emerald-400 rounded"></div>
                  </div>
                </div>
                
                {/* Número de pedido */}
                <div className="bg-white/15 rounded-lg px-4 py-1.5 text-right">
                  <p className="text-blue-200 text-[10px]">PEDIDO N.°</p>
                  <p className="text-white font-bold text-2xl leading-tight">{pedido.pedido}</p>
                </div>
              </div>
              
              <p className="text-blue-200 text-[10px] italic mt-1 relative z-10">
                Estamos convencidos que las segundas oportunidades no son solo para las personas.
              </p>
              
              <div className="flex justify-between items-end mt-1 relative z-10">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm">Formato de remisión de pedidos</p>
                  <span className="bg-white text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-medium">Ecommerce / Marketplace</span>
                </div>
                <div className="text-right text-blue-200 text-[10px]">
                  <p>Canal: {pedido.mkp}</p>
                  <p>Fecha: {pedido.fecha}</p>
                </div>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="mx-3 mt-3 bg-white border border-blue-100 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
                <p className="text-blue-600 font-bold text-xs">DATOS DEL CLIENTE</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-md p-2">
                  <p className="text-slate-400 text-[9px] font-medium">NOMBRE</p>
                  <p className="text-slate-800 font-bold text-xs mt-0.5">{pedido.nombre.toUpperCase()}</p>
                </div>
                <div className="bg-blue-50 rounded-md p-2">
                  <p className="text-slate-400 text-[9px] font-medium">C.C.</p>
                  <p className="text-slate-800 font-bold text-xs mt-0.5">{pedido.cedula}</p>
                </div>
                <div className="bg-blue-50 rounded-md p-2">
                  <p className="text-slate-400 text-[9px] font-medium">CELULAR</p>
                  <p className="text-slate-800 font-bold text-xs mt-0.5">{pedido.celular}</p>
                </div>
              </div>
            </div>

            {/* Detalle del producto */}
            <div className="mx-3 mt-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center">
                  <span className="text-sm">📦</span>
                </div>
                <p className="text-orange-500 font-bold text-xs">DETALLE DEL PRODUCTO</p>
              </div>
              <div className="border border-blue-100 rounded-lg overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="px-2 py-1.5 text-left font-medium">SKU</th>
                      <th className="px-2 py-1.5 text-right font-medium">PRECIO BASE</th>
                      <th className="px-2 py-1.5 text-right font-medium">PANEL</th>
                      <th className="px-2 py-1.5 text-right font-medium">GAR. A.I</th>
                      <th className="px-2 py-1.5 text-right font-medium">GAR. TOTAL</th>
                      <th className="px-2 py-1.5 text-right font-medium">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.productos.map((prod, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-2 py-1.5 font-mono text-blue-700 font-medium">{prod.sku}</td>
                        <td className="px-2 py-1.5 text-right text-slate-600">{formatCurrency(prod.base)}</td>
                        <td className="px-2 py-1.5 text-right text-slate-600">{formatCurrency(prod.panel)}</td>
                        <td className="px-2 py-1.5 text-right text-slate-600">{formatCurrency(prod.garantiaAI)}</td>
                        <td className="px-2 py-1.5 text-right text-slate-600">{formatCurrency(prod.garantiaTotal)}</td>
                        <td className="px-2 py-1.5 text-right font-medium text-slate-800">{formatCurrency(prod.totalVenta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total */}
              <div className="flex justify-end mt-2">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1.5 rounded-lg flex items-center gap-3 shadow-md">
                  <span className="text-xs font-bold">TOTAL VENTA</span>
                  <span className="text-sm font-bold">{formatCurrency(pedido.totalVenta)}</span>
                </div>
              </div>
            </div>

            {/* Detalles del pedido + QR */}
            <div className="mx-3 mt-3 flex gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 bg-purple-50 rounded-full flex items-center justify-center">
                    <span className="text-sm">📋</span>
                  </div>
                  <p className="text-purple-600 font-bold text-xs">DETALLES DEL PEDIDO</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-purple-100 rounded-lg p-2 shadow-sm">
                    <p className="text-purple-600 font-bold text-[10px]">PASARELA</p>
                    <p className="text-xs text-slate-700 mt-0.5">{pedido.pasarela || '-'}</p>
                  </div>
                  <div className="bg-white border border-purple-100 rounded-lg p-2 shadow-sm flex gap-4">
                    <div>
                      <p className="text-purple-600 font-bold text-[10px]">OUTLET</p>
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded mt-0.5"></div>
                    </div>
                    <div>
                      <p className="text-purple-600 font-bold text-[10px]">COMBO</p>
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded mt-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
              {qrImage && (
                <div className="flex-shrink-0">
                  <div className="bg-white border border-blue-100 rounded-lg p-1.5 shadow-sm">
                    <img src={qrImage} alt="QR" className="w-16 h-16" />
                    <p className="text-blue-600 text-[8px] font-bold text-center mt-0.5">#{pedido.pedido}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Diligenciamiento operativo */}
            <div className="mx-3 mt-3 mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center">
                  <span className="text-sm">✏️</span>
                </div>
                <p className="text-emerald-600 font-bold text-xs">DILIGENCIAMIENTO OPERATIVO</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-emerald-100 rounded-lg p-2 h-16 shadow-sm">
                  <p className="text-emerald-600 font-bold text-[10px]">FACTURA</p>
                  <p className="text-[9px] text-gray-300 mt-1">N.º __________________</p>
                  <div className="mt-2 space-y-1">
                    <div className="h-px bg-gray-100"></div>
                    <div className="h-px bg-gray-100"></div>
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-2 h-16 shadow-sm">
                  <p className="text-emerald-600 font-bold text-[10px]">OBSERVACIONES</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-px bg-gray-100"></div>
                    <div className="h-px bg-gray-100"></div>
                    <div className="h-px bg-gray-100"></div>
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-2 h-16 shadow-sm">
                  <p className="text-emerald-600 font-bold text-[10px]">PROCESO</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-px bg-gray-100"></div>
                    <div className="h-px bg-gray-100"></div>
                    <div className="h-px bg-gray-100"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer decorativo */}
            <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
            <div className="px-3 py-1 flex justify-between items-center">
              <p className="text-[8px] text-gray-400 italic">Refurbi — Dando segundas oportunidades</p>
              <p className="text-[8px] text-gray-400">Generado: {new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de descarga */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownloadSingle}
          className="px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar este PDF
        </button>
        
        <button
          onClick={handleDownloadConsolidated}
          disabled={isDownloading}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isDownloading && downloadType === 'consolidated' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
          Descargar PDF consolidado
        </button>

        <button
          onClick={handleDownloadIndividual}
          disabled={isDownloading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isDownloading && downloadType === 'individual' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Descargar ZIP individuales
        </button>
      </div>
    </div>
  );
}
