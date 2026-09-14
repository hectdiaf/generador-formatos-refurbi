// ============================================================
// Componente de validación - Muestra resultados del análisis
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
  const tieneErrores = errores.length > 0;
  const tieneValidos = validos.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Resumen */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-[#1B2B5B] px-6 py-4">
          <h2 className="text-white font-bold text-lg">Resultado del análisis</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#1B2B5B]">{totalRegistros}</p>
              <p className="text-sm text-gray-600 mt-1">Registros encontrados</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{validos.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pedidos válidos</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{errores.length}</p>
              <p className="text-sm text-gray-600 mt-1">Con errores</p>
            </div>
          </div>

          {/* Errores */}
          {tieneErrores && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registros con errores:
              </h3>
              <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-red-800">Pedido</th>
                      <th className="px-3 py-2 text-left text-red-800">Problema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errores.map((error, i) => (
                      <tr key={i} className="border-t border-red-100">
                        <td className="px-3 py-2 font-mono text-gray-700">{error.pedido}</td>
                        <td className="px-3 py-2 text-gray-600">{error.problema}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cargar otro archivo
            </button>
            {tieneValidos && (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex-1 px-5 py-2.5 bg-[#1B2B5B] text-white rounded-lg font-medium hover:bg-[#2a3d7a] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando formatos...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generar {validos.length} formato{validos.length !== 1 ? 's' : ''}
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
