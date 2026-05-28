/**
 * analyzer.js — Motor de Análisis Financiero Genérico
 *
 * Toma un ParsedLedger y produce:
 *   totales    → cifras agregadas del periodo completo
 *   byMonth    → PyG analítica mensual
 *   balance    → Balance simplificado estimado
 *   kpis       → KPIs universales + KPIs del perfil seleccionado
 */

// Clasificación de categorías analíticas posibles
const CATEGORIAS_ANALITICAS = {
  ingresos_ventas: 'Ventas / Prestación de servicios',
  ingresos_otros: 'Otros ingresos',
  cogs: 'Coste de Ventas (COGS)',
  personal: 'Personal (Sueldos y SS)',
  servicios: 'Servicios Generales / Operativos',
  marketing: 'Marketing y publicidad',
  amortizacion: 'Amortización',
  gastos_financieros: 'Gastos financieros',
  tributos: 'Tributos e impuestos',
  ignorar: 'Ignorar / No imputable a PyG'
};

// Cuentas de tesorería y balance
const CUENTAS_TESORERIA = ['57','572','570','571'];
const CUENTAS_DEUDORES  = ['43','430','431'];
const CUENTAS_ACREEDORES= ['40','400','401'];
const CUENTAS_DEUDA_LP  = ['17','170','171','172'];
const CUENTAS_PN        = ['10','11','12','13','14'];

function matchesCuenta(cuenta, grupo) {
  return cuenta.startsWith(grupo);
}

function saldoCuenta(entries, prefijos) {
  // Saldo = Debe - Haber (para cuentas de activo) o Haber - Debe (pasivo)
  const filtered = entries.filter(e => prefijos.some(p => e.cuenta.startsWith(p)));
  const debe  = filtered.reduce((s, e) => s + e.debe, 0);
  const haber = filtered.reduce((s, e) => s + e.haber, 0);
  return { debe, haber, saldo: debe - haber };
}

/**
 * getDefaultMapping(cuentasUnicas, profileId)
 * Genera el mapeo automático basándose en el PGC.
 * Devuelve un objeto: { "7000001": "ingresos_ventas", ... }
 */
/**
 * getSaaSHeuristic(cuenta, descripcion, profileId)
 * Retorna { suggestedCategory, reason, confidence } o null si no hay heurística aplicable.
 */
function getSaaSHeuristic(cuenta, descripcion, profileId) {
  const descLower = (descripcion || '').toLowerCase();
  
  // 1. COGS: Cloud Infrastructure (AWS, Google Cloud, Azure, etc.)
  const cloudKeywords = [
    'aws', 'amazon web services', 'google cloud', 'gcp', 'microsoft azure', 'azure', 
    'cloud', 'hosting', 'digital ocean', 'digitalocean', 'linode', 'ovh', 'cloudflare', 'heroku'
  ];
  if (cloudKeywords.some(kw => descLower.includes(kw))) {
    return {
      suggestedCategory: 'cogs',
      reason: 'Infraestructura cloud / Hosting (COGS en SaaS)',
      confidence: 'high'
    };
  }

  // 2. COGS: Payment Gateways (Stripe, PayPal, Adyen, Braintree, Redsys, TPV)
  const paymentKeywords = [
    'stripe', 'paypal', 'adyen', 'braintree', 'redsys', 'tpv', 'comision tarjeta', 'comisiones tarjeta'
  ];
  if (paymentKeywords.some(kw => descLower.includes(kw))) {
    return {
      suggestedCategory: 'cogs',
      reason: 'Pasarela de pago / Comisión de transacciones (COGS)',
      confidence: 'high'
    };
  }

  // 3. Marketing: Google Ads, FB Ads, etc.
  const marketingKeywords = [
    'google ads', 'google adwords', 'facebook ads', 'meta ads', 'instagram ads', 
    'linkedin ads', 'linkedin advertising', 'twitter ads', 'x ads', 'tiktok ads', 'adsense'
  ];
  if (marketingKeywords.some(kw => descLower.includes(kw))) {
    return {
      suggestedCategory: 'marketing',
      reason: 'Inversión publicitaria directa (Marketing)',
      confidence: 'high'
    };
  }

  // 4. Freelance Development / Desarrollo técnico (Medium confidence)
  const freelanceKeywords = [
    'freelance', 'autonomo', 'desarrollo', 'programador', 'software developer', 
    'consultoria it', 'desarrollador', 'developer', 'sistemas'
  ];
  if (freelanceKeywords.some(kw => descLower.includes(kw))) {
    return {
      suggestedCategory: 'cogs',
      reason: 'Servicio freelance de desarrollo técnico (posible COGS)',
      confidence: 'medium'
    };
  }

  return null;
}

/**
 * getDefaultMapping(cuentasUnicas, profileId, descripcionesMap)
 * Genera el mapeo automático basándose en el PGC y heurísticas de alta confianza.
 * Devuelve un objeto: { "7000001": "ingresos_ventas", ... }
 */
function getDefaultMapping(cuentasUnicas, profileId, descripcionesMap = null) {
  const map = {};
  for (const cta of cuentasUnicas) {
    const desc = descripcionesMap ? descripcionesMap[cta] : '';
    const heuristic = getSaaSHeuristic(cta, desc, profileId);
    
    if (heuristic && heuristic.confidence === 'high') {
      map[cta] = heuristic.suggestedCategory;
      continue;
    }

    if (cta.startsWith('70') || cta.startsWith('71') || cta.startsWith('72') || cta.startsWith('73') || cta.startsWith('74') || cta.startsWith('75')) {
      map[cta] = 'ingresos_ventas';
    } else if (cta.startsWith('76') || cta.startsWith('77') || cta.startsWith('79')) {
      map[cta] = 'ingresos_otros';
    } else if (cta.startsWith('60') || cta.startsWith('61')) {
      map[cta] = 'cogs';
    } else if (cta.startsWith('64')) {
      map[cta] = 'personal';
    } else if (cta.startsWith('627')) {
      map[cta] = 'marketing';
    } else if (cta.startsWith('62')) {
      // Regla SaaS: AWS, Pasarelas a COGS
      if (profileId === 'saas' && (cta.startsWith('626') || cta.startsWith('628') || cta.startsWith('629'))) {
        map[cta] = 'cogs';
      } else {
        map[cta] = 'servicios';
      }
    } else if (cta.startsWith('63')) {
      map[cta] = 'tributos';
    } else if (cta.startsWith('65')) {
      map[cta] = 'servicios';
    } else if (cta.startsWith('66')) {
      map[cta] = 'gastos_financieros';
    } else if (cta.startsWith('68')) {
      map[cta] = 'amortizacion';
    } else if (cta.startsWith('6') || cta.startsWith('7')) {
      map[cta] = 'ignorar'; // Por defecto si no encaja
    }
  }
  return map;
}

function sumByCategory(entries, categoryMap, targetCategory, isIngreso = false) {
  // Ingresos suman Haber - Debe. Gastos suman Debe - Haber.
  return entries.reduce((sum, e) => {
    if (categoryMap[e.cuenta] === targetCategory) {
      return sum + (isIngreso ? (e.haber - e.debe) : (e.debe - e.haber));
    }
    return sum;
  }, 0);
}

// ---- Motor de Devengo (Accrual Engine) ----
/**
 * detectAccrualCandidates(entries, categoryMap, months)
 * Busca cuentas de gasto operativo donde haya un único apunte que represente 
 * más del 80% del gasto anual de esa cuenta y supere un umbral.
 */
function detectAccrualCandidates(entries, categoryMap, months) {
  const candidates = [];
  const validCategories = ['servicios', 'marketing', 'cogs'];
  const nMeses = Math.max(months.length, 1);
  if (nMeses <= 1) return []; // No tiene sentido periodificar si solo hay 1 mes

  // Agrupar gastos por cuenta
  const gastosPorCuenta = {};
  for (const e of entries) {
    const cat = categoryMap[e.cuenta];
    if (validCategories.includes(cat) && e.debe > 0) {
      if (!gastosPorCuenta[e.cuenta]) gastosPorCuenta[e.cuenta] = { total: 0, apunteMayor: null };
      gastosPorCuenta[e.cuenta].total += e.debe;
      if (!gastosPorCuenta[e.cuenta].apunteMayor || e.debe > gastosPorCuenta[e.cuenta].apunteMayor.debe) {
        gastosPorCuenta[e.cuenta].apunteMayor = e;
      }
    }
  }

  for (const [cta, data] of Object.entries(gastosPorCuenta)) {
    if (data.total > 1500) { // Umbral mínimo para no molestar con recibos pequeños
      const pico = data.apunteMayor;
      if (pico.debe / data.total > 0.8) { // El pico es más del 80% del gasto de esa cuenta
        candidates.push({
          cuenta: cta,
          descripcion: pico.descripcion || 'Gasto no descrito',
          mesOrigen: pico.monthKey,
          importeTotal: pico.debe,
          mesesARepartir: nMeses,
          importeMensual: pico.debe / nMeses
        });
      }
    }
  }
  return candidates;
}

/**
 * applyAccruals(byMonth, approvedAccruals, months)
 * Aplica los devengos creando un byMonth clonado con ajustes virtuales.
 */
function applyAccruals(byMonth, approvedAccruals, months) {
  if (!approvedAccruals || approvedAccruals.length === 0) return byMonth;

  // Clonar la estructura byMonth para no mutar el original de forma destructiva
  const devengadoByMonth = {};
  for (const mk of months) {
    devengadoByMonth[mk] = byMonth[mk] ? [...byMonth[mk]] : [];
  }

  for (const acc of approvedAccruals) {
    // 1. Quitar el gasto del mes origen
    const mesOriginal = devengadoByMonth[acc.mesOrigen];
    if (mesOriginal) {
      mesOriginal.push({
        cuenta: acc.cuenta,
        grupo: acc.cuenta.charAt(0),
        descripcion: `[Ajuste Devengo] Extracción de ${acc.descripcion}`,
        debe: 0,
        haber: acc.importeTotal // Un abono (haber) contrarresta el gasto (debe) original
      });
    }

    // 2. Repartir el gasto entre todos los meses
    for (const mk of months) {
      if (!devengadoByMonth[mk]) devengadoByMonth[mk] = [];
      devengadoByMonth[mk].push({
        cuenta: acc.cuenta,
        grupo: acc.cuenta.charAt(0),
        descripcion: `[Ajuste Devengo] Prorrateo de ${acc.descripcion}`,
        debe: acc.importeMensual,
        haber: 0
      });
    }
  }

  return devengadoByMonth;
}

// ---- PyG mensual ----
function buildPyGMensual(byMonth, categoryMap) {
  const months = Object.keys(byMonth).sort();
  const rows = {};

  for (const mk of months) {
    const entries = byMonth[mk];

    const ventas       = sumByCategory(entries, categoryMap, 'ingresos_ventas', true);
    const otrosIng     = sumByCategory(entries, categoryMap, 'ingresos_otros', true);
    const totalIngresos = ventas + otrosIng;

    const cogs         = sumByCategory(entries, categoryMap, 'cogs', false);
    const margenBruto  = totalIngresos - cogs;
    
    const personal     = sumByCategory(entries, categoryMap, 'personal', false);
    const marketing    = sumByCategory(entries, categoryMap, 'marketing', false);
    const serviciosOp  = sumByCategory(entries, categoryMap, 'servicios', false);
    const tributos     = sumByCategory(entries, categoryMap, 'tributos', false);
    const amortizacion = sumByCategory(entries, categoryMap, 'amortizacion', false);
    const gastosFinancieros = sumByCategory(entries, categoryMap, 'gastos_financieros', false);

    const totalGastos  = cogs + personal + marketing + serviciosOp + tributos + amortizacion + gastosFinancieros;
    const ebitda       = totalIngresos - cogs - personal - marketing - serviciosOp - tributos;
    const ebit         = ebitda - amortizacion;
    const resultadoNeto = ebit - gastosFinancieros;

    // Caja de tesorería
    const caja = saldoCuenta(entries, CUENTAS_TESORERIA);

    rows[mk] = {
      ventas,
      otrosIngresos: otrosIng,
      totalIngresos,
      cogs,
      margenBruto,
      personal,
      marketing,
      serviciosOperativos: serviciosOp,
      tributos,
      ebitda,
      amortizacion,
      ebit,
      gastosFinancieros,
      resultadoNeto,
      cajaSaldo: caja.debe - caja.haber // tesorería: activo, saldo deudor
    };
  }

  return rows;
}

// ---- Balance simplificado ----
function buildBalanceEstimado(entries) {
  const tesoreria   = saldoCuenta(entries, CUENTAS_TESORERIA);
  const clientes    = saldoCuenta(entries, CUENTAS_DEUDORES);
  const proveedores = saldoCuenta(entries, CUENTAS_ACREEDORES);
  const deudaLP     = saldoCuenta(entries, CUENTAS_DEUDA_LP);
  const pn          = saldoCuenta(entries, CUENTAS_PN);
  const inmovilizado = saldoCuenta(entries, ['20','21','22','23']);

  const cajaFinal = Math.max(0, tesoreria.debe - tesoreria.haber);
  const activoCorriente = cajaFinal + Math.max(0, clientes.debe - clientes.haber);
  const activoNoCorriente = Math.max(0, inmovilizado.debe - inmovilizado.haber);
  const pasivoCorriente = Math.max(0, proveedores.haber - proveedores.debe);
  const pasivoNoCorriente = Math.max(0, deudaLP.haber - deudaLP.debe);
  const pasivoTotal = pasivoCorriente + pasivoNoCorriente;
  const patrimonioNeto = Math.max(1, pn.haber - pn.debe); // evitar div/0

  return {
    cajaFinal,
    activoCorriente,
    activoNoCorriente,
    activoTotal: activoCorriente + activoNoCorriente,
    pasivoCorriente,
    pasivoNoCorriente,
    pasivoTotal,
    patrimonioNeto
  };
}

// ---- Detección Analítica de Anomalías (CFO Analytical Engine - Arquitectura Declarativa) ----
const ANOMALY_RULES = [
  {
    id: 'cifras_redondas',
    severity: 'medium',
    label: 'Alta concentración de cifras redondas',
    check: (entries, pygMensual, categoryMap) => {
      const roundEntries = entries.filter(e => 
        (e.debe > 0 && e.debe % 500 === 0) || 
        (e.haber > 0 && e.haber % 500 === 0)
      );
      if (entries.length > 0 && (roundEntries.length / entries.length > 0.15)) {
        return [{
          severity: 'medium', message: 'Alta concentración de cifras redondas',
          detail: `${roundEntries.length} asientos (${((roundEntries.length/entries.length)*100).toFixed(1)}%) son múltiplos exactos de 500€ o 1.000€`
        }];
      }
      return [];
    }
  },
  {
    id: 'facturas_domingo',
    severity: 'high',
    label: 'Facturas registradas en domingo',
    check: (entries, pygMensual, categoryMap) => {
      const sundayByMonth = {};
      entries.forEach(e => {
        if (!e.fecha) return;
        let d;
        if (e.fecha.includes('/')) {
          const parts = e.fecha.split('/');
          if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          d = new Date(e.fecha);
        }
        if (d && !isNaN(d.getTime()) && d.getDay() === 0) {
          if (!sundayByMonth[e.monthKey]) sundayByMonth[e.monthKey] = [];
          sundayByMonth[e.monthKey].push(e);
        }
      });
      const anomalies = [];
      for (const [m, mEntries] of Object.entries(sundayByMonth)) {
        anomalies.push({
          severity: 'high', message: `${mEntries.length} asiento(s) registrados en domingo en ${m}`,
          detail: mEntries.slice(0,3).map(e => `${e.fecha} · ${e.cuenta} · ${e.debe||e.haber}€`).join(' | '),
          month: m
        });
      }
      return anomalies;
    }
  },
  {
    id: 'duplicados_exactos',
    severity: 'high',
    label: 'Posible registro duplicado',
    check: (entries, pygMensual, categoryMap) => {
      const anomalies = [];
      const seen = new Map();
      entries.forEach(e => {
        if ((e.debe === 0 && e.haber === 0) || !e.fecha) return;
        const key = `${e.fecha}_${e.cuenta}_${e.debe}_${e.haber}_${e.descripcion}`;
        if (seen.has(key)) {
          anomalies.push({ severity: 'high', message: `Posible duplicado detectado en ${e.monthKey}`,
            detail: `Cuenta ${e.cuenta} · ${e.debe||e.haber}€ · Fecha ${e.fecha} · ${e.descripcion}`,
            month: e.monthKey });
        } else { seen.set(key, true); }
      });
      return anomalies;
    }
  },
  {
    id: 'margen_bruto_negativo',
    severity: 'high',
    label: 'Margen bruto negativo',
    check: (entries, pygMensual, categoryMap) => {
      const months = Object.keys(pygMensual).sort();
      const negMonths = months.filter(m => pygMensual[m]?.margenBruto < 0);
      if (negMonths.length >= 2) {
        return negMonths.map(m => ({
          severity: 'high',
          message: `Margen bruto negativo en ${m}`,
          detail: `El margen bruto del mes es de ${pygMensual[m].margenBruto.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€`,
          month: m
        }));
      }
      return [];
    }
  },
  {
    id: 'cliente_unico',
    severity: 'high',
    label: 'Concentración de cliente único',
    check: (entries, pygMensual, categoryMap) => {
      const ingresosPorCuenta = {};
      let ingresosTotales = 0;
      entries.forEach(e => {
        if (categoryMap[e.cuenta] === 'ingresos_ventas' || categoryMap[e.cuenta] === 'ingresos_otros') {
          const val = e.haber - e.debe;
          if (val > 0) {
            ingresosPorCuenta[e.cuenta] = (ingresosPorCuenta[e.cuenta] || 0) + val;
            ingresosTotales += val;
          }
        }
      });
      const anomalies = [];
      if (ingresosTotales > 0) {
        for (const [cuenta, monto] of Object.entries(ingresosPorCuenta)) {
          if (monto / ingresosTotales > 0.70) {
            anomalies.push({ severity: 'high', message: 'Riesgo de Concentración de Cliente Único',
              detail: `La cuenta ${cuenta} concentra el ${((monto/ingresosTotales)*100).toFixed(1)}% de los ingresos totales.` });
          }
        }
      }
      return anomalies;
    }
  },
  {
    id: 'cuota_personal_critica',
    severity: 'high',
    label: 'Cuota de personal insostenible',
    check: (entries, pygMensual, categoryMap) => {
      const months = Object.keys(pygMensual).sort();
      let mesesAltaCuotaPersonal = 0;
      for (const mk of months) {
        const m = pygMensual[mk];
        if (m.totalIngresos > 0 && (m.personal / m.totalIngresos) > 0.8) {
          mesesAltaCuotaPersonal++;
        }
      }
      if (mesesAltaCuotaPersonal >= 3) {
        return [{
          severity: 'high', message: 'Escala insostenible: Cuota de personal crítica',
          detail: `Durante ${mesesAltaCuotaPersonal} meses el coste de personal superó el 80% de los ingresos.`
        }];
      }
      return [];
    }
  },
  {
    id: 'asiento_descuadrado',
    severity: 'critical',
    label: 'Asientos desbalanceados',
    check: (entries, pygMensual, categoryMap) => {
      const seatsMap = {};
      entries.forEach(e => {
        if (!e.asiento) return;
        if (!seatsMap[e.asiento]) seatsMap[e.asiento] = { debe: 0, haber: 0, month: e.monthKey };
        seatsMap[e.asiento].debe += e.debe || 0;
        seatsMap[e.asiento].haber += e.haber || 0;
      });
      const descuadresByMonth = {};
      for (const [asiento, sumas] of Object.entries(seatsMap)) {
        if (Math.abs(sumas.debe - sumas.haber) > 0.02) {
          const m = sumas.month || 'global';
          if (!descuadresByMonth[m]) descuadresByMonth[m] = [];
          descuadresByMonth[m].push(asiento);
        }
      }
      const anomalies = [];
      for (const [m, asientos] of Object.entries(descuadresByMonth)) {
        anomalies.push({
          severity: 'critical',
          message: `Asientos desbalanceados en ${m}`,
          detail: `${asientos.length} asiento(s) no cuadran (Debe != Haber) en este mes (Asientos: ${asientos.slice(0, 5).join(', ')}). Invalida el libro mayor.`,
          month: m
        });
      }
      return anomalies;
    }
  },
  {
    id: 'prestamos_socios',
    severity: 'high',
    label: 'Riesgo Fiscal: Cuenta 551 Deudora',
    check: (entries, pygMensual, categoryMap) => {
      // CFO ANALYTICAL NOTE: Se consolidan las cuentas 551 (Cuenta corriente con socios y administradores)
      // y 550 (Titular de la explotación). La 550 es típica de empresarios individuales / autónomos,
      // pero en startups en fases tempranas es común encontrarla de forma transitoria o errónea
      // antes de constituir formalmente la SL, considerándose admisible su análisis conjunto aquí.
      // ADVERTENCIA DE AGREGACIÓN: Se evalúa el saldo neto agregado. Esto puede ocultar compensaciones cruzadas
      // (ej. Socio A deudor de 5.000€ y Socio B acreedor de 5.000€, resultando en saldo neto 0€),
      // por lo que se advierte al CFO de la necesidad de auditar subcuentas individualizadas.
      const cta551 = saldoCuenta(entries, ['551', '550']);
      const saldoNeto = cta551.debe - cta551.haber; // Saldo deudor (activo)

      if (saldoNeto > 3000) {
        return [{
          severity: 'high',
          message: 'Riesgo Fiscal: Cuenta 551 Deudora (Socio Deudor)',
          detail: `Se detecta un saldo deudor neto final de ${saldoNeto.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ en la cuenta corriente con socios (cta. 551/550). La AEAT mantiene un criterio de inspección riguroso sobre estos saldos deudores persistentes, pudiendo recalificarlos como distribuciones de dividendos encubiertas o préstamos no declarados, con la consecuente liquidación de retenciones a cuenta de IRPF (hasta el 28%) y sanciones del 50%-150% a la empresa. Nota: Al evaluar el saldo neto agregado de la cuenta 551/550, este análisis podría enmascarar compensaciones internas entre diferentes socios si no existen subcuentas debidamente individualizadas. Se aconseja formalizar un contrato de préstamo a tipo de interés legal o reintegrar el capital antes del cierre fiscal.`
        }];
      }
      return [];
    }
  },
  {
    id: 'cuenta_551_acreedora',
    severity: 'high',
    label: 'Riesgo Fiscal: Cuenta 551 Acreedora',
    check: (entries, pygMensual, categoryMap) => {
      // CFO ANALYTICAL NOTE: Se consolidan las cuentas 551 y 550.
      // ADVERTENCIA DE AGREGACIÓN: Se evalúa el saldo neto agregado de la 551/550, pudiendo ocultar
      // compensaciones cruzadas entre socios.
      const cta551 = saldoCuenta(entries, ['551', '550']);
      const saldoNeto = cta551.haber - cta551.debe; // Saldo acreedor (pasivo)

      if (saldoNeto > 3000) {
        const interesLegal = saldoNeto * 0.0325; // Interés legal aproximado 2025/2026 (3,25%)
        const retencionEstimada = interesLegal * 0.19; // Retención a cuenta del 19% (Modelo 123)
        return [{
          severity: 'high',
          message: 'Operaciones Vinculadas: Cuenta 551 Acreedora (Socio Acreedor)',
          detail: `Existe un saldo acreedor neto final de ${saldoNeto.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ en la cuenta de relaciones con socios (cta. 551/550). A efectos fiscales, esta aportación transitoria de fondos se presume como un préstamo vinculado. Esto exige formalizar contrato de préstamo mercantil y el devengo de intereses al tipo legal del dinero (3,25% en 2026). A modo de estimación orientativa y como referencia operativa para el CFO, esto implicaría un devengo aproximado de ~${interesLegal.toLocaleString('es-ES', {maximumFractionDigits: 0})}€/año de intereses, sujeto a una retención teórica del 19% liquidable en el Modelo 123 (~${retencionEstimada.toLocaleString('es-ES', {maximumFractionDigits: 0})}€/año). Nota: Al evaluar el saldo neto agregado de la cuenta 551/550, este análisis podría enmascarar compensaciones internas entre diferentes socios si no existen subcuentas debidamente individualizadas. Superar un saldo de 250.000€ obliga adicionalmente a su declaración informativa en el Modelo 232.`
        }];
      }
      return [];
    }
  },
  {
    id: 'deuda_publica_alta',
    severity: 'high',
    label: 'Deuda pública elevada (Grupo 47)',
    check: (entries, pygMensual, categoryMap) => {
      const saldo = saldoCuenta(entries, ['475', '476']);
      const pasivoPublico = saldo.haber - saldo.debe;
      if (pasivoPublico > 20000) {
        return [{
          severity: 'high', message: 'Deuda pública elevada o aplazamientos',
          detail: `Saldo acreedor superior a 20k€ en Hacienda/Seg. Social.`
        }];
      }
      return [];
    }
  },
  {
    id: 'bankability_scaleup',
    severity: 'high',
    label: 'Fase Scaleup: Optimización de Stack Financiero',
    check: (entries, pygMensual, categoryMap) => {
      const totalIngresos = Object.values(pygMensual).reduce((acc, m) => acc + m.totalIngresos, 0);
      const meses = Object.keys(pygMensual).length || 1;
      const ingresosAnualizados = (totalIngresos / meses) * 12;

      if (ingresosAnualizados > 500000) {
        return [{
          severity: 'high', message: 'Fase Scaleup: Oportunidad de Bankability',
          detail: `Facturación anualizada >500k€. Estructura financiera avanzada sugerida.`
        }];
      }
      return [];
    }
  },
  {
    id: 'descuadre_contable',
    severity: 'critical',
    label: 'Descuadre contable mensual (Debe != Haber)',
    check: (entries, pygMensual, categoryMap) => {
      const anomalies = [];
      const months = Object.keys(pygMensual).sort();
      for (const m of months) {
        const monthEntries = entries.filter(e => e.monthKey === m);
        const debeTotal = monthEntries.reduce((sum, e) => sum + (e.debe || 0), 0);
        const haberTotal = monthEntries.reduce((sum, e) => sum + (e.haber || 0), 0);
        const diff = Math.abs(debeTotal - haberTotal);
        if (diff > 0.02) {
          anomalies.push({
            severity: 'critical',
            message: `Descuadre contable en el mes ${m}`,
            detail: `La suma mensual de apuntes al Debe (${debeTotal.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€) no coincide con el Haber (${haberTotal.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€). Diferencia de ${diff.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€.`,
            month: m
          });
        }
      }
      return anomalies;
    }
  },
  {
    id: 'meses_sin_amortizacion',
    severity: 'medium',
    label: 'Ausencia de amortizaciones mensuales',
    check: (entries, pygMensual, categoryMap) => {
      const inmovilizado = saldoCuenta(entries, ['20','21','22','23']);
      const inmovilizadoNeto = inmovilizado.debe - inmovilizado.haber;
      if (inmovilizadoNeto <= 0) return [];
      const months = Object.keys(pygMensual).sort();
      const monthsSinAmort = [];
      for (const m of months) {
        const amort = pygMensual[m]?.amortizacion || 0;
        if (amort === 0) {
          monthsSinAmort.push(m);
        }
      }
      if (monthsSinAmort.length > 0) {
        return monthsSinAmort.map(m => ({
          severity: 'medium',
          message: `Ausencia de amortización en ${m}`,
          detail: `Existen activos de inmovilizado valorados en ${inmovilizadoNeto.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€, pero no se ha registrado gasto de amortización en este mes. Distorsiona el EBITDA y el resultado mensual.`,
          month: m
        }));
      }
      return [];
    }
  },
  {
    id: 'variacion_brusca_ingresos',
    severity: 'high',
    label: 'Variación brusca de ingresos mensuales',
    check: (entries, pygMensual, categoryMap) => {
      const anomalies = [];
      const months = Object.keys(pygMensual).sort();
      if (months.length < 2) return [];
      for (let i = 1; i < months.length; i++) {
        const mPrev = months[i - 1];
        const mCurr = months[i];
        const ingPrev = pygMensual[mPrev]?.totalIngresos || 0;
        const ingCurr = pygMensual[mCurr]?.totalIngresos || 0;
        const absDiff = ingCurr - ingPrev;
        const absDiffVal = Math.abs(absDiff);
        if (absDiffVal > 3000) {
          const pctChange = ingPrev > 0 ? (absDiff / ingPrev) * 100 : (ingCurr > 0 ? 100 : 0);
          if (Math.abs(pctChange) > 40) {
            const group7Prev = {};
            const group7Curr = {};
            const entriesPrev = entries.filter(e => e.monthKey === mPrev && e.grupo === '7');
            const entriesCurr = entries.filter(e => e.monthKey === mCurr && e.grupo === '7');
            entriesPrev.forEach(e => {
              group7Prev[e.cuenta] = (group7Prev[e.cuenta] || 0) + (e.haber - e.debe);
            });
            entriesCurr.forEach(e => {
              group7Curr[e.cuenta] = (group7Curr[e.cuenta] || 0) + (e.haber - e.debe);
            });
            const allSubAccounts = new Set([...Object.keys(group7Prev), ...Object.keys(group7Curr)]);
            let maxContribCta = '—';
            let maxContribVal = -1;
            for (const cta of allSubAccounts) {
              const prevVal = group7Prev[cta] || 0;
              const currVal = group7Curr[cta] || 0;
              const diffCta = Math.abs(currVal - prevVal);
              if (diffCta > maxContribVal) {
                maxContribVal = diffCta;
                maxContribCta = cta;
              }
            }
            const ccurrVal = group7Curr[maxContribCta] || 0;
            const weightPct = ingCurr > 0 ? (ccurrVal / ingCurr) * 100 : 0;
            const direction = absDiff > 0 ? 'incremento' : 'descenso';
            anomalies.push({
              severity: 'high',
              message: `Variación brusca de ingresos (${mPrev} → ${mCurr})`,
              detail: `Se detectó un ${direction} de ingresos de ${pctChange.toFixed(1)}% (${absDiffVal.toLocaleString('es-ES', {maximumFractionDigits:0})}€ de diferencia absoluta). La subcuenta que más contribuyó al cambio fue la ${maxContribCta} con una variación de ${maxContribVal.toLocaleString('es-ES', {maximumFractionDigits:0})}€ y un peso del ${weightPct.toFixed(1)}% sobre los ingresos de ${mCurr}.`,
              month: mCurr
            });
          }
        }
      }
      return anomalies;
    }
  },
  {
    id: 'cuenta_129_detectada',
    severity: 'high',
    label: 'Uso de la cuenta 129 detectado',
    check: (entries, pygMensual, categoryMap) => {
      const months = Object.keys(pygMensual).sort();
      if (months.length === 0) return [];
      const openingMonth = months[0];
      const closingMonth = months[months.length - 1];
      const entries129 = entries.filter(e => 
        e.cuenta.startsWith('129') && 
        e.monthKey !== openingMonth && 
        e.monthKey !== closingMonth
      );
      if (entries129.length === 0) return [];
      const affectedMonths = [...new Set(entries129.map(e => e.monthKey).filter(Boolean))].sort();
      return affectedMonths.map(m => {
        const mEntries = entries129.filter(e => e.monthKey === m);
        const example = mEntries[0];
        const importe = example.debe > 0 ? example.debe : example.haber;
        const t = example.debe > 0 ? 'D' : 'H';
        return {
          severity: 'high',
          message: `Uso de la cuenta 129 fuera de cierre en ${m}`,
          detail: `Se detectaron ${mEntries.length} apuntes en la cuenta 129 en este mes. [Asiento Ej: #${example.asiento || 's/n'}, ${example.fecha || 'sin fecha'}, cta ${example.cuenta}, ${importe.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}€ (${t}), ${example.descripcion || 'sin concepto'}]`,
          month: m
        };
      });
    }
  },
  {
    id: 'cdti_empresa_en_crisis',
    severity: 'critical',
    label: 'Descalificación CDTI: Empresa en Crisis',
    check: (entries, pygMensual, categoryMap) => {
      const csRes = saldoCuenta(entries, ['10']);
      const peRes = saldoCuenta(entries, ['110']);
      const cs_pe_Saldo = (csRes.haber - csRes.debe) + (peRes.haber - peRes.debe);

      const fpRes = saldoCuenta(entries, ['10', '11', '12']);
      const fpSaldo = fpRes.haber - fpRes.debe;

      if (cs_pe_Saldo > 0 && fpSaldo < (cs_pe_Saldo / 2)) {
        return [{
          severity: 'critical',
          message: 'Descalificación CDTI: Causa de Empresa en Crisis (Reglamento UE 651/2014)',
          detail: `Los Fondos Propios elegibles (${fpSaldo.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€) caen por debajo del 50% de la suma del Capital Social suscrito y Prima de Emisión (${cs_pe_Saldo.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€). Exclusión automática para la concesión de ayudas públicas CDTI de acuerdo con la normativa comunitaria de ayudas de Estado.`
        }];
      }
      return [];
    }
  },
  {
    id: 'causa_disolucion_lsc',
    severity: 'critical',
    label: 'Quiebra Técnica: Causa de Disolución',
    check: (entries, pygMensual, categoryMap) => {
      const csRes = saldoCuenta(entries, ['10']);
      const csSaldo = csRes.haber - csRes.debe;
      
      const balance = buildBalanceEstimado(entries);
      const pnSaldo = balance.patrimonioNeto;

      if (csSaldo > 0 && pnSaldo < (csSaldo / 2)) {
        return [{
          severity: 'critical',
          message: 'Quiebra Técnica: Causa Legal de Disolución (Art. 363.1.e LSC)',
          detail: `El Patrimonio Neto estimado (${pnSaldo.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€) se ha reducido por debajo del 50% del Capital Social (${csSaldo.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€). Obligación legal de convocar Junta General en un plazo máximo de 2 meses para restablecer el equilibrio mediante ampliación de capital, reducción o aportación a la cta 118, bajo responsabilidad personal y solidaria de los administradores.`
        }];
      }
      return [];
    }
  },
  {
    id: 'ebitda_normalizado_enisa',
    severity: 'medium',
    label: 'EBITDA Orgánico vs. Contable (Ajuste ENISA)',
    check: (entries, pygMensual, categoryMap) => {
      const cta730Res = saldoCuenta(entries, ['730']);
      const cta730 = cta730Res.haber - cta730Res.debe;

      const cta746Res = saldoCuenta(entries, ['746']);
      const cta746 = cta746Res.haber - cta746Res.debe;

      if (cta730 > 0.01 || cta746 > 0.01) {
        const ebitdaContable = Object.values(pygMensual).reduce((acc, m) => acc + (m.ebitda || 0), 0);
        const ebitdaNormalizado = ebitdaContable - cta730 - cta746;
        
        let details = [];
        if (cta730 > 0.01) details.push(`-${cta730.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ de activación de desarrolladores (cta. 730)`);
        if (cta746 > 0.01) details.push(`-${cta746.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ de subvenciones imputadas a PyG (cta. 746)`);

        return [{
          severity: 'medium',
          message: 'EBITDA Normalizado para ENISA',
          detail: `EBITDA contable: ${ebitdaContable.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€. EBITDA normalizado: ${ebitdaNormalizado.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}€ (restando ${details.join(' y ')}). ENISA evalúa la viabilidad sobre este EBITDA orgánico purgado de activaciones contables y transferencias de subvenciones.`
        }];
      }
      return [];
    }
  }
];

function runAnomalyEngine(entries, pygMensual, categoryMap) {
  let allAnomalies = [];
  ANOMALY_RULES.forEach(rule => {
    try {
      const results = rule.check(entries, pygMensual, categoryMap);
      if (results && results.length > 0) {
        // Inyectamos el ID de la regla en el hallazgo para trazabilidad técnica (Fase 5 Hardening)
        allAnomalies.push(...results.map(r => ({ ...r, id: rule.id })));
      }
    } catch (e) {
      console.warn(`Error ejecutando regla de anomalía: ${rule.id}`, e);
    }
  });
  return allAnomalies;
}

// ---- Confidence Engine (centralizado — ningún consumidor debe recalcular) ----
const CONFIDENCE_LEVELS = {
  reliable:     { min: 80, label: 'Análisis fiable',              forecastMode: 'normal',       scoringPenalty: 0  },
  reservations: { min: 60, label: 'Utilizable con reservas',      forecastMode: 'cautious',     scoringPenalty: 5  },
  indicative:   { min: 40, label: 'Solo orientativo',             forecastMode: 'conservative', scoringPenalty: 15 },
  blocked:      { min: 0,  label: 'Diagnóstico únicamente',      forecastMode: 'simulation',   scoringPenalty: 25 }
};

/**
 * getConfidenceMeta(baseTrustScore, anomalies, ebitdaSuspect, contextChecklist)
 * Punto único de cálculo de confianza. Ningún otro módulo debe recalcular niveles.
 * Combina señales automáticas (anomalías) con señales humanas (contextChecklist).
 * @param {number} baseTrustScore - Score calculado por la máquina (anomalías parser + analyzer)
 * @param {Array} anomalies - Array combinado de anomalías (parser + analyzer)
 * @param {boolean} ebitdaSuspect - true si ≥3 anomalías high/critical
 * @param {Object|null} contextChecklist - Respuestas del checklist humano (null = sin contexto)
 * @param {Array} months - Claves de meses cronológicos analizados
 * @returns {{ trustScore, confidenceLevel, confidenceLabel, forecastMode, scoringPenalty, ebitdaSuspect, analysisLimitations, fundingReadinessFlags, auditReasons }}
 */
function getConfidenceMeta(baseTrustScore, anomalies, ebitdaSuspect, contextChecklist = null, months = []) {
  const analysisLimitations = [];
  const auditReasons = [];

  // Prudencia por periodo contable inferior a un año completo (12 meses)
  if (months && months.length > 0 && months.length < 12) {
    analysisLimitations.push(`El periodo contable analizado es inferior a un año completo (contiene ${months.length} meses).`);
  }

  // ── 1. Delta humano desde contextChecklist ──
  const DISTORTION_DELTAS = {
    extraordinary_ops: { delta: -2, limitation: 'El periodo contiene operaciones extraordinarias que pueden distorsionar la lectura financiera.' },
    high_capex:        { delta: -3, limitation: 'Se informan inversiones puntuales relevantes que distorsionan el periodo.' },
    annual_costs:      { delta: -1, limitation: 'Existen gastos puntuales o anuales identificados que pueden requerir normalización.' },
    financing_event:   { delta: -2, limitation: 'El periodo incluye eventos de financiación que afectan la comparabilidad de caja.' }
  };

  let deltaHuman = 0;

  if (contextChecklist) {
    // A. Cobertura y calidad del libro
    if (contextChecklist.coveragePeriod === 'complete') {
      deltaHuman += 3; auditReasons.push('+3 pts: Periodo completo declarado.');
    } else if (contextChecklist.coveragePeriod === 'missing_months') {
      deltaHuman -= 5; auditReasons.push('-5 pts: Faltan meses en el periodo.');
      analysisLimitations.push('Faltan meses intermedios dentro del rango analizado.');
    } else if (contextChecklist.coveragePeriod === 'unsure') {
      deltaHuman -= 3; auditReasons.push('-3 pts: Cobertura del periodo incierta.');
      analysisLimitations.push('No hay certeza sobre la cobertura completa del periodo.');
    }

    if (contextChecklist.closeStatus === 'final_close') {
      deltaHuman += 4; auditReasons.push('+4 pts: Cierre contable definitivo.');
    } else if (contextChecklist.closeStatus === 'preclose') {
      analysisLimitations.push('El análisis se realiza sobre un pre-cierre operativo.');
    } else if (contextChecklist.closeStatus === 'draft') {
      deltaHuman -= 6; auditReasons.push('-6 pts: Libro en estado borrador/sin cierre.');
      analysisLimitations.push('El libro analizado está en estado borrador o sin cierre.');
    }

    if (contextChecklist.externalReview === 'external') {
      deltaHuman += 3; auditReasons.push('+3 pts: Revisado por tercero externo.');
    } else if (contextChecklist.externalReview === 'none') {
      deltaHuman -= 3; auditReasons.push('-3 pts: Sin revisión externa.');
      analysisLimitations.push('No consta revisión externa ni validación independiente.');
    }

    if (contextChecklist.bridgeAccounts === 'none') {
      deltaHuman += 2; auditReasons.push('+2 pts: Sin saldos relevantes en cuentas puente.');
    } else if (contextChecklist.bridgeAccounts === 'moderate') {
      deltaHuman -= 3; auditReasons.push('-3 pts: Saldos moderados en cuentas puente.');
      analysisLimitations.push('Existen saldos moderados en cuentas puente o transitorias.');
    } else if (contextChecklist.bridgeAccounts === 'high') {
      deltaHuman -= 6; auditReasons.push('-6 pts: Saldos elevados en cuentas puente.');
      analysisLimitations.push('Existen saldos elevados en cuentas puente o de descuadre.');
    }

    // B. Riesgos conocidos
    if (contextChecklist.reconciliationIssues === 'none') {
      deltaHuman += 2; auditReasons.push('+2 pts: Sin incidencias de conciliación.');
    } else if (contextChecklist.reconciliationIssues === 'minor') {
      deltaHuman -= 2; auditReasons.push('-2 pts: Incidencias menores de conciliación.');
      analysisLimitations.push('Existen incidencias menores de conciliación bancaria.');
    } else if (contextChecklist.reconciliationIssues === 'high') {
      deltaHuman -= 5; auditReasons.push('-5 pts: Incidencias relevantes de conciliación.');
      analysisLimitations.push('Existen incidencias relevantes de conciliación bancaria.');
    }

    if (contextChecklist.publicDebtRisk === 'controlled') {
      deltaHuman -= 2; auditReasons.push('-2 pts: Aplazamientos controlados con deuda pública.');
      analysisLimitations.push('Existen aplazamientos con deuda pública, aunque controlados.');
    } else if (contextChecklist.publicDebtRisk === 'delicate') {
      deltaHuman -= 5; auditReasons.push('-5 pts: Situación delicada con deuda pública.');
      analysisLimitations.push('Existe una situación delicada con deuda pública.');
    }

    // C. Confianza subjetiva del CFO (0–10)
    if (typeof contextChecklist.cfoConfidence === 'number') {
      const cfoAdj = Math.round(((contextChecklist.cfoConfidence - 5) / 5) * 4);
      deltaHuman += cfoAdj;
      if (cfoAdj !== 0) auditReasons.push(`${cfoAdj > 0 ? '+' : ''}${cfoAdj} pts: Confianza subjetiva CFO (${contextChecklist.cfoConfidence}/10).`);
    }

    // D. Distorsiones (vocabulario cerrado)
    if (Array.isArray(contextChecklist.distortions)) {
      for (const key of contextChecklist.distortions) {
        const rule = DISTORTION_DELTAS[key];
        if (rule) {
          deltaHuman += rule.delta;
          auditReasons.push(`${rule.delta} pts: Distorsión '${key}'.`);
          analysisLimitations.push(rule.limitation);
        }
      }
    }

    // Cap del impacto humano: no puede blanquear un libro malo
    if (deltaHuman > 10) deltaHuman = 10;
    if (deltaHuman < -15) deltaHuman = -15;
    auditReasons.push(`Delta humano final: ${deltaHuman > 0 ? '+' : ''}${deltaHuman} pts (cap -15/+10).`);
  }

  // ── 2. TrustScore final ──
  let trustScore = Math.max(0, Math.min(100, baseTrustScore + deltaHuman));

  // ── 3. Hard caps por anomalías críticas (no blanqueable) ──
  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  if (criticalCount >= 2) {
    trustScore = Math.min(trustScore, 39);
    auditReasons.push(`Hard cap: trustScore ≤ 39 por ${criticalCount} anomalías críticas.`);
    analysisLimitations.push('Existen múltiples anomalías críticas que bloquean una interpretación fiable.');
  }

  if (contextChecklist && contextChecklist.closeStatus === 'draft' && contextChecklist.reconciliationIssues === 'high') {
    trustScore = Math.min(trustScore, 49);
    auditReasons.push('Hard cap: trustScore ≤ 49 por borrador + conciliación deficiente.');
    analysisLimitations.push('El libro está en borrador y presenta incidencias relevantes de conciliación.');
  }

  // ── 4. Determinar nivel de confianza ──
  let confidenceLevel = 'blocked';
  for (const [level, cfg] of Object.entries(CONFIDENCE_LEVELS)) {
    if (trustScore >= cfg.min) { confidenceLevel = level; break; }
  }
  const cfg = CONFIDENCE_LEVELS[confidenceLevel];

  // ── 5. Limitaciones derivadas de anomalías técnicas ──
  const critical = anomalies.filter(a => a.severity === 'critical').length;
  const high = anomalies.filter(a => a.severity === 'high').length;
  const medium = anomalies.filter(a => a.severity === 'medium').length;
  const low = anomalies.filter(a => a.severity === 'low').length;
  if (critical > 0 || high > 0 || medium > 0) {
    const severeText = `Se han detectado ${critical} críticas, ${high} altas y ${medium} medias. Además, existen ${low} incidencias leves de carácter informativo.`;
    analysisLimitations.push(severeText);
  }
  if (ebitdaSuspect) {
    analysisLimitations.push('Las conclusiones de rentabilidad (EBITDA, márgenes) están condicionadas por incidencias relevantes.');
  }
  if (confidenceLevel === 'indicative' || confidenceLevel === 'blocked') {
    analysisLimitations.push('El análisis no es defensable sin revisión manual previa del libro diario.');
  }
  const hasDescuadre = anomalies.some(a => a.id === 'asiento_descuadrado' || a.id === 'descuadre_contable');
  if (hasDescuadre) {
    analysisLimitations.push('Existen descuadres contables que invalidan la integridad aritmética del libro.');
  }

  // ── 6. Funding readiness flags ──
  const fundingReadinessFlags = {
    scoringDefensible:    confidenceLevel !== 'blocked',
    forecastDefensible:   confidenceLevel === 'reliable' || confidenceLevel === 'reservations',
    narrativeConclusive:  confidenceLevel === 'reliable',
    requiresManualReview: confidenceLevel === 'indicative' || confidenceLevel === 'blocked'
  };

  // Overrides directos del checklist sobre flags
  if (contextChecklist) {
    if (contextChecklist.coveragePeriod === 'missing_months') {
      fundingReadinessFlags.forecastDefensible = false;
    }
    if (contextChecklist.bridgeAccounts === 'high') {
      fundingReadinessFlags.scoringDefensible = false;
      fundingReadinessFlags.requiresManualReview = true;
    }
    if (contextChecklist.publicDebtRisk === 'delicate') {
      fundingReadinessFlags.scoringDefensible = false;
      fundingReadinessFlags.narrativeConclusive = false;
      fundingReadinessFlags.requiresManualReview = true;
    }
    if (contextChecklist.reconciliationIssues === 'high') {
      fundingReadinessFlags.forecastDefensible = false;
      fundingReadinessFlags.requiresManualReview = true;
    }
  }
  if (criticalCount >= 2) {
    fundingReadinessFlags.scoringDefensible = false;
    fundingReadinessFlags.forecastDefensible = false;
    fundingReadinessFlags.narrativeConclusive = false;
    fundingReadinessFlags.requiresManualReview = true;
  }

  // Deduplicar limitaciones
  const uniqueLimitations = [...new Set(analysisLimitations.filter(Boolean))];

  // ── 7. Granularidad mensual de confianza ──
  const monthlyConfidence = {};
  if (months && months.length > 0) {
    for (const m of months) {
      let mScore = 100;
      const mAnomalies = [];
      anomalies.forEach(a => {
        const mentionsOtherMonth = months.some(otherM => otherM !== m && 
          ((a.message || '') + ' ' + (a.detail || '')).includes(otherM));
        const isForThisMonth = a.month === m || 
          ((a.message || '') + ' ' + (a.detail || '')).includes(m);
        if (isForThisMonth || (!a.month && !mentionsOtherMonth)) {
          mAnomalies.push(a);
          if (a.severity === 'critical') mScore -= 30;
          else if (a.severity === 'high') mScore -= 15;
          else if (a.severity === 'medium') mScore -= 5;
          else if (a.severity === 'low') mScore -= 2;
        }
      });
      const hasMDescuadre = mAnomalies.some(a => a.id === 'asiento_descuadrado' || a.id === 'descuadre_contable');
      if (hasMDescuadre) mScore -= 20;
      if (deltaHuman !== 0) {
        mScore += deltaHuman;
      }
      mScore = Math.max(0, Math.min(100, Math.floor(mScore)));
      monthlyConfidence[m] = {
        trustScore: mScore,
        anomalies: mAnomalies
      };
    }
  }

  return {
    trustScore,
    confidenceLevel,
    confidenceLabel: cfg.label,
    forecastMode: cfg.forecastMode,
    scoringPenalty: cfg.scoringPenalty,
    ebitdaSuspect,
    analysisLimitations: uniqueLimitations,
    fundingReadinessFlags,
    auditReasons,  // Opcional — trazabilidad interna del ajuste humano
    byMonth: monthlyConfidence
  };
}

// ---- Análisis completo ----
/**
 * analyzeLedger(parsedLedger, profileId, customMapping, approvedAccruals, contextChecklist) → AnalysisResult
 * @param {Object|null} contextChecklist - Señales humanas de calidad contable (null = neutro)
 */
function analyzeLedger(parsedLedger, profileId, customMapping = null, approvedAccruals = [], contextChecklist = null, options = {}) {
  const { entries, byMonth } = parsedLedger;
  const months = Object.keys(byMonth).sort();
  const nMeses = Math.max(months.length, 1);

  // Mapeo analítico
  const uniqueAccounts = new Set(entries.map(e => e.cuenta));
  const descripcionesMap = {};
  for (const e of entries) {
    if (!descripcionesMap[e.cuenta]) {
      descripcionesMap[e.cuenta] = e.descripcion || '';
    }
  }
  const categoryMap = customMapping || getDefaultMapping(uniqueAccounts, profileId, descripcionesMap);

  // Aplicar devengos si los hay
  const byMonthDevengado = applyAccruals(byMonth, approvedAccruals, months);

  // PyG mensual (usamos el byMonthDevengado)
  const pygMensual = buildPyGMensual(byMonthDevengado, categoryMap);

  // Detección de Anomalías Analíticas (CFO Analytical Engine)
  // INMUTABILIDAD: NO mutamos parsedLedger.anomalies. Combinamos en array nuevo.
  const analyzerAnomalies = options.skipAnomalies ? [] : runAnomalyEngine(entries, pygMensual, categoryMap);
  // Nueva lógica de deduplicación contextual (Fase 7)
  const getAnomalyContextKey = (a) => {
    const context = a.month || a.cuenta || (a.detail ? a.detail.substring(0, 35).trim() : 'global');
    return `${a.id}_${context}`;
  };

  // Generar claves de las anomalías del parser
  const parserKeys = new Set(parsedLedger.anomalies.map(getAnomalyContextKey));

  // Filtrar las del analyzer que no estén ya en el parser con el mismo contexto contable
  const deduplicatedNew = analyzerAnomalies.filter(na => !parserKeys.has(getAnomalyContextKey(na)));
  const allAnomalies = [...parsedLedger.anomalies, ...deduplicatedNew];

  // Verificar si hay demasiadas anomalías graves para marcar el EBITDA como sospechoso
  const highOrCriticalCount = allAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length;
  const ebitdaSuspect = highOrCriticalCount >= 3;
  
  if (ebitdaSuspect) {
    // Si ya existe una anomalía de EBITDA Sospechoso por reglas previas, no la duplicamos
    if (!allAnomalies.some(a => a.id === 'ebitda_suspect')) {
      allAnomalies.push({
        id: 'ebitda_suspect',
        severity: 'high',
        message: 'Integridad del EBITDA comprometida',
        detail: 'El elevado número de anomalías graves detectadas resta fiabilidad a la métrica de EBITDA.'
      });
    }
  }

  // Totales del periodo
  const totalIngresos = Object.values(pygMensual).reduce((s, m) => s + m.totalIngresos, 0);
  const totalGastos   = Object.values(pygMensual).reduce((s, m) =>
    s + m.cogs + m.personal + m.marketing + m.serviciosOperativos + m.tributos + m.amortizacion + m.gastosFinancieros, 0);
  const totalEbitda   = Object.values(pygMensual).reduce((s, m) => s + m.ebitda, 0);
  const totalResultado = Object.values(pygMensual).reduce((s, m) => s + m.resultadoNeto, 0);
  const totalCogs     = Object.values(pygMensual).reduce((s, m) => s + m.cogs, 0);

  // Caja final (último mes conocido)
  const lastMk = months[months.length - 1];
  const tesoreria = saldoCuenta(entries, CUENTAS_TESORERIA);
  // Para tesorería de activo: saldo neto = Debe - Haber
  const cajaFinal = Math.max(0, tesoreria.debe - tesoreria.haber);

  // Burn rate neto promedio mensual
  const burnRateNeto = totalIngresos < totalGastos
    ? (totalGastos - totalIngresos) / nMeses
    : 0;

  // Gastos por grupo PGC (para KPIs industriales)
  const gastosPorGrupo = {};
  for (const entry of entries) {
    if (categoryMap[entry.cuenta] === 'ignorar' || entry.cuenta.startsWith('1') || entry.cuenta.startsWith('2') || entry.cuenta.startsWith('3') || entry.cuenta.startsWith('4') || entry.cuenta.startsWith('5') || entry.cuenta.startsWith('7')) continue;
    if (entry.debe > 0) {
      gastosPorGrupo[entry.subgrupo] = (gastosPorGrupo[entry.subgrupo] || 0) + entry.debe;
    }
  }

  // Saldos de cuentas individuales
  const saldoCuentaMap = {};
  const cuentasAgrupadas = {};
  for (const entry of entries) {
    if (!cuentasAgrupadas[entry.cuenta]) cuentasAgrupadas[entry.cuenta] = { debe: 0, haber: 0 };
    cuentasAgrupadas[entry.cuenta].debe  += entry.debe;
    cuentasAgrupadas[entry.cuenta].haber += entry.haber;
  }
  for (const [cta, vals] of Object.entries(cuentasAgrupadas)) {
    saldoCuentaMap[cta] = vals.haber - vals.debe; // positivo = saldo acreedor
  }

  // Balance
  const balance = buildBalanceEstimado(entries);

  // Ingresos del último mes (para MRR)
  const lastMonthData = byMonth[lastMk] || [];

  // ---- Trust Score (calculado sobre allAnomalies, NO mutando parsedLedger) ----
  let trustScore = 100;
  allAnomalies.forEach(a => {
    if (a.severity === 'critical') trustScore -= 30;
    else if (a.severity === 'high') trustScore -= 15;
    else if (a.severity === 'medium') trustScore -= 5;
    else if (a.severity === 'low') trustScore -= 2;
  });
  // Penalización por descuadres globales (anomalías del parser o del analyzer)
  const hasDescuadreGeneral = allAnomalies.some(a => a.id === 'asiento_descuadrado' || a.id === 'descuadre_contable');
  if (hasDescuadreGeneral) trustScore -= 20;
  trustScore = Math.max(0, Math.floor(trustScore));

  // ---- Confidence Engine (bloque único, centralizado) ----
  const confidence = getConfidenceMeta(trustScore, allAnomalies, ebitdaSuspect, contextChecklist, parsedLedger.meta.months);

  const data = {
    meta: { ...parsedLedger.meta }, // trustScore eliminado de meta (Legacy Phase 5)
    anomalies: allAnomalies,        // Fuente canónica post-análisis (parser + analyzer)
    confidence,                     // Única fuente de verdad para fiabilidad
    totales: {
      ingresos: totalIngresos,
      gastos: totalGastos,
      ebitda: totalEbitda,
      resultado: totalResultado,
      cogs: totalCogs,
      cajaFinal,
      burnRateNeto,
      gastosPorGrupo,
      saldoCuenta: saldoCuentaMap
      // ebitdaSuspect eliminado de totales (Legacy Phase 5)
    },
    balance,
    pygMensual,
    byMonth,
    lastMonth: lastMk,
    lastMonthEntries: lastMonthData,
    categoryMap // Exportamos el mapa final usado
  };

  return data;
}
