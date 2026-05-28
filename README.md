# FinTriage — CFO & Portfolio Toolkit

> **Versión Actual:** `v1.3.1` · Plataforma Local-First de Triage y Diagnóstico Financiero para Startups y Pymes.

**FinTriage** es una plataforma profesional de análisis, saneamiento y triage financiero client-side, diseñada especialmente para CFOs externos, consultores independientes, asesores y fundadores de startups. Esta herramienta automatiza la ingesta de libros contables del Plan General Contable (PGC) español, diagnosticando la consistencia de los apuntes, recalculando márgenes analíticos, proyectando escenarios de caja y ofreciendo un panel de control multicompañía para priorizar carteras enteras en tiempo real.

---

## 1. El Problema que Resuelve

Los fundadores y consultores financieros se enfrentan a menudo a contabilidades rígidas, desordenadas o desactualizadas de múltiples startups de manera simultánea. Extraer información de gestión estratégica y KPIs de un libro diario en Excel (`.xlsx`) requiere horas de reordenamiento manual propenso a errores.

**FinTriage** resuelve esto de forma instantánea:
*   **Decodifica el Caos Contable**: Lee diarios contables en su formato nativo de exportación, detecta descuadres y evalúa la fiabilidad del dato mediante un **Trust Score (0-100)** basado en reglas deterministas.
*   **Normaliza el EBITDA**: Identifica, periodifica y prorratea picos atípicos de gasto o ingresos (devengos) para simular el EBITDA orgánico real de la compañía sin mutar los apuntes base.
*   **Triage Multicompañía Inteligente**: Permite cargar y supervisar de 3 a 4 startups de forma simultánea, detectando bloqueadores clave de auditoría previa (préstamos a socios en cuenta 551, deudas públicas en el Grupo 47) y asignando una ruta operativa inmediata para cada caso.

---

## 2. Enfoque Local-First: Confidencialidad y Procesamiento en Navegador

FinTriage opera bajo una filosofía estrictamente **Local-First (Zero-Server)**. 
*   **Procesamiento Local**: El 100% de la carga, parseo, cálculo, visualización y exportación de datos financieros se ejecuta localmente en el navegador del usuario.
*   **Sin Envío a Servidores**: Tus datos financieros confidenciales no se transmiten a servidores externos ni se almacenan en bases de datos en la nube. La confidencialidad queda resguardada por diseño al operar íntegramente del lado del cliente, evitando cualquier tipo de recopilación o transferencia externa involuntaria.

---

## 3. Stack y Arquitectura General

La aplicación está diseñada como una Single Page Application (SPA) ultraligera de alto rendimiento, optimizada para cargarse instantáneamente sin dependencias pesadas:

*   **Core**: HTML5 Semántico y Vanilla Javascript (ES6+).
*   **Reactividad**: Motor reactivo nativo implementado con **Javascript Deep Proxies** sobre el estado global (`STATE`), coordinando automáticamente vistas y flujos.
*   **Estética Visual**: Vanilla CSS con diseño premium de alta fidelidad basado en **Dark Glassmorphism** (fondos translúcidos con `backdrop-filter: blur`, gradientes sutiles y micro-animaciones reactivas).
*   **Procesamiento de Libros**: Integración con **SheetJS** para ingesta ultrarrápida de libros diarios grandes en formato `.xlsx`.
*   **Gráficos**: Generación nativa de gráficos estadísticos, de barras y de cascada interactivos mediante SVG manipulados dinámicamente.
*   **Exportación**: Integración con **html2pdf.js** para reportes con portada ejecutiva y exportaciones vivas a Excel con fórmulas de cálculo dinámicas.

---

## 4. Estructura de Módulos

| Módulo | Archivo | Responsabilidad / Función |
|--------|---------|---------------------------|
| **Store** | `store.js` | Motor de Estado Reactivo centralizado (Deep Proxy) y patrón Observer. |
| **Parser** | `parser.js` | Ingesta Excel (.xlsx), saneamiento temporal contable y anomalías de nivel 1. |
| **Analyzer** | `analyzer.js` | Motor de reglas declarativo, Trust Score, clasificación a PyG analítica y motor de devengos. |
| **Cartera** | `cartera.js` | Triage tridimensional multicompañía, semáforos de urgencia y routing por perfiles. |
| **Defensa** | `defensa.js` | Cockpit de supervivencia de caja, DSO/DPO reales y plan de choque interactivo de 100 días. |
| **Scorer** | `scorer.js` | Evaluación de elegibilidad financiera para líneas ENISA y CDTI Neotec. |
| **Forecaster** | `forecaster.js` | Proyección estadística a 12 meses con escenarios (optimista, base, pesimista). |
| **Session** | `session.js` | Persistencia unificada local de archivos de sesión en formato `.fintriage` y `.aptki`. |
| **Narrative** | `narrative.js` | Motor de análisis textual para disclaimers y comentarios de EBITDA. |
| **Checklist** | `checklist.js` | Framework interactivo "Filtro Día 1" con biblioteca de reglas y localStorage. |
| **Exporter** | `exporter.js` | Exportaciones dinámicas con fórmulas a Excel y PDFs con portada interactiva. |
| **App** | `app.js` | Controlador SPA principal, ruteador de vistas, manipulación del DOM y Audit Trail. |

---

## 5. Formato de Persistencia Dual `.fintriage`

El sistema interactúa de forma transparente con dos esquemas locales basados en JSON:

*   **Modo Individual (`mode: "single"`)**: Almacena el ledger parseado de una startup, mapeos contables personalizados modificados por el consultor, periodificaciones aprobadas, checklist, audit trail e inputs de simulaciones de caja en un archivo `.fintriage`.
*   **Modo Cartera (`mode: "portfolio"`)**: Consolida la lista completa de startups en un único archivo. Cada startup en el array encapsula su nombre, arquetipo y su payload de `sessionData` individual completo, permitiendo la rehidratación profunda al transicionar de vista.
*   **Compatibilidad de Lectura**: FinTriage mantiene retrocompatibilidad total para leer archivos históricos `.aptki`. El sistema detecta el formato al arrastrarlo y migra la sesión de forma transparente.

---

## 6. Flujo de Uso Básico

```
[Libro Diario .xlsx] o [Sesión .fintriage / .aptki]
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
      - Cockpit de Defensa       - Copiado de Ficha Express 📋
      - Proyecciones 12M         - Transición con 1-click a Dashboard
```

1.  **Ingesta de Datos**: Arrastre un libro diario contable `.xlsx` o cargue uno o varios archivos de sesión `.fintriage`.
2.  **Triage de Cartera**: Controle de un vistazo el panel multicompañía, visualizando el semáforo de urgencia, runway, problemas principales y bloqueadores de cada startup.
3.  **Ficha Express**: Haga clic en el botón de portapapeles `📋` en cualquier fila de la tabla para copiar y comunicar la ficha sintética de triage inmediatamente a los equipos.
4.  **Análisis Profundo (Dashboard)**: Entre al detalle de cualquier compañía para reclasificar cuentas, aplicar periodificaciones contables, completar el Checklist Día 1 y simular planes de supervivencia de caja.
5.  **Exportación y Cierre**: Guarde la sesión de forma individual o agregada en formato `.fintriage` para retomar el trabajo sin fricciones.

---

## 7. Despliegue en Vercel (Sitio Estático)

Al ser una aplicación 100% client-side sin backend ni base de datos, el despliegue es sumamente sencillo e inmediato:

### Opción 1: Despliegue Directo de 1-Click con Vercel CLI
Si tienes Vercel CLI instalado en tu terminal:
```bash
# 1. Abre la terminal en el directorio raíz de la herramienta
# 2. Ejecuta el comando de despliegue
vercel
```
Sigue las preguntas interactivas en pantalla y en menos de 30 segundos tendrás un enlace de producción HTTPS listo.

### Opción 2: Despliegue mediante GitHub
1. Sube el proyecto a tu propio repositorio de GitHub.
2. Inicia sesión en [Vercel Dashboard](https://vercel.com).
3. Haz clic en **"Add New"** > **"Project"** e importa tu repositorio.
4. Vercel detectará que es un proyecto estático puro. Haz clic en **"Deploy"** sin realizar ninguna configuración adicional de compilación.

---

## 8. Licencia y Confidencialidad

*   **Licencia**: Licencia MIT. Libre de usar, modificar y distribuir de forma personal o comercial.
*   **Garantía**: Esta herramienta se provee "tal cual", sin garantías de ningún tipo. Los diagnósticos financieros, tributarios y de elegibilidad pública son orientativos y de carácter instrumental; no constituyen asesoría fiscal, legal o de inversión formal.

---

## 9. Roadmap Corto (Próximos Pasos)

1.  **Copiloto IA Financiero (Fase 10)**: Integración de un motor local de lenguaje o mediante API de alto rendimiento para interpretar la Ficha de Triage y redactar informes de Due Diligence e inversión completos de forma automatizada.
2.  **Score Avanzado de Financiación Bancaria**: Incorporación de reglas de scoring basadas en el rating tradicional de entidades bancarias españolas (CIRBE y capacidad de servicio de la deuda).
3.  **Conexión API Bancaria (PSD2)**: Módulo opcional de ingesta de movimientos bancarios en tiempo real para contrastar la conciliación de caja de forma ágil sin depender exclusivamente del diario.
---

## 10. Identidad Visual y Logotipos

Los recursos gráficos oficiales de FinTriage están disponibles en la carpeta [assets/](file:///c:/Users/borja/OneDrive/Documentos/Antigravity/APTKI/workstation/assets/) e incluyen las siguientes variantes:
*   `logo-wordmark.svg`: Wordmark tipográfico limpio y minimalista (diseño recomendado).
*   `logo-dark.svg`: Logotipo optimizado para interfaces oscuras (dark mode).
*   `logo-light.svg`: Logotipo optimizado para interfaces claras (light mode).
*   `favicon-icon.svg`: Isotipo / favicon compacto para navegación web.
