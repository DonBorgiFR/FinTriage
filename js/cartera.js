/**
 * js/cartera.js — Motor de Triage, Diagnóstico y Routing de Cartera (Fase 8)
 * Implementa la lógica determinista para evaluar, priorizar y enrutar startups de forma tabular.
 */

/**
 * evaluateStartupTriage(startupObj)
 * @description Toma el objeto de startup y re-evalúa de forma determinista su estado financiero,
 * calculando el Priority Score (0-100), el Foco Principal, Bloqueadores y la Ruta Sugerida.
 * @param {Object} startupObj - Objeto con { nombre, arquetipo, selectedProfileId, sessionData }
 * @returns {Object} El objeto de startup enriquecido con KPIs y el diagnóstico tridimensional
 */
function evaluateStartupTriage(startupObj) {
  const data = startupObj.sessionData;
  if (!data) return startupObj;

  // Rehidratar análisis contable llamando de forma segura a analyzeLedger (de analyzer.js)
  let analysis = null;
  if (typeof analyzeLedger === 'function' && data.parsedLedger && data.selectedProfileId && data.customMapping) {
    try {
      analysis = analyzeLedger(
        data.parsedLedger,
        data.selectedProfileId,
        data.customMapping,
        data.approvedAccruals || [],
        data.contextChecklist || null
      );
    } catch (e) {
      console.error(`Error al analizar ledger de ${startupObj.nombre}:`, e);
    }
  }

  // Valores por defecto null-safety
  let caja = 0;
  let burnRate = 0;
  let trustScore = 100;
  let ingresosAnuales = 0;
  let balance = null;
  let saldoCuenta = {};
  let checklistPct = 0;

  if (analysis) {
    caja = analysis.totales?.cajaFinal ?? 0;
    burnRate = analysis.totales?.burnRateNeto ?? 0;
    trustScore = analysis.confidence?.trustScore ?? 100;
    ingresosAnuales = analysis.totales?.ingresos ?? 0;
    balance = analysis.balance;
    saldoCuenta = analysis.totales?.saldoCuenta ?? {};
    
    // Checklist
    if (data.contextChecklist) {
      const items = Object.values(data.contextChecklist);
      const total = items.length;
      const checked = items.filter(v => v === true).length;
      checklistPct = total > 0 ? Math.round((checked / total) * 100) : 0;
    }
  } else {
    // Si no hay diario, usar inputs manuales extraídos del sessionData o valores seguros
    caja = data.extraInputs?.cajaInicial ?? 0;
    burnRate = data.extraInputs?.burnRateEstimado ?? 0;
  }

  // 1. Calcular Runway (meses)
  let runway = 99; // Rentable o sin burn rate
  if (burnRate > 0) {
    runway = Number((caja / burnRate).toFixed(1));
  }

  // 2. Evaluar saldos contables críticos de balance y señales canónicas de anomalías
  let deudaPublicaTotal = 0; // Grupo 47 neto acreedor (haber - debe > 0 indica pasivo contable)
  let capitalSocial = 0;     // Grupo 10 (Capital)
  let saldoNeto551 = 0;      // Grupo 551/550 neto (haber - debe)

  for (const [cta, val] of Object.entries(saldoCuenta)) {
    if (cta.startsWith('47')) {
      deudaPublicaTotal += val; // haber - debe
    } else if (cta.startsWith('551') || cta.startsWith('550')) {
      saldoNeto551 += val; // haber - debe
    } else if (cta.startsWith('10')) {
      capitalSocial += val; // haber - debe (saldo acreedor)
    }
  }

  deudaPublicaTotal = Math.max(0, deudaPublicaTotal);
  capitalSocial = Math.max(0, capitalSocial);

  // Determinar importes individuales según el signo neto de la cuenta corriente
  const prestamosSocios = saldoNeto551 < 0 ? -saldoNeto551 : 0; // Saldo deudor (activo)
  const socioAcreedor = saldoNeto551 > 0 ? saldoNeto551 : 0;    // Saldo acreedor (pasivo)

  // Señales canónicas del motor de anomalías (convergencia estricta sin duplicidad semántica)
  const hasAnomalyPrestamosSocios = analysis?.anomalies?.some(a => a.id === 'prestamos_socios') ?? false;
  const hasAnomalySocioAcreedor = analysis?.anomalies?.some(a => a.id === 'cuenta_551_acreedora') ?? false;

  // 3. Estimar DSO y DPO reales por prefijo
  let saldoClientes = 0;
  let saldoProveedores = 0;
  for (const [cta, val] of Object.entries(saldoCuenta)) {
    if (cta.startsWith('43')) {
      saldoClientes += -val; // Saldo deudor: debe - haber
    } else if (cta.startsWith('40')) {
      saldoProveedores += val; // Saldo acreedor: haber - debe
    }
  }
  saldoClientes = Math.max(0, saldoClientes);
  saldoProveedores = Math.max(0, saldoProveedores);

  const numMeses = Math.max(1, Object.keys(data.parsedLedger?.byMonth || {}).length);
  const ingresosMes = (analysis?.totales?.ingresos ?? 0) / numMeses;
  const gastosMes = (analysis?.totales?.gastos ?? 0) / numMeses;

  const dso = ingresosMes > 0 ? Math.max(0, (saldoClientes / ingresosMes) * 30.4) : 0;
  const dpo = gastosMes > 0 ? Math.max(0, (saldoProveedores / gastosMes) * 30.4) : 0;

  // ---- EVALUACIÓN DE NIVELES (DIAGNÓSTICO TRIDIMENSIONAL) ----

  // NIVEL 1: Problema Principal (Foco)
  let foco = "Materiales y caso financiero"; // Foco por defecto
  let accion = "Completar checklist Día 1, armar deck de inversión y proyecciones.";

  if (runway < 4) {
    foco = "Caja";
    accion = "Activar Plan de Choque de 100 días, renegociar plazos y recortar burn rate.";
  } else if (deudaPublicaTotal > 3000) {
    foco = "Deuda Pública";
    accion = `Regularizar deuda fiscal de ${deudaPublicaTotal.toLocaleString('es-ES')}€ (Grupo 47) o pactar aplazamiento.`;
  } else if (hasAnomalyPrestamosSocios) {
    foco = "Financiabilidad";
    accion = `Saneamiento de balance: Socios deben devolver préstamo de ${prestamosSocios.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (Cuenta 551/550).`;
  } else if (hasAnomalySocioAcreedor) {
    foco = "Financiabilidad";
    accion = `Formalización mercantil: Formalizar préstamo por saldo acreedor de ${socioAcreedor.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (Cuenta 551/550) al 3,25% legal.`;
  } else if (dso > 75 && dso > dpo + 15) {
    foco = "Circulante";
    accion = `Optimización de cobros (DSO ${Math.round(dso)} días vs DPO ${Math.round(dpo)} días). Iniciar Factoring.`;
  } else if (ingresosMes > 0 && (gastosMes / ingresosMes) > 1.8 && arquetipoDistintoSaaS(startupObj.arquetipo)) {
    foco = "Costes";
    accion = "Ajustar estructura de costes de personal o servicios operativos inmediatamente.";
  }

  // NIVEL 2: Bloqueadores Activos
  let bloqueador = null;
  if (trustScore < 65) {
    bloqueador = "Conciliación y Orden Contable";
    accion = `BLOQUEADO por Trust Score crítico (${Math.round(trustScore)}%). Gestoría debe conciliar cuentas puente 555 y bancos.`;
  } else if (deudaPublicaTotal > 3000) {
    bloqueador = "Regularización Deuda Pública";
    accion = `BLOQUEADO por contingencia de ${deudaPublicaTotal.toLocaleString('es-ES')}€ con Hacienda/SS. Liquidar o aplazar deudas.`;
  } else if (hasAnomalyPrestamosSocios) {
    bloqueador = "Saneamiento Socios (Due Diligence)";
    accion = `BLOQUEADO por préstamo a socios de ${prestamosSocios.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ en Cuenta 551/550. Regularizar préstamo.`;
  } else if (hasAnomalySocioAcreedor) {
    bloqueador = "Saneamiento Socios (Due Diligence)";
    accion = `BLOQUEADO por aportación no regulada de socios de ${socioAcreedor.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ en Cuenta 551/550. Formalizar contrato.`;
  }

  // NIVEL 3: Ruta Sugerida Final
  let ruta = "CFO";
  if (bloqueador) {
    ruta = "Gestoría / Orden Contable";
  } else {
    // Si no hay bloqueador, evaluar rutas de negocio
    if (foco === "Caja" || foco === "Costes") {
      ruta = "CFO";
    } else if (foco === "Circulante") {
      ruta = "Financiación Bancaria";
      accion = `Activar líneas de Factoring o póliza sobre clientes solventes (DSO ${Math.round(dso)} días).`;
    } else if (evaluarElegibilidadPublica(deudaPublicaTotal, trustScore, balance, checklistPct)) {
      ruta = "Financiación Pública";
      accion = "Cumple criterios: Iniciar tramitación expediente ENISA (Crecimiento o Jóvenes Emprendedores).";
    } else if (runway >= 3 && runway <= 9 && !hasAnomalyPrestamosSocios && !hasAnomalySocioAcreedor) {
      ruta = "Fundraising";
      accion = "Iniciar preparación de deck, estructurar nota puente y activar red de Business Angels.";
    } else if (foco === "Materiales y caso financiero") {
      ruta = "Fundraising";
    }
  }

  // ---- Priority Score (0-100) ----
  let scorePoints = 0;
  // Runway
  if (runway < 3) scorePoints += 40;
  else if (runway >= 3 && runway < 6) scorePoints += 20;

  // Bloqueadores
  if (bloqueador) scorePoints += 25;

  // Trust Score
  if (trustScore < 55) scorePoints += 15;
  else if (trustScore >= 55 && trustScore < 70) scorePoints += 5;

  // Circulante
  if (dso > 75 && runway < 6) scorePoints += 20;
  else if (dso > 60) scorePoints += 10;

  const priorityScore = Math.min(100, scorePoints);

  // Semáforo de Urgencia
  let semaforo = "🟢"; // Verde
  if (priorityScore >= 70 || runway < 3) {
    semaforo = "🔴"; // Rojo
  } else if (priorityScore >= 40) {
    semaforo = "🟡"; // Amarillo
  }

  // Enriquecer objeto
  return {
    ...startupObj,
    runway,
    trustScore: Math.round(trustScore),
    focoPrincipal: foco,
    bloqueador: bloqueador,
    rutaSugerida: ruta,
    accionSiguiente: accion,
    priorityScore,
    semaforo,
    dso: Math.round(dso),
    dpo: Math.round(dpo),
    caja: Math.round(caja),
    burnRate: Math.round(burnRate)
  };
}

/**
 * evaluarElegibilidadPublica
 * @description Evalúa estrictamente si la startup cumple criterios contables y comerciales para ENISA
 */
function evaluarElegibilidadPublica(deudaPublica, trustScore, balance, checklistPct) {
  if (deudaPublica > 3000) return false;
  if (trustScore < 70) return false;
  
  // Fondos Propios plausibles: Grupo 1 del patrimonio neto positivo
  const patrimonioNeto = balance?.patrimonioNeto ?? 0;
  if (patrimonioNeto <= 0) return false;

  // Hitos e innovación defendibles
  if (checklistPct < 60) return false;

  return true;
}

function arquetipoDistintoSaaS(arquetipo) {
  if (!arquetipo) return true;
  return !arquetipo.toLowerCase().includes('saas');
}

/**
 * loadActiveStartupFromCartera(nombre)
 * @description Carga el sessionData de la startup de cartera activa en el dashboard principal
 * de la SPA para permitir un análisis profundo.
 */
function loadActiveStartupFromCartera(nombre) {
  const startup = STATE.cartera.find(st => st.nombre === nombre);
  if (!startup || !startup.sessionData) {
    showToast('Esta startup no contiene datos cargados', 'error');
    return;
  }
  
  STATE.carteraMode = false;
  STATE.carteraActiveStartup = startup.nombre;
  
  // Llamamos al helper cargador de session.js
  loadSingleSessionData(startup.sessionData, `${startup.nombre}_aptki.aptki`);
  
  showToast(`Analizando startup "${startup.nombre}" de forma individual ✓`, 'success');
  if (typeof navigate === 'function') navigate('dashboard');
}

/**
 * removeStartupFromCartera(nombre)
 * @description Elimina una startup de la cartera activa en memoria y actualiza la tabla.
 */
function removeStartupFromCartera(nombre) {
  STATE.cartera = STATE.cartera.filter(st => st.nombre !== nombre);
  showToast(`Startup "${nombre}" eliminada de la cartera`, 'info');
  
  // Limpiar ficha si la que se borra estaba seleccionada
  const handoffCard = document.getElementById('cartera-handoff-card');
  if (handoffCard) handoffCard.style.display = 'none';

  renderCarteraTab();
}

/**
 * renderCarteraTab()
 * @description Dibuja la cuadrícula tabular de startups de la cartera en el DOM.
 */
function renderCarteraTab() {
  const containerBody = document.getElementById('cartera-table-body');
  if (!containerBody) return;

  const kpiCaja = document.getElementById('cartera-kpi-caja');
  const kpiRojo = document.getElementById('cartera-kpi-rojo');
  const kpiTotal = document.getElementById('cartera-kpi-total');
  const handoffCard = document.getElementById('cartera-handoff-card');
  
  if (STATE.cartera.length === 0) {
    containerBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 32px 0;">
          No hay startups en la cartera contable. Arrastra archivos <strong>.aptki</strong> para rellenar el triage.
        </td>
      </tr>
    `;
    if (kpiCaja) kpiCaja.textContent = '0 €';
    if (kpiRojo) kpiRojo.textContent = '0';
    if (kpiTotal) kpiTotal.textContent = '0';
    if (handoffCard) handoffCard.style.display = 'none';
    return;
  }

  // Recalcular KPIs agregados
  let totalCaja = 0;
  let totalAlertasRoja = 0;
  
  STATE.cartera.forEach(st => {
    totalCaja += st.caja || 0;
    if (st.semaforo === "🔴") totalAlertasRoja++;
  });

  if (kpiCaja) kpiCaja.textContent = `${totalCaja.toLocaleString('es-ES')} €`;
  if (kpiRojo) kpiRojo.textContent = totalAlertasRoja;
  if (kpiTotal) kpiTotal.textContent = STATE.cartera.length;

  // Renderizar filas
  containerBody.innerHTML = STATE.cartera.map(st => {
    const semaforoClass = st.semaforo === "🔴" ? "roja" : st.semaforo === "🟡" ? "amarilla" : "verde";
    const runwayText = st.runway === 99 ? 'Rentable 🟢' : `${st.runway} meses`;
    const trustScoreClass = st.trustScore < 60 ? 'color: var(--red); font-weight: bold;' : '';

    return `
      <tr class="cartera-row" id="row-${st.nombre.replace(/[^a-z0-9]/gi, '_')}" onclick="selectCarteraStartup('${st.nombre.replace(/'/g, "\\'")}')">
        <td style="font-weight: bold; color: var(--text-primary); padding: 12px 8px;">
          ${st.nombre} <br/>
          <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">${st.arquetipo}</span>
        </td>
        <td style="text-align: center;">
          <span class="badge-prioridad ${semaforoClass}">${runwayText}</span>
        </td>
        <td style="text-align: center; ${trustScoreClass}">${st.trustScore}%</td>
        <td>
          <span style="font-weight: 500; color: var(--text-primary);">${st.focoPrincipal}</span>
        </td>
        <td>
          <span style="color: var(--purple); font-weight: 600;">${st.rutaSugerida}</span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 250px; line-height: 1.3;">
          ${st.bloqueador ? `<strong style="color: var(--red);">[${st.bloqueador}]</strong> ` : ''}${st.accionSiguiente}
        </td>
        <td style="text-align: right; white-space: nowrap; padding: 12px 8px;">
          <button class="btn btn-primary" onclick="event.stopPropagation(); loadActiveStartupFromCartera('${st.nombre.replace(/'/g, "\\'")}')" style="padding: 4px 10px; font-size: 0.75rem; margin-right: 6px;">🔍 Analizar</button>
          <button class="btn btn-danger-light" onclick="event.stopPropagation(); removeStartupFromCartera('${st.nombre.replace(/'/g, "\\'")}')" style="padding: 4px 6px; font-size: 0.75rem; font-weight: bold;">❌</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * selectCarteraStartup(nombre)
 * @description Selecciona visualmente una fila de la tabla y carga su Ficha Handoff Express
 */
function selectCarteraStartup(nombre) {
  const startup = STATE.cartera.find(st => st.nombre === nombre);
  if (!startup) return;

  // Quitar seleccionados previos
  document.querySelectorAll('.cartera-row').forEach(row => row.classList.remove('selected'));
  
  // Resaltar la fila actual
  const rowId = `row-${nombre.replace(/[^a-z0-9]/gi, '_')}`;
  const rowEl = document.getElementById(rowId);
  if (rowEl) rowEl.classList.add('selected');

  // Rellenar Ficha Handoff
  const handoffCard = document.getElementById('cartera-handoff-card');
  const handoffTextarea = document.getElementById('cartera-handoff-textarea');
  
  if (handoffCard && handoffTextarea) {
    handoffCard.style.display = 'block';
    
    const blockerStr = startup.bloqueador ? `BLOQUEADOR DETECTADO: "${startup.bloqueador}". ` : "Sin bloqueadores administrativos previos. ";
    
    handoffTextarea.value = `Derivación Operativa APTKI - startup: ${startup.nombre.toUpperCase()}
• Estado: Prioridad ${startup.semaforo === "🔴" ? "ROJA" : startup.semaforo === "🟡" ? "AMARILLA" : "VERDE"} (Gravedad ${startup.priorityScore}/100)
• Diagnóstico Raíz: Foco en ${startup.focoPrincipal} (Runway: ${startup.runway === 99 ? 'Rentable' : startup.runway + ' meses'} | Trust Score: ${startup.trustScore}%)
• Ruta Asignada: ${startup.rutaSugerida.toUpperCase()}
• Siguiente Paso: ${blockerStr}${startup.accionSiguiente}`;
  }
}

/**
 * safeCopyToClipboard(text)
 * @description Fallback robusto para copiado universal de portapapeles sin navigator.clipboard
 */
function safeCopyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Ficha de Handoff copiada al portapapeles ✓', 'success'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (success) {
      showToast('Ficha de Handoff copiada (fallback) ✓', 'success');
    } else {
      showToast('No se pudo copiar automáticamente', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error al copiar al portapapeles', 'error');
  }
}

// Inicialización de eventos interactivos de la cartera
document.addEventListener('DOMContentLoaded', () => {
  // Dropzone mini
  const dropzoneMini = document.getElementById('cartera-dropzone');
  const fileInputMini = document.getElementById('cartera-file-input');

  if (dropzoneMini && fileInputMini) {
    dropzoneMini.addEventListener('click', () => fileInputMini.click());
    
    dropzoneMini.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneMini.classList.add('drag-over');
    });
    dropzoneMini.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneMini.classList.add('drag-over');
    });
    dropzoneMini.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneMini.classList.remove('drag-over');
    });
    dropzoneMini.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneMini.classList.remove('drag-over');
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        importMultipleSessionsInBatch(Array.from(e.dataTransfer.files));
      }
    });

    fileInputMini.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        importMultipleSessionsInBatch(Array.from(e.target.files));
      }
    });
  }

  // Exportar Cartera consolidada
  const btnExport = document.getElementById('btn-export-cartera');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportPortfolioSession();
    });
  }

  // Limpiar Cartera
  const btnLimpiar = document.getElementById('btn-limpiar-cartera');
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
      if (confirm('¿Seguro que deseas vaciar toda la cartera en memoria?')) {
        STATE.cartera = [];
        showToast('Cartera vaciada en memoria', 'info');
        renderCarteraTab();
      }
    });
  }

  // Copiar Handoff
  const btnCopiarHandoff = document.getElementById('btn-copiar-handoff-cartera');
  const handoffTextarea = document.getElementById('cartera-handoff-textarea');
  if (btnCopiarHandoff && handoffTextarea) {
    btnCopiarHandoff.addEventListener('click', () => {
      if (handoffTextarea.value) {
        safeCopyToClipboard(handoffTextarea.value);
      }
    });
  }
});
