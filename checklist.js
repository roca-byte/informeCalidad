// Lista de verificación para auditoría interna de planta (ISO 9001:2015, cl. 9.2).
// Es opcional: se activa en ⚙️ Configuración. Cada punto orienta el desvío con su
// criterio de aceptación y el requisito de la norma. Editá esta lista para ajustarla
// a tu planta (n = número, p = punto a verificar, c = criterio, r = requisito ISO,
// f = frases típicas de hallazgo, a = acciones correctivas típicas; las dos son botones en
// el formulario: terminan abiertas para completar con el dato concreto).
// Solo puntos de auditoría (si el sistema funciona). Los controles del lote que se está
// envasando (QR, lote/vencimiento impreso, ID de pallet, despeje de la línea) van en
// controlLinea. Se mantienen los números del Excel REG-XX, por eso faltan el 7, 8 y 17 a 21.
// El 38 (ejercicio de trazabilidad) no está en el Excel: se agregó como opcional.
const CHECKLIST = [
  {cat:'Orden y limpieza', items:[
    {n:1, p:'Piso y área de trabajo limpios', c:'Sin residuos, producto, envases ni materiales fuera de lugar', r:'7.1.4 Ambiente de los procesos',
      f:['Se observan residuos de producto en el piso de ', 'Se observan envases y materiales fuera de lugar en '],
      a:['Limpiar el sector y retirar los materiales fuera de lugar', 'Reforzar la limpieza al cierre de cada turno']},
    {n:2, p:'Equipos y superficies limpios', c:'Sin restos de formulaciones anteriores', r:'7.1.4 / 8.5.1',
      f:['Se observan restos de una formulación anterior en ', 'El equipo no se limpió después del último uso: '],
      a:['Limpiar el equipo según el instructivo de limpieza', 'Registrar la limpieza del equipo al terminar cada producción']},
    {n:3, p:'Pasillos y accesos despejados', c:'Sin pallets, MP, PT u obstáculos', r:'7.1.4 Ambiente de los procesos',
      f:['Pasillo obstruido con pallets en ', 'Acceso bloqueado por materia prima o producto terminado en '],
      a:['Despejar el pasillo y ubicar los pallets en su lugar', 'Demarcar en el piso las zonas de pasillo y de estiba']},
    {n:4, p:'Elementos de limpieza identificados', c:'Disponibles y utilizados según sector/producto', r:'7.1.3 Infraestructura',
      f:['Elementos de limpieza sin identificar en ', 'No hay elementos de limpieza disponibles en '],
      a:['Identificar los elementos de limpieza por sector', 'Reponer los elementos de limpieza faltantes']}]},
  {cat:'Derrames', items:[
    {n:5, p:'Ausencia de derrames', c:'Sin pérdidas de producto, MP o líquidos', r:'8.5.4 Preservación',
      f:['Se observa derrame de producto en ', 'Se observa pérdida de líquido en '],
      a:['Contener y limpiar el derrame', 'Revisar y reparar el origen de la pérdida']},
    {n:6, p:'Derrames correctamente gestionados', c:'Contenidos, limpiados e informados', r:'8.5.4 / 8.7',
      f:['Derrame sin contener ni limpiar en ', 'Derrame no informado al supervisor en '],
      a:['Limpiar el derrame según el procedimiento', 'Recordar al personal cómo informar un derrame']}]},
  {cat:'Despeje de línea', items:[
    {n:9, p:'Despeje de línea verificado y registrado', c:'Al cambiar de producto, la verificación de despeje queda registrada y firmada', r:'8.5.1 / 7.5.3',
      f:['No se encontró el registro de despeje de línea del último cambio de producto en ', 'Registro de despeje de línea sin firma en '],
      a:['Completar y firmar el registro de despeje en cada cambio de producto', 'Capacitar al personal en el registro de despeje de línea']}]},
  {cat:'Scrap / residuos', items:[
    {n:10, p:'Scrap correctamente segregado', c:'Identificado, contenido y ubicado en sector definido', r:'8.7 Salidas no conformes',
      f:['Scrap sin identificar en ', 'Scrap fuera del lugar definido en '],
      a:['Identificar el scrap y llevarlo al lugar definido', 'Demarcar el lugar de scrap del sector']},
    {n:11, p:'Residuos correctamente segregados', c:'Según clasificación establecida', r:'7.1.4 Ambiente de los procesos',
      f:['Residuos mezclados en el recipiente de ', 'Residuos sin clasificar en '],
      a:['Separar los residuos según la clasificación establecida', 'Señalizar cada recipiente con el tipo de residuo']},
    {n:12, p:'Recipientes identificados y cerrados', c:'Sin recipientes abiertos o sin identificación', r:'8.5.2 / 8.5.4',
      f:['Recipiente abierto en ', 'Recipiente sin identificación en '],
      a:['Cerrar los recipientes después de cada uso', 'Identificar los recipientes con producto y lote']}]},
  {cat:'Materiales / trazabilidad', items:[
    {n:13, p:'MP e insumos identificados', c:'Todos los materiales con identificación visible (producto y lote)', r:'8.5.2 Identificación y trazabilidad',
      f:['Materia prima sin identificación de producto y lote en ', 'Insumo con identificación ilegible en '],
      a:['Identificar la materia prima con producto y lote', 'Revisar la identificación al recibir los materiales']},
    {n:14, p:'Producto en proceso identificado', c:'Producto/lote/estado claramente identificable', r:'8.5.2 Identificación y trazabilidad',
      f:['Producto en proceso sin identificar en ', 'No se puede determinar el lote del producto en proceso en '],
      a:['Identificar el producto en proceso con producto, lote y estado', 'Usar la tarjeta de identificación en todo producto en proceso']},
    {n:15, p:'PT correctamente identificado', c:'Producto, lote y estado (liberado / retenido) visibles en cada pallet o unidad almacenada', r:'8.5.2 / 8.6',
      f:['Pallet de producto terminado sin estado (liberado / retenido) visible en ', 'Producto terminado sin lote visible en '],
      a:['Identificar el pallet con producto, lote y estado', 'Verificar la identificación antes de ingresar el pallet al depósito']},
    {n:16, p:'Material retenido / no conforme identificado', c:'Segregado, con estado visible (retenido/rechazado) y registrado', r:'8.7 Salidas no conformes',
      f:['Material retenido junto a material liberado en ', 'Material no conforme sin identificar ni registrar en '],
      a:['Segregar el material retenido en la zona definida', 'Identificar y registrar el material no conforme']}]},
  {cat:'Registros y documentación', items:[
    {n:22, p:'Documentación vigente en el puesto', c:'Orden de producción, instructivo o especificación disponibles y en su versión vigente', r:'7.5.3 Control de la información documentada',
      f:['Instructivo en una revisión no vigente en el puesto de ', 'Falta la orden de producción en el puesto de '],
      a:['Retirar la copia obsoleta y entregar la vigente', 'Controlar la distribución de documentos en los puestos']},
    {n:23, p:'Registros de producción completos', c:'Datos, cantidades, lote, firmas/identificación', r:'7.5.3 / 8.5.1',
      f:['Registro de producción incompleto (faltan cantidad, lote o firma) en ', 'Registro de producción sin identificación del operador en '],
      a:['Completar el registro con los datos faltantes', 'Revisar los registros al cierre de cada turno']},
    {n:24, p:'Registros de controles completos', c:'Sin registros pendientes o retrospectivos', r:'7.5.3 / 8.6',
      f:['Registro de controles con datos pendientes en ', 'Controles registrados después de realizados (registro retrospectivo) en '],
      a:['Registrar cada control en el momento en que se hace', 'Revisar los registros de control durante la recorrida']},
    {n:25, p:'Correcciones correctamente realizadas', c:'Sin tachaduras indebidas, borrados ni corrector. Se corrige con una línea, iniciales y fecha', r:'7.5.3 Control de la información documentada',
      f:['Registro con tachaduras o corrector en ', 'Corrección sin iniciales ni fecha en '],
      a:['Corregir con una línea, iniciales y fecha', 'Capacitar al personal en cómo corregir un registro']}]},
  {cat:'Condiciones generales', items:[
    {n:26, p:'Envases/tapas/etiquetas correctamente almacenados', c:'Identificados y protegidos', r:'8.5.4 Preservación',
      f:['Envases, tapas o etiquetas sin identificar en ', 'Material de empaque sin protección (polvo o humedad) en '],
      a:['Identificar y cubrir el material de empaque', 'Guardar el material de empaque en el lugar definido']},
    {n:27, p:'Equipos de medición dentro de condición', c:'Balanzas, medidores de pH/densidad, termómetros y cronómetros del listado: identificados y con calibración o verificación vigente', r:'7.1.5 Recursos de seguimiento y medición',
      f:['Equipo de medición con calibración o verificación vencida: ', 'Equipo de medición sin identificación en '],
      a:['Retirar de uso el equipo hasta calibrarlo o verificarlo', 'Identificar el equipo y actualizar el listado de calibraciones']},
    {n:28, p:'Personal conoce los controles de su puesto', c:'El operador explica qué controla, cada cuánto y qué hace ante un desvío', r:'7.2 Competencia / 7.3 Toma de conciencia',
      f:['El operador no supo explicar qué controla ni cada cuánto en ', 'El operador no sabe qué hacer ante un desvío en '],
      a:['Capacitar al operador en los controles de su puesto', 'Dejar en el puesto un resumen visible de los controles']}]},
  {cat:'Almacenamiento de sustancias peligrosas', items:[
    {n:29, p:'Compatibilidad de almacenamiento', c:'Productos incompatibles separados según matriz de compatibilidad', r:'7.1.4 Ambiente de los procesos / 8.5.4',
      f:['Productos incompatibles almacenados juntos en ', 'No se respeta la matriz de compatibilidad en '],
      a:['Separar los productos según la matriz de compatibilidad', 'Dejar visible la matriz de compatibilidad en el depósito']},
    {n:30, p:'Contención de derrames disponible', c:'Bandejas o cubetas de contención en la zona de almacenamiento, sin obstrucciones', r:'8.5.4 Preservación',
      f:['Falta bandeja de contención en ', 'Bandeja de contención obstruida o con producto en '],
      a:['Colocar bandejas de contención en la zona', 'Vaciar y limpiar las bandejas de contención']},
    {n:31, p:'Rotulación de peligrosidad', c:'Pictogramas de peligro visibles en recipientes y estanterías', r:'8.5.2 / 8.5.4',
      f:['Recipiente sin pictograma de peligro en ', 'Pictograma de peligro dañado o ilegible en '],
      a:['Colocar los pictogramas de peligro faltantes', 'Reemplazar los rótulos dañados']}]},
  {cat:'Vencimientos (FEFO)', items:[
    {n:32, p:'MP próximas a vencer usadas primero', c:'Sin MP vencida en uso; las de vencimiento más cercano se consumen primero', r:'8.5.2 / 8.5.4',
      f:['Materia prima vencida en uso: ', 'Se usa un lote de vencimiento posterior antes que uno más próximo en '],
      a:['Retirar la materia prima vencida y registrarla como no conforme', 'Ordenar el depósito por fecha de vencimiento']}]},
  {cat:'Parámetros de proceso', items:[
    {n:33, p:'Parámetros de mezclado según instructivo', c:'Tiempo, velocidad y temperatura registrados y dentro del rango especificado', r:'8.5.1 Control de la producción',
      f:['Parámetros de mezclado sin registrar en ', 'Parámetro de mezclado fuera del rango del instructivo en '],
      a:['Registrar tiempo, velocidad y temperatura en cada mezcla', 'Evaluar el lote con Calidad antes de liberarlo']},
    {n:34, p:'Controles en proceso realizados', c:'pH o densidad verificados y registrados cuando el instructivo lo exige', r:'8.5.1 / 8.6',
      f:['No se registró el control de pH o densidad que exige el instructivo en ', 'Control en proceso fuera de la frecuencia definida en '],
      a:['Realizar y registrar los controles en proceso que pide el instructivo', 'Revisar la frecuencia de controles con el supervisor']}]},
  {cat:'Muestras de retención y envases vacíos', items:[
    {n:35, p:'Muestras de retención identificadas', c:'Cada lote tiene su muestra identificada y guardada según procedimiento', r:'8.6 / 8.5.2',
      f:['Lote sin muestra de retención: ', 'Muestra de retención sin identificar en '],
      a:['Tomar e identificar la muestra de retención de cada lote', 'Ordenar las muestras de retención por fecha y lote']},
    {n:36, p:'Envases vacíos gestionados', c:'Triple lavado y disposición según procedimiento; sin acumulación (si aplica)', r:'8.7 / 7.1.4',
      f:['Acumulación de envases vacíos en ', 'Envases vacíos sin triple lavado en '],
      a:['Hacer el triple lavado y disponer los envases según el procedimiento', 'Coordinar el retiro periódico de envases vacíos']}]},
  {cat:'Aduana (solo en ese sector)', items:[
    {n:37, p:'Mercadería bajo régimen aduanero controlada', c:'Sellos íntegros, ubicación identificada y registros de ingreso/egreso al día', r:'8.5.4 / 8.5.2',
      f:['Sello dañado en mercadería bajo régimen aduanero: ', 'Registro de ingreso y egreso aduanero desactualizado en '],
      a:['Informar al responsable de comercio exterior', 'Actualizar el registro de ingreso y egreso']}]},
  // ej:true = ejercicio que se hace una vez por auditoría (no por sector): no entra en la
  // lista por sector. Se vincula a un hallazgo solo si el ejercicio sale mal.
  {cat:'Trazabilidad (ejercicio opcional)', items:[
    {n:38, ej:true, p:'Trazabilidad de un lote verificable', c:'Para un lote de PT elegido se identifican con registros las materias primas usadas (lotes y proveedores) y los clientes a los que se despachó', r:'8.5.2 Identificación y trazabilidad',
      f:['No se pudo identificar qué lotes de materia prima se usaron en el lote ', 'No se pudo identificar a qué clientes se despachó el lote '],
      a:['Revisar el registro de consumo de materias primas por lote', 'Revisar el registro de despachos por lote']}]}
];
