# AGENTS.md

Contexto para agentes de IA (Claude Code, Codex, etc.) que trabajen en este repositorio.

## Qué es
PWA para armar rápido el **Informe de Estado de Planta** (desvíos de calidad) desde el celular durante la recorrida: se cargan sector, fotos, descripción y acción correctiva de cada desvío, y se genera un PDF con las fotos acomodadas solas. Opcionalmente, la IA mejora la redacción.

## Stack y restricciones
- HTML + CSS + JavaScript puro. **Sin frameworks ni paso de build.**
- Mobile-first, funciona offline (service worker con caché). PDF con jsPDF 2.5.1 incluido local (`jspdf.umd.min.js`).
- Datos en `localStorage`: desvíos en `informe_planta_v1`; configuración de la empresa en `informe_config` (`{empresa, depto, logo:{d,w,h}}`, logo en PNG reducido a máx. 800x300 px); fotos reducidas a 1200 px, JPEG.
- Hosting: GitHub Pages (rutas siempre **relativas**). Interfaz y comentarios en español.
- Alcance mínimo (MVP): no agregar funciones no pedidas ni dependencias nuevas sin avisar.

## Archivos
- `index.html`, `style.css`, `app.js`: la app. `config.js`: URL del Worker (`IA_ENDPOINT`).
- `checklist.js`: lista de verificación de auditoría interna ISO 9001 (global `CHECKLIST`, 37 puntos por categoría). Opcional: se activa en Configuración (`cfg.auditoria`). Cada desvío puede guardar una **copia** del punto en `pto` (`{n,p,c,r}`) para que los informes viejos no cambien si se edita la lista; en el PDF sale bajo el título del desvío (punto, criterio y requisito ISO) y también se pasa como contexto a la IA. Al final del PDF, si algún desvío tiene punto, va un "RESUMEN POR PUNTO DE LA LISTA" (punto, requisito ISO y N° de desvíos).
- `brand.js`: nombre de empresa, color de acento y textos fijos del PDF. `logo.png`: logo opcional (no incluido en el repo).
- `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`: PWA.
- `worker.js`: Cloudflare Worker que usa el binding de Workers AI (no lo carga la app).
- `GUIA_IA.md`: guía de puesta en marcha de la IA. `GUIA_MARCA.md`: cómo reemplazar el logo y ajustar colores/textos.

## Formato del informe (respetar)
Replica la plantilla Word de la empresa (branding). El usuario carga empresa, logo y departamento en el panel **⚙️ Configuración** (`cfg` en `app.js`). Orden de prioridad del encabezado: logo de Configuración → `logo.png` → nombre de empresa de Configuración → `BRAND.empresa`. El departamento usa `BRAND.departamento` si está vacío. Los demás textos fijos y colores están en `brand.js`; no hardcodearlos en `app.js`. El logo se agrega con compresión (`'FAST'`): sin ella jsPDF lo guarda sin comprimir y el PDF pesa ~750 KB más.
- **Encabezado en cada página:** logo (o nombre de empresa) arriba a la izquierda + línea gris fina debajo. Se redibuja en cada salto de página (`drawHeader()`).
- **Portada (solo página 1):** etiqueta roja con letras espaciadas ("I N F O R M E  |  C A L I D A D"), título en Times bold 22pt a dos líneas, meta en Courier ("FECHA dd/mm/aaaa", nombre en mayúsculas, departamento), párrafo "Objetivo del relevamiento" fijo.
- **Fuente del cuerpo:** Courier (monoespaciada) en todo el contenido de los desvíos; el título usa Times; la etiqueta roja y el nombre de empresa (fallback sin logo) usan Helvetica.
- **Flujo continuo:** los desvíos NO empiezan cada uno en página nueva; el contenido fluye y el salto de página ocurre solo cuando no entra (`need()`), igual que en Word.
- Cada desvío: `DESVÍOS N°X SECTOR` (mayúsculas) con línea de color de acento debajo; "Descripción:" en cursiva + párrafo; "Registro fotográfico" en cursiva + fotos en grilla de hasta 2 columnas, cada foto escalada a un ancho de celda fijo manteniendo su proporción (alto tope 120mm), no recortada; "Acción Correctiva Propuesta:" en negrita + viñetas (una acción por línea en el campo `acc`, sin numerar).
- **Pie de página en cada página:** "Estado de planta · dd/mm/aaaa | NOMBRE | Página N", centrado, chico, gris. Se agrega en una segunda pasada al final (`doc.setPage(p)`) porque recién ahí se conoce el total de páginas.
- No usar los nombres japoneses de las 5S (Seiri, Seiton, etc.) en las acciones.

**Trampa ya resuelta, no reintroducir:** si un salto de página ocurre dentro de `need()` justo antes de imprimir texto, `drawHeader()` cambia la fuente activa (usa Helvetica para el nombre de empresa). `need()` guarda la fuente/tamaño activos con `doc.getFont()` antes de llamar a `drawHeader()` y los restaura después. Si se modifica `need()`, mantener ese guardado/restaurado o el texto que sigue a un salto de página sale con la tipografía equivocada.

## IA
- Flujo: `app.js` (`mejorar()` / `askAI()`) → Worker (`X-App-Token`) → Workers AI (modelo definido en `worker.js`).
- Los prompts están en `mejorar()`. La IA reescribe texto; **no recibe fotos**. El resultado queda editable y con "Deshacer".
- Si `IA_ENDPOINT` está vacío, los botones de IA quedan ocultos.

## Reglas de trabajo
- **Nunca** poner claves de API en el repo: viven como secrets en Cloudflare.
- Al cambiar cualquier archivo, subir la versión de `V` en `sw.js` y mantener `FILES` al día.
- Para probar en local: `python3 -m http.server` y abrir `http://localhost:8000` (el service worker exige localhost o HTTPS).
- No incluir datos personales ni de la empresa en el repo (es público en GitHub Pages).
