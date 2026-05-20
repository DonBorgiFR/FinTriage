# Guía de Uso Operativa — APTKI Workstation

Esta guía proporciona a los consultores de **APTKI** los conocimientos prácticos para operar el CFO & Portfolio Toolkit de forma eficiente en su día a día.

---

## 1. ¿Qué es APTKI Workstation y para qué sirve?

**APTKI Workstation** es una aplicación client-side diseñada para el análisis financiero avanzado y el triage estratégico de startups. Su principal función es convertir la contabilidad en bruto (libros diarios PGC españoles en formato `.xlsx`) en un diagnóstico interactivo en cuestión de segundos, evaluando la fiabilidad de la información contable, estimando necesidades de caja, proyectando escenarios de supervivencia y determinando la elegibilidad de las compañías para programas de financiación pública (ENISA, CDTI) o rondas de inversión privada.

---

## 2. Flujo de Trabajo Recomendado

Para realizar un análisis financiero riguroso, siga este orden de principio a fin:

```
[1] Carga ──► [2] Análisis Contable ──► [3] Plan de Choque ──► [4] Scoring y Proyecciones ──► [5] Triage y Exportación
```

1.  **Filtro Día 1**: Suba el libro diario contable en bruto `.xlsx`. Revise las anomalías críticas detectadas por el motor contable y evalúe la fiabilidad del dato mediante el **Trust Score**.
2.  **Mapeo Contable y EBITDA**: Asigne y corrija las cuentas a las categorías lógicas de negocio (Ventas, COGS, Margen Bruto, Personal, SG&A) y normalice el EBITDA a través del panel de **Periodificaciones (Accruals)**.
3.  **Evaluación de Supervivencia**: Si el Runway es menor a 4 meses, entre en la pestaña **Defensa** para activar el plan de choque y simular mejoras en los cobros y pagos de circulante.
4.  **Cierre y Persistencia**: Guarde su progreso exportando la sesión en formato `.aptki` para no perder la información, u organice sus múltiples startups dentro del módulo **Cartera**.

---

## 3. Cómo Cargar un Libro Diario o una Sesión `.aptki`

La pantalla principal dispone de una zona reactiva de carga ("drag & drop"):
*   **Para libros diarios nuevos**: Arrastre un archivo Excel `.xlsx` que contenga el diario contable. El sistema iniciará automáticamente el parser de SheetJS, normalizará columnas y cargará la configuración por defecto.
*   **Para sesiones preexistentes**: Arrastre un archivo `.aptki` de sesión individual (`single`) o agregada (`portfolio`). El sistema detectará el formato de forma automática, omitirá el paso de parseo inicial y rehidratará todo su estado (incluyendo mapeos personalizados, periodificaciones y checklists) de manera instantánea.

---

## 4. Cómo Interpretar el Dashboard Principal

El dashboard individual de la startup se estructura en 4 paneles informativos:
*   **Métricas Core**: Situado en la cabecera. Muestra la caja disponible, el EBITDA analítico, el burn rate mensual estimado y la proyección del Runway.
*   **Tabla de PyG Analítica**: Reclasifica la contabilidad PGC en categorías operativas. Si una categoría aparece con sospechas de inconsistencia contable, se mostrará con un aviso y un color de alerta.
*   **Audit Trail e Indicadores de Confianza**: Muestra el historial completo de cambios realizados por el consultor durante la sesión contable para garantizar la auditabilidad del reporte.
*   **Hallazgos Accionables**: Tabla resumen con el tipo de hallazgo, nivel de impacto, severidad, justificación y la recomendación técnica concreta que el consultor debe trasladar a los fundadores.

---

## 5. Cómo Usar el Módulo de Defensa / Supervivencia

Este módulo se activa en la pestaña **Defensa** y está reservado para compañías en situación de urgencia financiera:
*   **DSO y DPO Reales**: Visualice los plazos promedio en los que la startup cobra a sus clientes (DSO) y paga a sus proveedores (DPO). Se calculan agregando los saldos reales de los prefijos de las cuentas del Grupo 43 (Clientes) y Grupo 40 (Proveedores).
*   **Simulador de Circulante**: Arrastre los selectores de DSO y DPO objetivo para modelar cómo impacta acelerar los cobros o retrasar los pagos en la extensión del Runway disponible.
*   **Simulador de Ahorro**: Introduzca un porcentaje de reducción de gastos operativos para recalcular el impacto combinado en la caja disponible.
*   **Plan de Choque de 100 Días**: Checklist operativo con 10 directrices específicas de APTKI para proteger la liquidez. Las casillas que marque se guardarán de manera persistente al exportar el archivo `.aptki`.

---

## 6. Cómo Usar la Pestaña Cartera (Control Multicompañía)

Diseñada para gestionar entre 3 y 4 startups simultáneamente bajo la presión diaria del consultor:
1.  **Ingesta Masiva**: Ingrese al panel **Cartera** y cargue múltiples archivos `.aptki` de sesión individual de una sola vez. El sistema creará una fila en la tabla para cada empresa.
2.  **Triage de un Vistazo**: La tabla muestra un resumen ejecutivo tabular con el Runway, el Trust Score de la contabilidad, el Foco Principal diagnosticado, los Bloqueadores activos y la Ruta Operativa recomendada.
3.  **Generar Ficha Handoff Express**: Haga clic en el botón de portapapeles `📋` en la fila de cualquier startup. Se copiará de inmediato una ficha sintética con el diagnóstico tridimensional y la acción sugerida, perfecta para enviar por Slack o correo al equipo gestor de la startup.
4.  **Transición Profunda**: Para profundizar en el análisis contable de cualquier startup de la cartera, haga clic en el botón **Analizar** `➜`. Esto rehidratará instantáneamente el Dashboard con el estado e historial intacto de esa startup en particular.

---

## 7. Glosario de Conceptos Clave

Para interpretar correctamente el diagnóstico automatizado de la Workstation:

| Concepto | Significado Operativo |
|---|---|
| **Runway** | La cantidad de meses de vida que le quedan a la startup basándose en su saldo de caja actual y su ritmo de consumo mensual (Burn Rate). |
| **Trust Score** | Puntuación de 0 a 100 que mide la consistencia contable del libro diario (penaliza descuadres, uso abusivo de la cuenta puente 555 o variaciones anormales). |
| **Foco Principal** | La dimensión crítica donde la empresa presenta su mayor vulnerabilidad (Caja, Deuda Pública, Financiabilidad, Circulante, Costes o Caso Financiero). |
| **Bloqueadores** | Contingencias en balance que impiden iniciar expedientes de financiación (Trust Score < 65%, Deuda Pública > 3.000€ o Cuenta corriente con socios 551/550 > 3.000€). |
| **Ruta Sugerida** | El departamento o canal idóneo al que se debe derivar a la startup para mitigar el foco de conflicto (CFO, Fundraising, Financiación Pública, Bancaria o Gestoría). |

---

## 8. Exportación e Importación de Sesiones

*   **Exportación Individual (`single`)**:
    *   Haga clic en **Guardar Sesión** en cualquier pestaña de análisis de startup.
    *   Genera un archivo `.aptki` nombrado automáticamente según el cliente (ej: `nombreempresa_aptki.aptki`).
*   **Exportación de Cartera (`portfolio`)**:
    *   Haga clic en **Exportar Cartera** en la pestaña **Cartera**.
    *   Genera un archivo `.aptki` consolidado que agrupa las startups y mantiene intactas las sesiones completas de cada una en un array unificado (`cartera_aptki_AAAA-MM-DD.aptki`).
*   **Importación Transparente**:
    *   Al arrastrar o seleccionar cualquier archivo `.aptki`, el sistema inspecciona de forma inteligente el payload. Si contiene un array de `startups`, abre el modo Cartera Multicompañía. Si contiene un ledger individual, abre el modo Startup.

---

## 9. Validaciones Manuales Básicas tras la Fase 8

Para validar el correcto funcionamiento del sistema en su entorno local, realice estas comprobaciones:
1.  **Carga Masiva**: Arrastre 3 sesiones `.aptki` individuales y compruebe que se visualizan las 3 startups en la tabla de Cartera de manera reactiva.
2.  **Prueba de Bloqueo por Cuenta 551**: Asegure que una startup con un préstamo al socio de 5.000€ en su sesión muestra el bloqueador *"Saneamiento Socios (Due Diligence)"* y es asignada a la ruta *"Gestoría / Orden Contable"*.
3.  **Prueba de Bloqueo Fiscal**: Valore que un saldo del Grupo 47 mayor a 3.000€ bloquea la ruta de financiación pública y asigna la startup a *"Gestoría"*.
4.  **Handoff de Portapapeles**: Copie la Ficha Handoff de una empresa y péguela en un editor de texto. Valide que toda la información coincide con la tabla.

*(Para los pasos específicos de QA, consulte [docs/manual_validation.md](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/docs/manual_validation.md)).*

---

## 10. Errores Habituales y Casos Límite

*   **Duplicidad de Nombres**: Si importa varias sesiones `.aptki` individuales de la misma startup (por ejemplo, de diferentes periodos o escenarios), el sistema las listará a todas en la cartera. Valide el campo "Empresa" o cargue únicamente el archivo más reciente para evitar confusión visual.
*   **Pérdida de Cartera**: La herramienta funciona 100% en memoria reactiva por motivos de seguridad bancaria. **Si recarga la pestaña del navegador (F5), perderá la cartera de startups cargada**. Acostúmbrese a hacer clic en **Exportar Cartera** antes de refrescar la página.
*   **Clipboard Fallback**: Si el navegador no permite el acceso nativo a la API del portapapeles (`navigator.clipboard`), el sistema activará un fallback robusto seleccionando automáticamente el texto de un área temporal oculta para garantizar el copiado. Si aun así fallara, el sistema mostrará un cuadro de diálogo para que copie el texto manualmente.
*   **Foco Caja (<4 meses) vs. Semáforo Rojo (<3 meses)**:
    *   Un Runway menor a **4 meses** activa automáticamente el Foco Principal en **Caja**, proponiendo recortar el burn rate y activar el Plan de Choque.
    *   El semáforo **Rojo** 🔴 se enciende únicamente cuando el Priority Score es alto o el Runway es inferior a **3 meses**, denotando una urgencia extrema donde la supervivencia está comprometida en el cortísimo plazo.
