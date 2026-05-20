# Modelo de Debt Capacity para Startups Tecnológicas en España
### Investment Banking Framework: Early Stage a Growth Stage

***

## Executive Summary

Este informe proporciona un marco integral de **Capacidad de Deuda (Debt Capacity)** para startups tecnológicas en el mercado español, desde la fase Early Stage hasta Growth Stage. Se abordan los límites de apalancamiento público (ENISA), el análisis comparativo entre Venture Debt y deuda bancaria tradicional, las métricas SaaS que habilitan el acceso al crédito, y un modelo de simulación para el mix óptimo de financiación. El objetivo es dotar al CFO de una startup de las herramientas analíticas necesarias para maximizar la capacidad de crecimiento sin comprometer la solvencia societaria ni incurrir en causas de disolución bajo la legislación española.

***

## 1. Límites de Apalancamiento Público: ENISA y la Regla de Coinversión 1:1

### 1.1 La Regla de Oro: Fondos Propios ≥ Importe Solicitado

La regla estructural más importante de los préstamos participativos de ENISA es la **paridad de fondos propios**: el patrimonio neto contable de la empresa debe ser igual o superior al importe del préstamo que se solicita. Esta regla actúa como mecanismo de coinversión implícita: el sector privado (socios, inversores) debe haber comprometido capital por al menos el mismo importe que el Estado aporta. No hay excepciones por perfil de proyecto ni por el track record del equipo.[^1][^2][^3][^4]

El límite global por cliente en ENISA no puede superar los **1.500.000 €**, computando tanto el riesgo directo de la empresa como el indirecto a nivel de grupo. Las tres líneas principales se estructuran así:[^5][^6]

| Línea ENISA | Importe máximo | Requisito fondos propios | Plazo máximo | Carencia |
|---|---|---|---|---|
| Jóvenes Emprendedores (<40 años) | 75.000 € | No exigido | 7 años | 5 años |
| Emprendedores (empresa ≤2 años) | 300.000 € | = Importe solicitado | 7 años | 5 años |
| Crecimiento | 1.500.000 € | = Importe solicitado | 9 años | 7 años |

### 1.2 Cálculo Exacto de los Fondos Propios Corregidos

ENISA utiliza el concepto de **fondos propios contables** tal como aparecen en el balance del último ejercicio cerrado, con las siguientes partidas sumantes y restantes:[^2][^7]

**Fórmula de Fondos Propios Corregidos (ENISA):**

\[
FP_{ENISA} = CS + PE + R_{leg} + R_{vol} + BN_{retenidos} - P_{acumuladas}
\]

Donde:
- \(CS\) = Capital Social desembolsado e inscrito en el Registro Mercantil
- \(PE\) = Prima de Emisión de participaciones (rondas previas)
- \(R_{leg}\) = Reserva Legal
- \(R_{vol}\) = Reservas Voluntarias
- \(BN_{retenidos}\) = Beneficios netos de ejercicios anteriores retenidos
- \(P_{acumuladas}\) = Pérdidas acumuladas (restan del total)

**Partidas EXCLUIDAS explícitamente** del cálculo:[^3][^2]
- Préstamos de socios **no capitalizados** (aunque sean subordinados)
- Subvenciones concedidas pendientes de cobro
- Cualquier pasivo exigible, aunque sea a largo plazo
- El resultado del ejercicio **en curso** (solo se computan los cerrados)

> **Nota crítica sobre la prima de emisión:** La prima de emisión generada en rondas de inversión (Seed, Serie A) sí computa como fondos propios, siempre que la ampliación de capital esté **inscrita en el Registro Mercantil** en el momento de presentar la solicitud. Este es el error más frecuente: una ronda cerrada pero no inscrita no computa.[^3]

### 1.3 Fondos Propios Medios y el Tipo de Interés Variable (Segundo Tramo)

ENISA aplica un tipo de interés en dos tramos:[^8]
- **Tramo fijo:** diferencial sobre Euríbor (publicado anualmente por ENISA para cada línea)
- **Tramo variable:** calculado sobre la rentabilidad financiera de la empresa (Resultado antes de impuestos / Fondos Propios Medios del ejercicio)

La fórmula de **Fondos Propios Medios** es:[^8]

\[
FP_{medios} = \frac{FP_{inicio\_ejercicio} + FP_{fin\_ejercicio}}{2}
\]

Donde **no se incluye el resultado del año corriente** en ninguno de los dos extremos. Un FP medio elevado reduce el tipo variable, lo que incentiva a las startups a mantener una base de capital sólida.

### 1.4 Ejemplo Práctico: Cálculo Pre-Solicitud ENISA

**Startup SaaS "TechCo S.L."** — Solicita 300.000 € línea Emprendedores:

| Partida | Importe | ¿Computa? |
|---|---|---|
| Capital Social inscrito en RM | 50.000 € | ✅ Sí |
| Prima de Emisión (ronda Seed, inscrita) | 180.000 € | ✅ Sí |
| Reserva Legal | 5.000 € | ✅ Sí |
| Reservas Voluntarias | 10.000 € | ✅ Sí |
| Resultado negativo año anterior | -45.000 € | ❌ Resta |
| Préstamo socio no capitalizado | 80.000 € | ❌ No computa |
| **FONDOS PROPIOS CORREGIDOS** | **200.000 €** | — |

**Resultado:** TechCo S.L. solo puede solicitar hasta **200.000 €**, no los 300.000 € deseados. Para acceder al tope de 300.000 €, debe ampliar capital en 100.000 € adicionales (o capitalizar el préstamo del socio), inscribirlo en el RM y entonces re-presentar la solicitud.[^9][^2]

***

## 2. Venture Debt vs. Deuda Bancaria Tradicional

### 2.1 Landscape del Mercado Español

Las startups españolas captaron **2.300 M€ en deuda en 2024**, superando por primera vez los 1.900 M€ en venture equity. Los principales proveedores de venture debt especializados en el mercado español son Inveready, Sabadell Venture Debt, BBVA Spark y operadores pan-europeos como re:cap. La deuda bancaria comercial y las líneas ICO completan el ecosistema, aunque con criterios de aprobación sustancialmente distintos.[^10]

### 2.2 Tabla Comparativa: Venture Debt vs. Deuda Bancaria

| Criterio | Venture Debt (Inveready / Sabadell) | Líneas ICO | Banco Comercial |
|---|---|---|---|
| **Etapa mínima** | Seed – Serie B | ≥4 años de actividad | ≥3 años actividad con rentabilidad |
| **Ticket habitual** | 500K€ – 10M€ | hasta 12,5M€ | 50K€ – 5M€ |
| **Tipo de interés** | 8% – 15% anual | Euríbor + 0,75% – 1,75% | Euríbor + 2% – 4% |
| **Warrants / equity kicker** | 10% – 25% del importe en equity | Ninguno | Ninguno |
| **Dilución efectiva** | 1% – 2% capital | 0% | 0% |
| **Garantías reales** | No exige avales personales | Sin garantías (con aval público) | Avales personales / hipotecas |
| **Covenants** | Hitos de crecimiento (MRR, ARR) | No impago ICO previo | DSCR, Deuda/EBITDA, PN positivo |
| **Plazo amortización** | 36 – 48 meses | 5 – 10 años | 3 – 7 años |
| **Carencia principal** | 12 meses | hasta 5 años | 6 – 12 meses |
| **Criterio principal** | Respaldo VC + growth metrics | Viabilidad + antigüedad + auditorías | Cash flow histórico + colateral |

Fuentes:[^11][^12][^13][^14][^15]

### 2.3 Estructura Detallada del Venture Debt en España

**Inveready Venture Debt** opera con tickets entre **500K€ y 5M€** por compañía, con préstamos estructurados en tramos vinculados a hitos cuando superan los 2M€. La carencia es de 12 meses y la amortización se extiende entre 36 y 48 meses. La característica más singular es que participan con el **25% del importe del préstamo en acciones liberadas desde el día 0** — es decir, por cada millón de préstamo, 250.000€ adicionales entran como equity al precio de la última ronda. Invierten preferentemente en startups **B2B SaaS con tendencia positiva hacia el breakeven**, descartando explícitamente empresas con gasto descontrolado, fundadores muy diluidos, métricas de retención bajas o exceso de deuda previa.[^11]

**Sabadell Venture Debt**, en alianza con el Banco Europeo de Inversiones, ofrece soluciones hasta **10M€** en operaciones de scale-up. Los vencimientos son típicamente de **36 meses con carencia de 6-12 meses**, y los intereses oscilan entre el **10% y 15%** (mensual o trimestral). La cobertura de warrants en el mercado español puede alcanzar hasta el **25% en compañías early-stage**.[^16][^12][^17]

**ICO Crecimiento (2026)** — con 1.000M€ de dotación — es la alternativa pública directa para empresas con **mínimo 4 años de actividad** que no acceden al crédito bancario. Requiere cuentas auditadas de los dos últimos ejercicios o aval público, y está orientado a empresas con probabilidades de impago estimadas entre el 2% y el 6%, lo que excluye a la mayoría de startups en pérdidas.[^14]

### 2.4 Covenants Habituales en Venture Debt Español

Los fondos de venture debt suelen exigir covenants adaptados al perfil startup:[^13][^18]

- **Covenant de runway mínimo:** la startup debe mantener >6 meses de runway en todo momento
- **Covenant de MRR/ARR growth:** crecimiento interanual positivo, generalmente >20% anual
- **Covenant de NRR (Net Revenue Retention):** >90% como umbral crítico
- **Reportes periódicos:** métricas mensuales (MRR, burn, runway, churn)
- **Negative pledge:** la startup no puede pignorar los activos a otros acreedores sin consentimiento
- **Change of control:** el préstamo es exigible si hay un cambio de control no consentido

***

## 3. Métricas SaaS / Operativas que Habilitan la Deuda

### 3.1 El Marco de Evaluación del Acreedor

Todo acreedor de venture debt responde, en esencia, a una sola pregunta: **¿puede esta empresa devolver el dinero y seguirá operando cuando llegue el vencimiento?**. Esa pregunta se descompone en tres sub-dimensiones: runway (tiempo disponible), crecimiento de ingresos (base de repago futura) y ratio de apalancamiento actual (capacidad de absorber más deuda).[^19]

### 3.2 Métricas Clave y Umbrales de Mercado

#### Monthly / Annual Recurring Revenue (MRR / ARR)

El MRR es el predictor primario de la capacidad de repago. Los proveedores de deuda especializados en SaaS exigen generalmente un **ARR mínimo de 500K€** para iniciar conversaciones. Como regla de diseño, si el importe de deuda requerido es inferior a **3x el MRR mensual**, una línea de crédito bancaria convencional es preferible al venture debt.[^20][^18]

\[
Deuda_{max\_recomendada} \leq 3 \times MRR_{mensual}
\]

Para venture debt puro, el ticket habitual se sitúa entre el **20% y el 40% de la última ronda de equity captada**.[^21]

#### LTV / CAC Ratio

La relación entre el Lifetime Value y el Coste de Adquisición de Cliente es la métrica que más directamente refleja la eficiencia del modelo de negocio:[^22][^23]

\[
LTV = \frac{ARPA \times Margen\_Bruto\_\%}{Churn\_Rate\_mensual}
\]

\[
Ratio_{LTV/CAC} = \frac{LTV}{CAC}
\]

| LTV/CAC | Señal para el acreedor | Implicación para deuda |
|---|---|---|
| < 1x | Modelo insostenible | **Veto absoluto** a cualquier deuda |
| 1x – 2x | Modelo frágil | Solo equity; no apta para venture debt |
| 2x – 3x | Umbral mínimo SaaS | Venture debt posible con condicionantes |
| 3x – 5x | Saludable | Venture debt en buenas condiciones |
| > 5x | Excelente | Acceso a múltiples instrumentos[^24] |

#### Churn Rate

El churn mensual bruto de MRR es el indicador de destrucción de valor más crítico para los prestamistas:[^25]

- **< 1% mensual** (< ~11% anual): Excelente, preferido por fondos de venture debt
- **1% – 2% mensual**: Aceptable para SME SaaS
- **2% – 3% mensual**: Problemático para mid-market; requiere compensación en otras métricas
- **> 3% mensual**: Generalmente **rechazado** por prestamistas profesionales[^25]

El concepto de **Net Revenue Retention (NRR)** incorpora también los upsells y expansiones:[^19]

\[
NRR = \frac{MRR_{inicio} - Churned\_MRR + Expansion\_MRR}{MRR_{inicio}} \times 100
\]

Un NRR > 100% (churn neto negativo) es la señal más potente para un acreedor: los ingresos crecen incluso sin adquirir nuevos clientes. Un NRR de 95%+ es el umbral mínimo que buscan los mejores proveedores de venture debt.[^19][^25]

#### Cash Runway y Net Burn Rate

\[
Runway_{meses} = \frac{Cash\_en\_caja}{Net\_Burn\_Rate_{mensual}}
\]

La regla práctica del mercado es: **nunca iniciar conversaciones de deuda con menos de 6 meses de runway**. Con menos de 6 meses, los prestamistas perciben señales de crisis y el poder de negociación colapsa. El rango óptimo para negociar es **12-18 meses**, que genera condiciones favorables y múltiples ofertas competitivas.[^19]

El **Burn Multiple** es una métrica moderna que relaciona el consumo de caja con el crecimiento generado:[^26]

\[
Burn\_Multiple = \frac{Net\_Burn\_Rate}{New\_MRR\_Neto}
\]

| Burn Multiple | Valoración |
|---|---|
| < 1x | Excelente eficiencia de capital |
| 1x – 1,5x | Bueno |
| 1,5x – 2x | Aceptable |
| > 2x | Señal de alerta; dificulta acceso a deuda |

#### Rule of 40

La **Rule of 40** es el benchmark de equilibrio entre crecimiento y rentabilidad que utilizan fondos de growth y venture debt:[^24][^26]

\[
Rule\_of\_40 = YoY\_Revenue\_Growth\_\% + EBITDA\_Margin\_\%
\]

Un score ≥ 40 indica que la empresa tiene un equilibrio saludable entre velocidad de crecimiento y eficiencia operativa. Es un criterio cualificador para acceder a venture debt en condiciones de mercado estándar.

### 3.3 Umbrales Consolidados para Acceso a Deuda

| Métrica | Early Stage (< 500K€ ARR) | Growth Stage (500K€ – 5M€ ARR) | Scale-Up (> 5M€ ARR) |
|---|---|---|---|
| ARR mínimo | N/A (solo ENISA/equity) | 500K€+ | 2M€+ preferido |
| Churn mensual | N/A | < 2% | < 1,5% |
| LTV/CAC | N/A | > 3x | > 3x |
| NRR | N/A | > 90% | > 95% |
| Runway | >12 meses | >6 meses | >6 meses |
| Burn Multiple | N/A | < 2x | < 1,5x |
| Rule of 40 | N/A | > 20 (permisivo) | > 40 |

Fuentes:[^18][^21][^25][^19]

***

## 4. El Modelo de Simulación: Mix Óptimo de Financiación

### 4.1 Marco Conceptual: WACC Extendido para Startups

El objetivo del CFO es **minimizar el Coste Medio Ponderado de Capital (WACC)** mientras mantiene la estructura de capital que preserva la solvencia y la optionalidad estratégica. En startups, el WACC convencional se extiende para incluir la dilución implícita de los instrumentos híbridos:[^27]

\[
WACC_{ajustado} = w_E \cdot k_E + w_{VD} \cdot k_{VD} \cdot (1-T) + w_{D_{pub}} \cdot k_{D_{pub}} \cdot (1-T)
\]

Donde:
- \(w_E, w_{VD}, w_{D_{pub}}\) = pesos del equity, venture debt y deuda pública en la estructura total
- \(k_E\) = coste del equity (retorno requerido por el inversor, típicamente 25%-40% en early-stage español)
- \(k_{VD}\) = coste del venture debt (8%-15% + coste implícito de warrants)
- \(k_{D_{pub}}\) = coste de la deuda pública ENISA (Euríbor + diferencial fijo + tramo variable)
- \(T\) = tipo impositivo marginal (IS en España: 23% general, 15% startups en primeros 2 años rentables)

### 4.2 Restricciones del Modelo (Constraints)

El modelo está sujeto a cuatro restricciones que el CFO debe verificar antes de añadir deuda:[^28][^29][^19]

**Restricción 1 — Legalidad Societaria (Art. 363.1.e LSC):**

\[
PN_{actual} > \frac{CS}{2}
\]

Si el patrimonio neto cae por debajo del 50% del capital social, la sociedad entra en **causa de disolución obligatoria**. Los administradores tienen 2 meses para convocar la Junta que adopte medidas correctoras, so pena de responsabilidad solidaria personal por las deudas posteriores.[^30][^28]

**Restricción 2 — Cobertura del Servicio de la Deuda:**

\[
DSCR = \frac{EBITDA_{proyectado}}{Deuda\_Anual\_Principal + Intereses} \geq 1{,}2x
\]

**Restricción 3 — Runway Mínimo Post-Financiación:**

\[
Runway_{post\_deuda} = \frac{Cash_{actual} + Financiaci\acute{o}n_{nueva}}{Burn_{mensual} + Cuota\_deuda_{mensual}} \geq 12\ meses
\]

**Restricción 4 — ENISA Paridad:**

\[
FP_{corregidos} \geq Pr\acute{e}stamo_{ENISA}
\]

### 4.3 Modelo de Simulación en Tres Escenarios

El CFO simula tres escenarios de financiación para una necesidad total de **600.000 €** con la siguiente situación base:

**Datos de la startup (ficticia "GrowthSaaS S.L."):**
- MRR: 60.000 € (ARR: 720.000 €)
- Burn Rate mensual: 80.000 €
- Cash en caja: 350.000 € → Runway actual: **4,4 meses** (zona de riesgo)
- Fondos Propios contables: 280.000 €
- Capital Social inscrito: 100.000 €
- Churn mensual: 1,8% — LTV/CAC: 3,5x — NRR: 92%
- Tipo IS: 23% (startup en pérdidas, aplica la deducción de base imponible positiva futura)

***

**ESCENARIO A: Financiación 100% Equity (Nueva Ronda)**
- Captación: 600.000 € equity a valoración pre-money de 3M€
- Dilución: 600K / (3M + 600K) = **16,7% dilución**
- Coste implícito: tasa de retorno exigida por el inversor ≈ 30% TIR → coste real del equity ≈ 30% anual
- Efecto en balance: PN sube a 880.000 €. Sin riesgo de causa de disolución.
- Runway nuevo: (350K + 600K) / 80K = **11,9 meses**
- **Riesgo:** dilución permanente, gobernanza más compleja

***

**ESCENARIO B: Mix Deuda Pública + Equity ("Apalancamiento Eficiente")**
- Primero: ampliar capital en 280.000 € a valoración pre-money 3M€ → dilución 8,5%
  - Fondos Propios post-ampliación: 280K + 280K = 560.000 €
  - FP inscritos en RM: ✅ habilita solicitar ENISA por 280.000 €
- ENISA Emprendedores: 280.000 € (tipo Euríbor + diferencial, p.ej. ~7% efectivo anual, carencia 5 años)
- Equity + ENISA = 280K + 280K = **560.000 €** (vs. 600K necesarios, casi toda la necesidad cubierta)
- Dilución: solo 8,5% vs. 16,7% del Escenario A
- Servicio deuda ENISA en carencia: solo intereses ≈ 1.633 €/mes
- Runway: (350K + 560K) / (80K + 1.633) ≈ **11,2 meses**
- **Ventaja clave:** se financia casi el mismo volumen diluyendo solo la mitad

***

**ESCENARIO C: Mix Deuda Pública + Venture Debt (Sin Equity Nueva Ronda)**

> ⚠️ Este escenario ilustra el error de apalancamiento excesivo

- ENISA: 280.000 € (require FP de 280K → OK con los FP actuales de 280K)
- Venture Debt Inveready: 320.000 € → ticket mínimo 500K no cumplido, pero supongamos condición especial
- Venture Debt términos: 12% anual + warrants 25% del importe (80K en equity @ valoración pre-money 2M)
- Dilución efectiva venture debt: 80K / (2M + 80K) = **3,8%** (dilución reducida pero existente)
- Cuota mensual venture debt: intereses en carencia ≈ 3.200 €/mes; post-carencia cuota total ≈ 12.000 €/mes
- Cuota mensual ENISA (carencia 5 años): intereses ≈ 1.633 €/mes
- Burn total post-financiación: 80K + 3.200 = **83.200 €/mes** en carencia; luego **92.000 €/mes**
- Runway en fase carencia: (350K + 600K) / 83.200 = **11,4 meses** ✅
- **El problema:** si el MRR no crece y la startup no cierra siguiente ronda, al final de la carencia (mes 13+):
  - Burn total: 92.000 €/mes
  - Caja proyectada mes 13 (asumiendo sin crecimiento y burn 80K): ≈ 0 €
  - **Vencimiento de principal venture debt mes 37:** 320.000 € exigibles sin caja disponible → **insolvencia técnica**

### 4.4 Ejemplo de Quiebra Técnica y Causa de Disolución

Continuando con el Escenario C en el caso de que GrowthSaaS S.L. no crezca según lo previsto:

**Evolución del balance a 18 meses (stress test):**

| Concepto | Mes 0 | Mes 12 | Mes 18 |
|---|---|---|---|
| Caja | 350.000 € | 382.600 € | 142.600 € |
| Total Activo | 650.000 € | 682.600 € | 442.600 € |
| ENISA (pasivo) | 280.000 € | 280.000 € | 280.000 € |
| Venture Debt (pasivo) | 320.000 € | 320.000 € | 320.000 € |
| Otros pasivos | 50.000 € | 80.000 € | 100.000 € |
| **Patrimonio Neto** | **0 €** | **2.600 €** | **-257.400 €** |
| Capital Social | 100.000 € | 100.000 € | 100.000 € |
| **PN / CS ratio** | **0%** | **2,6%** | **negativo** |

**Análisis jurídico — Art. 363.1.e) LSC:**

Ya en el **Mes 12**, el patrimonio neto (2.600 €) es inferior al 50% del capital social (50.000 €), con lo que la sociedad está formalmente en **causa legal de disolución**. Los administradores deben, en el plazo de **dos meses**, convocar la Junta General para:[^29][^28]
1. Ampliar o reducir capital hasta restablecer el equilibrio patrimonial, o
2. Acordar la disolución de la sociedad, o
3. Solicitar el concurso de acreedores si existe insolvencia inminente

El incumplimiento de este deber hace a **los administradores solidariamente responsables** de todas las deudas sociales contraídas con posterioridad a la causa de disolución, con su patrimonio personal. Esto significa que los 100.000 € de deudas con proveedores generadas en el mes 13 y posteriores son exigibles directamente al CEO y al CFO.[^30][^28]

### 4.5 Tabla de Decisión: ¿Cuándo Usar Cada Instrumento?

| Situación de la Startup | Instrumento Óptimo | Instrumento a Evitar |
|---|---|---|
| Pre-revenue, primeros 18 meses | Equity (FFF, angels, Seed) | Venture debt, bancaria |
| ARR < 200K€, quemando caja | Equity + ENISA Emprendedores | Venture debt |
| ARR 200K-500K€, LTV/CAC > 3x | ENISA + equity complementario | Deuda bancaria sin historial |
| ARR 500K-2M€, NRR > 90% | ENISA Crecimiento + Venture Debt | Solo equity (dilución excesiva) |
| ARR > 2M€, runway > 12 meses | Venture Debt + ICO Crecimiento | Solo equity |
| ARR > 5M€, EBITDA positivo | Deuda bancaria + líneas ICO | Venture debt caro |
| Runway < 3 meses, en pérdidas | Ronda de emergencia (equity) | Cualquier deuda (covenant breach) |

Fuentes:[^31][^32][^27][^21]

***

## 5. Fórmulas de Resumen para el Dashboard del CFO

### Capacidad de Deuda Total (Debt Capacity Score)

\[
DC_{score} = f(Runway, MRR, LTV/CAC, NRR, PN/CS)
\]

Una aproximación práctica para el CFO:

\[
DC_{max} = \min\left( 40\% \cdot ARR,\ 6\%\ de\ valoraci\acute{o}n\ post-money,\ FP_{ENISA} \right)
\]

Este es el techo de deuda total que no debería superarse para mantener la estructura de capital saludable.[^31][^21]

### Umbral de Alerta LSC (Causa de Disolución)

\[
Alerta_{roja} \iff PN < \frac{CS}{2}
\]

\[
Alerta_{naranja} \iff PN < CS \text{ (pérdida total del capital social)}
\]

El CFO debe incluir estos umbrales en el modelo de proyección de tesorería mensual y disparar alertas automáticas cuando el patrimonio neto proyectado amenace con cruzar la línea de la mitad del capital social.

### Palanca de Reducción de Dilución (Leverage Efficiency Ratio)

\[
LER = \frac{Capital\_captado\_total}{Dilución\_total\_\%}
\]

Maximizar el LER es el objetivo del mix óptimo: captar el máximo capital posible con la menor dilución. Un mix ENISA + Venture Debt puede elevar el LER un **40%-60%** respecto a financiación 100% equity.[^17][^33]

***

## 6. Conclusiones y Recomendaciones para el CFO

1. **Planificar con 18 meses de antelación:** El proceso ENISA tarda entre 3 y 6 meses desde la solicitud hasta el desembolso. La ventana óptima de solicitud es cuando la startup tiene entre 12 y 18 meses de runway.[^34][^19]

2. **Capitalizar antes de solicitar:** Asegurarse de que todos los desembolsos de inversores estén inscritos en el Registro Mercantil antes de presentar cualquier solicitud ENISA. Una prima de emisión no inscrita es invisible para el cálculo de FP corregidos.[^7][^3]

3. **No usar venture debt como sustituto de equity:** El venture debt es un **complemento** a la ronda de equity, no un sustituto. Usado como único instrumento en una startup pre-breakeven, genera un servicio de deuda que compite con el burn operativo y acelera la crisis de caja.[^35][^33][^11]

4. **Monitorizar el umbral LSC mensualmente:** El test del Art. 363.1.e) LSC debe correr en el modelo de proyección cada mes. Es una obligación legal del administrador, no un ejercicio voluntario.[^28][^29]

5. **Priorizar NRR sobre todo:** Para los proveedores de venture debt, un NRR > 95% puede compensar otras métricas más débiles. Es la métrica más directamente relacionada con la capacidad de repago.[^18][^25][^19]

6. **El mix óptimo teórico para una startup SaaS en Growth Stage (ARR 500K€–2M€) es:** 30-40% equity (ronda Series A), 25-35% ENISA/ICO, 20-30% venture debt — manteniendo el servicio de deuda total por debajo del 25% del net burn.[^27][^21]

---

## References

1. [Líneas Enisa](https://www.enisa.es/es/financia-tu-empresa/lineas-de-financiacion) - Los fondos propios de la sociedad serán equivalentes, como mínimo, a la cuantía del préstamo. La emp...

2. [Fondos propios ENISA: cálculo y requisitos para tu préstamo en 2026](https://nexencapital.com/enisa/fondos-propios-enisa-calcularlos-cumplir-requisito/) - Descubre cómo calcular los fondos propios para ENISA y cumplir el requisito clave para acceder a fin...

3. [Guía ENISA 2025-2026: Hasta 1,5M€ Sin Avales (Y Por Qué el 67 ...](https://www.bik.eus/noticias/guia-enisa-2025-2026-prestamos-participativos-startups-pymes/) - Guía definitiva ENISA 2025-2026: préstamos participativos hasta 1,5M€ sin garantías personales. Las ...

4. [ENISA 2025: Nuevo fondo de 303M€ para startups - Andseed](https://www.andseed.com/enisa-activa-un-nuevo-fondo-de-303-millones-de-euros-para-financiar-startups-y-pymes-innovadoras/) - ENISA lanza un fondo récord de 303 millones de euros para financiar startups y pymes con proyectos i...

5. [Prestamos y Líneas de Financiación ENISA 2026 - Delvy](https://delvy.es/solicitar-enisa/) - Este préstamo está disponible para todos aquellos emprendedores que hayan fundado sus empresas en un...

6. [Preguntas frecuentes de: Financiarte con Enisa - Portal de ayudas](https://portalayudas.digital.gob.es/emprendedoras-digitales/Paginas/Preguntas-Frecuentes.aspx?Faq=Financiarte+con+Enisa) - Fondos Propios a inicio de ejercicio x (Capital+Prima+Reservas+Resultado del ejercicio x-1) = 250.00...

7. [Requisitos para solicitar ENISA (2026) - Premoney](https://www.premoney.es/blog/requisitos-solicitar-enisa) - ENISA considera como fondos propios la suma de capital social, prima de emisión, reservas, beneficio...

8. [¿Cuál es el tipo de interés de los préstamos participativos de Enisa?](https://acelerapyme.itg.es/faq/cual-es-el-tipo-de-interes-de-los-prestamos-participativos-de-enisa/) - Para el cálculo de los fondos propios medios se tendrá en cuenta los existentes al inicio y a final ...

9. [Plan financiero para ENISA: cómo preparar las proyecciones que ...](https://www.premoney.es/blog/plan-financiero-enisa) - ENISA exige que los fondos propios sean al menos equivalentes al importe del préstamo. Si pides 200K...

10. [The Rise of Venture Debt: A Response to the New ... - BBVA Spark](https://www.bbvaspark.com/en/news/venture-debt-a-response-to-the-new-normal-in-the-entrepreneurial-ecosystem/) - This is just one example of a growing trend: Spanish startups raised €2.3 billion in debt in 2024, s...

11. [Venture Debt de Inveready: Funcionamiento y estrategia](https://leanfinance.es/blog/entrevista-inveready-venture-debt/) - Quieres saber cómo funciona un Venture Debt en España? Descubre su estrategia, tipo de startups con ...

12. [Sabadell Venture Debt - Su perfil en Startupxplore](https://startupxplore.com/es/inversores/sabadell-venture-debt) - Estrategia inversión Sabadell Venture Debt · Ticket mínimo por proyecto (en millones):. 200.000 M€ ·...

13. [Cómo estructurar un acuerdo de Venture Debt sin comprometer tu ...](https://www.bolboretainnova.com/actualidad/bolboreta-impulsa/noticias-bolboreta-impulsa/estructurar-acuerdo-venture-debt/) - Las tasas de interés rondan en España entre el 8 % y el 12 % anual, complementadas con warrants (der...

14. [ICO Crecimiento - Legálitas](https://www.legalitas.com/actualidad/ico-crecimiento) - Se pueden financiar proyectos de expansión empresarial, innovación, digitalización, internacionaliza...

15. [¿Por qué elegir Venture Debt para financiar tu startup? - Mecides](https://www.mecides.es/que-es-una-scaleup-y-como-escalar-tu-negocio/) - Suele combinar un préstamo a medio plazo con una opción para que el prestamista adquiera una pequeña...

16. [El BEI y Sabadell Venture Capital unen fuerzas para apoyar el ...](https://www.eib.org/en/press/all/2022-221-eib-and-sabadell-venture-capital-join-forces-to-support-spanish-startups?lang=es) - Ahora Sabadell Venture Capital gracias a la alianza con el BEI puede ofrecer soluciones de Venture D...

17. [El venture debt como instrumento de financiación alternativa para ...](https://www.osborneclarke.com/es/insights/el-venture-debt-como-instrumento-de-financiacion-alternativa-para-impulsar-el-ecosistema) - El ratio de cobertura de warrants suele estar entre el 10% y 20% (en España, puede llegar hasta el 2...

18. [The Strategic Imperative of Fundraising for B2B SaaS Founders](https://novelcapital.com/the-strategic-imperative-of-fundraising-for-b2b-saas-founders/) - Lenders often require covenants, performance thresholds, and in most cases, equity warrants. The rig...

19. [Debt-Ready Startup Metrics [2026] - re:cap](https://www.re-cap.com/blog/debt-readiness-startups) - A €2M ARR business with 95% net revenue retention might get better terms than a €5M ARR business wit...

20. [[PDF] COMPARISON GUIDE OF DEBT OPTIONS FOR SAAS COMPANIES](https://www.saas-capital.com/wp-content/uploads/2019/04/Comparison_Guide_of_Debt_Options_for_SaaS_Companies.pdf) - The advance rate on venture debt is typically high with few, if any covenants, and the rates are in ...

21. [Cost of Debt Benchmarks for Startups - Lucid.now](https://www.lucid.now/blog/cost-of-debt-benchmarks-startups/) - Limit venture debt to 6–8% of valuation. Ensure debt service stays below 25% of net burn. Monitor fi...

22. [Métricas para startups: CAC y LTV (qué significan y cómo calcularlas)](https://innovascalaconsulting.es/metricas-para-startups/) - Para medir el avance y rendimiento de los negocios, existen muchas métricas. En este artículo para s...

23. [CAC y LTV. Todo lo que tienes que saber sobre las dos métricas ...](https://abancainnova.com/cac-y-ltv-todo-lo-que-tienes-que-saber-sobre-las-dos-metricas-mas-importantes-de-una-startup/) - CAC se refiere, a Customer Adquisition Cost, es decir, lo que nos cuesta adquirir un cliente. En cam...

24. [ARR en startups de IA: la métrica más usada y menos fiable](https://ecosistemastartup.com/arr-en-startups-de-ia-la-metrica-mas-usada-y-menos-fiable/) - LTV / CAC: la relación entre el valor de vida del cliente (LTV) y el costo de adquisición (CAC) es c...

25. [Startup Metrics & Terminology - Nauta Capital](https://www.nautacapital.com/startup-metrics-and-terminology) - Nauta's must-know guide to metrics, terminology, and benchmarks tailor-made for B2B software startup...

26. [Cash Flow Benchmarks for SaaS Startups - Lucid.now](https://www.lucid.now/blog/cash-flow-benchmarks-for-saas-startups/) - Explore essential cash flow benchmarks for SaaS startups, including MRR, churn rate, and the Rule of...

27. [Understanding the Trade-Off Between Debt & Equity Financing](https://cfoproanalytics.com/cfo-blog/f/understanding-the-trade-off-between-debt-and-equity-financing/) - This model aims to have a mix of equity and debt in your funding plan, and this can help balance bus...

28. [Desequilibrio patrimonial y responsabilidad de administradores](https://www.tendencias.kpmg.es/2020/06/covid-19-desequilibrio-patrimonial-y-responsabilidad-de-administradores/) - La Ley de Sociedades de Capital (“LSC”) dispone que existe desequilibrio patrimonial como causa de d...

29. [✔️ Desequilibrio patrimonial: consecuencias y soluciones ...](https://clubdelapyme.com/blog/desequilibrio-patrimonial-empresas-consecuencias-soluciones/) - La Ley de Sociedades de Capital (LSC) establece en su artículo 363.1.e) que una empresa debe disolve...

30. [Responsabilidad por no disolución de la sociedad estando ...](https://idibe.org/derecho-mercantil/responsabilidad-no-disolucion-la-sociedad-estando-incurso-causa-disolucion-delimitacion-del-alcance-la-causa-disolucion-del-art-363-1-letra-e-reduccion-del-patrimonio-neto-una/) - Lo que genera la causa legal de disolución de la sociedad prevista en el art. 363.1,e) LSC es que el...

31. [Balancing Equity and Debt Financing for Founders - Qubit Capital](https://qubit.capital/blog/balancing-equity-debt) - The main difference between debt and equity financing is that equity involves selling ownership, whi...

32. [Capital Structure Scenarios: Debt vs. Equity - Lucid.now](https://www.lucid.now/blog/capital-structure-scenarios-debt-vs-equity/) - Debt financing is often a better fit for established businesses with predictable revenue, while equi...

33. [Las 'startups' y el endeudamiento (III): El 'venture debt' - Garrigues](https://www.garrigues.com/es_ES/noticia/startups-endeudamiento-iii-venture-debt) - Hemos descrito también lo favorable del entorno para propiciar vías de endeudamiento. Vimos por últi...

34. [Claves para obtener la financiación de Enisa](https://www.enisa.es/es/actualidad/blog/claves-para-obtener-la-financiacion-de-enisa-678) - Presenta cuentas saneadas sin incurrir en situaciones críticas, como puede ser el patrimonio neto o ...

35. [Venture Debt: qué es, cómo funciona y cuándo tiene sentido frente ...](https://www.diligo.io/blog/venture-debt-que-es-como-funciona-vs-equity) - La cobertura de warrants suele estar entre el 0,5% y el 2% del capital de la empresa. Es la “prima” ...

