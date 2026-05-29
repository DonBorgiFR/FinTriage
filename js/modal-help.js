/**
 * modal-help.js — Modal Explicativo "¿Qué hace FinTriage?"
 * Se inyecta en el DOM al cargar. Abre/cierra con el botón ? de la topbar.
 * Accesible: role=dialog, aria-modal, Escape para cerrar.
 */

(function () {
  'use strict';

  // ── HTML del modal ──────────────────────────────────────────────────────────
  const MODAL_HTML = `
  <div id="modal-help-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-help-title"
    style="
      display: none;
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      align-items: center; justify-content: center;
      padding: 16px;
      overflow-y: auto;
    ">

    <div id="modal-help-panel" style="
      position: relative;
      background: linear-gradient(145deg, rgba(20,22,30,0.97), rgba(14,16,22,0.99));
      border: 1px solid rgba(100,220,255,0.18);
      border-radius: 16px;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.7), 0 0 60px rgba(1,200,210,0.07);
      max-width: 700px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      padding: 36px 40px;
      margin: auto;
      color: var(--text-primary, #e2e8f0);
      font-family: var(--font-body, 'Inter', sans-serif);
    ">

      <!-- Botón cerrar -->
      <button id="modal-help-close"
        aria-label="Cerrar guía de uso de FinTriage"
        style="
          position: absolute; top: 16px; right: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: var(--text-secondary, #94a3b8);
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; cursor: pointer;
          transition: background 200ms ease, color 200ms ease;
        "
        onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.color='#fff'"
        onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.color=''"
      >✕</button>

      <!-- Cabecera -->
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:28px;">
        <div style="
          width:48px; height:48px; border-radius:12px; flex-shrink:0;
          background: linear-gradient(135deg, rgba(1,180,200,0.25), rgba(1,200,210,0.1));
          border: 1px solid rgba(1,200,210,0.35);
          display:flex; align-items:center; justify-content:center;
          font-size:1.6rem;
        ">🩺</div>
        <div>
          <h2 id="modal-help-title" style="
            font-family: var(--font-display, 'Inter', sans-serif);
            font-size: 1.35rem; font-weight: 800;
            color: var(--text-primary, #e2e8f0);
            margin: 0 0 3px;
            line-height: 1.2;
          ">FinTriage — Guía Rápida de Uso</h2>
          <p style="margin:0; font-size:0.82rem; color:var(--cyan,#01c8d2); font-weight:600; letter-spacing:0.04em; text-transform:uppercase;">
            Guía rápida de uso · Local-First · Zero-Server
          </p>
        </div>
      </div>

      <!-- Sección: qué es -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 10px;">¿Qué es?</h3>
        <p style="font-size:0.9rem; line-height:1.65; color:var(--text-secondary,#94a3b8); margin:0;">
          FinTriage es una plataforma de triage y diagnóstico financiero que opera <strong style="color:var(--text-primary)">100% en tu navegador</strong>.
          Ningún dato contable sale de tu ordenador. Sin servidores, sin nube, sin registros de sesión.
        </p>
      </div>

      <!-- Sección: para quién -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 10px;">¿Para quién?</h3>
        <p style="font-size:0.9rem; line-height:1.65; color:var(--text-secondary,#94a3b8); margin:0;">
          Para el <strong style="color:var(--text-primary)">dueño de la PYME, cualquier miembro de su equipo, o su contable/financiero de confianza</strong>.
          La herramienta está diseñada para un uso personal sencillo y directo: no requiere ser un experto financiero ni un mega-CFO. Si dispones de un libro diario contable y tienes interés en entender la salud de tu negocio, aquí obtendrás un diagnóstico claro y fácil.
        </p>
      </div>

      <!-- Separador -->
      <div style="height:1px; background:rgba(255,255,255,0.07); margin:24px 0;"></div>

      <!-- Sección: cómo se usa -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px;">¿Cómo se usa?</h3>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${ [
            ['1', '📑', 'Arrastra un libro diario <strong>.xlsx</strong>', 'Exportado de tu software contable (formato PGC español). FinTriage lo lee y analiza al instante, sin subir nada a internet.'],
            ['2', '⚙️', 'Completa el contexto contable', 'Indica años de empresa, auditoría, CCAA, TRL, y condiciones especiales. Mejora la precisión del scoring.'],
            ['3', '🗺️', 'Revisa el mapeo de cuentas', 'Ajusta cómo se clasifican las cuentas de grupos 6 y 7. El sistema pre-asigna categorías por heurística PGC.'],
            ['4', '⚖️', 'Confirma las periodificaciones', 'El motor detecta pagos concentrados (seguros, licencias anuales) y propone prorratearlos mes a mes.'],
            ['5', '📊', 'Genera el Dashboard', 'CFO Cockpit con Trust Score, EBITDA normalizado, Runway y Hallazgos accionables.']
          ].map(([n, ic, tit, desc]) => `
          <div style="display:flex; gap:12px; align-items:flex-start; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px;">
            <div style="flex-shrink:0; width:28px; height:28px; border-radius:8px; background:rgba(1,200,210,0.15); border:1px solid rgba(1,200,210,0.25); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:var(--cyan,#01c8d2);">${n}</div>
            <div>
              <div style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-bottom:2px;">${ic} ${tit}</div>
              <div style="font-size:0.78rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">${desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Separador -->
      <div style="height:1px; background:rgba(255,255,255,0.07); margin:24px 0;"></div>

      <!-- Sección: qué calcula -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px;">¿Qué calcula automáticamente?</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:10px;">
          ${ [
            ['🔒', 'Trust Score (0–100)', 'Evalúa la fiabilidad del dato contable mediante 40+ reglas deterministas. Te dice si puedes confiar en los números antes de tomar decisiones.'],
            ['📊', 'EBITDA Orgánico Normalizado', 'Detecta y periodifica picos atípicos de gasto o ingreso para mostrarte el resultado real, sin ruido contable.'],
            ['⚠️', 'Anomalías Due Diligence', 'Alerta de riesgos críticos: préstamos a socios (cta. 551), deuda con Hacienda/SS (Grupo 47), causa legal de disolución (Art. 363.1.e LSC).'],
            ['🏦', 'Scoring ENISA / CDTI', 'Evalúa elegibilidad para financiación pública: ENISA Emprendedores, CDTI Neotec, ICO, SGR regional, Torres Quevedo, EIC Accelerator y MicroBank.'],
            ['📅', 'DSO y DPO reales', 'Días de cobro (Grupo 43) y pago (Grupo 40) calculados sobre subcuentas reales del libro.'],
            ['🚨', 'Cockpit de Supervivencia', 'Runway actual, Plan de Choque 100 días y forecast 12 meses en 3 escenarios (optimista, base, pesimista).']
          ].map(([ic, tit, desc]) => `
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px 16px;">
            <div style="font-size:1.3rem; margin-bottom:7px;">${ic}</div>
            <div style="font-size:0.86rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${tit}</div>
            <div style="font-size:0.77rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">${desc}</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Separador -->
      <div style="height:1px; background:rgba(255,255,255,0.07); margin:24px 0;"></div>

      <!-- Sección: persistencia y exportación -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 10px;">Persistencia &amp; Exportaciones</h3>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${ [
            ['💾', '.fintriage', 'Sesión local guardada'],
            ['📄', 'PDF ejecutivo', 'Informe con portada'],
            ['📥', 'Excel dinámico', 'Fórmulas y KPIs'],
            ['🤖', 'Prompt IA', 'Payload para Claude/ChatGPT'],
            ['🔁', '.aptki legacy', 'Compatible con APTKI']
          ].map(([ic, lab, desc]) => `
          <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px; font-size:0.8rem;">
            <span style="font-size:1rem;">${ic}</span>
            <div>
              <div style="font-weight:700; color:var(--text-primary); line-height:1.2;">${lab}</div>
              <div style="color:var(--text-muted,#64748b); font-size:0.72rem;">${desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Separador -->
      <div style="height:1px; background:rgba(255,255,255,0.07); margin:24px 0;"></div>

      <!-- Sección: FAQ -->
      <div style="margin-bottom:22px;">
        <h3 style="font-size:0.8rem; font-weight:700; color:var(--cyan,#01c8d2); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px;">Preguntas Frecuentes (FAQ)</h3>
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px;">
            <strong style="font-size:0.86rem; color:var(--text-primary); display:block; margin-bottom:4px;">¿Qué es un libro diario y cómo lo consigo?</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">Es el archivo contable donde se registran todos los movimientos y asientos de tu negocio. Puedes exportarlo en un segundo en formato Excel (.xlsx) desde tu propio software de facturación o contabilidad (Holded, Anfix, Contasol, A3, etc.).</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px;">
            <strong style="font-size:0.86rem; color:var(--text-primary); display:block; margin-bottom:4px;">¿Mis datos están seguros?</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">Sí, al 100%. FinTriage opera bajo filosofía <em>Local-First (Zero-Server)</em>, lo que significa que todo el procesamiento se ejecuta íntegramente dentro de tu propio navegador web. Ningún dato contable se envía a internet o a servidores externos, garantizando confidencialidad absoluta.</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px;">
            <strong style="font-size:0.86rem; color:var(--text-primary); display:block; margin-bottom:4px;">¿Qué pasa si dejo campos vacíos en el Paso 2?</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">No pasa absolutamente nada. El asistente es flexible: los campos del perfil cualitativo sirven para afinar la elegibilidad de ayudas específicas (como Torres Quevedo o EIC), pero dejarlos vacíos o incompletos no impedirá en absoluto que obtengas tu diagnóstico general.</div>
          </div>
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px 14px;">
            <strong style="font-size:0.86rem; color:var(--text-primary); display:block; margin-bottom:4px;">¿Cómo se calculan el EBITDA normalizado y las periodificaciones?</strong>
            <div style="font-size:0.78rem; color:var(--text-secondary,#94a3b8); line-height:1.55;">El motor identifica automáticamente picos anuales o gastos extraordinarios concentrados en un mes (como primas de seguros o licencias anuales) y te ofrece prorratearlos mes a mes. Esto te ayuda a visualizar la rentabilidad operativa real de tu negocio sin ruido estacional.</div>
          </div>
        </div>
      </div>

      <!-- Footer del modal -->
      <div style="margin-top:28px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <span style="font-size:0.72rem; color:var(--text-muted,#64748b);">
          FinTriage v1.3.1 · Licencia MIT · © 2026 Borja Felix Rojas
        </span>
        <button id="modal-help-close-bottom"
          style="
            background:rgba(1,200,210,0.12); border:1px solid rgba(1,200,210,0.3);
            color:var(--cyan,#01c8d2); border-radius:8px;
            padding:8px 20px; font-size:0.85rem; font-weight:700; cursor:pointer;
            transition:background 200ms ease;
          "
          onmouseover="this.style.background='rgba(1,200,210,0.22)'"
          onmouseout="this.style.background='rgba(1,200,210,0.12)'"
        >Entendido →</button>
      </div>

    </div>
  </div>`;

  // ── Inyectar modal en el DOM ─────────────────────────────────────────────────
  function injectModal() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = MODAL_HTML.trim();
    document.body.appendChild(wrapper.firstElementChild);
  }

  // ── Inyectar botón en la topbar ──────────────────────────────────────────────
  function injectButton() {
    const topbarRight = document.querySelector('.topbar > div[style*="margin-left: auto"]');
    if (!topbarRight) return;

    const btn = document.createElement('button');
    btn.id = 'btn-modal-help';
    btn.className = 'btn btn-secondary';
    btn.setAttribute('aria-label', 'Abrir guía de uso de FinTriage');
    btn.setAttribute('title', '¿Qué hace FinTriage?');
    btn.style.cssText = 'padding:6px 12px; font-size:0.8rem; display:flex; align-items:center; gap:5px; border-color:rgba(1,200,210,0.35); color:var(--cyan,#01c8d2); flex-shrink:0;';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>¿Cómo funciona?</span>`;

    // Insertar como primer elemento del contenedor derecho
    topbarRight.insertBefore(btn, topbarRight.firstChild);

    // Separador visual
    const sep = document.createElement('div');
    sep.className = 'topbar-sep';
    sep.style.flexShrink = '0';
    topbarRight.insertBefore(sep, btn.nextSibling);
  }

  // ── Control de apertura / cierre ─────────────────────────────────────────────
  function openModal() {
    const overlay = document.getElementById('modal-help-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    // Foco accesible al primer elemento focusable
    setTimeout(() => {
      const close = overlay.querySelector('#modal-help-close');
      if (close) close.focus();
    }, 60);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('modal-help-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    // Devolver foco al botón de apertura
    const openBtn = document.getElementById('btn-modal-help');
    if (openBtn) openBtn.focus();
  }

  // ── Eventos ──────────────────────────────────────────────────────────────────
  function bindEvents() {
    // Botón abrir
    document.addEventListener('click', function (e) {
      if (e.target.closest('#btn-modal-help')) openModal();
    });

    // Botón cerrar (X y footer)
    document.addEventListener('click', function (e) {
      if (e.target.closest('#modal-help-close') || e.target.closest('#modal-help-close-bottom')) {
        closeModal();
      }
    });

    // Clic en overlay fuera del panel
    document.addEventListener('click', function (e) {
      const overlay = document.getElementById('modal-help-overlay');
      if (e.target === overlay) closeModal();
    });

    // Tecla Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('modal-help-overlay');
        if (overlay && overlay.style.display === 'flex') closeModal();
      }
    });
  }

  // ── Init (espera a que el DOM esté listo) ─────────────────────────────────────
  function init() {
    injectModal();
    injectButton();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
