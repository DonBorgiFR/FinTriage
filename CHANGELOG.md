# CHANGELOG — APTKI Workstation

Historial de versiones y evolución del CFO Toolkit de APTKI.

## [1.3.5] — 2026-05-21 (Refinamiento Visual PDF: Gráficos Correctamente Encuadrados)

### Corregido
*   **Eliminación de recorte de gráficos en el PDF exportado (`js/app.js`)**:
    *   Los 5 gráficos del Dashboard (Waterfall de rentabilidad, EBITDA mensual divergente, Runway vs Burn Rate, Ingresos vs Gastos, y Forecast Fan Chart) aparecían recortados en el PDF, mostrando solo la esquina superior izquierda. La causa raíz era que las funciones de renderizado envolvían el SVG dentro de contenedores `.card` / `.chart-container-card` con padding, márgenes, títulos y scroll wrappers incluso en modo `print`. Dado que `preparePrintDOM` asigna `height: 200px` a cada bloque de gráfico, el SVG real disponía de solo ~140px tras los márgenes internos de la tarjeta, provocando desbordamiento y recorte por `html2canvas`.
    *   **Solución:** Se añadió un `return` anticipado en las 5 funciones de renderizado cuando `mode === 'print'`, inyectando el SVG directamente en el contenedor con estilo elástico (`width:100%; height:100%; max-height:100%; display:block; overflow:visible;`) y sin envoltorios intermedios. El `viewBox` nativo y `preserveAspectRatio="xMidYMid meet"` del SVG garantizan el escalado correcto sin deformaciones.

### Funciones modificadas
*   `renderWaterfall()` — Líneas ~1717-1724: Early return con SVG elástico directo.
*   `renderDivergingEbitdaChart()` — Líneas ~2020-2027: Early return con SVG elástico directo.
*   `renderRunwayBurnChart()` — Líneas ~2365-2385: Early return con SVG elástico directo.
*   `renderRevenuesExpensesChart()` — Helper `buildSVG` escalado + early return.
*   `renderForecastFanChart()` — Helper `buildSVG` escalado + early return.

### Verificado
*   **Comprobación 6: Integridad visual de gráficos en PDF (`scratch/verify_flows.js`)**:
    *   Auditoría programática del DOM de `#pdf-print-container` inmediatamente después del click en exportar, verificando para cada uno de los 5 gráficos:
        1.  Presencia de `<svg>` con `viewBox` y estilo elástico `width:100%`.
        2.  Ausencia de contenedores `.card` o `.chart-container-card` redundantes.
        3.  Presencia de nodos `<text>` vectoriales con leyendas esperadas (COGS, EBITDA, Caja, Burn, Optimista, Base, Pesimista, etc.).
    *   Resultado: **OK** — Todos los gráficos se renderizan completos, encuadrados y legibles en A4.

---

## [1.3.4-bis] — 2026-05-21 (Corrección de Regresión: Exportación PDF del Dashboard)

### Corregido
*   **Fix de Colapso Vertical a Alto 0 en PDF (`js/exporter.js`)**:
    *   Solución a la regresión donde la exportación a PDF producía un documento completamente en blanco debido a que el contenedor temporal de impresión (`pdf-print-container`) poseía estilos de posicionamiento absoluto (`position: absolute; left: 0; top: 0; z-index: -1000;`), lo que hacía que `html2pdf.js` colapsara la altura de renderizado a `0` píxeles dentro de su iframe interno de clonado.
    *   Inyección de un contenedor intermedio (envoltorio wrapper) invisible fuera de la pantalla (`left: -9999px; height: 0; width: 0; overflow: hidden;`) para albergar al `printContainer` con posicionamiento relativo (`position: relative; width: 800px;`), permitiendo un flujo de layout normal en el motor de renderizado de `html2pdf` sin causar intrusión visual ni parpadeo para el usuario final.

### Verificado
*   **Prueba de Cobertura 5 en Playwright (`scratch/verify_flows.js`)**:
    *   Añadida la **Comprobación 5: Exportación PDF Dashboard** que intercepta de forma programática el PDF exportado de Flowmetrics, lo parsea mediante `pdf-parse`, y valida de forma estricta que posee exactamente **7 páginas** repletas de contenido visual e integridad contable sin hojas vacías (OK).

---

## [1.3.4] — 2026-05-21 (Optimización de Reactividad y Rendimiento del Dashboard)

### Añadido
*   **Poda Selectiva de Reactividad Profunda (`js/store.js`)**:
    *   Implementación de la propiedad de filtrado de proxy profundo `_shouldDeepProxy` y métodos `__isProxy`/`__rawTarget` para evitar la creación de proxies reactivos recursivos pesados sobre nodos del estado que son estáticos y de gran volumen (como `parsedLedger`, `analysisResult`, `scoringResult`, `forecastResult`, `cartera` y `auditTrail`).
    *   Exclusividad de la reactividad para claves dinámicas pequeñas y mutables (`approvedAccruals`, `selectedProfile`, etc.), logrando una transición al Paso 5 ("Generar Dashboard Final") extremadamente fluida (<500ms en libros reales pesados) sin degradar la UX ni bloquear el hilo principal del navegador.

### Modificado
*   **Soporte de Parámetros de Control en el Motor Analítico (`js/analyzer.js` y `js/app.js`)**:
    *   Integración del parámetro opcional `options` en `analyzeLedger(..., options)` para poder omitir opcionalmente las anomalías en llamadas internas recursivas y caches temporales (`options.skipAnomalies === true`).
    *   Refactorización del flujo en el botón `btn-goto-dashboard` a un pipeline asíncrono ordenado segmentado con `requestAnimationFrame` que asegura la actualización visual del loader antes de arrancar los cálculos complejos y la rehidratación.

### Verificado
*   **Cobertura del Test Automatizado de Regresión Contable y Funcional (`scratch/verify_flows.js`)**:
    *   Prueba 1: Generación fluida de dashboard con Flowmetrics (EBITDA: `-313.443,29 €`, Trust Score: `43`, 5 anomalías).
    *   Prueba 2: Navegación bidireccional limpia y rehidratación inmediata en modo Cartera para startups individuales.
    *   Prueba 3: Reactividad granular intacta en ajustes dinámicos de periodificación (`STATE.approvedAccruals`) recalculando instantáneamente el EBITDA del mes correspondiente (+50.000 €).
    *   Prueba 4: Integridad absoluta de exportaciones de sesión mediante `session.js`.

---

## [1.3.3] — 2026-05-20 (Fase 2: Gestión de Riesgos de la Cuenta 551 y Microfase de Convergencia)

### Añadido
*   **Reglas analíticas de riesgos en Cuenta Corriente con Socios (cta. 551/550)** en `js/analyzer.js` (`ANOMALY_RULES`):
    *   `prestamos_socios` (Cuenta 551 Deudora - Alto): Detección de saldos deudores netos acumulados mayores a **3.000 €** en la relación corriente con socios (cta. 551/550). Incluye de forma admisible la cuenta 550 (Titular de la explotación) para compatibilidad con autónomos o startups muy tempranas. Advierte explícitamente que el motor evalúa el saldo neto agregado de la cuenta 551/550, lo cual puede enmascarar compensaciones internas entre diferentes socios si no existen subcuentas individualizadas. Conserva el ID unívoco para preservar la compatibilidad absoluta con `defensa.js` y `narrative.js`.
    *   `cuenta_551_acreedora` (Cuenta 551 Acreedora - Alto): Identificación de saldos acreedores netos acumulados superiores a **3.000 €** en el subgrupo 551/550, alertando sobre la presunción legal de préstamo vinculado. Calcula de forma orientativa y como referencia operativa una estimación del devengo al tipo de interés legal de mercado (3,25% para 2026), retenciones teóricas del 19% trimestrales (Modelo 123) y la obligación informativa del Modelo 232 si supera el límite de 250.000 €.

### Modificado/Sincronizado (Microfase de Convergencia)
*   **Alineamiento del Módulo de Cartera (`js/cartera.js`)**:
    *   Consumo directo y canónico de las señales del motor de anomalías centralizado (`analysis.anomalies`) para detectar los riesgos `prestamos_socios` y `cuenta_551_acreedora`.
    *   Eliminación del antiguo umbral heredado de **10.000 €** para la Cuenta 551, estableciendo el umbral unificado de **3.000 €** para relaciones con socios.
    *   Sincronización tridimensional del triage: el saldo neto deudor activa el foco de Financiabilidad y el bloqueador de Saneamiento Socios (Due Diligence); el saldo neto acreedor activa el foco de Financiabilidad y el bloqueador de Saneamiento Socios requiriendo formalización mercantil contractual al tipo de interés legal del 3,25%. Ambos enrutan obligatoriamente a la startup a **Gestoría / Orden Contable**.
*   **Actualización Documental y QA**:
    *   Purga completa de los umbrales heredados de 10.000 € en el Glosario y en la guía operativa (`docs/user_guide.md`).
    *   Rediseño del **Caso de Prueba 4** en `docs/manual_validation.md` para probar de manera cruzada y dual los saldos deudores y acreedores mayores a 3.000 €.


---

## [1.3.2] — 2026-05-20 (Fase 9.1: Integración Mínima de Alto Impacto - ENISA y CDTI)

### Añadido
*   **Reglas analíticas deterministas de alto impacto** en `js/analyzer.js` (`ANOMALY_RULES`):
    *   `cdti_empresa_en_crisis` (Crítico): Evalúa automáticamente el test de crisis de la UE bajo el Reglamento (UE) nº 651/2014, verificando si los Fondos Propios contables (grupos 10, 11, 12) caen por debajo del 50% de la suma del Capital Social suscrito y la Prima de Emisión. Excluye explícitamente las subvenciones de capital (grupo 13) para evitar falsos positivos normativos.
    *   `causa_disolucion_lsc` (Crítico): Compara el Patrimonio Neto estimado general (incluyendo grupo 13 y 14) frente al Capital Social. Advierte de forma explícita al CFO cuando es inferior al 50%, activando los plazos y responsabilidades legales del Art. 363.1.e de la Ley de Sociedades de Capital (LSC).
    *   `ebitda_normalizado_enisa` (Medio): Calcula el EBITDA contable acumulado y deriva automáticamente el "EBITDA Orgánico" restando los apuntes acreedores de la cuenta 730 (activación de I+D) y de la cuenta 746 (subvenciones de capital imputadas a PyG) para reflejar los rigurosos criterios de rating de ENISA.

### Modificado/Corregido
*   **Alineamiento Conceptual de Fondos Propios**: Separación nítida entre el Patrimonio Neto contable general (usado para la disolución legal LSC) y los Fondos Propios elegibles a efectos del test CDTI y paridad ENISA, previniendo distorsiones y falsas alertas.

---

## [1.3.1] — 2026-05-20 (Cierre y Polish de la Fase 9)

### Añadido
*   **Advertencia descriptiva de Periodo Incompleto**: Evaluación automática en `getConfidenceMeta` del número de meses analizados (`months.length < 12`), inyectando de forma clara la advertencia *"El periodo contable analizado es inferior a un año completo (contiene X meses)."* en lugar de la penalizante y alarmante *"No hay certeza sobre la cobertura completa del periodo."*, reservando esta última estrictamente para cuando el usuario declara duda o lagunas temporales intermedias.

### Modificado/Corregido
*   **Robustez del Ratio de Liquidez**:
    *   Control estricto contra pasivos corrientes nulos, negativos o insignificantes (`pc <= 10.0`).
    *   Control contra ratios fuera de rango razonable contable (`ratio < 0` o `ratio > 100.0`).
    *   Integración del badge de advertencia HSL `"⚠️ Verificar balance"` inline en la visualización del KPI cuando se detectan estas condiciones, en lugar de mostrar cifras astronómicas.
*   **Documentación**: Actualización del archivo `README.md` del repositorio para describir detalladamente todas las capacidades de la Fase 9 e inserción del tag de hito de versión `v1.3.1`.

---

## [1.3.0] — 2026-05-20 (Fase 9: Ingesta SaaS & Anomalías Enriquecidas)

### Añadido
*   **Heurísticas SaaS deterministas ("Human-in-the-Loop")** en `js/analyzer.js`:
    *   Detección inteligente de servicios SaaS / hosting cloud (AWS, GCP, Azure, etc.) y pasarelas de pago (Stripe, Paypal) autoasignándose a COGS.
    *   Detección de publicidad online (Google Ads, Facebook Ads) autoasignándose a Marketing.
    *   Sugerencias de confianza media (desarrollo freelance) que no se autoaplican, mostrándose en UI como advertencia interactiva para que el CFO mantenga el control humano.
*   **Badges y Tooltips HSL Premium** en `css/index.css`:
    *   Badges semitransparentes en el Paso 3 (Mapeo Humano) con tooltips descriptivos sobre las sugerencias de la heurística.
    *   Iluminación de filas con sugerencias de confianza media (`.row-review-pending`) con borde ámbar y transiciones fluidas que se eliminan reactivamente tras el click en el selector.
*   **Trazabilidad técnica compacta** en `js/parser.js`:
    *   Implementación de `meta.parserTrace` por hoja conteniendo estrictamente `sheetName`, `headerRowIndex`, `rawHeaders`, `normalizedHeaders`, `status` y `discardReason`, previniendo el crecimiento excesivo de datos.
*   **Enriquecimiento explicativo de Anomalías** en `js/analyzer.js`:
    *   `descuadre_contable` (Crítico): Diferencias mensuales al céntimo.
    *   `meses_sin_amortizacion` (Medio): Falta de registro de amortizaciones listando los meses.
    *   `variacion_brusca_ingresos` (Alto): Desviaciones MoM >40% indicando de forma determinista la subcuenta del Grupo 7 que causó el mayor impacto.
    *   `cuenta_129_detectada` (Alto): Uso irregular del Resultado del Ejercicio fuera del cierre.

### Modificado
*   **Separación estricta Parser vs Analyzer**: El parser se encarga únicamente de la ingesta y saneamiento de datos (`anomalies: []`), mientras que toda la lógica de negocio contable y la deduplicación analítica se centralizan de forma pura en `js/analyzer.js`.
*   **Detección de Columnas Exact-First**: Refuerzo en `detectColumn` para preferir coincidencia exacta antes de coincidencia parcial, evitando que tablas Excel (`Ctrl+T`) o columnas auxiliares ("Debe anterior") secuestren la asignación de columnas core.
*   **Delegación de Eventos en Vista Previa**: Ajustes en `js/app.js` delegando al nivel de documento la paginación, filtros de búsqueda y ordenación, garantizando inmunidad ante re-renders dinámicos.

---

## [1.2.0] — 2026-05-19 (Fase 8: Priorización de Cartera y Routing Interno)

### Añadido
*   **Módulo de Cartera (`js/cartera.js`)**: Diseñado para el triage determinista y enrutado de múltiples startups de forma paralela.
*   **Diagnóstico Tridimensional**:
    *   **Nivel 1 (Foco)**: Caja, Deuda Pública, Financiabilidad, Circulante, Costes o Preparación Financiera.
    *   **Nivel 2 (Bloqueadores)**: Detección automática de contingencias graves (Baja conciliación contable, Deuda fiscal >3.000€, Cuenta corriente con socios 551/550 >3.000€ *(umbral actualizado desde 10.000€ en v1.3.3)*).
    *   **Nivel 3 (Ruta)**: Derivación operativa sugerida (CFO, Fundraising, Financiación Pública, Financiación Bancaria, Gestoría).
*   **Ficha Handoff Express**: Generación de resúmenes formateados listos para copiar con 1-click al portapapeles.
*   **Soporte de Persistencia Dual (`js/session.js`)**: Extensión del formato `.aptki` para admitir el modo `"portfolio"` (empaquetado consolidado de múltiples startups) manteniendo compatibilidad transparente con el modo `"single"`.
*   **UI Ejecutiva de Cartera**: Nueva pestaña de control minimalista con tabla ejecutiva, filtros avanzados y semáforos de prioridad basados en Runway e importación masiva de sesiones.

---

## [1.1.0] — 2026-05-15 (Fase 7: Cockpit de Defensa y Robustez)

### Añadido
*   **Cockpit de Defensa y Supervivencia (`js/defensa.js`)**: Panel de choque para startups en situación crítica (Runway < 4 meses).
*   **Simulador de Circulante e Impacto**: Modelador interactivo para proyectar mejoras en plazos de cobro (DSO), plazos de pago (DPO) y reducciones de gasto operativo sobre la caja disponible.
*   **Acciones de Mitigación de Caja**: Checklist interactivo con 10 medidas de contingencia recomendadas por APTKI.

### Modificado/Corregido
*   **Consistencia DSO/DPO**: Corrección de signos y agregación estricta por prefijo de cuentas (Grupo 43 para clientes deudor, Grupo 40 para proveedores acreedor) en `defensa.js` y `cartera.js`.
*   **Robustez General**: Añadidos controles de *null-safety* en todo el motor contable para evitar errores de renderizado ante libros diarios incompletos.
*   **Fallback del Portapapeles**: Mecanismo robusto con fallbacks en caso de que `navigator.clipboard.writeText` falle en navegadores sin permisos o entornos restringidos.

---

## [1.0.0] — 2026-04-20 (Fase 1 a 6: Base Contable y Diagnóstico)

### Añadido
*   **Ingesta Contable (`parser.js`)**: Parser Excel basado en SheetJS para sopesar la contabilidad de la empresa (PGC español).
*   **Motor Analítico (`analyzer.js`)**: Reclasificación automática de cuentas contables a categorías de negocio de PyG (Ventas, COGS, Margen Bruto, Personal, SG&A, EBITDA).
*   **Motor de Periodificación (Accruals)**: Herramienta para prorratear gastos extraordinarios y normalizar el EBITDA analítico.
*   **Trust Score & Anomalías**: Cálculo automático del nivel de confianza del diario (0-100) en base a descuadres, duplicados e inconsistencias temporales.
*   **Proyección de Forecast (`forecaster.js`)**: Modelado a 12 meses con escenarios base, optimista y pesimista.
*   **Scoring Público (`scorer.js`)**: Evaluación de elegibilidad financiera para líneas ENISA y CDTI Neotec.
*   **Exportador Documental (`exporter.js`)**: Generación de informes en PDF profesional con portada interactiva y hojas de cálculo vivas con fórmulas en Excel.
