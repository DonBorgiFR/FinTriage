/**
 * app.js — Controlador principal. Navegación SPA, estado global,
 * orquestación de módulos y renderizado de todas las secciones.
 */

// ---- Medición de Long Tasks Global (Fase 5) ----
if (typeof PerformanceObserver !== 'undefined') {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn(`[FinTriage] [LONG TASK DETECTADO] Duración: ${entry.duration.toFixed(2)}ms, inicio: ${entry.startTime.toFixed(2)}ms`);
        if (entry.duration > 200) {
          console.error(`[FinTriage] [BLOQUEO GRAVE DETECTADO] Tarea larga > 200ms: ${entry.duration.toFixed(2)}ms!`);
        } else if (entry.duration > 100) {
          console.warn(`[FinTriage] [BLOQUEO SIGNIFICATIVO DETECTADO] Tarea larga > 100ms: ${entry.duration.toFixed(2)}ms!`);
        }
      }
    }
  });
  try {
    observer.observe({ entryTypes: ['longtask'] });
    console.log('[FinTriage] PerformanceObserver de Long Tasks inicializado correctamente.');
  } catch (e) {
    console.warn('[FinTriage] PerformanceObserver de longtask no soportado en este navegador:', e.message);
  }
}


// ---- Integración con store.js (Fase 2) ----
// El objeto STATE y appStore se inicializan de forma reactiva en store.js

// Suscripciones reactivas principales
appStore.subscribe('analysisResult', () => {
  if (document.getElementById('section-dashboard').classList.contains('active')) {
    renderDashboard();
  }
});

// Invalidación reactiva de caché y recálculo dinámico ante cambios en mapeos o periodificaciones
const triggerRecalculate = () => {
  if (STATE.parsedLedger && STATE.selectedProfile) {
    monthlyAnalysisCache = null; // Limpiar caché ante recálculo reactivo
    STATE.analysisResult = analyzeLedger(
      STATE.parsedLedger,
      STATE.selectedProfile.id,
      STATE.customMapping,
      STATE.approvedAccruals || [],
      STATE.contextChecklist
    );
  }
};

appStore.subscribe('customMapping', triggerRecalculate);
appStore.subscribe('approvedAccruals', triggerRecalculate);

appStore.subscribe('parsedLedger', (parsed) => {
  if (parsed) {
    monthlyAnalysisCache = null; // Limpiar caché para nuevo libro cargado
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
// GUARD: Solo se activa tras completar el onboarding (Paso 4 → Dashboard).
// Evita toasts prematuros durante los pasos de carga/mapping/devengos.
appStore.subscribe('analysisResult', (result) => {
  if (!STATE._onboardingComplete) return;

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
// GUARD: Mismo principio que arriba — sin toast hasta completar onboarding.
appStore.subscribe('defensaSimulacionInputs', (inputs) => {
  if (!STATE._onboardingComplete) return;

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
function navigate(sectionId, onComplete) {
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
  if (sectionId === 'dashboard' && STATE.analysisResult) {
    renderDashboard(onComplete);
  } else {
    if (sectionId === 'scoring') renderScorer();
    if (sectionId === 'forecast') renderForecast();
    if (sectionId === 'defensa') renderDefensa();
    if (typeof onComplete === 'function') onComplete();
  }
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
  if (!grid) return;
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
  const empresaForm = document.getElementById('empresa-form');
  if (empresaForm) empresaForm.style.display = 'flex';
  
  const btnAnalizar = document.getElementById('btn-analizar');
  if (btnAnalizar) btnAnalizar.disabled = false;
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

  // Mostrar el selector de perfil y renderizar las tarjetas
  const profileSelector = document.getElementById('profile-selector');
  if (profileSelector) profileSelector.style.display = 'block';
  renderProfileGrid();

  // Auto-seleccionar perfil SaaS por defecto para agilizar y habilitar el botón Analizar
  selectProfile('saas');

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

  showToast('Archivo cargado. Perfil SaaS/Tech seleccionado por defecto.', 'info');

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
// ESTRATEGIA DE RESILIENCIA: El análisis core (analyzeLedger) es obligatorio.
// Scoring y Forecast son pre-cálculos opcionales: si fallan, el Dashboard abre
// igualmente con degradación explícita registrada en audit trail y STATE.
document.getElementById('btn-goto-dashboard').addEventListener('click', () => {
  // Protección contra doble click / re-procesados concurrentes
  if (STATE._isProcessingDashboard) {
    console.warn('[FinTriage] Intento de re-generación ignorado: proceso ya en ejecución.');
    return;
  }

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

  // ==========================================
  // PIPELINE ASÍNCRONO DE PROCESAMIENTO (FASE 5)
  // INSTRUMENTADO CON PERFORMANCE.NOW() Y MEDIDOR DE LONG TASKS
  // ==========================================
  console.log('[FinTriage] === INICIO PIPELINE DASHBOARD ===');
  const tTotalStart = performance.now();
  const tClick = performance.now();
  
  // Paso A: UI Lock y Mostrar Spinner (Inmediato/Síncrono)
  STATE._isProcessingDashboard = true;
  const btn = document.getElementById('btn-goto-dashboard');
  if (btn) btn.disabled = true;

  const loader = document.getElementById('dashboard-loader-overlay');
  const msg = document.getElementById('loader-message');
  if (loader) {
    loader.style.display = 'flex';
    loader.style.opacity = '1';
  }
  if (msg) msg.textContent = 'Iniciando síntesis del balance...';

  const tShowLoader = performance.now();
  const stepADuration = tShowLoader - tClick;
  console.log(`[FinTriage] [Paso A] Show Loader completado en ${stepADuration.toFixed(2)}ms`);

  // Esperar a que el navegador complete el pintado inicial del cargador y deshabilitado del botón
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const tDelay = performance.now();
      console.log(`[FinTriage] Delay para repintado DOM del loader: ${(tDelay - tShowLoader).toFixed(2)}ms`);

      // Paso B: Análisis Core Principal
      if (msg) msg.textContent = 'Analizando libro contable y auditoría de anomalías...';

      setTimeout(() => {
        let tCoreStart, tCoreEnd;
        try {
          tCoreStart = performance.now();
          STATE.analysisResult = analyzeLedger(
            STATE.parsedLedger, 
            STATE.selectedProfile.id, 
            STATE.customMapping,
            STATE.approvedAccruals || [],
            STATE.contextChecklist
          );
          tCoreEnd = performance.now();
        } catch (errCore) {
          console.error('[FinTriage] Error fatal en analyzeLedger:', errCore);
          logAudit('ERROR CRÍTICO', `analyzeLedger falló: ${errCore.message}`);
          showToast('⛔ Error crítico en el análisis contable. Revisa la consola.', 'error', 8000);
          
          // Revertir estados
          if (btn) btn.disabled = false;
          STATE._isProcessingDashboard = false;
          if (loader) loader.style.display = 'none';
          return;
        }

        const coreDuration = tCoreEnd - tCoreStart;
        logAudit('Performance', `Paso B (analyzeLedger completo): ${coreDuration.toFixed(1)}ms`);
        console.log(`[FinTriage] [Paso B] analyzeLedger core completado en ${coreDuration.toFixed(2)}ms`);
        
        // Medición de Long Tasks (>50ms)
        if (coreDuration > 50) {
          console.warn(`[FinTriage] [LONG TASK] Paso B analyzeLedger tardó > 50ms: ${coreDuration.toFixed(2)}ms`);
          if (coreDuration > 200) {
            console.warn(`[FinTriage] [BLOQUEO GRAVE] Paso B tardó > 200ms: ${coreDuration.toFixed(2)}ms. Candidato a Web Worker.`);
          }
        }

        STATE.accrualsReviewed = true;

        const remappedCount = STATE.customMapping ? Object.keys(STATE.customMapping).length : 0;
        const accrualCount = (STATE.approvedAccruals || []).length;
        logAudit('Perfil seleccionado', `${STATE.selectedProfile.name} (${STATE.selectedProfile.id})`);
        if (remappedCount > 0) logAudit('Remapeo manual', `${remappedCount} cuentas reclasificadas`);
        if (accrualCount > 0) logAudit('Devengos aprobados', `${accrualCount} periodificaciones aplicadas`);
        logAudit('Dashboard generado', `Trust Score: ${STATE.analysisResult.confidence.trustScore}/100 · Confianza: ${STATE.analysisResult.confidence.confidenceLabel} · EBITDA Suspect: ${STATE.analysisResult.confidence.ebitdaSuspect ? 'SÍ' : 'NO'}`);

        // Paso C: Pre-cálculo de Scoring (Vía requestIdleCallback / Asíncrono no-bloqueante)
        const runScoring = () => {
          if (msg) msg.textContent = 'Evaluando scoring de financiación pública...';

          const doScoring = () => {
            const tScStart = performance.now();
            try {
              STATE.scoringResult = scoreFinanciacion(STATE.analysisResult, STATE.scoringInputs || {});
            } catch (errScoring) {
              console.error('[FinTriage] Error en scoreFinanciacion (degradación elegante):', errScoring);
              logAudit('DEGRADACIÓN', `scoreFinanciacion falló: ${errScoring.message}. Scoring no disponible.`);
              STATE.scoringResult = null;
            }
            const tScEnd = performance.now();
            const scDuration = tScEnd - tScStart;
            logAudit('Performance', `Paso C (scoreFinanciacion): ${scDuration.toFixed(1)}ms`);
            console.log(`[FinTriage] [Paso C] scoreFinanciacion completado en ${scDuration.toFixed(2)}ms`);
            if (scDuration > 50) {
              console.warn(`[FinTriage] [LONG TASK] Paso C scoreFinanciacion tardó > 50ms: ${scDuration.toFixed(2)}ms`);
            }

            // Proceder a Paso D
            runForecast();
          };

          if (window.requestIdleCallback) {
            window.requestIdleCallback(doScoring, { timeout: 100 });
          } else {
            setTimeout(doScoring, 20);
          }
        };

        // Paso D: Pre-cálculo de Forecast (Vía requestIdleCallback / Asíncrono no-bloqueante)
        const runForecast = () => {
          if (msg) msg.textContent = 'Proyectando previsiones y escenarios de caja...';

          const doForecast = () => {
            const tFoStart = performance.now();
            try {
              if (typeof buildForecast === 'function') {
                FORECAST_HYP = null; // reset
                STATE.forecastResult = buildForecast(STATE.analysisResult, _getDefaultHyp());
              }
            } catch (errForecast) {
              console.error('[FinTriage] Error en buildForecast (degradación elegante):', errForecast);
              logAudit('DEGRADACIÓN', `buildForecast falló: ${errForecast.message}. Forecast no disponible.`);
              STATE.forecastResult = null;
            }
            const tFoEnd = performance.now();
            const foDuration = tFoEnd - tFoStart;
            logAudit('Performance', `Paso D (buildForecast): ${foDuration.toFixed(1)}ms`);
            console.log(`[FinTriage] [Paso D] buildForecast completado en ${foDuration.toFixed(2)}ms`);
            if (foDuration > 50) {
              console.warn(`[FinTriage] [LONG TASK] Paso D buildForecast tardó > 50ms: ${foDuration.toFixed(2)}ms`);
            }

            // Proceder a Paso E
            runRenderAndCache();
          };

          if (window.requestIdleCallback) {
            window.requestIdleCallback(doForecast, { timeout: 100 });
          } else {
            setTimeout(doForecast, 20);
          }
        };

        // Paso E: Generación del Caché Mensual y Renderizado (requestAnimationFrame)
        const runRenderAndCache = () => {
          if (msg) msg.textContent = 'Construyendo tendencias y cargando panel de control...';

          requestAnimationFrame(() => {
            const tCacheStart = performance.now();
            // Esto construirá el caché de análisis mensuales una sola vez. 
            // renderDashboard reutilizará este caché para evitar el doble cálculo.
            monthlyAnalysisCache = buildMonthlyAnalysisCache(STATE.analysisResult);
            const tCacheEnd = performance.now();
            const cacheDuration = tCacheEnd - tCacheStart;
            
            logAudit('Performance', `Paso E (buildMonthlyAnalysisCache): ${cacheDuration.toFixed(1)}ms`);
            console.log(`[FinTriage] [Paso E] buildMonthlyAnalysisCache completado en ${cacheDuration.toFixed(2)}ms`);
            
            if (cacheDuration > 50) {
              console.warn(`[FinTriage] [LONG TASK] Paso E buildMonthlyAnalysisCache tardó > 50ms: ${cacheDuration.toFixed(2)}ms`);
            }

            // Actualizar resumen visual del Paso 1
            try {
              document.getElementById('sum-ingresos').textContent =
                new Intl.NumberFormat('es-ES', {maximumFractionDigits:0}).format(STATE.analysisResult.totales.ingresos) + '€';
              document.getElementById('sum-gastos').textContent =
                new Intl.NumberFormat('es-ES', {maximumFractionDigits:0}).format(STATE.analysisResult.totales.gastos) + '€';
            } catch (_) {}

            // Navegación garantizada al Dashboard
            showToast('Dashboard analítico generado', 'success');
            
            const tNavStart = performance.now();
            navigate('dashboard', () => {
              const tNavEnd = performance.now();
              const navDuration = tNavEnd - tNavStart;
              console.log(`[FinTriage] [Paso E - Navegación/Render] navigate('dashboard') + renderDashboard completo en ${navDuration.toFixed(2)}ms`);
              if (navDuration > 50) {
                console.warn(`[FinTriage] [LONG TASK] Navegación/Render Dashboard tardó > 50ms: ${navDuration.toFixed(2)}ms`);
                if (navDuration > 100) {
                  console.warn(`[FinTriage] [BLOQUEO GRAVE] El pintado del dashboard bloqueó > 100ms: ${navDuration.toFixed(2)}ms`);
                }
              }

              STATE._onboardingComplete = true;

              // Alertas de Runway
              if (STATE.analysisResult && STATE.analysisResult.totales && STATE.analysisResult.totales.burnRateNeto > 0) {
                const runway = STATE.analysisResult.totales.cajaFinal / STATE.analysisResult.totales.burnRateNeto;
                const navDefensa = document.getElementById('nav-defensa');
                if (runway < 3 && navDefensa) {
                  navDefensa.classList.add('pulse-danger');
                  showToast('⚠️ Startup en Runway Crítico (< 3 meses). Se ha activado el Plan de Choque de 100 Días en la pestaña Defensa.', 'error', 6000);
                }
              }

              // Proceder a Paso F
              runCleanup(cacheDuration);
            });
          });
        };

        // Paso F: Ocultación del Cargador y Restablecimiento del Estado
        const runCleanup = (cacheDuration) => {
          requestAnimationFrame(() => {
            if (loader) {
              loader.style.opacity = '0';
              setTimeout(() => {
                loader.style.display = 'none';
                loader.style.opacity = '1'; // Restablecer opacidad
              }, 300);
            }
            if (btn) btn.disabled = false;
            STATE._isProcessingDashboard = false;

            const tTotalEnd = performance.now();
            const cleanupDuration = tTotalEnd - tTotalStart;
            logAudit('Performance', `Generación completa Dashboard: ${cleanupDuration.toFixed(1)}ms`);
            console.log(`[FinTriage] Dashboard generado en ${cleanupDuration.toFixed(2)}ms (Caché Mensual: ${cacheDuration.toFixed(2)}ms)`);
            console.log('[FinTriage] === FIN PIPELINE DASHBOARD ===');
          });
        };

        // Iniciar la cascada asíncrona
        runScoring();

      }, 50); // Timeout mínimo para asegurar el repintado del DOM del loader overlay
    });
  });
});

let monthlyAnalysisCache = null;

/**
 * buildMonthlyAnalysisCache(data)
 * Pre-calcula y cachea los resultados acumulados de análisis mes a mes para
 * renderizar la evolución histórica de cualquier KPI sin redundancia ni sobrecarga.
 */
function buildMonthlyAnalysisCache(data) {
  if (!STATE.parsedLedger || !STATE.parsedLedger.entries || !data.meta || !data.meta.months) {
    return [];
  }
  const months = [...data.meta.months].sort();
  const cache = [];
  const profileId = STATE.selectedProfile?.id || 'saas';
  const customMapping = STATE.customMapping;
  const approvedAccruals = STATE.approvedAccruals || [];
  const contextChecklist = STATE.contextChecklist;

  const entriesByMonth = {};
  for (const entry of STATE.parsedLedger.entries) {
    if (!entriesByMonth[entry.monthKey]) {
      entriesByMonth[entry.monthKey] = [];
    }
    entriesByMonth[entry.monthKey].push(entry);
  }

  const accumulatedEntries = [];
  const accumulatedByMonth = {};

  for (const m of months) {
    if (entriesByMonth[m]) {
      accumulatedEntries.push(...entriesByMonth[m]);
    }
    accumulatedByMonth[m] = STATE.parsedLedger.byMonth[m] || [];

    const subParsedLedger = {
      entries: [...accumulatedEntries],
      byMonth: { ...accumulatedByMonth },
      meta: {
        ...STATE.parsedLedger.meta,
        months: months.filter(x => x <= m)
      },
      anomalies: [] // Optimización de rendimiento
    };

    const subAnalysisResult = analyzeLedger(
      subParsedLedger,
      profileId,
      customMapping,
      approvedAccruals,
      contextChecklist,
      { skipAnomalies: true }
    );

    cache.push({
      month: m,
      analysisResult: subAnalysisResult
    });
  }
  return cache;
}

/**
 * getKpiSparkline(kpi, data, isUniversal)
 * Genera un minigráfico SVG de tendencia de fondo con escalado robusto
 * y degradado basado en los meses históricos.
 */
function getKpiSparkline(kpi, data, isUniversal = true) {
  const cache = monthlyAnalysisCache || [];
  if (cache.length < 2) return '';

  const values = [];
  for (const item of cache) {
    const subData = item.analysisResult;
    let val = null;
    if (isUniversal) {
      val = kpi.compute(subData);
    } else {
      const kpiResults = {};
      const profile = STATE.selectedProfile;
      if (profile && profile.kpis) {
        for (const pk of profile.kpis) {
          const v = pk.compute(subData, kpiResults, STATE.extraInputs);
          kpiResults[pk.id] = v;
        }
      }
      val = kpiResults[kpi.id];
    }

    if (val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) {
      values.push(val);
    } else if (val && typeof val === 'object' && val.error) {
      values.push(0);
    } else {
      values.push(0);
    }
  }

  if (values.length < 2) return '';

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;

  const points = values.map((v, idx) => {
    const x = (idx / (values.length - 1)) * 100;
    const y = range === 0 ? 20 : 36 - ((v - minVal) / range) * 32;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `
    <svg class="kpi-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

/**
 * getKpiBadgeTrustHTML(kpiId, confidence)
 * Genera un distintivo de fiabilidad interactivo con tooltip flotante
 * que detalla el checklist de consistencia de la startup.
 */
function getKpiBadgeTrustHTML(kpiId, confidence) {
  const score = confidence.trustScore ?? 100;
  const anomalies = STATE.analysisResult?.anomalies || [];
  
  let trustClass = 'trust-high';
  let trustLabel = 'ALTA';
  if (score >= 80) {
    trustClass = 'trust-high';
    trustLabel = 'ALTA';
  } else if (score >= 65) {
    trustClass = 'trust-medium-high';
    trustLabel = 'M-ALTA';
  } else if (score >= 45) {
    trustClass = 'trust-medium-low';
    trustLabel = 'M-BAJA';
  } else {
    trustClass = 'trust-low';
    trustLabel = 'BAJA';
  }

  // Generar checklist de auditoría contextualizada
  const items = [];

  // 1. Asientos balanceados
  const hasDescuadre = anomalies.some(a => a.id === 'asiento_descuadrado' || a.id === 'descuadre_contable');
  if (hasDescuadre) {
    items.push(`<li class="tooltip-list-item danger">✗ Asientos Desbalanceados (-20)</li>`);
  } else {
    items.push(`<li class="tooltip-list-item checked">✓ Ecuación de Asientos Correcta</li>`);
  }

  // 2. Integridad del EBITDA
  if (confidence.ebitdaSuspect) {
    items.push(`<li class="tooltip-list-item danger">✗ Integridad EBITDA Comprometida</li>`);
  } else {
    items.push(`<li class="tooltip-list-item checked">✓ EBITDA Operativo Fiable</li>`);
  }

  // 3. Devengos / Periodificaciones
  const accrualCount = (STATE.approvedAccruals || []).length;
  if (accrualCount > 0) {
    items.push(`<li class="tooltip-list-item checked">✓ Devengo Ajustado (${accrualCount} items)</li>`);
  } else {
    items.push(`<li class="tooltip-list-item warn">⚠ Sin Periodificaciones Activas</li>`);
  }

  // 4. Patrones de registros atípicos (Cifras redondas / domingos)
  const hasRedondas = anomalies.some(a => a.id === 'cifras_redondas');
  const hasDomingos = anomalies.some(a => a.id === 'facturas_domingo');
  if (hasRedondas && hasDomingos) {
    items.push(`<li class="tooltip-list-item danger">✗ Cifras Redondas y Domingos</li>`);
  } else if (hasRedondas) {
    items.push(`<li class="tooltip-list-item warn">⚠ Alta Concentración Redondas</li>`);
  } else if (hasDomingos) {
    items.push(`<li class="tooltip-list-item warn">⚠ Registros en Domingo</li>`);
  } else {
    items.push(`<li class="tooltip-list-item checked">✓ Patrones Contables Normales</li>`);
  }

  // 5. Dependencia Cliente Único
  const hasClienteUnico = anomalies.some(a => a.id === 'cliente_unico');
  if (hasClienteUnico) {
    items.push(`<li class="tooltip-list-item danger">✗ Dependencia Cliente Único</li>`);
  } else {
    items.push(`<li class="tooltip-list-item checked">✓ Cartera de Clientes Diversa</li>`);
  }

  // 6. Runway / Viabilidad Financiera
  let runwayVal = null;
  if (STATE.analysisResult && STATE.analysisResult.totales && STATE.analysisResult.totales.burnRateNeto > 0) {
    runwayVal = STATE.analysisResult.totales.cajaFinal / STATE.analysisResult.totales.burnRateNeto;
  }
  if (runwayVal !== null) {
    if (runwayVal < 3) {
      items.push(`<li class="tooltip-list-item danger">✗ Runway Crítico (< 3 meses)</li>`);
    } else if (runwayVal < 6) {
      items.push(`<li class="tooltip-list-item warn">⚠ Runway Ajustado (< 6 meses)</li>`);
    } else {
      items.push(`<li class="tooltip-list-item checked">✓ Runway Saludable (${runwayVal.toFixed(1)}m)</li>`);
    }
  }

  const tooltipHtml = `
    <div class="kpi-badge-trust-tooltip">
      <div class="tooltip-title">
        <span>Chequeo de Confianza</span>
        <span>${score}/100</span>
      </div>
      <ul class="tooltip-list">
        ${items.join('')}
      </ul>
    </div>
  `;

  return `
    <div class="kpi-badge-trust ${trustClass}">
      🛡️ ${trustLabel}
      ${tooltipHtml}
    </div>
  `;
}

// ---- Render: Dashboard ----
// ---- Render: Dashboard ----
function renderDashboard(onComplete) {
  if (!STATE.analysisResult) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }
  const data = STATE.analysisResult;
  const profile = STATE.selectedProfile;
  const confidence = data.confidence || {};

  const tRenderStart = performance.now();
  console.log('[FinTriage] --- INICIO RENDER DASHBOARD ---');

  // 1. Evitar regeneración redundante de caché mensual
  if (!monthlyAnalysisCache) {
    const tSubCacheStart = performance.now();
    monthlyAnalysisCache = buildMonthlyAnalysisCache(data);
    const tSubCacheEnd = performance.now();
    console.log(`[FinTriage] [Render] buildMonthlyAnalysisCache (CÁLCULO REAL): ${(tSubCacheEnd - tSubCacheStart).toFixed(2)}ms`);
    if ((tSubCacheEnd - tSubCacheStart) > 50) {
      console.warn(`[FinTriage] [LONG TASK] buildMonthlyAnalysisCache secundario tardó > 50ms: ${(tSubCacheEnd - tSubCacheStart).toFixed(2)}ms`);
    }
  } else {
    console.log('[FinTriage] [Render] buildMonthlyAnalysisCache EVITADO (uso de caché existente)');
  }

  // 2. Banner de Confianza
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

  // 3. Renderizado de Estructura Principal y KPIs Iniciales (Síncrono/Rápido)
  const tKpis0 = performance.now();
  
  // Trust Score
  renderTrustScore(data.confidence || { trustScore: 0, confidenceLabel: '', confidenceLevel: 'reliable' });

  // Audit Trail
  renderAuditTrail();

  // Hallazgos Accionables
  renderActionableFindings(STATE.analysisResult.anomalies || []);

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

    const sparklineHtml = getKpiSparkline(kpi, data, true);
    const trustBadgeHtml = getKpiBadgeTrustHTML(kpi.id, confidence);

    return `
      <div class="kpi-card status-${status} ${pulseClass}" title="${desc}">
        ${trustBadgeHtml}
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${formatted}</div>
        <div class="kpi-sub ${(kpi.id === 'ebitda' && confidence.ebitdaSuspect) ? 'text-red' : ''}">${desc}</div>
        <div class="kpi-status">${getStatusIcon(status)}</div>
        ${sparklineHtml}
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

      const sparklineHtml = getKpiSparkline(kpi, data, false);
      const trustBadgeHtml = getKpiBadgeTrustHTML(kpi.id, confidence);

      return `
        <div class="kpi-card status-${status}" title="${kpi.desc}">
          ${trustBadgeHtml}
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${formatted}</div>
          <div class="kpi-sub">${kpi.desc}</div>
          <div class="kpi-status">${getStatusIcon(status)}</div>
          ${sparklineHtml}
        </div>
      `;
    }).join('');
  } else {
    kpiPerfilSection.style.display = 'none';
  }

  const tKpis1 = performance.now();
  console.log(`[FinTriage] [Render] KPIs pintados síncronamente en ${(tKpis1 - tKpis0).toFixed(2)}ms`);

  // 4. Renderizado Progresivo Asíncrono de Elementos Gráficos Pesados
  // Colocamos spinners temporales elegantes mientras se programan los pintados progresivos
  document.getElementById('waterfall-container').innerHTML = '<div class="loader-spinner-small"></div>';
  document.getElementById('ebitda-chart-container').innerHTML = '<div class="loader-spinner-small"></div>';
  document.getElementById('runway-burn-container').innerHTML = '<div class="loader-spinner-small"></div>';
  document.getElementById('revenues-expenses-container').innerHTML = '<div class="loader-spinner-small"></div>';

  const narrativeContainer = document.getElementById('narrative-container');
  if (narrativeContainer) {
    narrativeContainer.innerHTML = '<div class="loader-spinner-small"></div>';
  }

  const pygBody = document.getElementById('pyg-body');
  if (pygBody) {
    pygBody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 30px;"><div class="loader-spinner-small"></div></td></tr>';
  }

  // Frame 1: Gráficos principales (Waterfall y EBITDA Divergente)
  requestAnimationFrame(() => {
    const tF1_0 = performance.now();
    renderWaterfall(data, 'ui');
    renderDivergingEbitdaChart('ebitda-chart-container', data, 'ui');
    const tF1_1 = performance.now();
    const f1Dur = tF1_1 - tF1_0;
    console.log(`[FinTriage] [Render Progresivo] Frame 1 (Waterfall & EBITDA) en ${f1Dur.toFixed(2)}ms`);
    if (f1Dur > 50) {
      console.warn(`[FinTriage] [LONG TASK] Frame 1 de renderizado tardó > 50ms: ${f1Dur.toFixed(2)}ms`);
    }

    // Frame 2: Gráficos secundarios (Runway/Burn y Revenues/Expenses)
    requestAnimationFrame(() => {
      const tF2_0 = performance.now();
      renderRunwayBurnChart('runway-burn-container', data, 'ui');
      renderRevenuesExpensesChart('revenues-expenses-container', data, 'ui');
      const tF2_1 = performance.now();
      const f2Dur = tF2_1 - tF2_0;
      console.log(`[FinTriage] [Render Progresivo] Frame 2 (Runway & Revenues) en ${f2Dur.toFixed(2)}ms`);
      if (f2Dur > 50) {
        console.warn(`[FinTriage] [LONG TASK] Frame 2 de renderizado tardó > 50ms: ${f2Dur.toFixed(2)}ms`);
      }

      // Frame 3: Resumen Ejecutivo / Argumentario Narrativo
      requestAnimationFrame(() => {
        const tF3_0 = performance.now();
        if (typeof renderNarrative === 'function') renderNarrative();
        const tF3_1 = performance.now();
        const f3Dur = tF3_1 - tF3_0;
        console.log(`[FinTriage] [Render Progresivo] Frame 3 (Narrative) en ${f3Dur.toFixed(2)}ms`);
        if (f3Dur > 50) {
          console.warn(`[FinTriage] [LONG TASK] Frame 3 de renderizado tardó > 50ms: ${f3Dur.toFixed(2)}ms`);
        }

        // Frame 4: Tabla PyG Mensual
        requestAnimationFrame(() => {
          const tF4_0 = performance.now();
          renderPyG(data.pygMensual);
          const tF4_1 = performance.now();
          const f4Dur = tF4_1 - tF4_0;
          console.log(`[FinTriage] [Render Progresivo] Frame 4 (PyG) en ${f4Dur.toFixed(2)}ms`);
          if (f4Dur > 50) {
            console.warn(`[FinTriage] [LONG TASK] Frame 4 de renderizado tardó > 50ms: ${f4Dur.toFixed(2)}ms`);
          }

          const tRenderEnd = performance.now();
          console.log(`[FinTriage] [Render Completo] Total renderizado progresivo: ${(tRenderEnd - tRenderStart).toFixed(2)}ms`);
          
          if (typeof onComplete === 'function') {
            onComplete();
          }
        });
      });
    });
  });
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
function renderWaterfall(data, mode = 'ui', customContainer = null) {
  const container = customContainer || document.getElementById('waterfall-container');
  if (!container) return;

  try {
    const t = data.totales;
    const ingresos = t.ingresos || 0;
    const cogs = t.cogs || 0;
    const margenBruto = ingresos - cogs;
    
    // Separar personal del resto del OPEX
    const personalTotal = Object.values(data.pygMensual || {}).reduce((s, m) => s + (m.personal || 0), 0);
    const opexOperativo = (t.gastos || 0) - cogs - (t.amortizacion || 0) - (t.gastosFinancieros || 0);
    const restoOpex = Math.max(0, opexOperativo - personalTotal);
    const ebitda = t.ebitda || 0;

    // Contrast colors for print and UI modes
    const colors = mode === 'print' ? {
      ingresos: '#374151', // Dark charcoal gray
      cogs: '#6b7280',     // Medium gray
      margen: '#111827',   // Deep black/gray
      personal: '#9ca3af', // Light desaturated gray
      restoOpex: '#6b7280',
      ebitda: ebitda >= 0 ? '#374151' : '#dc2626'
    } : {
      ingresos: 'var(--green)',
      cogs: 'var(--red)',
      margen: 'var(--cyan)',
      personal: 'var(--amber)',
      restoOpex: 'var(--red)',
      ebitda: ebitda >= 0 ? 'var(--green)' : 'var(--red)'
    };

    const steps = [
      { label: 'Ingresos', val: ingresos, type: 'total', color: colors.ingresos },
      { label: 'COGS', val: -cogs, type: 'diff', color: colors.cogs },
      { label: 'Margen Bruto', val: margenBruto, type: 'subtotal', color: colors.margen },
      { label: 'Personal', val: -personalTotal, type: 'diff', color: colors.personal },
      { label: 'Resto OPEX', val: -restoOpex, type: 'diff', color: colors.restoOpex },
      { label: 'EBITDA', val: ebitda, type: 'final', color: colors.ebitda }
    ];

    const maxVal = Math.max(ingresos, margenBruto, ebitda, 1000) * 1.12; 
    const minVal = Math.min(0, ebitda) * 1.12;
    const range = maxVal - minVal || 1;

    const W = 800, H = 220;
    const PAD = { t: 25, r: 25, b: 35, l: 65 };
    const iW = W - PAD.l - PAD.r;
    const iH = H - PAD.t - PAD.b;

    // Robust yScale clamp logic
    const yScale = v => {
      const val = typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0;
      return PAD.t + iH - ((val - minVal) / range) * iH;
    };
    const y0 = yScale(0); 

    const barWidth = (iW / steps.length) * 0.68;
    const gap = (iW / steps.length) * 0.32;

    let currentY = y0;
    let svgContent = '';

    const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

    steps.forEach((s, i) => {
      const x = PAD.l + i * (barWidth + gap) + gap/2;
      let y, h;

      if (s.type === 'total' || s.type === 'subtotal' || s.type === 'final') {
        y = yScale(Math.max(0, s.val));
        h = Math.abs(yScale(s.val) - y0);
        currentY = yScale(s.val); 
      } else { // diff
        if (s.val < 0) {
          y = currentY; 
          h = yScale(s.val) - yScale(0); 
          currentY = y + h; 
        } else {
          h = yScale(0) - yScale(s.val);
          y = currentY - h;
          currentY = y;
        }
      }

      h = Math.max(1, h); // math safety: avoid invisible 0px heights

      const rectStroke = mode === 'print' ? 'stroke="#111111" stroke-width="1"' : '';

      svgContent += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="${s.color}" rx="3" ${rectStroke} />
        <text x="${x + barWidth/2}" y="${y - 6}" text-anchor="middle" style="font-size:10px;fill:${mode === 'print' ? '#111111' : 'var(--text-primary)'};font-weight:600;font-family:var(--font-ui);">${s.type === 'diff' && s.val > 0 ? '+' : ''}${fmt(s.val)}</text>
        <text x="${x + barWidth/2}" y="${H - 12}" text-anchor="middle" style="font-size:9px;fill:${mode === 'print' ? '#333333' : 'var(--text-muted)'};font-family:var(--font-display);">${s.label}</text>
      `;

      // Continuous dashed connection lane bridging Step i and Step i+1
      if (i < steps.length - 1) {
        const nextX = x + barWidth;
        const strokeColor = mode === 'print' ? '#666666' : 'rgba(255,255,255,0.2)';
        svgContent += `
          <line x1="${nextX}" y1="${currentY}" x2="${nextX + gap}" y2="${currentY}" stroke="${strokeColor}" stroke-dasharray="3,3" stroke-width="1.2" />
        `;
      }
    });

    // Zero baseline
    if (y0 >= PAD.t && y0 <= PAD.t + iH) {
      svgContent += `<line x1="${PAD.l}" y1="${y0}" x2="${W - PAD.r}" y2="${y0}" stroke="${mode === 'print' ? '#111111' : 'rgba(255,255,255,0.15)'}" stroke-width="${mode === 'print' ? '1.8' : '1'}"/>`;
    }

    if (mode === 'print') {
      container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="680" height="187" style="display:block; overflow:visible;">
          ${svgContent}
        </svg>
      `;
      return;
    }

    const printClass = mode === 'print' ? 'chart-print-mode' : '';
    const uiWrapperStyle = mode === 'print' ? 'background:#fff;padding:16px;' : '';

    container.innerHTML = `
      <div class="card waterfall-card ${printClass}" style="${uiWrapperStyle}">
        <div class="card-title">🌉 Cascada de Rentabilidad (${mode === 'print' ? 'Papel' : 'Periodo Acumulado'})</div>
        <div class="waterfall-scroll-container">
          <svg viewBox="0 0 ${W} ${H}" class="waterfall-svg" style="max-width:${W}px;overflow:visible;">
            ${svgContent}
          </svg>
        </div>
      </div>
    `;

  } catch (err) {
    console.error("Fallo renderWaterfall, degradación contable:", err);
    container.innerHTML = generateContableTableFallback(data);
  }
}

/**
 * alignZeroAxes(min1, max1, min2, max2)
 * @description Garantiza el anclaje del cero en el mismo píxel vertical para gráficos de doble eje.
 * Calcula la proporción negativa-a-positiva y expande los límites del eje de menor proporción.
 */
function alignZeroAxes(min1, max1, min2, max2) {
  if (min1 >= 0 && min2 >= 0) {
    return { min1: 0, max1, min2: 0, max2 };
  }
  const adjustedMin1 = Math.min(0, min1);
  const adjustedMax1 = Math.max(1, max1);
  const adjustedMin2 = Math.min(0, min2);
  const adjustedMax2 = Math.max(1, max2);
  
  const r1 = Math.abs(adjustedMin1) / adjustedMax1;
  const r2 = Math.abs(adjustedMin2) / adjustedMax2;
  
  let finalMin1 = adjustedMin1;
  let finalMax1 = adjustedMax1;
  let finalMin2 = adjustedMin2;
  let finalMax2 = adjustedMax2;
  
  if (r1 > r2) {
    // Agrandar la parte negativa del eje 2
    finalMin2 = -r1 * adjustedMax2;
  } else if (r2 > r1) {
    // Agrandar la parte negativa del eje 1
    finalMin1 = -r2 * adjustedMax1;
  }
  
  return { min1: finalMin1, max1: finalMax1, min2: finalMin2, max2: finalMax2 };
}

/**
 * renderDivergingEbitdaChart(containerId, data, mode)
 * @description Genera un gráfico de columnas divergentes de EBITDA con hatching
 * para baja fiabilidad e indicación de outliers extremos truncados en zig-zag.
 */
function renderDivergingEbitdaChart(containerId, data, mode = 'ui', customContainer = null) {
  const container = customContainer || document.getElementById(containerId);
  if (!container) return;

  try {
    const histMonths = Object.keys(data.pygMensual || {}).sort();
    
    if (!STATE.forecastResult && typeof buildForecast === 'function') {
      STATE.forecastResult = buildForecast(data, { crecimiento: 3, churn: 1, deltaOpex: 1, eventos: [] });
    }
    const foreMonths = STATE.forecastResult ? STATE.forecastResult.forecastMonths : [];
    
    const chartData = [];
    histMonths.forEach(m => {
      const ebitda = data.pygMensual[m].ebitda || 0;
      const conf = data.confidence?.byMonth?.[m] || { trustScore: 100 };
      chartData.push({
        month: m,
        value: ebitda,
        isForecast: false,
        trustScore: conf.trustScore,
        anomalies: conf.anomalies || []
      });
    });
    
    foreMonths.forEach((m, idx) => {
      const projected = STATE.forecastResult.scenarios.base[idx]?.ebitda || 0;
      chartData.push({
        month: m,
        value: projected,
        isForecast: true,
        trustScore: 100,
        anomalies: []
      });
    });

    if (chartData.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay datos suficientes para EBITDA Divergente</div>`;
      return;
    }

    // Outlier Truncation System
    const nonZeroVals = chartData.map(d => Math.abs(d.value)).filter(v => v > 0);
    nonZeroVals.sort((a, b) => a - b);
    const medianAbs = nonZeroVals.length > 0 ? nonZeroVals[Math.floor(nonZeroVals.length / 2)] : 10000;
    const outlierThreshold = Math.max(5 * medianAbs, 150000); 

    const nonOutliers = chartData.filter(d => Math.abs(d.value) <= outlierThreshold);
    const maxNonOutlier = nonOutliers.length > 0 ? Math.max(...nonOutliers.map(d => d.value), 0) : 10000;
    const minNonOutlier = nonOutliers.length > 0 ? Math.min(...nonOutliers.map(d => d.value), 0) : -10000;

    const visualMax = Math.max(maxNonOutlier, 5000) * 1.15;
    const visualMin = Math.min(minNonOutlier, -5000) * 1.15;
    const range = visualMax - visualMin || 1;

    const W = 800, H = 260;
    const PAD = { t: 35, r: 25, b: 35, l: 65 };
    const iW = W - PAD.l - PAD.r;
    const iH = H - PAD.t - PAD.b;

    const yScale = v => {
      const clamped = Math.max(visualMin, Math.min(visualMax, v));
      return PAD.t + iH - ((clamped - visualMin) / range) * iH;
    };

    const y0 = yScale(0);
    const barWidth = (iW / chartData.length) * 0.65;
    const gap = (iW / chartData.length) * 0.35;

    let svgContent = '';
    const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

    // SVG Pattern Definition for UI
    svgContent += `
      <defs>
        <pattern id="hatching-danger" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke="hsla(355, 85%, 62%, 0.5)" stroke-width="2.5" />
        </pattern>
      </defs>
    `;

    // Horizontal grid lines (3 Y-Ticks)
    const ticks = [visualMin, 0, visualMax];
    ticks.forEach(tick => {
      const y = yScale(tick);
      const isZero = Math.abs(tick) < 0.1;
      const strokeColor = mode === 'print' 
        ? (isZero ? '#111111' : '#dddddd')
        : (isZero ? 'var(--text-muted)' : 'rgba(255,255,255,0.06)');
      const strokeWidth = isZero ? 1.5 : 1;
      const dash = isZero ? (mode === 'print' ? 'none' : '3,3') : 'none';

      svgContent += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" />`;

      const formattedTick = Math.abs(tick) >= 1000000 
        ? `${(tick / 1000000).toFixed(1)}M€`
        : Math.abs(tick) >= 1000 
          ? `${(tick / 1000).toFixed(0)}k€` 
          : `${tick.toFixed(0)}€`;
      
      svgContent += `
        <text x="${PAD.l - 8}" y="${y + 3}" text-anchor="end" style="font-size:9px;fill:${mode === 'print' ? '#333' : 'var(--text-muted)'};font-family:var(--font-ui);font-variant-numeric:tabular-nums;">
          ${formattedTick}
        </text>
      `;
    });

    // Divider Line between Historical and Forecast
    const histCount = histMonths.length;
    if (histCount > 0 && foreMonths.length > 0) {
      const dividerX = PAD.l + histCount * (barWidth + gap);
      const strokeColor = mode === 'print' ? '#666666' : 'var(--cyan)';
      svgContent += `
        <line x1="${dividerX}" y1="${PAD.t - 10}" x2="${dividerX}" y2="${H - PAD.b + 10}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,4" />
        <text x="${dividerX}" y="${PAD.t - 15}" text-anchor="middle" style="font-size:8px;font-weight:700;fill:${strokeColor};font-family:var(--font-display);">HISTÓRICO | FORECAST</text>
      `;
    }

    // Determine values for direct print labeling (max peak & min valley)
    let peakIndex = -1, valleyIndex = -1;
    let maxVal = -Infinity, minVal = Infinity;
    chartData.forEach((d, i) => {
      if (d.value > maxVal) { maxVal = d.value; peakIndex = i; }
      if (d.value < minVal) { minVal = d.value; valleyIndex = i; }
    });

    chartData.forEach((d, i) => {
      const x = PAD.l + i * (barWidth + gap) + gap/2;
      const isOutlier = Math.abs(d.value) > outlierThreshold;
      
      const rawY = yScale(d.value);
      let y, h;
      
      if (d.value >= 0) {
        y = yScale(isOutlier ? visualMax : d.value);
        h = y0 - y;
      } else {
        y = y0;
        h = yScale(isOutlier ? visualMin : d.value) - y0;
      }
      
      h = Math.max(2, h);

      let fillAttr = '';
      let strokeAttr = '';
      let opacityAttr = '';
      const isLowConf = d.trustScore < 75;
      
      if (d.isForecast) {
        if (mode === 'print') {
          fillAttr = 'fill="none"';
          strokeAttr = `stroke="#7c6fb0" stroke-width="1.5" stroke-dasharray="3,3"`;
        } else {
          fillAttr = 'fill="rgba(124, 111, 176, 0.08)"';
          strokeAttr = `stroke="var(--purple)" stroke-width="1.5" stroke-dasharray="3,3"`;
        }
      } else if (isLowConf) {
        if (mode === 'print') {
          const solidColor = d.value >= 0 ? '#bbf7d0' : '#fca5a5';
          fillAttr = `fill="${solidColor}" fill-opacity="0.85"`;
          strokeAttr = `stroke="${d.value >= 0 ? '#16a34a' : '#dc2626'}" stroke-width="1"`;
        } else {
          fillAttr = `fill="url(#hatching-danger)"`;
          strokeAttr = `stroke="var(--red)" stroke-width="1.5"`;
          opacityAttr = `opacity="0.65"`;
        }
      } else {
        if (mode === 'print') {
          const solidColor = d.value >= 0 ? '#86efac' : '#fca5a5';
          fillAttr = `fill="${solidColor}"`;
          strokeAttr = `stroke="${d.value >= 0 ? '#16a34a' : '#dc2626'}" stroke-width="1"`;
        } else {
          const color = d.value >= 0 ? 'var(--green)' : 'var(--red)';
          fillAttr = `fill="${color}"`;
          strokeAttr = `stroke="rgba(255,255,255,0.08)" stroke-width="1"`;
        }
      }

      const interactiveAttrs = mode === 'print' ? '' : `
        class="chart-bar-interactive" 
        data-index="${i}"
        style="cursor: pointer; transition: filter 0.15s ease;"
        onmouseover="this.setAttribute('filter', 'brightness(1.2)')"
        onmouseout="this.setAttribute('filter', 'none')"
      `;

      svgContent += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" ${fillAttr} ${strokeAttr} ${opacityAttr} rx="3" ${interactiveAttrs} />
      `;

      if (isOutlier) {
        const zzY = d.value >= 0 ? y + 8 : y + h - 10;
        const strokeColor = mode === 'print' ? '#111111' : '#ffffff';
        const zPath = `
          M ${x} ${zzY} 
          L ${x + barWidth*0.25} ${zzY - 4} 
          L ${x + barWidth*0.5} ${zzY + 4} 
          L ${x + barWidth*0.75} ${zzY - 4} 
          L ${x + barWidth} ${zzY}
        `;
        svgContent += `<path d="${zPath}" fill="none" stroke="${strokeColor}" stroke-width="1.8" />`;
      }

      const labelVisible = mode === 'print' 
        ? (i === peakIndex || i === valleyIndex || isOutlier)
        : true;

      if (labelVisible) {
        const textY = d.value >= 0 ? y - 6 : y + h + 11;
        const textAnchor = "middle";
        const fontWeight = (i === peakIndex || i === valleyIndex || isOutlier) ? '700' : '500';
        const color = mode === 'print' ? '#111111' : 'var(--text-primary)';
        
        let labelText = fmt(d.value);
        if (isOutlier) {
          labelText = `⚠️ ${fmt(d.value)}`;
        }

        svgContent += `
          <text x="${x + barWidth/2}" y="${textY}" text-anchor="${textAnchor}" style="font-size:9px;fill:${color};font-weight:${fontWeight};font-family:var(--font-ui);">
            ${labelText}
          </text>
        `;
      }

      const labelFrequency = chartData.length > 15 ? 3 : 2;
      const isBoundaryMonth = i === 0 || i === chartData.length - 1 || i === histCount - 1 || i === histCount;
      if (i % labelFrequency === 0 || isBoundaryMonth) {
        svgContent += `
          <text x="${x + barWidth/2}" y="${H - 12}" text-anchor="middle" style="font-size:8px;fill:${mode === 'print' ? '#555' : 'var(--text-muted)'};font-family:var(--font-display);">
            ${d.month}
          </text>
        `;
      }
    });

    if (mode === 'print') {
      container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="680" height="221" style="display:block; overflow:visible;">
          ${svgContent}
        </svg>
      `;
      return;
    }

    const printClass = mode === 'print' ? 'chart-print-mode' : '';
    const uiWrapperStyle = mode === 'print' ? 'background:#fff;padding:16px;' : '';

    container.innerHTML = `
      <div class="card chart-container-card ${printClass}" style="${uiWrapperStyle}">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>📊 EBITDA Mensual Divergente (${mode === 'print' ? 'Papel' : 'Dashboard'})</span>
          ${mode === 'ui' ? `<span style="font-size:0.75rem;color:var(--text-muted);font-weight:normal;text-transform:none;">Pasa el cursor para ver fiabilidad y anomalías</span>` : ''}
        </div>
        <div style="overflow-x:auto;position:relative;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;overflow:visible;">
            ${svgContent}
          </svg>
          <div id="ebitda-chart-tooltip" class="kpi-badge-trust-tooltip" style="position:fixed;display:none;z-index:1000;pointer-events:none;background:rgba(18,18,18,0.96);border-radius:10px;padding:12px;width:280px;box-shadow:0 10px 40px rgba(0,0,0,0.6);"></div>
        </div>
      </div>
    `;

    if (mode === 'ui') {
      const tooltip = container.querySelector('#ebitda-chart-tooltip');
      const rects = container.querySelectorAll('rect.chart-bar-interactive');
      
      rects.forEach(rect => {
        rect.addEventListener('mousemove', (e) => {
          const idx = parseInt(rect.dataset.index);
          const item = chartData[idx];
          if (!item) return;

          const title = item.isForecast ? `Proyección Base` : `Mes Real: ${item.month}`;
          const valStr = fmt(item.value);
          const trustColor = item.trustScore >= 80 ? 'hsl(150, 70%, 75%)' : item.trustScore >= 60 ? 'hsl(38, 95%, 75%)' : 'hsl(355, 85%, 75%)';
          
          let anomaliesHtml = '';
          if (item.anomalies.length > 0) {
            anomaliesHtml = `
              <div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;">
                <div style="font-weight:600;color:var(--red);font-size:10px;text-transform:uppercase;margin-bottom:4px;">Anomalías:</div>
                <div style="display:flex;flex-direction:column;gap:3px;">
                  ${item.anomalies.map(a => `<div style="color:var(--text-secondary);font-size:10px;line-height:1.2;">⚠️ ${a.message}</div>`).join('')}
                </div>
              </div>
            `;
          }

          tooltip.style.display = 'block';
          const leftOffset = Math.min(window.innerWidth - 300, e.clientX + 15);
          const topOffset = Math.min(window.innerHeight - 150, e.clientY + 15);
          tooltip.style.left = `${leftOffset}px`;
          tooltip.style.top = `${topOffset}px`;

          tooltip.innerHTML = `
            <div style="font-family:var(--font-display);font-weight:700;font-size:11px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:3px;display:flex;justify-content:space-between;">
              <span>${title}</span>
              <span style="color:${trustColor};">Confianza: ${item.trustScore}%</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);">
              EBITDA: <strong style="color:var(--text-primary);font-size:12px;">${valStr}</strong>
            </div>
            ${anomaliesHtml}
          `;
        });

        rect.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      });
    }

  } catch (err) {
    console.error("Fallo renderDivergingEbitdaChart, degradación elegante:", err);
    container.innerHTML = generateContableTableFallback(data);
  }
}

/**
 * renderRunwayBurnChart(containerId, data, mode)
 * @description Genera un gráfico de doble eje perfectamente alineado en cero.
 * Representa Caja Final (área) y Burn Rate Neto (línea con marcadores) con alertas de runway < 3 meses.
 */
function renderRunwayBurnChart(containerId, data, mode = 'ui', customContainer = null) {
  const container = customContainer || document.getElementById(containerId);
  if (!container) return;

  try {
    const histData = (monthlyAnalysisCache || []).map(item => {
      const m = item.month;
      const cash = item.analysisResult.totales.cajaFinal || 0;
      const burn = item.analysisResult.totales.burnRateNeto || 0;
      const conf = data.confidence?.byMonth?.[m] || { trustScore: 100 };
      return {
        month: m,
        cash,
        burn,
        isForecast: false,
        trustScore: conf.trustScore
      };
    });

    if (!STATE.forecastResult && typeof buildForecast === 'function') {
      STATE.forecastResult = buildForecast(data, { crecimiento: 3, churn: 1, deltaOpex: 1, eventos: [] });
    }

    const foreData = (STATE.forecastResult?.scenarios?.base || []).map(r => ({
      month: r.mes,
      cash: r.caja || 0,
      burn: -r.ebitda || 0, 
      isForecast: true,
      trustScore: 100
    }));

    const allData = [...histData, ...foreData];

    if (allData.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay datos suficientes para Runway y Burn Rate</div>`;
      return;
    }

    const cashVals = allData.map(d => d.cash);
    const burnVals = allData.map(d => d.burn);

    const minCash = Math.min(...cashVals, 0);
    const maxCash = Math.max(...cashVals, 5000) * 1.15;
    const minBurn = Math.min(...burnVals, -1000) * 1.15;
    const maxBurn = Math.max(...burnVals, 1000) * 1.15;

    // Zero axis alignment logic!
    const aligned = alignZeroAxes(minCash, maxCash, minBurn, maxBurn);
    const rCashMin = aligned.min1, rCashMax = aligned.max1;
    const rBurnMin = aligned.min2, rBurnMax = aligned.max2;

    const rangeCash = rCashMax - rCashMin || 1;
    const rangeBurn = rBurnMax - rBurnMin || 1;

    const W = 800, H = 300;
    const PAD = { t: 45, r: 65, b: 40, l: 65 };
    const iW = W - PAD.l - PAD.r;
    const iH = H - PAD.t - PAD.b;

    const xScale = idx => PAD.l + (idx / (allData.length - 1 || 1)) * iW;
    const yScaleCash = val => PAD.t + iH - ((val - rCashMin) / rangeCash) * iH;
    const yScaleBurn = val => PAD.t + iH - ((val - rBurnMin) / rangeBurn) * iH;

    const zeroY = yScaleCash(0); 

    let svgContent = '';
    const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

    // Zero baseline
    svgContent += `
      <line x1="${PAD.l}" y1="${zeroY}" x2="${W - PAD.r}" y2="${zeroY}" stroke="${mode === 'print' ? '#111111' : 'var(--text-muted)'}" stroke-width="1.8" stroke-dasharray="${mode === 'print' ? 'none' : '3,3'}" />
    `;

    // Left Y-Axis ticks (Cash)
    const cashTicks = [rCashMin, (rCashMin + rCashMax)/2, rCashMax];
    cashTicks.forEach(tick => {
      const y = yScaleCash(tick);
      if (Math.abs(tick) < 0.1) return; 
      svgContent += `
        <line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${mode === 'print' ? '#eeeeee' : 'rgba(255,255,255,0.03)'}" stroke-width="1" />
        <text x="${PAD.l - 8}" y="${y + 3}" text-anchor="end" style="font-size:9px;fill:var(--cyan);font-family:var(--font-ui);font-variant-numeric:tabular-nums;">
          ${Math.abs(tick) >= 1000000 ? `${(tick / 1000000).toFixed(1)}M€` : Math.abs(tick) >= 1000 ? `${(tick / 1000).toFixed(0)}k€` : `${tick.toFixed(0)}€`}
        </text>
      `;
    });

    // Right Y-Axis ticks (Burn)
    const burnTicks = [rBurnMin, (rBurnMin + rBurnMax)/2, rBurnMax];
    burnTicks.forEach(tick => {
      const y = yScaleBurn(tick);
      if (Math.abs(tick) < 0.1) return; 
      svgContent += `
        <text x="${W - PAD.r + 8}" y="${y + 3}" text-anchor="start" style="font-size:9px;fill:${mode === 'print' ? '#ef4444' : 'var(--red)'};font-family:var(--font-ui);font-variant-numeric:tabular-nums;">
          ${Math.abs(tick) >= 1000000 ? `${(tick / 1000000).toFixed(1)}M€` : Math.abs(tick) >= 1000 ? `${(tick / 1000).toFixed(0)}k€` : `${tick.toFixed(0)}€`}
        </text>
      `;
    });

    // Divider Line for Forecast / History
    const histCount = histData.length;
    if (histCount > 0 && foreData.length > 0) {
      const divX = xScale(histCount - 0.5);
      const strokeColor = mode === 'print' ? '#666666' : 'var(--cyan)';
      svgContent += `
        <line x1="${divX}" y1="${PAD.t - 15}" x2="${divX}" y2="${H - PAD.b + 10}" stroke="${strokeColor}" stroke-width="1.2" stroke-dasharray="4,4" />
        <text x="${divX}" y="${PAD.t - 20}" text-anchor="middle" style="font-size:8px;font-weight:700;fill:${strokeColor};font-family:var(--font-display);">HISTÓRICO | FORECAST</text>
      `;
    }

    // Cash Area - Historical
    if (histData.length > 0) {
      const startX = xScale(0);
      const startY = zeroY;
      let points = `M ${startX} ${startY}`;
      histData.forEach((d, i) => {
        points += ` L ${xScale(i).toFixed(1)} ${yScaleCash(d.cash).toFixed(1)}`;
      });
      points += ` L ${xScale(histData.length - 1).toFixed(1)} ${startY} Z`;
      
      const fill = mode === 'print' ? 'rgba(94,170,181,0.1)' : 'rgba(0, 212, 255, 0.08)';
      svgContent += `<path d="${points}" fill="${fill}" stroke="none" />`;
    }

    // Cash Area - Forecast
    if (foreData.length > 0) {
      const startIdx = histData.length;
      const startX = xScale(startIdx - 1);
      const startY = zeroY;
      let points = `M ${startX} ${startY}`;
      const lastHistCash = histData.length > 0 ? histData[histData.length - 1].cash : 0;
      points += ` L ${startX.toFixed(1)} ${yScaleCash(lastHistCash).toFixed(1)}`;

      foreData.forEach((d, i) => {
        points += ` L ${xScale(startIdx + i).toFixed(1)} ${yScaleCash(d.cash).toFixed(1)}`;
      });
      points += ` L ${xScale(allData.length - 1).toFixed(1)} ${startY} Z`;
      
      const fill = mode === 'print' ? 'rgba(124, 111, 176, 0.05)' : 'rgba(124, 111, 176, 0.04)';
      svgContent += `<path d="${points}" fill="${fill}" stroke="none" />`;
    }

    // Cash line paths
    let cashLinePathHist = '';
    histData.forEach((d, i) => {
      cashLinePathHist += `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScaleCash(d.cash).toFixed(1)}`;
    });
    if (histData.length > 0) {
      svgContent += `<path d="${cashLinePathHist}" fill="none" stroke="var(--cyan)" stroke-width="2.5" />`;
    }

    let cashLinePathFore = '';
    if (foreData.length > 0) {
      const startIdx = histData.length;
      const lastHistCash = histData.length > 0 ? histData[histData.length - 1].cash : 0;
      cashLinePathFore += `M ${xScale(startIdx - 1).toFixed(1)} ${yScaleCash(lastHistCash).toFixed(1)}`;
      
      foreData.forEach((d, i) => {
        cashLinePathFore += ` L ${xScale(startIdx + i).toFixed(1)} ${yScaleCash(d.cash).toFixed(1)}`;
      });
      svgContent += `<path d="${cashLinePathFore}" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-dasharray="4,4" />`;
    }

    // Burn Rate Net line paths
    let burnLineHist = '';
    histData.forEach((d, i) => {
      burnLineHist += `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScaleBurn(d.burn).toFixed(1)}`;
    });
    if (histData.length > 0) {
      svgContent += `<path d="${burnLineHist}" fill="none" stroke="var(--red)" stroke-width="2.5" />`;
    }

    let burnLineFore = '';
    if (foreData.length > 0) {
      const startIdx = histData.length;
      const lastHistBurn = histData.length > 0 ? histData[histData.length - 1].burn : 0;
      burnLineFore += `M ${xScale(startIdx - 1).toFixed(1)} ${yScaleBurn(lastHistBurn).toFixed(1)}`;
      
      foreData.forEach((d, i) => {
        burnLineFore += ` L ${xScale(startIdx + i).toFixed(1)} ${yScaleBurn(d.burn).toFixed(1)}`;
      });
      svgContent += `<path d="${burnLineFore}" fill="none" stroke="#7c6fb0" stroke-width="2.5" stroke-dasharray="3,3" />`;
    }

    // Nodes and Warnings
    let containsCriticalAlert = false;
    let criticalFirstIndex = -1;

    allData.forEach((d, i) => {
      const cx = xScale(i);
      const cyCash = yScaleCash(d.cash);
      const cyBurn = yScaleBurn(d.burn);
      
      const runway = d.burn > 0 ? d.cash / d.burn : Infinity;
      const isCritical = runway < 3 && d.burn > 0;
      
      if (isCritical) {
        containsCriticalAlert = true;
        if (criticalFirstIndex === -1) criticalFirstIndex = i;
      }

      if (isCritical) {
        if (mode === 'print') {
          svgContent += `
            <circle cx="${cx}" cy="${cyCash}" r="6" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" />
            <line x1="${cx}" y1="${cyCash}" x2="${cx}" y2="${cyCash - 15}" stroke="#dc2626" stroke-width="1" stroke-dasharray="2,2" />
            <text x="${cx}" y="${cyCash - 18}" text-anchor="middle" style="font-size:7px;fill:#dc2626;font-weight:700;">⚠️ RUNWAY < 3M</text>
          `;
        } else {
          svgContent += `
            <circle cx="${cx}" cy="${cyCash}" r="9" fill="none" stroke="var(--red)" stroke-width="2.5" opacity="0.85">
              <animate attributeName="r" values="5;11;5" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="${cx}" cy="${cyCash}" r="4.5" fill="var(--red)" stroke="#ffffff" stroke-width="1.2" />
          `;
        }
      } else {
        const color = d.isForecast ? 'var(--purple)' : 'var(--cyan)';
        const pColor = mode === 'print' ? '#111111' : color;
        svgContent += `
          <circle cx="${cx}" cy="${cyCash}" r="3.5" fill="${pColor}" stroke="#ffffff" stroke-width="1" />
        `;
      }

      const bColor = d.isForecast ? '#7c6fb0' : 'var(--red)';
      const pbColor = mode === 'print' ? '#dc2626' : bColor;
      svgContent += `
        <circle cx="${cx}" cy="${cyBurn}" r="3.5" fill="${pbColor}" stroke="#ffffff" stroke-width="1" />
      `;

      const labelVisible = i === 0 || i === allData.length - 1 || i === histCount - 1 || isCritical;
      if (labelVisible) {
        if (!isCritical) {
          svgContent += `
            <text x="${cx}" y="${cyCash - 8}" text-anchor="middle" style="font-size:8px;fill:${mode === 'print' ? '#111111' : 'var(--text-secondary)'};font-family:var(--font-ui);font-weight:600;">
              ${fmt(d.cash)}
            </text>
          `;
        }
        svgContent += `
          <text x="${cx}" y="${cyBurn + 12}" text-anchor="middle" style="font-size:8px;fill:${mode === 'print' ? '#dc2626' : 'var(--text-muted)'};font-family:var(--font-ui);">
            ${fmt(d.burn)}
          </text>
        `;
      }

      const labelFrequency = allData.length > 15 ? 3 : 2;
      const isBoundaryMonth = i === 0 || i === allData.length - 1 || i === histCount - 1 || i === histCount;
      if (i % labelFrequency === 0 || isBoundaryMonth) {
        svgContent += `
          <text x="${cx}" y="${H - 10}" text-anchor="middle" style="font-size:8px;fill:${mode === 'print' ? '#555' : 'var(--text-muted)'};font-family:var(--font-display);">
            ${d.month}
          </text>
        `;
      }
    });

    if (mode === 'print') {
      container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="680" height="255" style="display:block; overflow:visible;">
          ${svgContent}
        </svg>
      `;
      return;
    }

    const isAlertActive = containsCriticalAlert;
    const alertStyle = (isAlertActive && mode === 'ui') ? 'pulse-danger' : '';
    const printClass = mode === 'print' ? 'chart-print-mode' : '';
    const uiWrapperStyle = mode === 'print' ? 'background:#fff;padding:16px;' : '';

    container.innerHTML = `
      <div class="card chart-container-card ${printClass} ${alertStyle}" style="${uiWrapperStyle}">
        <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>📊 Caja y Burn Rate Neto (${mode === 'print' ? 'Papel' : 'Dashboard'})</span>
          <span style="font-size:0.75rem;font-weight:normal;text-transform:none;display:flex;gap:12px;">
            <span style="color:var(--cyan);display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;background:var(--cyan);display:inline-block;border-radius:2px;"></span>Caja Acum. (Eje Izq.)</span>
            <span style="color:var(--red);display:flex;align-items:center;gap:4px;"><span style="width:12px;height:2px;background:var(--red);display:inline-block;"></span>Burn Neto (Eje Der.)</span>
          </span>
        </div>
        <div style="overflow-x:auto;">
          <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;overflow:visible;">
            ${svgContent}
          </svg>
        </div>
      </div>
    `;

  } catch (err) {
    console.error("Fallo renderRunwayBurnChart, degradación elegante:", err);
    container.innerHTML = generateContableTableFallback(data);
  }
}

/**
 * generateContableTableFallback(data)
 * @description Tabla de degradación elegante cuando hay fallos del dibujado de SVG nativos.
 */
function generateContableTableFallback(data) {
  const months = Object.keys(data.pygMensual || {}).sort();
  const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';
  
  const rows = months.map(m => {
    const ebitda = data.pygMensual[m].ebitda || 0;
    const cash = data.pygMensual[m].totalIngresos || 0; 
    const burn = data.totales.burnRateNeto || 0;
    return `
      <tr>
        <td style="font-weight:600;">${m}</td>
        <td class="td-num" style="color:${ebitda >= 0 ? 'var(--green)' : 'var(--red)'};">${fmt(ebitda)}</td>
        <td class="td-num">${fmt(cash)}</td>
        <td class="td-num" style="color:var(--red);">${fmt(burn)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card" style="border-color:var(--danger);padding:16px;">
      <div class="card-title" style="color:var(--danger);margin-bottom:8px;">⚠️ Fallback de Visualización Contable</div>
      <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:12px;">Se ha activado el modo de degradación elegante por fallo lógico inesperado en el motor de renderizado vectorial SVG.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th style="text-align:right">EBITDA</th>
              <th style="text-align:right">Ingresos (Hist.)</th>
              <th style="text-align:right">Burn Rate Promedio</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ---- Render: Trust Score ----
function renderTrustScore(confidence) {
  const el = document.getElementById('trust-score-value');
  const statusEl = document.getElementById('trust-score-status');
  const circleEl = document.getElementById('trust-score-circle');
  if (!el || !statusEl) return;

  const score = confidence.trustScore || 0;
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

  if (circleEl) {
    const circ = 2 * Math.PI * 15.9; // ~100
    const dash = `${(score / 100) * circ} ${circ}`;
    circleEl.style.strokeDasharray = dash;
    circleEl.style.stroke = color;
  }
}

// ---- Render: Audit Trail ----
function renderAuditTrail() {
  const container = document.getElementById('audit-trail-content');
  if (!container) return;

  const confidence = STATE.analysisResult?.confidence;
  const reasons = confidence?.auditReasons || [];
  const events = STATE.auditTrail || [];

  let confidenceHtml = '';
  if (reasons.length > 0) {
    confidenceHtml = `<div class="audit-reasons-list">` + reasons.map(reason => `
      <div class="audit-reason-item">${reason}</div>
    `).join('') + `</div>`;
  } else {
    confidenceHtml = `<div class="audit-empty-state">Sin observaciones técnicas en el motor de fiabilidad.</div>`;
  }

  let sessionHtml = '';
  if (events.length > 0) {
    sessionHtml = `<div class="audit-events-list">` + events.map(ev => {
      const time = new Date(ev.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `<div class="audit-event-item">
        <span class="audit-event-time">${time}</span>
        <strong class="audit-event-action">${ev.action}</strong>
        <span class="audit-event-detail">${ev.detail}</span>
      </div>`;
    }).join('') + `</div>`;
  } else {
    sessionHtml = `<div class="audit-empty-state">Sin eventos en la sesión de usuario.</div>`;
  }

  container.innerHTML = `
    <div class="audit-container">
      <div class="audit-section section-confidence">
        <div class="audit-section-header purple">⚙️ Confidence Engine Log</div>
        ${confidenceHtml}
      </div>
      <div class="audit-section section-session">
        <div class="audit-section-header cyan">👤 User Session Log</div>
        ${sessionHtml}
      </div>
    </div>
  `;
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
if (typeof renderKnowledge === 'function') renderKnowledge();

/**
 * renderRevenuesExpensesChart(containerId, data, mode)
 * @description Genera un gráfico agrupado de ingresos y gastos mensuales.
 * -------------------------------------------------------------------------
 * ARCHITECTURE SPRINT 4:
 * Consumidor puro del STATE. El modo 'print' dibuja el SVG estático directamente
 * sobre el árbol DOM aislado generado fuera de pantalla por preparePrintDOM(),
 * evitando duplicación de nodos interactivos y garantizando un PDF limpio.
 * -------------------------------------------------------------------------
 * El SVG de print es extremadamente austero en nodos: sin listeners de eventos,
 * sin etiquetas ocultas, sin grupos innecesarios y sin patrones de hatching redundantes.
 */
function renderRevenuesExpensesChart(containerId, data, mode = 'ui', customContainer = null) {
  const container = customContainer || document.getElementById(containerId);
  if (!container) return;

  try {
    const histMonths = Object.keys(data.pygMensual || {}).sort();
    
    if (!STATE.forecastResult && typeof buildForecast === 'function') {
      STATE.forecastResult = buildForecast(data, { crecimiento: 3, churn: 1, deltaOpex: 1, eventos: [] });
    }
    const foreMonths = STATE.forecastResult ? STATE.forecastResult.forecastMonths : [];
    
    const chartData = [];
    histMonths.forEach(m => {
      const rev = data.pygMensual[m].totalIngresos || 0;
      const exp = (data.pygMensual[m].totalIngresos || 0) - (data.pygMensual[m].ebitda || 0);
      const conf = data.confidence?.byMonth?.[m] || { trustScore: 100 };
      chartData.push({
        month: m,
        revenue: rev,
        expense: exp,
        isForecast: false,
        trustScore: conf.trustScore,
        anomalies: conf.anomalies || []
      });
    });
    
    foreMonths.forEach((m, idx) => {
      const projectedRev = STATE.forecastResult.scenarios.base[idx]?.ingresos || 0;
      const projectedExp = STATE.forecastResult.scenarios.base[idx]?.opex || 0;
      chartData.push({
        month: m,
        revenue: projectedRev,
        expense: projectedExp,
        isForecast: true,
        trustScore: 100,
        anomalies: []
      });
    });

    if (chartData.length === 0) {
      container.innerHTML = `<div class="empty-state">No hay datos suficientes para Ingresos vs. Gastos</div>`;
      return;
    }

    const allVals = chartData.flatMap(d => [d.revenue, d.expense]);
    const maxVal = Math.max(...allVals, 10000);
    const minVal = Math.min(...allVals, 0); 
    const visualMax = maxVal * 1.15;
    const visualMin = minVal < 0 ? minVal * 1.15 : 0;
    const range = visualMax - visualMin || 1;

    const W = 800, H = 260;
    const PAD = { t: 35, r: 25, b: 35, l: 65 };
    const iW = W - PAD.l - PAD.r;
    const iH = H - PAD.t - PAD.b;

    const yScale = v => {
      const clamped = Math.max(visualMin, Math.min(visualMax, v));
      return PAD.t + iH - ((clamped - visualMin) / range) * iH;
    };
    
    const y0 = yScale(0);
    const N = chartData.length;
    const W_mes = iW / N;

    const barWidth = 0.30 * W_mes;

    const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

    const buildSVG = (renderMode) => {
      let svgContent = '';
      
      if (renderMode === 'ui') {
        svgContent += `
          <defs>
            <pattern id="hatching-revenue-suspect" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(6, 182, 212, 0.4)" stroke-width="2.5" />
            </pattern>
            <pattern id="hatching-expense-suspect" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(239, 68, 68, 0.4)" stroke-width="2.5" />
            </pattern>
          </defs>
        `;
      }

      const ticks = [visualMin, (visualMin + visualMax) / 2, visualMax];
      ticks.forEach(tick => {
        const y = yScale(tick);
        const isZero = Math.abs(tick) < 0.1;
        const strokeColor = renderMode === 'print'
          ? (isZero ? '#111111' : '#dddddd')
          : (isZero ? 'var(--text-muted)' : 'rgba(255,255,255,0.06)');
        const strokeWidth = isZero ? 1.5 : 1;
        const dash = isZero ? (renderMode === 'print' ? 'none' : '3,3') : 'none';

        svgContent += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" />`;

        const formattedTick = Math.abs(tick) >= 1000000 
          ? `${(tick / 1000000).toFixed(1)}M€`
          : Math.abs(tick) >= 1000 
            ? `${(tick / 1000).toFixed(0)}k€` 
            : `${tick.toFixed(0)}€`;
        
        svgContent += `
          <text x="${PAD.l - 8}" y="${y + 3}" text-anchor="end" style="font-size:9px;fill:${renderMode === 'print' ? '#333' : 'var(--text-muted)'};font-family:var(--font-ui);font-variant-numeric:tabular-nums;">
            ${formattedTick}
          </text>
        `;
      });

      const histCount = histMonths.length;
      if (histCount > 0 && foreMonths.length > 0) {
        const dividerX = PAD.l + histCount * W_mes;
        const strokeColor = renderMode === 'print' ? '#666666' : 'var(--cyan)';
        svgContent += `
          <line x1="${dividerX}" y1="${PAD.t - 10}" x2="${dividerX}" y2="${H - PAD.b + 10}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="4,4" />
          <text x="${dividerX}" y="${PAD.t - 15}" text-anchor="middle" style="font-size:8px;font-weight:700;fill:${strokeColor};font-family:var(--font-display);">HISTÓRICO | FORECAST</text>
        `;
      }

      let peakRevIdx = -1, peakExpIdx = -1;
      let maxRevVal = -Infinity, maxExpVal = -Infinity;
      chartData.forEach((d, idx) => {
        if (d.revenue > maxRevVal) { maxRevVal = d.revenue; peakRevIdx = idx; }
        if (d.expense > maxExpVal) { maxExpVal = d.expense; peakExpIdx = idx; }
      });

      chartData.forEach((d, idx) => {
        const xBlock = PAD.l + idx * W_mes;
        const xRev = xBlock + 0.175 * W_mes;
        const xExp = xBlock + 0.525 * W_mes;
        
        const yRev = yScale(d.revenue);
        const hRev = Math.max(2, y0 - yRev);

        const yExp = yScale(d.expense);
        const hExp = Math.max(2, y0 - yExp);

        const isLowConf = d.trustScore < 75;

        let revFill = '';
        let revStroke = '';
        let revOpacity = '';
        
        if (d.isForecast) {
          if (renderMode === 'print') {
            revFill = 'fill="none"';
            revStroke = `stroke="#0ea5e9" stroke-width="1" stroke-dasharray="3,3"`;
          } else {
            revFill = 'fill="rgba(6, 182, 212, 0.08)"';
            revStroke = `stroke="var(--cyan)" stroke-width="1.5" stroke-dasharray="3,3"`;
          }
        } else if (isLowConf) {
          if (renderMode === 'print') {
            revFill = 'fill="#9fe5e8"';
            revStroke = `stroke="#0ea5e9" stroke-width="1"`;
          } else {
            revFill = 'fill="url(#hatching-revenue-suspect)"';
            revStroke = `stroke="var(--cyan)" stroke-width="1.5"`;
            revOpacity = 'opacity="0.7"';
          }
        } else {
          if (renderMode === 'print') {
            revFill = 'fill="#9fe5e8"';
            revStroke = `stroke="#0ea5e9" stroke-width="1"`;
          } else {
            revFill = 'fill="var(--cyan)"';
            revStroke = `stroke="rgba(255,255,255,0.08)" stroke-width="1"`;
          }
        }

        let expFill = '';
        let expStroke = '';
        let expOpacity = '';
        
        if (d.isForecast) {
          if (renderMode === 'print') {
            expFill = 'fill="none"';
            expStroke = `stroke="#ef4444" stroke-width="1" stroke-dasharray="3,3"`;
          } else {
            expFill = 'fill="rgba(239, 68, 68, 0.08)"';
            expStroke = `stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3,3"`;
          }
        } else if (isLowConf) {
          if (renderMode === 'print') {
            expFill = 'fill="#fca5a5"';
            expStroke = `stroke="#ef4444" stroke-width="1"`;
          } else {
            expFill = 'fill="url(#hatching-expense-suspect)"';
            expStroke = `stroke="var(--red)" stroke-width="1.5"`;
            expOpacity = 'opacity="0.7"';
          }
        } else {
          if (renderMode === 'print') {
            expFill = 'fill="#fca5a5"';
            expStroke = `stroke="#ef4444" stroke-width="1"`;
          } else {
            expFill = 'fill="var(--red)"';
            expStroke = `stroke="rgba(255,255,255,0.08)" stroke-width="1"`;
          }
        }

        const interactiveAttrsRev = renderMode === 'print' ? '' : `
          class="chart-bar-interactive-rev" 
          data-index="${idx}"
          style="cursor: pointer; transition: filter 0.15s ease;"
          onmouseover="this.setAttribute('filter', 'brightness(1.2)')"
          onmouseout="this.setAttribute('filter', 'none')"
        `;
        const interactiveAttrsExp = renderMode === 'print' ? '' : `
          class="chart-bar-interactive-exp" 
          data-index="${idx}"
          style="cursor: pointer; transition: filter 0.15s ease;"
          onmouseover="this.setAttribute('filter', 'brightness(1.2)')"
          onmouseout="this.setAttribute('filter', 'none')"
        `;

        svgContent += `
          <rect x="${xRev}" y="${yRev}" width="${barWidth}" height="${hRev}" ${revFill} ${revStroke} ${revOpacity} rx="2" ${interactiveAttrsRev} />
          <rect x="${xExp}" y="${yExp}" width="${barWidth}" height="${hExp}" ${expFill} ${expStroke} ${expOpacity} rx="2" ${interactiveAttrsExp} />
        `;

        if (renderMode === 'print') {
          if (idx === peakRevIdx) {
            svgContent += `
              <text x="${xRev + barWidth/2}" y="${yRev - 6}" text-anchor="middle" style="font-size:8px;font-weight:700;fill:#111111;font-family:var(--font-ui);">
                ${fmt(d.revenue)}
              </text>
            `;
          }
          if (idx === peakExpIdx) {
            svgContent += `
              <text x="${xExp + barWidth/2}" y="${yExp - 6}" text-anchor="middle" style="font-size:8px;font-weight:700;fill:#111111;font-family:var(--font-ui);">
                ${fmt(d.expense)}
              </text>
            `;
          }
        }

        // Etiquetado del eje X selectivo para evitar ruido en 24 meses y separar claramente histórico/forecast
        const midHistIdx = Math.floor(histCount / 2);
        const midForeIdx = histCount + Math.floor(foreMonths.length / 2);
        const isSelectedLabel = idx === 0 || 
                                idx === histCount - 1 || 
                                idx === histCount || 
                                idx === chartData.length - 1 ||
                                (idx === midHistIdx && midHistIdx > 1 && midHistIdx < histCount - 2) ||
                                (idx === midForeIdx && midForeIdx > histCount + 1 && midForeIdx < chartData.length - 2);

        if (isSelectedLabel) {
          svgContent += `
            <text x="${xBlock + W_mes/2}" y="${H - 12}" text-anchor="middle" style="font-size:8px;fill:${renderMode === 'print' ? '#555' : 'var(--text-muted)'};font-family:var(--font-display);">
              ${d.month}
            </text>
          `;
        }
      });

      const svgStyle = renderMode === 'print'
        ? 'display:block; overflow:visible;'
        : `width:100%;max-width:${W}px;display:block;overflow:visible;`;
      const widthAttr = renderMode === 'print' ? 'width="680" height="221"' : '';
      return `
        <svg viewBox="0 0 ${W} ${H}" ${widthAttr} style="${svgStyle}">
          ${svgContent}
        </svg>
      `;
    };

    if (mode === 'print') {
      const printSvgHtml = buildSVG('print');
      container.innerHTML = printSvgHtml;
      return;
    }

    if (mode === 'ui') {
      const uiSvgHtml = buildSVG('ui');
      container.innerHTML = `
        <div class="card chart-container-card">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">
            <span>📊 Evolución de Ingresos vs. Gastos</span>
            <span style="font-size:0.75rem;color:var(--text-muted);font-weight:normal;text-transform:none;">Pasa el cursor para ver fiabilidad y anomalías</span>
          </div>
          <div style="overflow-x:auto;position:relative;">
            ${uiSvgHtml}
            <div id="reveues-expenses-chart-tooltip" class="kpi-badge-trust-tooltip" style="position:fixed;display:none;z-index:1000;pointer-events:none;background:rgba(18,18,18,0.96);border-radius:10px;padding:12px;width:280px;box-shadow:0 10px 40px rgba(0,0,0,0.6);"></div>
          </div>
          <div style="display:flex;gap:20px;margin-top:12px;justify-content:center;flex-wrap:wrap;">
            <span style="font-size:0.78rem;color:var(--cyan);display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:var(--cyan);display:inline-block;border-radius:2px;"></span>Ingresos</span>
            <span style="font-size:0.78rem;color:var(--red);display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:var(--red);display:inline-block;border-radius:2px;"></span>Gastos</span>
            <span style="font-size:0.78rem;color:var(--text-muted);display:flex;align-items:center;gap:6px;"><span style="width:12px;height:12px;background:rgba(255,255,255,0.08);border:1.5px dashed var(--border);display:inline-block;border-radius:2px;"></span>Proyección</span>
          </div>
        </div>
      `;

      const tooltip = container.querySelector('#reveues-expenses-chart-tooltip');
      const bindTooltip = (selector, isRev) => {
        const rects = container.querySelectorAll(selector);
        rects.forEach(rect => {
          rect.addEventListener('mousemove', (e) => {
            const idx = parseInt(rect.dataset.index);
            const item = chartData[idx];
            if (!item) return;

            const title = item.isForecast ? `Proyección Base` : `Mes Real: ${item.month}`;
            const value = isRev ? item.revenue : item.expense;
            const typeStr = isRev ? 'Ingreso total' : 'Gasto total';
            const valStr = fmt(value);
            const trustColor = item.trustScore >= 80 ? 'hsl(150, 70%, 75%)' : item.trustScore >= 60 ? 'hsl(38, 95%, 75%)' : 'hsl(355, 85%, 75%)';
            
            let anomaliesHtml = '';
            if (item.anomalies.length > 0) {
              anomaliesHtml = `
                <div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;">
                  <div style="font-weight:600;color:var(--red);font-size:10px;text-transform:uppercase;margin-bottom:4px;">Anomalías:</div>
                  <div style="display:flex;flex-direction:column;gap:3px;">
                    ${item.anomalies.map(a => `<div style="color:var(--text-secondary);font-size:10px;line-height:1.2;">⚠️ ${a.message}</div>`).join('')}
                  </div>
                </div>
              `;
            }

            tooltip.style.display = 'block';
            const leftOffset = Math.min(window.innerWidth - 300, e.clientX + 15);
            const topOffset = Math.min(window.innerHeight - 150, e.clientY + 15);
            tooltip.style.left = `${leftOffset}px`;
            tooltip.style.top = `${topOffset}px`;

            tooltip.innerHTML = `
              <div style="font-family:var(--font-display);font-weight:700;font-size:11px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:3px;display:flex;justify-content:space-between;">
                <span>${title}</span>
                <span style="color:${trustColor};">Confianza: ${item.trustScore}%</span>
              </div>
              <div style="font-size:11px;color:var(--text-secondary);">
                ${typeStr}: <strong style="color:var(--text-primary);font-size:12px;">${valStr}</strong>
              </div>
              ${anomaliesHtml}
            `;
          });

          rect.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
          });
        });
      };

      bindTooltip('rect.chart-bar-interactive-rev', true);
      bindTooltip('rect.chart-bar-interactive-exp', false);
    } else {
      const printSvgHtml = buildSVG('print');
      container.innerHTML = `
        <div class="chart-container-card chart-print-mode" style="background:#fff;padding:16px;border:1px solid #ccc;border-radius:8px;">
          <div style="font-family:var(--font-display);font-size:11px;font-weight:700;margin-bottom:12px;color:#111;text-transform:uppercase;letter-spacing:0.05em;">
            📊 Evolución de Ingresos vs. Gastos (Copia Impresa)
          </div>
          <div style="overflow-x:auto;position:relative;">
            ${printSvgHtml}
          </div>
          <div style="display:flex;gap:20px;margin-top:12px;justify-content:center;flex-wrap:wrap;font-family:var(--font-ui);font-size:9px;color:#333;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;background:#9fe5e8;display:inline-block;border:1px solid #0ea5e9;"></span>Ingresos</span>
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;background:#fca5a5;display:inline-block;border:1px solid #ef4444;"></span>Gastos</span>
            <span style="display:flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border:1px dashed #777;display:inline-block;"></span>Proyección (Línea discontinua)</span>
          </div>
        </div>
      `;
    }

  } catch (err) {
    console.error("Fallo renderRevenuesExpensesChart, degradación elegante:", err);
    container.innerHTML = generateContableTableFallback(data);
  }
}

/**
 * renderForecastFanChart(containerId, data, mode)
 * @description Genera un abanico de evolución de caja con los tres escenarios.
 * -------------------------------------------------------------------------
 * ARCHITECTURE SPRINT 4:
 * Consumidor puro del STATE. El modo 'print' dibuja el SVG estático directamente
 * sobre el árbol DOM aislado generado fuera de pantalla por preparePrintDOM(),
 * evitando duplicación de nodos interactivos y garantizando un PDF limpio.
 * -------------------------------------------------------------------------
 * Garantiza total ausencia de overshoot usando interpolación lineal estricta.
 * El SVG de print es extremadamente austero en nodos: sin listeners de eventos,
 * sin etiquetas ocultas, sin grupos innecesarios y sin patrones de hatching redundantes.
 */
function renderForecastFanChart(containerId, data, mode = 'ui', customContainer = null) {
  const container = customContainer || document.getElementById(containerId);
  if (!container) return;

  try {
    if (!STATE.forecastResult && typeof buildForecast === 'function') {
      STATE.forecastResult = buildForecast(data, { crecimiento: 3, churn: 1, deltaOpex: 1, eventos: [] });
    }
    
    if (!STATE.forecastResult) {
      container.innerHTML = `<div class="empty-state">No hay proyecciones calculadas</div>`;
      return;
    }

    const { scenarios, forecastMonths, cajaInicial } = STATE.forecastResult;
    const histMonths = Object.keys(data.pygMensual || {}).sort();
    const lastHistMonth = histMonths[histMonths.length - 1] || 'Mes 0';

    const basePoints = [cajaInicial, ...scenarios.base.map(r => r.caja)];
    const optPoints = [cajaInicial, ...scenarios.optimista.map(r => r.caja)];
    const pesPoints = [cajaInicial, ...scenarios.pesimista.map(r => r.caja)];

    const allCashVals = [...basePoints, ...optPoints, ...pesPoints];
    const minCash = Math.min(...allCashVals, 0);
    const maxCash = Math.max(...allCashVals, 10000);
    const visualMax = maxCash * 1.15;
    const visualMin = minCash < 0 ? minCash * 1.15 : 0;
    const range = visualMax - visualMin || 1;

    const W = 800, H = 260;
    const PAD = { t: 35, r: 120, b: 35, l: 65 };
    const iW = W - PAD.l - PAD.r;
    const iH = H - PAD.t - PAD.b;

    const xScale = idx => PAD.l + (idx / 12) * iW;
    const yScale = v => {
      const clamped = Math.max(visualMin, Math.min(visualMax, v));
      return PAD.t + iH - ((clamped - visualMin) / range) * iH;
    };

    const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';

    const buildSVG = (renderMode) => {
      let svgContent = '';

      const ticks = [visualMin, (visualMin + visualMax) / 2, visualMax];
      ticks.forEach(tick => {
        const y = yScale(tick);
        const isZero = Math.abs(tick) < 0.1;
        const strokeColor = renderMode === 'print'
          ? (isZero ? '#111111' : '#dddddd')
          : (isZero ? 'var(--text-muted)' : 'rgba(255,255,255,0.06)');
        const strokeWidth = isZero ? 1.5 : 1;
        const dash = isZero ? (renderMode === 'print' ? 'none' : '3,3') : 'none';

        svgContent += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}" />`;

        const formattedTick = Math.abs(tick) >= 1000000 
          ? `${(tick / 1000000).toFixed(1)}M€`
          : Math.abs(tick) >= 1000 
            ? `${(tick / 1000).toFixed(0)}k€` 
            : `${tick.toFixed(0)}€`;
        
        svgContent += `
          <text x="${PAD.l - 8}" y="${y + 3}" text-anchor="end" style="font-size:9px;fill:${renderMode === 'print' ? '#333' : 'var(--text-muted)'};font-family:var(--font-ui);font-variant-numeric:tabular-nums;">
            ${formattedTick}
          </text>
        `;
      });

      const yZero = yScale(0);
      if (yZero >= PAD.t && yZero <= PAD.t + iH) {
        const strokeC = renderMode === 'print' ? '#000000' : 'rgba(255, 255, 255, 0.15)';
        svgContent += `<line x1="${PAD.l}" y1="${yZero}" x2="${W - PAD.r}" y2="${yZero}" stroke="${strokeC}" stroke-width="1.2" stroke-dasharray="3,3" />`;
      }

      const optPath = optPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
      const basePath = basePoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
      const pesPath = pesPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');

      if (renderMode === 'ui') {
        const optBasePoints = [
          ...optPoints.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`),
          ...basePoints.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).reverse()
        ].join(' ');

        const pesBasePoints = [
          ...pesPoints.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`),
          ...basePoints.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).reverse()
        ].join(' ');

        svgContent += `
          <polygon points="${optBasePoints}" fill="rgba(16, 185, 129, 0.06)" stroke="none" />
          <polygon points="${pesBasePoints}" fill="rgba(239, 68, 68, 0.05)" stroke="none" />
          
          <path d="${optPath}" fill="none" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${pesPath}" fill="none" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${basePath}" fill="none" stroke="var(--cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        `;
      } else {
        svgContent += `
          <path d="${optPath}" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="2,2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${pesPath}" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2,2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="${basePath}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        `;
      }

      const xEnd = xScale(12) + 8;
      const yOpt = yScale(optPoints[12]);
      const yBase = yScale(basePoints[12]);
      const yPes = yScale(pesPoints[12]);

      const labelStyle = `font-size:9px;font-weight:600;font-family:var(--font-ui);alignment-baseline:middle;`;
      
      const optColor = renderMode === 'print' ? '#16a34a' : 'var(--green)';
      const baseColor = renderMode === 'print' ? '#374151' : 'var(--cyan)';
      const pesColor = renderMode === 'print' ? '#dc2626' : 'var(--red)';

      svgContent += `
        <text x="${xEnd}" y="${yOpt}" fill="${optColor}" style="${labelStyle}">Optimista: ${fmt(optPoints[12])}</text>
        <text x="${xEnd}" y="${yBase}" fill="${baseColor}" style="${labelStyle}">Base: ${fmt(basePoints[12])}</text>
        <text x="${xEnd}" y="${yPes}" fill="${pesColor}" style="${labelStyle}">Pesimista: ${fmt(pesPoints[12])}</text>
      `;

      const xMonthLabels = [0, 3, 6, 9, 12];
      xMonthLabels.forEach(idx => {
        const x = xScale(idx);
        const mLabel = idx === 0 ? lastHistMonth : forecastMonths[idx - 1] || `Mes ${idx}`;
        svgContent += `
          <text x="${x}" y="${H - 12}" text-anchor="middle" style="font-size:8px;fill:${renderMode === 'print' ? '#555' : 'var(--text-muted)'};font-family:var(--font-display);">
            ${mLabel}
          </text>
        `;
      });

      const svgStyle = renderMode === 'print'
        ? 'display:block; overflow:visible;'
        : `width:100%;max-width:${W}px;display:block;overflow:visible;`;
      const widthAttr = renderMode === 'print' ? 'width="680" height="221"' : '';
      return `
        <svg viewBox="0 0 ${W} ${H}" ${widthAttr} style="${svgStyle}">
          ${svgContent}
        </svg>
      `;
    };

    if (mode === 'print') {
      const printSvgHtml = buildSVG('print');
      container.innerHTML = printSvgHtml;
      return;
    }

    if (mode === 'ui') {
      const uiSvgHtml = buildSVG('ui');
      container.innerHTML = uiSvgHtml;
    } else {
      const printSvgHtml = buildSVG('print');
      container.innerHTML = `
        <div class="chart-container-card chart-print-mode" style="background:#fff;padding:16px;border:1px solid #ccc;border-radius:8px;">
          <div style="font-family:var(--font-display);font-size:11px;font-weight:700;margin-bottom:12px;color:#111;text-transform:uppercase;letter-spacing:0.05em;">
            📈 Evolución de Caja — Proyección de Abanico (Copia Impresa)
          </div>
          ${printSvgHtml}
        </div>
      `;
    }

  } catch (err) {
    console.error("Fallo renderForecastFanChart, degradación elegante:", err);
    container.innerHTML = `<div class="empty-state">Error al renderizar el gráfico en abanico</div>`;
  }
}

