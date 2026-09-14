// ============================================================
// Generador de código de barras Code 128
// ============================================================

import JsBarcode from 'jsbarcode';

/**
 * Genera un código de barras Code 128 como DataURL
 */
export async function generarCodigoBarras(texto: string): Promise<string> {
  // Crear un canvas temporal
  const canvas = document.createElement('canvas');
  
  try {
    JsBarcode(canvas, texto, {
      format: 'CODE128',
      width: 1.5,
      height: 30,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#023047'
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error al generar código de barras:', error);
    return '';
  }
}
