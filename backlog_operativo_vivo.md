# Backlog Operativo Vivo — APTKI Workstation

> [!NOTE]
> Este documento representa la hoja de ruta dinámica y viva de la APTKI Workstation. Se abandona la nomenclatura de "Fases" rígidas en favor de un enfoque iterativo basado en 5 líneas de trabajo paralelas, priorizadas según validaciones y casos reales.

---

## 1. Las 5 Líneas Activas

### 📈 Línea 1: Core Contable y Confianza
* **Propósito**: Robustez de la ingesta de diarios y exactitud matemática en el cálculo del `Confidence Engine`.
* **Estado Actual**: 
  - Ingesta de diarios normalizada y `Confidence Engine` unificado en `analyzer.js`.
  - Detección inmutable de duplicados, redondeos y asientos descuadrados funcional en `parser.js` and `analyzer.js`.
* **Riesgos Pendientes**:
  - Alerta de amortizaciones mensuales marcando a ciegas criterios de periodificación no lineales como fallos técnicos graves.
  - Tratamiento inflexible de pequeños descuadres de redondeo (Stripe, céntimos) bajando drásticamente el Trust Score de libros sanos.
  - Uso de la cuenta 129 tratada uniformemente como "cierre" sin detectar si está dispersa en periodos intermedios.
* **Mejoras Candidatas**:
  - **[PRÓXIMA ITERACIÓN - MICRO-SPRINT 1]** Refinamiento inteligente del motor de anomalías (descuadres por materialidad, amortizaciones selectivas y análisis de cuenta 129).
  - Flexibilización selectiva de filtros en base al perfil (`saas` vs `industrial`).
  - Detección adaptativa de regularidad mensual en subgrupos PGC para evitar falsos positivos en provisiones estructuradas.

### 💻 Línea 2: Experiencia Operativa y UI
* **Propósito**: Consumo del estado reactivo de la UI, usabilidad de grids y visualizaciones interactivas fluida.
* **Estado Actual**:
  - Grids reactivos con ordenación aritmética rápida y paginación desacoplada en `ui.entries`.
  - Estilos de diseño Dark Glassmorphism unificados bajo clases específicas de `index.css`.
* **Riesgos Pendientes**:
  - Degradación de rendimiento al re-renderizar el DOM de forma destructiva durante entradas masivas (>20k filas).
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
  - **Simulación Dinámica de Caja**: Sliders interactivos en la UI para modular el OPEX y las ventas en escenarios futuros, recalculando el Runway dinámicamente sobre clones de datos aislados (Movido a mejoras candidatas siguientes).
  - Exportador unificado de reportes de defensa CFO en formato de texto enriquecido para uso directo en correos o plataformas externas.

### 📊 Línea 4: Cartera y Priorización
* **Propósito**: Vista consolidada y jerárquica de múltiples startups para fondos de Venture Capital o Directores Financieros externos.
* **Estado Actual**:
  - Estructura y almacenamiento básico de cartera implementado en `cartera.js`.
* **Riesgos Pendientes**:
  - Sobrecarga de memoria global al mantener abiertos en el `STATE` los libros diarios brutos de múltiples startups de forma concurrente.
* **Mejoras Candidatas**:
  - **Dashboard Comparativo de Oxígeno**: Panel consolidado en la pestaña Cartera que compare de forma gráfica (ej. barras nativas en cascada) el Runway e ingresos de todas las startups (Movido a mejoras candidatas siguientes).
  - Lazy Loading de apuntes detallados: Mantener en memoria persistente solo los KPI y metadatos agregados de cada startup.

### 🛠️ Línea 5: Calidad, Validación y Documentación
* **Propósito**: Cumplimiento del `DATA_CONTRACT.md`, inmutabilidad del flujo contable y optimización de rendimiento técnica.
* **Estado Actual**:
  - Test de rendimiento ejecutado de forma exitosa (15.000 filas procesadas en 26.86 ms).
  - Contrato de datos purgado al 100% de propiedades redundantes e inestables.
* **Riesgos Pendientes**:
  - Introducción involuntaria de lógicas síncronas bloqueantes en hilos del DOM durante futuras iteraciones de cálculo complejo.
* **Mejoras Candidatas**:
  - **[PRÓXIMA ITERACIÓN - MICRO-SPRINT 1]** Documentar 3-5 casos reales de validación contable usando el libro diario de FlowMetrics como caso de prueba.
  - Suite de validación en tiempo de ejecución (Run-time Schema Validator) que monitorice si los payloads generados por `analyzer.js` coinciden exactamente con la firma de `DATA_CONTRACT.md`.

---

## 2. Validación Real — FlowMetrics (Hallazgos del Libro)

La validación operativa sobre el libro diario real de **FlowMetrics S.L.** (caso `FNZ_01`) ha revelado las siguientes inconsistencias y peculiaridades de diseño contable que exigen un motor analítico más consultivo y matizado:

1. **Amortizaciones Omitidas en Períodos Aislados (El caso "Abril 2025")**:
   - *Hallazgo Real*: En el libro diario, de enero a junio de 2025, se registran de manera recurrente e idéntica cuotas mensuales de amortización de inmovilizado por valor de **1.404,45€** (cuentas 68000001 y 68100001). Sin embargo, en **abril 2025**, no existe ningún asiento de amortización registrado.
   - *Comportamiento legacy*: La regla detecta que abril carece de amortización y lo marca como una anomalía genérica de nivel de gravedad uniforme, sin dar información aclaratoria útil.
   - *Refinamiento exigido*: El motor debe ser capaz de discernir entre:
     - **Inconsistencia en amortización recurrente** (cuando falta amortización en meses aislados intermedios existiendo amortización en la mayoría de los demás). Severidad: `medium` (posible descuido u omisión técnica).
     - **Criterio discrecional trimestral/anual** (cuando la amortización solo se registra acumulada al cierre de trimestres o al final del año). Severidad: `low` (práctica contable aceptada que no supone un error del libro).

2. **Descuadres Contables Mensuales y Materialidad Relativa**:
   - *Hallazgo Real*: El cuadre a céntimos o diferencias por redondeos de plataformas de pago como Stripe en diarios extensos (>10k asientos) distorsiona el Trust Score si se trata con severidad absoluta.
   - *Comportamiento legacy*: Cualquier descuadre superior a 1€ se penalizaba de igual manera con severidad `high`.
   - *Refinamiento exigido*: Introducir la **materialidad relativa** comparando la diferencia absoluta de descuadre del mes contra el volumen del Debe del mes:
     - Redondeos o diferencias insignificantes (de hasta 50€ y $< 0.05\%$ del volumen del mes) se penalizan con severidad `medium`/`low`.
     - Descuadres materiales (superiores a 100€ o $> 0.1\%$) se mantienen con severidad `high`.
     - Descuadres críticos (superiores a 1.000€ o $> 1\%$) ascienden a severidad `critical` bloqueando la fiabilidad del análisis.

3. **Análisis de la Cuenta 129 (Resultado del Ejercicio)**:
   - *Hallazgo Real*: La cuenta 129 es de uso obligatorio para la regularización de gastos e ingresos y el cierre del ejercicio contable (habitualmente diciembre o el mes final del diario) y en el asiento de apertura del siguiente año.
   - *Comportamiento legacy*: Reportar anomalía `low` genérica simplemente al detectar la cuenta 129 en cualquier apunte, sin importar la fecha ni el contexto.
   - *Refinamiento exigido*: El motor debe analizar si el uso de la cuenta 129 es:
     - **Uso Estructurado (Cierre/Apertura)**: Se encuentra restringido *únicamente* al último mes del ejercicio registrado o al primer mes (enero/apertura). Se cataloga como conforme.
     - **Uso Disperso**: Se detectan apuntes de la cuenta 129 en meses intermedios (ej. marzo, mayo...) o de forma desordenada en el ejercicio. Severidad: `medium` / `high`, ya que distorsiona la PyG y el balance del periodo.

---

## 3. Micro-Sprint 1 Repriorizado: Refinamiento de Anomalías y Casos Reales

### A. Alcance Cerrado y Archivos
1. **`workstation/js/parser.js`** y **`workstation/js/analyzer.js`**:
   - **Descuadres Mensuales (Materialidad)**: Modificar la regla de descuadre mensual para calcular la materialidad relativa de la diferencia del mes respecto a la suma del Debe de dicho mes. Ajustar dinámicamente el nivel de severidad (`medium`, `high`, `critical`) y el cálculo del trustScore final consecuente.
   - **Amortizaciones recurrentes vs discrecionales**: Refinar el análisis de la cuenta 68 para reportar severidad `medium` con mensaje de "Posible omisión de amortización recurrente" sólo si falta en meses aislados intermedios de una serie mayoritaria. Reportar severidad `low` con mensaje explicativo de "Criterio de amortización concentrada (trimestral/anual)" si solo se detecta en periodos agrupados.
   - **Uso Disperso de la Cuenta 129**: Analizar la distribución de apuntes de la cuenta 129. Si se restringe al último o al primer mes, omitir la anomalía o reportar severidad informativa/nula. Si se usa en meses intermedios, lanzar una anomalía de nivel `medium`/`high` alertando de posible distorsión.
2. **`workstation/docs/casos_validacion_flowmetrics.md`** **[NEW]**:
   - Documentar la suite de 3-5 casos de validación real basada en los datos analizados del libro de FlowMetrics S.L. (caso `FNZ_01`), detallando los inputs contables del libro y los outputs esperados del motor refinado.

### B. Criterios de Aceptación Verificables
* [ ] **Cálculo de Descuadres**: Un mes con descuadre de 35€ y volumen de transacciones de 150.000€ se reporta con severidad `medium` y una penalización proporcional menor en el Trust Score, mientras que un descuadre de 1.200€ o $>1\%$ del volumen mensual se reporta como `critical` con un cap de confianza automática a `indicative`/`blocked` (Trust Score < 40).
* [ ] **Caso de Amortizaciones (FlowMetrics)**: Al analizar el diario real de FlowMetrics, el motor detecta la omisión exclusiva de abril 2025 (5 meses con amortización, 1 mes sin ella) y lanza una anomalía de severidad `medium` etiquetada como "Omisión en amortización mensual recurrente (posible descuido técnico en abril)".
* [ ] **Caso de Cuenta 129**: El uso de la cuenta 129 en el asiento de apertura del mes de Enero o regularización del mes de Diciembre no emite ninguna anomalía contable de gravedad. Su presence en meses intermedios reporta severidad `medium`/`high`.
* [ ] **Rendimiento**: El tiempo de cálculo de anomalías refinadas en `parser.js` y `analyzer.js` no incrementa el tiempo total de análisis en más de **1.0 ms** en un dataset de 15.000 filas.

### C. Riesgos Identificados en esta Iteración
* **Cómputo en Bucle Caliente**: La suma del Debe mensual y el análisis por mes de la cuenta 129 y 68 se realizarán de manera centralizada aprovechando la agrupación ya hecha en `byMonth` en lugar de recorrer iterativamente el array plano de entries por cada regla, protegiendo el presupuesto de rendimiento síncrono del hilo principal.
