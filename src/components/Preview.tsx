// ============================================================
// Componente de vista previa - Diseño Refurbi Mejorado
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
        pedidoId: p.id, pedido: p.pedido, fecha: p.fecha, nombre: p.nombre,
        cedula: p.cedula, celular: p.celular, canal: p.mkp,
        sku: p.productos.map(pr => pr.sku).join(', '),
        total: p.totalVenta, fechaGeneracion: new Date().toISOString(),
         p
      }));
      await guardarLoteEnHistorial(entries);
    } catch (err) {
      console.error(err);
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
        zip.file(`${p.pedido}.pdf`, pdf.output('blob'));
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'formatos_individuales_refurbi.zip';
      a.click();
      URL.revokeObjectURL(url);
      const entries = pedidos.map(p => ({
        pedidoId: p.id, pedido: p.pedido, fecha: p.fecha, nombre: p.nombre,
        cedula: p.cedula, celular: p.celular, canal: p.mkp,
        sku: p.productos.map(pr => pr.sku).join(', '),
        total: p.totalVenta, fechaGeneracion: new Date().toISOString(),
         p
      }));
      await guardarLoteEnHistorial(entries);
    } catch (err) {
      console.error(err);
      alert('Error al generar los archivos');
    }
    setIsDownloading(false);
    setDownloadType(null);
  };

  const handleDownloadSingle = async () => {
    try {
      console.log('Iniciando generación de PDF para pedido:', pedido.pedido);
      const pdf = await generarPDFPedido(pedido);
      console.log('PDF generado, guardando...');
      pdf.save(`${pedido.pedido}.pdf`);
      console.log('PDF guardado exitosamente');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert(`Error al generar el PDF: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  if (!pedido) return null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#023047]">
            {pedidos.length} formato{pedidos.length !== 1 ? 's' : ''} generado{pedidos.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-500">Vista previa del pedido #{pedido.pedido}</p>
        </div>
        <button onClick={onReset} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          ← Nuevo archivo
        </button>
      </div>

      {pedidos.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setCurrentPreview(Math.max(0, currentPreview - 1))} disabled={currentPreview === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-600">{currentPreview + 1} de {pedidos.length}</span>
          <button onClick={() => setCurrentPreview(Math.min(pedidos.length - 1, currentPreview + 1))} disabled={currentPreview === pedidos.length - 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-30 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Vista previa del formato */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-100 p-2 flex items-center gap-2 border-b">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-500 ml-2">Pedido #{pedido.pedido}</span>
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-center overflow-auto">
          <div className="bg-white shadow-lg border" style={{ width: '680px', minHeight: '440px' }}>
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-[#023047] to-[#034E71] px-3 py-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Logo 3 círculos */}
                    <div className="flex -space-x-1">
                      <div className="w-2.5 h-2.5 bg-white/80 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-white/80 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-white/80 rounded-full"></div>
                    </div>
                    <p className="text-white font-bold text-xs tracking-wide">REFURBI</p>
                  </div>
                  <p className="text-blue-200 text-[7px] italic leading-tight mb-1">Las segundas oportunidades no son solo para las personas.</p>
                  <p className="text-white font-bold text-[9px]">Formato de remisión de pedidos</p>
                  <p className="text-blue-100 font-bold text-[8px] mt-0.5">{pedido.mkp}  |  {pedido.fecha}</p>
                </div>
                <div className="flex items-start gap-2">
                  {qrImage && (
                    <div className="bg-white rounded p-0.5">
                      <img src={qrImage} alt="QR" className="w-8 h-8" />
                    </div>
                  )}
                  <div className="bg-white/15 rounded-lg px-2 py-1 text-right">
                    <p className="text-blue-200 text-[7px]">PEDIDO</p>
                    <p className="text-white font-bold text-lg leading-tight">{pedido.pedido}</p>
                    {/* Código de barras simulado */}
                    <div className="mt-1 flex gap-px">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="bg-white" style={{ width: '1px', height: '6px' }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout 2x2 con nuevas proporciones */}
            <div className="p-2 space-y-2">
              {/* Fila superior: 30% cliente, 70% producto */}
              <div className="grid gap-2" style={{ gridTemplateColumns: '30% 70%' }}>
              {/* Arriba Izquierda: Datos del Cliente (30%) */}
              <div>
                <div className="bg-blue-50 rounded-t-md px-2 py-0.5 flex items-center gap-1 border-l-2 border-blue-600">
                  <p className="text-blue-700 font-bold text-[9px]">DATOS DEL CLIENTE</p>
                </div>
                <div className="space-y-1 mt-1">
                  <div className="bg-white border border-gray-200 rounded-md p-1.5">
                    <p className="text-gray-400 text-[7px]">NOMBRE</p>
                    <p className="text-slate-800 font-bold text-[9px]">{pedido.nombre.toUpperCase()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="bg-white border border-gray-200 rounded-md p-1.5">
                      <p className="text-gray-400 text-[7px]">C.C.</p>
                      <p className="text-slate-800 font-bold text-[9px]">{pedido.cedula}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-1.5">
                      <p className="text-gray-400 text-[7px]">CELULAR</p>
                      <p className="text-slate-800 font-bold text-[9px]">{pedido.celular}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arriba Derecha: Detalle del Producto */}
              <div>
                <div className="bg-blue-50 rounded-t-md px-2 py-0.5 flex items-center gap-1 border-l-2 border-blue-700">
                  <p className="text-blue-800 font-bold text-[9px]">DETALLE DEL PRODUCTO</p>
                </div>
                <div className="border border-[#023047] rounded-b-md overflow-hidden mt-1">
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#023047] to-[#034E71] text-white">
                        <th className="px-1 py-0.5 text-left font-medium">SKU</th>
                        <th className="px-1 py-0.5 text-right font-medium">BASE</th>
                        <th className="px-1 py-0.5 text-right font-medium">PANEL</th>
                        <th className="px-1 py-0.5 text-right font-medium">G.A.I</th>
                        <th className="px-1 py-0.5 text-right font-medium">G.TOT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.productos.map((prod, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-1 py-0.5 font-mono text-[#023047] font-bold text-[7px]">{prod.sku}</td>
                          <td className="px-1 py-0.5 text-right text-slate-600 text-[7px]">{formatCurrency(prod.base)}</td>
                          <td className="px-1 py-0.5 text-right text-slate-600 text-[7px]">{formatCurrency(prod.panel)}</td>
                          <td className="px-1 py-0.5 text-right text-slate-600 text-[7px]">{formatCurrency(prod.garantiaAI)}</td>
                          <td className="px-1 py-0.5 text-right text-slate-600 text-[7px]">{formatCurrency(prod.garantiaTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-1">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-0.5 rounded">
                    <span className="text-[8px] font-bold">TOTAL </span>
                    <span className="text-[9px] font-bold">{formatCurrency(pedido.totalVenta)}</span>
                  </div>
                </div>
              </div>

              </div>

              {/* Fila inferior: 40% detalles pedido, 60% diligenciamiento */}
              <div className="grid gap-2" style={{ gridTemplateColumns: '40% 60%' }}>
              {/* Abajo Izquierda: Detalles del Pedido (40%) */}
              <div>
                <div className="bg-blue-50 rounded-t-md px-2 py-0.5 flex items-center gap-1 border-l-2 border-blue-700">
                  <p className="text-blue-800 font-bold text-[9px]">DETALLES DEL PEDIDO</p>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div className="bg-white border border-blue-300 rounded-md p-1.5 border-t-2 border-t-blue-700">
                    <p className="text-blue-800 font-bold text-[8px]">PASARELA</p>
                    <p className="text-slate-700 text-[8px] mt-0.5">{pedido.pasarela || '-'}</p>
                  </div>
                  <div className="bg-white border border-blue-300 rounded-md p-1.5 border-t-2 border-t-blue-700 flex gap-2">
                    <div>
                      <p className="text-blue-800 font-bold text-[8px]">OUTLET</p>
                      <div className={`w-3 h-3 border-2 rounded mt-0.5 flex items-center justify-center ${
                        pedido.outlet ? 'border-[#023047] bg-[#023047]' : 'border-blue-700'
                      }`}>
                        {pedido.outlet && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-blue-800 font-bold text-[8px]">COMBO</p>
                      <div className="w-3 h-3 border-2 border-blue-700 rounded mt-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Abajo Derecha: Diligenciamiento Operativo (60%) */}
              <div>
                <div className="bg-blue-50 rounded-t-md px-2 py-0.5 flex items-center gap-1 border-l-2 border-blue-500">
                  <p className="text-blue-600 font-bold text-[9px]">DILIGENCIAMIENTO OPERATIVO</p>
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div className="bg-white border border-blue-300 rounded-md p-1 border-t-2 border-t-blue-500 h-12">
                    <p className="text-blue-600 font-bold text-[8px]">FACTURA</p>
                    <p className="text-[7px] text-blue-700 mt-0.5">N.____________</p>
                  </div>
                  <div className="bg-white border border-blue-300 rounded-md p-1 border-t-2 border-t-blue-500 h-12">
                    <p className="text-blue-600 font-bold text-[8px]">OBSERVACIONES</p>
                  </div>
                  <div className="bg-white border border-blue-300 rounded-md p-1 border-t-2 border-t-blue-500 h-12">
                    <p className="text-blue-600 font-bold text-[8px]">PROCESO</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de descarga */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button onClick={handleDownloadSingle}
          className="px-5 py-2.5 bg-white border-2 border-[#023047] text-[#023047] rounded-xl font-medium hover:bg-blue-50 transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Descargar este PDF
        </button>
        <button onClick={handleDownloadConsolidated} disabled={isDownloading}
          className="px-5 py-2.5 bg-gradient-to-r from-[#023047] to-[#034E71] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
          {isDownloading && downloadType === 'consolidated' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          )}
          Descargar PDF consolidado
        </button>
        <button onClick={handleDownloadIndividual} disabled={isDownloading}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
          {isDownloading && downloadType === 'individual' ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          )}
          Descargar ZIP individuales
        </button>
      </div>
    </div>
  );
}
