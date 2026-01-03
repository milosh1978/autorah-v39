import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Theme configurations
const THEMES = {
  light: {
    background: [255, 255, 255],
    text: [0, 0, 0],
    secondaryText: [100, 100, 100],
    accent: [0, 51, 102], // Deep Blue
    headerBg: [240, 240, 240],
    lineColor: [200, 200, 200]
  },
  dark: {
    background: [20, 20, 20], // Dark Gray/Black
    text: [255, 255, 255],
    secondaryText: [200, 200, 200],
    accent: [0, 153, 255], // Bright Blue
    headerBg: [40, 40, 40],
    lineColor: [80, 80, 80]
  }
};

const LOGO_TEXT = "AUTORAH";
const SUBTITLE_TEXT = "El Pasaporte Global del Vehículo";

// Helper to set theme colors
const applyTheme = (doc, themeName) => {
  const theme = THEMES[themeName] || THEMES.light;
  // Background
  doc.setFillColor(...theme.background);
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
  return theme;
};

// Helper to add Header
const addHeader = (doc, theme, title) => {
  doc.setFontSize(24);
  doc.setTextColor(...theme.accent);
  doc.text(LOGO_TEXT, 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(...theme.secondaryText);
  doc.text(SUBTITLE_TEXT, 20, 26);

  doc.setFontSize(16);
  doc.setTextColor(...theme.text);
  doc.text(title, 20, 40);
  
  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
};

// Helper to add Footer
const addFooter = (doc, theme, pageNumber) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(...theme.secondaryText);
  doc.text(`Generado por AUTORAH - ${new Date().toLocaleDateString()}`, 20, pageHeight - 10);
  doc.text(`Página ${pageNumber}`, 180, pageHeight - 10);
};

// --- STRUCTURAL CHANGE REPORT ---
export const generateStructuralChangePDF = (change, vehicle, workshop, themeName = 'light') => {
  const doc = new jsPDF();
  const theme = applyTheme(doc, themeName);
  
  addHeader(doc, theme, "Reporte de Cambio Estructural");

  let yPos = 55;

  // Vehicle Info Section
  doc.setFontSize(12);
  doc.setTextColor(...theme.accent);
  doc.text("Datos del Vehículo", 20, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Placa', 'Marca', 'Modelo', 'Año', 'VIN', 'Motor']],
    body: [[
      vehicle.plate, 
      vehicle.brand, 
      vehicle.model, 
      vehicle.year, 
      vehicle.vin_full || vehicle.vin || 'N/A', 
      vehicle.engine_number_full || vehicle.engine_number || 'N/A'
    ]],
    theme: 'grid',
    styles: { 
      fillColor: theme.background, 
      textColor: theme.text,
      lineColor: theme.lineColor,
      lineWidth: 0.1
    },
    headStyles: { 
      fillColor: theme.headerBg, 
      textColor: theme.accent,
      fontStyle: 'bold'
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Change Details Section
  doc.setFontSize(12);
  doc.setTextColor(...theme.accent);
  doc.text("Detalles del Cambio", 20, yPos);
  yPos += 10;

  const kmText = change.odo_not_working ? "Odómetro no funciona" : `${change.km} km`;

  autoTable(doc, {
    startY: yPos,
    head: [['Tipo', 'Fecha', 'Kilometraje', 'Taller']],
    body: [[
      change.type, 
      new Date(change.date).toLocaleDateString(), 
      kmText,
      workshop?.full_name || workshop?.workshop_details?.name || 'Taller Afiliado'
    ]],
    theme: 'grid',
    styles: { 
      fillColor: theme.background, 
      textColor: theme.text,
      lineColor: theme.lineColor
    },
    headStyles: { 
      fillColor: theme.headerBg, 
      textColor: theme.accent
    }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Description
  doc.setFontSize(10);
  doc.setTextColor(...theme.secondaryText);
  doc.text("Descripción:", 20, yPos);
  yPos += 7;
  doc.setFontSize(11);
  doc.setTextColor(...theme.text);
  const splitDesc = doc.splitTextToSize(change.description || "Sin descripción", 170);
  doc.text(splitDesc, 20, yPos);
  yPos += (splitDesc.length * 7) + 10;

  // Photos (Placeholder logic as we can't easily embed remote images without CORS issues in client-side JS sometimes, 
  // but we will try to add links or placeholders)
  if (change.photos && change.photos.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(...theme.accent);
    doc.text("Evidencia Fotográfica (URLs)", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    doc.setTextColor(...theme.text);
    change.photos.forEach((photo, index) => {
      if (yPos > 270) { doc.addPage(); applyTheme(doc, themeName); yPos = 20; }
      doc.text(`Foto ${index + 1}: ${photo}`, 20, yPos);
      // Try to add link
      doc.link(20, yPos - 3, 170, 5, { url: photo });
      yPos += 8;
    });
  }

  // Signature Section
  yPos = Math.max(yPos + 20, 240); // Push to bottom
  if (yPos > 250) { doc.addPage(); applyTheme(doc, themeName); yPos = 240; }

  doc.setDrawColor(...theme.text);
  doc.line(20, yPos, 80, yPos); // Signature line
  doc.setFontSize(10);
  doc.text(workshop?.full_name || "Firma Taller", 20, yPos + 5);
  doc.setFontSize(8);
  doc.setTextColor(...theme.secondaryText);
  doc.text("Taller Afiliado AUTORAH", 20, yPos + 10);

  // QR Code Placeholder (Text for now)
  doc.rect(150, yPos - 20, 30, 30);
  doc.text("QR", 160, yPos - 5);
  doc.setFontSize(8);
  doc.text(`ID: ${change.id.substring(0,8)}`, 150, yPos + 15);

  addFooter(doc, theme, 1);
  doc.save(`AUTORAH_Cambio_${vehicle.plate}_${change.date}.pdf`);
};

// --- VEHICLE PASSPORT ---
export const generateVehiclePassportPDF = (vehicle, maintenance, changes, workshop, themeName = 'light') => {
  const doc = new jsPDF();
  const theme = applyTheme(doc, themeName);

  // Cover Page
  doc.setFontSize(36);
  doc.setTextColor(...theme.accent);
  doc.text(LOGO_TEXT, 105, 80, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(...theme.text);
  doc.text("PASAPORTE GLOBAL DEL VEHÍCULO", 105, 100, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...theme.secondaryText);
  doc.text(`${vehicle.brand} ${vehicle.model} ${vehicle.year}`, 105, 120, { align: 'center' });
  doc.text(`VIN: ${vehicle.vin_full || vehicle.vin}`, 105, 130, { align: 'center' });
  doc.text(`Placa: ${vehicle.plate}`, 105, 140, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 250, { align: 'center' });

  doc.addPage();
  applyTheme(doc, themeName);
  addHeader(doc, theme, "Historial del Vehículo");

  let yPos = 50;

  // Maintenance Summary
  doc.setFontSize(14);
  doc.setTextColor(...theme.accent);
  doc.text("Mantenimientos Verificados", 20, yPos);
  yPos += 10;

  if (maintenance && maintenance.length > 0) {
    const maintBody = maintenance.map(m => [
      new Date(m.date).toLocaleDateString(),
      m.service_type,
      `${m.mileage} km`,
      m.workshop_name || 'Taller'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Servicio', 'Km', 'Taller']],
      body: maintBody,
      theme: 'grid',
      styles: { fillColor: theme.background, textColor: theme.text, lineColor: theme.lineColor },
      headStyles: { fillColor: theme.headerBg, textColor: theme.accent }
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...theme.secondaryText);
    doc.text("No hay mantenimientos registrados.", 20, yPos);
    yPos += 15;
  }

  // Structural Changes Summary
  doc.setFontSize(14);
  doc.setTextColor(...theme.accent);
  doc.text("Cambios Estructurales", 20, yPos);
  yPos += 10;

  if (changes && changes.length > 0) {
    const changesBody = changes.map(c => [
      new Date(c.date).toLocaleDateString(),
      c.type,
      c.odo_not_working ? 'Odo. Roto' : `${c.km} km`,
      c.description ? c.description.substring(0, 30) + '...' : ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Fecha', 'Tipo', 'Km', 'Detalle']],
      body: changesBody,
      theme: 'grid',
      styles: { fillColor: theme.background, textColor: theme.text, lineColor: theme.lineColor },
      headStyles: { fillColor: theme.headerBg, textColor: theme.accent }
    });
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...theme.secondaryText);
    doc.text("No hay cambios estructurales registrados.", 20, yPos);
    yPos += 15;
  }

  addFooter(doc, theme, 2);
  doc.save(`AUTORAH_Pasaporte_${vehicle.plate}.pdf`);
};

// --- CERTIFICATE OF VERIFICATION ---
export function generateCertificatePDF(vehicle, workshop, certificateData, qrUrl, themeName = 'light') {
  const doc = new jsPDF();
  const theme = applyTheme(doc, themeName);
  
  addHeader(doc, theme, "Certificado de Verificación");

  let yPos = 55;

  // Certificate Info
  doc.setFontSize(12);
  doc.setTextColor(...theme.accent);
  doc.text(`Certificado #${certificateData.id.substring(0, 8).toUpperCase()}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(...theme.text);
  doc.text(`Tipo: ${certificateData.type.toUpperCase()}`, 20, yPos);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 100, yPos);
  yPos += 15;

  // Vehicle Info
  doc.setFontSize(12);
  doc.setTextColor(...theme.accent);
  doc.text("Datos del Vehículo", 20, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Placa', 'Marca', 'Modelo', 'Año', 'VIN']],
    body: [[
      vehicle.plate, 
      vehicle.brand, 
      vehicle.model, 
      vehicle.year, 
      vehicle.vin || 'N/A'
    ]],
    theme: 'grid',
    styles: { 
      fillColor: theme.background, 
      textColor: theme.text,
      lineColor: theme.lineColor
    },
    headStyles: { 
      fillColor: theme.headerBg, 
      textColor: theme.accent
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Checklist
  doc.setFontSize(12);
  doc.setTextColor(...theme.accent);
  doc.text("Puntos Inspeccionados", 20, yPos);
  yPos += 10;

  const checklistItems = Object.entries(certificateData.checklist || {})
    .map(([key, value]) => [key.charAt(0).toUpperCase() + key.slice(1), value ? 'APROBADO' : 'NO APROBADO']);

  autoTable(doc, {
    startY: yPos,
    head: [['Componente', 'Estado']],
    body: checklistItems,
    theme: 'grid',
    styles: { 
      fillColor: theme.background, 
      textColor: theme.text,
      lineColor: theme.lineColor
    },
    headStyles: { 
      fillColor: theme.headerBg, 
      textColor: theme.accent
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Observations
  if (certificateData.observations) {
    doc.setFontSize(12);
    doc.setTextColor(...theme.accent);
    doc.text("Observaciones", 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(...theme.text);
    const splitObs = doc.splitTextToSize(certificateData.observations, 170);
    doc.text(splitObs, 20, yPos);
    yPos += (splitObs.length * 7) + 10;
  }

  // Workshop Signature
  yPos = Math.max(yPos + 20, 240);
  if (yPos > 250) { doc.addPage(); applyTheme(doc, themeName); yPos = 240; }

  doc.setDrawColor(...theme.text);
  doc.line(20, yPos, 80, yPos);
  doc.setFontSize(10);
  doc.text(workshop?.full_name || workshop?.workshop_details?.name || "Taller Certificado", 20, yPos + 5);
  doc.setFontSize(8);
  doc.setTextColor(...theme.secondaryText);
  doc.text("Emitido por Taller Autorizado AUTORAH", 20, yPos + 10);

  // QR Code Link
  if (qrUrl) {
    doc.setTextColor(...theme.accent);
    doc.text("Verificar en línea", 150, yPos);
    doc.link(150, yPos - 5, 40, 10, { url: qrUrl });
  }

  addFooter(doc, theme, 1);

  // Return doc so it can be used for blob generation
  return doc;
}
