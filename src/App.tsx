// ============================================================
// App.tsx - Generador de Formatos de Pedidos Refurbi
// Diseño moderno, visual y profesional
// ============================================================

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Validation from './components/Validation';
import Preview from './components/Preview';
import History from './components/History';
import { parsearExcel } from './utils/excelParser';
import type { Pedido, ResultadoValidacion } from './types';

type AppView = 'upload' | 'validation' | 'preview' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [activeTab, setActiveTab] = useState<'generar' | 'historial'>('generar');

  const handleFileLoaded = (buffer: ArrayBuffer, _fileName: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        const result = parsearExcel(buffer);
        setResultado(result);
        setCurrentView('validation');
      } catch (err) {
        console.error('Error al procesar el archivo:', err);
        alert('Error al procesar el archivo. Verifica que sea un archivo Excel válido.');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleGenerate = () => {
    if (!resultado) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      setPedidos(resultado.validos);
      setCurrentView('preview');
      setIsGenerating(false);
    }, 300);
  };

  const handleReset = () => {
    setCurrentView('upload');
    setResultado(null);
    setPedidos([]);
  };

  const switchTab = (tab: 'generar' | 'historial') => {
    setActiveTab(tab);
    if (tab === 'historial') {
      setCurrentView('history');
    } else {
      if (pedidos.length > 0) {
        setCurrentView('preview');
      } else if (resultado) {
        setCurrentView('validation');
      } else {
        setCurrentView('upload');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Patrón de fondo decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-200 rounded-full opacity-15 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] shadow-xl">
        {/* Elementos decorativos del header */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 right-1/4 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute top-0 left-1/3 w-20 h-20 bg-white/5 rounded-full"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-[#2563EB] font-bold text-xl">R</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl tracking-wide">REFURBI</h1>
                  <p className="text-blue-200 text-[10px] leading-tight">Generador de Formatos</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <nav className="flex gap-1 bg-white/10 rounded-xl p-1 backdrop-blur-sm">
              <button
                onClick={() => switchTab('generar')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'generar'
                    ? 'bg-white text-[#2563EB] shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar
                </span>
              </button>
              <button
                onClick={() => switchTab('historial')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'historial'
                    ? 'bg-white text-[#2563EB] shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Historial
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'generar' && (
          <>
            {/* Breadcrumb de pasos */}
            {currentView !== 'upload' && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <StepIndicator step={1} label="Cargar" active={false} completed={true} />
                <StepConnector completed={currentView === 'validation' || currentView === 'preview'} />
                <StepIndicator step={2} label="Validar" active={currentView === 'validation'} completed={currentView === 'preview'} />
                <StepConnector completed={currentView === 'preview'} />
                <StepIndicator step={3} label="Generar" active={currentView === 'preview'} completed={false} />
              </div>
            )}

            {/* Vistas */}
            {currentView === 'upload' && (
              <div className="py-8">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Sistema activo
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-[#1E40AF] to-[#2563EB] bg-clip-text text-transparent mb-3">
                    Generador de Formatos
                  </h2>
                  <p className="text-gray-500 text-lg max-w-md mx-auto">
                    Carga tu archivo Excel para generar formatos de remisión de pedidos profesionales
                  </p>
                </div>
                <FileUpload onFileLoaded={handleFileLoaded} isLoading={isLoading} />
                
                {/* Features */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-lg">📄</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Formato PDF</h3>
                    <p className="text-xs text-gray-500 mt-1">Media carta horizontal, diseño profesional</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-lg">📱</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Código QR</h3>
                    <p className="text-xs text-gray-500 mt-1">Identificador único por pedido</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-lg">💾</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Historial</h3>
                    <p className="text-xs text-gray-500 mt-1">Persistencia y búsqueda de pedidos</p>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'validation' && resultado && (
              <Validation
                resultado={resultado}
                onGenerate={handleGenerate}
                onReset={handleReset}
                isGenerating={isGenerating}
              />
            )}

            {currentView === 'preview' && pedidos.length > 0 && (
              <Preview pedidos={pedidos} onReset={handleReset} />
            )}
          </>
        )}

        {activeTab === 'historial' && <History />}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/50 bg-white/30 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Refurbi — Generador de Formatos de Pedidos
          </p>
          <p className="text-xs text-gray-400 italic">
            "Las segundas oportunidades no son solo para las personas."
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componente de indicador de paso
function StepIndicator({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm
        ${active ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-110 shadow-blue-200 shadow-md' : ''}
        ${completed ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200 shadow-md' : ''}
        ${!active && !completed ? 'bg-white text-gray-400 border border-gray-200' : ''}
      `}>
        {completed ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : step}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-blue-700' : completed ? 'text-emerald-600' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`w-10 h-1 rounded-full transition-all ${completed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gray-200'}`}></div>
  );
}

export default App;
