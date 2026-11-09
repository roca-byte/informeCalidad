# Informe de Estado de Planta

[![QualityOS](https://img.shields.io/badge/QualityOS-calidad_en_planta-0f5c6e?style=flat-square)](https://github.com/roca-byte)

PWA para armar rápido el **Informe de Estado de Planta** (desvíos de calidad) desde el celular durante la recorrida. Se cargan sector, fotos, descripción y acción correctiva de cada desvío, y la app genera un **PDF** con las fotos acomodadas solas.

**App publicada:** https://roca-byte.github.io/informeCalidad/

## Características

- **Configuración de la empresa** (panel ⚙️): nombre de la empresa, logo y departamento. Se cargan una sola vez desde la app, quedan guardados en el dispositivo y se usan en todos los informes. Se abre solo la primera vez.
- **Carga de desvíos en el momento**: sector (con autocompletado de sectores ya usados), fotos de la cámara o galería, descripción y acciones correctivas.
- **Fotos**: se reducen a 1200 px (JPEG) y se pueden reordenar o quitar antes de guardar.
- **Edición**: cada desvío guardado se puede editar o eliminar antes de generar el informe.
- **PDF automático** (jsPDF) con el formato de la plantilla de la empresa:
  - Logo y línea gris en el encabezado de cada página.
  - Portada con etiqueta, título, fecha, nombre y departamento, más el párrafo de objetivo.
  - Un bloque por desvío: descripción, registro fotográfico en grilla de hasta 2 columnas (sin recortar) y acciones correctivas en viñetas.
  - Flujo continuo con saltos de página automáticos y pie con fecha, nombre y numeración.
- **Modo auditoría interna** (opcional, ISO 9001): lista de verificación por sector (C / NC / N/A / NV), tipo y N° de cada hallazgo, ejercicio de trazabilidad opcional, conclusión, firmas y la lista completa como anexo del PDF.
- **Borrador guardado** en el dispositivo (`localStorage`), por si se cierra la app a mitad de la recorrida.
- **Funciona offline** gracias al service worker, e instalable como app.
- **Tema claro/oscuro** automático, según el del celular.

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
├── checklist.js          # Lista de verificación de auditoría
├── brand.js              # Marca: empresa, color de acento y textos fijos del PDF
├── manifest.json         # Configuración PWA
├── sw.js                 # Service worker (caché offline)
├── jspdf.umd.min.js      # Librería de PDF
├── GUIA_MARCA.md         # Cómo cambiar logo, colores y textos
└── AGENTS.md             # Contexto para agentes de IA
```

## Uso

Para probarla en local (el service worker exige `localhost` o HTTPS):

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. Para usarla en el celular, publicarla en GitHub Pages (o similar) e instalarla desde el navegador ("Agregar a pantalla de inicio").

Flujo de trabajo:

1. La primera vez: abrir **⚙️ Configuración** y cargar el nombre de la empresa, el logo (opcional) y el departamento.
2. Completar fecha y nombre.
3. Por cada desvío: sector, fotos, descripción y acción correctiva → **Agregar desvío**.
4. **Generar PDF** al terminar la recorrida.
5. **Empezar informe nuevo** para limpiar el borrador.

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
