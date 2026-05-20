# Manual Técnico: Mapeo de Cuentas PGC 2007 para Memorias Financieras ENISA y CDTI

> **Versión**: Mayo 2026 | Elaborado bajo estándares de CFO Auditor para financiación pública española

***

## Introducción y Marco de Referencia

ENISA (Empresa Nacional de Innovación, adscrita a la DGIPYME) y el CDTI (Centro para el Desarrollo Tecnológico e Industrial) son las dos principales ventanillas de financiación pública para pymes innovadoras en España. Aunque ambas entidades aceptan los estados financieros preparados conforme al Plan General Contable 2007 (RD 1514/2007), sus analistas aplican una lectura **analítica** de las cuentas que difiere del formato PGC estándar.

El instrumento financiero de ENISA es el **préstamo participativo** (regulado por el artículo 20 del Real Decreto-Ley 7/1996), un híbrido entre deuda y capital pensado para reforzar la estructura financiera de la empresa. El CDTI concede financiación parcialmente reembolsable que puede cubrir hasta el **85% del presupuesto aprobado** del proyecto de I+D. Comprender cómo cada entidad lee el balance y la cuenta de resultados es esencial para que el CFO prepare la documentación correctamente.[^1][^2]

***

## Parte I — Mapeo de la Cuenta de Pérdidas y Ganancias (PyG)

### 1.1 Estructura Analítica ENISA del PyG

ENISA no trabaja con el formato vertical del PGC, sino con una **cuenta de resultados analítica** que agrupa las partidas para calcular los márgenes intermedios que alimentan su modelo de rating cuantitativo. Los 7 ratios del **análisis económico** que representa el 38,1% del score cuantitativo son: crecimiento acumulado de ventas, margen EBITDA, margen neto, rotación del activo, ROA, período medio de pago/cobro y rotación de stocks.[^3]

#### Tabla 1: Mapeo PyG — Grupo 7 (Ingresos) al formato ENISA/CDTI

| Código PGC | Nombre de la Partida | Categoría Analítica ENISA/CDTI | Observaciones Críticas |
|---|---|---|---|
| **700–709** | Ventas de mercaderías y productos | **Ingresos de explotación (Cifra de Negocio)** | Base del ratio crecimiento acumulado de ventas |
| **710–712** | Variación de existencias de productos | **Ajuste a la Cifra de Negocio** | Puede inflar o deflactar artificialmente los ingresos |
| **720–729** | Prestaciones de servicios | **Ingresos de explotación (Cifra de Negocio)** | Se suma a 700-709 para calcular la cifra de negocio total |
| **730** | Trab. realizados para inmovilizado intangible (I+D) | **Ingreso de activación — por encima del EBITDA** | Tratamiento especial: ver Sección 1.2 |
| **731** | Trab. realizados para inmovilizado material | **Ingreso de activación — no operativo recurrente** | Incrementa el beneficio sin flujo de caja real |
| **740–749** | Subvenciones a la explotación | **Otros ingresos de explotación (dentro del EBITDA)** | Se incluyen en EBITDA porque son recurrentes y operativos |
| **746** | Subvenciones de capital imputadas a resultados | **Ingresos extraordinarios — excluidos del EBITDA** | Proviene de la cuenta 130; el analista los ajusta fuera del EBITDA normalizado |
| **750–759** | Otros ingresos de gestión | **Otros ingresos de explotación** | Se analiza su recurrencia; ingresos atípicos se ajustan |
| **760–769** | Ingresos financieros | **Resultado financiero (debajo del EBITDA)** | No forman parte del EBITDA operativo |
| **770–779** | Beneficios procedentes de activos no corrientes | **Resultado extraordinario — excluido del EBITDA** | Plusvalías no recurrentes; el analista las elimina del EBITDA |

#### Tabla 2: Mapeo PyG — Grupo 6 (Gastos) al formato ENISA/CDTI

| Código PGC | Nombre de la Partida | Categoría Analítica ENISA/CDTI | Observaciones Críticas |
|---|---|---|---|
| **600–609** | Compras de mercaderías y materias primas | **Coste de ventas / Consumo** | Forma el "Margen Bruto" junto con la variación de existencias |
| **610–612** | Variación de existencias de compras | **Ajuste al coste de ventas** | Signo positivo = menor coste real; vigilar coherencia con 710-712 |
| **620–629** | Servicios exteriores | **Gastos de explotación recurrentes (dentro del EBITDA)** | CDTI: cuentas 621, 622, 624, 628, 629 son elegibles para justificar[^4] |
| **630–633** | Tributos | **Gastos de explotación** | Impuesto de Sociedades (630) se coloca debajo del EBIT; tributos locales dentro del EBITDA |
| **640–649** | Gastos de personal | **Gastos de explotación (OPEX dentro del EBITDA)** | Cuentas 640, 642, 649 son las primeras líneas de auditoría en justificación CDTI[^4] |
| **660–669** | Gastos financieros | **Resultado financiero (debajo del EBITDA)** | Usados para el ratio Cobertura de Intereses = EBITDA / Gastos financieros |
| **670–679** | Pérdidas procedentes de activos no corrientes | **Resultado extraordinario — excluido del EBITDA** | Las plusvalías/minusvalías se ajustan por el analista |
| **680–682** | Amortización del inmovilizado | **Partida de ajuste: se suma al EBIT para obtener EBITDA** | Clave para el cálculo del EBITDA; crítico revisar coherencia con el activo no corriente |
| **690–699** | Pérdidas por deterioro | **Ajuste de auditoría — señal de alarma** | Ver Sección 3 |

***

### 1.2 Tratamiento de la Cuenta 73 — Trabajos Realizados para la Empresa (Activación I+D)

Este es el punto técnico más delicado y frecuentemente mal gestionado en las memorias para ENISA y CDTI.

**¿Qué es la cuenta 73?**

El subgrupo 73 (*Trabajos realizados para la empresa*) es la **contrapartida contable de los gastos** que la empresa incurre con sus propios recursos (personal, materiales) para incrementar su activo inmovilizado. En el caso de I+D, la cuenta relevante es:[^5][^6]
- **730 — Trabajos realizados para el inmovilizado intangible**: activa los gastos de investigación (cuenta 200 PGC) y desarrollo (cuenta 201 PGC).[^7]

**El mecanismo de la activación:**

Cuando una empresa incurre en gastos de I+D (por ejemplo, 100.000 € de nóminas de ingenieros en proyecto), el PGC permite activar ese coste como activo intangible. El asiento es:

```
(201) Desarrollo en curso            100.000 €
    a  (640) Sueldos y salarios       100.000 € → permanece como gasto en PyG
(201) Desarrollo en curso
    a  (730) Trabajos realizados       100.000 € → INGRESO en PyG que neutraliza el gasto
```

**Impacto directo en el EBITDA — efecto de doble filo:**

El ingreso por la cuenta 730 aparece como un **ingreso de explotación**, neutralizando los gastos del Grupo 6 asociados. Esto **eleva artificialmente el EBITDA** y el margen operativo. Desde la perspectiva del analista de ENISA:[^6]

| Escenario | Efecto en EBITDA | Interpretación ENISA |
|---|---|---|
| I+D activado (con cta. 730) | EBITDA más alto | El analista **ajusta y normaliza**, restando el ingreso 730 del EBITDA |
| I+D llevado a gasto directo | EBITDA más bajo | EBITDA "sucio" pero con mayor caja consumida |
| I+D activado + amortización iniciada | EBITDA alto, EBIT menor | Añade presión sobre cobertura de intereses a largo plazo |

**Postura del analista de ENISA:** Reconoce la activación como señal positiva de innovación (cumple 6 condiciones NRV 6ª del PGC), pero en el cálculo del **EBITDA normalizado** restará el importe de la cuenta 730 para evaluar la capacidad real de generación de caja del negocio recurrente.[^7]

**Postura del auditor CDTI:** Más estricto aún. La guía de auditoría CDTI (versión 2.6) establece que si los gastos se han contabilizado en una **cuenta de inmovilizado** (es decir, activados), el auditor verifica que no se estén justificando doblemente como gasto operativo del proyecto. La regla es: **un euro no puede estar activado en el balance y justificado como gasto elegible simultáneamente**.[^4]

**Condiciones PGC para activar desarrollo (NRV 6ª):** Viabilidad técnica, intención de completar, capacidad de uso/venta, generación de beneficios futuros, disponibilidad de recursos y capacidad de medir el coste. El CFO debe documentar las seis condiciones con evidencia antes de activar.[^7]

***

## Parte II — Mapeo del Balance de Situación

### 2.1 Estructura Analítica del Balance para ENISA/CDTI

ENISA utiliza 5 ratios financieros en su análisis cuantitativo (que supone el 61,9% del score cuantitativo): liquidez, solvencia, endeudamiento, cobertura de deuda y cobertura de intereses. La clasificación correcta de las partidas del balance es determinante para que estos ratios sean favorables.[^3]

#### Tabla 3: Mapeo del Activo — Balance PGC a formato ENISA

| Código PGC | Nombre de la Partida | Categoría Analítica | Notas para ENISA/CDTI |
|---|---|---|---|
| **200–209** | Investigación y Desarrollo (Intangible) | Activo No Corriente | Analizado junto con Cta. 730; el analista verifica coherencia entre activo activado y gasto incurrido |
| **210–219** | Inmovilizado material | Activo No Corriente | Base para calcular ratio Rotación del Activo |
| **280–289** | Amortización acumulada | Corrección valorativa | Se verifica que las tasas de amortización sean coherentes con la vida útil del activo |
| **490–499** | Deterioro de valor de créditos comerciales | Corrección de activo corriente | **Señal de alarma** si es significativo (ver Sección 3) |
| **430–439** | Clientes | Activo Corriente | Determina el Período Medio de Cobro y la liquidez |
| **570–579** | Tesorería | Activo Corriente | Componente del ratio de liquidez ácida; se verifica con extractos bancarios |
| **480** | Gastos anticipados | Activo Corriente (periodificación) | Ver Sección 3 — cuenta de atención especial |

#### Tabla 4: Mapeo del Pasivo y Patrimonio Neto — Partidas Críticas

| Código PGC | Nombre de la Partida | Clasificación PGC | Clasificación Analítica ENISA | Clasificación Analítica CDTI |
|---|---|---|---|---|
| **100** | Capital social | Patrimonio Neto | Fondos Propios Computables | Fondos Propios — verificación "empresa en crisis" |
| **110–119** | Reservas | Patrimonio Neto | Fondos Propios Computables | Fondos Propios |
| **118** | Aportaciones de socios sin contraprestación | Patrimonio Neto | Fondos Propios Computables | Fondos Propios |
| **121** | Resultados negativos de ejercicios anteriores | Patrimonio Neto (negativo) | Reduce fondos propios | **Crítico**: si supera 50% del capital → empresa en crisis[^8] |
| **130** | Subvenciones oficiales de capital | Patrimonio Neto (Grupo 13) | **No computable como Fondos Propios ENISA** — ver Sección 2.2 | Patrimonio Neto contable; no Fondos Propios para test empresa en crisis |
| **1605** | Deudas a LP con entidades públicas (ENISA) | Pasivo No Corriente (LP) | **Pasivo financiero** en balance | Computa como deuda en ratio deuda/capital |
| **170** | Deudas a LP con entidades de crédito | Pasivo No Corriente | Pasivo exigible LP | Base del ratio Cobertura de Deuda |
| **520** | Deudas a CP con entidades de crédito | Pasivo Corriente | Pasivo exigible CP | Afecta negativamente ratio de liquidez |
| **551–552** | Cuentas corrientes con socios/administradores | Pasivo Corriente (si acreedor) | **Señal de alarma crítica** — ver Sección 3 | Señal de alarma crítica |
| **400–409** | Proveedores | Pasivo Corriente | Período Medio de Pago | Ratio PMP/PMC; desequilibrio implica gestión de circulante deficiente |

***

### 2.2 Tratamiento Especial: Subvenciones de Capital (Grupo 13) ante ENISA/CDTI

Este es el punto de mayor confusión terminológica entre CFOs noveles. La cuenta **130 — Subvenciones oficiales de capital** aparece en el **patrimonio neto** del balance PGC, pero su tratamiento varía radicalmente según el análisis:[^9]

#### ¿Cómo se contabiliza la cuenta 130?

Cuando una empresa recibe una subvención de capital (por ejemplo, del CDTI, FEDER, o ENISA en algún tramo no reembolsable), el registro inicial es:[^10][^9]

```
(4708) Hacienda Pública deudora (subvención concedida)    XXX
    a  (130) Subvenciones oficiales de capital             XXX
```

Cada año, conforme se amortiza el activo financiado, se imputa a resultados:

```
(130) Subvenciones oficiales de capital    XXX
    a  (746) Subvenciones imputadas a resultados  XXX
```

La cuenta 746 (ingreso en PyG) **debe excluirse del EBITDA normalizado** cuando el analista construye los ratios económicos, ya que es un ingreso no recurrente vinculado a la amortización de activos subvencionados.[^11]

#### Tabla 5: Tratamiento de la Cuenta 130 según el Contexto

| Contexto / Norma | ¿Computa como Fondos Propios? | Detalle |
|---|---|---|
| **Balance PGC** | Sí — aparece en el Patrimonio Neto | Grupo 1, subgrupo 13 — "Financiación básica" |
| **Análisis ENISA — Fondos Propios Computables** | **No directamente** | ENISA computa como FP: 100% del capital social + prima + resultados positivos retenidos. La cuenta 130 se pondera con el ratio de endeudamiento[^12] |
| **Test "empresa en crisis" CDTI** | **No** | La fórmula CDTI es: (Capital Social + Prima de Emisión) / 2 < Fondos Propios. "Fondos propios" aquí = patrimonio neto total incluyendo cta. 130, pero la cuenta 130 **no reduce la causa de crisis** si hay pérdidas acumuladas grandes[^8] |
| **Efectos mercantiles (reducción capital / disolución)** | **No** | Requiere valoración de activos netos reales |
| **Ratio de solvencia ENISA** | **Sí** | Solvencia = Activo Total / Pasivo Total; la cuenta 130 está en el Patrimonio Neto y no en el Pasivo |

***

### 2.3 Tratamiento del Préstamo Participativo ENISA en el Balance

Este es un punto de enorme importancia práctica para el CFO:

**Registro contable correcto:**
El préstamo participativo de ENISA se contabiliza como **pasivo financiero a largo plazo**:[^13]

```
(57x) Tesorería                    XXX
    a  (1605) Deudas LP con entidades públicas  XXX
```

La parte que vence antes de 12 meses se reclasifica a corto plazo (cuenta **5205**).[^13]

#### Tabla 6: Naturaleza del Préstamo Participativo ENISA según el Contexto

| Contexto | Clasificación | Norma / Fuente |
|---|---|---|
| **Registro contable PGC** | **Pasivo financiero** (cta. 1605) | PGC 2007, NRV 9 — Instrumentos financieros |
| **A efectos mercantiles** (reducción capital y disolución) | **Patrimonio neto** | Art. 20.d) Real Decreto-Ley 7/1996[^14][^15] |
| **Ratio de solvencia ENISA** | **Pasivo** (computa como deuda) | Solvencia = Activo / Pasivo (incluye el préstamo) |
| **Ratio de endeudamiento ENISA** | **Deuda financiera** | El analista lo incluye en la deuda total |
| **Límite relativo ENISA** (importe máximo) | Referencia a Fondos Propios reales | ENISA solo financia si los socios han co-invertido al menos 50%[^16][^17] |
| **Test empresa en crisis CDTI** | **Pasivo** (no compensa pérdidas) | Solo computa si el préstamo se convierte en capital[^18] |

**Implicación práctica para el CFO:** El hecho de que el préstamo participativo computa como patrimonio neto **a efectos mercantiles** (es decir, no obliga a disolver la empresa si los fondos propios contables son negativos) es una ventaja real, pero **no mejora directamente los ratios de solvencia o endeudamiento** que analiza ENISA, ya que en el análisis de rating esos ratios se calculan sobre el balance PGC (donde es pasivo).[^19]

***

## Parte III — Cuentas Conflictivas y Ajustes de Auditoría

### 3.1 Mapa de Cuentas con Señal de Alarma en Comité de Riesgos

Los analistas de ENISA y los auditores de CDTI tienen experiencia reconociendo patrones contables que sugieren debilidad financiera real o maquillaje de estados. A continuación se detallan las cuentas de mayor riesgo y los ajustes recomendados antes de la presentación.

#### Tabla 7: Cuentas Conflictivas — Señales de Alarma y Acción CFO

| Código PGC | Nombre | Por qué levanta alarma | Ajuste recomendado antes de la memoria |
|---|---|---|---|
| **121** | Resultados negativos de ejercicios anteriores | Si supera el 50% del capital social, la empresa está en situación de **"empresa en crisis"** y será rechazada automáticamente por CDTI[^8][^18] | Compensar pérdidas con reservas disponibles o ampliación de capital **antes** de presentar |
| **551/552** | Cuentas corrientes con socios y administradores | Indican flujos de caja no formalizados entre empresa y accionistas. Saldo acreedor = deuda informal con socio. Señal de posible descapitalización encubierta[^20][^21] | Formalizar mediante contrato de préstamo con interés al tipo legal del dinero, o convertir a ampliación de capital (cta. 118). Nunca presentar con saldos informales |
| **118** | Aportaciones de socios sin contraprestación | No es en sí una alarma, pero ENISA verifica que la co-inversión exigida sea **nueva aportación** de capital, no antiguas cuentas 551 reconfiguradas[^12] | Documentar el acuerdo de Junta y la transferencia bancaria de la ampliación |
| **490/493** | Deterioro de valor de créditos comerciales | Implica que clientes no pagan. Deterioros elevados sugieren modelo de negocio con problemas de cobro o clientes de baja calidad crediticia | Revisar la política de reconocimiento de deterioros; si el deterioro es masivo y reciente, preparar explicación narrativa en la memoria |
| **291–296** | Deterioro de valor del inmovilizado | Sugiere que los activos han perdido valor; puede indicar activos obsoletos o sobreregistrados. Especialmente peligroso en I+D activado (ctas. 200/201) si el proyecto ya no avanza[^7] | Revisar el test de deterioro anual; si hay deterioro de I+D activado, registrarlo limpiamente con explicación del cambio de hipótesis |
| **140/141** | Provisiones a largo plazo | Las provisiones por litigios (141) o reestructuraciones (142) son pasivos contingentes que el analista sí incluye en la deuda total ajustada | Documentar con informe jurídico (141) o acuerdo de dirección (142). Si la contingencia es baja probabilidad, argumentar técnicamente para no provisionarla |
| **480/490** | Periodificaciones activas | Gastos pagados por adelantado sin justificación operativa clara. Pueden indicar capitalización artificial de costes recurrentes | Revisar que correspondan a servicios reales y verificables (alquiler, seguros, etc.). Eliminar periodificaciones artificiales |
| **200** | Gastos de investigación activados | Si no se cumplen los 6 criterios NRV 6ª, el auditor de CDTI puede declarar el activo **no elegible** y exigir su imputación a gasto, reduciendo el patrimonio neto[^7] | Solo activar si hay evidencia documentada de los 6 criterios. Adjuntar informe técnico del proyecto |
| **629/659** | Otros servicios y gastos diversos | "Cajón de sastre" que puede incluir gastos no elegibles (personales, multas, no relacionados con I+D). CDTI los verifica con facturas originales[^4] | Revisar y reclasificar correctamente. Separar en subcuentas analíticas para facilitar la justificación |

***

### 3.2 Ajustes Específicos que debe Realizar el CFO Antes de la Presentación

**Ajuste 1 — Normalización del EBITDA**

El CFO debe presentar un cuadro de **EBITDA normalizado** que elimine los efectos no recurrentes o de activación. La fórmula analítica que usa ENISA es:

```
EBITDA Normalizado =
  Resultado de Explotación (EBIT)
+ Amortizaciones (680–682)
+ Deterioros (690–699) [si se incluyen sobre activos operativos]
- Ingreso por activación cta. 730 [ajuste al alza del EBITDA contable]
- Subvenciones imputadas a resultados cta. 746 [no recurrentes]
- Ingresos atípicos o plusvalías (770–779) [no recurrentes]
```

**Ajuste 2 — Fondos Propios Computables ENISA**

ENISA aplica la siguiente metodología de cómputo de fondos propios:[^12]

- **Del ejercicio en curso**: computa al 100% solo el capital social y prima realizados en el ejercicio
- **Del último ejercicio cerrado**: computa al 100% capital social + prima + resultados positivos retenidos
- **Resto de fondos propios**: se pondera con el ratio de endeudamiento (FP/Total Balance) del último ejercicio

Esto implica que una empresa con fondos propios elevados pero con alto endeudamiento verá reducidos sus fondos propios "computables" por la ponderación.

**Ajuste 3 — Test de Empresa en Crisis (obligatorio para CDTI)**

Antes de presentar al CDTI, el CFO debe verificar que se cumple la condición:[^8]

```
(Capital Social + Prima de Emisión) / 2 < Fondos Propios
```

Si los fondos propios (incluyendo pérdidas acumuladas) son inferiores a la mitad del capital social + prima, la empresa es considerada **"empresa en crisis"** y la solicitud CDTI será rechazada automáticamente. La solución requiere una **ampliación de capital** que restablezca el equilibrio patrimonial antes de la solicitud.[^18]

**Ajuste 4 — Compatibilidad de Subvenciones (CDTI)**

El auditor CDTI verificará que las subvenciones recibidas para el proyecto (cuenta 130) no superan los límites de acumulación de ayudas de Estado. La empresa debe declarar **todas las ayudas recibidas** en la Base de Datos Nacional de Subvenciones (BDNS). El CFO debe cruzar el saldo de la cuenta 130 con el BDNS antes de presentar la memoria económica.[^22][^4]

***

## Parte IV — Tabla Maestra de Equivalencias PGC → Análisis ENISA/CDTI

Esta tabla de referencia rápida consolida los mapeos anteriores en una sola vista:

| Código PGC | Nombre Partida | Formato PGC | Línea Analítica ENISA | Posición CDTI |
|---|---|---|---|---|
| 100 | Capital social | PN | FP Computable 100% | Test empresa en crisis |
| 110–119 | Reservas | PN | FP Computable (ponderado) | Test empresa en crisis |
| 118 | Aportaciones socios | PN | FP Computable (con documentación) | FP |
| 121 | Pérdidas acumuladas | PN (-) | Reduce FP y solvencia | **Umbral empresa en crisis** |
| 130 | Subvenciones capital | PN (Grupo 13) | **No FP directo** (ponderado) | Declarar en BDNS |
| 170 | Deudas LP entidades crédito | Pasivo NC | Deuda financiera LP | Deuda financiera |
| 1605 | Préstamo participativo ENISA | Pasivo NC | Deuda financiera (pasivo) | Deuda financiera |
| 400–409 | Proveedores | Pasivo C | Período Medio de Pago | Pasivo corriente |
| 430–439 | Clientes | Activo C | Período Medio de Cobro | Activo corriente |
| 480 | Gastos anticipados | Activo C | Activo corriente | Verificar con facturas |
| 490/493 | Deterioro créditos | Corrección (-) | **Señal de alarma** | Señal de alarma |
| 551/552 | C/C socios-administradores | Pasivo/Activo C | **Señal de alarma crítica** | Señal de alarma crítica |
| 600–609 | Compras | Gasto PyG | Coste de ventas | Gasto elegible parcial |
| 620–629 | Servicios exteriores | Gasto PyG | OPEX (dentro EBITDA) | Elegible: 621, 622, 624, 628, 629[^4] |
| 640–649 | Gastos de personal | Gasto PyG | OPEX (dentro EBITDA) | Elegible: 640, 642, 649[^4] |
| 680–682 | Amortizaciones | Gasto PyG | Se suma al EBIT → EBITDA | Elegible si activo no tiene doble financiación[^4] |
| 690–699 | Deterioros de valor | Gasto PyG | **Ajuste analítico** (excluir del EBITDA norm.) | No elegible |
| 700–729 | Ventas e ingresos servicios | Ingreso PyG | **Cifra de Negocio** | No elegible (son ingresos) |
| 730 | Trabajos realizados I+D | Ingreso PyG | **Ajuste analítico** (neutraliza el gasto activado) | No puede justificarse como gasto si está activado[^4] |
| 740–749 | Subvenciones explotación | Ingreso PyG | Otros ingresos explotación (dentro EBITDA) | Declarar en BDNS |
| 746 | Subvenciones capital a resultados | Ingreso PyG | **Excluir del EBITDA normalizado** | No elegible; declarar en BDNS |
| 760–769 | Ingresos financieros | Ingreso PyG | Resultado financiero (fuera EBITDA) | No elegible |

***

## Conclusiones y Checklist del CFO

### Checklist Pre-Presentación ENISA

- [ ] Verificar que los fondos propios computables (Capital + Prima + Resultados retenidos positivos) superan el 50% del préstamo solicitado
- [ ] Confirmar que los socios han realizado una co-inversión **nueva** de al menos el 50% del total necesario[^16]
- [ ] Preparar un cuadro de EBITDA normalizado excluyendo la cta. 730 y la cta. 746
- [ ] Regularizar o formalizar cualquier saldo de la cuenta 551/552 antes de presentar
- [ ] Si el préstamo supera 300.000 €, tener cuentas **auditadas** del último ejercicio[^23]
- [ ] Asegurar que las proyecciones financieras utilizan los mismos 12 ratios del modelo ENISA (7 económicos + 5 financieros)[^3]

### Checklist Pre-Presentación CDTI

- [ ] Ejecutar el test de empresa en crisis: (Capital Social + Prima) / 2 < Fondos Propios[^8]
- [ ] Cruzar cuenta 130 con la BDNS para declarar todas las ayudas compatibles[^22]
- [ ] Verificar que los gastos del proyecto se imputan exclusivamente a las cuentas 621, 622, 624, 628, 629, 640, 642, 649 (y equivalentes del PGC)[^4]
- [ ] Confirmar que ningún gasto imputado al proyecto está simultáneamente activado como inmovilizado intangible (cta. 200/201)
- [ ] Preparar los certificados de horas imputadas por trabajador para justificación del personal
- [ ] Revisar que las colaboraciones externas no superen el 65% del presupuesto elegible[^2]
- [ ] Documentar los 6 criterios NRV 6ª para cualquier gasto de I+D que esté activado en balance

---

## References

1. [Preguntas frecuentes - Enisa](https://www.enisa.es/es/financia-tu-empresa/faqs) - Un préstamo participativo (regulado por el artículo 20 del Real Decreto-Ley 7/1996) es un instrument...

2. [Proyectos de I + D - CDTI](https://www.cdti.es/ayudas/proyectos-de-i-d) - Son ayudas a proyectos de I+D desarrollados por empresas y destinados a la creación y mejora signifi...

3. [Cómo evalúa Enisa los proyectos presentados - Finanziaconnect](https://www.finanziaconnect.com/blog/como-evalua-enisa-proyectos-rating/689800057208/) - Cuantitativa: Ratios sobre los dos últimos estados financieros históricos (7 ratios para el análisis...

4. [[PDF] Guía de contenidos mínimos a verificar por el auditor en la revisión ...](https://www.cdti.es/sites/default/files/2023-12/anexo_2a._guia_de_auditor_idi_v.2.6.pdf) - El presente documento es una guía de los contenidos mínimos a verificar por el Auditor designado por...

5. [Cuenta 73 Trabajos realizados para la empresa - PGC 2007 - AECE](https://www.aece.es/plan-general-contabilidad/pgc-2007/cuentas/73) - Definición. Contrapartida de los gastos realizados por la empresa para su inmovilizado, utilizando s...

6. [Trabajos realizados para el inmovilizado - Miguel Ángel Lacoma](https://miguelangellacoma.com/trabajos-realizados-inmovilizado/) - En estas cuentas se contabilizarán las contrapartidas de los gastos que la empresa ha tenido para in...

7. [Activación contable de gastos de I+D: guía práctica con ejemplos y ...](https://www.bik.eus/noticias/activacion-contable-gastos-id-guia-practica-asientos-deducciones/) - Aprende cuándo y cómo activar gastos de I+D en el balance. Guía con ejemplos reales, asientos contab...

8. [Requisitos para presentarse a CDTI: El principio de empresa en crisis](https://intelectium.com/es/post/requisitos-para-presentarse-a-cdti-el-principio-de-empresa-en-crisis) - Los fondos propios de la empresa son 150.000€, lo que es bastante superior al capital + prima dividi...

9. [¿Cómo contabilizar una subvención?](https://www.ceisubvenciones.com/noticias/item/22-como-contabilizar-una-subvencion) - Se contabilizan en el grupo 13 del PGC, concretamente en la cuenta 130 “Subvenciones oficiales de ca...

10. [Tratamiento contable y fiscal de las subvenciones (I de II) - Ineaf](https://www.ineaf.es/tribuna/tratamiento-contable-y-fiscal-de-las-subvenciones-i-de-ii/) - La norma de valoración, efectivamente establece que con carácter general la subvención, se imputará ...

11. [Subvenciones de capital en el borrador de PGC adaptado a las NIIF](https://www.youtube.com/watch?v=w0IDJ3_uq-o) - ... Pgc #Subvenciones capital ... El tratamiento contable establece que las subvenciones se contabil...

12. [Preguntas frecuentes de: Financiarte con Enisa - Portal de ayudas](https://portalayudas.digital.gob.es/emprendedoras-digitales/Paginas/Preguntas-Frecuentes.aspx?Faq=Financiarte+con+Enisa) - Preguntas frecuentes de: Financiarte con Enisa · Crecimiento acumulado de las ventas · Margen EBITDA...

13. [Cómo contabilizar un préstamo ENISA (Guía 2026) - Premoney](https://www.premoney.es/blog/como-contabilizar-prestamo-participativo-enisa) - ¿El préstamo participativo suma en patrimonio neto? No. Va en pasivo. Aunque es subordinado, no es c...

14. [[PDF] El préstamo participativo - Revista](https://revistas.cef.udima.es/index.php/ceflegal/article/download/9807/9531/17771) - d) Los préstamos participativos se considerarán patrimonio neto a los efectos de re- ducción de capi...

15. [Los préstamos participativos y su caracterización como patrimonio ...](https://blogfiscal.cronicatributaria.ief.es/los-prestamos-participativos-y-su-caracterizacion-como-patrimonio-neto-de-la-entidad-prestataria/) - El patrimonio neto representa los recursos propios de la entidad y cumple una función esencial de ga...

16. [[PDF] Guía completa préstamos Enisa](https://www.um.es/documents/1952315/0/Gu%C3%ADa+completa+pr%C3%A9stamos+Enisa.pdf/86210485-3772-ae2f-3f3c-acf948010843?t=1689853565061) - ENISA usa el instrumento del préstamo participativo para poder financiar empresas bajo la premisa de...

17. [ENISA. Préstamos ENISA para startups y pymes innovadoras](https://www.finanziaconnect.com/landing/enisa-prestamos-participativos/) - Enisa usa el instrumento del préstamo participativo para poder financiar empresas bajo la premisa de...

18. [¿Cómo obtener una ayuda CDTI en 2021? - Intelectium](https://www.intelectium.com/es/post/como-obtener-una-ayuda-cdti-en-2021) - Si tu compañía es considerada como 'empresa en crisis' difícilmente será destinataria de esos fondos...

19. [Préstamo ENISA 2026: Líneas, Requisitos y Cómo Solicitarlo](https://idrconsulting.com/financiacion/enisa) - El préstamo participativo es un instrumento de deuda subordinada que computa como patrimonio neto a ...

20. [Cuentas corrientes con socios. La Cuenta Contable 551 | FMSB](https://fmsb.eu/2019/07/02/cuentas-corrientes-con-socios-cuenta-contable-551/) - Cuenta contable 551 en empresas con socios, cuándo aparece, cómo regularizarla y qué riesgos puede g...

21. [Cómo regularizar la cuenta 551: Cuenta corriente con socios ...](https://asesor-contable.es/cuenta-551-cuenta-corriente-con-socios-y-administradores/) - La falta de regularización de la cuenta 551 puede suponer un problema tanto para la empresa como par...

22. [[PDF] Guía de contenidos mínimos a verificar por el auditor en la revisión ...](https://www.cdti.es/sites/default/files/2023-12/anexo_2a._guia_de_auditor_idi_v.2.4.pdf) - La no verificación de cualquiera de estos puntos podría suponer un incumplimiento de las Normas de A...

23. [Líneas Enisa](https://www.enisa.es/es/financia-tu-empresa/lineas-de-financiacion) - La empresa que reciba un préstamo Enisa, por un importe superior a 300.000 €, deberá tener auditados...

