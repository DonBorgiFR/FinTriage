/**
 * defensa.js — Módulo de Defensa CFO y Plan de Supervivencia Financiera.
 * Proporciona el Cockpit de Supervivencia, el Plan de Choque de 100 Días y el
 * generador de argumentarios de defensa contextuales (basado en libro real o simulado).
 * Permite trabajar en Modo Simulación de Cafetería (sin libro diario cargado).
 */

/**
 * getCashflowSurvivalStatus(data)
 * Calcula el estado de supervivencia y semáforo de caja.
 * @param {Object} data - AnalysisResult (real o mock)
 */
function getCashflowSurvivalStatus(data) {
  const caja = data?.totales?.cajaFinal ?? 0;
  const burnNeto = data?.totales?.burnRateNeto ?? 0;
  
  if (burnNeto <= 0) {
    return {
      runwayMeses: Infinity,
      runwayDias: Infinity,
      burnRateMensual: 0,
      burnRateDiario: 0,
      caja,
      status: 'ok',
      statusLabel: 'Supervivencia Garantizada (Caja Positiva)',
      statusDesc: 'La startup no quema caja neta actualmente. Los ingresos cubren los gastos operativos.'
    };
  }

  const runwayMeses = caja / burnNeto;
  const runwayDias = runwayMeses * 30.4;
  const burnRateDiario = burnNeto / 30.4;

  let status = 'ok';
  let statusLabel = 'Estable / Caja Sólida';
  let statusDesc = 'Runway superior a 6 meses. Tiempo suficiente para estructurar financiación estratégica.';

  if (runwayMeses < 3) {
    status = 'danger';
    statusLabel = 'ZONA CRÍTICA: Runway Asfixiante';
    statusDesc = 'Runway inferior a 3 meses. Peligro inminente de cese de operaciones. Requiere activar de inmediato el Plan de Choque de 100 Días.';
  } else if (runwayMeses < 6) {
    status = 'warn';
    statusLabel = 'Tensión Operativa / Oxígeno Limitado';
    statusDesc = 'Runway entre 3 y 6 meses. Margen de maniobra estrecho. Se debe iniciar la captación urgente de recursos de caja o moderar el burn rate.';
  }

  return {
    runwayMeses,
    runwayDias,
    burnRateMensual: burnNeto,
    burnRateDiario,
    caja,
    status,
    statusLabel,
    statusDesc
  };
}

/**
 * detectCashflowLeaks(data)
 * Analiza el libro contable para extraer fugas y ineficiencias de circulante.
 */
function detectCashflowLeaks(data) {
  const leaks = [];
  if (!data || !data.totales) return leaks;
  const t = data.totales;

  // 1. DSO vs DPO (Solo aplicable si hay balance estimado con saldos de cuentas de clientes/proveedores)
  if (data.balance) {
    // Acumulación robusta por prefijo contable leyendo subcuentas reales Consolidadas
    let saldoClientes = 0;
    let saldoProveedores = 0;
    if (t.saldoCuenta) {
      for (const [cta, val] of Object.entries(t.saldoCuenta)) {
        if (cta.startsWith('43')) {
          saldoClientes += -val; // Saldo deudor: debe - haber
        } else if (cta.startsWith('40')) {
          saldoProveedores += val; // Saldo acreedor: haber - debe
        }
      }
    }
    saldoClientes = Math.max(0, saldoClientes);
    saldoProveedores = Math.max(0, saldoProveedores);
    
    const numMeses = Math.max(1, Object.keys(data.byMonth || {}).length);
    const ingresosMes = (t.ingresos ?? 0) / numMeses;
    const gastosMes = (t.gastos ?? 0) / numMeses;
    
    // Estimación DSO/DPO
    const dso = ingresosMes > 0 ? Math.max(0, (saldoClientes / ingresosMes) * 30.4) : 0;
    const dpo = gastosMes > 0 ? Math.max(0, (saldoProveedores / gastosMes) * 30.4) : 0;

    if (dso > 60) {
      leaks.push({
        id: 'dso_critico',
        severity: 'high',
        title: 'Tensión por cobro lento a clientes (DSO elevado)',
        desc: `Estás tardando un promedio de **${Math.round(dso)} días** en cobrar tus facturas. Esto retiene aproximadamente **${Math.round(saldoClientes).toLocaleString('es-ES')}€** que deberían estar en banco.`,
        action: 'Lanzar campaña de recobro inmediato de facturas vencidas e implantar pasarela de cobro rápido/domiciliación bancaria.'
      });
    }

    if (dso > dpo && dso > 30) {
      leaks.push({
        id: 'desfase_circulante',
        severity: 'medium',
        title: 'Desfase comercial negativo',
        desc: `Pagas a tus proveedores más rápido de lo que cobras a tus clientes (Cobro: ${Math.round(dso)} días vs. Pago: ${Math.round(dpo)} días). Estás financiando la operativa de tus clientes con tu propia caja.`,
        action: 'Negociar ampliación de plazos con proveedores clave a 60 días y acortar plazos de clientes a 15/30 días.'
      });
    }
  }

  // 2. Gastos de marketing excesivos (Riesgo en startups burn rate alto)
  const pyg = data.pygMensual || {};
  const mktValue = Object.values(pyg).reduce((sum, m) => sum + (m?.marketing || 0), 0);
  if ((t.ingresos ?? 0) > 0 && (mktValue / t.ingresos > 0.35) && (t.burnRateNeto ?? 0) > 0) {
    leaks.push({
      id: 'marketing_desbocado',
      severity: 'medium',
      title: 'Sobregasto en Marketing / AdAcquisition',
      desc: `El coste de marketing representa el **${((mktValue / t.ingresos) * 100).toFixed(1)}%** de las ventas operativas en un contexto de quema de caja.`,
      action: 'Auditar CAC (Coste Adquisición Cliente) y pausar de inmediato las campañas publicitarias que no tengan retorno directo (ROI positivo a menos de 30 días).'
    });
  }

  // 3. Fuga por Préstamos a Socios (Cuenta 551/550)
  const hasPrestamoSocio = Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'prestamos_socios');
  if (hasPrestamoSocio) {
    let saldoNeto551 = 0;
    if (t.saldoCuenta) {
      for (const [cta, val] of Object.entries(t.saldoCuenta)) {
        if (cta.startsWith('551') || cta.startsWith('550')) {
          saldoNeto551 += val;
        }
      }
    }
    const saldoSocio = Math.abs(saldoNeto551) || 3000;
    leaks.push({
      id: 'prestamos_socios',
      severity: 'high',
      title: 'Fuga de fondos por préstamos encubiertos a socios',
      desc: `Se ha detectado una salida neta de **${saldoSocio.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€** en la cuenta de relaciones con socios (cta. 551/550).`,
      action: 'Firmar contrato formal de préstamo socio con interés de mercado para justificar ante comités y planificar el retorno de estos fondos a la caja de la startup.'
    });
  }

  // 4. Concentración bancaria extrema
  const cuentasTesoVal = Object.keys(t.saldoCuenta || {}).filter(c => c && c.startsWith('572'));
  if (cuentasTesoVal.length === 1 && (t.cajaFinal ?? 0) > 50000) {
    leaks.push({
      id: 'concentracion_bancaria',
      severity: 'low',
      title: 'Riesgo de Concentración Bancaria',
      desc: 'El 100% de los fondos líquidos está en una única entidad financiera. Si hay embargos, fallos técnicos o incidentes en dicho banco, la startup se paraliza.',
      action: 'Abrir una segunda cuenta de respaldo operativa en otra entidad (ej: neobanco corporativo rápido) y mover un 30% del saldo de caja.'
    });
  }

  // 5. Cuota de personal crítica
  const hasCuotaPersonalCritica = Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'cuota_personal_critica');
  if (hasCuotaPersonalCritica) {
    leaks.push({
      id: 'cuota_personal_critica',
      severity: 'high',
      title: 'Cuota de Personal Crítica / Estructura Sobredimensionada',
      desc: 'El gasto de nóminas y seguridad social supera sistemáticamente el 80% de tus ingresos, lo cual ahoga cualquier posibilidad de margen operativo.',
      action: 'Congelar contrataciones, auditar la productividad por departamento y evaluar una reestructuración de personal no-facturable o de bajo rendimiento.'
    });
  }

  // Si no se han detectado fugas técnicas pero el runway es crítico, agregamos fugas por defecto basadas en el quemado de caja
  if (leaks.length === 0 && (t.burnRateNeto ?? 0) > 0) {
    leaks.push({
      id: 'burn_general',
      severity: 'medium',
      title: 'Fuga de caja generalizada operativa',
      desc: 'La empresa gasta sistemáticamente más de lo que ingresa sin un foco claro de amortiguación operativa.',
      action: 'Establecer control presupuestario de base cero: cada gasto recurrente superior a 100€/mes debe ser justificado de nuevo por los fundadores.'
    });
  }

  return leaks;
}

/**
 * build100DayShockPlan(survival, leaks)
 * Genera el plan de choque de 100 días estructurado.
 */
function build100DayShockPlan(survival, leaks) {
  const plan = [];

  // Tarea 1: Control de Caja
  plan.push({
    id: 'caja_control',
    phase: 'Día 1-10: Estabilización Urgente',
    title: 'Establecer conciliación bancaria y cashflow diario',
    desc: 'Implementar una plantilla de control de caja diaria (entradas y salidas reales) vigilando los saldos bancarios cada mañana para evitar sorpresas.'
  });

  // Tarea 2: Reducción de gastos discrecionales
  if (survival.runwayMeses < 6) {
    plan.push({
      id: 'gasto_discrecional',
      phase: 'Día 1-10: Estabilización Urgente',
      title: 'Pausar gastos de marketing no productivos y herramientas SaaS',
      desc: 'Suspender suscripciones de software duplicadas o inactivas y reducir temporalmente el presupuesto de branding/publicidad discrecional.'
    });
  }

  // Tarea 3: Basada en Leaks específicos
  leaks.forEach(leak => {
    if (leak.id === 'dso_critico' || leak.id === 'desfase_circulante') {
      plan.push({
        id: 'cobros_emergencia',
        phase: 'Día 11-30: Inyección de Liquidez',
        title: 'Lanzar plan de recobro agresivo y factoraje',
        desc: 'Contactar directamente con los clientes con facturas vencidas. Si es viable, activar líneas de factoring sobre cobros pendientes.'
      });
    }
    if (leak.id === 'prestamos_socios') {
      plan.push({
        id: 'socios_regulacion',
        phase: 'Día 31-60: Saneamiento Balance',
        title: 'Formalizar contrato de préstamos a socios',
        desc: 'Firmar contrato civil de préstamo con interés legal para evitar incidencias en la Due Diligence y trazar la devolución de fondos.'
      });
    }
  });

  // Tarea 4: Renegociación con Bancos (si hay deudas)
  plan.push({
    id: 'renegociacion_bancaria',
    phase: 'Día 11-30: Inyección de Liquidez',
    title: 'Negociar carencias de préstamos financieros existentes',
    desc: 'Solicitar a las entidades bancarias (o ENISA si ya se tiene) una carencia de amortización de principal de 6 a 12 meses, pagando solo intereses.'
  });

  // Tarea 5: Vías alternativas rápidas
  plan.push({
    id: 'vias_alternativas',
    phase: 'Día 31-60: Saneamiento Balance',
    title: 'Preparación de Ronda de Emergencia o Nota Convertible',
    desc: 'Lanzar un ticket de nota convertible rápido entre los socios actuales o business angels de confianza por importe equivalente a 3 meses de burn rate.'
  });

  // Tarea 6: Foco Comercial
  plan.push({
    id: 'foco_comercial',
    phase: 'Día 61-100: Recuperación y Rápido Retorno',
    title: 'Focalizar el equipo comercial en proyectos/clientes de cobro anticipado',
    desc: 'Priorizar la venta de servicios estándar u ofertas anuales con cobro upfront (al contado) para inyectar flujo de caja directo a banco.'
  });

  return plan;
}

/**
 * buildContextualTalkingPoints(data)
 * Genera el banco de preguntas trampa de comités de riesgo y respuestas personalizadas.
 */
function buildContextualTalkingPoints(data) {
  const points = [];
  if (!data || !data.totales) return points;
  const t = data.totales;

  // 1. Runway crítico
  if ((t.burnRateNeto ?? 0) > 0) {
    const runway = (t.cajaFinal ?? 0) / t.burnRateNeto;
    if (runway < 3) {
      // Acumulación robusta del saldo de clientes para el talking point
      let saldoClientes = 0;
      if (t.saldoCuenta) {
        for (const [cta, val] of Object.entries(t.saldoCuenta)) {
          if (cta.startsWith('43')) {
            saldoClientes += -val;
          }
        }
      }
      saldoClientes = Math.max(0, saldoClientes);

      points.push({
        type: 'danger',
        icon: '🚨',
        question: 'Dada la situación de caja (menos de 3 meses de Runway), ¿cómo garantizan la continuidad de la empresa para devolver la financiación?',
        answer: `**Estrategia de Defensa:** "Reconocemos que la caja actual del balance es ajustada, pero responde a un plan de inversión controlado. Actualmente hemos implementado un **Plan de Choque de 100 Días** que reduce nuestro consumo neto mensual (Net Burn) en un 25% congelando gastos discrecionales de marketing y nóminas no operativas. Esto extiende nuestro oxígeno. Además, tenemos una facturación acumulada de clientes pendientes de cobro por valor de **${Math.round(saldoClientes).toLocaleString('es-ES')}€** que estamos movilizando mediante factoring y recobro directo. La financiación solicitada actuará como palanca de aceleración comercial, no de supervivencia."`
      });
    }
  }

  // 2. Préstamos a socios (551/550 Deudora)
  if (Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'prestamos_socios')) {
    let saldoNeto551 = 0;
    if (t.saldoCuenta) {
      for (const [cta, val] of Object.entries(t.saldoCuenta)) {
        if (cta.startsWith('551') || cta.startsWith('550')) {
          saldoNeto551 += val;
        }
      }
    }
    const saldo = Math.abs(saldoNeto551) || 3000;
    points.push({
      type: 'high',
      icon: '🔴',
      question: 'Hemos detectado en su balance saldos significativos de préstamos a socios/administradores (cta. 551/550 deudora) por valor de ' + Math.round(saldo).toLocaleString('es-ES') + '€. ¿A qué corresponde esto?',
      answer: `**Estrategia de Defensa:** "Corresponde a saldos corporativos transitorios por gastos de representación y viajes de negocio del equipo fundador pendientes de justificación de tiques, así como anticipos por necesidades operativas puntuales. Para garantizar el orden contable riguroso, hemos formalizado este saldo mediante un **Contrato Civil de Préstamo con intereses a tipo de interés de mercado**. No obstante, el compromiso de los socios es liquidar esta cuenta corriente o compensarla mediante dividendos aprobados antes del cierre del presente ejercicio fiscal, garantizando que el 100% de la caja de la financiación se aplique al crecimiento operativo de la compañía."`
    });
  }

  // 2.2. Aportación de socios acreedora (551/550 Acreedora)
  if (Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'cuenta_551_acreedora')) {
    let saldoNeto551 = 0;
    if (t.saldoCuenta) {
      for (const [cta, val] of Object.entries(t.saldoCuenta)) {
        if (cta.startsWith('551') || cta.startsWith('550')) {
          saldoNeto551 += val;
        }
      }
    }
    const saldo = Math.abs(saldoNeto551) || 3000;
    points.push({
      type: 'high',
      icon: '🔴',
      question: 'Vemos en su pasivo una aportación o saldo acreedor en la cuenta corriente de socios (cta. 551/550 acreedora) de ' + Math.round(saldo).toLocaleString('es-ES') + '€. ¿Por qué no está capitalizado?',
      answer: `**Estrategia de Defensa:** "Esta cuenta refleja aportaciones dinerarias temporales que los fundadores hemos inyectado para dar soporte al circulante en fases iniciales del plan de desarrollo. Para cumplir de forma impecable con el marco contable y fiscal español, estas aportaciones están respaldadas por un **contrato de préstamo mercantil regulando el devengo del tipo de interés legal (3,25% en 2026)** y realizamos las retenciones correspondientes (Modelo 123). No obstante, para optimizar el balance y la Due Diligence ante esta ronda, el compromiso formal de los socios es capitalizar este saldo neto mediante una ampliación de capital por compensación de créditos antes del cierre del ejercicio o formalizarlo como aportación a patrimonio neto a fondo perdido (cuenta 118), eliminando el pasivo corriente del balance de la startup."`
    });
  }

  // 3. Deuda pública (475/476)
  if (Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'deuda_publica_alta')) {
    const saldo = Math.abs(t.saldoCuenta?.['475'] || t.saldoCuenta?.['476'] || 20000);
    points.push({
      type: 'high',
      icon: '🟡',
      question: 'Vemos en el pasivo corriente un saldo relevante con Administraciones Públicas (Hacienda/Seguridad Social) de ' + Math.round(saldo).toLocaleString('es-ES') + '€. ¿Se encuentran al corriente de pago?',
      answer: `**Estrategia de Defensa:** "Sí, la compañía está absolutamente al corriente de sus obligaciones fiscales y laborales. Contamos con certificados positivos vigentes de AEAT y Seguridad Social. El saldo reflejado corresponde a **aplazamientos formalizados y aprobados** de impuestos corrientes, los cuales forman parte de una estrategia deliberada y legítima de optimización de la tesorería de circulante operativo, evitando acudir a financiación bancaria cara. Cumplimos rigurosamente el calendario de cuotas de amortización del aplazamiento."`
    });
  }

  // 4. Concentración de Clientes
  if (Array.isArray(data.anomalies) && data.anomalies.some(a => a?.id === 'cliente_unico')) {
    points.push({
      type: 'medium',
      icon: '🟠',
      question: 'Un único cliente concentra más del 70% de la facturación de la compañía. ¿Qué ocurre si deciden resolver el contrato unilateralmente?',
      answer: `**Estrategia de Defensa:** "Ese cliente es un partner estratégico de primer nivel con el que nos vincula un contrato plurianual con cláusulas de penalización por rescisión anticipada de 12 meses de preaviso, lo cual nos otorga una enorme predictibilidad de ingresos. No obstante, el core de nuestro plan comercial para esta ronda de financiación es precisamente la **diversificación comercial**. Ya estamos ejecutando pilotos de adquisición con 3 nuevas cuentas corporativas que reducirán el peso de nuestro cliente principal al 40% en los próximos 6 meses. La concentración actual no es debilidad de producto, sino el fruto del éxito inicial de penetración de mercado."`
    });
  }

  // 5. EBITDA Distorsionado o Sospechoso
  if (data.confidence?.ebitdaSuspect) {
    points.push({
      type: 'medium',
      icon: '🟡',
      question: 'El EBITDA mensual de la compañía presenta fuertes fluctuaciones y variaciones bruscas. ¿Es un modelo de negocio estable?',
      answer: `**Estrategia de Defensa:** "Las fluctuaciones mensuales no reflejan inestabilidad, sino la **naturaleza del flujo contable de facturas anuales de proveedores** (ej: licencias anuales de AWS, primas de seguros pagadas en enero, etc.). Al aplicar los criterios del **Accrual Engine (Ajuste de Devengo)** de nuestro CFO, donde periodificamos analíticamente de forma homogénea dichos importes entre los 12 meses, se comprueba que el **EBITDA recurrente normalizado es estable y presenta un margen saludable**. El negocio es perfectamente predecible tras eliminar las distorsiones de la facturación concentrada."`
    });
  }

  // Poner el talking point básico si no hay anomalías críticas
  if (points.length === 0) {
    points.push({
      type: 'neutral',
      icon: '🟢',
      question: '¿Por qué su modelo financiero es robusto y defendible para un comité de crédito?',
      answer: `**Estrategia de Defensa:** "Nuestro modelo financiero parte de un análisis in-browser inmutable de nuestro libro diario consolidado, con ajustes finos de devengo de gastos y conciliación. No hay estimaciones subjetivas. El **Trust Score obtenido es de ${data.confidence?.trustScore || 100}/100**, lo que asegura a cualquier analista de riesgo que las bases de PyG, EBITDA y balances son fidedignas, transparentes y coherentes para soportar el plan de repago de la financiación."`
    });
  }

  return points;
}

/**
 * exportFounderReport(data, simulated)
 * Genera el informe amigable en lenguaje no técnico para el fundador.
 * Retorna una cadena Markdown.
 */
function exportFounderReport(data, simulated = false) {
  if (!data) return '';
  const survival = getCashflowSurvivalStatus(data);
  const leaks = detectCashflowLeaks(data);
  const plan = build100DayShockPlan(survival, leaks);

  const empresa = STATE?.empresa?.nombre || data?.meta?.fileName || 'Tu Startup';
  const sector = STATE?.empresa?.sector || 'SaaS / Servicios';
  const consultor = 'Borja Félix Rojas';
  
  const runwayFormatted = survival.runwayMeses === Infinity 
    ? 'Supervivencia garantizada (Caja Positiva)' 
    : `${survival.runwayMeses.toFixed(1)} meses (${Math.round(survival.runwayDias)} días)`;

  let semaforoText = '🟢 ESTABLE';
  if (survival.status === 'danger') semaforoText = '🔴 CRÍTICO / ALERTA MÁXIMA';
  else if (survival.status === 'warn') semaforoText = '🟡 TENSIÓN FINANCIERA';

  let txt = `## 📄 Informe de Diagnóstico y Plan de Choque Financiero
**Preparado para:** ${empresa} (${sector})
**Consultor Senior de Cabecera:** ${consultor}
**Fecha de Diagnóstico:** ${new Date().toLocaleDateString('es-ES')}
**Tipo de Análisis:** ${simulated ? 'Simulación Rápida de Reunión' : 'Análisis Basado en Libro Diario Contable (PGC)'}

---

### 1. Diagnóstico de Salud de Caja (Oxígeno Financiero)

* **Caja Líquida Disponible:** ${Math.round(survival.caja).toLocaleString('es-ES')} €
* **Consumo Neto de Caja (Net Burn):** ${Math.round(survival.burnRateMensual).toLocaleString('es-ES')} € / mes
* **Oxígeno de Supervivencia (Runway):** **${runwayFormatted}**
* **Semáforo Financiero:** **${semaforoText}**

> **Comentario del CFO:** ${survival.statusDesc}

---

### 2. Principales Fugas y Focos de Tensión de Caja Detectados

Aquí se presentan las ineficiencias de circulante y balance que están absorbiendo tu liquidez innecesariamente:

${leaks.map((l, i) => `${i + 1}. **${l.title}** (Severidad: ${l.severity.toUpperCase()})
   * *El problema:* ${l.desc}
   * *La acción de choque:* ${l.action}`).join('\n\n')}

---

### 3. Plan de Choque de 100 Días para Estabilizar la Caja

Este es tu mapa de ruta de emergencia financiera para las próximas semanas. Prioriza estas acciones para inyectar liquidez y ganar oxígeno operativo:

${plan.map((p, i) => `* [ ] **Fase: ${p.phase}**
  * **Hito ${i + 1}: ${p.title}**
  * *Acción:* ${p.desc}`).join('\n\n')}

---

### 4. Siguientes Pasos con el Equipo APTKI

Para ejecutar este plan con éxito y reestructurar tu pool financiero (bancos, factoring, ENISA/subvenciones), te propongo:
1. **Reunión técnica de 30-45 minutos** con tu equipo contable para conciliar facturas y liberar los saldos de clientes acumulados.
2. **Definir el argumentario defensivo** basado en nuestro motor financiero para proteger tu EBITDA normalizado ante futuros comités de riesgo.

*¡Con foco y el método APTKI ordenaremos el caos y le daremos estabilidad a tu startup!*
`;
  return txt;
}

/**
 * renderDefensa()
 * Orquestador visual de la sección Defensa en app.js
 */
function renderDefensa() {
  const root = document.getElementById('defensa-root');
  if (!root) return;

  const realData = STATE.analysisResult;
  const simData = STATE.defensaSimulacionInputs;

  // Si no hay datos (ni reales ni simulación), enseñamos el Simulador de Cafetería
  if (!realData && !simData) {
    renderSimuladorForm(root);
  } else {
    // Si hay datos, renderizamos el Cockpit de Supervivencia
    const data = realData || buildMockAnalysisResultFromSim(simData);
    renderSurvivalCockpit(root, data, !!simData);
  }
}

/**
 * renderSimuladorForm(root)
 * Dibuja el formulario de simulación de caja (Modo Sin Libro)
 */
function renderSimuladorForm(root) {
  root.innerHTML = `
    <div class="card" style="max-width: 650px; margin: 0 auto; border-color: var(--cyan); box-shadow: var(--shadow-glow-cyan);">
      <div class="card-title" style="display:flex; align-items:center; gap:8px;">
        <span>☕</span>
        <span>Simulador de Caja y Plan de Choque (Modo Cafetería)</span>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:20px;">
        ¿Estás con un fundador que no tiene su libro diario a mano? Introduce estas variables rápidas para estructurar y simular de inmediato su Plan de Choque Financiero.
      </p>
      
      <form id="sim-form" style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="sim-empresa">Nombre Startup</label>
            <input type="text" id="sim-empresa" placeholder="Ej: SaaSMetrics S.L." required style="width:100%;" />
          </div>
          <div class="form-group">
            <label for="sim-perfil">Perfil de Negocio</label>
            <select id="sim-perfil" style="width:100%;">
              <option value="saas">💻 SaaS / Tech</option>
              <option value="services">📋 Servicios / Consultoría</option>
              <option value="industrial">🏭 Industrial / Fabricación</option>
              <option value="comercio">🛒 Comercio / Retail</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px;">
          <div class="form-group">
            <label for="sim-caja">Caja Disponible (€)</label>
            <input type="number" id="sim-caja" placeholder="Ej: 45000" min="0" required style="width:100%;" />
          </div>
          <div class="form-group">
            <label for="sim-ingresos">Ingresos Mensuales (€)</label>
            <input type="number" id="sim-ingresos" placeholder="Ej: 15000" min="0" required style="width:100%;" />
          </div>
          <div class="form-group">
            <label for="sim-gastos">Gastos Mensuales (€)</label>
            <input type="number" id="sim-gastos" placeholder="Ej: 32000" min="0" required style="width:100%;" />
          </div>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top:16px;">
          <h4 style="color:var(--text-primary); font-size:0.9rem; margin-bottom:12px;">🚨 Detección de Red Flags (Opcional)</h4>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
              <input type="checkbox" id="sim-flag-hacienda" style="width:16px;height:16px;accent-color:var(--cyan);" />
              ¿Tiene deuda o aplazamientos pendientes con Hacienda/SS (>20k€)?
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
              <input type="checkbox" id="sim-flag-socios" style="width:16px;height:16px;accent-color:var(--cyan);" />
              ¿Tiene préstamos o saldos deudores de socios (Cuenta 551/550 >3.000€)?
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
              <input type="checkbox" id="sim-flag-cliente" style="width:16px;height:16px;accent-color:var(--cyan);" />
              ¿Concentra más del 70% de ingresos en un único cliente?
            </label>
            <label style="display:flex; align-items:center; gap:8px; font-weight:normal; cursor:pointer;">
              <input type="checkbox" id="sim-flag-cobros" style="width:16px;height:16px;accent-color:var(--cyan);" />
              ¿Tarda mucho en cobrar de clientes (>60 días DSO)?
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top:10px; width:100%; padding:12px; font-size:1rem; box-shadow: var(--shadow-glow-cyan);">
          ⚡ Simular Cockpit & Plan de Choque →
        </button>
      </form>
    </div>
  `;

  // Listener para el formulario
  document.getElementById('sim-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = {
      empresa: document.getElementById('sim-empresa').value,
      perfil: document.getElementById('sim-perfil').value,
      caja: parseFloat(document.getElementById('sim-caja').value) || 0,
      ingresos: parseFloat(document.getElementById('sim-ingresos').value) || 0,
      gastos: parseFloat(document.getElementById('sim-gastos').value) || 0,
      hacienda: document.getElementById('sim-flag-hacienda').checked,
      socios: document.getElementById('sim-flag-socios').checked,
      cliente: document.getElementById('sim-flag-cliente').checked,
      cobros: document.getElementById('sim-flag-cobros').checked
    };

    STATE.defensaSimulacionInputs = inputs;
    STATE.defensaPlanChoqueChecked = []; // reset checked

    // Configurar metadatos empresa reactivos
    STATE.empresa.nombre = inputs.empresa;
    STATE.empresa.sector = inputs.perfil === 'saas' ? 'SaaS / Tech' : inputs.perfil === 'services' ? 'Servicios' : inputs.perfil === 'industrial' ? 'Industrial' : 'Comercio';

    // Seleccionar perfil si corresponde para KPIs
    STATE.selectedProfile = BUSINESS_PROFILES.find(p => p.id === inputs.perfil);

    if (typeof logAudit === 'function') {
      logAudit('Simulación Cafetería', `${inputs.empresa} · Caja: ${inputs.caja}€ · Burn: ${inputs.gastos - inputs.ingresos}€/mes`);
    }
    
    showToast('Simulación de caja cargada ✓', 'success');
    renderDefensa();
  });
}

/**
 * buildMockAnalysisResultFromSim(inputs)
 * Genera un mock inmutable de AnalysisResult a partir de los inputs de simulación.
 */
function buildMockAnalysisResultFromSim(inputs) {
  const burnRateNeto = Math.max(0, inputs.gastos - inputs.ingresos);
  const anomalies = [];
  const saldoCuenta = {
    '57': -inputs.caja // saldo deudor activo
  };

  if (inputs.hacienda) {
    anomalies.push({ id: 'deuda_publica_alta', severity: 'high', message: 'Deuda pública elevada', detail: 'Deuda simulada de Hacienda/SS superior a 20k€' });
    saldoCuenta['475'] = 25000;
  }
  if (inputs.socios) {
    anomalies.push({ id: 'prestamos_socios', severity: 'high', message: 'Riesgo Fiscal: Cuenta 551 Deudora', detail: 'Saldo deudor simulado de la cuenta corriente con socios (551/550)' });
    saldoCuenta['55100000'] = -5000;
  }
  if (inputs.cliente) {
    anomalies.push({ id: 'cliente_unico', severity: 'high', message: 'Concentración de cliente único', detail: 'Más del 70% de ingresos en una sola cuenta simulada' });
  }
  if (inputs.cobros) {
    saldoCuenta['430'] = 30000; // clientes
  }

  // PyG analítica simplificada de 3 meses para el simulador
  const months = ['2026-03', '2026-04', '2026-05'];
  const pygMensual = {};
  months.forEach(m => {
    pygMensual[m] = {
      totalIngresos: inputs.ingresos,
      cogs: 0,
      personal: inputs.perfil === 'services' ? inputs.gastos * 0.6 : inputs.gastos * 0.3,
      marketing: inputs.perfil === 'saas' ? inputs.gastos * 0.4 : 0,
      serviciosOperativos: inputs.gastos * 0.3,
      tributos: 0,
      amortizacion: 0,
      ebitda: inputs.ingresos - inputs.gastos,
      resultadoNeto: inputs.ingresos - inputs.gastos,
      cajaSaldo: inputs.caja
    };
  });

  return {
    meta: {
      fileName: 'Simulación Cafetería',
      months: months,
      totalEntries: 0,
      totalCuentas: 0
    },
    totales: {
      ingresos: inputs.ingresos * 3,
      gastos: inputs.gastos * 3,
      ebitda: (inputs.ingresos - inputs.gastos) * 3,
      resultado: (inputs.ingresos - inputs.gastos) * 3,
      cogs: 0,
      cajaFinal: inputs.caja,
      burnRateNeto: burnRateNeto,
      saldoCuenta: saldoCuenta
    },
    byMonth: {
      '2026-05': []
    },
    pygMensual: pygMensual,
    anomalies: anomalies,
    confidence: {
      trustScore: Math.max(20, 100 - (anomalies.length * 15) - (burnRateNeto > 0 && inputs.caja / burnRateNeto < 3 ? 20 : 0)),
      confidenceLevel: burnRateNeto > 0 && inputs.caja / burnRateNeto < 3 ? 'reservations' : 'reliable',
      confidenceLabel: 'Simulación Directa',
      ebitdaSuspect: false,
      analysisLimitations: ['Datos simulados a mano en modo reunión.'],
      fundingReadinessFlags: {
        scoringDefensible: true,
        forecastDefensible: true
      }
    },
    balance: {
      cajaFinal: inputs.caja,
      activoCorriente: inputs.caja + (inputs.cobros ? 30000 : 0),
      pasivoCorriente: (inputs.hacienda ? 25000 : 0) + 15000,
      patrimonioNeto: inputs.caja
    }
  };
}

/**
 * renderSurvivalCockpit(root, data, simulated)
 * Renderiza la interfaz principal del CFO Survival & Defense Board.
 */
function renderSurvivalCockpit(root, data, simulated = false) {
  const survival = getCashflowSurvivalStatus(data);
  const leaks = detectCashflowLeaks(data);
  const plan = build100DayShockPlan(survival, leaks);
  const points = buildContextualTalkingPoints(data);

  const runwayLabel = survival.runwayMeses === Infinity ? '∞' : survival.runwayMeses.toFixed(1);
  const diasLabel = survival.runwayDias === Infinity ? 'Sin quema de caja' : `${Math.round(survival.runwayDias)} días de vida`;

  // Render HTML
  root.innerHTML = `
    <!-- Top info panel (Si es simulación) -->
    ${simulated ? `
      <div class="card" style="border-color: var(--amber); background: rgba(245, 158, 11, 0.05); margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong style="color:var(--amber);">☕ Modo Simulación de Cafetería Activo</strong>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">Analizando datos de estimación rápida provistos por el fundador de <strong>${STATE.empresa.nombre}</strong>.</div>
        </div>
        <button class="btn btn-secondary" id="btn-edit-sim" style="font-size:0.8rem; padding:6px 12px;">🔄 Editar / Nueva Simulación</button>
      </div>
    ` : ''}

    <!-- METRICAS CLAVE / SEMAFORO -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Tarjeta del Runway -->
      <div class="card status-${survival.status}" style="margin: 0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 24px;">
        <span style="font-size:0.9rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.08em;">Oxígeno (Runway)</span>
        <div style="font-size: 3.5rem; font-weight:800; font-family:var(--font-display); line-height:1; margin: 8px 0;">
          ${runwayLabel} <span style="font-size:1.5rem; font-weight:400; color:var(--text-muted);">meses</span>
        </div>
        <div style="font-size:0.9rem; font-weight:600; color: var(--text-primary);">${diasLabel}</div>
      </div>

      <!-- Tarjeta del Burn Rate -->
      <div class="card" style="margin: 0; display:flex; flex-direction:column; justify-content:space-between;">
        <div class="card-title" style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:12px;">Detalle de Quemado</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:6px;">
            <span style="color:var(--text-secondary); font-size:0.85rem;">Caja en Banco:</span>
            <strong style="color:var(--cyan); font-size:1rem;">${Math.round(survival.caja).toLocaleString('es-ES')} €</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:6px;">
            <span style="color:var(--text-secondary); font-size:0.85rem;">Burn Rate mensual:</span>
            <strong style="color:var(--red); font-size:1rem;">-${Math.round(survival.burnRateMensual).toLocaleString('es-ES')} €/mes</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding-bottom:4px;">
            <span style="color:var(--text-secondary); font-size:0.85rem;">Goteo diario:</span>
            <strong style="color:var(--orange); font-size:1rem;">-${Math.round(survival.burnRateDiario).toLocaleString('es-ES')} €/día</strong>
          </div>
        </div>
      </div>

      <!-- Tarjeta del Semáforo Explicado -->
      <div class="card" style="margin: 0; display:flex; flex-direction:column; justify-content:center;">
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; display:flex; align-items:center; gap:8px;">
          <span>${survival.status === 'danger' ? '⛔' : survival.status === 'warn' ? '⚠️' : '✅'}</span>
          <span>${survival.statusLabel}</span>
        </div>
        <p style="font-size: 0.85rem; color:var(--text-secondary); line-height: 1.6;">${survival.statusDesc}</p>
      </div>
    </div>

    <!-- ACCIONES PREMIUN EXPORTAR -->
    <div style="display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap;">
      <button class="btn btn-primary" id="btn-export-founder" style="display:flex; align-items:center; gap:8px; font-weight:600; padding:10px 20px; box-shadow: var(--shadow-glow-cyan);">
        <span>📄</span> Exportar Informe de Supervivencia (para el Fundador)
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; align-items: start;">
      
      <!-- COL 1: FUGAS Y PLAN DE CHOQUE -->
      <div style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- FUGAS DETECTADAS -->
        <div class="card" style="border-color: var(--danger); background: rgba(239, 68, 68, 0.02);">
          <div class="card-title" style="color: var(--danger); font-size:0.95rem; display:flex; align-items:center; gap:8px;">
            <span>💧</span>
            <span>Fugas de Caja e Ineficiencias de Tesorería</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px; margin-top:12px;">
            ${leaks.map(l => {
              const border = l.severity === 'high' ? 'var(--red)' : l.severity === 'medium' ? 'var(--orange)' : 'var(--border)';
              const bg = l.severity === 'high' ? 'rgba(239,68,68,0.1)' : l.severity === 'medium' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)';
              return `
                <div style="border-left: 3px solid ${border}; background: ${bg}; padding: 12px; border-radius: 4px;">
                  <div style="font-weight:700; font-size:0.87rem; color: var(--text-primary);">${l.title}</div>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin:6px 0;">${l.desc}</p>
                  <div style="font-size:0.78rem; color:var(--cyan); font-weight:600; margin-top:4px;">💡 Solución CFO: ${l.action}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- PLAN DE CHOQUE DE 100 DIAS INTERACTIVO -->
        <div class="card">
          <div class="card-title" style="font-size:0.95rem; display:flex; align-items:center; gap:8px;">
            <span>⚡</span>
            <span>Plan de Choque de 100 Días (Checklist Operativa)</span>
          </div>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">Marca las acciones ejecutadas durante tus reuniones de seguimiento para consolidar el control.</p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${plan.map(p => {
              const isChecked = STATE.defensaPlanChoqueChecked.includes(p.id);
              return `
                <label class="shock-item ${isChecked ? 'completed' : ''}" style="display:flex; gap:12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); padding: 12px; border-radius: var(--radius-sm); cursor:pointer; align-items: flex-start; transition: var(--transition);">
                  <input type="checkbox" class="shock-checkbox" data-id="${p.id}" ${isChecked ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--cyan); cursor:pointer; margin-top:2px; flex-shrink:0;" />
                  <div>
                    <span style="font-size:0.7rem; color:var(--cyan); font-weight:700; text-transform:uppercase; display:block; letter-spacing:0.04em;">${p.phase}</span>
                    <strong style="font-size:0.85rem; color:var(--text-primary); margin-top:2px; display:block; text-decoration: ${isChecked ? 'line-through' : 'none'};">${p.title}</strong>
                    <span style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px; display:block; opacity: ${isChecked ? 0.5 : 0.85};">${p.desc}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- COL 2: TALKING POINTS DE DEFENSA -->
      <div class="card" style="margin: 0;">
        <div class="card-title" style="font-size:0.95rem; display:flex; align-items:center; gap:8px;">
          <span>🛡️</span>
          <span>Estrategia de Defensa CFO & Talking Points</span>
        </div>
        <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:16px;">Argumentario de respuesta rápida ante preguntas trampa de comités de riesgo financieros basados en el balance contable.</p>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${points.map((p, i) => {
            const sevClass = p.type === 'danger' ? 'sev-critical' : p.type === 'high' ? 'sev-high' : p.type === 'medium' ? 'sev-medium' : 'sev-low';
            return `
              <details style="background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; transition: var(--transition);" ${i === 0 ? 'open' : ''}>
                <summary style="cursor:pointer; font-weight:600; color:var(--text-primary); font-size:0.85rem; list-style:none; display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                  <div style="display:flex; gap:8px; align-items:flex-start;">
                    <span>${p.icon}</span>
                    <span>${p.question}</span>
                  </div>
                  <span style="color:var(--cyan); font-size:0.7rem; flex-shrink:0; margin-top:2px;">ver respuesta ▸</span>
                </summary>
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border); color:var(--text-secondary); font-size:0.82rem; line-height:1.6; background: rgba(0,0,0,0.2); padding: 10px; border-radius:4px;">
                  ${p.answer}
                </div>
              </details>
            `;
          }).join('')}
        </div>
      </div>

    </div>

    <!-- MODAL INFORME FUNDADOR -->
    <div id="modal-founder-report" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:2000; justify-content:center; align-items:center; padding:20px;">
      <div class="card" style="max-width:800px; width:100%; max-height:85vh; display:flex; flex-direction:column; border-color:var(--cyan); padding:24px; box-shadow: var(--shadow-glow-cyan);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="color:var(--text-primary); font-size:1.2rem; display:flex; align-items:center; gap:8px;">
            <span>📄</span> Informe de Supervivencia para el Fundador
          </h3>
          <button class="btn btn-secondary" id="btn-close-modal" style="padding:4px 8px; font-size:0.8rem;">Cerrar ✗</button>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">Copia este informe en lenguaje no técnico para enviárselo directamente a tu cliente por correo o Slack.</p>
        
        <div style="flex:1; overflow-y:auto; background:var(--bg-surface); padding:16px; border:1px solid var(--border); border-radius:4px; margin-bottom:16px;">
          <pre id="founder-report-content" style="white-space:pre-wrap; font-family:inherit; color:var(--text-secondary); font-size:0.85rem; line-height:1.6; margin:0;"></pre>
        </div>
        
        <div style="display:flex; gap:12px; justify-content:flex-end;">
          <button class="btn btn-secondary" id="btn-copy-report" style="font-weight:600;">📋 Copiar al Portapapeles</button>
          <button class="btn btn-primary" id="btn-done-modal">Entendido ✓</button>
        </div>
      </div>
    </div>
  `;

  // --- LISTENERS ---

  // Botón para editar simulación
  if (simulated) {
    document.getElementById('btn-edit-sim').addEventListener('click', () => {
      STATE.defensaSimulacionInputs = null;
      renderDefensa();
    });
  }

  // Checkboxes de Plan de Choque
  document.querySelectorAll('.shock-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const checkedArr = [...STATE.defensaPlanChoqueChecked];
      
      if (e.target.checked) {
        if (!checkedArr.includes(id)) checkedArr.push(id);
        if (typeof showToast === 'function') showToast('Tarea marcada como completada ✓', 'success');
        if (typeof logAudit === 'function') logAudit('Hito completado (Choque)', `Acción '${id}' realizada`);
      } else {
        const idx = checkedArr.indexOf(id);
        if (idx > -1) checkedArr.splice(idx, 1);
        if (typeof showToast === 'function') showToast('Tarea revertida', 'info');
        if (typeof logAudit === 'function') logAudit('Hito desmarcado (Choque)', `Acción '${id}' revertida`);
      }
      
      STATE.defensaPlanChoqueChecked = checkedArr;
      
      // Añadimos/Quitamos clase visual de completado
      const label = e.target.closest('.shock-item');
      if (label) {
        label.classList.toggle('completed', e.target.checked);
        const title = label.querySelector('strong');
        const desc = label.querySelector('span:last-child');
        if (title) title.style.textDecoration = e.target.checked ? 'line-through' : 'none';
        if (desc) desc.style.opacity = e.target.checked ? 0.5 : 0.85;
      }
    });
  });

  // Exportar informe fundador
  document.getElementById('btn-export-founder').addEventListener('click', () => {
    const reportText = exportFounderReport(data, simulated);
    const modal = document.getElementById('modal-founder-report');
    const pre = document.getElementById('founder-report-content');
    
    if (modal && pre) {
      pre.textContent = reportText;
      modal.style.display = 'flex';
      
      // Auto-focus en copiar
      document.getElementById('btn-copy-report').focus();
    }
  });

  // Auxiliares de Portapapeles con Fallback robusto para entornos sin navigator.clipboard o sin HTTPS
  function copyToClipboardFallback(text) {
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Colocar fuera de vista para evitar saltos de pantalla
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          resolve();
        } else {
          reject(new Error('document.execCommand copy devolvió false'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function safeCopyToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(() => copyToClipboardFallback(text));
    } else {
      return copyToClipboardFallback(text);
    }
  }

  // Acciones Modal
  const modal = document.getElementById('modal-founder-report');
  if (modal) {
    document.getElementById('btn-close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('btn-done-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    document.getElementById('btn-copy-report').addEventListener('click', () => {
      const text = document.getElementById('founder-report-content').textContent;
      safeCopyToClipboard(text).then(() => {
        showToast('¡Informe copiado al portapapeles! 📋', 'success');
      }).catch(err => {
        console.error('Error al copiar', err);
        showToast('Error al copiar. Por favor, selecciona el texto y copia manualmente.', 'error');
      });
    });
  }
}
