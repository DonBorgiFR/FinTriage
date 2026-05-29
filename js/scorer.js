/**
 * scorer.js — Motor de Elegibilidad para Financiación Pública
 * Evalúa criterios ENISA Emprendedores y CDTI Neotec.
 */

// ---- Helpers ----
function _fmtEur(v) {
  if (v == null || isNaN(v)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v) + '€';
}

/**
 * ENISA_CRITERIOS
 * @constant {Array<Object>}
 * @description Define los pesos, umbrales y lógicas de validación para el programa ENISA Emprendedores.
 * Se evalúan los Fondos Propios, años de antigüedad, capital social y apalancamiento.
 */
const ENISA_CRITERIOS = [
  {
    id: 'E1', peso: 20, critico: true,
    label: 'Fondos Propios positivos',
    desc: 'El patrimonio neto debe ser > 0€.',
    compute(data, inp) {
      const pn = data.balance.patrimonioNeto;
      const ok = pn > 0;
      return { ok, valor: _fmtEur(pn), detalle: ok ? 'PN positivo ✓' : 'PN negativo — riesgo de denegación' };
    }
  },
  {
    id: 'E2', peso: 20, critico: true,
    label: 'Empresa menor de 5 años',
    desc: 'ENISA Emprendedores financia empresas < 5 años desde constitución.',
    compute(data, inp) {
      const a = parseFloat(inp.añosEmpresa) || 0;
      const ok = a > 0 && a <= 5;
      return { ok, valor: a ? `${a} año${a !== 1 ? 's' : ''}` : 'No indicado', detalle: ok ? 'Dentro del umbral' : a > 5 ? 'Supera el límite de 5 años' : 'Introduce los años de empresa' };
    }
  },
  {
    id: 'E3', peso: 15, critico: false,
    label: 'Capital aportado ≥ 50% de lo solicitado',
    desc: 'ENISA exige ratio 1:1 recursos propios/préstamo.',
    compute(data, inp) {
      const cs = parseFloat(inp.capitalSocial) || 0;
      const sol = parseFloat(inp.importeSolicitado) || 1;
      const ratio = cs / sol;
      const ok = ratio >= 0.5;
      return { ok, valor: `${(ratio * 100).toFixed(0)}%`, detalle: ok ? `Capital suficiente (${_fmtEur(cs)} vs ${_fmtEur(sol)})` : `Déficit de ${_fmtEur(sol * 0.5 - cs)} en capital propio` };
    }
  },
  {
    id: 'E4', peso: 10, critico: false,
    label: 'Modelo innovador / escalable',
    desc: 'El proyecto debe presentar carácter innovador demostrable.',
    compute(data, inp) {
      const ok = inp.modeloInnovador === true || inp.modeloInnovador === 'true';
      return { ok, valor: ok ? 'Sí' : 'No indicado', detalle: ok ? 'Marcado como innovador' : 'Pendiente de validar' };
    }
  },
  {
    id: 'E5', peso: 10, critico: true,
    label: 'No cotiza en mercados regulados',
    desc: 'Las empresas cotizadas no son elegibles.',
    compute(data, inp) {
      const cotizada = inp.cotizada === true || inp.cotizada === 'true';
      const ok = !cotizada;
      return { ok, valor: cotizada ? 'Sí cotiza' : 'No cotiza', detalle: ok ? 'Elegible' : 'Empresa cotizada — no elegible ENISA' };
    }
  },
  {
    id: 'E6', peso: 15, critico: false,
    label: 'Deuda LP / Patrimonio Neto < 3x',
    desc: 'ENISA es sensible al sobreendeudamiento estructural.',
    compute(data, inp) {
      const pn = Math.max(data.balance.patrimonioNeto, 1);
      const deuda = data.balance.pasivoNoCorriente;
      const ratio = deuda / pn;
      const ok = ratio < 3;
      return { ok, valor: `${ratio.toFixed(2)}x`, detalle: ok ? 'Apalancamiento razonable' : `Deuda excesiva (${ratio.toFixed(2)}x PN)` };
    }
  },
  {
    id: 'E7', peso: 10, critico: false,
    label: 'Tendencia EBITDA positiva (últimos meses)',
    desc: 'Indicador favorable — refuerza la solicitud.',
    compute(data, inp) {
      const months = Object.keys(data.pygMensual).sort();
      if (months.length < 2) return { ok: false, valor: '—', detalle: 'Se necesitan ≥ 2 meses' };
      const last = data.pygMensual[months[months.length - 1]].ebitda;
      const prev = data.pygMensual[months[months.length - 2]].ebitda;
      const ok = last > prev;
      const diff = last - prev;
      return { ok, valor: _fmtEur(last), detalle: `${diff >= 0 ? '+' : ''}${_fmtEur(diff)} vs mes anterior` };
    }
  }
];

/**
 * CDTI_CRITERIOS
 * @constant {Array<Object>}
 * @description Define los pesos, umbrales y lógicas de validación para CDTI Neotec.
 * Prioriza empresas < 3 años, presupuesto I+D > 175k€ y masa crítica de personal técnico.
 */
const CDTI_CRITERIOS = [
  {
    id: 'N1', peso: 25, critico: true,
    label: 'Empresa menor de 3 años',
    desc: 'CDTI Neotec financia start-ups de reciente creación (máx. 3 años).',
    compute(data, inp) {
      const a = parseFloat(inp.añosEmpresa) || 0;
      const ok = a > 0 && a <= 3;
      return { ok, valor: a ? `${a} año${a !== 1 ? 's' : ''}` : 'No indicado', detalle: ok ? 'Dentro del umbral Neotec' : a > 3 ? 'Supera el límite de 3 años' : 'Introduce los años de empresa' };
    }
  },
  {
    id: 'N2', peso: 25, critico: true,
    label: 'Proyecto de I+D+i (tech/biotech/deeptech)',
    desc: 'El proyecto debe ser de base tecnológica con resultados propios innovadores.',
    compute(data, inp) {
      const ok = ['tech', 'biotech', 'deeptech'].includes(inp.tipoProyecto);
      return { ok, valor: inp.tipoProyecto || 'No indicado', detalle: ok ? 'Tipología compatible con Neotec' : 'Proyecto no clasificado como I+D elegible' };
    }
  },
  {
    id: 'N3', peso: 20, critico: false,
    label: 'Presupuesto I+D entre 175K€ y 10M€',
    desc: 'CDTI Neotec financia proyectos en ese rango presupuestario.',
    compute(data, inp) {
      const p = parseFloat(inp.presupuestoID) || 0;
      const ok = p >= 175000 && p <= 10000000;
      return { ok, valor: p ? _fmtEur(p) : 'No indicado', detalle: ok ? 'Rango compatible' : p > 0 && p < 175000 ? 'Por debajo del mínimo operativo' : p > 10000000 ? 'Excede el máximo habitual' : 'Introduce el presupuesto' };
    }
  },
  {
    id: 'N4', peso: 10, critico: false,
    label: '≥ 50% del equipo con perfil técnico',
    desc: 'Neotec valora que la empresa sea liderada por perfiles técnicos.',
    compute(data, inp) {
      const pct = parseFloat(inp.pctPersonalTech) || 0;
      const ok = pct >= 50;
      return { ok, valor: pct ? `${pct}%` : 'No indicado', detalle: ok ? 'Equipo técnico suficiente' : 'Reforzar plantilla técnica' };
    }
  },
  {
    id: 'N5', peso: 10, critico: true,
    label: 'No ha recibido CDTI Neotec anteriormente',
    desc: 'Solo se concede una vez por empresa.',
    compute(data, inp) {
      const previo = inp.neotecPrevio === true || inp.neotecPrevio === 'true';
      const ok = !previo;
      return { ok, valor: previo ? 'Sí (ya recibido)' : 'No', detalle: ok ? 'Primera solicitud — elegible' : 'Ya recibido — no elegible' };
    }
  },
  {
    id: 'N6', peso: 10, critico: false,
    label: 'Gasto en Personal ≥ 40% del OPEX total',
    desc: 'Indica que la empresa es genuinamente tech, no un integrador.',
    compute(data, inp) {
      const totalOpex = Math.max(data.totales.gastos, 1);
      const personal = Object.values(data.pygMensual).reduce((s, m) => s + (m.personal || 0), 0);
      const pctReal = personal / totalOpex;
      const ok = pctReal >= 0.4;
      return { ok, valor: `${(pctReal * 100).toFixed(1)}%`, detalle: ok ? 'Personal representa parte mayoritaria del OPEX' : 'Personal por debajo del 40% del OPEX total' };
    }
  }
];

// ---- NUEVOS EVALUADORES DE FINANCIACIÓN EXTENDIDA (NUEVO) ----

function _calcularAntiguedad(fechaStr) {
  if (!fechaStr) return null;
  const constituida = new Date(fechaStr);
  const ahora = new Date(); // Fecha actual real del sistema
  let anios = ahora.getFullYear() - constituida.getFullYear();
  const mes = ahora.getMonth() - constituida.getMonth();
  if (mes < 0 || (mes === 0 && ahora.getDate() < constituida.getDate())) {
    anios--;
  }
  return Math.max(0, anios);
}

function scoreICOCrecimiento(data, context) {
  const constituida = context.fechaConstitucion;
  const antiguedad = _calcularAntiguedad(constituida);
  const audit = context.cuentasAuditadas;
  const trustScore = data.confidence?.trustScore || 0;
  const activoNoCorriente = data.balance?.activoNoCorriente || 0;
  const activoTotal = data.balance?.activoTotal || 1;
  const ratioIntangibles = activoNoCorriente / activoTotal;
  
  // SGR elegible es proxy para el aval solidario
  const sgrRes = scoreAvalsSGR(data, context);
  const avalDisponible = sgrRes.elegible === true || sgrRes.elegible === 'probable';
  
  const cumpleBasicos = antiguedad !== null && antiguedad >= 4;
  const cumpleGarantia = audit === true || avalDisponible;
  const cumpleConfianza = trustScore >= 40;
  
  if (cumpleBasicos && cumpleGarantia && cumpleConfianza) {
    return {
      elegible: true,
      motivo: `Cumple los criterios de antigüedad mínima (constituida hace ${antiguedad} años), dispone de garantía/auditoría y supera el Trust Score contable (Trust Score: ${trustScore}). Ratio de intangibles sobre activo: ${(ratioIntangibles*100).toFixed(1)}%.`,
      accion: "Preparar el expediente digital en la plataforma de ICO Directo aportando las cuentas auditadas de los dos últimos ejercicios o el aval de la SGR."
    };
  } else if (antiguedad !== null && antiguedad >= 4 && audit === null) {
    return {
      elegible: 'probable',
      motivo: `Tiene la antigüedad requerida (constituida hace ${antiguedad} años) pero no se ha indicado si dispone de cuentas auditadas de los 2 últimos ejercicios.`,
      accion: "Confirmar en el perfil si la empresa tiene cuentas auditadas o tramitar el aval con la SGR regional para habilitar la línea."
    };
  } else {
    let motivos = [];
    let acciones = [];
    
    if (antiguedad === null) {
      motivos.push("No se ha indicado la fecha de constitución.");
      acciones.push("Indicar la fecha de constitución en el perfil cualitativo (Paso 2).");
    } else if (antiguedad < 4) {
      motivos.push(`La línea ICO Crecimiento requiere un mínimo de 4 años de antigüedad (constituida hace ${antiguedad} años).`);
      acciones.push("Explorar líneas de financiación alternativas sin antigüedad mínima (como ENISA o avales SGR directos).");
    }
    
    if (!cumpleGarantia) {
      motivos.push("Se requiere disponer de cuentas anuales auditadas de los dos últimos ejercicios o un aval solidario SGR.");
      acciones.push("Contactar con la SGR regional para solicitar un aval de reafianzamiento o iniciar el proceso de auditoría.");
    }
    
    if (!cumpleConfianza) {
      motivos.push(`El Trust Score contable (${trustScore}) es inferior al mínimo requerido (40) para esta línea.`);
      acciones.push("Subsanar las anomalías contables críticas reportadas en el panel principal para elevar la calidad del dato.");
    }
    
    return {
      elegible: false,
      motivo: motivos.join(" "),
      accion: acciones.length > 0 ? acciones[0] : "Revisar los parámetros cualitativos de la empresa."
    };
  }
}

function scoreICOVerde(data, context) {
  const esVerde = context.proyectoVerde === true;
  const trustScore = data.confidence?.trustScore || 0;
  const cumpleConfianza = trustScore >= 40;
  
  if (esVerde && cumpleConfianza) {
    return {
      elegible: true,
      motivo: `Proyecto de transición verde / sostenible elegible. Cuenta con un nivel de confianza contable de ${trustScore} (mínimo requerido: 40).`,
      accion: "Proceder a estructurar la memoria técnica del proyecto sostenible (eficiencia energética, economía circular, descarbonización) y solicitar mediación bancaria antes del 31 de agosto de 2026 (cierre de ventana)."
    };
  } else if (context.proyectoVerde === null || context.proyectoVerde === undefined) {
    return {
      elegible: 'probable',
      motivo: "No se ha especificado si el plan de inversión contiene partidas de transición verde, eficiencia energética o sostenibilidad.",
      accion: "Identificar si el proyecto incluye inversiones en placas solares, movilidad sostenible, eficiencia energética o economía circular para calificar."
    };
  } else {
    if (!esVerde) {
      return {
        elegible: false,
        motivo: "Línea no aplicable debido a la ausencia de inversiones sostenibles o verdes declaradas.",
        accion: "Explorar la línea ordinaria ICO Empresas y Emprendedores para inversiones de carácter general."
      };
    }
    return {
      elegible: false,
      motivo: `El Trust Score contable (${trustScore}) es inferior al mínimo requerido (40) para formalizar la línea de mediación.`,
      accion: "Corregir los descuadres y anomalías contables en el libro diario para cumplir los estándares mínimos de solvencia bancaria."
    };
  }
}

function scoreAvalsSGR(data, context) {
  const anomalies = data.anomalies || [];
  const patrimonioNeto = data.balance?.patrimonioNeto || 0;
  
  const tieneCritica47 = anomalies.some(a => 
    a.severity === 'critical' && 
    (a.cuenta?.startsWith('47') || a.id === 'deuda_publica_alta')
  );
  
  const tieneGrave551 = anomalies.some(a => {
    const es551 = a.cuenta?.startsWith('551') || a.id?.includes('551');
    if (!es551) return false;
    if (a.severity === 'critical') return true;
    if (a.detail && a.detail.includes('50.000')) return true;
    return false;
  });
  
  const patrimonioPositivo = patrimonioNeto > 0;
  
  const ccaa = context.ccaaFiscal || 'otras';
  const sgrMap = {
    cataluna: { nombre: 'Avalis de Catalunya SGR', aval: 'Avalis Catalunya' },
    madrid: { nombre: 'Avalmadrid SGR', aval: 'Avalmadrid' },
    pais_vasco: { nombre: 'Elkargi SGR', aval: 'Elkargi' },
    valencia: { nombre: 'Afín SGR', aval: 'Afín Comunidad Valenciana' },
    andalucia: { nombre: 'Garántia SGR', aval: 'Garántia Andalucía' },
    galicia: { nombre: 'Afigal SGR / Sogarpo SGR', aval: 'Afigal / Sogarpo' },
    otras: { nombre: 'la SGR regional correspondiente', aval: 'SGR regional' }
  };
  const sgr = sgrMap[ccaa] || sgrMap.otras;
  
  const elegible = !tieneCritica47 && !tieneGrave551 && patrimonioPositivo;
  
  if (elegible) {
    return {
      elegible: true,
      motivo: `Potencial acceso a aval ${sgr.aval}. Patrimonio neto positivo (${_fmtEur(patrimonioNeto)}) y balance libre de incidencias fiscales críticas en deuda pública o cuentas con socios.`,
      accion: `Presentar solicitud de aval ante ${sgr.nombre}. La SGR puede avalar hasta 1,1M€ con reafianzamiento CERSA (80%). Sin antigüedad mínima requerida.`
    };
  } else {
    let motivos = [];
    let acciones = [];
    
    if (!patrimonioPositivo) {
      motivos.push(`Patrimonio neto negativo o nulo (${_fmtEur(patrimonioNeto)}), lo que sitúa a la empresa en situación de quiebra técnica teórica.`);
      acciones.push("Realizar una aportación de socios o compensación de pérdidas para restablecer el patrimonio neto positivo.");
    }
    if (tieneCritica47) {
      motivos.push("Se registran deudas tributarias o de Seguridad Social críticas sin aplazamiento formalizado (Grupo 47).");
      acciones.push("Regularizar los atrasos tributarios u obtener un aplazamiento formalizado de Hacienda/SS antes de solicitar el aval.");
    }
    if (tieneGrave551) {
      motivos.push("Se registran saldos deudores elevados y de alto riesgo fiscal en la cuenta corriente de socios (cta. 551 > 50.000€).");
      acciones.push("Formalizar un contrato de préstamo mercantil a tipo legal por el saldo de la 551 o compensar la cuenta con fondos propios.");
    }
    
    return {
      elegible: false,
      motivo: motivos.join(" "),
      accion: acciones.length > 0 ? acciones[0] : "Corregir incidencias de balance y solvencia."
    };
  }
}

function scoreTorresQuevedo(data, context) {
  const tieneID = context.tieneActividadID === true;
  const quiereDoctor = context.quiereContratarDoctor === true;
  
  if (!tieneID || !quiereDoctor) {
    return {
      elegible: 'no_elegible',
      motivo: "Ayuda inactiva. Requiere tener actividad formalizada de I+D y la intención de contratar investigadores con grado de Doctor.",
      accion: "Declarar la actividad I+D y marcar la intención de contratación de doctores en el perfil cualitativo (Paso 2)."
    };
  }
  
  const pn = data.balance?.patrimonioNeto || 0;
  const ingresos = data.totales?.ingresos || 0;
  const empleados = context.numEmpleados || 0;
  
  const noQuiebra = pn > 0;
  const conOperativa = ingresos > 0;
  
  if (!noQuiebra || !conOperativa) {
    let motivos = [];
    if (!noQuiebra) motivos.push("La empresa presenta fondos propios negativos (quiebra técnica teórica).");
    if (!conOperativa) motivos.push("La empresa no registra ingresos operativos reales en el periodo.");
    return {
      elegible: false,
      motivo: motivos.join(" "),
      accion: "Restablecer el equilibrio financiero neto de la empresa antes de postular a convocatorias competitivas ministeriales."
    };
  }
  
  // Clasificación de tamaño Pyme UE
  let tamaño = 'grande';
  let intensidad = 50;
  if (empleados < 50 && ingresos < 10000000) {
    tamaño = 'pequeña';
    intensidad = 70;
  } else if (empleados < 250 && ingresos < 50000000) {
    tamaño = 'mediana';
    intensidad = 60;
  }
  
  return {
    elegible: true,
    motivo: `Empresa clasificada como pyme '${tamaño}' (${empleados} empleados, facturación: ${_fmtEur(ingresos)}). Cobertura estimada: hasta el ${intensidad}% del coste de contratación (máx. 56.000 €/año por doctor durante 3 años).`,
    accion: "Definir el proyecto de I+D+i y contactar con doctores candidatos para la próxima convocatoria ministerial (estimada para noviembre de 2026)."
  };
}

function scoreEICAccelerator(data, context) {
  const trl = (context.trl !== null && context.trl !== undefined) ? parseInt(context.trl) : null;
  const empleados = (context.numEmpleados !== null && context.numEmpleados !== undefined) ? parseInt(context.numEmpleados) : null;
  const ingresos = data.totales?.ingresos || 0;
  const trustScore = data.confidence?.trustScore || 0;
  const tieneIP = context.tieneIP === true;
  
  const esPymeUE = (empleados === null) ? true : (empleados < 250 && ingresos < 50000000);
  const cumpleTRL = (trl === null) ? false : (trl >= 5);
  
  if (!cumpleTRL || !esPymeUE) {
    let motivos = [];
    if (!cumpleTRL) {
      if (trl === null) {
        motivos.push("No se ha especificado el nivel de madurez tecnológica (TRL), se requiere TRL >= 5.");
      } else {
        motivos.push(`Nivel de madurez tecnológica bajo (TRL ${trl} registrado, requiere TRL >= 5).`);
      }
    }
    if (!esPymeUE) motivos.push(`Supera los límites máximos de PYME de la Unión Europea (empleados: ${empleados}, facturación: ${_fmtEur(ingresos)}).`);
    return {
      elegible: 'no_elegible',
      motivo: `Ayuda inactiva. ${motivos.join(" ")}`,
      accion: trl === null 
        ? "Especificar el nivel TRL de madurez tecnológica en el perfil cualitativo (Paso 2)."
        : "Avanzar en el desarrollo técnico (TRL 5 en adelante) para optar a este instrumento altamente disruptivo."
    };
  }
  
  if (context.eicConcedidoPrevio === true) {
    return {
      elegible: false,
      motivo: "La empresa ya ha recibido financiación EIC Accelerator. Este instrumento europeo de alta financiación se concede una sola vez por empresa en el período de Horizonte Europa (2021–2027).",
      accion: "Explorar otros instrumentos de Horizonte Europa alternativos, como EIC Transition o el STEP Scale-Up para fases posteriores de escalado internacional."
    };
  }
  
  const cumpleConfianza = trustScore >= 50;
  
  if (cumpleConfianza && tieneIP) {
    return {
      elegible: true,
      motivo: `Califica como PYME de la UE con TRL ${trl} adecuado y propiedad intelectual (IP) protegida. Trust Score contable de ${trustScore} apto para procesos de due diligence internacional.`,
      accion: "Preparar la propuesta corta (Fase 1) en la plataforma oficial del EIC Accelerator. Cuenta con 3 modalidades: Grant-only (hasta 2.5M€), Blended finance (2.5M€ + hasta 10M€ equity de EIC Fund) e Investment-only (hasta 10M€ equity)."
    };
  } else {
    let motivos = [];
    if (!tieneIP) motivos.push("No posee patentes o propiedad intelectual formalmente protegida (criterio de diferenciación muy valorado).");
    if (!cumpleConfianza) motivos.push(`El Trust Score contable (${trustScore}) está en zona de riesgo para la debida diligencia de la Comisión Europea.`);
    
    return {
      elegible: 'probable',
      motivo: `Fuerte potencial de elegibilidad básica (TRL ${trl} y perfil pyme). Sin embargo, presenta barreras indicativas: ${motivos.join(" ")}`,
      accion: "Estructurar la estrategia de patentes/propiedad intelectual y limpiar anomalías contables antes de iniciar la solicitud oficial."
    };
  }
}

function scoreMicroBank(data, context) {
  const ingresos = data.totales?.ingresos || 0;
  const empleados = (context.numEmpleados !== null && context.numEmpleados !== undefined) ? parseInt(context.numEmpleados) : null;
  
  const cumpleFacturacion = ingresos < 2000000;
  const cumpleEmpleados = empleados !== null ? empleados <= 10 : null;
  
  if (empleados === null) {
    return {
      elegible: 'probable',
      motivo: "Posible candidato si la facturación anual es inferior a 2M€ y cuenta con menos de 10 empleados en plantilla (parámetros sin especificar).",
      accion: "Completar la información de número de empleados en el perfil cualitativo para confirmar la elegibilidad de microcrédito."
    };
  }
  
  if (cumpleFacturacion && cumpleEmpleados) {
    return {
      elegible: true,
      motivo: `Cumple los límites formales de microempresa (empleados: ${empleados} <= 10, facturación: ${_fmtEur(ingresos)} < 2M€).`,
      accion: "Elaborar un plan de negocio simplificado. MicroBank ofrece microcréditos sin necesidad de garantías reales de hasta 25.000€ (personas físicas) o 30.000€ (personas jurídicas) basados en viabilidad técnica."
    };
  } else {
    return {
      elegible: false,
      motivo: `Supera los límites establecidos de microempresa para esta línea específica de microcrédito social (empleados: ${empleados}, facturación: ${_fmtEur(ingresos)}).`,
      accion: "Explorar las líneas ICO Empresas o avales SGR ordinarios en entidades de crédito colaboradoras."
    };
  }
}

/**
 * scoreFinanciacion(data, inp)
 * @description Ejecuta el motor de reglas sobre los datos contables combinados con los inputs manuales.
 * @param {Object} data - AnalysisResult (Totales, Balance, PyG).
 * @param {Object} inp - Valores manuales del usuario (años de empresa, capital social, etc).
 * @returns {Object} Un objeto con el scoring detallado (`score`, `elegible`, `alertas`) para ENISA y CDTI.
 */
function scoreFinanciacion(data, inp = {}) {
  const penalty = data.confidence?.scoringPenalty || 0;

  function computePrograma(criterios) {
    const results = criterios.map(c => ({ ...c, ...c.compute(data, inp) }));
    const totalPeso = criterios.reduce((s, c) => s + c.peso, 0);
    const pesoOk   = results.filter(r => r.ok).reduce((s, r) => s + r.peso, 0);
    
    let rawScore = Math.round((pesoOk / totalPeso) * 100);
    const score  = Math.max(0, rawScore - penalty);
    
    const criticoFailed = results.filter(r => r.critico && !r.ok);
    const elegible = score >= 60 && criticoFailed.length === 0 && (data.confidence?.confidenceLevel !== 'blocked');

    const alertas = [];
    if (penalty > 0) {
      alertas.push(`⚠️ Score penalizado en -${penalty} pts por calidad de dato (${data.confidence?.confidenceLabel}).`);
    }
    criticoFailed.forEach(r => alertas.push(`⛔ Criterio crítico no cumplido: ${r.label}`));
    results.filter(r => !r.ok && !r.critico).forEach(r => alertas.push(`⚠ ${r.label}: ${r.detalle}`));

    return { score, rawScore, penalty, elegible, criterios: results, alertas };
  }
  
  const context = STATE.contextChecklist || {};

  return {
    enisa: computePrograma(ENISA_CRITERIOS),
    cdti:  computePrograma(CDTI_CRITERIOS),
    
    // Nuevas líneas extendidas (Matiz 3 - ICO Verde incluido)
    icoCrecimiento: scoreICOCrecimiento(data, context),
    icoVerde: scoreICOVerde(data, context),
    avalsSGR: scoreAvalsSGR(data, context),
    torresQuevedo: scoreTorresQuevedo(data, context),
    eicAccelerator: scoreEICAccelerator(data, context),
    microBank: scoreMicroBank(data, context),
    
    confidence: data.confidence
  };
}

// ---- Render principal ----
function renderScorer() {
  const root = document.getElementById('scoring-root');
  if (!root) return;
  const inp = STATE.scoringInputs || {};

  root.innerHTML = `
    <div class="card" style="margin-bottom:24px;">
      <div class="card-title">⚙️ Parámetros de Elegibilidad</div>
      <p style="font-size:0.83rem;color:var(--text-muted);margin-bottom:18px;">Introduce los datos que no se pueden deducir del libro contable. El scoring se recalculará automáticamente.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;">
        <div class="form-group"><label for="sc-años">Años desde constitución</label>
          <input type="number" id="sc-años" value="${inp.añosEmpresa||''}" placeholder="Ej: 2" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);"/></div>
        <div class="form-group"><label for="sc-capital">Capital Social aportado (€)</label>
          <input type="number" id="sc-capital" value="${inp.capitalSocial||''}" placeholder="Ej: 50000" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);"/></div>
        <div class="form-group"><label for="sc-solicitado">Importe a solicitar ENISA (€)</label>
          <input type="number" id="sc-solicitado" value="${inp.importeSolicitado||''}" placeholder="Ej: 150000" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);"/></div>
        <div class="form-group"><label for="sc-presupuesto">Presupuesto I+D (€)</label>
          <input type="number" id="sc-presupuesto" value="${inp.presupuestoID||''}" placeholder="Ej: 200000" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);"/></div>
        <div class="form-group"><label for="sc-pct-tech">% Personal técnico</label>
          <input type="number" id="sc-pct-tech" value="${inp.pctPersonalTech||''}" placeholder="Ej: 65" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);"/></div>
        <div class="form-group"><label for="sc-tipo">Tipo de proyecto</label>
          <select id="sc-tipo" style="width:100%;padding:10px;background:var(--bg-surface);color:var(--text-primary);border:1px solid var(--border);border-radius:var(--radius-sm);">
            <option value="">— Seleccionar —</option>
            <option value="tech" ${inp.tipoProyecto==='tech'?'selected':''}>Software / Tech</option>
            <option value="biotech" ${inp.tipoProyecto==='biotech'?'selected':''}>Biotech / Medtech</option>
            <option value="deeptech" ${inp.tipoProyecto==='deeptech'?'selected':''}>Deep Tech / Hardware</option>
            <option value="other" ${inp.tipoProyecto==='other'?'selected':''}>Otro</option>
          </select></div>
      </div>
      <div style="display:flex;gap:28px;margin-top:16px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.87rem;color:var(--text-secondary);">
          <input type="checkbox" id="sc-innovador" ${inp.modeloInnovador?'checked':''} style="width:16px;height:16px;accent-color:var(--cyan);"/> Modelo innovador / escalable</label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.87rem;color:var(--text-secondary);">
          <input type="checkbox" id="sc-cotizada" ${inp.cotizada?'checked':''} style="width:16px;height:16px;accent-color:var(--cyan);"/> Empresa cotizada en mercados regulados</label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.87rem;color:var(--text-secondary);">
          <input type="checkbox" id="sc-neotec-previo" ${inp.neotecPrevio?'checked':''} style="width:16px;height:16px;accent-color:var(--cyan);"/> Ya recibió CDTI Neotec anteriormente</label>
      </div>
      <div style="margin-top:18px;">
        <button class="btn btn-primary" id="btn-recalcular-scoring" style="font-size:0.9rem;padding:10px 24px;">🔄 Recalcular Scoring</button>
      </div>
    </div>

    <div id="scoring-results">
      ${STATE.analysisResult ? _buildScoringHTML() : `
        <div class="empty-state"><div class="empty-icon">🏅</div>
          <p>Carga y analiza un libro diario para activar el scoring automático.</p></div>`}
    </div>`;

  document.getElementById('btn-recalcular-scoring')?.addEventListener('click', () => {
    _collectScoringInputs();
    if (!STATE.analysisResult) { showToast('Carga un libro diario primero', 'error'); return; }
    try {
      STATE.scoringResult = scoreFinanciacion(STATE.analysisResult, STATE.scoringInputs);
      document.getElementById('scoring-results').innerHTML = _buildScoringHTML();
      showToast('Scoring actualizado ✓', 'success');
    } catch (e) {
      console.error('[FinTriage] Error recalcular scoring:', e);
      STATE.scoringResult = null;
      document.getElementById('scoring-results').innerHTML = _buildScoringHTML();
      showToast('⚠️ Error al recalcular scoring. Degradación aplicada.', 'warn', 5000);
    }
  });
}

function _collectScoringInputs() {
  STATE.scoringInputs = {
    añosEmpresa:      document.getElementById('sc-años')?.value,
    capitalSocial:    document.getElementById('sc-capital')?.value,
    importeSolicitado:document.getElementById('sc-solicitado')?.value,
    presupuestoID:    document.getElementById('sc-presupuesto')?.value,
    pctPersonalTech:  document.getElementById('sc-pct-tech')?.value,
    tipoProyecto:     document.getElementById('sc-tipo')?.value,
    modeloInnovador:  document.getElementById('sc-innovador')?.checked,
    cotizada:         document.getElementById('sc-cotizada')?.checked,
    neotecPrevio:     document.getElementById('sc-neotec-previo')?.checked,
  };
}

function _renderExtendedFinancingRow(nombre, icon, result, link) {
  const { elegible, motivo, accion } = result;
  
  if (elegible === 'no_elegible') return ''; // No lo mostramos si no aplica en absoluto
  
  let badgeColor = 'var(--red)';
  let badgeLabel = '❌ No elegible';
  let badgeStyle = 'background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.25);';
  
  if (elegible === true) {
    badgeColor = 'var(--green)';
    badgeLabel = '✅ Elegible';
    badgeStyle = 'background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.25);';
  } else if (elegible === 'probable') {
    badgeColor = 'var(--amber)';
    badgeLabel = '⚠️ Probable';
    badgeStyle = 'background: rgba(245, 158, 11, 0.1); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.25);';
  }

  return `
    <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px 20px; transition: var(--transition); display: flex; flex-direction: column; gap: 10px;" class="extended-row">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem;">${icon}</span>
          <span style="font-family: var(--font-display); font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">${nombre}</span>
        </div>
        <span style="font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; ${badgeStyle}">${badgeLabel}</span>
      </div>
      <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary);">
        <strong>Diagnóstico:</strong> ${motivo}
      </div>
      <div style="font-size: 0.76rem; line-height: 1.5; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid ${badgeColor};">
        <strong>Acción recomendada:</strong> ${accion}
      </div>
      <div style="text-align: right; margin-top: 4px;">
        <a href="${link}" target="_blank" rel="noopener noreferrer" style="font-size: 0.74rem; color: var(--cyan); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: var(--transition);">
          🔗 Ir a la Convocatoria Oficial →
        </a>
      </div>
    </div>
  `;
}

function _buildScoringHTML() {
  let scoring = STATE.scoringResult;
  if (!scoring) {
    try {
      scoring = scoreFinanciacion(STATE.analysisResult, STATE.scoringInputs || {});
      STATE.scoringResult = scoring;
    } catch (e) {
      console.error('[FinTriage] Error in scoreFinanciacion within _buildScoringHTML:', e);
      scoring = null;
      STATE.scoringResult = null;
    }
  }

  if (!scoring) {
    return `
      <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.2); border-radius:var(--radius-md); padding:30px; text-align:center; grid-column: 1 / -1; margin:20px 0; width:100%;">
        <span style="font-size:3rem; display:block; margin-bottom:16px;">🏅</span>
        <h3 style="font-family:var(--font-display); font-size:1.15rem; font-weight:700; color:var(--text-primary); margin-bottom:8px;">Scoring de Financiación no disponible</h3>
        <p style="font-size:0.88rem; color:var(--text-secondary); max-width:500px; margin:0 auto 20px auto;">
          No se ha podido procesar el scoring automático de elegibilidad financiera para ENISA y CDTI debido a inconsistencias o anomalías en el libro contable de la empresa. El resto de la workstation sigue plenamente operativa.
        </p>
        <div style="font-size:0.78rem; font-family:var(--font-mono); color:var(--red); background:rgba(0,0,0,0.15); padding:8px 12px; border-radius:var(--radius-sm); display:inline-block;">
          Error: ${STATE.auditTrail?.filter(a => a.action === 'DEGRADACIÓN' && a.detail.includes('scoreFinanciacion')).pop()?.detail || 'Fallo técnico en el motor de elegibilidad'}
        </div>
      </div>
    `;
  }

  // Renderizar las 6 nuevas líneas adicionales (Fase 1.5 - ICO Verde incluida)
  const rows = [
    _renderExtendedFinancingRow('ICO Crecimiento (Financiación Directa)', '🏦', scoring.icoCrecimiento, 'https://www.ico.es/web/ico/ico-crecimiento'),
    _renderExtendedFinancingRow('ICO Verde (Proyectos Sostenibles)', '🟢', scoring.icoVerde, 'https://www.ico.es/web/ico/ico-crecimiento'),
    _renderExtendedFinancingRow('Aval SGR Regional / Reafianzamiento CERSA', '🛡️', scoring.avalsSGR, 'https://www.cersa-sme.es/'),
    _renderExtendedFinancingRow('Torres Quevedo (Contratación de Doctores)', '🎓', scoring.torresQuevedo, 'https://www.aei.gob.es/convocatorias/buscador-convocatorias/ayudas-contratos-torres-quevedo-2025'),
    _renderExtendedFinancingRow('EIC Accelerator (Innovación Disruptiva Europea)', '🇪🇺', scoring.eicAccelerator, 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en'),
    _renderExtendedFinancingRow('MicroBank / Microcrédito de Viabilidad', '💼', scoring.microBank, 'https://www.microbank.com/es/productos/negocios-convenio.html')
  ].filter(Boolean).join('');

  const hasExtended = rows.trim().length > 0;

  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(460px,1fr));gap:24px;margin-bottom:24px;">
      ${_renderProgramaCard('ENISA Emprendedores', '🏦', scoring.enisa, 'var(--cyan)', 'Préstamo participativo hasta 300K€ · Ratio 1:1 capital propio')}
      ${_renderProgramaCard('CDTI Neotec', '🔬', scoring.cdti, 'var(--purple)', 'Subvención + préstamo hasta 250K€ · Proyectos I+D de base tecnológica')}
    </div>
    
    ${hasExtended ? `
      <div class="card" style="margin-top: 24px;">
        <div class="card-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span>🌐 Otras Líneas de Financiación Detectadas</span>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: none; font-weight: normal;">Líneas orientativas y compatibles</span>
        </div>
        <p style="font-size:0.83rem;color:var(--text-muted);margin-bottom:18px;">FinTriage ha evaluado de forma cruzada la consistencia de los apuntes de tu balance y tu perfil cualitativo frente a instrumentos financieros de ámbito autonómico, nacional y europeo.</p>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${rows}
        </div>
        <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 0.72rem; color: var(--text-muted); line-height: 1.6;">
          <strong>Nota de Compatibilidad y Acumulación:</strong> Las líneas ICO (incluyendo ICO Verde), SGR regionales y Torres Quevedo son compatibles y acumulables entre sí y con ENISA/CDTI, siempre que no financien el mismo concepto de gasto. El EIC Accelerator es incompatible con CDTI si el proyecto de I+D es idéntico, y solo puede concederse una vez por empresa en el período 2021–2027.
        </div>
      </div>
    ` : ''}
  `;
}

function _renderProgramaCard(nombre, icon, result, color, desc) {
  const { score, elegible, criterios, alertas } = result;
  const confidence = STATE.analysisResult?.confidence;
  const isLowConf = confidence && confidence.confidenceLevel !== 'reliable';
  
  let statusColor = elegible ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
  let statusLabel = elegible ? '✅ ELEGIBLE' : score >= 40 ? '🟡 PARCIAL' : '🔴 NO ELEGIBLE';
  
  if (confidence?.confidenceLevel === 'blocked' || confidence?.confidenceLevel === 'indicative') {
    statusLabel = '🔴 PROVISIONAL';
    statusColor = 'var(--red)';
  }

  const circ = 2 * Math.PI * 15.9;
  const dash = `${(score / 100) * circ} ${circ}`;

  return `<div class="card">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
      <span style="font-size:2rem;">${icon}</span>
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;">${nombre}</div>
          ${isLowConf ? `<span style="font-size:0.6rem; padding:2px 6px; border-radius:4px; background:rgba(245,158,11,0.1); color:var(--amber); border:1px solid rgba(245,158,11,0.3); font-weight:700; letter-spacing:0.02em;">${confidence.confidenceLevel === 'blocked' ? 'PROVISIONAL' : 'CONDICIONADO'}</span>` : ''}
        </div>
        <div style="font-size:0.77rem;color:var(--text-muted);margin-top:3px;">${desc}</div>
      </div>
      <div style="text-align:center;flex-shrink:0;">
        <div style="position:relative;width:72px;height:72px;">
          <svg viewBox="0 0 36 36" style="width:72px;height:72px;transform:rotate(-90deg);">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="${statusColor}" stroke-width="3"
              stroke-dasharray="${dash}" stroke-linecap="round" style="transition:stroke-dasharray 0.6s ease;"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <span style="font-family:var(--font-display);font-size:1.15rem;font-weight:800;color:${statusColor};">${score}</span>
          </div>
        </div>
        <div style="font-size:0.7rem;font-weight:700;color:${statusColor};margin-top:4px;">${statusLabel}</div>
      </div>
    </div>
    <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:20px;overflow:hidden;">
      <div style="height:100%;width:${score}%;background:${statusColor};border-radius:2px;transition:width 0.6s ease;"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
      ${criterios.map(c => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:var(--radius-sm);
          background:${c.ok ? color + '11' : 'rgba(255,255,255,0.02)'};
          border:1px solid ${c.ok ? color + '44' : 'var(--border)'};">
          <span style="font-size:1rem;flex-shrink:0;">${c.ok ? '✅' : c.critico ? '⛔' : '⚠️'}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.84rem;font-weight:600;color:${c.ok ? 'var(--text-primary)' : 'var(--text-secondary)'};">
              ${c.label}
              ${c.critico ? '<span style="font-size:0.64rem;color:var(--red);margin-left:6px;padding:1px 5px;border:1px solid var(--red);border-radius:6px;">CRÍTICO</span>' : ''}
            </div>
            <div style="font-size:0.74rem;color:var(--text-muted);margin-top:2px;">${c.detalle}</div>
          </div>
          <div style="font-size:0.8rem;font-weight:700;color:${c.ok ? color : 'var(--text-muted)'};white-space:nowrap;">${c.valor}</div>
        </div>`).join('')}
    </div>
    ${alertas.length > 0 ? `
      <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:var(--radius-sm);padding:12px;">
        <div style="font-size:0.8rem;font-weight:700;color:var(--amber);margin-bottom:8px;">Acciones para mejorar la elegibilidad</div>
        ${alertas.map(a => `<div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:4px;">${a}</div>`).join('')}
      </div>` :
    `<div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:var(--radius-sm);padding:12px;text-align:center;">
        <span style="font-size:0.85rem;color:var(--green);">🎯 Todos los criterios cumplen los umbrales mínimos</span>
      </div>`}
  </div>`;
}
