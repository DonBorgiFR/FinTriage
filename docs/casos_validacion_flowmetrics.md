# Suite de Casos de Validación Real — Libro Diario FlowMetrics SL

Este documento detalla los 4 casos reales y manuales de validación contable extraídos del análisis y auditoría del libro diario de **FlowMetrics S.L.** (caso `FNZ_01`) y utilizados como banco de pruebas para verificar el comportamiento determinista y preciso del motor de anomalías refinado.

---

## Caso 1: El Vacío de Amortizaciones de Abril 2025

### Contexto
El libro diario de FlowMetrics registra de forma sistemática y lineal dotaciones mensuales de amortización acumulada por valor de **1.404,45€** (cuotas combinadas de la cuenta `68000001` y `68100001`) durante 5 de los 6 meses del semestre analizado. En el mes de **abril 2025**, sin embargo, no existe ningún apunte en el grupo `68`.

### Lógica de Evaluación Contable
1. **Input**:
   - `months` = `["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"]`
   - `monthsWithAmort` = `["2025-01", "2025-02", "2025-03", "2025-05", "2025-06"]` (5 meses)
   - `monthsWithoutAmort` = `["2025-04"]` (1 mes)
2. **Evaluación**:
   - `monthsWithAmort.length` (5) es mayor que 3.
   - El motor determina que existe un patrón mayoritario recurrente mensual de amortización que se interrumpe de forma aislada.
3. **Output Esperado**:
   - **ID**: `meses_sin_amortizacion`
   - **Severidad**: `medium` (posible inconsistencia u omisión técnica en abril).
   - **Mensaje**: *"Meses omitidos en amortización recurrente"*
   - **Detalle**: *"Posible inconsistencia técnica u omisión en los meses: 2025-04. Se detecta recurrencia mensual consistente en los otros 5 meses."*

---

## Caso 2: Descuadres de Redondeo en Stripe vs Descuadres Materiales

### Contexto
Las pasarelas de pago o las diferencias por redondeo de céntimos en transacciones Stripe pueden generar ligeras discrepancias contables. Un descuadre de céntimos o de pocos euros en un diario extenso no es materialmente relevante y no debe alertarse con severidad alta, pero diferencias significativas sí representan un peligro crítico de integridad.

### Lógica de Evaluación Contable
1. **Inputs de Prueba**:
   - **Sub-caso A (Redondeo Stripe)**:
     - `totalDebe` = `84.500,00€`, `totalHaber` = `84.512,35€`
     - `diff` = `12,35€`, `volumenMes` = `84.500,00€`
     - `diff / volumenMes` = `0.000146` (0.014%)
   - **Sub-caso B (Descuadre Material)**:
     - `totalDebe` = `112.300,00€`, `totalHaber` = `112.850,00€`
     - `diff` = `550,00€`, `volumenMes` = `112.300,00€`
     - `diff / volumenMes` = `0.00489` (0.489%)
2. **Evaluación del Motor**:
   - **Sub-caso A**: `diff` es menor a 100.00€ y menor al 0.1% de materialidad del volumen mensual. Se cataloga como descuadre leve.
   - **Sub-caso B**: `diff` supera los 100.00€ y el 0.1% de materialidad. Se cataloga como descuadre relevante.
3. **Output Esperado**:
   - **Sub-caso A**:
     - **ID**: `descuadre_contable`
     - **Severidad**: `medium` (Descuadre leve en [mes]).
     - **Detalle**: *"Diferencia no material de 12.35€ (dentro del 0.1% del volumen del mes)."*
   - **Sub-caso B**:
     - **ID**: `descuadre_contable`
     - **Severidad**: `high` (Descuadre contable relevante en [mes]).
     - **Detalle**: *"Diferencia material de 550.00€ (Debe=112300.00€, Haber=112850.00€)."*

---

## Caso 3: Uso Legítimo de la Cuenta 129 en el Asiento de Reapertura

### Contexto
La cuenta `129` ("Resultado del ejercicio") es legítima en los meses de transición. En enero 2025, FlowMetrics SL registra el asiento de reapertura del ejercicio donde interviene el saldo de la cuenta `129` del ejercicio anterior de forma estructurada.

### Lógica de Evaluación Contable
1. **Input**:
   - `mesesCon129` = `["2025-01"]`
   - `firstMonth` = `"2025-01"`, `lastMonth` = `"2025-06"`
   - `intermedios` = `[]` (ninguno fuera de los límites cronológicos de la serie).
2. **Evaluación**:
   - El motor comprueba que no hay uso de la cuenta 129 en meses intermedios (Febrero, Marzo, Abril, Mayo).
3. **Output Esperado**:
   - **ID**: `cuenta_129_detectada`
   - **Severidad**: `low` (Uso estructurado informativo).
   - **Mensaje**: *"Uso estructurado de la cuenta 129 (regularización/apertura)"*
   - **Detalle**: *"Apuntes en la cuenta 129 detectados exclusivamente en meses estándar de apertura (2025-01) y/o regularización (2025-06). Uso estructurado conforme."*

---

## Caso 4: Uso Disperso de la Cuenta 129 en Meses Intermedios

### Contexto
Si por un error de asignación de los asesores o fundadores se registran reclasificaciones o gastos cargados directamente contra la cuenta 129 en pleno marzo o mayo, esto constituye una distorsión grave en el análisis del EBITDA intermedio y el balance.

### Lógica de Evaluación Contable
1. **Input**:
   - Asiento en Marzo con importe de `4.500,00€` imputado a la cuenta `129`.
   - `mesesCon129` = `["2025-01", "2025-03"]`
   - `intermedios` = `["2025-03"]`
2. **Evaluación**:
   - `intermedios.length` > 0.
   - El importe máximo en meses intermedios es `4.500,00€` (superior al umbral cerrado de 1.000€).
3. **Output Esperado**:
   - **ID**: `cuenta_129_detectada`
   - **Severidad**: `high` (Uso no estándar o disperso).
   - **Mensaje**: *"Uso no estándar o disperso de la cuenta 129"*
   - **Detalle**: *"Se detectaron movimientos en la cuenta 129 en meses intermedios de la serie ordinaria (2025-03). Importe máximo de 4500.00€. Se requiere verificar si existe una distorsión en la PyG o balance de dichos meses."*
