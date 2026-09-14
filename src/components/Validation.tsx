// ============================================================
// Componente de validación - Diseño moderno
// ============================================================

import type { ResultadoValidacion } from '../types';

interface ValidationProps {
  resultado: ResultadoValidacion;
  onGenerate: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export default function Validation({ resultado, onGenerate, onReset, isGenerating }: ValidationProps) {
  const { totalRegistros, validos, errores } = resultado;
  const tieneValidos = validos.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Resumen */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#2563EB] px-6 py-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 right-20 w-20 h-20 bg-white/5 rounded-full"></div>
          <h2 className="text-white font-bold text-lg relative z-10">📊 Resultado del análisis</h2>
          <p className="text-blue-200 text-xs relative z-10">Tu archivo ha sido procesado correctamente</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200/50 shadow-sm">
              <p className="text-3xl font-bold text-blue-700">{totalRegistros}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Registros encontrados</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 text-center border border-emerald-200/50 shadow-sm">
              <p className="text-3xl font-bold text-emerald-700">{validos.length}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Pedidos válidos</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-4 text-center border border-red-200/50 shadow-sm">
              <p className="text-3xl font-bold text-red-600">{errores.length}</p>
              <p className="text-xs text-red-500 mt-1 font-medium">Con errores</p>
            </div>
          </div>

          {/* Errores */}
          {errores.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Registros con errores:
              </h3>
              <div className="max-h-40 overflow-y-auto border border-red-100 rounded-xl bg-red-50/50">
                <table className="w-full text-sm">
                  <thead className="bg-red-100/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-red-800 text-xs font-semibold">Pedido</th>
                      <th className="px-3 py-2 text-left text-red-800 text-xs font-semibold">Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errores.map((error, i) => (
                      <tr key={i} className="border-t border-red-100/50">
                        <td className="px-3 py-2 font-mono text-gray-700 text-xs">{error.pedido}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{error.problema}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {tieneValidos && errores.length === 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">¡Todo listo!</p>
                <p className="text-xs text-emerald-600">Todos los registros son válidos. Puedes generar los formatos.</p>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              ← Cargar otro archivo
            </button>
            {tieneValidos && (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando formatos...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ✨ Generar {validos.length} formato{validos.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
