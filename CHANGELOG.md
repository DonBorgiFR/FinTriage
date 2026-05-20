# CHANGELOG — APTKI Workstation

Historial de versiones y evolución del CFO Toolkit de APTKI.

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
    *   **Nivel 2 (Bloqueadores)**: Detección automática de contingencias graves (Baja conciliación contable, Deuda fiscal >3.000€, Cuenta corriente con socios >10.000€).
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
