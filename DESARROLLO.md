# Desarrollo — Informe de Estado de Planta

Información técnica para quien quiera modificar o publicar la app. Para usarla, ver el
[README](README.md). El contexto para agentes de IA está en [AGENTS.md](AGENTS.md).

## Tecnologías

HTML + CSS + JavaScript puro, **sin frameworks ni paso de build**. Mobile-first.

- [jsPDF](https://github.com/parallax/jsPDF) 2.5.1 incluido de forma local (`jspdf.umd.min.js`).
- Hosting pensado para GitHub Pages (rutas relativas).

## Estructura

```
├── index.html            # Interfaz
├── style.css             # Estilos y temas
├── app.js                # Lógica: carga, fotos, PDF
├── auditoria.js          # Modo auditoría interna (opcional)
├── checklist.js          # Lista de verificación de auditoría (con frases típicas)
├── frases.js             # Frases rápidas (típicas y propias)
├── brand.js              # Marca: empresa, color de acento y textos fijos del PDF
├── manifest.json         # Configuración PWA
├── sw.js                 # Service worker (caché offline)
├── jspdf.umd.min.js      # Librería de PDF
├── GUIA_MARCA.md         # Cómo cambiar logo, colores y textos
├── docs/
│   ├── GUIA.md           # Guía de uso con capturas
│   ├── img/              # Capturas y demo.gif (las genera tools/demo.js)
│   └── video/            # Video de demostración (lo genera tools/video.js)
├── tools/                # Scripts de la guía y el video (no los carga la app)
└── AGENTS.md             # Contexto para agentes de IA
```

## Probar en la compu

Para probarla en local (el service worker exige `localhost` o HTTPS):

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000`.

## Guía, GIF y video

Las capturas de `docs/img`, el GIF del README y el video de `docs/video` se generan con
Playwright sobre la app real, con datos de ejemplo **inventados** (`tools/ejemplo.js`: empresa
"Planta Demo", lotes `L-04xx` y fotos que son ilustraciones en SVG). Las páginas del PDF salen
del PDF que genera la app. Volver a generarlos cada vez que cambie algo visible de la app o del PDF.

Hace falta Node, Playwright, ffmpeg y poppler-utils (`pdftoppm`):

```bash
npm i -g playwright && npx playwright install chromium
export NODE_PATH=$(npm root -g)   # el repo no tiene package.json
node tools/demo.js                # capturas y GIF (unos 20 s)
node tools/video.js               # video (unos 3 min)
```

- `tools/servidor.js`: sirve la app desde el repo en un puerto libre.
- `tools/ejemplo.js`: datos de ejemplo (reporte diario y auditoría) y cómo se cargan en el
  `localStorage` del navegador de la grabación. La app no los incluye: arranca vacía.
- `tools/video.js` graba con capturas seguidas a resolución doble y descarta los cuadros que
  salen corridos en medio de un scroll.

## Publicar

Publicarla en GitHub Pages (Settings → Pages → `main` / `(root)`) o cualquier hosting
estático. Las rutas son relativas, así que funciona en un subdirectorio.

## Personalización de la marca

Todo se edita en `brand.js`, sin tocar `app.js`:

```js
const BRAND = {
  empresa: '...',            // texto de respaldo si no carga logo.png
  colorAcento: '#BF382A',    // línea bajo títulos
  tituloInforme: 'REPORTE DIARIO\nDE ESTADO DE PLANTA',
  etiqueta: 'INFORME | CALIDAD',
  departamento: 'DEPARTAMENTO DE CALIDAD',
  objetivo: '...'            // párrafo fijo bajo el encabezado
};
```

Lo más simple es cargar el nombre de la empresa y el logo desde el panel **⚙️ Configuración** de la app: no hace falta tocar el código. Los valores de `brand.js` quedan como respaldo cuando la configuración está vacía. Otra opción es agregar un archivo `logo.png` en la raíz (y sumarlo a `FILES` en `sw.js`). Detalles en [GUIA_MARCA.md](GUIA_MARCA.md).

## Notas de mantenimiento

- Al cambiar cualquier archivo, subir la versión `V` en `sw.js` y mantener `FILES` al día; si no, los celulares siguen mostrando la versión vieja.
- Los datos viven en el dispositivo: si se borran los datos del navegador, se pierde el borrador. Generar el PDF antes de limpiar.
- El repositorio es público: no subir datos personales ni sensibles de la empresa.
