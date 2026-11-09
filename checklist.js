// Lista de verificación para auditoría interna de planta (ISO 9001:2015, cl. 9.2).
// Es opcional: se activa en ⚙️ Configuración. Cada punto orienta el desvío con su
// criterio de aceptación y el requisito de la norma. Editá esta lista para ajustarla
// a tu planta (n = número, p = punto a verificar, c = criterio, r = requisito ISO).
// Solo puntos de auditoría (si el sistema funciona). Los controles del lote que se está
// envasando (QR, lote/vencimiento impreso, ID de pallet, despeje de la línea) van en
// controlLinea. Se mantienen los números del Excel REG-XX, por eso faltan el 7, 8 y 17 a 21.
// El 38 (ejercicio de trazabilidad) no está en el Excel: se agregó como opcional.
const CHECKLIST = [
  {cat:'Orden y limpieza', items:[
    {n:1, p:'Piso y área de trabajo limpios', c:'Sin residuos, producto, envases ni materiales fuera de lugar', r:'7.1.4 Ambiente de los procesos'},
    {n:2, p:'Equipos y superficies limpios', c:'Sin restos de formulaciones anteriores', r:'7.1.4 / 8.5.1'},
    {n:3, p:'Pasillos y accesos despejados', c:'Sin pallets, MP, PT u obstáculos', r:'7.1.4 Ambiente de los procesos'},
    {n:4, p:'Elementos de limpieza identificados', c:'Disponibles y utilizados según sector/producto', r:'7.1.3 Infraestructura'}]},
  {cat:'Derrames', items:[
    {n:5, p:'Ausencia de derrames', c:'Sin pérdidas de producto, MP o líquidos', r:'8.5.4 Preservación'},
    {n:6, p:'Derrames correctamente gestionados', c:'Contenidos, limpiados e informados', r:'8.5.4 / 8.7'}]},
  {cat:'Despeje de línea', items:[
    {n:9, p:'Despeje de línea verificado y registrado', c:'Al cambiar de producto, la verificación de despeje queda registrada y firmada', r:'8.5.1 / 7.5.3'}]},
  {cat:'Scrap / residuos', items:[
    {n:10, p:'Scrap correctamente segregado', c:'Identificado, contenido y ubicado en sector definido', r:'8.7 Salidas no conformes'},
    {n:11, p:'Residuos correctamente segregados', c:'Según clasificación establecida', r:'7.1.4 Ambiente de los procesos'},
    {n:12, p:'Recipientes identificados y cerrados', c:'Sin recipientes abiertos o sin identificación', r:'8.5.2 / 8.5.4'}]},
  {cat:'Materiales / trazabilidad', items:[
    {n:13, p:'MP e insumos identificados', c:'Todos los materiales con identificación visible (producto y lote)', r:'8.5.2 Identificación y trazabilidad'},
    {n:14, p:'Producto en proceso identificado', c:'Producto/lote/estado claramente identificable', r:'8.5.2 Identificación y trazabilidad'},
    {n:15, p:'PT correctamente identificado', c:'Producto, lote y estado (liberado / retenido) visibles en cada pallet o unidad almacenada', r:'8.5.2 / 8.6'},
    {n:16, p:'Material retenido / no conforme identificado', c:'Segregado, con estado visible (retenido/rechazado) y registrado', r:'8.7 Salidas no conformes'}]},
  {cat:'Registros y documentación', items:[
    {n:22, p:'Documentación vigente en el puesto', c:'Orden de producción, instructivo o especificación disponibles y en su versión vigente', r:'7.5.3 Control de la información documentada'},
    {n:23, p:'Registros de producción completos', c:'Datos, cantidades, lote, firmas/identificación', r:'7.5.3 / 8.5.1'},
    {n:24, p:'Registros de controles completos', c:'Sin registros pendientes o retrospectivos', r:'7.5.3 / 8.6'},
    {n:25, p:'Correcciones correctamente realizadas', c:'Sin tachaduras indebidas, borrados ni corrector. Se corrige con una línea, iniciales y fecha', r:'7.5.3 Control de la información documentada'}]},
  {cat:'Condiciones generales', items:[
    {n:26, p:'Envases/tapas/etiquetas correctamente almacenados', c:'Identificados y protegidos', r:'8.5.4 Preservación'},
    {n:27, p:'Equipos de medición dentro de condición', c:'Balanzas, medidores de pH/densidad, termómetros y cronómetros del listado: identificados y con calibración o verificación vigente', r:'7.1.5 Recursos de seguimiento y medición'},
    {n:28, p:'Personal conoce los controles de su puesto', c:'El operador explica qué controla, cada cuánto y qué hace ante un desvío', r:'7.2 Competencia / 7.3 Toma de conciencia'}]},
  {cat:'Almacenamiento de sustancias peligrosas', items:[
    {n:29, p:'Compatibilidad de almacenamiento', c:'Productos incompatibles separados según matriz de compatibilidad', r:'7.1.4 Ambiente de los procesos / 8.5.4'},
    {n:30, p:'Contención de derrames disponible', c:'Bandejas o cubetas de contención en la zona de almacenamiento, sin obstrucciones', r:'8.5.4 Preservación'},
    {n:31, p:'Rotulación de peligrosidad', c:'Pictogramas de peligro visibles en recipientes y estanterías', r:'8.5.2 / 8.5.4'}]},
  {cat:'Vencimientos (FEFO)', items:[
    {n:32, p:'MP próximas a vencer usadas primero', c:'Sin MP vencida en uso; las de vencimiento más cercano se consumen primero', r:'8.5.2 / 8.5.4'}]},
  {cat:'Parámetros de proceso', items:[
    {n:33, p:'Parámetros de mezclado según instructivo', c:'Tiempo, velocidad y temperatura registrados y dentro del rango especificado', r:'8.5.1 Control de la producción'},
    {n:34, p:'Controles en proceso realizados', c:'pH o densidad verificados y registrados cuando el instructivo lo exige', r:'8.5.1 / 8.6'}]},
  {cat:'Muestras de retención y envases vacíos', items:[
    {n:35, p:'Muestras de retención identificadas', c:'Cada lote tiene su muestra identificada y guardada según procedimiento', r:'8.6 / 8.5.2'},
    {n:36, p:'Envases vacíos gestionados', c:'Triple lavado y disposición según procedimiento; sin acumulación (si aplica)', r:'8.7 / 7.1.4'}]},
  {cat:'Aduana (solo en ese sector)', items:[
    {n:37, p:'Mercadería bajo régimen aduanero controlada', c:'Sellos íntegros, ubicación identificada y registros de ingreso/egreso al día', r:'8.5.4 / 8.5.2'}]},
  // ej:true = ejercicio que se hace una vez por auditoría (no por sector): no entra en la
  // lista por sector. Se vincula a un hallazgo solo si el ejercicio sale mal.
  {cat:'Trazabilidad (ejercicio opcional)', items:[
    {n:38, ej:true, p:'Trazabilidad de un lote verificable', c:'Para un lote de PT elegido se identifican con registros las materias primas usadas (lotes y proveedores) y los clientes a los que se despachó', r:'8.5.2 Identificación y trazabilidad'}]}
];
