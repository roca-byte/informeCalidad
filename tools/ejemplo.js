/* Datos de ejemplo para la guía y el video (tools/demo.js y tools/video.js).
 *
 * Son INVENTADOS: empresa "Planta Demo", productos genéricos, lotes L-04xx, proveedores y
 * clientes de fantasía, y "fotos" que son ilustraciones dibujadas acá en SVG. No son parte de
 * la app (la app arranca vacía): los scripts los cargan en el navegador de la grabación, que
 * es un perfil nuevo cada vez.
 *
 * Dos escenarios:
 * - diario(): el reporte de estado de planta a mitad de la recorrida (3 desvíos con fotos).
 * - auditoria(): una auditoría interna ya avanzada (lista de verificación de 3 sectores,
 *   hallazgos de los 3 tipos, trazabilidad y conclusión), para mostrar el modo auditoría.
 */

const HOY = '2026-11-11';          // se lee igual en dd/mm y mm/dd
const NOMBRE = 'Laura Gómez';      // auditora ficticia

const CONFIG = { empresa: 'Planta Demo', depto: 'DEPARTAMENTO DE CALIDAD' };

// Logo de la empresa de ejemplo (600 x 180): una hoja dentro de un engranaje y el nombre.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" viewBox="0 0 600 180">
  <g transform="translate(90 90)">
    <g fill="#0f5c6e">${Array.from({ length: 8 }, (_, i) => `<rect x="-11" y="-78" width="22" height="26" rx="4" transform="rotate(${i * 45})"/>`).join('')}</g>
    <circle r="62" fill="#0f5c6e"/><circle r="46" fill="#fff"/>
    <path d="M-22 26 C-30 -10 0 -34 30 -30 C30 4 8 30 -22 26 Z" fill="#2fa36b"/>
    <path d="M-22 26 L14 -14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  </g>
  <text x="180" y="88" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="62" font-weight="700" fill="#0f5c6e">Planta</text>
  <text x="180" y="146" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="50" font-weight="400" fill="#2fa36b" letter-spacing="6">DEMO</text>
</svg>`;

/* ---------- "Fotos": ilustraciones de planta en SVG ---------- */
// Partes comunes: piso de hormigón en perspectiva, pared, y una viñeta suave para que se
// parezca a una foto de celular.
const W = 1200, H = 900;
const defs = `<defs>
  <linearGradient id="pared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe5e8"/><stop offset="1" stop-color="#c3ccd1"/></linearGradient>
  <linearGradient id="piso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9aeb0"/><stop offset="1" stop-color="#7d8285"/></linearGradient>
  <radialGradient id="vin" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
  <linearGradient id="acero" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa5ab"/><stop offset=".5" stop-color="#e3e8eb"/><stop offset="1" stop-color="#8d989e"/></linearGradient>
  <linearGradient id="aceite" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2b23a" stop-opacity=".95"/><stop offset="1" stop-color="#b9831c" stop-opacity=".9"/></linearGradient>
  <linearGradient id="film" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
</defs>`;
const lienzo = (cuerpo, horizonte) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}
  <rect width="${W}" height="${horizonte}" fill="url(#pared)"/><rect y="${horizonte}" width="${W}" height="${H - horizonte}" fill="url(#piso)"/>
  ${cuerpo}<rect width="${W}" height="${H}" fill="url(#vin)"/></svg>`;

// Pallet de madera con cajas envueltas en film (x, y = esquina inferior izquierda, e = escala)
function pallet(x, y, e, color) {
  const w = 260 * e, h = 22 * e, cajas = [];
  for (let f = 0; f < 3; f++) for (let c = 0; c < 3; c++)
    cajas.push(`<rect x="${x + 6 * e + c * 83 * e}" y="${y - h - (f + 1) * 62 * e}" width="${80 * e}" height="${60 * e}" fill="${color}" stroke="#7a5a2e" stroke-width="${2 * e}"/>
      <rect x="${x + 6 * e + c * 83 * e + 30 * e}" y="${y - h - (f + 1) * 62 * e}" width="${20 * e}" height="${60 * e}" fill="#e8d3a6" opacity=".6"/>`);
  return `<g><rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="#b07a3f"/>
    ${[0, 1, 2].map(i => `<rect x="${x + i * 113 * e}" y="${y - h + 4 * e}" width="${34 * e}" height="${h - 4 * e}" fill="#7d5428"/>`).join('')}
    ${cajas.join('')}<rect x="${x + 4 * e}" y="${y - h - 190 * e}" width="${w - 8 * e}" height="${188 * e}" fill="url(#film)"/></g>`;
}
// Estantería de rack: parantes azules y largueros naranjas
function rack(x, w, alto) {
  return `<g>${[0, 1].map(i => `<rect x="${x + i * (w - 18)}" y="${alto}" width="18" height="${640 - alto}" fill="#2c5d9e"/>`).join('')}
    ${[0, 1, 2].map(i => `<rect x="${x}" y="${alto + 40 + i * 170}" width="${w}" height="16" fill="#e8742a"/>`).join('')}
    ${[0, 1, 2].map(i => `<rect x="${x + 30}" y="${alto + 56 + i * 170 - 110}" width="${w - 60}" height="104" fill="#c99a5b" opacity=".85"/>`).join('')}</g>`;
}
// Bolsa de materia prima (25 kg) con o sin rótulo
function bolsa(x, y, rotulo) {
  return `<g><path d="M${x} ${y} q-8 -70 10 -120 h150 q18 50 10 120 z" fill="#efe9dc" stroke="#c9bfa8" stroke-width="3"/>
    <path d="M${x + 14} ${y - 118} q70 -14 142 0" stroke="#c9bfa8" stroke-width="4" fill="none"/>
    ${rotulo ? `<rect x="${x + 40}" y="${y - 90}" width="90" height="50" fill="#fff" stroke="#888"/><rect x="${x + 48}" y="${y - 80}" width="70" height="6" fill="#555"/><rect x="${x + 48}" y="${y - 66}" width="50" height="6" fill="#999"/>` : ''}</g>`;
}

const ESCENAS = {
  // Pasillo del depósito con pallets sobre la senda demarcada
  pasillo: { w: W, h: H, svg: lienzo(`
    ${rack(40, 300, 140)}${rack(860, 300, 140)}
    <polygon points="430,900 520,470 680,470 770,900" fill="#93989a"/>
    <polygon points="420,900 432,900 524,470 518,470" fill="#f2c200"/><polygon points="770,900 782,900 684,470 678,470" fill="#f2c200"/>
    ${pallet(470, 760, 1.05, '#d3a76a')}${pallet(560, 600, .62, '#c79a5c')}`, 470) },
  pallet: { w: W, h: H, svg: lienzo(`
    <polygon points="0,900 0,820 1200,700 1200,760 0,900" fill="#f2c200" opacity=".9"/>
    ${pallet(330, 840, 2.1, '#d3a76a')}`, 380) },
  // Envasado: llenadora, cinta con botellas y derrame de aceite en el piso
  derrame: { w: W, h: H, svg: lienzo(`
    <rect x="120" y="150" width="420" height="440" fill="url(#acero)" stroke="#6f7a80" stroke-width="4"/>
    <rect x="170" y="200" width="320" height="140" fill="#2f3b42" opacity=".8"/><circle cx="460" cy="390" r="18" fill="#c62828"/><circle cx="410" cy="390" r="18" fill="#2e7d32"/>
    <rect x="540" y="430" width="660" height="40" fill="#555e63"/><rect x="540" y="470" width="660" height="14" fill="#30383c"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${600 + i * 100} 430 v-80 q0 -20 14 -26 v-26 h20 v26 q14 6 14 26 v80 z" fill="#f0c64a" stroke="#a37a12" stroke-width="2" opacity=".95"/><rect x="${612 + i * 100}" y="340" width="24" height="9" fill="#2e7d32"/>`).join('')}
    <rect x="160" y="590" width="30" height="60" fill="#6f7a80"/><rect x="470" y="590" width="30" height="60" fill="#6f7a80"/>
    <path d="M250 700 q120 -60 300 -10 q160 40 120 110 q-60 60 -260 40 q-200 -10 -220 -70 q-10 -40 60 -70z" fill="url(#aceite)"/>
    <ellipse cx="420" cy="720" rx="120" ry="18" fill="#fff" opacity=".35"/>`, 650) },
  goteo: { w: W, h: H, svg: lienzo(`
    <rect x="380" y="0" width="440" height="330" fill="url(#acero)" stroke="#6f7a80" stroke-width="4"/>
    <rect x="575" y="330" width="50" height="40" fill="#6f7a80"/><rect x="560" y="300" width="80" height="34" fill="#30383c"/>
    <path d="M600 372 q-14 26 0 40 q14 -14 0 -40z" fill="#d8a52b"/><path d="M600 440 q-12 22 0 34 q12 -12 0 -34z" fill="#d8a52b"/>
    <path d="M300 720 q160 -70 400 -20 q220 40 160 130 q-80 70 -340 50 q-260 -10 -280 -90 q-10 -50 60 -70z" fill="url(#aceite)"/>
    <ellipse cx="600" cy="742" rx="160" ry="22" fill="#fff" opacity=".3"/>`, 560) },
  // Formulación: recipientes de residuos, uno sin tapa ni identificación
  residuos: { w: W, h: H, svg: lienzo(`
    <rect x="0" y="120" width="1200" height="30" fill="#b0babf"/>
    ${[['#1e6fd9', 150, true], ['#2e7d32', 470, true], ['#6d7378', 790, false]].map(([c, x, ok]) => `
      <path d="M${x} 300 h240 l-24 420 h-192 z" fill="${c}"/>
      ${ok ? `<rect x="${x - 10}" y="270" width="260" height="36" rx="6" fill="${c}" stroke="#00000033" stroke-width="3"/><rect x="${x + 60}" y="400" width="120" height="70" fill="#fff"/><rect x="${x + 72}" y="415" width="96" height="10" fill="#333"/><rect x="${x + 72}" y="438" width="70" height="10" fill="#777"/>`
        : `<path d="M${x - 20} 300 q60 -50 140 -20 q60 -40 120 10 z" fill="#3b3f42"/><path d="M${x + 30} 300 q40 -60 90 -10" fill="#e9e3d0"/>`}`).join('')}
    <rect x="1000" y="720" width="120" height="16" fill="#7d8285"/>`, 690) },
  // Depósito de materias primas: bolsas sin rótulo sobre pallet
  bolsas: { w: W, h: H, svg: lienzo(`
    <rect x="200" y="760" width="800" height="40" fill="#b07a3f"/>${[0, 1, 2, 3].map(i => `<rect x="${215 + i * 250}" y="770" width="50" height="30" fill="#7d5428"/>`).join('')}
    ${[0, 1, 2, 3].map(i => bolsa(225 + i * 190, 760, i === 0)).join('')}
    ${[0, 1, 2].map(i => bolsa(320 + i * 190, 640, false)).join('')}`, 520) },
  // Primer plano de una bolsa sin rótulo, sobre el pallet
  bolsa: { w: W, h: H, svg: lienzo(`<rect x="250" y="700" width="700" height="60" fill="#b07a3f"/>${[0, 1, 2].map(i => `<rect x="${270 + i * 300}" y="715" width="60" height="45" fill="#7d5428"/>`).join('')}
    <g transform="translate(379 388) scale(2.6)">${bolsa(0, 120, false)}</g>
    <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#b5aa92" letter-spacing="4">25 kg</text>`, 420) }
};

/* ---------- Escenario 1: reporte diario a mitad de la recorrida ---------- */
function diario() {
  return {
    items: [
      { sector: 'Depósito PT', fotos: ['pasillo', 'pallet'],
        desc: 'Pasillo obstruido con pallets en la calle 3 del depósito de producto terminado. Dos pallets de Aceite girasol 1,5 L (lote L-0436) quedaron sobre la senda demarcada y no dejan pasar al autoelevador.',
        acc: 'Despejar el pasillo y ubicar los pallets en su lugar\nDemarcar en el piso las zonas de pasillo y de estiba' },
      { sector: 'Envasado', fotos: ['derrame', 'goteo'],
        desc: 'Se observa derrame de producto en el piso debajo de la llenadora de la línea 2. La pérdida viene del pico 3 y el derrame no estaba señalizado.',
        acc: 'Contener y limpiar el derrame\nRevisar y reparar el origen de la pérdida' },
      { sector: 'Formulación', fotos: ['residuos'],
        desc: 'Recipiente de residuos sin tapa y sin identificar al lado de los de reciclables.',
        acc: 'Identificar el recipiente y mantenerlo tapado' }
    ],
    // Frases propias que la usuaria ya guardó con ⭐ (las típicas salen de checklist.js)
    frases: { desc: ['Se avisó al supervisor del sector en el momento.'], acc: ['Verificar en la próxima recorrida'] }
  };
}

// El desvío que se carga en vivo en el GIF y el video
const NUEVO = {
  sector: 'Depósito MP', fotos: ['bolsas', 'bolsa'],
  desc: 'Bolsas de azúcar sin rótulo de identificación en el pallet 4 del depósito de materias primas.',
  acc: 'Rotular las bolsas con producto, lote y fecha de ingreso'
};

/* ---------- Escenario 2: auditoría interna ya avanzada ---------- */
// marcas: estado por defecto de cada punto y las excepciones (C = cumple).
function auditoria() {
  return {
    cfg: { auditoria: true, codigo: 'REG-01', revision: '02', sectores: 'Depósito PT\nEnvasado\nFormulación' },
    datos: {
      hora: '08:30', auditados: 'J. Pérez (Envasado), M. Sosa (Depósito PT), R. Díaz (Formulación)',
      conclusion: 'Cumplimiento general del 96 %. Las NC se concentran en la pérdida de la llenadora de la línea 2 y en el orden del depósito. Se recomienda revisar el mantenimiento de las llenadoras.',
      traza: { usar: true, producto: 'Aceite girasol 1,5 L', lote: 'L-0436',
        atras: 'Aceite de girasol refinado · L-MP-118 · Aceitera del Norte\nBotella PET 1,5 L · L-EN-207 · Envases del Litoral\nTapa 38 mm · L-EN-311 · Plásticos del Sur',
        adelante: 'R-0001-00045 · Almacén Central · 600 u\nR-0001-00051 · Supermercados del Sur · 1200 u',
        tiempo: '35 min', resultado: 'C', obs: 'Se reconstruyó todo con los registros de producción y los remitos.' }
    },
    marcas: {
      'Depósito PT': { NC: [3], NA: [9, 33, 34, 37], NV: [] },
      'Envasado': { NC: [5, 6], NA: [37], NV: [33] },
      'Formulación': { NC: [], NA: [9, 37], NV: [] }
    },
    hoja: {
      'Envasado': { lote: 'L-0442 · Aceite girasol 1,5 L', notifica: 'J. Pérez', motivo: '33: la mezcladora estaba parada. 37: no aplica al sector.' },
      'Depósito PT': { lote: '', notifica: 'M. Sosa', motivo: '9, 33 y 34: no aplican al depósito. 37: no aplica.' }
    },
    items: [
      { tipo: 'NC', pto: 5, sector: 'Envasado', fotos: ['derrame', 'goteo'],
        desc: 'Se observa derrame de producto en el piso debajo de la llenadora de la línea 2. La pérdida viene del pico 3.',
        acc: 'Contener y limpiar el derrame\nRevisar y reparar el origen de la pérdida' },
      { tipo: 'NC', pto: 6, sector: 'Envasado', fotos: [],
        desc: 'Derrame no informado al supervisor: el operario no lo había reportado al inicio del turno.',
        acc: 'Recordar al personal que todo derrame se informa en el momento' },
      { tipo: 'NC', pto: 3, sector: 'Depósito PT', fotos: ['pasillo'],
        desc: 'Pasillo obstruido con pallets en la calle 3 (lote L-0436).',
        acc: 'Despejar el pasillo y ubicar los pallets en su lugar\nDemarcar en el piso las zonas de pasillo y de estiba' },
      { tipo: 'OBS', pto: 12, sector: 'Formulación', fotos: ['residuos'],
        desc: 'Un recipiente de residuos sin tapa y sin identificar. Los demás están en condiciones.',
        acc: 'Identificar el recipiente y mantenerlo tapado' },
      { tipo: 'OM', sector: 'Depósito PT', fotos: [],
        desc: 'No hay un lugar demarcado para las devoluciones de clientes: se apoyan donde haya espacio.',
        acc: 'Demarcar una zona de devoluciones cerca del muelle' }
    ]
  };
}

/* ---------- Carga en el navegador ---------- */
// Se ejecuta DENTRO de la página (page.evaluate): dibuja el logo y las fotos en un canvas,
// con el mismo tamaño y calidad que usa la app (1200 px, JPEG 0,75), y deja todo en el
// localStorage con las claves de la app. Después hay que recargar.
async function cargarEnPagina(d) {
  const dibujar = (svg, w, h, tipo, q) => new Promise((ok, mal) => {
    const im = new Image();
    im.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); if (tipo === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
      x.drawImage(im, 0, 0, w, h); ok(c.toDataURL(tipo, q)); };
    im.onerror = mal;
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const foto = async k => { const e = d.escenas[k]; return { d: await dibujar(e.svg, e.w, e.h, 'image/jpeg', .75), w: e.w, h: e.h }; };
  const cfg = Object.assign({}, d.config, d.extraCfg || {});
  if (d.logo) cfg.logo = { d: await dibujar(d.logo, 600, 180, 'image/png'), w: 600, h: 180 };
  const items = [];
  for (const it of d.items) {
    const nuevo = { sector: it.sector, desc: it.desc, acc: it.acc, fotos: [] };
    for (const k of it.fotos) nuevo.fotos.push(await foto(k));
    if (it.tipo) nuevo.tipo = it.tipo;
    if (it.pto) { const p = CHECKLIST.flatMap(g => g.items).find(x => x.n === it.pto); nuevo.pto = { n: p.n, p: p.p, c: p.c, r: p.r }; }
    items.push(nuevo);
  }
  localStorage.setItem('informe_config', JSON.stringify(cfg));
  localStorage.setItem('informe_planta_v1', JSON.stringify(items));
  localStorage.setItem('informe_nombre', d.nombre);
  localStorage.setItem('informe_frases', JSON.stringify(d.frases || { desc: [], acc: [] }));
  if (d.aud) {
    const puntos = CHECKLIST.flatMap(g => g.items.filter(x => !x.ej)), matriz = {};
    Object.entries(d.aud.marcas).forEach(([s, m]) => {
      const est = {};
      puntos.forEach(p => { est[p.n] = m.NC.includes(p.n) ? 'NC' : m.NA.includes(p.n) ? 'NA' : m.NV.includes(p.n) ? 'NV' : 'C'; });
      matriz[s] = Object.assign({ est, lote: '', notifica: '', motivo: '' }, d.aud.hoja[s] || {});
    });
    localStorage.setItem('informe_auditoria_v1', JSON.stringify(Object.assign({ matriz }, d.aud.datos)));
  } else localStorage.removeItem('informe_auditoria_v1');
}

// Fotos sueltas (para subirlas con el botón 📷 en vivo): devuelve [{nombre, base64}] JPEG
async function fotosEnPagina(escenas) {
  const out = [];
  for (const [k, e] of Object.entries(escenas)) {
    out.push(await new Promise(ok => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas');
      c.width = e.w; c.height = e.h; c.getContext('2d').drawImage(im, 0, 0);
      ok({ nombre: k + '.jpg', base64: c.toDataURL('image/jpeg', .9).split(',')[1] }); };
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(e.svg); }));
  }
  return out;
}

// Arma lo que recibe cargarEnPagina para cada escenario
function paqueteDiario() {
  const e = diario();
  return { config: CONFIG, logo: LOGO, escenas: ESCENAS, nombre: NOMBRE, items: e.items, frases: e.frases };
}
function paqueteAuditoria() {
  const a = auditoria();
  return { config: CONFIG, extraCfg: a.cfg, logo: LOGO, escenas: ESCENAS, nombre: NOMBRE, items: a.items,
    frases: diario().frases, aud: { datos: a.datos, marcas: a.marcas, hoja: a.hoja } };
}

module.exports = { HOY, NOMBRE, CONFIG, LOGO, ESCENAS, NUEVO, diario, auditoria, cargarEnPagina, fotosEnPagina, paqueteDiario, paqueteAuditoria };
