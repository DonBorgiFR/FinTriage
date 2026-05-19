# APTKI Workstation — CFO & Portfolio Toolkit

APTKI Workstation es la plataforma profesional client-side de análisis y triage financiero desarrollada para consultores senior de **APTKI**. Esta herramienta automatiza la ingesta de libros contables del Plan General Contable (PGC) español, diagnosticando la consistencia interna, recalculando márgenes analíticos, proyectando escenarios de caja e implementando un módulo multicompañía para controlar y enrutar carteras de startups.

---

## 1. Problema que Resuelve

Los consultores de APTKI a menudo se enfrentan a contabilidades rígidas, retrasadas o desordenadas de múltiples startups a la vez. Extraer información estratégica de un libro diario en Excel (.xlsx) requiere horas de reordenamiento manual. 

APTKI Workstation resuelve esto de forma instantánea:
*   **Decodifica el caos contable**: Lee diarios en formato nativo, identifica descuadres y evalúa la fiabilidad del dato mediante un **Trust Score (0-100)**.
*   **Normaliza el EBITDA**: Automatiza y periodifica (devengos) picos atípicos de gasto sin alterar la contabilidad base.
*   **Triage Multicompañía Inteligente**: Permite controlar de 3 a 4 startups bajo presión de forma simultánea, detectando bloqueadores críticos de due diligence (como deudas fiscales o préstamos a socios en la cuenta 551) y recomendando el plan de acción exacto para cada una.

---

## 2. Stack y Arquitectura General

La aplicación está diseñada bajo la filosofía **Local-First**, garantizando confidencialidad absoluta a nivel bancario, ya que el 100% de los datos se procesan localmente en el navegador del usuario y nunca se transmiten a servidores externos.

*   **Frontend**: HTML5 Semántico, Vanilla Javascript (ES6+) y CSS nativo con estética moderna de alto contraste (Glassmorphism oscuro, bordes sutiles, micro-animaciones reactivas).
*   **Reactividad**: Motor reactivo nativo implementado con **Javascript Deep Proxies** en el estado global (`STATE`), coordinando automáticamente vistas y flujos sin dependencias de frameworks pesados.
*   **Procesamiento de Libros**: Integración con **SheetJS** para ingesta ultrarrápida de libros diarios grandes en formato `.xlsx`.
*   **Representación Visual**: Generación nativa de gráficos estadísticos y de cascada interactivos mediante SVG manipulados dinámicamente.
*   **Exportación**: Integración con **html2pdf.js** para reportes con portada ejecutiva y exportaciones vivas a Excel con fórmulas dinámicas.

---

## 3. Módulos Principales

| Módulo | Archivo | Responsabilidad / Función |
|--------|---------|---------------------------|
| **Store** | `store.js` | Motor de Estado Reactivo centralizado (Deep Proxy) y patrón Observer. |
| **Parser** | `parser.js` | Ingesta Excel (.xlsx), saneamiento temporal contable y anomalías de nivel 1. |
| **Analyzer** | `analyzer.js` | Motor de reglas declarativo, Trust Score, clasificación a PyG analítica y motor de devengos. |
| **Cartera** | `cartera.js` | Triage tridimensional multicompañía, semáforos de urgencia y routing por equipos. |
| **Defensa** | `defensa.js` | Cockpit de supervivencia de caja, cálculo de DSO/DPO reales y simulador de circulante. |
| **Scorer** | `scorer.js` | Evaluación de elegibilidad financiera para líneas ENISA y CDTI Neotec. |
| **Forecaster** | `forecaster.js` | Proyección estadística a 12 meses con escenarios (optimista, base, pesimista). |
| **Session** | `session.js` | Persistencia unificada local de archivos de sesión en formato `.aptki`. |
| **Narrative** | `narrative.js` | Motor de análisis textual para disclaimers y comentarios de EBITDA. |
| **Checklist** | `checklist.js` | Framework interactivo "Filtro Día 1" con biblioteca de reglas. |
| **Exporter** | `exporter.js` | Exportaciones dinámicas con fórmulas a Excel y PDFs con portada interactiva. |
| **App** | `app.js` | Controlador SPA principal, ruteador de vistas, manipulación del DOM y Audit Trail. |

---

## 4. Flujo de Uso Básico

```
[Libro Diario .xlsx] o [Sesión .aptki]
                │
                ▼
        [session.js] (Detección automática de formato)
         /        \
        /          \
  (Single Mode)    (Portfolio Mode)
      /              \
     ▼                ▼
[Dashboard Individual] ──► [Tabla de Control de Cartera]
 - Periodificaciones        - Triage Tridimensional
 - Scoring ENISA/CDTI       - Filtros por Ruta e Hitos
 - Cockpit de Defensa       - Copiado de Handoff Express 📋
 - Proyecciones 12M         - Transición con 1-click a Dashboard
```

1.  **Ingesta de Datos**: Arrastre un libro diario contable `.xlsx` o cargue uno o varios archivos de sesión `.aptki`.
2.  **Triage de Cartera**: Controle de un vistazo el panel multicompañía, visualizando el semáforo de urgencia, runway, problemas principales y bloqueadores de cada startup.
3.  **Handoff Express**: Copie la ficha sintética de triage de cualquier startup con un solo clic en la tabla para comunicarla inmediatamente a los equipos.
4.  **Análisis Profundo (Dashboard)**: Entre al detalle de cualquier compañía para reclasificar cuentas, aplicar periodificaciones contables, completar el Checklist Día 1 y simular planes de supervivencia de caja.
5.  **Exportación y Cierre**: Guarde la sesión de forma individual o agregada en formato `.aptki` para retomar el trabajo al día siguiente sin fricciones.

---

## 5. Formato Unificado de Persistencia `.aptki`

El sistema interactúa de forma transparente con dos esquemas del formato JSON local `.aptki`:

*   **Modo Individual (`mode: "single"`)**: Almacena el ledger parseado de una startup, mapeos contables personalizados modificados por el consultor, periodificaciones aprobadas, checklist Día 1, audit trail e inputs de simulaciones de caja.
*   **Modo Cartera (`mode: "portfolio"`)**: Consolida la lista completa de startups en un único archivo. Cada startup en el array encapsula su nombre, arquetipo y su payload de `sessionData` individual completo, permitiendo la rehidratación profunda al transicionar de vista.

---

## 6. Fases Implementadas hasta Hoy

*   **Fases 1 a 6 (Base y Core Analítico)**: Ingesta contable estructurada, categorización del PGC a PyG, Trust Score y anomalías declarativas, simulaciones de forecast estadístico, checklist Día 1 de orden contable, scoring público de ENISA/CDTI, y exportadores dinámicos.
*   **Fase 7 (Cockpit de Supervivencia y Robustez)**: Módulo de Defensa de caja ante runways críticos (<4 meses), agregación correcta de DSO/DPO por prefijo con signos contables precisos, null-safety integrado frente a diarios vacíos, y portapapeles seguro de alta compatibilidad.
*   **Fase 8 (Gestión de Cartera y Routing Operativo)**: Ingesta en lote de múltiples sesiones, motor de triage tridimensional determinista (Foco Principal, Bloqueador, Ruta), persistencia unificada dual en archivos `.aptki` y ficha Handoff Express para derivar casos fácilmente.

---

## 7. Cómo Validar Manualmente la Fase 8

Para verificar la correcta operatividad del módulo Cartera:
1.  **Carga Masiva**: Carga múltiples archivos `.aptki` en la sección principal y confirma que la vista cambia a la tabla de Cartera con todas las startups listadas.
2.  **Verificación de Bloqueos**:
    *   Carga una sesión con deuda en el Grupo 47 > 3.000€ y valida que el sistema marque el bloqueador *"Regularización Deuda Pública"* y lo envíe a la ruta *"Gestoría"*.
    *   Carga una sesión con saldo deudor en la cuenta 551/552 > 10.000€ y verifica que el bloqueador *"Saneamiento Socios (Due Diligence)"* se active redirigiéndola a *"Gestoría"*.
3.  **Ficha Handoff**: Haz clic en el botón de portapapeles `📋` en cualquier fila de la tabla y pega el texto en un editor; confirma que muestra los datos de triage exactos.
4.  **Transición Limpia**: Haz clic en *"Analizar"* `➜` en una startup de la cartera y comprueba que se rehidrata el Dashboard completo con sus datos específicos.

---

## 8. Documentación de Referencia

El repositorio cuenta con las siguientes guías de referencia técnica y operativa:
*   **[Guía de Uso Operativa](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/docs/user_guide.md)** — Manual práctico para consultores en contexto de trabajo real con startups.
*   **[Protocolo de Validación Manual](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/docs/manual_validation.md)** — Los 5 Test Cases detallados paso a paso para la verificación del sistema.
*   **[Especificación de Arquitectura](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/docs/architecture.md)** — Estructura de flujos, reactividad de deep proxy, audit trail y reglas del motor.
*   **[Especificación del Formato .aptki](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/docs/session_format.md)** — Estructura de datos JSON unificados para persistencia dual.

---

## 8. Roadmap Corto (Próximos Pasos)

1.  **Copiloto IA Financiero (Fase 9)**: Integración de un motor local de lenguaje para interpretar la Ficha de Handoff y automatizar la redacción de informes narrativos de due diligence.
2.  **Score Avanzado de Financiación Bancaria**: Incorporación de reglas de scoring basadas en el rating tradicional de entidades bancarias españolas (CIRBE y capacidad de servicio de la deuda).
3.  **Conexión API Bancaria (PSD2)**: Módulo opcional de ingesta de movimientos bancarios en tiempo real para contrastar la conciliación de caja sin depender del diario.
