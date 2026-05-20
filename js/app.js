/**
 * app.js — Controlador principal. Navegación SPA, estado global,
 * orquestación de módulos y renderizado de todas las secciones.
 */

// ---- Integración con store.js (Fase 2) ----
// El objeto STATE y appStore se inicializan de forma reactiva en store.js

// Suscripciones reactivas principales
appStore.subscribe('analysisResult', () => {
  if (document.getElementById('section-dashboard').classList.contains('active')) {
    renderDashboard();
  }
});

appStore.subscribe('parsedLedger', (parsed) => {
  if (parsed) {
    renderParseSummary(parsed);
    if (parsed.anomalies) renderAnomalies(parsed.anomalies);
    if (parsed.entries) renderPreviewTable();
  }
});

// Suscripciones reactivas adicionales para Data Grids (Fase 7)
appStore.subscribe('ui.entries', () => {
  renderPreviewTable();
});

appStore.subscribe('ui.anomalyFilter', () => {
  if (STATE.parsedLedger && STATE.parsedLedger.anomalies) {
    renderAnomalies(STATE.parsedLedger.anomalies);
  }
  if (STATE.analysisResult) {
    renderActionableFindings();
  }
});

// Alerta reactiva en el menú de Defensa por Runway crítico (Libro Diario Real)
appStore.subscribe('analysisResult', (result) => {
  const navDefensa = document.getElementById('nav-defensa');
  if (!navDefensa) return;

  if (result && result.totales && result.totales.burnRateNeto > 0) {
    const runway = result.totales.cajaFinal / result.totales.burnRateNeto;
    if (runway < 3) {
      navDefensa.classList.add('pulse-danger');
      showToast('⚠️ Startup en Runway Crítico (< 3 meses). Se ha activado el Plan de Choque de 100 Días en la pestaña Defensa.', 'error', 6000);
      return;
    }
  }
  navDefensa.classList.remove('pulse-danger');
});

// Alerta reactiva en el menú de Defensa por Runway crítico (Datos Simulados)
appStore.subscribe('defensaSimulacionInputs', (inputs) => {
  const navDefensa = document.getElementById('nav-defensa');
  if (!navDefensa) return;

  if (inputs) {
    const burn = Math.max(0, inputs.gastos - inputs.ingresos);
    if (burn > 0 && (inputs.caja / burn) < 3) {
      navDefensa.classList.add('pulse-danger');
      showToast('⚠️ Simulación: Runway Crítico (< 3 meses). Plan de Choque generado en la pestaña Defensa.', 'error', 5000);
      return;
    }
  }
  
  // Si hay análisis real con runway crítico, lo dejamos activo
  if (STATE.analysisResult && STATE.analysisResult.totales && STATE.analysisResult.totales.burnRateNeto > 0) {
    const runway = STATE.analysisResult.totales.cajaFinal / STATE.analysisResult.totales.burnRateNeto;
    if (runway < 3) return;
  }
  navDefensa.classList.remove('pulse-danger');
});

/** Registro de evento en Audit Trail */
function logAudit(action, detail = '') {
  STATE.auditTrail.push({
    ts: new Date().toISOString(),
    action,
    detail
  });
}

// ---- Toast ----
function showToast(msg, type = 'info', ms = 3500) {
  const container = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => div.remove(), ms);
}

// ---- Navegación SPA ----
/**
 * navigate(sectionId)
 * @description Transición visual entre secciones de la Single Page Application (SPA).
 * Oculta todas las secciones y muestra la seleccionada, actualizando la barra de navegación.
 * @param {string} sectionId - El ID de la sección a mostrar (ej. 'dashboard', 'scoring').
 * @returns {void}
 */
function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('section-' + sectionId);
  const nav = document.getElementById('nav-' + sectionId);
  if (sec) sec.classList.add('active');
  if (nav) nav.classList.add('active');

  // Control de botones de exportación superior
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportExcel = document.getElementById('btn-export-excel');
  const btnExportAgentic = document.getElementById('btn-export-agentic');
  const exportSep = document.getElementById('export-sep');
  
  if (STATE.analysisResult && (sectionId === 'dashboard' || sectionId === 'forecast' || sectionId === 'scoring')) {
    if (btnExportPdf) btnExportPdf.style.display = 'block';
    if (btnExportExcel) btnExportExcel.style.display = 'block';
    if (btnExportAgentic) btnExportAgentic.style.display = 'block';
    if (exportSep) exportSep.style.display = 'block';
  } else {
    if (btnExportPdf) btnExportPdf.style.display = 'none';
    if (btnExportExcel) btnExportExcel.style.display = 'none';
    if (btnExportAgentic) btnExportAgentic.style.display = 'none';
    if (exportSep) exportSep.style.display = 'none';
  }

  // Renderizar sección si tiene datos
  if (sectionId === 'dashboard' && STATE.analysisResult) renderDashboard();
  if (sectionId === 'scoring') renderScorer();
  if (sectionId === 'forecast') renderForecast();
  if (sectionId === 'defensa') renderDefensa();
  if (sectionId === 'cartera') renderCarteraTab();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.section));
});

// Prevent global accidental drops from opening the file
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

// ---- DROP ZONE ---- 
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('drag-over');
});
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropzone.classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// ---- Perfil ----
/**
 * renderProfileGrid()
 * @description Dibuja en el DOM las tarjetas de selección de perfil de negocio (SaaS, Industrial, etc.).
 * @returns {void}
 */
function renderProfileGrid() {
  const grid = document.getElementById('profile-grid');
  grid.innerHTML = BUSINESS_PROFILES.map(p => `
    <div class="profile-card" data-profile="${p.id}" role="button" tabindex="0" aria-label="Perfil ${p.name}">
      <span class="profile-icon">${p.icon}</span>
      <div class="profile-name">${p.name}</div>
      <div class="profile-desc">${p.desc}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => selectProfile(card.dataset.profile));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') selectProfile(card.dataset.profile);
    });
  });
}

function selectProfile(profileId) {
  STATE.selectedProfile = BUSINESS_PROFILES.find(p => p.id === profileId);
  document.querySelectorAll('.profile-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.profile === profileId);
  });
  document.getElementById('empresa-form').style.display = 'flex';
  document.getElementById('btn-analizar').disabled = false;
}

// ---- Manejo de archivo ----
/**
 * handleFile(file)
 * @description Punto de entrada principal para el archivo Excel. Valida la extensión, invoca el parser 
 * asíncrono y, si tiene éxito, actualiza la interfaz mostrando el resumen del parseo y las anomalías.
 * @param {File} file - El archivo Excel (.xlsx) arrastrado o seleccionado por el usuario.
 * @returns {Promise<void>}
 */
async function handleFile(file) {
  if (!file.name.match(/\.xlsx?$/i)) {
    showToast('Solo se aceptan archivos .xlsx', 'error');
    return;
  }

  // Mostrar selector de perfil
  document.getElementById('profile-selector').style.display = 'block';
  renderProfileGrid();

  // Reset
  document.getElementById('parse-progress').classList.remove('show');
  document.getElementById('parse-summary').classList.remove('show');
  document.getElementById('preview-section').style.display = 'none';
  document.getElementById('anomaly-section').style.display = 'none';
  
  const ctxBar = document.getElementById('goto-context-bar');
  if (ctxBar) ctxBar.style.display = 'none';
  const mappingBar = document.getElementById('goto-mapping-bar');
  if (mappingBar) mappingBar.style.display = 'none';
  const mappingSec = document.getElementById('mapping-section');
  if (mappingSec) mappingSec.style.display = 'none';
  const contextSec = document.getElementById('context-section');
  if (contextSec) contextSec.style.display = 'none';

  showToast(`Archivo "${file.name}" listo. Selecciona el perfil de empresa.`, 'info');

  // Guardar archivo para cuando el usuario pulse Analizar
  STATE._pendingFile = file;
}

// ---- PASO 1: Analizar y Extraer ----
document.getElementById('btn-analizar').addEventListener('click', async () => {
  if (!STATE._pendingFile) return;
  if (!STATE.selectedProfile) {
    showToast('Selecciona un perfil de empresa primero', 'error');
    return;
  }

  // Capturar datos empresa
  STATE.empresa.nombre    = document.getElementById('input-empresa-nombre').value || STATE._pendingFile.name;
  STATE.empresa.sector    = document.getElementById('input-empresa-sector').value || '';
  STATE.empresa.empleados = parseInt(document.getElementById('input-empresa-empleados').value) || 0;

  document.getElementById('btn-analizar').disabled = true;

  const progress = document.getElementById('parse-progress');
  const bar = document.getElementById('progress-bar');
  const pctLabel = document.getElementById('progress-pct');
  const txtLabel = document.getElementById('progress-text');
  const logEl = document.getElementById('parse-log');

  progress.classList.add('show');
  logEl.innerHTML = '';

  try {
    const parsed = await parseLedgerFile(STATE._pendingFile, ({ pct, text, log }) => {
      if (pct !== undefined) {
        bar.style.width = pct + '%';
        pctLabel.textContent = pct + '%';
      }
      if (text) txtLabel.textContent = text;
      if (log) {
        const [type, msg] = log.split('|');
        const span = document.createElement('div');
        span.className = `log-${type === 'ok' ? 'ok' : type === 'warn' ? 'warn' : 'err'}`;
        span.textContent = (type === 'ok' ? '✓ ' : type === 'warn' ? '⚠ ' : '✗ ') + (msg || log);
        logEl.appendChild(span);
        logEl.scrollTop = logEl.scrollHeight;
      }
    });

    STATE.parsedLedger = parsed;
    logAudit('Archivo cargado', `${parsed.meta.fileName} · ${parsed.meta.totalEntries} asientos · ${parsed.meta.months.length} meses · ${parsed.anomalies.length} anomalías parser`);

    // Actualizar badge empresa (temporalmente hasta el dashboard)
    const nombre = STATE.empresa.nombre || parsed.meta.fileName;
    document.getElementById('empresa-badge').textContent =
      `${nombre} · ${STATE.selectedProfile.icon} ${STATE.selectedProfile.name}`;

    // Mostrar resumen del parseo
    renderParseSummary(parsed);
    renderAnomalies(parsed.anomalies);
    renderPreviewTable(parsed.entries.slice(0, 50));

    // Mostrar botón para el paso 2 (Contexto)
    document.getElementById('goto-context-bar').style.display = 'block';
    
    // Auto scroll para que sea evidente
    document.getElementById('goto-context-bar').scrollIntoView({ behavior: 'smooth', block: 'center' });

    showToast('Ingesta completada ✓. Pasa a definir el contexto.', 'success');

  } catch (err) {
    console.error(err);
    showToast('Error al procesar el archivo: ' + err.message, 'error', 6000);
    const span = document.createElement('div');
    span.className = 'log-err';
    span.textContent = '✗ Error: ' + err.message;
    logEl.appendChild(span);
  } finally {
    document.getElementById('btn-analizar').disabled = false;
  }
});

// ---- Render: Parse Summary ----
function renderParseSummary(parsed) {
  const s = document.getElementById('parse-summary');
  s.classList.add('show');

  // En el resumen ahora solo enseñamos datos de volumen (aún no se han analizado ingresos/gastos exactos)
  document.getElementById('sum-meses').textContent     = parsed.meta.months.length;
  document.getElementById('sum-asientos').textContent  = parsed.meta.totalEntries.toLocaleString('es-ES');
  document.getElementById('sum-cuentas').textContent   = parsed.meta.totalCuentas;
  document.getElementById('sum-ingresos').textContent  = '—'; // Se calculará en el Dashboard
  document.getElementById('sum-gastos').textContent    = '—'; // Se calculará en el Dashboard
  document.getElementById('sum-anomalias').textContent = parsed.anomalies.length;
}

// ---- Auxiliares Contables y Data Grids (Fase 7) ----
function getAnomalyContextKey(a) {
  const context = a.month || a.cuenta || (a.detail ? a.detail.substring(0, 35).trim() : 'global');
  return `${a.id}_${context}`;
}

function getPaginatedEntries(entries, config) {
  if (!entries) return { paginated: [], totalItems: 0 };
  
  // 1. Filtrado
  const filterText = (config.filterText || '').trim().toLowerCase();
  let filtered = entries;
  if (filterText) {
    filtered = entries.filter(e => {
      const cuentaStr = (e.cuenta || '').toString().toLowerCase();
      const descStr = (e.descripcion || '').toString().toLowerCase();
      return cuentaStr.includes(filterText) || descStr.includes(filterText);
    });
  }
  
  // 2. Ordenación
  const sortCol = config.sortColumn || 'fecha';
  const sortDir = config.sortDirection === 'asc' ? 1 : -1;
  
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    
    if (valA === undefined || valA === null) valA = typeof valB === 'number' ? 0 : '';
    if (valB === undefined || valB === null) valB = typeof valA === 'number' ? 0 : '';
    
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * sortDir;
    }
    
    const strA = String(valA);
    const strB = String(valB);
    return (strA < strB ? -1 : strA > strB ? 1 : 0) * sortDir;
  });
  
  // 3. Paginación
  const totalItems = sorted.length;
  const start = (config.currentPage - 1) * config.pageSize;
  const paginated = sorted.slice(start, start + config.pageSize);
  
  return { paginated, totalItems };
}

// ---- Render: Anomalías (Modulado & Limpio) ----
function generateAnomaliesHTML(filtered) {
  return filtered.map((a) => {
    let sevClass = a.severity;
    if (!['critical', 'high', 'medium', 'low'].includes(sevClass)) sevClass = 'low';
    let icon = '🟢';
    if (a.severity === 'critical') icon = '⛔';
    else if (a.severity === 'high') icon = '🔴';
    else if (a.severity === 'medium') icon = '🟡';
    
    const compositeKey = getAnomalyContextKey(a);
    const isExpanded = STATE.ui.expandedAnomalies.includes(compositeKey);
    const expandIndicator = `<span class="expand-indicator">▶</span>`;
    
    let html = `
    <div class="anomaly-item sev-${sevClass} master-row ${isExpanded ? 'expanded' : ''}" data-composite-key="${compositeKey}">
      <div class="anomaly-item-inner">
        <span class="anomaly-icon">${icon}</span>
        <div class="anomaly-item-text">
          <strong class="anomaly-item-title">${expandIndicator}${a.message}</strong>
          <div class="anomaly-item-meta">Cuenta: <code class="cuenta-code">${a.cuenta || 'n/a'}</code> | Contexto: ${a.month || 'Global'}</div>
        </div>
      </div>
    `;
    
    if (isExpanded) {
      const rec = FINDING_RECOMMENDATIONS[a.id] || { 
        impacto: a.detail || 'Impacto técnico en la consistencia de los saldos.', 
        rec: 'Revisar la documentación asociada a esta partida para justificar su registro contable.', 
        efectoFinanciacion: 'Puede generar dudas o aclaraciones en procesos de auditoría.', 
        accion: 'Análisis' 
      };
      html += `
      <div class="detail-row anomaly-detail-card">
        <div class="detail-container">
          <div class="detail-block">
            <span class="detail-label">Impacto:</span>
            <span class="detail-value">${rec.impacto}</span>
          </div>
          <div class="detail-block">
            <span class="detail-label">Recom.:</span>
            <span class="detail-value detail-value-highlight">${rec.rec}</span>
          </div>
          <div class="detail-block">
            <span class="detail-label">CDTI/ENISA:</span>
            <span class="detail-value detail-value-warning">${rec.efectoFinanciacion}</span>
          </div>
          <div class="detail-block">
            <span class="detail-label">Detalle:</span>
            <span class="detail-value">${a.detail || '—'}</span>
          </div>
        </div>
      </div>
      `;
    }
    
    html += `</div>`;
    return html;
  }).join('');
}

function bindAnomaliesListeners(list, anomalies) {
  list.querySelectorAll('.master-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.detail-row')) return;
      
      const compositeKey = row.dataset.compositeKey;
      const index = STATE.ui.expandedAnomalies.indexOf(compositeKey);
      if (index === -1) {
        STATE.ui.expandedAnomalies.push(compositeKey);
      } else {
        STATE.ui.expandedAnomalies.splice(index, 1);
      }
      renderAnomalies(anomalies);
    });
  });
}

function renderAnomalies(anomalies) {
  const sec = document.getElementById('anomaly-section');
  const list = document.getElementById('anomaly-list');
  if (!anomalies.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';

  // Calcular contadores
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const mediumCount = anomalies.filter(a => a.severity === 'medium').length;
  const lowCount = anomalies.filter(a => a.severity === 'low').length;
  const allCount = anomalies.length;

  // Actualizar los textos y contadores en los botones de Ingesta
  const allBtn = document.querySelector('#anomaly-pills [data-severity="all"]');
  const criticalBtn = document.querySelector('#anomaly-pills [data-severity="critical"]');
  const highBtn = document.querySelector('#anomaly-pills [data-severity="high"]');
  const mediumBtn = document.querySelector('#anomaly-pills [data-severity="medium"]');
  const lowBtn = document.querySelector('#anomaly-pills [data-severity="low"]');

  if (allBtn) allBtn.textContent = `🔍 Todas (${allCount})`;
  if (criticalBtn) criticalBtn.textContent = `⛔ Críticas (${criticalCount})`;
  if (highBtn) highBtn.textContent = `🔴 Altas (${highCount})`;
  if (mediumBtn) mediumBtn.textContent = `🟡 Medias (${mediumCount})`;
  if (lowBtn) lowBtn.textContent = `🟢 Bajas (${lowCount})`;

  // Sincronizar pills activas en Ingesta
  const uploadPills = document.querySelectorAll('#anomaly-pills .pill-btn');
  uploadPills.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.severity === STATE.ui.anomalyFilter);
  });
  
  // Aplicar filtro de severidad
  const filtered = anomalies.filter(a => {
    return STATE.ui.anomalyFilter === 'all' || a.severity === STATE.ui.anomalyFilter;
  });
  
  if (!filtered.length) {
    list.innerHTML = `<div class="anomaly-empty-state">Ninguna anomalía con severidad "${STATE.ui.anomalyFilter === 'critical' ? 'Crítica' : STATE.ui.anomalyFilter === 'high' ? 'Alta' : STATE.ui.anomalyFilter === 'medium' ? 'Media' : 'Baja'}"</div>`;
    return;
  }

  // Render detail rows expandibles
  list.innerHTML = generateAnomaliesHTML(filtered);
  
  // Agregar listeners a las master-rows
  bindAnomaliesListeners(list, anomalies);
}

// ---- Render: Preview Table ----
// ---- Render: Preview Table ----
function generatePreviewRowsHTML(paginated) {
  return paginated.map(e => `
    <tr>
      <td>${e.monthKey}</td>
      <td>${e.fecha || '—'}</td>
      <td>${e.asiento || '—'}</td>
      <td><code class="cuenta-code">${e.cuenta}</code></td>
      <td class="td-ellipsis" title="${e.descripcion}">${e.descripcion || '—'}</td>
      <td class="td-num ${e.debe > 0 ? 'td-debit' : ''}">${e.debe > 0 ? e.debe.toLocaleString('es-ES', {minimumFractionDigits:2}) : '—'}</td>
      <td class="td-num ${e.haber > 0 ? 'td-credit' : ''}">${e.haber > 0 ? e.haber.toLocaleString('es-ES', {minimumFractionDigits:2}) : '—'}</td>
    </tr>
  `).join('');
}

function updatePreviewSortingHeaders() {
  const headers = document.querySelectorAll('#preview-table th.clickable-header');
  headers.forEach(th => {
    const col = th.dataset.column;
    th.classList.remove('sort-asc', 'sort-desc');
    if (col === STATE.ui.entries.sortColumn) {
      th.classList.add(STATE.ui.entries.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function updatePreviewPagination(totalItems) {
  const infoEl = document.getElementById('preview-pagination-info');
  const pageCurrentEl = document.getElementById('preview-page-current');
  if (infoEl && pageCurrentEl) {
    const totalPages = Math.max(1, Math.ceil(totalItems / STATE.ui.entries.pageSize));
    const startItem = totalItems === 0 ? 0 : (STATE.ui.entries.currentPage - 1) * STATE.ui.entries.pageSize + 1;
    const endItem = Math.min(totalItems, STATE.ui.entries.currentPage * STATE.ui.entries.pageSize);
    
    infoEl.textContent = `Mostrando ${startItem} - ${endItem} de ${totalItems.toLocaleString('es-ES')} asientos`;
    pageCurrentEl.textContent = `Pág. ${STATE.ui.entries.currentPage} de ${totalPages}`;
    
    document.getElementById('btn-page-first').disabled = STATE.ui.entries.currentPage === 1;
    document.getElementById('btn-page-prev').disabled = STATE.ui.entries.currentPage === 1;
    document.getElementById('btn-page-next').disabled = STATE.ui.entries.currentPage === totalPages;
    document.getElementById('btn-page-last').disabled = STATE.ui.entries.currentPage === totalPages;
  }
}

function renderPreviewTable() {
  if (!STATE.parsedLedger || !STATE.parsedLedger.entries) return;
  
  const sec = document.getElementById('preview-section');
  const tbody = document.getElementById('preview-tbody');
  if (!sec || !tbody) return;
  
  sec.style.display = 'block';
  
  // Sincronizar el input de búsqueda si es necesario
  const searchInput = document.getElementById('preview-search');
  if (searchInput && searchInput.value !== STATE.ui.entries.filterText) {
    searchInput.value = STATE.ui.entries.filterText;
  }
  
  const { paginated, totalItems } = getPaginatedEntries(STATE.parsedLedger.entries, STATE.ui.entries);
  
  tbody.innerHTML = generatePreviewRowsHTML(paginated);
  updatePreviewSortingHeaders();
  updatePreviewPagination(totalItems);

  // Los eventos de paginación, búsqueda y ordenación se gestionan exclusivamente
  // por el handler delegado en initPreviewGridListeners() (registrado una sola vez
  // en document). No se reasignan aquí para evitar doble disparo (double-fire)
  // que anula el toggle asc/desc en clicks sucesivos sobre la misma cabecera.
}

// ---- PASO 2: Contexto Contable ----
document.getElementById('btn-goto-context').addEventListener('click', () => {
  document.getElementById('goto-context-bar').style.display = 'none';
  const contextSec = document.getElementById('context-section');
  contextSec.style.display = 'block';
  contextSec.scrollIntoView({ behavior: 'smooth' });
});

// ---- PASO 3: Mapeo Humano ----
document.getElementById('btn-goto-mapping').addEventListener('click', () => {
  // Capturar datos del contexto
  const distortions = [];
  ['extraordinary_ops', 'high_capex', 'annual_costs', 'financing_event'].forEach(d => {
    if (document.getElementById(`ctx-dist-${d}`).checked) distortions.push(d);
  });

  const cfoConfidence = parseInt(document.getElementById('ctx-cfoConfidence').value) || 5;

  STATE.contextChecklist = {
    coveragePeriod: document.getElementById('ctx-coveragePeriod').value,
    closeStatus: document.getElementById('ctx-closeStatus').value,
    externalReview: document.getElementById('ctx-externalReview').value,
    bridgeAccounts: document.getElementById('ctx-bridgeAccounts').value,
    reconciliationIssues: document.getElementById('ctx-reconciliationIssues').value,
    publicDebtRisk: document.getElementById('ctx-publicDebtRisk').value,
    cfoConfidence: cfoConfidence,
    distortions: distortions
  };

  logAudit('Contexto Contable definido', 'Confianza CFO: ' + cfoConfidence);

  // Ocultar sección de contexto y mostrar mapeo
  document.getElementById('context-section').style.display = 'none';
  const mappingSec = document.getElementById('mapping-section');
  mappingSec.style.display = 'block';
  
  renderMappingTable();
  mappingSec.scrollIntoView({ behavior: 'smooth' });
});

function renderMappingTable() {
  const entries = STATE.parsedLedger.entries;
  
  // Extraer cuentas únicas y sus descripciones base
  const accInfo = {};
  for (const e of entries) {
    if (!accInfo[e.cuenta]) {
      accInfo[e.cuenta] = { cuenta: e.cuenta, desc: e.descripcion, saldoNeto: 0, grupo: e.grupo };
    }
    // Ingresos: Haber - Debe. Gastos: Debe - Haber
    const isIngreso = e.grupo === '7';
    accInfo[e.cuenta].saldoNeto += isIngreso ? (e.haber - e.debe) : (e.debe - e.haber);
  }

  const uniqueCuentas = Object.keys(accInfo);
  
  // Construir mapa de descripciones
  const descripcionesMap = {};
  for (const cta of uniqueCuentas) {
    descripcionesMap[cta] = accInfo[cta]?.desc || '';
  }

  // Inicializamos el mapeo default
  if (!STATE.customMapping) {
    STATE.customMapping = getDefaultMapping(uniqueCuentas, STATE.selectedProfile.id, descripcionesMap);
  }

  // Filtrar para mostrar sólo grupos 6 y 7 (PyG) con saldo relevante
  const cuentasPyg = Object.values(accInfo)
    .filter(a => (a.grupo === '6' || a.grupo === '7') && Math.abs(a.saldoNeto) > 10)
    .sort((a, b) => Math.abs(b.saldoNeto) - Math.abs(a.saldoNeto)); // Mayor a menor

  const tbody = document.getElementById('mapping-tbody');
  
  // Opciones del select a partir de CATEGORIAS_ANALITICAS
  const optionsHtml = Object.entries(CATEGORIAS_ANALITICAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  tbody.innerHTML = cuentasPyg.map(cta => {
    const currCategory = STATE.customMapping[cta.cuenta] || 'ignorar';
    const isIngreso = cta.grupo === '7';
    const colorClass = isIngreso ? 'td-credit' : 'td-debit';
    
    // Obtener heurística SaaS
    const heuristic = getSaaSHeuristic(cta.cuenta, cta.desc, STATE.selectedProfile.id);
    let heuristicBadgeHtml = '<span class="heuristic-badge-none">—</span>';
    let rowReviewClass = '';
    
    if (heuristic) {
      if (heuristic.confidence === 'high') {
        const catLabel = CATEGORIAS_ANALITICAS[heuristic.suggestedCategory] || heuristic.suggestedCategory;
        heuristicBadgeHtml = `
          <div class="heuristic-tooltip">
            <span class="heuristic-badge heuristic-badge-high">✓ Auto: ${catLabel}</span>
            <span class="tooltip-text">${heuristic.reason}</span>
          </div>
        `;
      } else if (heuristic.confidence === 'medium') {
        const catLabel = CATEGORIAS_ANALITICAS[heuristic.suggestedCategory] || heuristic.suggestedCategory;
        rowReviewClass = 'row-review-pending';
        heuristicBadgeHtml = `
          <div class="heuristic-tooltip">
            <span class="heuristic-badge heuristic-badge-medium">⚠ Sugerido: ${catLabel}</span>
            <span class="tooltip-text">${heuristic.reason} (Hacer click en select para confirmar)</span>
          </div>
        `;
      }
    }
    
    return `
      <tr class="${rowReviewClass}" data-row-cuenta="${cta.cuenta}">
        <td><code class="cuenta-code font-bold">${cta.cuenta}</code></td>
        <td class="td-ellipsis" title="${cta.desc}">
          ${cta.desc || '—'}
        </td>
        <td class="td-num ${colorClass} font-bold">
          ${cta.saldoNeto.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}
        </td>
        <td>
          ${heuristicBadgeHtml}
        </td>
        <td>
          <select data-cuenta="${cta.cuenta}" class="mapping-select">
            ${optionsHtml}
          </select>
        </td>
      </tr>
    `;
  }).join('');

  // Establecer los valores guardados
  document.querySelectorAll('.mapping-select').forEach(sel => {
    const cta = sel.dataset.cuenta;
    sel.value = STATE.customMapping[cta] || 'ignorar';
    
    // Listener para actualizar el diccionario si cambian la opción
    sel.addEventListener('change', (e) => {
      STATE.customMapping[cta] = e.target.value;
      
      // Quitar estado "revisar" de la fila tras interacción del usuario
      const tr = document.querySelector(`tr[data-row-cuenta="${cta}"]`);
      if (tr && tr.classList.contains('row-review-pending')) {
        tr.classList.remove('row-review-pending');
      }
    });
  });

  // Mostrar botón para ir al paso 3 (Periodificaciones)
  document.getElementById('goto-accruals-bar').style.display = 'block';
}

// ---- PASO 3: Periodificaciones (Devengo) ----
document.getElementById('btn-goto-accruals').addEventListener('click', () => {
  document.getElementById('goto-accruals-bar').style.display = 'none';
  const accrualSec = document.getElementById('accruals-section');
  accrualSec.style.display = 'block';
  
  renderAccrualsTable();
  accrualSec.scrollIntoView({ behavior: 'smooth' });
});

function renderAccrualsTable() {
  // Detectar candidatos basados en el mapeo personalizado recién aprobado
  const candidates = detectAccrualCandidates(
    STATE.parsedLedger.entries,
    STATE.customMapping,
    STATE.parsedLedger.meta.months
  );

  STATE.accrualCandidates = candidates;
  STATE.approvedAccruals = []; // Limpiamos

  const emptyState = document.getElementById('accruals-empty');
  const contentState = document.getElementById('accruals-content');
  const tbody = document.getElementById('accruals-tbody');

  if (candidates.length === 0) {
    emptyState.style.display = 'block';
    contentState.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    contentState.style.display = 'block';
    
    tbody.innerHTML = candidates.map((c, i) => `
      <tr>
        <td class="text-center">
          <input type="checkbox" class="accrual-checkbox" data-index="${i}" />
        </td>
        <td><code class="cuenta-code font-bold">${c.cuenta}</code></td>
        <td class="td-ellipsis" title="${c.descripcion}">${c.descripcion}</td>
        <td>${c.mesOrigen}</td>
        <td class="td-num td-debit font-bold">${c.importeTotal.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
        <td class="td-num td-credit font-bold">${c.importeMensual.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
      </tr>
    `).join('');

    // Listeners
    document.querySelectorAll('.accrual-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const idx = e.target.dataset.index;
        const cand = STATE.accrualCandidates[idx];
        if (e.target.checked) {
          STATE.approvedAccruals.push(cand);
        } else {
          STATE.approvedAccruals = STATE.approvedAccruals.filter(a => a.cuenta !== cand.cuenta);
        }
      });
    });
  }
}

// ---- PASO 4: Goto Dashboard ----
document.getElementById('btn-goto-dashboard').addEventListener('click', () => {
  // Gate de anomalías críticas: bloqueo visual, no funcional.
  // Solo bloqueamos si el parseo mismo falló (0 entries válidas).
  // Si hay anomalías críticas pero el libro tiene datos, dejamos pasar con advertencia.
  if (STATE.parsedLedger && STATE.parsedLedger.anomalies) {
    const hasCritical = STATE.parsedLedger.anomalies.some(a => a.severity === 'critical');
    const hasValidEntries = STATE.parsedLedger.entries && STATE.parsedLedger.entries.length > 0;
    if (hasCritical && !hasValidEntries) {
      showToast('⛔ Parseo fallido: No hay asientos válidos. Revisa el archivo.', 'error', 6000);
      return;
    }
    if (hasCritical) {
      showToast('⚠️ Anomalías CRÍTICAS detectadas. El análisis se generará como ORIENTATIVO.', 'warn', 5000);
    }
  }

  // Ejecutamos el analysis final con el custom mapping, devengos aprobados y contexto
  STATE.analysisResult = analyzeLedger(
    STATE.parsedLedger, 
    STATE.selectedProfile.id, 
    STATE.customMapping,
    STATE.approvedAccruals || [],
    STATE.contextChecklist
  );
  
  // Flag para el checklist
  STATE.accrualsReviewed = true;

  // Audit trail
  const remappedCount = STATE.customMapping ? Object.keys(STATE.customMapping).length : 0;
  const accrualCount = (STATE.approvedAccruals || []).length;
  logAudit('Perfil seleccionado', `${STATE.selectedProfile.name} (${STATE.selectedProfile.id})`);
  if (remappedCount > 0) logAudit('Remapeo manual', `${remappedCount} cuentas reclasificadas`);
  if (accrualCount > 0) logAudit('Devengos aprobados', `${accrualCount} periodificaciones aplicadas`);
  logAudit('Dashboard generado', `Trust Score: ${STATE.analysisResult.confidence.trustScore}/100 · Confianza: ${STATE.analysisResult.confidence.confidenceLabel} · EBITDA Suspect: ${STATE.analysisResult.confidence.ebitdaSuspect ? 'SÍ' : 'NO'}`);

  // Pre-calcular scoring con defaults (inputs vacíos) para que el tab ya tenga datos
  STATE.scoringResult = scoreFinanciacion(STATE.analysisResult, STATE.scoringInputs || {});

  // Pre-calcular forecast con defaults del perfil seleccionado
  if (typeof buildForecast === 'function') {
    FORECAST_HYP = null; // reset para que _getDefaultHyp() use el perfil actual
    STATE.forecastResult = buildForecast(STATE.analysisResult, _getDefaultHyp());
  }
  
  // Actualizamos sum-ingresos y sum-gastos en el step 1 por completitud (opcional pero queda bien)
  document.getElementById('sum-ingresos').textContent =
    new Intl.NumberFormat('es-ES', {maximumFractionDigits:0}).format(STATE.analysisResult.totales.ingresos) + '€';
  document.getElementById('sum-gastos').textContent =
    new Intl.NumberFormat('es-ES', {maximumFractionDigits:0}).format(STATE.analysisResult.totales.gastos) + '€';

  showToast('Dashboard analítico generado', 'success');
  navigate('dashboard');
});

// ---- Render: Dashboard ----
function renderDashboard() {
  if (!STATE.analysisResult) return;
  const data = STATE.analysisResult;
  const profile = STATE.selectedProfile;
  const confidence = data.confidence || {};

  // Banner de Confianza (Nuevo Fase 5)
  const banner = document.getElementById('dashboard-confidence-banner');
  if (banner) {
    if (confidence.confidenceLevel !== 'reliable') {
      banner.className = `confidence-banner ${confidence.confidenceLevel}`;
      banner.style.display = 'block';
      banner.innerHTML = `
        <div class="confidence-banner-inner">
          <span class="confidence-banner-icon">⚠️</span>
          <div class="confidence-banner-text">
            <strong>Análisis ${confidence.confidenceLabel}:</strong> ${confidence.analysisLimitations.join(' ')}
          </div>
        </div>
      `;
    } else {
      banner.style.display = 'none';
    }
  }

  const title = document.getElementById('dashboard-title');
  const subtitle = document.getElementById('dashboard-subtitle');
  const empresa = STATE.empresa.nombre || data.meta.fileName;

  title.textContent = `Dashboard — ${empresa}`;
  subtitle.textContent = `${profile?.name || 'Genérico'} · Periodo: ${data.meta.months[0]} → ${data.meta.months[data.meta.months.length - 1]}`;

  document.getElementById('dashboard-empty').style.display = 'none';
  document.getElementById('dashboard-content').style.display = 'block';

  // Trust Score
  renderTrustScore(data.confidence || { trustScore: 0, confidenceLabel: '', confidenceLevel: 'reliable' });

  // Audit Trail
  renderAuditTrail();

  // Hallazgos Accionables
  // Fuente canónica: analysisResult.anomalies (parser + analyzer combinadas)
  renderActionableFindings(STATE.analysisResult.anomalies || []);

  // Waterfall y Narrative
  renderWaterfall(data);
  if (typeof renderNarrative === 'function') renderNarrative();

  // KPIs universales
  const kpiUniversalEl = document.getElementById('kpi-universal');
  kpiUniversalEl.innerHTML = UNIVERSAL_KPIS.map(kpi => {
    const value = kpi.compute(data);
    let status = getKpiStatus(kpi, value);
    const formatted = formatKpiValue(value, kpi.format);
    let pulseClass = (kpi.id === 'runway' && value !== null && value < 3) ? 'pulse-danger' : '';
    let desc = kpi.desc;

    // Lógica para EBITDA Sospechoso
    if (kpi.id === 'ebitda' && confidence.ebitdaSuspect) {
      status = 'danger';
      pulseClass = 'pulse-danger';
      desc = '⚠️ EBITDA Sospechoso: Anomalías graves invalidan la integridad de esta métrica.';
    }

    return `
      <div class="kpi-card status-${status} ${pulseClass}" title="${desc}">
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${formatted}</div>
        <div class="kpi-sub ${(kpi.id === 'ebitda' && confidence.ebitdaSuspect) ? 'text-red' : ''}">${desc}</div>
        <div class="kpi-status">${getStatusIcon(status)}</div>
      </div>
    `;
  }).join('');

  // KPIs del perfil
  const perfilKpis = profile?.kpis || [];
  const kpiPerfilSection = document.getElementById('kpi-perfil-section');
  if (perfilKpis.length > 0) {
    kpiPerfilSection.style.display = 'block';
    document.getElementById('kpi-perfil-title').textContent = `KPIs ${profile.name}`;
    const kpiPerfilEl = document.getElementById('kpi-perfil');
    const kpiResults = {};

    kpiPerfilEl.innerHTML = perfilKpis.map(kpi => {
      const value = kpi.compute(data, kpiResults, STATE.extraInputs);
      kpiResults[kpi.id] = value;
      const status = getKpiStatus(kpi, value);
      const formatted = formatKpiValue(value, kpi.format);
      return `
        <div class="kpi-card status-${status}" title="${kpi.desc}">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${formatted}</div>
          <div class="kpi-sub">${kpi.desc}</div>
          <div class="kpi-status">${getStatusIcon(status)}</div>
        </div>
      `;
    }).join('');
  } else {
    kpiPerfilSection.style.display = 'none';
  }

  // PyG mensual
  renderPyG(data.pygMensual);
}

function renderPyG(pygMensual) {
  const months = Object.keys(pygMensual).sort();
  const head = document.getElementById('pyg-head');
  const body = document.getElementById('pyg-body');

  head.innerHTML = '<th>Partida</th>' + months.map(m => `<th>${m}</th>`).join('') + '<th>TOTAL</th>';

  const rows = [
    { key: 'ventas',            label: '📥 Ventas / Servicios' },
    { key: 'otrosIngresos',     label: '   Otros ingresos' },
    { key: 'totalIngresos',     label: '▶ Total Ingresos', bold: true, color: 'var(--cyan)' },
    { key: 'cogs',              label: '   (-) COGS', negate: true },
    { key: 'margenBruto',       label: '▶ Margen Bruto', bold: true },
    { key: 'personal',          label: '   (-) Personal', negate: true },
    { key: 'marketing',         label: '   (-) Marketing', negate: true },
    { key: 'serviciosOperativos', label: '   (-) Servicios Op.', negate: true },
    { key: 'tributos',          label: '   (-) Tributos', negate: true },
    { key: 'ebitda',            label: '▶ EBITDA', bold: true, color: 'var(--amber)' },
    { key: 'amortizacion',      label: '   (-) Amortización', negate: true },
    { key: 'ebit',              label: '▶ EBIT', bold: true },
    { key: 'gastosFinancieros', label: '   (-) Gtos. Financieros', negate: true },
    { key: 'resultadoNeto',     label: '▶ Resultado Neto', bold: true, color: 'var(--green)' }
  ];

  const fmt = (v) => v != null
    ? new Intl.NumberFormat('es-ES', {minimumFractionDigits:0, maximumFractionDigits:0}).format(v)
    : '—';

  body.innerHTML = rows.map(row => {
    let vals = months.map(m => pygMensual[m]?.[row.key] ?? 0);
    let total = vals.reduce((s, v) => s + v, 0);
    
    if (row.negate) {
      vals = vals.map(v => -Math.abs(v));
      total = -Math.abs(total);
    }
    
    let colorClass = '';
    if (row.color === 'var(--amber)') colorClass = 'text-amber';
    else if (row.color === 'var(--green)') colorClass = 'text-green';

    const rowClass = row.bold ? 'pyg-row-bold' : 'pyg-row-normal';

    return `<tr class="${rowClass}">
      <td class="${colorClass}">${row.label}</td>
      ${vals.map(v => `<td class="td-num ${colorClass} ${v < 0 ? 'text-red' : ''}">${fmt(v)}</td>`).join('')}
      <td class="td-num ${colorClass} ${total < 0 ? 'text-red' : ''}">${fmt(total)}</td>
    </tr>`;
  }).join('');
}

// Las funciones y UI del CFO Defense & Survival Cockpit han sido delegadas al módulo especializado js/defensa.js

// ---- Render: Waterfall Chart ----
/**
 * renderWaterfall(data)
 * @description Construye y renderiza un gráfico SVG nativo (Waterfall / Cascada) que visualiza la 
 * transformación desde los Ingresos Totales hasta la Caja Final.
 * @param {Object} data - Objeto AnalysisResult completo calculado por analyzer.js.
 * @returns {void}
 */
function renderWaterfall(data) {
  const container = document.getElementById('waterfall-container');
  if (!container) return;

  const t = data.totales;
  const ingresos = t.ingresos;
  const cogs = t.cogs;
  const margenBruto = ingresos - cogs;
  
  // Separar personal del resto del OPEX
  const personalTotal = Object.values(data.pygMensual).reduce((s, m) => s + m.personal, 0);
  const opexOperativo = t.gastos - t.cogs - (t.amortizacion || 0) - (t.gastosFinancieros || 0);
  const restoOpex = opexOperativo - personalTotal;
  const ebitda = t.ebitda;

  const steps = [
    { label: 'Ingresos', val: ingresos, type: 'total', color: 'var(--green)' },
    { label: 'COGS', val: -cogs, type: 'diff', color: 'var(--red)' },
    { label: 'Margen Bruto', val: margenBruto, type: 'subtotal', color: 'var(--cyan)' },
    { label: 'Personal', val: -personalTotal, type: 'diff', color: 'var(--amber)' },
    { label: 'Resto OPEX', val: -restoOpex, type: 'diff', color: 'var(--red)' },
    { label: 'EBITDA', val: ebitda, type: 'final', color: ebitda >= 0 ? 'var(--green)' : 'var(--red)' }
  ];

  const maxVal = Math.max(ingresos, margenBruto, ebitda) * 1.1; // 10% margen superior
  const minVal = Math.min(0, ebitda) * 1.1;
  const range = maxVal - minVal || 1;

  const W = 800, H = 220;
  const PAD = { t: 20, r: 20, b: 30, l: 60 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const yScale = v => PAD.t + iH - ((v - minVal) / range) * iH;
  const y0 = yScale(0); // linea base cero

  const barWidth = (iW / steps.length) * 0.7;
  const gap = (iW / steps.length) * 0.3;

  let currentY = y0;
  let svgContent = '';

  const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

  steps.forEach((s, i) => {
    const x = PAD.l + i * (barWidth + gap) + gap/2;
    let y, h;

    if (s.type === 'total' || s.type === 'subtotal' || s.type === 'final') {
      y = yScale(Math.max(0, s.val));
      h = Math.abs(yScale(s.val) - y0);
      currentY = yScale(s.val); // actualizar base para los diffs
    } else { // diff
      if (s.val < 0) {
        y = currentY; 
        h = yScale(s.val) - yScale(0); // el tamaño del salto hacia abajo
        currentY = y + h; // bajar la base
      } else {
        h = yScale(0) - yScale(s.val);
        y = currentY - h;
        currentY = y;
      }
    }

    svgContent += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${h || 1}" fill="${s.color}" rx="2" />
      <text x="${x + barWidth/2}" y="${y - 6}" text-anchor="middle" style="font-size:10px;fill:var(--text-primary);font-weight:600;">${s.type === 'diff' && s.val > 0 ? '+' : ''}${fmt(s.val)}</text>
      <text x="${x + barWidth/2}" y="${H - 10}" text-anchor="middle" style="font-size:10px;fill:var(--text-muted);">${s.label}</text>
    `;

    // Linea conectora
    if (i < steps.length - 1 && s.type !== 'subtotal' && steps[i+1].type !== 'subtotal' && steps[i+1].type !== 'final') {
      const nextX = x + barWidth;
      svgContent += `<line x1="${nextX}" y1="${currentY}" x2="${nextX + gap}" y2="${currentY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2"/>`;
    }
  });

  // Zero line
  if (y0 >= PAD.t && y0 <= PAD.t + iH) {
    svgContent += `<line x1="${PAD.l}" y1="${y0}" x2="${W - PAD.r}" y2="${y0}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
  }

  container.innerHTML = `
    <div class="card waterfall-card">
      <div class="card-title">🌉 Cascada de Rentabilidad (Periodo Acumulado)</div>
      <div class="waterfall-scroll-container">
        <svg viewBox="0 0 ${W} ${H}" class="waterfall-svg" style="max-width:${W}px;">
          ${svgContent}
        </svg>
      </div>
    </div>
  `;
}

// ---- Render: Trust Score ----
function renderTrustScore(confidence) {
  const el = document.getElementById('trust-score-value');
  const statusEl = document.getElementById('trust-score-status');
  if (!el || !statusEl) return;

  const score = confidence.trustScore;
  const confLabel = confidence.confidenceLabel;
  const confLevel = confidence.confidenceLevel;

  el.textContent = score;

  let color;
  if (score >= 80) { color = 'var(--green, #22c55e)'; }
  else if (score >= 60) { color = 'var(--amber, #f59e0b)'; }
  else if (score >= 40) { color = 'var(--amber, #f59e0b)'; }
  else { color = 'var(--danger, #ef4444)'; }

  el.style.color = color;
  statusEl.textContent = confLabel || (score >= 80 ? 'Alta Fiabilidad' : score >= 50 ? 'Fiabilidad Media' : 'Baja Fiabilidad');
  statusEl.style.color = color;
}

// ---- Render: Audit Trail ----
function renderAuditTrail() {
  const container = document.getElementById('audit-trail-content');
  if (!container) return;

  let html = '';

  // Bloque 1: Razones del Motor de Confianza
  const confidence = STATE.analysisResult?.confidence;
  if (confidence && confidence.auditReasons && confidence.auditReasons.length > 0) {
    html += `<div class="audit-section-header purple">⚙️ Confidence Engine Log</div>`;
    html += confidence.auditReasons.map(reason => `
      <div class="audit-reason-item">
        ${reason}
      </div>
    `).join('');
  }

  // Separador (si hay bloques anteriores y también hay log de sesión)
  if (html !== '' && STATE.auditTrail.length > 0) {
    html += `<div class="audit-divider"></div>`;
  }

  // Bloque 2: Registro de Sesión
  if (STATE.auditTrail.length > 0) {
    if (html !== '') {
      html += `<div class="audit-section-header cyan">👤 User Session Log</div>`;
    } else {
      // Si no hay auditReasons, el encabezado se añade igual
      html += `<div class="audit-section-header cyan">👤 User Session Log</div>`;
    }
    
    html += STATE.auditTrail.map(ev => {
      const time = new Date(ev.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<div class="audit-event-item">
        <span class="audit-event-time">${time}</span>
        <strong class="audit-event-action">${ev.action}</strong>
        <span class="audit-event-detail">${ev.detail}</span>
      </div>`;
    }).join('');
  }

  if (html === '') {
    html = '<span class="audit-empty-state">Sin eventos registrados.</span>';
  }

  container.innerHTML = html;
}

// ---- Render: Hallazgos Accionables ----
const FINDING_RECOMMENDATIONS = {
  'cifras_redondas':      { impacto: 'Posible estimación contable o facturación ficticia.', rec: 'Solicitar desglose de facturas.', accion: 'Revisión documental', efectoFinanciacion: 'Riesgo reputacional alto en due diligence.' },
  'facturas_domingo':     { impacto: 'Irregularidad temporal en registros.', rec: 'Verificar software contable.', accion: 'Entrevista', efectoFinanciacion: 'Cuestiona el control interno de la compañía.' },
  'duplicados_exactos':   { impacto: 'Doble contabilización infla gastos/ingresos.', rec: 'Conciliación bancaria.', accion: 'Ajuste contable', efectoFinanciacion: 'Deteriora la fiabilidad del EBITDA histórico.' },
  'margen_bruto_negativo':{ impacto: 'Venta por debajo de coste directo.', rec: 'Revisar pricing y COGS.', accion: 'Análisis pricing', efectoFinanciacion: 'Invalida elegibilidad ENISA por modelo no viable.' },
  'cliente_unico':        { impacto: 'Dependencia comercial extrema (>70%).', rec: 'Plan de diversificación.', accion: 'Estrategia comercial', efectoFinanciacion: 'Riesgo de concentración crítico para inversores.' },
  'cuota_personal_critica':{ impacto: 'Modelo no escalable; ingresos consumidos por nóminas.', rec: 'Optimización OpEx.', accion: 'Reestructuración', efectoFinanciacion: 'Dificulta la justificación de Neotec/I+D.' },
  'asiento_descuadrado':  { impacto: 'Invalida la integridad del libro mayor.', rec: 'Corregir descuadres.', accion: 'Bloqueo', efectoFinanciacion: 'Motivo de rechazo automático en cualquier auditoría.' },
  'ebitda_suspect':       { impacto: 'Métricas de rentabilidad no fiables.', rec: 'Presentar con disclaimer.', accion: 'Disclaimer', efectoFinanciacion: 'Afecta directamente al cálculo del préstamo ENISA.' },
  'prestamos_socios':     { impacto: 'Riesgo de fuga de capital o descapitalización.', rec: 'Documentar y liquidar si es posible.', accion: 'Préstamo Encubierto', efectoFinanciacion: 'Riesgo alto de rechazo en Due Diligence ENISA.' },
  'deuda_publica_alta':   { impacto: 'Excesiva deuda con Hacienda / Seg. Social.', rec: 'Priorizar liquidación antes de la solicitud.', accion: 'Alerta Pasivo Público', efectoFinanciacion: 'Bloquea la certificación de estar al corriente de pagos.' },
  'bankability_scaleup':  { impacto: 'La facturación valida un modelo avanzado (>500k).', rec: 'Migrar a BBVA Spark / DayOne + Qonto / Revolut.', accion: 'Diversificación Bancaria', efectoFinanciacion: 'Permite acceder a Venture Debt y financiación Growth.' },
  'descuadre_contable':   { impacto: 'Asientos descuadrados o diferencias de redondeo.', rec: 'Localizar el origen del descuadre en el diario y re-balancear asientos.', accion: 'Auditar Diario', efectoFinanciacion: 'Los descuadres de alta materialidad invalidan la contabilidad para análisis.' },
  'meses_sin_amortizacion': { impacto: 'Falta de amortizaciones en meses aislados o periodificación no lineal.', rec: 'Verificar si falta la cuota o si es criterio de cierre anual/trimestral.', accion: 'Conciliar PGC 68', efectoFinanciacion: 'Genera dudas técnicas de periodificación en auditoría.' },
  'variacion_brusca_ingresos': { impacto: 'Desviación mensual alta (>40%) en ingresos.', rec: 'Analizar estacionalidad o si hay facturas acumuladas erróneamente.', accion: 'Verificar Ventas', efectoFinanciacion: 'Cuestiona la estabilidad del MRR o facturación recurrente.' },
  'cuenta_129_detectada': { impacto: 'Presencia de cuenta 129 fuera de los meses de regularización o apertura.', rec: 'Ajustar apuntes intermedios para que vayan a cuentas de PyG del ejercicio.', accion: 'Ajustar Regulariz.', efectoFinanciacion: 'El uso disperso distorsiona los informes mensuales de pérdidas y ganancias.' }
};

function generateActionableFindingsHTML(actionable) {
  let html = `
    <div class="table-wrap">
      <table class="findings-table">
        <thead>
          <tr>
            <th class="col-icon"></th>
            <th>Hallazgo</th>
            <th>Impacto Simplificado</th>
            <th>Efecto en Financiación</th>
            <th>Severidad</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
  `;

  actionable.forEach((a) => {
    const ruleId = a.id;
    const rec = FINDING_RECOMMENDATIONS[ruleId] || { impacto: a.detail, efectoFinanciacion: 'Deteriora la credibilidad del análisis.', accion: 'Investigar', rec: 'Auditar la partida contable correspondiente.' };
    
    let sevIcon = '🟢';
    let sevLabel = 'Baja';
    if (a.severity === 'critical') {
      sevIcon = '⛔';
      sevLabel = 'Crítica';
    } else if (a.severity === 'high') {
      sevIcon = '🔴';
      sevLabel = 'Alta';
    } else if (a.severity === 'medium') {
      sevIcon = '🟡';
      sevLabel = 'Media';
    }
    
    const compositeKey = 'dash_' + getAnomalyContextKey(a);
    const isExpanded = STATE.ui.expandedAnomalies.includes(compositeKey);
    const expandIndicator = `<span class="expand-indicator">▶</span>`;

    html += `
      <tr class="master-row ${isExpanded ? 'expanded' : ''}" data-composite-key="${compositeKey}">
        <td>${sevIcon}</td>
        <td><strong>${expandIndicator} ${a.message}</strong></td>
        <td class="td-text-small">${rec.impacto}</td>
        <td class="td-defense-warning">${rec.efectoFinanciacion}</td>
        <td><span class="severity-badge ${a.severity}">${sevLabel}</span></td>
        <td><span class="badge-action">${rec.accion}</span></td>
      </tr>
    `;

    if (isExpanded) {
      html += `
        <tr class="detail-row">
          <td colspan="6">
            <div class="detail-container">
              <div class="detail-block">
                <span class="detail-label">Impacto Técnico:</span>
                <span class="detail-value">${a.detail || rec.impacto}</span>
              </div>
              <div class="detail-block">
                <span class="detail-label">Recomendación:</span>
                <span class="detail-value font-bold text-primary">${rec.rec}</span>
              </div>
              <div class="detail-block">
                <span class="detail-label">Acción Sugerida:</span>
                <span class="detail-value">${rec.accion}</span>
              </div>
            </div>
          </td>
        </tr>
      `;
    }
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  return html;
}

function bindActionableFindingsListeners(content) {
  content.querySelectorAll('.master-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.detail-row')) return;
      const compositeKey = row.dataset.compositeKey;
      const index = STATE.ui.expandedAnomalies.indexOf(compositeKey);
      if (index === -1) {
        STATE.ui.expandedAnomalies.push(compositeKey);
      } else {
        STATE.ui.expandedAnomalies.splice(index, 1);
      }
      renderActionableFindings();
    });
  });
}

function renderActionableFindings() {
  const section = document.getElementById('actionable-findings-section');
  const content = document.getElementById('actionable-findings-content');
  if (!section || !content || !STATE.analysisResult) return;

  const anomalies = STATE.analysisResult.anomalies || [];
  
  // Calcular contadores por severidad
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const highCount = anomalies.filter(a => a.severity === 'high').length;
  const mediumCount = anomalies.filter(a => a.severity === 'medium').length;
  const lowCount = anomalies.filter(a => a.severity === 'low').length;
  const allSevereCount = criticalCount + highCount + mediumCount;

  // Actualizar título del panel en Dashboard
  const cardTitle = document.querySelector('#actionable-findings-section .card-title');
  if (cardTitle) {
    cardTitle.textContent = `🚨 Hallazgos Accionables (${allSevereCount})`;
  }

  // Sincronizar pills activas en Dashboard
  const dashboardPills = document.querySelectorAll('#dashboard-anomaly-pills .pill-btn');
  dashboardPills.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.severity === STATE.ui.anomalyFilter);
  });

  // Actualizar los textos y contadores en los botones del Dashboard
  const allBtn = document.querySelector('#dashboard-anomaly-pills [data-severity="all"]');
  const criticalBtn = document.querySelector('#dashboard-anomaly-pills [data-severity="critical"]');
  const highBtn = document.querySelector('#dashboard-anomaly-pills [data-severity="high"]');
  const mediumBtn = document.querySelector('#dashboard-anomaly-pills [data-severity="medium"]');
  const lowBtn = document.querySelector('#dashboard-anomaly-pills [data-severity="low"]');

  if (allBtn) allBtn.textContent = `🔍 Todas (${allSevereCount})`;
  if (criticalBtn) criticalBtn.textContent = `⛔ Críticas (${criticalCount})`;
  if (highBtn) highBtn.textContent = `🔴 Altas (${highCount})`;
  if (mediumBtn) mediumBtn.textContent = `🟡 Medias (${mediumCount})`;
  if (lowBtn) lowBtn.textContent = `🟢 Bajas (${lowCount})`;

  // Filtrar el listado según el filtro seleccionado
  let actionable;
  if (STATE.ui.anomalyFilter === 'all') {
    // Por defecto (Todas) mostramos críticas + altas + medias
    actionable = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high' || a.severity === 'medium');
  } else {
    actionable = anomalies.filter(a => a.severity === STATE.ui.anomalyFilter);
  }

  if (!actionable.length) {
    if (STATE.ui.anomalyFilter === 'all') {
      section.style.display = 'none';
    } else {
      section.style.display = 'block';
      content.innerHTML = `<div class="findings-empty-state">No hay hallazgos accionables con severidad "${STATE.ui.anomalyFilter === 'critical' ? 'Crítica' : STATE.ui.anomalyFilter === 'high' ? 'Alta' : STATE.ui.anomalyFilter === 'medium' ? 'Media' : 'Baja'}"</div>`;
    }
    return;
  }

  section.style.display = 'block';
  content.innerHTML = generateActionableFindingsHTML(actionable);
  bindActionableFindingsListeners(content);
}

// matchFindingToRule eliminado (Sustituido por mapeo directo de IDs en Fase 5 Hardening)

// ---- Render: Biblioteca de Reglas de Anomalía ----
const RULE_DESCRIPTIONS = {
  'cifras_redondas':       'Detecta cuando >15% de los asientos tienen importes múltiplos exactos de 500€ o 1.000€. Indicador de estimaciones o facturas ficticias.',
  'facturas_domingo':      'Identifica asientos contables registrados en domingo, señal de manipulación temporal o errores de software contable.',
  'duplicados_exactos':    'Busca pares de asientos con fecha, cuenta, importe y descripción idénticos. Match cuádruple para evitar falsos positivos.',
  'margen_bruto_negativo': 'Alerta si el margen bruto es negativo en 2+ meses consecutivos, indicando que la empresa vende por debajo de su coste.',
  'cliente_unico':         'Detecta si una sola cuenta de ingresos concentra >70% de la facturación total. Riesgo de dependencia comercial.',
  'cuota_personal_critica':'Verifica si el gasto de personal supera el 80% de los ingresos en 3+ meses. Modelo de negocio no escalable.',
  'asiento_descuadrado':   'Valida la ecuación fundamental (Debe = Haber) por asiento individual. Un descuadre invalida el libro mayor completo.'
};

function renderRulesLibrary() {
  const tbody = document.getElementById('rules-library-body');
  if (!tbody || typeof ANOMALY_RULES === 'undefined') return;

  const sevBadge = (sev) => {
    const labels = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' };
    return `<span class="rules-sev-badge ${sev}">${labels[sev] || sev}</span>`;
  };

  tbody.innerHTML = ANOMALY_RULES.map(rule => `
    <tr>
      <td><code class="cuenta-code">${rule.id}</code></td>
      <td class="font-bold">${rule.label}</td>
      <td>${sevBadge(rule.severity)}</td>
      <td class="text-small">${RULE_DESCRIPTIONS[rule.id] || '—'}</td>
    </tr>
  `).join('');
}

// ---- Funciones de Inicialización de Listeners (Fase 7) ----
function initPreviewGridListeners() {
  // Delegar entrada del buscador (input) a nivel de document
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'preview-search') {
      STATE.ui.entries.filterText = e.target.value;
      STATE.ui.entries.currentPage = 1; // Reset to page 1
    }
  });

  const getPageCount = () => {
    const totalItems = STATE.parsedLedger?.entries 
      ? getPaginatedEntries(STATE.parsedLedger.entries, STATE.ui.entries).totalItems 
      : 0;
    return Math.max(1, Math.ceil(totalItems / STATE.ui.entries.pageSize));
  };

  // Delegar clicks en botones de paginación y cabeceras a nivel de document
  document.addEventListener('click', (e) => {
    // 1. Paginación
    const btnPage = e.target.closest('button[id^="btn-page-"]');
    if (btnPage) {
      e.preventDefault();
      const id = btnPage.id;
      if (id === 'btn-page-first') {
        STATE.ui.entries.currentPage = 1;
      } else if (id === 'btn-page-prev') {
        STATE.ui.entries.currentPage = Math.max(1, STATE.ui.entries.currentPage - 1);
      } else if (id === 'btn-page-next') {
        const totalPages = getPageCount();
        STATE.ui.entries.currentPage = Math.min(totalPages, STATE.ui.entries.currentPage + 1);
      } else if (id === 'btn-page-last') {
        STATE.ui.entries.currentPage = getPageCount();
      }
      return;
    }

    // 2. Cabeceras de ordenación
    const th = e.target.closest('#preview-table th.clickable-header');
    if (th) {
      e.preventDefault();
      const col = th.dataset.column;
      if (STATE.ui.entries.sortColumn === col) {
        STATE.ui.entries.sortDirection = STATE.ui.entries.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        STATE.ui.entries.sortColumn = col;
        STATE.ui.entries.sortDirection = 'desc'; // Default a descendente
      }
      STATE.ui.entries.currentPage = 1; // Volver a la primera página
      return;
    }
  });
}

function initPillFilters() {
  const selectPill = (btn, containerId) => {
    const sev = btn.dataset.severity;
    STATE.ui.anomalyFilter = sev;
    
    // Sincronizar clases visuales active
    const pills = document.querySelectorAll(`#${containerId} .pill-btn`);
    pills.forEach(p => {
      p.classList.toggle('active', p.dataset.severity === sev);
    });
  };

  const uploadPills = document.querySelectorAll('#anomaly-pills .pill-btn');
  uploadPills.forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'anomaly-pills'));
  });

  const dashPills = document.querySelectorAll('#dashboard-anomaly-pills .pill-btn');
  dashPills.forEach(btn => {
    btn.addEventListener('click', () => selectPill(btn, 'dashboard-anomaly-pills'));
  });
}

// ---- Init ----
initPreviewGridListeners();
initPillFilters();
renderDefensa();
renderRulesLibrary();

// Inicializar módulos si existen
if (typeof renderChecklist === 'function') renderChecklist();
if (typeof renderKnowledge === 'function') renderKnowledge();
