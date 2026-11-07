# Guía: logo, colores y textos del PDF

El PDF ahora imita la plantilla Word de la empresa: logo arriba, línea de color debajo de cada título, tipografía monoespaciada en el cuerpo y pie de página con numeración. Todo eso se ajusta en dos archivos, sin tocar `app.js`.

## 1. El logo
El repositorio **no incluye logo**: en el encabezado del PDF se imprime como texto el valor de `BRAND.empresa` (en `brand.js`).

Si querés usar un logo propio:

1. Conseguí el logo en PNG, con fondo transparente si es posible. Que no sea muy angosto ni muy alto (una proporción parecida a un rectángulo horizontal se ve mejor); una altura real de unos 300-400 px suele andar bien.
2. Guardalo como `logo.png` en la raíz del proyecto, para no tener que tocar el código.
3. Agregá `'logo.png'` a la lista `FILES` de `sw.js` y subí el número de versión `V`, así el celular lo guarda para usarlo sin conexión.

Si `logo.png` no existe o no carga, la app no rompe: usa el nombre de `BRAND.empresa` como texto, en su lugar.

**Repositorio público:** no subas logos ni nombres de empresas reales si el código está en un repositorio público. Si necesitás la versión con marca, mantenela en una copia local o en un repositorio privado.

## 2. Ajustar colores y textos fijos
Todo esto está en `brand.js`, con comentarios en cada línea:

- `colorAcento`: el color de la línea bajo el título y bajo cada "DESVÍOS N°...". Ya está puesto en `#BF382A`, el rojo que saqué directamente de tu PDF de plantilla, así que no debería hacer falta tocarlo.
- `tituloInforme`, `etiqueta`, `departamento`, `objetivo`: los textos fijos del informe. Podés editarlos con total libertad.

Después de editar `brand.js`, subilo a GitHub reemplazando el archivo (igual que el logo) y esperá que Pages actualice.

## 3. Si tu empresa no usa la fuente Courier/Times
El PDF usa únicamente las tres fuentes que trae `jsPDF` de fábrica (Helvetica, Times y Courier), porque son las únicas que no requieren cargar un archivo de fuente aparte. Si más adelante querés una tipografía exacta de la empresa, avisame: se puede, pero hay que sumar el archivo de la fuente al repositorio y es un cambio en `app.js`, no solo en `brand.js`.

## Problemas frecuentes
- **El logo se ve enorme o cortado:** probá con un PNG con menos margen en blanco alrededor del isologo.
- **Subí `logo.png` y no cambió nada:** el celular puede estar mostrando la versión vieja guardada. Cerrá la app por completo y abrila de nuevo.
- **El color de la línea no es el correcto:** revisá que el valor en `colorAcento` tenga el `#` y las 6 letras/números (por ejemplo `#B0392C`).
