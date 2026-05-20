# 💾 APTKI Workstation - Estado de Guardado (Handoff)

## 1. Estado Actual (State of the Union)
- **Consolidación del Core Analítico:** La Workstation es plenamente funcional, capaz de procesar un libro diario (PGC), clasificar cuentas, aplicar ajustes de devengo, y generar un dashboard financiero completo in-browser con arquitectura SPA.
- **Contexto Humano y Trust Score (Fases 1 a 4):** Se integró exitosamente el formulario de "Contexto Contable" permitiendo al analista influir determinísticamente en el *Confidence Engine* sin romper la inmutabilidad de los datos algorítmicos.
- **Agentic Export (Fase 5):** Funcionalidad pionera implementada. El sistema exporta la *State of the Union* financiera (KPIs, Anomalías, Trust Score) en un payload markdown ultradenso al portapapeles, optimizado para el consumo inmediato por parte de LLMs (Claude, ChatGPT).
- **Sentido de Negocio Avanzado (Fase 6):**
  - El *Filtro Día 1* (`checklist.js`) ahora es **dinámico**, adaptándose al arquetipo del negocio (evalúa MRR/Burn para SaaS, I+D/Capex para Industriales).
  - Integradas alertas de Due Diligence críticas en el motor de anomalías (`analyzer.js`): Fuga de capital por préstamos a socios (Grupo 55) y pasivo público bloqueante (Grupo 47).
  - Implementado chequeo de *Bankability* sugiriendo diversificación bancaria de alto nivel a startups que superan los 500k€ de facturación.
- **Fase de Refinamiento Completada:**
  - **Parser Blindado:** `parser.js` corrige automáticamente la época matemática de Excel (1899 vs 1970) y purifica numéricos negativos contables encerrados entre paréntesis e ignora celdas vacías (`DBNull`), asegurando cero fallos de ejecución.
  - **Arquitectura Reactiva (State Wrapping):** Implementado `store.js` con un ES6 *Deep Proxy* y un bus de eventos (Observer / PubSub). Toda la SPA es ahora puramente reactiva a los cambios de estado sin necesidad de mutaciones manuales ni acoplamientos espagueti en la vista.
  - **Diseño Dark Glassmorphism (Fase 3 UI):** Interfaz premium utilizando `backdrop-filter: blur`, gradientes profundos, bordes sutiles y micro-animaciones para proyectar autoridad institucional.
- **Convergencia Financiera Avanzada (Fase 9.1):**
  - **Fórmula de Crisis CDTI Blindada:** Integración de la regla de exclusión de ayudas de la UE (Reglamento 651/2014) sobre fondos propios netos ajustados (excluyendo subvenciones de capital del grupo 13).
  - **Quiebra Técnica LSC:** Evaluación automática de causa legal de disolución según el Art. 363.1.e de la Ley de Sociedades de Capital (LSC) para patrimonio neto total inferior al 50% del Capital Social.
  - **EBITDA Orgánico ENISA:** Purgado y cálculo del EBITDA normalizado tras deducir activaciones de I+D (cta. 730) y subvenciones de capital imputadas a resultados (cta. 746) para simular el rating del analista financiero público.
- **Gestión de Riesgos de la Cuenta 551 con Socios (Fase 2):**
  - **Divergencia Deudora/Acreedora:** Separación analítica de la cuenta corriente con socios y administradores (cta. 551) y titular de la explotación (cta. 550) en base a su signo contable final (deudor vs. acreedor).
  - **Inclusión Admisible de la Cuenta 550:** Se analiza conjuntamente la cuenta 550 junto a la 551 dado que en autónomos societarios, empresarios individuales o en startups en etapas muy incipientes, es habitual clasificar transitoriamente o por error las relaciones socios-empresa en la 550 antes de la constitución de la SL.
  - **Umbral Material y Limitación por Netting:** Implementación de un límite de materialidad de **3.000 €** acumulado final para evitar falsos positivos por pequeños desembolsos transitorios. Se explicita técnicamente que el motor evalúa el *saldo neto agregado de la cuenta*, lo cual podría enmascarar compensaciones internas cruzadas entre socios (ej. Socio A deudor y Socio B acreedor) si no existen subcuentas contables debidamente individualizadas a 4 o más dígitos.
  - **Modelado Tributario Orientativo:** Provisión de referencia y estimación orientativa (no liquidación cerrada) del devengo de intereses vinculados bajo el tipo legal vigente (3.25% en 2026), estimando la retención del 19% trimestral (Modelo 123) y la declaración informativa vinculada (Modelo 232) si se superan los 250.000 €.


## 2. Robustez de Fase 7 (Micro Sprint de Calidad)
- **DSO/DPO Real Restaurado:** Se corrigió el bug de cálculo real. Se implementó una agregación robusta por prefijo contable (`43` para deudores, `40` para acreedores) sobre el mapa de subcuentas consolidado, invirtiendo el signo para clientes (saldo deudor) para adecuarse a la convención `haber - debe` de `analyzer.js`.
- **Defensa Blindada (Null-Safety):** Se blindó `defensa.js` de extremo a extremo mediante encadenamiento opcional (`?.`) y coalescencia nula (`??`) en todos sus consumos de datos (`data.totales`, `data.balance`, `data.anomalies`, `data.pygMensual`), eliminando errores al transicionar entre vistas o al cargar estructuras parciales.
- **Copiado de Informes Universal:** Se eliminó la dependencia exclusiva de `navigator.clipboard`. Ahora se cuenta con un fallback transparente basado en `<textarea>` temporal inyectado en el DOM y ejecución de `document.execCommand('copy')`. Esto garantiza la funcionalidad en navegadores sin HTTPS o con permisos restringidos.
- **Limpieza de Código:** Se eliminó la referencia muerta a `UNIVERSAL_KPIS` en el cálculo de DSO/DPO, simplificando la mantenibilidad técnica.

## 3. Archivos Clave Modificados Recientemente
## 3. Fase 8: Módulo de Cartera (Priorización y Routing)
- **Dashboard de Cartera Multicompañía:** Vista agregada para gestionar 3 o 4 startups simultáneamente en estado vivo mediante importación individual o por lotes de archivos `.aptki`.
- **Clasificador de Gravedad y Urgencias:** Semáforo de urgencia de caja y balance cruzando runway, anomalías críticas de Due Diligence, y nivel de conciliación contable en un Score determinista (0-100).
- **Clasificador de Focos Operativos:** Determina si el problema principal radica en Caja (Runway), Circulante (DSO/DPO), Costes, Financiabilidad, Deuda Pública (Hacienda/SS) o "Materiales y caso financiero" (sustituyendo el concepto abstracto de "Narrativa").
- **Routing de Equipos en 3 Niveles:** Diagnóstico tridimensional que desglosa Foco Principal ──> Bloqueador Previo Activo (Trust contable, Hacienda/SS, Socios/DD) ──> Ruta Sugerida Final (CFO, Gestoría, Fin. Bancaria, Fin. Pública, Fundraising).
- **Persistencia Consolidada Compatible:** Soporte de persistencia en `.aptki` con formato `"mode": "portfolio"` que unifica en memoria toda la cartera y permite exportar e importar de forma consolidada, manteniendo la retrocompatibilidad absoluta con sesiones individuales.

## 4. Archivos Clave Modificados/Creados
- `index.html`: Estructura SPA y UI general. Agregado botón de navegación y la sección `#section-cartera` que aloja la dropzone de carga en lote, tarjetas de KPIs, tabla ejecutiva de control y bloque de Handoff Express.
- `js/app.js`: Orquestador principal (navegación, alertas reactivas y parpadeo de runway). Integrada la navegación condicional para la pestaña de Cartera.
- `js/defensa.js`: El núcleo de inteligencia de supervivencia, cálculo real robusto de DSO/DPO, leaks, talking points, plan de choque interactivo y fallback universal de portapapeles.
- `js/session.js`: Persistencia automática del plan de choque interactivo y simulaciones de caja rápida en el archivo de sesión `.aptki`. Reescritas las funciones de guardado y carga para actuar de forma dual (single vs portfolio), con batch drag-and-drop e importadores dedicados.
- `js/store.js`: Definición de estados globales reactivos. Extendidas las claves reactivas `cartera`, `carteraActiveStartup` y `carteraMode` en el Proxy profundo de estado.
- `js/cartera.js`: **Creado desde cero.** Contiene el motor lógico determinista de triage, cálculo de elegibilidad ENISA, renderizadores de DOM dinámicos, ficha de handoff express y fallback de copiado robusto.
- `css/index.css`: Inyectados estilos para badges sutiles HSL, dropzones interactivas y efectos de selección en la tabla.

## 5. 🔑 Golden Prompt de Reenganche

```markdown
Hola, Antigravity. Retomamos el proyecto APTKI Workstation asumiendo el rol de Design Lead y Full-Stack Engineer experto en SPA sin frameworks.

### CONTEXTO DEL PROYECTO
La workstation está en un estado excelente de robustez y madurez operativa. El Módulo de Cartera (Fase 8) se encuentra plenamente integrado en el ecosistema, permitiendo un control unificado y determinista de múltiples startups, routing por equipos (CFO, Gestoría, Financiación Bancaria/Pública, Fundraising), bloqueadores cruzados y ficha de handoff express con copiado seguro.

Léete el archivo `HANDOFF.md` para asimilar el core técnico antes de empezar.
```
