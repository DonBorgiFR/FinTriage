/**
 * knowledge.js — Guía Interactiva de Financiación FinTriage
 * Datos en JSON editable. Añade o modifica directamente este archivo.
 */

const KNOWLEDGE_DATA = {
  enisa: {
    title: 'ENISA — Préstamos Participativos',
    icon: '🏛️',
    color: 'var(--cyan)',
    intro: 'ENISA otorga préstamos participativos sin avales ni dilución de capital. Intereses deducibles en IS. Comisión de apertura 0,5%.',
    estructura_interes: 'Tramo 1 (Fijo): Euríbor + 2% a +3,75% · Tramo 2 (Variable): 3% – 8% según rentabilidad',
    lineas: [
      {
        nombre: 'Jóvenes Emprendedores',
        importe: '≤ 75.000 €',
        cofinanciacion: '2:1 (menos capital propio requerido)',
        antiguedad: '< 24 meses',
        requisito_edad: '> 50% capital para menores de 41 años',
        vencimiento: '7 años',
        carencia: '5 años',
        notas: 'Única línea con apalancamiento 2:1. Tick máximo bajo.'
      },
      {
        nombre: 'Emprendedores',
        importe: '≤ 300.000 €',
        cofinanciacion: '1:1',
        antiguedad: '< 24 meses',
        requisito_edad: 'Sin límite de edad',
        vencimiento: '7 años',
        carencia: '5 años',
        notas: 'Línea principal para startups en fase temprana. Sin restricción de edad de founders.'
      },
      {
        nombre: 'Crecimiento',
        importe: '≤ 1.500.000 €',
        cofinanciacion: '1:1',
        antiguedad: '> 2 ejercicios cerrados con fondos propios positivos',
        requisito_edad: 'Sin límite',
        vencimiento: '9 años',
        carencia: '7 años',
        notas: 'Exige cuentas auditadas externamente si el préstamo supera los 300.000 €.'
      },
      {
        nombre: 'AgroInnpulso',
        importe: '≤ 1.500.000 €',
        cofinanciacion: '1:1',
        antiguedad: 'Sin restricción específica',
        requisito_edad: 'Sin límite',
        vencimiento: '9 años',
        carencia: '7 años',
        notas: 'Exclusiva para pymes del sector agroalimentario y rural con foco en digitalización.'
      },
      {
        nombre: 'Emprendedoras Digitales',
        importe: '≤ 1.500.000 €',
        cofinanciacion: '1:1',
        antiguedad: 'Sin restricción específica',
        requisito_edad: 'Mujeres en posiciones relevantes del órgano de gobierno o administración',
        vencimiento: '9 años',
        carencia: '7 años',
        notas: 'Proyectos digitales o tecnológicos con liderazgo femenino.'
      },
      {
        nombre: 'Audiovisual e ICC',
        importe: '25.000 € – 1.500.000 €',
        cofinanciacion: '1:1',
        antiguedad: 'Sin restricción específica',
        requisito_edad: 'Sin límite',
        vencimiento: '9 años',
        carencia: '7 años',
        notas: 'Videojuegos, audiovisual, industrias culturales y creativas. Cuentas auditadas si > 300.000€.'
      }
    ],
    requisitos_generales: [
      'Pyme según definición UE, domicilio social en España',
      'Modelo de negocio innovador con viabilidad técnica y económica demostrable',
      'Fondos propios ≥ importe solicitado (regla cofinanciación 1:1, excepto Jóvenes Emprendedores 2:1)',
      'Ampliación de capital dineraria realizada o prevista en el ejercicio',
      'Cuentas del último ejercicio depositadas en Registro Mercantil',
      'Cumplir principio DNSH (no daño significativo al medio ambiente)',
      'Sectores excluidos: inmobiliario y financiero'
    ],
    calculadora: true
  },

  cdti: {
    title: 'CDTI & EIC — I+D+i Nacional y Europeo',
    icon: '🔬',
    color: 'var(--purple)',
    intro: 'Financiación nacional y europea para proyectos tecnológicos, de innovación aplicada y desarrollo científico disruptivo con madurez técnica (TRL).',
    lineas: [
      {
        nombre: 'CDTI Neotec',
        importe: '≤ 250.000 €',
        tipo: 'Subvención (hasta 70% del presupuesto)',
        antiguedad: 'Antigüedad: < 3 años · Capital social mínimo: 20.000 €',
        notas: 'Concurrencia competitiva. Requiere tecnología propia y plan de empresa sólido. Exclusivo para startups tech.'
      },
      {
        nombre: 'Proyectos I+D CDTI (PID)',
        importe: 'Presupuesto mín: 175.000 €',
        tipo: 'Préstamo reembolsable (hasta 85%) + Tramo No Reembolsable (TNR) 20-33%',
        antiguedad: 'Sin límite de antigüedad · Interés fijo Euribor / fijo mínimo',
        notas: 'Carencia 2-3 años, amortización 10-15 años. Para proyectos de investigación industrial aplicada.'
      },
      {
        nombre: 'Líneas de Innovación CDTI (LIC)',
        importe: 'Variable según proyecto',
        tipo: 'Préstamo reembolsable con condiciones preferenciales',
        antiguedad: 'Orientado a incorporación activa de tecnologías y mejoras de procesos',
        notas: 'Menos exigente tecnológicamente que PID, enfocado a la innovación e implantación industrial.'
      },
      {
        nombre: 'EIC Pathfinder (Horizonte Europa)',
        importe: '≤ 4.000.000 €',
        tipo: 'Subvención a fondo perdido al 100% de los costes',
        antiguedad: 'TRL 1–4 · Proyectos de consorcio con mínimo 3 entidades',
        notas: 'Financia investigación de ruptura temprana en tecnologías de vanguardia. Presupuesto 2026 con deadline en mayo.'
      },
      {
        nombre: 'EIC Accelerator (Horizonte Europa)',
        importe: '≤ 2,5 M€ (Grant) / de 0,5 a 10 M€ (Equity)',
        tipo: 'Modalidades: Grant-only, Blended finance o Investment-only',
        antiguedad: 'TRL 5–8 · Exclusivo para startups y pymes altamente disruptivas',
        notas: 'Subvención máx una vez por empresa en HE (2021-2027) para innovación TRL 6-8. El tramo Equity opera a través del EIC Fund.'
      }
    ]
  },

  ico_sgr: {
    title: 'Líneas ICO & SGR — Avales y Crédito Bancario',
    icon: '🏦',
    color: '#94a3b8',
    intro: 'Líneas de mediación bancaria o financiación directa del ICO combinadas con reavales públicos del sistema SGR/CERSA para mejorar el acceso y tipo de interés de startups y PYMEs.',
    lineas: [
      {
        nombre: 'Línea ICO Empresas y Emprendedores',
        importe: 'Hasta el 100% del proyecto',
        tipo: 'Préstamo, leasing, renting o línea de crédito',
        antiguedad: 'Sin antigüedad mínima · Autónomos y empresas de cualquier sector',
        notas: 'Plazos de amortización de hasta 20 años y carencia de hasta 3 años. Gestionado a través del banco intermediario.'
      },
      {
        nombre: 'ICO Crecimiento (Financiación Directa)',
        importe: 'Mínimo: 50.000 €',
        tipo: 'Euribor + margen de 0,75% a 1,75% (sin banco intermediario, 100% digital)',
        antiguedad: 'Antigüedad mínima de 4 años + Cuentas auditadas de los 2 últimos ejercicios',
        notas: 'Financia hasta 80% en inversión (plazo 10 años) y 100% en circulante (plazo 5 años). Carencia de 1-2 años. Abierta hasta dic 2027.'
      },
      {
        nombre: 'ICO Crecimiento Exportadores',
        importe: 'Préstamo directo con tramo no reembolsable (TNR)',
        tipo: 'TNR hasta 30% del nominal (máximo 200.000 €) + bonificación de -100 bps',
        antiguedad: 'Para pymes exportadoras afectadas por tensiones arancelarias',
        notas: 'En Cataluña, si la operación es < 1,5 M€ y va avalada por Avalis SGR, el tipo queda bonificado a Euríbor + 0,33%. Ventana hasta julio de 2026.'
      },
      {
        nombre: 'Línea ICO Verde',
        importe: 'Financiación de proyectos sostenibles',
        tipo: 'Préstamo para descarbonización, eficiencia, renovables y agua',
        antiguedad: 'Abierta a empresas que acometan la transición ecológica',
        notas: 'Plazo de formalización abierto hasta el 31 de agosto de 2026.'
      },
      {
        nombre: 'Sistema SGR / CERSA (Avales de Garantía)',
        importe: 'Contragarantías de hasta el 80%',
        tipo: 'Aval ante el banco con reaval de CERSA (Ministerio de Industria)',
        antiguedad: 'Importe máx: 1.100.000 € por empresa · SGR regional de referencia',
        notas: 'Clave para pymes sin garantías reales suficientes. En Cataluña opera a través de Avalis de Catalunya (línea industrial con reaval).'
      }
    ]
  },

  incentivos_fiscales: {
    title: 'Incentivos Fiscales & Contratación I+D+i',
    icon: '💸',
    color: 'var(--green)',
    intro: 'Mecanismos legales de ahorro en Impuesto sobre Sociedades y cotizaciones a la Seguridad Social para personal técnico y contratación de investigadores.',
    items: [
      {
        nombre: 'Deducción IS por I+D',
        descripcion: '25% de los gastos directos en I+D (hasta 42% si supera la media histórica). Acumulable 18 años y monetizable con peaje del 20% (sin Impuesto de Sociedades positivo).',
        perfil: 'Empresas con proyectos de I+D científica certificados.'
      },
      {
        nombre: 'Deducción IS por Innovación Tecnológica (IT)',
        descripcion: '12% de los gastos en IT (mejoras tecnológicas no disruptivas, software aplicado, prototipos industriales). Compatible con deducción I+D.',
        perfil: 'Pymes con adaptaciones tecnológicas de productos o procesos.'
      },
      {
        nombre: 'Bonificación SS Personal Investigador',
        descripcion: 'Ahorro directo del 40% en contingencias comunes de Seguridad Social (~23.6% del salario bruto) para investigadores 100% dedicados a I+D+i. Compatible con IS si se es Pyme Innovadora.',
        perfil: 'Startups y pymes tecnológicas con programadores o científicos en nómina.'
      },
      {
        nombre: 'Torres Quevedo (Contratación de Doctores)',
        descripcion: 'Subvenciones para contratación de doctores de hasta el 70% del coste anual (pequeña empresa), 60% (mediana) y 50% (grande). Contrato de 3 años, coste máx financiable 56.000€/año, salario bruto mín 29.070€/año.',
        perfil: 'Empresas de cualquier sector con actividad I+D que contraten doctores.'
      }
    ]
  },

  internacional_social: {
    title: 'Financiación Internacional & Social',
    icon: '🌍',
    color: 'var(--amber)',
    intro: 'Vías para la expansión en mercados exteriores y microcréditos de impacto social para pequeños negocios o microempresas.',
    items: [
      {
        nombre: 'COFIDES — FONPYME',
        descripcion: 'Préstamos de 75.000 € a 1.000.000 € (opción equity > 3M€) para inversión productiva en el exterior de pymes españolas. Cubre el 70-80% de necesidades, tipo Euribor + 1-3% fijo, carencia 2 años, amortización 5-6 años.',
        perfil: 'Pymes industriales o comerciales abriendo filiales productivas en el extranjero.'
      },
      {
        nombre: 'COFIDES — Pyme Invierte',
        descripcion: 'Financiación conjunta con ICEX de 75.000 € a 10 M€ para necesidades a medio/largo plazo de implantación en el exterior. Plazo 5-10 años. Requiere certificado previo ICEX.',
        perfil: 'Pymes internacionalizadas participantes en fases previas del programa ICEX.'
      },
      {
        nombre: 'MicroBank — Microcrédito Empresarial',
        descripcion: 'Préstamo máximo de 25.000 € (personas físicas) o 30.000 € (personas jurídicas) sin garantías reales, basado en plan de empresa. Dirigido a microempresas de hasta 10 trabajadores y facturación < 2.000.000 €.',
        perfil: 'Microempresas, emprendedores y autónomos en fase de autoempleo o arranque.'
      },
      {
        nombre: 'MicroBank — Préstamo Empresa Social',
        descripcion: 'Importe máximo de 2.000.000 € con financiación hasta el 100% del proyecto. Carencia de capital de hasta 12 meses y amortización hasta 10 años, sin requerir garantía real.',
        perfil: 'Empresas con impacto social, medioambiental, cooperativas y tercer sector.'
      }
    ]
  },

  autonomas: {
    title: 'Financiación Autonómica (CCAA)',
    icon: '🏔️',
    color: 'var(--purple)',
    intro: 'Programas autonómicos de subvención y coinversión gestionados por agencias regionales de competitividad (ACC1Ó en Cataluña, SPRI en País Vasco, etc.).',
    items: [
      {
        nombre: 'ACCIÓ — Inversión Industrial (Cataluña)',
        descripcion: 'Subvenciones no reembolsables de hasta 500.000 € (20% de la inversión elegible). Requiere inversión mínima de 100.000 € en micro/pymes o 1 M€ en grandes empresas. Vigente en 2026.',
        perfil: 'Empresas industriales radicadas en Cataluña que compren maquinaria o modernicen plantas.'
      },
      {
        nombre: 'ACCIÓ / ICF — IFEM Coinversión',
        descripcion: 'Préstamos participativos de 50.000 € a 200.000 € para startups innovadoras en fases iniciales. Requiere que un inversor corporativo privado aporte capital paralelamente en coinversión.',
        perfil: 'Startups catalanas en fase seed con inversores de capital privado cerrando rondas.'
      },
      {
        nombre: 'SPRI — Hazitek (País Vasco)',
        descripcion: 'Subvenciones no reintegrables para proyectos de I+D empresarial en Euskadi (presupuesto global 119 M€). Cubre costes de personal, materiales, equipamiento y consultoría en investigación industrial.',
        perfil: 'Pymes y grandes empresas con plantas productivas y centros de I+D en el País Vasco.'
      },
      {
        nombre: 'SPRI — Zabaldu+ (País Vasco)',
        descripcion: 'Subvenciones a fondo perdido de hasta el 70% del gasto aprobado (máximo 75.000 € por pyme) para la internacionalización de pymes vascas. Integra planes previos de Sakondo, Sakur y Sakondu.',
        perfil: 'Pymes vascas iniciando su expansión en el exterior o consolidando mercados.'
      }
    ]
  },

  financiacion_privada: {
    title: 'Financiación Privada',
    icon: '💼',
    color: 'var(--amber)',
    intro: 'Vías alternativas y capital privado para startups y pymes con altas necesidades de crecimiento.',
    items: [
      { nombre: 'Venture Capital (VC)', desc: 'Fondos de inversión institucionales. Tickets: Seed 100k-2M€, Series A 2-10M€. Requieren due diligence rigurosa y escalabilidad explosiva.' },
      { nombre: 'Business Angels (BA)', desc: 'Inversores particulares. Tickets: 25k-500k€. Aportan capital inicial, smart money, asesoramiento y red de contactos clave.' },
      { nombre: 'Equity Crowdfunding', desc: 'Financiación participativa en plataformas como Crowdcube. Permite cerrar tramos de rondas integrando pequeños inversores minoristas.' },
      { nombre: 'Venture Debt', desc: 'Deuda de riesgo estructurada. Complementa rondas de capital privado limitando la dilución de los fundadores. Requiere ronda de equity previa.' },
      { nombre: 'SAFE / Notas Convertibles', desc: 'Préstamos puente rápidos convertibles en acciones en la siguiente ronda de valoración formal. Muy común en fases pre-seed.' }
    ]
  }
};

// ---- Calculadora ENISA ----
function calcularMaxENISA(fondosPropios, lineaId) {
  const limites = {
    jovenes: 75000,
    emprendedores: 300000,
    crecimiento: 1500000,
    agroinnpulso: 1500000,
    emprendedoras: 1500000,
    audiovisual: 1500000
  };
  const ratios = { jovenes: 2, emprendedores: 1, crecimiento: 1 };
  const ratio = ratios[lineaId] || 1;
  const limite = limites[lineaId] || 300000;
  return Math.min(fondosPropios * ratio, limite);
}

// ---- Render ----
function renderKnowledge() {
  const root = document.getElementById('financiacion-root');
  if (!root) return;

  root.innerHTML = `
    <!-- Tabs de categoría -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;" id="know-tabs">
      <button class="btn btn-primary know-tab active" data-cat="enisa">🏛️ ENISA</button>
      <button class="btn btn-secondary know-tab" data-cat="cdti">🔬 CDTI & EIC</button>
      <button class="btn btn-secondary know-tab" data-cat="ico_sgr">🏦 ICO & SGR</button>
      <button class="btn btn-secondary know-tab" data-cat="incentivos_fiscales">💸 Incentivos Fiscales</button>
      <button class="btn btn-secondary know-tab" data-cat="internacional_social">🌍 Internacional & Social</button>
      <button class="btn btn-secondary know-tab" data-cat="autonomas">🏔️ Autonómicas</button>
      <button class="btn btn-secondary know-tab" data-cat="financiacion_privada">💼 Capital Privado</button>
    </div>

    <!-- Contenido dinámico -->
    <div id="know-content"></div>
  `;

  function renderCategory(catId) {
    const cat = KNOWLEDGE_DATA[catId];
    if (!cat) return;
    const content = document.getElementById('know-content');

    if (catId === 'enisa') {
      content.innerHTML = `
        <div class="card" style="margin-bottom:20px;border-color:rgba(0,212,255,0.2);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <span style="font-size:1.8rem;">${cat.icon}</span>
            <div>
              <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;">${cat.title}</div>
              <div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px;">${cat.estructura_interes}</div>
            </div>
          </div>
          <p style="font-size:0.87rem;color:var(--text-secondary);margin-bottom:16px;">${cat.intro}</p>

          <!-- Requisitos generales -->
          <details style="margin-bottom:16px;">
            <summary style="cursor:pointer;font-weight:600;color:var(--cyan);font-size:0.88rem;margin-bottom:8px;">
              📋 Requisitos Generales (aplican a todas las líneas)
            </summary>
            <ul style="margin-top:10px;padding-left:16px;display:flex;flex-direction:column;gap:6px;">
              ${cat.requisitos_generales.map(r => `<li style="font-size:0.83rem;color:var(--text-secondary);">${r}</li>`).join('')}
            </ul>
          </details>

          <!-- Tabla de líneas -->
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Línea</th>
                  <th style="text-align:right">Importe máx.</th>
                  <th>Cofinanciación</th>
                  <th>Antigüedad</th>
                  <th>Vencimiento</th>
                  <th>Carencia</th>
                </tr>
              </thead>
              <tbody>
                ${cat.lineas.map(l => `
                  <tr title="${l.notas}">
                    <td style="font-weight:600;color:var(--text-primary);">${l.nombre}</td>
                    <td class="td-num" style="color:var(--cyan);font-weight:700;">${l.importe}</td>
                    <td style="color:var(--text-secondary);">${l.cofinanciacion}</td>
                    <td style="color:var(--text-muted);font-size:0.8rem;">${l.antiguedad}</td>
                    <td style="color:var(--text-secondary);">${l.vencimiento}</td>
                    <td style="color:var(--green);">${l.carencia}</td>
                  </tr>
                  <tr><td colspan="6" style="font-size:0.75rem;color:var(--text-muted);padding:4px 14px 12px;border-bottom:1px solid var(--border);">💡 ${l.notas}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Calculadora ENISA -->
        <div class="card" style="border-color:rgba(0,212,255,0.2);">
          <div class="card-title">🧮 Calculadora ENISA</div>
          <p style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:16px;">Estima el préstamo máximo que puede solicitar tu cliente según sus fondos propios.</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
            <div class="form-group" style="min-width:200px;">
              <label for="calc-fondos">Fondos Propios (€)</label>
              <input type="number" id="calc-fondos" placeholder="Ej: 300000" min="0" />
            </div>
            <div class="form-group" style="min-width:200px;">
              <label for="calc-linea">Línea ENISA</label>
              <select id="calc-linea">
                <option value="jovenes">Jóvenes Emprendedores (2:1)</option>
                <option value="emprendedores" selected>Emprendedores (1:1)</option>
                <option value="crecimiento">Crecimiento (1:1)</option>
              </select>
            </div>
            <button class="btn btn-primary" id="btn-calcular-enisa">Calcular</button>
          </div>
          <div id="calc-result" style="margin-top:16px;display:none;padding:16px;background:var(--cyan-dim);border:1px solid var(--border-accent);border-radius:var(--radius-sm);">
            <span style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--cyan);" id="calc-result-val"></span>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;" id="calc-result-desc"></div>
          </div>
        </div>
      `;

      document.getElementById('btn-calcular-enisa')?.addEventListener('click', () => {
        const fondos = parseFloat(document.getElementById('calc-fondos').value) || 0;
        const linea = document.getElementById('calc-linea').value;
        const max = calcularMaxENISA(fondos, linea);
        const resultEl = document.getElementById('calc-result');
        const valEl = document.getElementById('calc-result-val');
        const descEl = document.getElementById('calc-result-desc');
        resultEl.style.display = 'block';
        valEl.textContent = new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(max) + ' €';
        descEl.textContent = `Con ${new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(fondos)}€ de fondos propios, el máximo de ENISA ${linea} es ${new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(max)}€.`;
      });

    } else if (cat.lineas) {
      content.innerHTML = `
        <div class="card" style="margin-bottom:20px; border-color:${cat.color}33;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <span style="font-size:1.8rem;">${cat.icon}</span>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;">${cat.title}</div>
          </div>
          <p style="font-size:0.87rem;color:var(--text-secondary);margin-bottom:20px;">${cat.intro}</p>
          <div style="display:flex;flex-direction:column;gap:14px;">
            ${cat.lineas.map(l => `
              <div style="padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
                  <div style="font-weight:700;color:var(--text-primary);">${l.nombre}</div>
                  <div style="font-weight:700;color:${cat.color};">${l.importe}</div>
                </div>
                <div style="font-size:0.82rem;color:var(--cyan);margin-bottom:6px;">${l.tipo}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${l.antiguedad}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:6px;">💡 ${l.notas}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="card" style="border-color:${cat.color}33;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <span style="font-size:1.8rem;">${cat.icon}</span>
            <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;">${cat.title}</div>
          </div>
          <p style="font-size:0.87rem;color:var(--text-secondary);margin-bottom:20px;">${cat.intro}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
            ${cat.items.map(i => `
              <div style="padding:18px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg-card); display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-weight:700;color:${cat.color};margin-bottom:8px;">${i.nombre}</div>
                  <div style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:8px;line-height:1.6;">${i.descripcion || i.desc}</div>
                </div>
                ${i.perfil ? `<div style="font-size:0.75rem;color:var(--text-muted);padding-top:8px;border-top:1px solid var(--border);margin-top:8px;">👤 ${i.perfil}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // Tabs
  document.querySelectorAll('.know-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.know-tab').forEach(b => {
        b.className = 'btn btn-secondary know-tab';
      });
      btn.className = 'btn btn-primary know-tab active';
      renderCategory(btn.dataset.cat);
    });
  });

  // Render inicial
  renderCategory('enisa');
}
