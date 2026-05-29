/**
 * exporter.js — Motor de exportación a Excel y PDF
 * Genera reportes profesionales para el cliente o consejo.
 */

// ---- Exportar a PDF (html2pdf) ----
document.addEventListener('DOMContentLoaded', () => {
  const btnPdf = document.getElementById('btn-export-pdf');
  const btnExcel = document.getElementById('btn-export-excel');
  const btnAgentic = document.getElementById('btn-export-agentic');

  if (btnAgentic) {
    btnAgentic.addEventListener('click', () => {
      if (!STATE.analysisResult) return;
      const data = STATE.analysisResult;
      const conf = data.confidence || {};
      const anom = data.anomalies || [];
      const t = data.totales;
      const runway = t.burnRateNeto > 0 ? (t.cajaFinal / t.burnRateNeto).toFixed(1) + ' meses' : 'Rentable';

      const { defensa } = typeof buildNarrative === 'function'
        ? buildNarrative(data, STATE.forecastResult, STATE.scoringResult)
        : { defensa: '' };

      const markdown = `<system_context>
Estos datos financieros pertenecen a la empresa ${STATE.empresa.nombre || 'analizada'} y han sido procesados y estructurados automáticamente por FinTriage a partir de su libro diario contable bruto.
</system_context>

<financial_data>
- Ingresos Totales: ${t.ingresos.toLocaleString('es-ES')} €
- EBITDA: ${t.ebitda.toLocaleString('es-ES')} €
- Caja Final: ${t.cajaFinal.toLocaleString('es-ES')} €
- Burn Rate Neto Promedio: ${t.burnRateNeto.toLocaleString('es-ES')} €/mes
- Runway Estimado: ${runway}
</financial_data>

<confidence_engine>
- Trust Score: ${conf.trustScore || 0}/100 (${conf.confidenceLabel || 'No evaluado'})
- Limitaciones del Análisis:
${(conf.analysisLimitations || []).map(l => '  * ' + l).join('\n')}
</confidence_engine>

<actionable_findings>
${anom.length > 0 ? anom.map(a => '- [' + a.severity.toUpperCase() + '] ' + a.message).join('\n') : '- Ninguna anomalía detectada.'}
</actionable_findings>

<cfo_defense_argumentary>
${defensa || 'No se han generado alegaciones de defensa.'}
</cfo_defense_argumentary>`;

      navigator.clipboard.writeText(markdown).then(() => {
        showToast('Contexto copiado al portapapeles. Listo para pegar en ChatGPT/Claude', 'success');
      }).catch(err => {
        console.error('Error al copiar:', err);
        showToast('Error al copiar al portapapeles', 'error');
      });
    });
  }

  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      if (!STATE.analysisResult) return;
      
      const data = STATE.analysisResult;
      const forecast = STATE.forecastResult;
      const scoring = STATE.scoringResult;
      const empresa = STATE.empresa.nombre || data.meta.fileName || 'Empresa';
      
      showToast('Generando PDF Premium...', 'info', 2000);
      
      // 1. Crear el contenedor temporal fuera de pantalla (envoltorio wrapper para evitar colapso de alto en clon de html2pdf)
      const wrapper = document.createElement('div');
      wrapper.id = 'pdf-print-wrapper';
      wrapper.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 0; height: 0; overflow: hidden;';
      document.body.appendChild(wrapper);
      
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-print-container';
      printContainer.style.cssText = 'position: relative; width: 800px; background: #ffffff;';
      wrapper.appendChild(printContainer);
      
      try {
        // 2. Poblar el DOM temporal con las páginas estructuradas
        preparePrintDOM(printContainer, data, forecast, scoring);
        
        // 3. Re-renderizar los 5 gráficos en modo 'print' apuntando a sus respectivos contenedores dentro del DOM temporal
        const containerWaterfall = printContainer.querySelector('#pdf-waterfall-chart-container');
        const containerEbitda = printContainer.querySelector('#pdf-ebitda-chart-container');
        const containerRunway = printContainer.querySelector('#pdf-runway-burn-chart-container');
        const containerRevenues = printContainer.querySelector('#pdf-revenues-expenses-chart-container');
        const containerForecast = printContainer.querySelector('#pdf-forecast-fan-chart-container');
        
        if (containerWaterfall) renderWaterfall(data, 'print', containerWaterfall);
        if (containerEbitda) renderDivergingEbitdaChart('pdf-ebitda-chart-container', data, 'print', containerEbitda);
        if (containerRunway) renderRunwayBurnChart('pdf-runway-burn-chart-container', data, 'print', containerRunway);
        if (containerRevenues) renderRevenuesExpensesChart('pdf-revenues-expenses-chart-container', data, 'print', containerRevenues);
        if (containerForecast) renderForecastFanChart('pdf-forecast-fan-chart-container', data, 'print', containerForecast);
        
        // DIAGNÓSTICO
        console.log("[DIAG PDF] printContainer rect:", printContainer.getBoundingClientRect());
        console.log("[DIAG PDF] printContainer innerHTML length:", printContainer.innerHTML.length);
        console.log("[DIAG PDF] pdf-page element count:", printContainer.querySelectorAll('.pdf-page').length);

        // 4. Configurar opciones de html2pdf
        const opt = {
          margin:       0,
          filename:     `${empresa}_fintriage_report.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'legacy'], avoid: '.pdf-avoid-break' }
        };
        
        // 5. Exportar y limpiar/destruir el árbol temporal tras la exportación
        html2pdf().set(opt).from(printContainer).save().then(() => {
          wrapper.remove();
          showToast('PDF Premium Exportado ✓', 'success');
        }).catch((err) => {
          console.error("Error al guardar PDF:", err);
          wrapper.remove();
          showToast('Error al exportar PDF', 'error');
        });
        
      } catch (err) {
        console.error("Error en la preparación del PDF:", err);
        wrapper.remove();
        showToast('Error al generar PDF', 'error');
      }
    });
  }

  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      if (!STATE.analysisResult) return;
      exportToExcel(STATE.analysisResult, STATE.forecastResult, STATE.scoringResult);
    });
  }
});


// ---- Exportar a Excel Vivo (SheetJS) ----
/**
 * exportToExcel(data, forecast, scoring)
 * @description Genera un archivo Excel multioja (.xlsx) usando SheetJS. A diferencia de un CSV plano, 
 * este exportador inyecta fórmulas vivas de Excel (SUM, restas) en la PyG para que el modelo financiero 
 * siga siendo interactivo para el cliente final.
 * @param {Object} data - AnalysisResult de analyzer.js.
 * @param {Object} forecast - ForecastResult de forecaster.js.
 * @param {Object} scoring - ScoringResult de scorer.js.
 * @returns {void} Inicia la descarga del Excel en el navegador.
 */
function exportToExcel(data, forecast, scoring) {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Pestaña: PyG Analítica (Con fórmulas vivas)
    const wsPyG = buildPyGSheet(data.pygMensual);
    XLSX.utils.book_append_sheet(wb, wsPyG, "PyG Analítica");

    // 2. Pestaña: Balance y KPIs
    const wsKPIs = buildKPISheet(data);
    XLSX.utils.book_append_sheet(wb, wsKPIs, "KPIs y Balance");

    // 3. Pestaña: Forecast 12M
    if (forecast && forecast.scenarios && forecast.scenarios.base) {
      const wsForecast = buildForecastSheet(forecast);
      XLSX.utils.book_append_sheet(wb, wsForecast, "Forecast 12M");
    }

    // 4. Pestaña: Calidad del Dato (Nuevo Fase 5)
    const wsConf = buildConfidenceSheet(data);
    XLSX.utils.book_append_sheet(wb, wsConf, "Calidad del Dato");

    // Exportar
    const fileName = `${STATE.empresa.nombre || 'modelo'}_financiero_fintriage.xlsx`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(wb, fileName);
    showToast('Excel Exportado ✓', 'success');

  } catch (err) {
    console.error("Error al exportar Excel:", err);
    showToast('Error al generar Excel', 'error');
  }
}

/**
 * buildConfidenceSheet(data)
 */
function buildConfidenceSheet(data) {
  const conf = data.confidence || {};
  const flags = conf.fundingReadinessFlags || {};
  
  const aoa = [
    ["DIAGNÓSTICO DE INTEGRIDAD Y CONFIANZA"],
    [],
    ["Métrica", "Estado"],
    ["Trust Score", { t: 'n', v: conf.trustScore || 0 }],
    ["Nivel de Confianza", conf.confidenceLabel || '—'],
    ["EBITDA Sospechoso", conf.ebitdaSuspect ? "SÍ" : "NO"],
    [],
    ["Limitaciones del Análisis", ""],
    ...(conf.analysisLimitations || []).map(l => [l]),
    [],
    ["Readiness para Financiación", ""],
    ["Scoring Defensible", flags.scoringDefensible ? "SÍ" : "NO"],
    ["Forecast Defensible", flags.forecastDefensible ? "SÍ" : "NO"],
    ["Narrativa Conclusiva", flags.narrativeConclusive ? "SÍ" : "NO"],
    ["Requiere Revisión Manual", flags.requiresManualReview ? "SÍ" : "NO"]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 35 }, { wch: 25 }];
  return ws;
}

/**
 * buildPyGSheet(pygMensual)
 * @description Construye la hoja de cálculo "PyG Analítica". Inyecta fórmulas nativas (ej: `SUM(B2:B3)`) 
 * en lugar de valores estáticos para los cálculos de subtotales (EBITDA, Margen Bruto, etc.).
 * @param {Object} pygMensual - Mapa de meses a resultados de PyG.
 * @returns {Object} Un worksheet de SheetJS listo para ser añadido a un workbook.
 */
function buildPyGSheet(pygMensual) {
  const months = Object.keys(pygMensual).sort();
  const numMonths = months.length;
  
  // AOA (Array of Arrays) para SheetJS
  const aoa = [];
  
  // Fila 1: Cabeceras
  const headers = ["Partida", ...months, "TOTAL"];
  aoa.push(headers);

  // Mapeo de filas lógicas a su índice en Excel (0-indexed array = fila Excel 1)
  // Partidas (los valores los pondremos en positivo, restaremos con fórmula)
  const rowsConfig = [
    { key: 'ventas', label: 'Ventas / Servicios', type: 'val' },             // Row 2
    { key: 'otrosIngresos', label: 'Otros Ingresos', type: 'val' },          // Row 3
    { label: 'TOTAL INGRESOS', type: 'form', f: (col) => `SUM(${col}2:${col}3)` }, // Row 4
    { key: 'cogs', label: 'Coste de Ventas (COGS)', type: 'val' },           // Row 5
    { label: 'MARGEN BRUTO', type: 'form', f: (col) => `${col}4-${col}5` },  // Row 6
    { key: 'personal', label: 'Personal', type: 'val' },                     // Row 7
    { key: 'marketing', label: 'Marketing', type: 'val' },                   // Row 8
    { key: 'serviciosOperativos', label: 'Servicios Operativos', type: 'val' }, // Row 9
    { key: 'tributos', label: 'Tributos', type: 'val' },                     // Row 10
    { label: 'EBITDA', type: 'form', f: (col) => `${col}6-SUM(${col}7:${col}10)` }, // Row 11
    { key: 'amortizacion', label: 'Amortización', type: 'val' },             // Row 12
    { label: 'EBIT', type: 'form', f: (col) => `${col}11-${col}12` },        // Row 13
    { key: 'gastosFinancieros', label: 'Gastos Financieros', type: 'val' },  // Row 14
    { label: 'RESULTADO NETO', type: 'form', f: (col) => `${col}13-${col}14` } // Row 15
  ];

  // Helper para obtener letra de columna Excel (A, B, C...)
  function getColLetter(colIndex) {
    let letter = '';
    while (colIndex >= 0) {
      letter = String.fromCharCode((colIndex % 26) + 65) + letter;
      colIndex = Math.floor(colIndex / 26) - 1;
    }
    return letter;
  }

  // Rellenar datos y fórmulas
  rowsConfig.forEach((cfg, rIdx) => {
    const rowData = [cfg.label];
    
    // Columnas de meses
    for (let cIdx = 0; cIdx < numMonths; cIdx++) {
      const colLetter = getColLetter(cIdx + 1); // +1 porque col 0 es "Partida"
      
      if (cfg.type === 'val') {
        const val = pygMensual[months[cIdx]][cfg.key] || 0;
        rowData.push({ t: 'n', v: val });
      } else if (cfg.type === 'form') {
        const formula = cfg.f(colLetter);
        rowData.push({ t: 'n', f: formula });
      }
    }

    // Columna TOTAL
    const totalColLetter = getColLetter(numMonths + 1);
    const startCol = getColLetter(1);
    const endCol = getColLetter(numMonths);
    const rowExcel = rIdx + 2; // +2 por la cabecera y porque excel es 1-indexed
    
    if (cfg.type === 'val') {
      rowData.push({ t: 'n', f: `SUM(${startCol}${rowExcel}:${endCol}${rowExcel})` });
    } else if (cfg.type === 'form') {
      rowData.push({ t: 'n', f: cfg.f(totalColLetter) }); // Total column applies the same vertical logic
    }

    aoa.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  
  // Anchura de columnas
  const wscols = [{ wch: 25 }];
  for(let i=0; i<=numMonths; i++) wscols.push({ wch: 12 });
  ws['!cols'] = wscols;

  return ws;
}

/**
 * buildKPISheet(data)
 * @description Construye la hoja de cálculo estática con los KPIs agregados y el balance estimado.
 * @param {Object} data - AnalysisResult de analyzer.js.
 * @returns {Object} Un worksheet de SheetJS.
 */
function buildKPISheet(data) {
  const aoa = [
    ["KPIs y Resumen de Balance"],
    [],
    ["Métrica", "Valor"],
    ["Caja Final", { t: 'n', v: data.totales.cajaFinal }],
    ["Burn Rate Neto Promedio", { t: 'n', v: data.totales.burnRateNeto }],
    ["Ingresos Totales", { t: 'n', v: data.totales.ingresos }],
    ["EBITDA Total", { t: 'n', v: data.totales.ebitda }],
    [],
    ["Balance Estimado", ""],
    ["Activo Corriente", { t: 'n', v: data.balance.activoCorriente }],
    ["Activo No Corriente", { t: 'n', v: data.balance.activoNoCorriente }],
    ["Pasivo Corriente", { t: 'n', v: data.balance.pasivoCorriente }],
    ["Pasivo No Corriente (Deuda LP)", { t: 'n', v: data.balance.pasivoNoCorriente }],
    ["Patrimonio Neto", { t: 'n', v: data.balance.patrimonioNeto }]
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }];
  return ws;
}

/**
 * buildForecastSheet(forecast)
 * @description Construye la hoja de cálculo con la proyección a 12 meses (Escenario Base). 
 * Inyecta fórmulas básicas para el cálculo del EBITDA futuro.
 * @param {Object} forecast - ForecastResult con escenarios precalculados.
 * @returns {Object} Un worksheet de SheetJS.
 */
function buildForecastSheet(forecast) {
  const aoa = [];
  const base = forecast.scenarios.base;
  
  // Headers
  const headers = ["Mes", "Ingresos", "OPEX", "EBITDA", "Caja Acumulada"];
  aoa.push(["Forecast 12 Meses - Escenario Base"]);
  aoa.push([]);
  aoa.push(headers);

  // Data
  base.forEach(r => {
    aoa.push([
      r.mes,
      { t: 'n', v: r.ingresos },
      { t: 'n', v: r.opex },
      { t: 'n', f: `B${aoa.length+1}-C${aoa.length+1}` }, // Formula EBITDA = Ingresos - Opex
      { t: 'n', v: r.caja } // Caja es acumulativa, podríamos hacer formula pero es más complejo si hay eventos extra. Lo dejamos estático.
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  return ws;
}

/**
 * parseMarkdownToHtml(md)
 * @description Convierte el markdown del argumentario financiero y de defensa a un HTML estructurado y estilizado para A4.
 */
function parseMarkdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^>\s*⚠️\s*(.*)$/gm, '<blockquote style="border-left: 3px solid #d97706; padding: 6px 10px; color: #92400e; background: #fffbeb; border-radius: 4px; margin: 8px 0; font-size: 7.5px; line-height: 1.4;">⚠️ $1</blockquote>')
    .replace(/^>\s*(.*)$/gm, '<blockquote style="border-left: 3px solid #d1d5db; padding: 6px 10px; color: #4b5563; background: #f9fafb; border-radius: 4px; margin: 8px 0; font-size: 7.5px; line-height: 1.4;">$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*)$/gm, '<h4 style="font-size: 8.5px; font-weight: 700; color: #111111; margin-top: 10px; margin-bottom: 4px; border-bottom: 1px solid #f3f4f6; padding-bottom: 2px; font-family: var(--font-display);">$1</h4>')
    .replace(/^## (.*)$/gm, '<h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 14px; margin-bottom: 6px; font-family: var(--font-display);">$1</h3>')
    .replace(/^\s*[-*]\s*(.*)$/gm, '<li style="margin-left: 10px; margin-bottom: 3px; font-size: 7.5px; line-height: 1.4; color: #374151;">$1</li>')
    .split('\n\n').map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<blockquote') || p.startsWith('<h') || p.startsWith('<li')) return p;
      return `<p style="font-size: 7.5px; line-height: 1.4; color: #374151; margin-bottom: 6px;">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');
  return html;
}

/**
 * buildPyGTableHTML(pygMensual)
 * @description Genera la tabla HTML de Pérdidas y Ganancias (PyG) en formato A4 ultra limpio, monospace y contrastado.
 */
function buildPyGTableHTML(pygMensual) {
  const months = Object.keys(pygMensual).sort();
  const rows = [
    { key: 'ventas', label: 'Ventas / Servicios', isSubtotal: false },
    { key: 'otrosIngresos', label: 'Otros Ingresos', isSubtotal: false },
    { key: 'totalIngresos', label: 'TOTAL INGRESOS', isSubtotal: true },
    { key: 'cogs', label: 'Coste de Ventas (COGS)', isSubtotal: false },
    { key: 'margenBruto', label: 'MARGEN BRUTO', isSubtotal: true },
    { key: 'personal', label: 'Personal', isSubtotal: false },
    { key: 'marketing', label: 'Marketing', isSubtotal: false },
    { key: 'serviciosOperativos', label: 'Servicios Operativos', isSubtotal: false },
    { key: 'tributos', label: 'Tributos', isSubtotal: false },
    { key: 'ebitda', label: 'EBITDA', isSubtotal: true },
    { key: 'amortizacion', label: 'Amortización', isSubtotal: false },
    { key: 'ebit', label: 'EBIT', isSubtotal: true },
    { key: 'gastosFinancieros', label: 'Gastos Financieros', isSubtotal: false },
    { key: 'resultadoNeto', label: 'RESULTADO NETO', isSubtotal: true }
  ];

  const dataTable = {};
  const totals = {};
  rows.forEach(r => {
    dataTable[r.key] = {};
    totals[r.key] = 0;
  });

  months.forEach(m => {
    const dataMes = pygMensual[m];
    const v = dataMes.ventas || 0;
    const oi = dataMes.otrosIngresos || 0;
    const ti = v + oi;
    const cg = dataMes.cogs || 0;
    const mb = ti - cg;
    const pe = dataMes.personal || 0;
    const mk = dataMes.marketing || 0;
    const so = dataMes.serviciosOperativos || 0;
    const tr = dataMes.tributos || 0;
    const eb = mb - (pe + mk + so + tr);
    const am = dataMes.amortizacion || 0;
    const ebt = eb - am;
    const gf = dataMes.gastosFinancieros || 0;
    const rn = ebt - gf;

    dataTable['ventas'][m] = v;
    dataTable['otrosIngresos'][m] = oi;
    dataTable['totalIngresos'][m] = ti;
    dataTable['cogs'][m] = cg;
    dataTable['margenBruto'][m] = mb;
    dataTable['personal'][m] = pe;
    dataTable['marketing'][m] = mk;
    dataTable['serviciosOperativos'][m] = so;
    dataTable['tributos'][m] = tr;
    dataTable['ebitda'][m] = eb;
    dataTable['amortizacion'][m] = am;
    dataTable['ebit'][m] = ebt;
    dataTable['gastosFinancieros'][m] = gf;
    dataTable['resultadoNeto'][m] = rn;

    rows.forEach(r => {
      totals[r.key] += dataTable[r.key][m];
    });
  });

  let html = `<table class="pdf-table pdf-table-mono"><thead><tr><th style="font-family: var(--font-ui);">Partida</th>`;
  months.forEach(m => {
    const parts = m.split('-');
    const labelMes = parts.length === 2 ? `${parts[1]}/${parts[0].slice(2)}` : m;
    html += `<th style="text-align: right; font-family: var(--font-ui);">${labelMes}</th>`;
  });
  html += `<th style="text-align: right; font-family: var(--font-ui);">TOTAL</th></tr></thead><tbody>`;

  rows.forEach(r => {
    const trStyle = r.isSubtotal 
      ? 'background-color: #f9fafb; font-weight: 700; border-top: 1px solid #d1d5db; border-bottom: 2px solid #9ca3af; color: #111111 !important;' 
      : '';
    html += `<tr style="${trStyle}">`;
    html += `<td style="font-family: var(--font-ui); font-size: 7.5px; ${r.isSubtotal ? 'font-weight:700;' : ''}">${r.label}</td>`;
    
    months.forEach(m => {
      const val = dataTable[r.key][m];
      const valStr = val.toLocaleString('es-ES', { maximumFractionDigits: 0 });
      let style = '';
      if ((r.key === 'ebitda' || r.key === 'resultadoNeto') && val < 0) style = 'color: #991b1b;';
      html += `<td style="text-align: right; ${style}">${valStr} €</td>`;
    });

    const totVal = totals[r.key];
    const totStr = totVal.toLocaleString('es-ES', { maximumFractionDigits: 0 });
    let style = '';
    if ((r.key === 'ebitda' || r.key === 'resultadoNeto') && totVal < 0) style = 'color: #991b1b; font-weight:700;';
    else if (r.isSubtotal) style = 'font-weight: 700;';
    html += `<td style="text-align: right; ${style}">${totStr} €</td></tr>`;
  });

  html += '</tbody></table>';
  return html;
}

/**
 * preparePrintDOM(printContainer, data, forecast, scoring)
 * @description Construye de forma programática y robusta las 7 páginas del dossier financiero Premium en A4.
 */
function preparePrintDOM(printContainer, data, forecast, scoring) {
  const empresa = STATE.empresa.nombre || data.meta.fileName || 'Empresa';
  const profileName = STATE.selectedProfile?.name || 'Perfil General';
  const confidence = data.confidence || {};
  const ts = confidence.trustScore ?? '--';
  const tsLabel = confidence.confidenceLabel || '--';
  const anomCount = data.anomalies?.length || 0;
  const highCount = (data.anomalies || []).filter(a => a.severity === 'high' || a.severity === 'critical').length;
  const fecha = new Date().toLocaleDateString('es-ES', { year:'numeric', month:'long', day:'numeric' });

  const tsColor = ts >= 80 ? '#166534' : ts >= 50 ? '#d97706' : '#991b1b';
  const anomColor = highCount > 0 ? '#991b1b' : '#166534';

  const runwayIndex = forecast?.scenarios?.base?.findIndex(r => r.caja < 0);
  const runwayText = runwayIndex !== undefined && runwayIndex !== -1 
    ? `${runwayIndex + 1} meses` 
    : (data.totales.burnRateNeto > 0 ? (data.totales.cajaFinal / data.totales.burnRateNeto).toFixed(1) + ' meses' : 'Rentable');
  const runwayColor = (runwayIndex !== undefined && runwayIndex !== -1 && runwayIndex < 6) ? '#991b1b' : '#111111';

  let sealHtml = '';
  if (confidence.confidenceLevel !== 'reliable') {
    const sealColor = confidence.confidenceLevel === 'blocked' ? '#dc2626' : '#d97706';
    sealHtml = `
      <div style="margin-top:16px; border:2.5px solid ${sealColor}; color:${sealColor}; display:inline-block; padding:5px 16px; border-radius:6px; font-weight:800; text-transform:uppercase; transform:rotate(-2deg); font-family: var(--font-display); font-size: 10px; background: #ffffff;">
        Análisis ${confidence.confidenceLabel || 'Condicionado'}
      </div>
    `;
  }

  const narratives = typeof buildNarrative === 'function'
    ? buildNarrative(data, forecast, scoring)
    : { financiero: '', estrategico: '', defensa: '' };

  const pygTableHtml = buildPyGTableHTML(data.pygMensual);

  // Generar anexo anomalías
  const anomalies = data.anomalies || [];
  let anomaliesListHtml = '';
  if (anomalies.length > 0) {
    anomaliesListHtml = `
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width: 12%;">Mes</th>
            <th style="width: 15%;">Severidad</th>
            <th style="width: 15%;">Cuenta</th>
            <th style="width: 58%;">Descripción</th>
          </tr>
        </thead>
        <tbody>
    `;
    anomalies.forEach(a => {
      let badgeClass = 'pdf-badge-low';
      let sevLabel = 'Baja';
      if (a.severity === 'critical') { badgeClass = 'pdf-badge-critical'; sevLabel = 'Crítica'; }
      else if (a.severity === 'high') { badgeClass = 'pdf-badge-high'; sevLabel = 'Alta'; }
      else if (a.severity === 'medium') { badgeClass = 'pdf-badge-medium'; sevLabel = 'Media'; }
      
      anomaliesListHtml += `
        <tr>
          <td class="pdf-table-mono" style="font-weight: 600;">${a.month || 'Global'}</td>
          <td><span class="pdf-badge ${badgeClass}">${sevLabel}</span></td>
          <td class="pdf-table-mono"><code>${a.cuenta || '—'}</code></td>
          <td style="font-size: 7.5px;"><strong>${a.message}</strong>${a.detail ? `<br/><span style="color:#6b7280; font-size:7px;">${a.detail}</span>` : ''}</td>
        </tr>
      `;
    });
    anomaliesListHtml += `
        </tbody>
      </table>
    `;
  } else {
    anomaliesListHtml = '<p style="font-size: 8px; color: #166534; font-weight: 600; margin: 0;">✓ No se han detectado anomalías contables en este libro diario.</p>';
  }

  // Generar anexo periodificaciones
  const approvedAccruals = STATE.approvedAccruals || [];
  let accrualsTableHtml = '';
  if (approvedAccruals.length > 0) {
    accrualsTableHtml = `
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width: 15%;">Cuenta</th>
            <th style="width: 45%;">Descripción del Devengo</th>
            <th style="width: 12%;">Mes Origen</th>
            <th style="width: 14%; text-align: right;">Importe Total</th>
            <th style="width: 14%; text-align: right;">Cuota Mensual</th>
          </tr>
        </thead>
        <tbody>
    `;
    approvedAccruals.forEach(acc => {
      accrualsTableHtml += `
        <tr>
          <td class="pdf-table-mono"><code>${acc.cuenta}</code></td>
          <td style="font-size: 7.5px;">${acc.descripcion}</td>
          <td class="pdf-table-mono">${acc.mesOrigen}</td>
          <td class="pdf-table-mono" style="text-align: right; font-weight: 600;">${acc.importeTotal.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} €</td>
          <td class="pdf-table-mono" style="text-align: right; font-weight: 600;">${acc.importeMensual.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} €</td>
        </tr>
      `;
    });
    accrualsTableHtml += `
        </tbody>
      </table>
    `;
  } else {
    accrualsTableHtml = '<p style="font-size: 8px; color: #6b7280; margin: 0;">Ningún ajuste de periodificación o devengo ha sido seleccionado por el consultor.</p>';
  }

  // Generar anexo audit reasons
  let auditReasonsHtml = '';
  const reasons = confidence.auditReasons || [];
  if (reasons.length > 0) {
    auditReasonsHtml = '<ul style="margin: 0; padding-left: 12px; font-size: 7.5px; line-height: 1.4; color: #374151;">';
    reasons.forEach(r => {
      let color = '#4b5563';
      let weight = 'normal';
      if (r.startsWith('+')) { color = '#166534'; weight = '600'; }
      else if (r.startsWith('-')) { color = '#991b1b'; weight = '600'; }
      
      auditReasonsHtml += `<li style="margin-bottom: 2px; color: ${color}; font-weight: ${weight};">${r}</li>`;
    });
    auditReasonsHtml += '</ul>';
  } else {
    auditReasonsHtml = '<p style="font-size: 8px; color: #6b7280; margin: 0;">No se registran justificaciones de ajuste en este análisis.</p>';
  }

  // Ensamblar páginas
  printContainer.innerHTML = `
    <!-- Página 1: Portada -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">INFORME CONFIDENCIAL</span>
      </div>
      
      <div class="pdf-page-content" style="justify-content: center; gap: 40px; margin-top: 60px; margin-bottom: 60px;">
        <div style="text-align: center;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111111; font-family: var(--font-display); line-height: 1.2; margin-bottom: 8px;">
            ${empresa}
          </h1>
          <p style="font-size: 11px; color: #4b5563; margin-top: 4px;">
            Diagnóstico de Integridad Financiera y Defensa CFO
          </p>
          <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px; font-size: 9px; color: #6b7280;">
            <span><strong>Perfil:</strong> ${profileName}</span>
            <span>•</span>
            <span><strong>Fecha:</strong> ${fecha}</span>
          </div>
          ${sealHtml}
        </div>

        <div style="display: flex; justify-content: center; gap: 24px; margin-top: 20px;">
          <div class="pdf-card" style="text-align: center; width: 140px; padding: 20px !important;">
            <div style="font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: bold; margin-bottom: 6px;">Trust Score</div>
            <div style="font-size: 32px; font-weight: 800; color: ${tsColor}; line-height: 1;">${ts}</div>
            <div style="font-size: 9px; font-weight: 600; color: ${tsColor}; margin-top: 6px;">${tsLabel}</div>
          </div>

          <div class="pdf-card" style="text-align: center; width: 140px; padding: 20px !important;">
            <div style="font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: bold; margin-bottom: 6px;">Anomalías</div>
            <div style="font-size: 32px; font-weight: 800; color: ${anomColor}; line-height: 1;">${anomCount}</div>
            <div style="font-size: 9px; color: #4b5563; margin-top: 6px;">${highCount} graves / críticas</div>
          </div>

          <div class="pdf-card" style="text-align: center; width: 140px; padding: 20px !important;">
            <div style="font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; font-weight: bold; margin-bottom: 6px;">Periodo</div>
            <div style="font-size: 32px; font-weight: 800; color: #111111; line-height: 1;">${data.meta.months?.length || 0}</div>
            <div style="font-size: 9px; color: #4b5563; margin-top: 6px;">Meses Analizados</div>
          </div>
        </div>

        <div class="pdf-card" style="background: #f9fafb !important; padding: 16px !important; max-width: 500px; margin: 0 auto; border-left: 4px solid #374151 !important;">
          <h3 style="font-size: 9px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Objetivo del Diagnóstico</h3>
          <p style="font-size: 8.5px; line-height: 1.4; color: #4b5563; margin: 0;">
            Este informe sintetiza la auditoría del libro diario contable, evalúa la calidad del dato y la elegibilidad para instrumentos de financiación pública (ENISA, CDTI), y provee el argumentario técnico de supervivencia y defensa CFO adaptado para comités de evaluación de riesgos.
          </p>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 1 de 7</span>
      </div>
    </div>

    <!-- Página 2: Resumen Ejecutivo y Diagnóstico Financiero -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 10px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          1. Resumen Ejecutivo y Diagnóstico Financiero
        </h2>
        
        <div class="pdf-avoid-break">
          ${parseMarkdownToHtml(narratives.financiero)}
        </div>

        <div class="pdf-grid-3 pdf-avoid-break" style="margin-top: 15px;">
          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Ingresos Totales</div>
            <div style="font-size: 16px; font-weight: 800; color: #111111; margin-top: 4px;">${data.totales.ingresos.toLocaleString('es-ES')} €</div>
            <div style="font-size: 7.5px; color: #6b7280; margin-top: 4px;">Periodo Acumulado</div>
          </div>
          
          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">EBITDA</div>
            <div style="font-size: 16px; font-weight: 800; color: ${data.totales.ebitda >= 0 ? '#111111' : '#dc2626'}; margin-top: 4px;">
              ${data.totales.ebitda.toLocaleString('es-ES')} €
            </div>
            <div style="font-size: 7.5px; color: #6b7280; margin-top: 4px;">
              ${confidence.ebitdaSuspect ? '⚠️ EBITDA Sospechoso' : 'EBITDA Operativo'}
            </div>
          </div>

          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Caja Final</div>
            <div style="font-size: 16px; font-weight: 800; color: #111111; margin-top: 4px;">${data.totales.cajaFinal.toLocaleString('es-ES')} €</div>
            <div style="font-size: 7.5px; color: #6b7280; margin-top: 4px;">Último mes analizado</div>
          </div>

          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Burn Rate Neto</div>
            <div style="font-size: 16px; font-weight: 800; color: #111111; margin-top: 4px;">${data.totales.burnRateNeto.toLocaleString('es-ES')} €/mes</div>
            <div style="font-size: 7.5px; color: #6b7280; margin-top: 4px;">Consumo de caja promedio</div>
          </div>

          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Runway Estimado</div>
            <div style="font-size: 16px; font-weight: 800; color: ${runwayColor}; margin-top: 4px;">${runwayText}</div>
            <div style="font-size: 7.5px; color: #6b7280; margin-top: 4px;">Proyección de supervivencia</div>
          </div>

          <div class="pdf-card" style="padding: 12px !important;">
            <div style="font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: 600;">Trust Level</div>
            <div style="font-size: 16px; font-weight: 800; color: ${tsColor}; margin-top: 4px;">${ts}/100</div>
            <div style="font-size: 7.5px; color: ${tsColor}; margin-top: 4px; font-weight: 600;">${tsLabel}</div>
          </div>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 2 de 7</span>
      </div>
    </div>

    <!-- Página 3: Análisis Gráfico I: Evolución de Caja y Rentabilidad -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 15px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          2. Estructura de Márgenes y EBITDA Histórico-Proyectado
        </h2>

        <div class="pdf-card pdf-avoid-break" style="margin-bottom: 15px;">
          <h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 4px;">Descomposición de Caja y Consumo Contable (Waterfall)</h3>
          <p style="font-size: 8px; color: #6b7280; margin-top: 0; margin-bottom: 8px;">
            Desglose acumulado desde los ingresos brutos hasta el EBITDA final del ejercicio contable, aislando el impacto de COGS, costes de personal y otros costes operativos fijos.
          </p>
          <div id="pdf-waterfall-chart-container" style="width: 100%; height: auto;"></div>
        </div>

        <div class="pdf-card pdf-avoid-break">
          <h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 4px;">Evolución Mensual del EBITDA (Histórico y Forecast)</h3>
          <p style="font-size: 8px; color: #6b7280; margin-top: 0; margin-bottom: 8px;">
            Seguimiento del EBITDA mes a mes. Las áreas atenuadas o sin color sólido en gráficos de barra representan periodos reales con sospechas de baja fiabilidad de datos. La zona a la derecha representa la proyección base.
          </p>
          <div id="pdf-ebitda-chart-container" style="width: 100%; height: auto;"></div>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 3 de 7</span>
      </div>
    </div>

    <!-- Página 4: Proyección de Runway y Dinámica de Cashflow -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 15px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          3. Proyección de Runway y Dinámica de Cashflow
        </h2>

        <div class="pdf-card pdf-avoid-break" style="margin-bottom: 15px;">
          <h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 4px;">Caja Final y Tasa de Consumo Mensual (Runway & Burn Rate)</h3>
          <p style="font-size: 8px; color: #6b7280; margin-top: 0; margin-bottom: 8px;">
            Comparativa directa entre el remanente de caja disponible y la velocidad mensual de destrucción neta de tesorería, alineados al eje neutro común.
          </p>
          <div id="pdf-runway-burn-chart-container" style="width: 100%; height: auto;"></div>
        </div>

        <div class="pdf-card pdf-avoid-break">
          <h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 4px;">Estructura Temporal de Ingresos vs. Costes Totales</h3>
          <p style="font-size: 8px; color: #6b7280; margin-top: 0; margin-bottom: 8px;">
            Contraste entre los ingresos brutos generados y los costes incurridos en cada mes del periodo analizado, indicando la senda de break-even mensual.
          </p>
          <div id="pdf-revenues-expenses-chart-container" style="width: 100%; height: auto;"></div>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 4 de 7</span>
      </div>
    </div>

    <!-- Página 5: Cuenta de Resultados (PyG) Analítica -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 10px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          4. Cuenta de Pérdidas y Ganancias (PyG) Analítica
        </h2>
        <p style="font-size: 8.5px; color: #4b5563; margin-top: 0; margin-bottom: 10px; line-height: 1.4;">
          La siguiente tabla presenta la cuenta de resultados mensualizada estructurada bajo criterio de gestión analítica directa. Todos los valores se muestran expresados en euros contables (€).
        </p>

        <div class="pdf-avoid-break" style="width: 100%; overflow-x: auto;">
          ${pygTableHtml}
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 5 de 7</span>
      </div>
    </div>

    <!-- Página 6: Proyecciones Financieras (Forecast 12 Meses) -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 15px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          5. Proyección de Escenarios de Caja (Forecast 12 Meses)
        </h2>

        <div class="pdf-card pdf-avoid-break" style="margin-bottom: 15px;">
          <h3 style="font-size: 9.5px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 4px;">Simulación y Estrés de Tesorería (Base, Optimista, Pesimista)</h3>
          <p style="font-size: 8px; color: #6b7280; margin-top: 0; margin-bottom: 8px;">
            Proyección de caja acumulada a 12 meses vista a partir del último mes real. La banda atenuada representa el abanico probabilístico de sensibilidad financiera.
          </p>
          <div id="pdf-forecast-fan-chart-container" style="width: 100%; height: auto;"></div>
        </div>

        <div class="pdf-avoid-break">
          ${parseMarkdownToHtml(narratives.estrategico)}
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 6 de 7</span>
      </div>
    </div>

    <!-- Página 7: Anexo de Trazabilidad, Confianza y Ajustes Contables -->
    <div class="pdf-page">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px;">
        <span style="font-size: 8px; font-weight: 700; color: #9ca3af; letter-spacing: 0.1em; font-family: var(--font-display);">FINTRIAGE</span>
        <span style="font-size: 8px; color: #9ca3af; font-family: var(--font-display);">${empresa}</span>
      </div>

      <div class="pdf-page-content" style="margin-top: 15px; gap: 15px;">
        <h2 style="font-size: 12px; font-weight: 800; color: #111111; margin-bottom: 5px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid #111111; padding-left: 8px;">
          6. Anexo de Trazabilidad, Confianza y Ajustes Contables
        </h2>
        <p style="font-size: 8.5px; color: #4b5563; margin-top: 0; margin-bottom: 5px; line-height: 1.4;">
          Detalle técnico de la auditoría algorítmica realizada sobre el libro diario contable, justificando los deméritos aplicados sobre el <em>Trust Score</em>, las anomalías detectadas, periodificaciones y alegaciones de defensa.
        </p>

        <div class="pdf-card pdf-avoid-break" style="padding: 10px !important;">
          <h3 style="font-size: 9px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; padding-bottom: 3px;">Auditoría de Confianza Contable (Trust Score)</h3>
          ${auditReasonsHtml}
        </div>

        <div class="pdf-card pdf-avoid-break" style="padding: 10px !important;">
          <h3 style="font-size: 9px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; padding-bottom: 3px;">Ajustes de Periodificación y Devengo Aprobados</h3>
          ${accrualsTableHtml}
        </div>

        <div class="pdf-card pdf-avoid-break" style="padding: 10px !important;">
          <h3 style="font-size: 9px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f3f4f6; padding-bottom: 3px;">Registro de Anomalías Contables Detectadas</h3>
          ${anomaliesListHtml}
        </div>

        <div class="pdf-card pdf-avoid-break" style="padding: 10px !important; border-left: 3px solid #5eaab5 !important;">
          <h3 style="font-size: 9px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; color: #3f7b84; border-bottom: 1px solid #e0f2f1; padding-bottom: 3px;">Alegaciones de Defensa CFO</h3>
          ${parseMarkdownToHtml(narratives.defensa)}
        </div>
      </div>

      <div class="pdf-footer">
        <span>Generado con FinTriage · Documento de Trabajo Confidencial</span>
        <span>Página 7 de 7</span>
      </div>
    </div>
  `;
}
