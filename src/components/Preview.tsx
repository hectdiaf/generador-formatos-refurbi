// ============================================================
// Componente de vista previa - Muestra el primer pedido generado
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
      
      // Guardar en historial
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
      
      // Guardar en historial
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
          <h2 className="text-2xl font-bold text-[#1B2B5B]">
            {pedidos.length} formato{pedidos.length !== 1 ? 's' : ''} generado{pedidos.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-gray-500">Vista previa del pedido #{pedido.pedido}</p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Nuevo archivo
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
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-100 p-2 flex items-center justify-center gap-2 border-b">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-500 ml-2">Pedido #{pedido.pedido} - Vista previa</span>
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-center overflow-auto">
          <div className="bg-white shadow-lg border" style={{ width: '680px', minHeight: '440px' }}>
            {/* Encabezado */}
            <div className="bg-[#1B2B5B] px-4 py-3 relative">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-xl tracking-wide">REFURBI</span>
                <div className="w-5 h-5 border-2 border-[#4A90D9] rounded-full flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-[#4A90D9] rounded"></div>
                </div>
              </div>
              <p className="text-blue-200 text-[10px] italic mt-0.5">
                Estamos convencidos que las segundas oportunidades no son solo para las personas.
              </p>
              <div className="flex justify-between items-end mt-1">
                <div>
                  <p className="text-white font-bold text-sm">Formato de remisión de pedidos</p>
                  <p className="text-blue-300 text-xs">Ecommerce / Marketplace</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-300 text-[10px]">PEDIDO</p>
                  <p className="text-white font-bold text-2xl">{pedido.pedido}</p>
                </div>
              </div>
              <div className="absolute top-2 right-4 text-blue-300 text-[10px]">
                <p>Canal: {pedido.mkp}</p>
                <p>Fecha: {pedido.fecha}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="bg-gray-50 mx-3 mt-3 rounded-lg p-3">
              <p className="text-[#1B2B5B] font-bold text-xs mb-2">DATOS DEL CLIENTE</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-[10px]">Nombre</p>
                  <p className="text-[#1B2B5B] font-bold text-xs">{pedido.nombre.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">C.C.</p>
                  <p className="text-[#1B2B5B] font-bold text-xs">{pedido.cedula}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Celular</p>
                  <p className="text-[#1B2B5B] font-bold text-xs">{pedido.celular}</p>
                </div>
              </div>
            </div>

            {/* Detalle del producto */}
            <div className="mx-3 mt-3">
              <p className="text-[#1B2B5B] font-bold text-xs mb-1.5">DETALLE DEL PRODUCTO</p>
              <div className="border border-[#1B2B5B] rounded overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#1B2B5B] text-white">
                      <th className="px-2 py-1.5 text-left font-medium">SKU</th>
                      <th className="px-2 py-1.5 text-left font-medium">PRECIO BASE</th>
                      <th className="px-2 py-1.5 text-left font-medium">COMBO PANEL</th>
                      <th className="px-2 py-1.5 text-left font-medium">GARANTÍA A.I</th>
                      <th className="px-2 py-1.5 text-left font-medium">GARANTÍA TOTAL</th>
                      <th className="px-2 py-1.5 text-left font-medium">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.productos.map((prod, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1.5 font-mono text-[#1B2B5B]">{prod.sku}</td>
                        <td className="px-2 py-1.5">{formatCurrency(prod.base)}</td>
                        <td className="px-2 py-1.5">{formatCurrency(prod.panel)}</td>
                        <td className="px-2 py-1.5">{formatCurrency(prod.garantiaAI)}</td>
                        <td className="px-2 py-1.5">{formatCurrency(prod.garantiaTotal)}</td>
                        <td className="px-2 py-1.5 font-medium">{formatCurrency(prod.totalVenta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total */}
              <div className="flex justify-end mt-2">
                <div className="bg-[#1B2B5B] text-white px-4 py-1.5 rounded-lg flex items-center gap-3">
                  <span className="text-xs font-bold">TOTAL VENTA:</span>
                  <span className="text-sm font-bold">{formatCurrency(pedido.totalVenta)}</span>
                </div>
              </div>
            </div>

            {/* Detalles del pedido + QR */}
            <div className="mx-3 mt-3 flex gap-3">
              <div className="flex-1">
                <p className="text-[#1B2B5B] font-bold text-xs mb-1.5">DETALLES DEL PEDIDO</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-[#1B2B5B] font-bold text-[10px]">PASARELA</p>
                    <p className="text-xs text-gray-700">{pedido.pasarela || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 flex gap-4">
                    <div>
                      <p className="text-[#1B2B5B] font-bold text-[10px]">OUTLET</p>
                      <div className="w-3 h-3 border border-[#1B2B5B] mt-0.5"></div>
                    </div>
                    <div>
                      <p className="text-[#1B2B5B] font-bold text-[10px]">COMBO</p>
                      <div className="w-3 h-3 border border-[#1B2B5B] mt-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
              {qrImage && (
                <div className="w-16 h-16 flex-shrink-0">
                  <img src={qrImage} alt="QR" className="w-full h-full" />
                </div>
              )}
            </div>

            {/* Diligenciamiento operativo */}
            <div className="mx-3 mt-3 mb-3">
              <p className="text-[#1B2B5B] font-bold text-xs mb-1.5">DILIGENCIAMIENTO OPERATIVO</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-[#1B2B5B] rounded p-2 h-16">
                  <p className="text-[#1B2B5B] font-bold text-[10px]">FACTURA</p>
                  <p className="text-[9px] text-gray-400 mt-1">N.º __________________</p>
                </div>
                <div className="border border-[#1B2B5B] rounded p-2 h-16">
                  <p className="text-[#1B2B5B] font-bold text-[10px]">OBSERVACIONES</p>
                </div>
                <div className="border border-[#1B2B5B] rounded p-2 h-16">
                  <p className="text-[#1B2B5B] font-bold text-[10px]">PROCESO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de descarga */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={handleDownloadSingle}
          className="px-5 py-2.5 bg-white border-2 border-[#1B2B5B] text-[#1B2B5B] rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar este PDF
        </button>
        
        <button
          onClick={handleDownloadConsolidated}
          disabled={isDownloading}
          className="px-5 py-2.5 bg-[#1B2B5B] text-white rounded-lg font-medium hover:bg-[#2a3d7a] transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
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
          className="px-5 py-2.5 bg-[#4A90D9] text-white rounded-lg font-medium hover:bg-[#3a7bc8] transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
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
