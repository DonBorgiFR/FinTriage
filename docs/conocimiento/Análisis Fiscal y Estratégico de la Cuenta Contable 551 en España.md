# Análisis Fiscal y Estratégico de la Cuenta Contable 551 (Cuentas Corrientes con Socios y Administradores)
*Asesoría Fiscal Especializada en Startups y Operaciones Vinculadas — España, 2026*

***

## Executive Summary

La cuenta 551 del Plan General de Contabilidad (PGC) — "Cuentas corrientes con socios y administradores" — es, en la práctica de las pymes y startups españolas, uno de los focos de riesgo fiscal más recurrentes y menos gestionados con rigor. Su naturaleza concebida como cuenta puente o transitoria se pervierte cuando acumula saldos prolongados sin justificación, sin contrato de préstamo formalizado ni intereses pactados a valor de mercado. El resultado es un triángulo de contingencias que combina: (1) exposición directa a inspección de la AEAT por presunción de dividendos o préstamos encubiertos, (2) bloqueo automático de acceso a financiación pública de ENISA o CDTI, y (3) obligaciones incumplidas en materia de operaciones vinculadas del artículo 18 de la Ley 27/2014 del Impuesto sobre Sociedades (LIS). Este informe detalla el marco normativo, los vectores de riesgo y el protocolo de subsanación CFO.[^1]

***

## 1. El Foco de Inspección de la AEAT: Por Qué la Cuenta 551 es una Alarma Roja

### 1.1. Naturaleza y Problema Estructural

Según el PGC, la cuenta 551 está concebida para registrar cuentas corrientes de efectivo con socios, administradores y cualquier persona física o jurídica que no sea entidad de crédito. Su función es, por tanto, estrictamente transitoria: anticipos de caja, reintegros de gastos menores o pagos a cuenta que deben regularizarse en el muy corto plazo.[^2][^3]

El problema estructural surge cuando esta cuenta se utiliza de forma continuada y sin contrato para financiar gastos personales del socio, o cuando la empresa actúa como banco informal del administrador sin fecha de devolución ni tipo de interés pactado. Cada movimiento en la cuenta 551 carece per se de naturaleza jurídica identificable; los inspectores de la AEAT saben que **los movimientos de la cuenta 551 no permiten identificar el negocio subyacente**, lo que la convierte en un vector de investigación privilegiado.[^4][^2]

### 1.2. Las Dos Hipótesis de Regularización de la Inspección

La Agencia Tributaria dispone de dos hipótesis de calificación que aplica automáticamente ante saldos prolongados en la 551:[^5]

**Hipótesis A — Saldo deudor perpetuado (el socio debe dinero a la empresa):**
La Inspección interpreta que el socio ha retirado fondos de la empresa de forma encubierta, recibiendo así **dividendos disimulados** (*retribución de los fondos propios*). La consecuencia regulatoria es doble:
- Al socio se le imputan rendimientos del capital mobiliario en su IRPF correspondientes a los dividendos "encubiertos", con tributación en la base del ahorro (tipos del 19% al 28%).
- A la sociedad se le exige el ingreso de las **retenciones no practicadas sobre dichos dividendos**, más los intereses de demora y las sanciones correspondientes.[^5]

**Hipótesis B — Saldo acreedor perpetuado (la empresa debe dinero al socio):**
La Inspección califica la operación como un préstamo no declarado del socio a la empresa. Al tratarse de una operación vinculada, se imputan en la renta del socio los intereses correspondientes al tipo de mercado que debían haberse devengado, y a la sociedad se le exigen las **retenciones no practicadas por estos intereses**.[^5]

### 1.3. El Régimen de Operaciones Vinculadas: Artículo 18 LIS

La base legal que articula toda la fiscalidad de la cuenta 551 es el **artículo 18 de la Ley 27/2014 del Impuesto sobre Sociedades (LIS)**. Este precepto establece que las operaciones efectuadas entre personas o entidades vinculadas se valorarán por su **valor normal de mercado**, entendido como aquel que se habría acordado entre personas o entidades independientes en condiciones que respeten el principio de libre competencia.[^6][^7]

**Criterio de vinculación aplicable a la 551:** Se considera que existe vinculación cuando el socio o administrador posee, directa o indirectamente, una participación igual o superior al **25% del capital social o de los fondos propios** de la entidad. Por debajo de ese umbral, la vinculación también puede existir por razón del cargo de administración.[^7][^8]

**Métodos de valoración del tipo de interés de mercado:** El artículo 18 LIS y su desarrollo reglamentario contemplan los siguientes métodos, por orden de preferencia:[^9][^6]
1. **Método del Precio Libre Comparable (PLC):** Compara el tipo de interés del préstamo vinculado con el aplicado en operaciones análogas entre partes independientes. Se prefieren los "comparables internos", es decir, el tipo de interés que la sociedad ya esté pagando a entidades financieras no vinculadas por préstamos similares.[^9]
2. **Comparable externo:** Cuando no existen comparables internos, se recurren a tipos de interés de mercado aplicados a empresas similares en tamaño, facturación y actividad.[^9]
3. **Tipo de referencia subsidiario:** En ausencia de comparables, se acepta como referencia mínima el **interés legal del dinero** vigente en cada ejercicio. Para 2026 ese tipo se sitúa en el **3,25%**, habiendo sido idéntico en 2025.[^10][^11]

**Importante distinción fiscal para el socio prestamista:** Si el préstamo del socio a la empresa supera el triple de la parte de fondos propios que le corresponde al socio, el exceso devenga intereses que tributan en la **base imponible general del IRPF** (tipos de hasta el 47% o más según CCAA), en lugar de en la base del ahorro (19%-28%). Este umbral es una trampa frecuente en startups con estructuras de capital reducidas.[^9]

### 1.4. Obligaciones de Retención y Declaración

Las obligaciones derivadas de los intereses en préstamos vinculados son concisas y perentorias:

- **Retención del 19%:** Cuando el perceptor de intereses es una persona física (el socio), la entidad pagadora (la sociedad) tiene obligación de practicar una retención fija del **19%** sobre los intereses abonados.[^12][^13][^9]
- **Modelo 123:** La sociedad debe ingresar trimestralmente en la AEAT las retenciones practicadas, declarando mediante el **Modelo 123** (declaración trimestral o mensual).[^13][^12]
- **Modelo 193:** Al cierre del ejercicio se presenta el resumen anual de retenciones sobre rendimientos del capital mobiliario.[^13]
- **Modelo 232:** Si el importe total de las operaciones vinculadas con una misma entidad o persona supera los **250.000 euros** en el ejercicio, o si las operaciones específicas del mismo tipo superan los **100.000 euros**, existe obligación de presentar el Modelo 232 de Declaración Informativa de Operaciones Vinculadas en el mes de noviembre. Para empresas de nueva creación con cifra de negocios cero, **cualquier importe** de operación vinculada está sujeto a declaración.[^14][^15]
- **Obligación de documentación:** La obligación de documentar formalmente las operaciones vinculadas no existe para importes inferiores a 250.000 euros, pero la prudencia operativa aconseja hacerlo siempre para evitar contingencias en inspección.[^15]

***

## 2. Bloqueo en Financiación Pública: ENISA y CDTI

### 2.1. El Mecanismo del Rechazo por ENISA

ENISA (Empresa Nacional de Innovación, S.A.), adscrita al Ministerio de Industria, es el principal instrumento de financiación pública directa para startups en España, con una dotación histórica de 303 millones de euros activada en 2025 y 86,2 millones de euros concedidos a 514 empresas en ese ejercicio.[^16][^17]

El criterio financiero más determinante para la aprobación de un préstamo participativo ENISA es la existencia de **fondos propios equivalentes, como mínimo, al 100% del importe del préstamo solicitado**. Este mínimo es imprescindible; no hay excepciones ni plazos de gracia.[^18][^19]

Un saldo deudor elevado en la cuenta 551 —es decir, dinero que la empresa ha entregado al socio sin contrato ni garantía de retorno— es un activo ficticio o cuestionable desde la perspectiva del análisis financiero de ENISA. No computa como fondos propios reales. Más grave aún: si ese saldo está acompañado de pérdidas acumuladas, puede provocar que el **patrimonio neto contable quede artificialmente inflado** en el balance, o que cuando ENISA analice la calidad de los fondos propios detecte que el capital está "vaciado" en la 551.

ENISA exige, además, **cuentas saneadas sin patrimonio neto negativo** y que los estados financieros sean coherentes, veraces y comprobables. Una cuenta 551 con saldo deudor relevante es, desde la perspectiva del analista público, una señal de riesgo moral: si los socios están extrayendo fondos de la empresa sin condiciones pactadas, la probabilidad de que los fondos del préstamo participativo sean usados para similares propósitos es elevada.[^20]

La recomendación operativa de ENISA es explícita: **ampliar capital y registrarlo cuanto antes si hay problemas estructurales**, siendo precisamente la capitalización de la deuda de la 551 el mecanismo indicado. ENISA considera como fondos propios válidos el capital social suscrito y desembolsado, reservas acumuladas, beneficios no distribuidos, prima de emisión y aportaciones de socios formalizadas para compensación de pérdidas.[^19][^21]

### 2.2. El Mecanismo del Rechazo por CDTI

El CDTI (Centro para el Desarrollo Tecnológico y la Innovación) aplica el marco normativo de la Unión Europea para determinar si una empresa es elegible para sus ayudas y subvenciones. Concretamente, aplica el criterio de **empresa en crisis** del **artículo 2.18 del Reglamento (UE) nº 651/2014** de la Comisión.[^22]

Una startup con saldo deudor material en la cuenta 551 puede incurrir en el supuesto de empresa en crisis si ese saldo, combinado con pérdidas acumuladas, provoca que los fondos propios caigan por debajo del umbral crítico. El test específico para una SL es:

> **(Fondos Propios – Capital Social Suscrito – Pérdidas Acumuladas) < −50% del Capital Social Suscrito**[^23][^22]

Si este ratio se cumple, la empresa queda automáticamente **descalificada como beneficiaria** de las ayudas CDTI. El CDTI precisa que el criterio de "no empresa en crisis" es condición sine qua non: *(Capital Social + Prima de Emisión) / 2 < Fondos Propios*. Un vaciamiento patrimonial operado a través de una cuenta 551 deudora, sin la contrapartida contable de un crédito formalizado y exigible, puede distorsionar este ratio hacia valores de descalificación.[^23]

Adicionalmente, las ayudas del CDTI exigen estar al corriente con la AEAT y con la Seguridad Social, lo cual entra en conflicto directo con una situación de regularización fiscal pendiente derivada de la cuenta 551.[^19]

***

## 3. El "Libro de Recetas del CFO": Soluciones de Subsanación

El protocolo de regularización de la cuenta 551 debe ejecutarse antes de tres eventos críticos: (i) el cierre del ejercicio contable, (ii) la presentación de solicitudes de financiación pública, y (iii) cualquier due diligence por inversores. A continuación se describe cada herramienta en detalle técnico.

### 3.1. Devolución Directa de Fondos (Solución Cero)

Es la solución más limpia y fiscalmente neutra. Si el socio ha retirado fondos de la empresa (saldo deudor), los devuelve íntegramente a la sociedad mediante transferencia. Si la empresa adeuda fondos al socio (saldo acreedor), la empresa los transfiere de vuelta al socio. No hay implicaciones en IS ni en IRPF. El único requisito operativo es la disponibilidad de tesorería.[^24][^1]

**Asiento de liquidación (saldo deudor, el socio devuelve):**
```
(572) Bancos                   XXX
        a (551) Cta. Cte. Socio       XXX
```

### 3.2. Formalización como Contrato de Préstamo

Cuando la devolución inmediata no es factible, la solución es reclasificar el saldo a una cuenta de préstamo formal, con devengo de intereses a valor de mercado.[^2][^1][^13]

**Saldo deudor (empresa prestamista, socio prestatario):**
- Reclasificación de la 551 a la cuenta **252 "Créditos a largo plazo a partes vinculadas"** (si plazo > 1 año) o la cuenta de activo correspondiente a crédito a corto plazo.[^12]
- La sociedad devenga ingresos financieros por los intereses del préstamo al tipo de mercado.

**Saldo acreedor (socio prestamista, empresa prestataria):**
- Reclasificación a la cuenta **1635 "Deudas a largo plazo con partes vinculadas"** o **523 "Deudas a corto plazo con partes vinculadas"**, según vencimiento.[^12]
- La sociedad registra gasto financiero por los intereses devengados, deducibles en IS siempre que no superen los límites de vinculación.[^12]

**Asiento de regularización intereses (cada período de devengo):**
```
(662) Intereses de deudas      XXX
        a (551 / 1635 / 523) Deuda con socio    XXX
(1635 / 523) Deuda con socio   XXX × 19%
        a (4751) H.P. acreedora por retenciones practicadas
```

### 3.3. Capitalización de la Deuda (Ampliación de Capital por Compensación)

Esta es la solución más potente para transformar un saldo acreedor de la 551 en fondos propios, lo que simultáneamente (a) elimina la contingencia fiscal, (b) mejora el ratio de solvencia del balance y (c) hace elegible a la empresa para financiación ENISA y CDTI.

**Fundamento jurídico:** El Instituto de Contabilidad y Auditoría de Cuentas (ICAC) establece que el aumento de fondos propios por compensación de deuda se contabilizará por el **valor razonable de la deuda que se cancela**. La Ley de Sociedades de Capital (LSC) regula el procedimiento en sus artículos sobre ampliación de capital dineraria y por compensación de créditos.[^25]

**Proceso paso a paso:**

| Paso | Acción | Soporte Legal/Documental |
|------|--------|--------------------------|
| 1 | Certificación contable del saldo de la 551 y de la identidad del acreedor | Balance interno + extracto contable |
| 2 | Convocatoria y celebración de Junta General Extraordinaria | Orden del día que incluya "Ampliación de capital por compensación de créditos" |
| 3 | Acuerdo de ampliación con los votos requeridos (mayoría reforzada en SL) | Acta de Junta notariada |
| 4 | Informe del administrador certificando la existencia, vencimiento y exigibilidad del crédito (art. 301 LSC) | Auditor no requerido si la sociedad no está obligada a auditoría |
| 5 | Escritura pública de ampliación de capital ante Notario | Escritura de ampliación |
| 6 | Inscripción en el Registro Mercantil y publicación en el BORME | Certificado registral |
| 7 | Ajuste contable: cancelar 551 / 1635 y cargar 190/100 Capital Social | Asiento de contrapartida |

**Asientos contables clave:**
```
(551 / 1635) Deuda con socio    XXX
        a (190) Participaciones emitidas       XXX

(190) Participaciones emitidas  XXX
        a (100) Capital Social              XXX
        a (110) Prima de emisión/asunción   XXX (si la hubiera)
```

**Consideraciones fiscales de la capitalización:**
- Para el socio, la capitalización de su crédito no genera tributación inmediata en el IRPF, dado que el crédito previo ya formaba parte de su patrimonio; simplemente cambia de naturaleza (crédito → participación).[^26]
- Para la sociedad, la operación es neutral en el IS, salvo diferencia entre valor en libros del crédito y valor razonable de las participaciones emitidas, que se registra como resultado financiero en la cuenta de pérdidas y ganancias.[^25]
- **Requisito de proporcionalidad:** Si hay varios socios, la ampliación debe mantener la proporcionalidad del capital o, si no es así, todos los socios deben consentir el quebranto del derecho de preferencia. De lo contrario, el exceso puede calificarse como donación encubierta o ingreso para la sociedad.[^5]

### 3.4. Reparto de Dividendos con Compensación del Saldo Deudor

Si el saldo de la 551 es deudor (el socio debe dinero a la empresa) y la sociedad dispone de beneficios distribuibles o reservas de libre disposición suficientes, la Junta General puede acordar un reparto de dividendos y compensarlo con el crédito que la empresa tiene contra el socio.

**Mecánica operativa:**
1. La Junta acuerda el reparto de dividendos por el importe equivalente al saldo deudor de la 551.
2. Se practica la **retención del 19% sobre el importe íntegro del dividendo** (artículo 76 y siguientes Ley 35/2006 del IRPF), que la sociedad ingresa en la AEAT mediante el Modelo 123.[^13]
3. El dividendo neto (importe bruto menos retención) se compensa con el saldo deudor del socio en la 551.

**Implicaciones en el IRPF del socio:** Los dividendos tributan en la base imponible del ahorro del IRPF a los tipos del 19% (hasta 6.000€), 21% (de 6.000€ a 50.000€), 23% (de 50.000€ a 200.000€), 27% (de 200.000€ a 300.000€) y 28% (desde 300.000€). La sociedad actúa como retenedora y los ingresos al IRPF del socio se declaran en la declaración de la Renta del ejercicio correspondiente.[^12]

**Limitación clave:** Esta vía solo es viable si la sociedad dispone de **reservas o beneficios distribuibles**. Una startup en fase de pérdidas acumuladas no puede distribuir dividendos. Adicionalmente, el reparto de dividendos requiere que el patrimonio neto no quede por debajo del capital social una vez realizada la distribución.

### 3.5. Aportación a Reservas vía Cuenta 118 (Saldo Acreedor)

En lugar de capitalizar el crédito del socio como capital social (ampliación formal), los socios pueden convertir su crédito en una **aportación irrevocable a los fondos propios** registrada en la **cuenta 118 "Aportaciones de socios o propietarios"**. Esta solución es más ágil administrativamente que la ampliación de capital formal porque no requiere escritura pública ni inscripción registral, únicamente acuerdo de Junta General.[^5]

**Ventaja estratégica:** La cuenta 118 computa como fondos propios a efectos de ENISA, CDTI y del test de empresa en crisis del Reglamento UE 651/2014, lo que la convierte en un mecanismo de reparación patrimonial rápido y eficaz.

**Requisito ineludible de proporcionalidad:** Todos los socios deben realizar la aportación en función de su participación en el capital. Si un socio aporta más que su cuota proporcional, el exceso se considera un ingreso para la sociedad (resultado de explotación) y puede generar obligaciones en el IS.[^5]

**Asiento:**
```
(551) Cta. Cte. Socio (saldo acreedor)    XXX
        a (118) Aportaciones de socios            XXX
```

***

## 4. Redacción del Contrato de Préstamo Socio-Sociedad: Cláusulas Mínimas

Un contrato de préstamo entre socio y sociedad que supere el escrutinio de la AEAT en operaciones vinculadas debe contener, como mínimo, los siguientes elementos:[^8][^27][^13]

### 4.1. Elementos Estructurales Obligatorios

| Cláusula | Contenido requerido | Riesgo si se omite |
|----------|--------------------|--------------------|
| **Identificación de partes** | Nombre, NIF, domicilio y condición del prestamista (socio/administrador) y prestatario (sociedad), con % de participación | Nulidad probatoria |
| **Causa y finalidad** | Descripción de la necesidad financiera de la sociedad; destino concreto de los fondos | Calificación como disposición encubierta |
| **Importe y fecha de disposición** | Capital principal prestado y fecha de transferencia bancaria justificada | Imposible verificar el inicio del devengo |
| **Tipo de interés nominal** | Mínimo: interés legal del dinero vigente (3,25% en 2026)[^10]. Óptimo: Euribor 12 meses + spread justificado por comparables internos/externos[^9] | AEAT imputará interés de mercado aunque no se haya pactado |
| **Modalidad de devengo** | Interés simple anual; fechas de liquidación (trimestral o anual recomendado) | Dificultad para practicar retenciones en Modelo 123 |
| **Cuadro de amortización** | Tabla con fechas, cuotas de capital e intereses para toda la vida del préstamo | Indicio de préstamo simulado sin voluntad de retorno |
| **Plazo de vencimiento** | Máximo recomendado: 3-5 años para saldos de hasta 100.000€; documentar capacidad de devolución del prestatario | La indefinición temporal es señal de alarma para la AEAT |
| **Cláusula de vencimiento anticipado** | Supuestos de resolución: concurso, impago de cuotas, cambio de control de la sociedad | — |
| **Resolución de conflictos** | Fuero jurisdiccional o sumisión a arbitraje de la cámara correspondiente | — |
| **Declaración de vinculación** | Mención expresa a que la operación es una **operación vinculada** en los términos del art. 18 LIS y que el tipo de interés refleja el valor de mercado | Dificulta la defensa ante una posible regularización |

### 4.2. Formalización ante la Oficina Liquidadora y Régimen Tributario Indirecto

El contrato, una vez firmado por ambas partes (con legitimación de firmas opcional pero recomendable), debe presentarse en la **Oficina Liquidadora del Impuesto de Transmisiones Patrimoniales y Actos Jurídicos Documentados (ITP-AJD)** de la Comunidad Autónoma correspondiente, declarando la operación como **no sujeta** (si el prestamista es empresario en el ejercicio de su actividad) o como **sujeta y exenta** (si el prestamista es persona física particular).[^28][^27]

La presentación ante la Oficina Liquidadora, aunque no genere cuota tributaria alguna, cumple la función estratégica de **dotar de fecha cierta al documento privado**, lo que impide que la AEAT cuestione retrospectivamente la existencia o la fecha del contrato en caso de inspección.[^27][^28]

**Régimen fiscal indirecto sintetizado:**
- Si el prestamista es la sociedad (empresario/profesional en ejercicio de actividad): operación **sujeta a IVA pero exenta** (art. 20.Uno.18º LIVA). No hay cuota IVA.[^27]
- Si se documenta en contrato privado (no escritura pública): **no sujeta a AJD**.[^27]
- Si se eleva a escritura pública sin garantía real inscribible: **tampoco tributa por AJD**.[^8][^27]
- Presentación del modelo 600 (o equivalente autonómico) declarando la exención para obtener el sellado de fecha.[^27]

### 4.3. Recomendaciones de Tipo de Interés para 2026

| Escenario | Referencia | Tipo orientativo 2026 |
|-----------|-----------|----------------------|
| Mínimo legal (referencia subsidiaria) | Interés legal del dinero | 3,25%[^10] |
| Interés de demora tributario | Referencia para cómputo de sanciones | 4,0625%[^11] |
| Referencia bancaria típica para pymes | Euribor 12M (≈ 2,5% en 2026) + spread 2-3% | ~4,5%-5,5% |
| Tipo utilizado por ENISA en sus propios préstamos | Euribor + 4% a 6% (primer tramo)[^18] | 6,5%-8,5% |

La recomendación técnica es pactar un tipo situado entre el interés legal del dinero (piso) y el tipo Euribor 12M + 3%, con revisión anual. Un tipo sensiblemente inferior al tipo al que la misma empresa paga sus préstamos bancarios resultará difícilmente defendible como "valor de mercado" ante la AEAT.

### 4.4. Acuerdo de Junta General Previo

Para préstamos de la sociedad al socio/administrador, la **Ley de Sociedades de Capital (art. 162 LSC)** exige el acuerdo previo de la Junta General. El socio beneficiario del préstamo tiene conflicto de interés y debe **abstenerse de votar**; sus participaciones se deducen del capital social para el cómputo de la mayoría requerida. La ausencia de este acuerdo puede provocar la nulidad del contrato, agravando la contingencia fiscal en lugar de mitigarla.[^8]

***

## 5. Guía de Decisión: Árbol de Soluciones por Casuística

| Situación en la 551 | Disponibilidad de tesorería | Solución preferente | Efecto en Fondos Propios | Complejidad |
|--------------------|-----------------------------|---------------------|--------------------------|-------------|
| Saldo deudor (< 60 días) | Sí | Devolución directa | Neutra | Baja |
| Saldo deudor (> 60 días) | No | Contrato préstamo + retenciones | Neutra | Media |
| Saldo deudor persistente | No | Compensación con dividendos (si hay reservas) | Reduce reservas | Media |
| Saldo acreedor (< 60 días) | — | Devolución directa | Neutra | Baja |
| Saldo acreedor con vocación permanente | — | Contrato préstamo socio-sociedad | Aumenta pasivo | Media |
| Saldo acreedor + necesidad ENISA/CDTI | — | Capitalización (ampliación + 118) | **Aumenta FFPP** | Alta |
| Saldo acreedor + pérdidas acumuladas | — | Aportación cuenta 118 + reducción pérdidas | **Aumenta FFPP netos** | Baja-Media |

***

## 6. Checklist CFO de Cierre Anual — Cuenta 551

Antes del 31 de diciembre de cada ejercicio, el CFO debe verificar sistemáticamente:

- [ ] **Revisión de movimientos:** Cada apunte tiene justificante (transferencia bancaria, factura, recibo).[^1]
- [ ] **Antigüedad del saldo:** Ningún saldo supera los 60-90 días sin haber sido reclasificado o documentado.[^2]
- [ ] **Contratos formalizados:** Todo saldo que permanezca en la 551 al cierre tiene su contrato de préstamo firmado, con cuadro de amortización y tipo de interés de mercado.[^13]
- [ ] **Intereses devengados y contabilizados:** Los intereses del ejercicio están periodificados y contabilizados en la cuenta de pérdidas y ganancias.
- [ ] **Retenciones ingresadas:** Los Modelos 123 trimestrales están presentados e ingresados.[^13][^12]
- [ ] **Evaluación del umbral del Modelo 232:** Si las operaciones vinculadas superan 250.000€ (o 100.000€ en operaciones específicas), o si la cifra de negocios es cero, el Modelo 232 está preparado para presentación en noviembre.[^14][^15]
- [ ] **Test de cobertura ENISA/CDTI:** Los fondos propios netos superan el capital social suscrito y no se cumple el criterio de empresa en crisis del Reglamento UE 651/2014.[^22][^23]
- [ ] **Trazabilidad de subcuentas:** Se han abierto subcuentas por persona física (551.001 - Socio A, 551.002 - Socio B) para facilitar la conciliación y la defensa documental.[^2]
- [ ] **Acuerdos de Junta documentados:** Para préstamos sociedad → socio/administrador, el acuerdo de Junta está en el libro de actas.[^8]

***

## Conclusión Estratégica

La cuenta 551 es, en definitiva, el espejo contable de la gobernanza financiera de una startup. Gestionada con rigor — contratos formalizados, tipos de interés a valor de mercado, retenciones practicadas, Modelos 123/193/232 al día — es una herramienta legítima y útil. Gestionada con laxitud, se convierte en el vector de entrada más frecuente de una inspección de la AEAT, en el motivo de rechazo más habitual en las solicitudes ENISA, y en el mecanismo involuntario por el que una pyme puede quedar calificada como empresa en crisis a efectos del CDTI. El coste de la regularización proactiva es marginal comparado con el coste de una regularización inspectora que incorpore cuotas tributarias, intereses de demora al 4,0625% y sanciones del 50%-150% de la cuota omitida.[^11]

---

## References

1. [Cuenta 551: cómo se contabiliza y regulariza - Holded](https://www.holded.com/es/blog/cuenta-551) - La cuenta corriente con socios y administradores se utiliza para registrar operaciones entre la empr...

2. [Cuenta 551: Cómo evitar problemas fiscales en el Cierre 2025](https://www.lealtadis.es/cuenta-551-socios-administradores-riesgos-cierre-fiscal/) - La cuenta 551 no es un cajón desastre. Aprende a regularizar saldos con socios, aplicar intereses de...

3. [551. Cuenta corriente con socios y administradores](https://www.plangeneralcontable.com/?tit=551-cuenta-corriente-con-socios-y-administradores&name=GeTia&contentId=pgc_551) - Definición. Cuentas corrientes de efectivo con socios, administradores y cualquiera otra persona nat...

4. [[PDF] Regularización de la partida 551, «Cuenta corriente con socios y ...](https://revistas.cef.udima.es/index.php/RCyT/article/download/22477/24205/61351) - Como se ha comentado, los movimientos de la cuenta 551 no permiten identificar el ne- gocio subyacen...

5. [[PDF] ¿Qué hacemos con la cuenta corriente con socios y administradores ...](https://www.aece.es/descargararchivo_docnoticias_1934) - La consecuencia será que se imputará al socio los ingresos correspondientes por dividendos en su ren...

6. [Operaciones Vinculadas: Qué son y Quién está Obligado](https://international-tps.com/es/operaciones-vinculadas/) - Las Operaciones Vinculadas es un tipo de relación mercantil que se da entre empresas tipificado en l...

7. [Rendimientos estimados del capital mobiliario y ...](https://www3.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c05-rendimientos-capital-mobiliario/rendimientos-capital-mobiliario-cuestiones-generales/concepto/rendimientos-estimados-capital-mobiliario-operaciones-vinculadas.html) - Conforme al artículo 18 de la LIS las relaciones de vinculación se dan en las operaciones realizadas...

8. [Cuestiones a considerar cuando la sociedad va a prestar dinero a ...](https://www.bouassociats.com/es/cuestiones-a-considerar-cuando-la-sociedad-va-a-prestar-dinero-a-un-socio/) - La concesión del préstamo por la sociedad al socio no está sujeta al Impuesto sobre Transmisiones Pa...

9. [Préstamos socio-sociedad: aspectos a tener en cuenta](https://www.panequeasesores.com/blog/prestamos-socio-sociedad-aspectos-tener-cuenta) - Tipo fijo del 19% · Exigibilidad. Cuando el perceptor de los intereses es una persona física, la ent...

10. [Interés Legal del Dinero - jjlmoya](https://www.jjlmoya.es/utilidades/interes-legal-dinero-2026/) - El tipo de interés legal del dinero se mantiene en el 3,25% para el ejercicio 2026, fijado por la Le...

11. [Tipo de interés legal y de demora para 2026 - OCU](https://www.ocu.org/dinero/renta-impuestos/noticias/interes-legal-demora) - El tipo de interés legal del dinero vigente para el año 2026, sigue siendo de momento el 3,25%. · El...

12. [Préstamos entre socio y sociedad](https://www.legalitas.com/actualidad/prestamos-entre-socio-sociedad) - Para el socio: si el préstamo es remunerado, los intereses percibidos tributan como rendimientos del...

13. [Préstamos de socios a sociedad](https://teamsystem.es/magazine/prestamos-de-socios-a-sociedad/) - Los intereses estarán sujetos a retención, fijada actualmente al 19%, y que, la sociedad deberá ingr...

14. [¿Tengo que presentar el modelo 232 para declarar las ...](https://www.supercontable.com/boletin/C/articulos/modelo_232_declaracion_operaciones_vinculadas_limites.html) - Repasamos los límites a tener en cuenta para estar obligados a presentar en noviembre la declaración...

15. [Obligación de informar y documentar operaciones vinculadas](https://vegaasesores.com/blog/obligacion-informar-documentar-operaciones-vinculadas-modelo-232/) - ¿A partir de qué importe es obligatoria la presentación del modelo 232? · 1. Realizadas con la misma...

16. [Enisa financia con 86,2 M€ a 514 empresas en 2025 y aumenta la ...](https://www.enisa.es/es/actualidad/noticias/enisa-financia-con-862-millones-de-euros-a-514-empresas-en-2025-y-aumenta-la-demanda-tras-su-nuevo-684) - Enisa cerró 2025 con 514 empresas financiadas y una inversión global de 86,2 millones de euros, en u...

17. [303M€ disponibles a través de la financiación ENISA 2025](https://leanfinance.es/blog/novedades-financiacion-enisa-2025/) - Los factores clave que determinarán la aprobación de tu financiación ENISA 2025 son: Cash flow estab...

18. [¿Qué es ENISA? Guía completa (2026) - Premoney](https://www.premoney.es/blog/enisa) - Todo sobre ENISA: qué es, líneas de financiación, requisitos y proceso de solicitud. +400 procesos g...

19. [Requisitos para solicitar ENISA 2026: guía completa - Upbizor](https://www.upbizor.com/requisitos-para-solicitar-enisa/) - Se requieren fondos propios equivalentes al importe del préstamo solicitado. Estos fondos deben esta...

20. [Claves para obtener la financiación de Enisa](https://www.enisa.es/es/actualidad/blog/claves-para-obtener-la-financiacion-de-enisa-678) - Presenta cuentas saneadas sin incurrir en situaciones críticas, como puede ser el patrimonio neto o ...

21. [ENISA denegado: causas comunes y cómo volver a solicitarlo](https://nexencapital.com/enisa/enisa-denegado-motivos-reales-rechazo-volver-solicitarlo/) - No haber presentado las cuentas anuales ante el Registro Mercantil, lo cual muestra poca seriedad le...

22. [Cuando la UE considera que una empresa está en crisis - innplica](https://www.innplica.com/cuando-la-ue-considera-que-una-empresa-esta-en-crisis/) - Cuando el resultado de FONDOS PROPIOS n-1 – PÉRDIDAS ACUMULADAS hasta n-1 sea una Cifra Negativa > 5...

23. [Requisitos para presentarse a CDTI: El principio de empresa en crisis](https://intelectium.com/es/post/requisitos-para-presentarse-a-cdti-el-principio-de-empresa-en-crisis) - Para el CDTI, es crucial que el ratio de empresa en crisis no se cumpla. Es decir, el capital social...

24. [Cómo regularizar la cuenta 551 con socios y administradores - Sage](https://www.sage.com/es-es/blog/como-regularizar-cuenta-551-socios-administradores/) - La cuenta 551 se utiliza para registrar operaciones entre la empresa y sus socios o administradores ...

25. [Sobre el tratamiento contable de una ampliación de capital por ...](https://www.icac.gob.es/contabilidad/sobre-el-tratamiento-contable-de-una-ampliacion-de-capital-por-compensacion-de-deudas) - Por lo tanto, si el aumento del capital social y la prima de emisión o asunción se acordase por un i...

26. [Ampliación de Capital: ¿Qué necesitas saber? - Asesores M&A](https://techma.bakertilly.es/ampliacion-de-capital-espana/) - El aumento de capital a través de la incorporación de la cuenta corriente de socios o accionistas pe...

27. [Préstamos entre familiares, de empresa a particular o viceversa](https://aticojuridico.com/prestamos-familiares-empresa-particular-tributan-presentar-modelo-600/) - Sin embargo, tanto la Ley del IVA como la del ITP declaran exentos los préstamos, por lo que tanto s...

28. [Práctica contable:¿Qué hacemos con la cuenta corriente con socios ...](https://www.aece.es/noticias/practica-contable-que-hacemos-con-la-cuenta-corriente-con-socios-y-administradores-cuenta-551_1447) - Práctica contable:¿Qué hacemos con la cuenta corriente con socios y administradores (cuenta 551)?. 8...

