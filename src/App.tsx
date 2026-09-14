// ============================================================
// App.tsx - Generador de Formatos de Pedidos Refurbi
// Componente principal con navegación entre Generar e Historial
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
    
    // Simular un pequeño delay para feedback visual
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-[#1B2B5B] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-[#1B2B5B] font-bold text-lg">R</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl tracking-wide">REFURBI</h1>
                  <p className="text-blue-300 text-[10px] leading-tight">Generador de Formatos</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <nav className="flex gap-1">
              <button
                onClick={() => switchTab('generar')}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'generar'
                    ? 'bg-white text-[#1B2B5B] shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
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
                    ? 'bg-white text-[#1B2B5B] shadow-md'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
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
      <main className="max-w-6xl mx-auto px-4 py-8">
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
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-[#1B2B5B] mb-2">
                    Generador de Formatos
                  </h2>
                  <p className="text-gray-500">
                    Carga tu archivo Excel para generar los formatos de remisión de pedidos
                  </p>
                </div>
                <FileUpload onFileLoaded={handleFileLoaded} isLoading={isLoading} />
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
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
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
        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${active ? 'bg-[#1B2B5B] text-white scale-110' : ''}
        ${completed ? 'bg-green-500 text-white' : ''}
        ${!active && !completed ? 'bg-gray-200 text-gray-500' : ''}
      `}>
        {completed ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : step}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-[#1B2B5B]' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div className={`w-8 h-0.5 rounded ${completed ? 'bg-green-500' : 'bg-gray-200'}`}></div>
  );
}

export default App;
