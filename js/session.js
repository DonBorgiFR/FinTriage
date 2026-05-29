/**
 * session.js — Gestor de persistencia de sesiones (.fintriage) con Soporte Dual de Cartera
 * Permite guardar y cargar sesiones individuales y carteras multi-empresa consolidadas.
 */

/**
 * exportSession()
 * @description Empaqueta el estado de la aplicación y genera una sesión estándar de empresa única.
 */
function exportSession() {
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
    defensaSimulacionInputs: STATE.defensaSimulacionInputs || null,
    defensaIntensidad: STATE.defensaIntensidad || 'defensivo',
    defensaPrioridades: STATE.defensaPrioridades || ['reduccion_opex', 'agilizar_cobros']
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
        showToast('El formato de cartera consolidada no está soportado en esta versión individual simplificada', 'error');
      } else {
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
  
  // Inicialización defensiva de contextChecklist para sesiones antiguas (Matiz 1)
  const cc = data.contextChecklist || {};
  STATE.contextChecklist = {
    coveragePeriod: cc.coveragePeriod || 'complete',
    closeStatus: cc.closeStatus || 'final_close',
    externalReview: cc.externalReview || 'none',
    bridgeAccounts: cc.bridgeAccounts || 'none',
    reconciliationIssues: cc.reconciliationIssues || 'none',
    publicDebtRisk: cc.publicDebtRisk || 'none',
    cfoConfidence: cc.cfoConfidence !== undefined ? cc.cfoConfidence : 5,
    distortions: cc.distortions || [],
    
    // Perfil Empresarial Ampliado defensivo
    fechaConstitucion: cc.fechaConstitucion || null,
    ccaaFiscal: cc.ccaaFiscal || null,
    cuentasAuditadas: cc.cuentasAuditadas !== undefined ? cc.cuentasAuditadas : null,
    numEmpleados: cc.numEmpleados !== undefined ? cc.numEmpleados : null,
    pctVentasExterior: cc.pctVentasExterior !== undefined ? cc.pctVentasExterior : null,
    trl: cc.trl !== undefined ? cc.trl : null,
    tieneActividadID: cc.tieneActividadID !== undefined ? cc.tieneActividadID : false,
    quiereContratarDoctor: cc.quiereContratarDoctor !== undefined ? cc.quiereContratarDoctor : false,
    inversionExterior: cc.inversionExterior !== undefined ? cc.inversionExterior : false,
    tieneIP: cc.tieneIP !== undefined ? cc.tieneIP : false,
    eicConcedidoPrevio: cc.eicConcedidoPrevio !== undefined ? cc.eicConcedidoPrevio : false,
    proyectoVerde: cc.proyectoVerde !== undefined ? cc.proyectoVerde : false
  };

  STATE.defensaPlanChoqueChecked = data.defensaPlanChoqueChecked || [];
  STATE.defensaSimulacionInputs = data.defensaSimulacionInputs || null;
  STATE.defensaIntensidad = data.defensaIntensidad || 'defensivo';
  STATE.defensaPrioridades = data.defensaPrioridades || ['reduccion_opex', 'agilizar_cobros'];
  
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

// Escuchar cambios en un input oculto para cargar sesiones
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('session-upload-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importSession(e.target.files[0]);
      }
    });
  }
});
