// ============================================================
// Generador de códigos QR para pedidos
// ============================================================

import QRCode from 'qrcode';

/**
 * Genera un código QR como DataURL (base64 PNG)
 * El QR contiene un token único que identifica el pedido
 */
export async function generarQR(token: string): Promise<string> {
  // El QR contiene la URL/token del pedido para futura integración
  const qrData = `REFURBI-PEDIDO:${token}`;
  
  const dataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: {
      dark: '#1B2B5B',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
  
  return dataUrl;
}

/**
 * Genera un QR como buffer para incluir en jsPDF
 */
export async function generarQRBuffer(token: string): Promise<string> {
  return await generarQR(token);
}
