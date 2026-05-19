# Backlog Operativo Vivo — APTKI Workstation

> [!NOTE]
> Este documento representa la hoja de ruta dinámica y viva de la APTKI Workstation. Se abandona la nomenclatura de "Fases" rígidas en favor de un enfoque iterativo basado en 5 líneas de trabajo paralelas, priorizadas según validaciones y casos reales.

---

## 1. Las 5 Líneas Activas

### 📈 Línea 1: Core Contable y Confianza
* **Propósito**: Robustez de la ingesta de diarios y exactitud matemática en el cálculo del `Confidence Engine`.
* **Estado Actual**: 
  - Ingesta de diarios normalizada y `Confidence Engine` unificado en `analyzer.js`.
  - Detección inmutable de duplicados, redondeos y asientos descuadrados funcional.
* **Riesgos Pendientes**:
  - Falsos positivos en reglas de auditoría automáticas (ej. igualas profesionales recurrentes marcadas falsamente como anomalías críticas de cifras redondas).
  - Diarios no estandarizados (cuentas con longitudes de dígitos heterogéneos) que rompen los prefijos de clasificación.
* **Mejoras Candidatas**:
  - Flexibilización selectiva de filtros en base al perfil (`saas` vs `industrial`).
  - Detección adaptativa de regularidad mensual en subgrupos PGC para evitar falsos positivos en provisiones estructuradas.

### 💻 Línea 2: Experiencia Operativa y UI
* **Propósito**: Consumo del estado reactivo de la UI, usabilidad de grids y visualizaciones interactivas fluida.
* **Estado Actual**:
  - Grids reactivos con ordenación aritmética rápida y paginación desacoplada en `ui.entries`.
  - Estilos de diseño Dark Glassmorphism unificados bajo clases específicas de `index.css`.
* **Riesgos Pendientes**:
  - Degradación de rendimiento al re-renderizar el DOM de forma destructiva durante entradas masivas (>20k filas) en navegadores móviles u ordenadores de baja especificación.
* **Mejoras Candidatas**:
  - Implementación de un renderizador parcial de filas virtuales para mitigar la sobrecarga de nodos en el DOM.
  - Persistencia local automática de la posición de scroll y filtros al transicionar entre vistas SPA.

### 🛡️ Línea 3: Defensa y Caja
* **Propósito**: Herramientas analíticas y simulaciones para defender la viabilidad financiera de las empresas ante comités institucionales (ENISA, CDTI, Bancos).
* **Estado Actual**:
  - Cockpit de supervivencia e ineficiencias básicas funcional en `defensa.js`.
  - Generador de alegaciones contables automatizado y renderizado de plan de choque interactivo.
* **Riesgos Pendientes**:
  - Mutación accidental del estado central al realizar simulaciones de balance, rompiendo la inmutabilidad de los datos brutos.
* **Mejoras Candidatas**:
  - **Simulación Dinámica de Caja**: Sliders interactivos en la UI para modular el OPEX y las ventas en escenarios futuros, recalculando el Runway dinámicamente sobre clones de datos aislados.
  - Exportador unificado de reportes de defensa CFO en formato de texto enriquecido para uso directo en correos o plataformas externas.

### 📊 Línea 4: Cartera y Priorización
* **Propósito**: Vista consolidada y jerárquica de múltiples startups para fondos de Venture Capital o Directores Financieros externos.
* **Estado Actual**:
  - Estructura y almacenamiento básico de cartera implementado en `cartera.js`.
* **Riesgos Pendientes**:
  - Sobrecarga de memoria global al mantener abiertos en el `STATE` los libros diarios brutos de múltiples startups de forma concurrente.
* **Mejoras Candidatas**:
  - **Dashboard Comparativo de Oxígeno**: Panel consolidado en la pestaña Cartera que compare de forma gráfica (ej. barras nativas alineadas en cascada) el Runway (meses de oxígeno) e ingresos anuales de todas las startups activas.
  - Lazy Loading de apuntes detallados: Mantener en memoria persistente solo los KPI y metadatos agregados de cada startup, cargando el diario de 15k filas únicamente bajo demanda explícita.

### 🛠️ Línea 5: Calidad, Validación y Documentación
* **Propósito**: Cumplimiento del `DATA_CONTRACT.md`, inmutabilidad del flujo contable y optimización de rendimiento técnica.
* **Estado Actual**:
  - Test de rendimiento ejecutado de forma exitosa (15.000 filas procesadas en 26.86 ms).
  - Contrato de datos purgado al 100% de propiedades redundantes e inestables.
* **Riesgos Pendientes**:
  - Introducción involuntaria de lógicas síncronas bloqueantes en hilos del DOM durante futuras iteraciones de cálculo complejo.
* **Mejoras Candidatas**:
  - Suite de validación en tiempo de ejecución (Run-time Schema Validator) que monitorice si los payloads generados por `analyzer.js` coinciden exactamente con la firma de `DATA_CONTRACT.md`.

---

## 2. Propuesta de Micro-Sprint (Próxima Iteración)

> [!IMPORTANT]
> Basándonos en la necesidad de dotar a la plataforma de mayor capacidad analítica interactiva y multi-empresa, la siguiente iteración se centrará en dos frentes altamente operativos y de nulo storytelling.

### 🎯 Micro-Sprint 1: Simulación Dinámica y Tablero de Oxígeno

#### A. Alcance Cerrado y Archivos
1. **`workstation/js/defensa.js`**:
   - Implementar panel interactivo de simulación contable con sliders de alteración OPEX (-30% a +30%) y ventas (-20% a +50%).
   - La simulación debe calcular el Runway dinámico aplicando variaciones sobre una copia pura (Deep Clone) del `STATE.analysisResult`, **nunca** mutando el estado de origen.
2. **`workstation/js/cartera.js`**:
   - Diseñar el **Tablero de Oxígeno**: Renderizar una tabla comparativa con barras horizontales de progreso nativas (CSS) que visualicen el Runway actual de cada startup guardada en la cartera de forma unificada.
3. **`workstation/css/index.css`**:
   - Incorporar variables y estilos para los sliders de rango y las barras horizontales de progreso con estética Dark Glassmorphism.

#### B. Criterios de Aceptación Verificables
* [ ] Recalcular el Runway simulado al mover los sliders tarda menos de **5.0 ms** en responder, evitando bloqueos visuales en el DOM.
* [ ] La pestaña "Cartera" lista de forma integrada todas las startups registradas, indicando claramente la fecha del último análisis y su Runway con un degradado semáforo (Verde ≥ 6 meses, Amarillo 3-6 meses, Rojo < 3 meses).
* [ ] Mutar la simulación en "Defensa" **no altera** bajo ninguna circunstancia el Trust Score, EBITDA u otras variables inmutables del Dashboard Principal.

#### C. Riesgos Identificados en esta Iteración
* **Debounce de Sliders**: El movimiento constante del ratón sobre un control tipo `range` puede disparar decenas de cálculos de forecast en menos de un segundo. Se implementará un mecanismo de `requestAnimationFrame` para encolar la actualización visual del cálculo a un ritmo máximo de 60Hz.
