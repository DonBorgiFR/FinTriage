/**
 * session.js — Gestor de persistencia de sesiones (.fintriage) con Soporte Dual de Cartera
 * Permite guardar y cargar sesiones individuales y carteras multi-empresa consolidadas.
 */

/**
 * exportSession()
 * @description Empaqueta el estado de la aplicación. Si STATE.carteraMode está activo,
 * genera una sesión de cartera unificada. Si está en modo individual, genera una sesión estándar.
 */
function exportSession() {
  if (STATE.carteraMode) {
    exportPortfolioSession();
    return;
  }

  if (!STATE.analysisResult && !STATE.parsedLedger) {
    showToast('No hay datos para guardar', 'error');
    return;
  }

  // Clonamos el estado para guardarlo de forma limpia
  const sessionData = {
    version: '1.2',
    timestamp: new Date().toISOString(),
    mode: 'single',
    parsedLedger: STATE.parsedLedger,
    selectedProfileId: STATE.selectedProfile?.id,
    customMapping: STATE.customMapping,
    extraInputs: STATE.extraInputs,
    empresa: STATE.empresa,
    scoringInputs: STATE.scoringInputs,
    approvedAccruals: STATE.approvedAccruals,
    forecastScenario: STATE.forecastScenario,
    contextChecklist: STATE.contextChecklist || null,
    auditTrail: STATE.auditTrail,
    defensaPlanChoqueChecked: STATE.defensaPlanChoqueChecked || [],
    defensaSimulacionInputs: STATE.defensaSimulacionInputs || null
  };

  const dataStr = JSON.stringify(sessionData);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  
  const safeName = (STATE.empresa.nombre || 'sesion').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${safeName}.fintriage`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Sesión guardada exitosamente ✓', 'success');
}

/**
 * exportPortfolioSession()
 * @description Exporta la lista completa de startups de la cartera en un único archivo consolidado .fintriage.
 */
function exportPortfolioSession() {
  if (!STATE.cartera || STATE.cartera.length === 0) {
    showToast('No hay cartera activa para guardar', 'error');
    return;
  }

  const portfolioData = {
    version: '1.2',
    timestamp: new Date().toISOString(),
    mode: 'portfolio',
    startups: STATE.cartera.map(st => ({
      nombre: st.nombre,
      arquetipo: st.arquetipo,
      selectedProfileId: st.selectedProfileId,
      sessionData: st.sessionData
    }))
  };

  const dataStr = JSON.stringify(portfolioData);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `cartera_fintriage_${new Date().toISOString().slice(0, 10)}.fintriage`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Cartera consolidada guardada ✓', 'success');
}

/**
 * importSession(file)
 * @description Lee un archivo `.fintriage` o `.aptki`, decodifica el JSON y determina de forma transparente
 * si es un archivo de cartera o de startup única, rehidratando la UI de manera correspondiente.
 */
function importSession(file) {
  if (!file.name.endsWith('.fintriage') && !file.name.endsWith('.aptki') && !file.name.endsWith('.json')) {
    showToast('Formato de archivo no válido. Usa .fintriage', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Control de Modo de Carga
      if (data.mode === 'portfolio' || Array.isArray(data.startups)) {
        // Carga en Modo Cartera
        STATE.carteraMode = true;
        STATE.cartera = data.startups.map(st => {
          // Re-calcular triage para cada elemento al importar
          const startupObj = {
            nombre: st.nombre,
            arquetipo: st.arquetipo || 'General',
            selectedProfileId: st.selectedProfileId,
            sessionData: st.sessionData
          };
          if (typeof evaluateStartupTriage === 'function') {
            return evaluateStartupTriage(startupObj);
          }
          return startupObj;
        });
        
        // Limpiamos la empresa activa del dashboard individual
        clearActiveSingleSession();

        showToast(`Cartera cargada con ${STATE.cartera.length} startups ✓`, 'success');
        if (typeof navigate === 'function') navigate('cartera');
        if (typeof renderCarteraTab === 'function') renderCarteraTab();
        
      } else {
        // Carga en Modo Empresa Única Estándar
        STATE.carteraMode = false;
        loadSingleSessionData(data, file.name);
      }

    } catch (err) {
      console.error(err);
      showToast('Error al leer el archivo de sesión', 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * clearActiveSingleSession()
 * @description Limpia el estado individual activo de la workstation al pasar a modo cartera global.
 */
function clearActiveSingleSession() {
  STATE.parsedLedger = null;
  STATE.analysisResult = null;
  STATE.selectedProfile = null;
  STATE.customMapping = null;
  STATE.empresa = { nombre: '', sector: '', empleados: 0 };
  STATE.scoringResult = null;
  STATE.forecastResult = null;
  
  const badge = document.getElementById('empresa-badge');
  if (badge) badge.textContent = 'Modo Cartera Multicompañía';
}

/**
 * loadSingleSessionData(data, filename)
 * @description Rehidrata el estado individual de la aplicación con un payload de sesión único.
 */
function loadSingleSessionData(data, filename) {
  STATE.parsedLedger = data.parsedLedger;
  STATE.customMapping = data.customMapping;
  STATE.extraInputs = data.extraInputs || {};
  STATE.empresa = data.empresa || { nombre: '', sector: '', empleados: 0 };
  STATE.scoringInputs = data.scoringInputs || {};
  STATE.approvedAccruals = data.approvedAccruals || [];
  STATE.forecastScenario = data.forecastScenario || 'base';
  STATE.auditTrail = data.auditTrail || [];
  STATE.contextChecklist = data.contextChecklist || null;
  STATE.defensaPlanChoqueChecked = data.defensaPlanChoqueChecked || [];
  STATE.defensaSimulacionInputs = data.defensaSimulacionInputs || null;
  
  if (typeof logAudit === 'function') logAudit('Sesión restaurada', `Desde archivo ${filename}`);

  if (data.selectedProfileId) {
    STATE.selectedProfile = BUSINESS_PROFILES.find(p => p.id === data.selectedProfileId);
  }

  const badge = document.getElementById('empresa-badge');
  if (badge) {
    badge.textContent = `${STATE.empresa.nombre || 'Sesión Recuperada'} · ${STATE.selectedProfile?.icon || ''} ${STATE.selectedProfile?.name || ''}`;
  }

  // Reconstrucción del análisis reactivo si los datos del core están presentes
  if (STATE.parsedLedger && STATE.customMapping && STATE.selectedProfile) {
    STATE.analysisResult = analyzeLedger(
      STATE.parsedLedger,
      STATE.selectedProfile.id,
      STATE.customMapping,
      STATE.approvedAccruals,
      STATE.contextChecklist
    );
    STATE.accrualsReviewed = true;
    
    if (typeof scoreFinanciacion === 'function') {
       STATE.scoringResult = scoreFinanciacion(STATE.analysisResult, STATE.scoringInputs);
    }
    
    if (typeof buildForecast === 'function') {
       FORECAST_HYP = null;
       STATE.forecastResult = buildForecast(STATE.analysisResult, typeof _getDefaultHyp === 'function' ? _getDefaultHyp() : {});
    }

    showToast('Sesión cargada. Análisis restaurado.', 'success');
    if (typeof navigate === 'function') navigate('dashboard');
  } else {
    showToast('Sesión cargada parcialmente. Faltan datos.', 'warn');
  }
}

/**
 * addSessionToCartera(file)
 * @description Procesa un archivo .fintriage o .aptki individual y lo agrega a la cartera activa en memoria,
 * re-evaluando su triage financiero.
 */
function addSessionToCartera(file) {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.fintriage') && !file.name.endsWith('.aptki') && !file.name.endsWith('.json')) {
      showToast('Formato no válido para cartera. Usa .fintriage', 'error');
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.mode === 'portfolio') {
          showToast('No puedes agregar una cartera consolidada a otra activa', 'error');
          resolve(null);
          return;
        }

        // Construir objeto provisional de startup
        const startupObj = {
          nombre: data.empresa?.nombre || file.name.replace('.fintriage', '').replace('.aptki', ''),
          arquetipo: BUSINESS_PROFILES.find(p => p.id === data.selectedProfileId)?.name || 'General',
          selectedProfileId: data.selectedProfileId,
          sessionData: data
        };

        // Procesar triage
        let evaluated = startupObj;
        if (typeof evaluateStartupTriage === 'function') {
          evaluated = evaluateStartupTriage(startupObj);
        }

        // Evitar duplicidades por nombre
        STATE.cartera = STATE.cartera.filter(st => st.nombre !== evaluated.nombre);
        STATE.cartera.push(evaluated);

        resolve(evaluated);
      } catch (err) {
        console.error(err);
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
}

// Carga en lote de múltiples archivos en el modo cartera
async function importMultipleSessionsInBatch(files) {
  let count = 0;
  for (const file of files) {
    const res = await addSessionToCartera(file);
    if (res) count++;
  }
  
  if (count > 0) {
    STATE.carteraMode = true;
    clearActiveSingleSession();
    showToast(`Se agregaron ${count} startups a la cartera ✓`, 'success');
    if (typeof navigate === 'function') navigate('cartera');
    if (typeof renderCarteraTab === 'function') renderCarteraTab();
  }
}

// Escuchar cambios en un input oculto para cargar sesiones
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('session-upload-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        if (e.target.files.length === 1) {
          importSession(e.target.files[0]);
        } else {
          importMultipleSessionsInBatch(Array.from(e.target.files));
        }
      }
    });
  }
});
