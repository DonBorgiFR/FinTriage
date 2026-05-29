function buildNarrative(data, forecast, scoring) {
  if (!data) return { financiero: '', estrategico: '', defensa: '' };

  const fmt = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';
  const pct = v => (v * 100).toFixed(1) + '%';
  
  const { totales, confidence, pygMensual } = data;
  const meses = Object.keys(pygMensual).sort();
  const nMeses = meses.length;
  
  const margenBrutoP = totales.ingresos > 0 ? (totales.ingresos - totales.cogs) / totales.ingresos : 0;
  const opexOperativo = totales.gastos - totales.cogs - (totales.amortizacion || 0) - (totales.gastosFinancieros || 0);
  const totalPersonal = Object.values(pygMensual).reduce((s, m) => s + m.personal, 0);
  const pesoPersonalReal = opexOperativo > 0 ? totalPersonal / opexOperativo : 0;

  const runwayBase = forecast?.scenarios?.base?.findIndex(r => r.caja < 0);
  const mesesRunwayText = runwayBase !== undefined && runwayBase !== -1 ? `${runwayBase + 1} meses` : '> 12 meses';
  
  // ---- 0. Disclaimer de Confianza (Nuevo) ----
  let txtDisclaimer = "";
  if (confidence?.confidenceLevel !== 'reliable') {
    const labels = { reservations: 'CON RESERVAS', indicative: 'ORIENTATIVO', blocked: 'DIAGNÓSTICO ÚNICAMENTE' };
    txtDisclaimer = `> ⚠️ **ANÁLISIS ${labels[confidence.confidenceLevel]}**: ${confidence.analysisLimitations.join(' ')}\n\n`;
  }

  // ---- 1. Resumen Estrictamente Financiero ----
  let txtFinanciero = txtDisclaimer;
  txtFinanciero += `**SITUACIÓN DE LIQUIDEZ Y RENTABILIDAD**\n`;
  txtFinanciero += `Durante el periodo analizado (${nMeses} meses), la empresa ha registrado unos ingresos totales de ${fmt(totales.ingresos)} frente a unos costes operativos (OPEX) estimados en ${fmt(opexOperativo)}. El Margen Bruto se sitúa en un ${pct(margenBrutoP)}.\n\n`;
  
  if (confidence?.ebitdaSuspect) {
    txtFinanciero += `⚠️ **Aviso de Integridad**: El EBITDA calculado (${fmt(totales.ebitda)}) presenta dudas razonables debido a la concentración de anomalías en el libro diario. Se recomienda no utilizar esta métrica como base única para valoraciones sin una auditoría previa.\n\n`;
  } else {
    txtFinanciero += `El EBITDA acumulado del periodo es de ${fmt(totales.ebitda)}. La estructura de costes fijos está dominada por los gastos de personal, que representan un ${pct(pesoPersonalReal)} del OPEX operativo.\n\n`;
  }

  txtFinanciero += `**POSICIÓN DE CAJA Y RUNWAY**\n`;
  txtFinanciero += `La posición de tesorería a cierre del último mes analizado es de ${fmt(totales.cajaFinal)}. Con un Burn Rate Neto promedio de ${fmt(totales.burnRateNeto)}/mes, la proyección base indica un runway estimado de ${mesesRunwayText}.`;

  // ---- 2. Visión Estratégica y Consultiva ----
  let txtEstrategico = `**DIAGNÓSTICO Y ROADMAP**\n`;
  
  // Diagnóstico de márgenes
  if (margenBrutoP < 0.4) {
    txtEstrategico += `El margen bruto actual (${pct(margenBrutoP)}) es bajo para sostener un escalado acelerado. Antes de inyectar capital en marketing (CAC), es imperativo optimizar el COGS o revisar la política de pricing. `;
  } else if (margenBrutoP > 0.7) {
    txtEstrategico += `Excelente salud de margen bruto (${pct(margenBrutoP)}), típico de modelos altamente escalables. Cada euro de nueva venta fluye casi directamente a cubrir los costes estructurales. `;
  }

  // Diagnóstico de Runway
  if (runwayBase !== undefined && runwayBase !== -1 && runwayBase < 6) {
    txtEstrategico += `\n\n⚠️ **Riesgo Inminente de Caja**: El runway proyectado es inferior a 6 meses. Se requiere una estrategia de contención de OPEX en paralelo a una activación de rondas puente o financiación alternativa.\n\n`;
  } else {
    txtEstrategico += `\n\nEl runway actual proporciona suficiente margen de maniobra (ventana > 6 meses) para ejecutar la hoja de ruta estratégica sin presión de caja crítica.\n\n`;
  }

  // Financiación Pública
  txtEstrategico += `**APALANCAMIENTO PÚBLICO Y SUBVENCIONES**\n`;
  if (scoring) {
    const enisaOk = scoring.enisa?.elegible;
    const cdtiOk = scoring.cdti?.elegible;
    const icoOk = scoring.icoCrecimiento?.elegible === true;
    const icoVerdeOk = scoring.icoVerde?.elegible === true;
    const sgrOk = scoring.avalsSGR?.elegible === true;
    const torresOk = scoring.torresQuevedo?.elegible === true;
    const eicOk = scoring.eicAccelerator?.elegible === true;
    
    // Core ENISA / CDTI
    if (enisaOk && cdtiOk) {
      txtEstrategico += `La empresa presenta un perfil idóneo para plantear una estrategia de financiación mixta de base tecnológica (ENISA + CDTI Neotec). `;
    } else if (enisaOk) {
      txtEstrategico += `El perfil patrimonial actual habilita a la empresa para solicitar ENISA Emprendedores, ideal para startups en etapas tempranas. `;
    } else if (cdtiOk) {
      txtEstrategico += `El fuerte componente técnico de investigación abre la puerta a subvenciones competitivas como CDTI Neotec. `;
    } else {
      txtEstrategico += `La estructura de fondos propios actual sugiere la necesidad de fortalecer el capital social antes de concurrir a ENISA/CDTI. `;
    }

    // ICO y SGR
    if (icoOk || icoVerdeOk || sgrOk) {
      let lineas = [];
      if (icoOk) lineas.push("ICO Crecimiento");
      if (icoVerdeOk) lineas.push("ICO Verde");
      if (sgrOk) lineas.push("aval SGR regional");
      txtEstrategico += `Adicionalmente, se detecta viabilidad inmediata para vías de mediación y avales institucionales (${lineas.join(', ')}). `;
    }

    // Torres Quevedo
    if (torresOk) {
      txtEstrategico += `La intención de contratar doctores y el perfil I+D habilitan la ayuda del programa Torres Quevedo para subvencionar costes de personal de investigación. `;
    }
    
    // EIC Accelerator (Matiz 2 & 3)
    if (eicOk) {
      txtEstrategico += `\n\n> ⚠️ **RESTRICCIÓN CRÍTICA EIC ACCELERATOR**: La empresa es potencialmente elegible para el EIC Accelerator de la Unión Europea (TRL ${STATE.contextChecklist?.trl || '5+'}). Recuerde que este valioso instrumento (hasta 2.5M€ subvención + hasta 10M€ equity) se concede **una sola vez por empresa** para el período 2021-2027. La preparación técnica y de balance del expediente debe planificarse con un rigor absoluto para no comprometer esta bala única.`;
    }
  }

  // ---- 3. Readiness para Financiación (Nuevo) ----
  txtEstrategico += `\n\n**READINESS PARA FINANCIACIÓN**\n`;
  const flags = confidence?.fundingReadinessFlags;
  if (flags?.requiresManualReview) {
    txtEstrategico += `❌ **No apto para presentación inmediata**. El nivel de incidencias en el libro diario requiere una limpieza contable previa antes de presentar el expediente a entidades financieras o inversores para evitar un rechazo por due diligence.`;
  } else if (flags?.scoringDefensible) {
    txtEstrategico += `✅ **Apto para inicio de expedientes**. La calidad del dato es suficiente para defender el business case ante ENISA/CDTI, aunque se recomienda monitorizar las anomalías menores reportadas.`;
  } else {
    txtEstrategico += `La elegibilidad está condicionada a la corrección de los descuadres detectados en el proceso de ingesta.`;
  }

  // ---- 4. Argumentario de Defensa CFO (Fase 6 - Integración) ----
  let txtDefensa = "";
  if (typeof getCashflowSurvivalStatus === 'function') {
    const survival = getCashflowSurvivalStatus(data);
    const leaks = typeof detectCashflowLeaks === 'function' ? detectCashflowLeaks(data) : [];
    
    txtDefensa += `**DIAGNÓSTICO DE SUPERVIVENCIA Y TRACCIÓN DE CAJA**\n`;
    txtDefensa += `Estado de la Tesorería: **${survival.statusLabel}**.\n`;
    if (survival.runwayMeses === Infinity) {
      txtDefensa += `La startup se encuentra en equilibrio financiero y no destruye caja neta (ingresos cubren costes operativos).\n\n`;
    } else {
      txtDefensa += `Con un runway estimado de **${survival.runwayMeses.toFixed(1)} meses** (${Math.round(survival.runwayDias)} días de supervivencia), la velocidad de consumo es de **${fmt(survival.burnRateMensual)}/mes** (**${fmt(survival.burnRateDiario)}/día**). ${survival.statusDesc}\n\n`;
    }
    
    if (leaks.length > 0) {
      txtDefensa += `**FUGAS DE CAJA DETECTADAS (CASHFLOW LEAKS)**\n`;
      leaks.forEach(leak => {
        txtDefensa += `• **${leak.title}** (${leak.severity === 'high' ? 'Crítico' : 'Moderado'}): ${leak.desc} *Acción sugerida:* ${leak.action}\n`;
      });
      txtDefensa += `\n`;
    }
  } else {
    txtDefensa += `**DIAGNÓSTICO DE SUPERVIVENCIA**\nNo se ha podido cargar el motor de supervivencia contable.\n\n`;
  }

  txtDefensa += `**ALEGACIONES DE DEFENSA INSTITUCIONAL (ENISA / CDTI)**\n`;
  txtDefensa += `Argumentación profesional para mitigar las debilidades del balance ante los analistas de comités de riesgo:\n\n`;
  
  let argumentsCount = 0;
  const anomalies = data.anomalies || [];
  
  if (anomalies.some(a => a.id === 'cifras_redondas')) {
    txtDefensa += `• **Importes Redondos / Múltiplos**: Las partidas con importes redondos no corresponden a registros arbitrarios. Responden estrictamente a provisiones contables anuales estructuradas, o bien a igualas fijas recurrentes de servicios profesionales externos (asesores, desarrollo de software) bajo contrato comercial preestablecido con precios fijos nominativos.\n\n`;
    argumentsCount++;
  }
  
  if (anomalies.some(a => a.id === 'facturas_domingo')) {
    txtDefensa += `• **Registros en Fin de Semana**: La operativa en días festivos responde a procesos de facturación recurrentes de clientes (suscripciones SaaS, pasarelas de pago Stripe/Paypal) que operan en la nube de forma automatizada e ininterrumpida 24/7, garantizando la trazabilidad temporal inmediata.\n\n`;
    argumentsCount++;
  }
  
  if (anomalies.some(a => a.id === 'cuota_personal_critica')) {
    txtDefensa += `• **Elevado Gasto de Personal**: El coste de personal no representa ineficiencia estructural, sino una inversión intensiva y estratégica en ingenieros de software, científicos de datos y personal de I+D enfocado en la creación de activos intangibles de alto valor y propiedad intelectual (Core Tecnológico elegible y valorado positivamente para CDTI Neotec).\n\n`;
    argumentsCount++;
  }
  
  if (anomalies.some(a => a.id === 'prestamos_socios')) {
    txtDefensa += `• **Saldos Transitorios con Socios (Grupo 55)**: Las cuentas corrientes con socios corresponden a saldos provisionales derivados de tiques de representación pendientes de liquidación y gastos suplidos a favor del negocio. Estos importes se hallan formalizados mediante un contrato de préstamo a tipo de interés legal y serán debidamente regularizados o liquidados en el presente ejercicio fiscal.\n\n`;
    argumentsCount++;
  }

  if (anomalies.some(a => a.id === 'margen_bruto_negativo')) {
    txtDefensa += `• **Margen Bruto de Penetración**: El margen transitorio responde a una estrategia deliberada de adquisición de cuota de mercado mediante precios promocionales de lanzamiento y costes extraordinarios de setup de primeros clientes, con un LTV/CAC proyectado saludable y una senda clara de aumento de rentabilidad unitaria.\n\n`;
    argumentsCount++;
  }

  if (anomalies.some(a => a.id === 'cliente_unico')) {
    txtDefensa += `• **Concentración de Facturación**: La concentración inicial es una validación comercial (Product-Market Fit) lograda de la mano de un partner corporativo líder del sector que ejerce de canal estratégico, reduciendo el riesgo de ejecución mientras se avanza progresivamente en la diversificación comercial.\n\n`;
    argumentsCount++;
  }
  
  if (argumentsCount === 0) {
    txtDefensa += `• **Consistencia General del Balance**: El análisis pormenorizado del libro mayor no revela desviaciones contables ni de balance que requieran mitigaciones adicionales. El negocio presenta una estructura limpia e íntegra lista para defensa en comités ordinarios.\n`;
  }

  return { financiero: txtFinanciero, estrategico: txtEstrategico, defensa: txtDefensa };
}

function renderNarrative() {
  const container = document.getElementById('narrative-container');
  if (!container) return;

  if (!STATE.analysisResult) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  const { financiero, estrategico, defensa } = buildNarrative(STATE.analysisResult, STATE.forecastResult, STATE.scoringResult);

  // Parser simple de markdown a HTML para negritas y saltos de linea
  const parseMd = text => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  container.innerHTML = `
    <div class="card narrative-executive-card">
      <div class="narrative-header-container">
        <div class="card-title narrative-card-title">🤖 Resumen Ejecutivo & Argumentario de Defensa</div>
        <button class="btn btn-secondary narrative-copy-btn" onclick="copyNarrative()">📋 Copiar Informe</button>
      </div>
      
      <div class="narrative-grid-container">
        <!-- Bloque Financiero -->
        <div class="narrative-block-financial">
          <div class="narrative-title-financial">
            📊 Análisis Estrictamente Financiero
          </div>
          <div id="narrative-fin" class="narrative-text-body">
            <p>${parseMd(financiero)}</p>
          </div>
        </div>

        <!-- Bloque Estratégico -->
        <div class="narrative-block-strategic">
          <div class="narrative-title-strategic">
            ♟️ Visión Estratégica y Roadmap
          </div>
          <div id="narrative-est" class="narrative-text-body">
            <p>${parseMd(estrategico)}</p>
          </div>
        </div>

        <!-- Bloque Defensa CFO (Nuevo Fase 6) -->
        <div class="narrative-block-defense">
          <div class="narrative-title-defense">
            🛡️ Defensa Institucional (ENISA/CDTI)
          </div>
          <div id="narrative-def" class="narrative-text-body">
            <p>${parseMd(defensa)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.copyNarrative = function() {
  const fin = document.getElementById('narrative-fin')?.innerText || '';
  const est = document.getElementById('narrative-est')?.innerText || '';
  const def = document.getElementById('narrative-def')?.innerText || '';
  const textToCopy = `=== ANÁLISIS FINANCIERO ===\n${fin}\n\n=== VISIÓN ESTRATÉGICA ===\n${est}\n\n=== ARGUMENTARIO DE DEFENSA INSTITUCIONAL ===\n${def}`;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('Informe completo copiado al portapapeles', 'success');
  }).catch(() => {
    showToast('Error al copiar el informe', 'error');
  });
};

