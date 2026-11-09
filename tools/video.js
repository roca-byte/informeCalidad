/* Graba el video de demostración: docs/video/informeCalidad-demo.mp4
 *
 * Uso:  node tools/video.js
 * Necesita Playwright, ffmpeg y pdftoppm (poppler-utils). Recorre la app en un celular con los
 * datos de ejemplo de tools/ejemplo.js (inventados): configuración, carga de un desvío con
 * fotos y frases, el PDF del reporte diario, el modo auditoría interna (lista de verificación,
 * hallazgo con punto, trazabilidad y PDF) y el uso sin señal, con carteles que explican cada
 * paso, un círculo en cada toque, un visor para las páginas del PDF y placas de apertura y cierre.
 * Volver a correrlo cada vez que cambie algo visible de la app o del PDF.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { servidor, RAIZ } = require('./servidor');
const Ejemplo = require('./ejemplo');

const SALIDA = path.join(RAIZ, 'docs', 'video');
const ANCHO = 390, ALTO = 844;

// Se inyecta en la página: carteles, placas, visor de PDF y marca de toques. Vive fuera del
// contenido de la app, así sobrevive a sus redibujos. El cartel va ARRIBA (debajo de la barra)
// porque lo que se toca se centra en la pantalla.
function preparar(placaInicial) {
  const css = document.createElement('style');
  css.textContent = `
    #v-cartel { position: fixed; left: 12px; right: 12px; top: 64px; z-index: 99; padding: 12px 16px; pointer-events: none;
      background: rgba(10, 70, 84, .94); color: #fff; border-radius: 14px; font: 600 17px/1.35 "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 6px 24px rgba(0,0,0,.25); transition: opacity .35s, transform .35s; }
    #v-cartel.oculto { opacity: 0; transform: translateY(-14px); }
    #v-cartel small { display: block; font-weight: 400; font-size: 14px; opacity: .85; margin-top: 2px; }
    #v-placa { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 14px; text-align: center; padding: 24px; background: #0f5c6e; color: #fff;
      font-family: "Segoe UI", Roboto, sans-serif; transition: opacity .6s; }
    #v-placa.oculto { opacity: 0; pointer-events: none; }
    #v-placa img { width: 112px; height: 112px; }
    #v-placa h1 { margin: 0; font-size: 32px; line-height: 1.15; } #v-placa h1 span { color: #00c896; }
    #v-placa p { margin: 0; font-size: 18px; opacity: .9; max-width: 310px; line-height: 1.4; }
    #v-placa b { color: #00c896; }
    #v-visor { position: fixed; inset: 0; z-index: 97; background: #3a4146; overflow-y: auto; padding: 150px 14px 40px;
      transition: opacity .5s; }
    #v-visor.oculto { opacity: 0; pointer-events: none; }
    #v-visor img { display: block; width: 100%; margin: 0 0 14px; box-shadow: 0 4px 18px rgba(0,0,0,.4); }
    .v-toque { position: fixed; z-index: 98; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
      background: rgba(0, 200, 150, .35); border: 3px solid #00c896; pointer-events: none; animation: v-toque .6s ease-out forwards; }
    @keyframes v-toque { from { transform: scale(.4); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }`;
  document.head.appendChild(css);
  const crear = (id, clase) => { const e = document.createElement('div'); e.id = id; e.className = clase === undefined ? 'oculto' : clase; document.body.appendChild(e); return e; };
  const cartel = crear('v-cartel'), placa = crear('v-placa', placaInicial ? '' : 'oculto'), visor = crear('v-visor');
  if (placaInicial) placa.innerHTML = placaInicial;
  document.addEventListener('pointerdown', e => {
    const t = document.createElement('div');
    t.className = 'v-toque'; t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 700);
  }, true);
  window.vCartel = (titulo, detalle) => {
    cartel.innerHTML = titulo ? titulo + (detalle ? '<small>' + detalle + '</small>' : '') : '';
    cartel.className = titulo ? '' : 'oculto';
  };
  window.vPlaca = html => { if (html) placa.innerHTML = html; placa.className = html ? '' : 'oculto'; };
  window.vVisor = imgs => {
    if (imgs) { visor.innerHTML = imgs.map(s => '<img src="' + s + '" alt="">').join(''); visor.scrollTop = 0; }
    visor.className = imgs ? '' : 'oculto';
  };
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const srv = servidor().listen(0);
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-video-'));
  const browser = await chromium.launch({ args: ['--lang=es-AR'] });
  const ctx = await browser.newContext({
    viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 2, serviceWorkers: 'block', isMobile: true, hasTouch: true,
    locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', colorScheme: 'light', acceptDownloads: true
  });
  const page = await ctx.newPage();

  // Grabación: capturas de pantalla seguidas a resolución doble, cada una con su hora.
  // (La grabación propia de Playwright da cuadros de 390 px, que en un celular se ven borrosos.)
  const cuadros = [];
  let grabando = false, tandaNueva = false;
  async function grabar() {
    while (grabando) {
      const t = Date.now() / 1000;
      const archivo = path.join(carpeta, 'c' + String(cuadros.length).padStart(5, '0') + '.jpg');
      try {
        await page.screenshot({ path: archivo, type: 'jpeg', quality: 88, animations: 'allow', caret: 'initial' });
        cuadros.push({ archivo, t, corte: tandaNueva });
        tandaNueva = false;
      } catch (e) { /* la página se está recargando: se saltea el cuadro (queda el anterior) */ }
    }
  }
  // Reloj en el 11/11: la fecha del informe y los N° de hallazgo salen iguales cada vez.
  await page.clock.setFixedTime(new Date(Ejemplo.HOY + 'T10:30:00-03:00'));
  page.on('dialog', d => d.accept());
  // Si algo no aparece, que falle enseguida (si no, el video queda con la pantalla quieta).
  page.setDefaultTimeout(5000);
  page.on('pageerror', e => { throw e; });

  // La app arranca vacía: se cargan los ejemplos en su localStorage y se recarga.
  async function cargar(paquete, placaInicial) {
    if (!page.url().startsWith(url)) await page.goto(url);
    await page.waitForFunction(() => typeof CHECKLIST !== 'undefined');
    await page.evaluate(Ejemplo.cargarEnPagina, paquete);
    await page.reload();
    await page.waitForSelector('#lista .card');
    await page.evaluate(preparar, placaInicial || '');
  }
  await cargar(Ejemplo.paqueteDiario());

  const espera = ms => page.waitForTimeout(ms);
  const cartel = async (t, d, ms) => { await page.evaluate(([a, b]) => window.vCartel(a, b), [t, d || '']); await espera(ms || 3000); };
  const placa = async (html, ms) => { await page.evaluate(h => window.vPlaca(h), html); await espera(ms); };
  const ver = async (sel, bloque) => {
    await page.locator(sel).first().evaluate((e, b) => e.scrollIntoView({ behavior: 'smooth', block: b || 'center' }), bloque);
    await espera(800);
  };
  const tocar = async (sel, ms) => { await ver(sel); await page.locator(sel).first().click(); await espera(ms || 1000); };
  const tipear = async (sel, txt) => { await ver(sel); await page.locator(sel).first().click(); await page.keyboard.type(txt, { delay: 70 }); await espera(400); };
  // El desplegable nativo no se ve en la grabación: se elige directo.
  const elegir = async (sel, valor) => { await ver(sel); await page.selectOption(sel, valor); await espera(800); };
  const arriba = async ms => { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await espera(ms || 900); };
  // Toca "Generar PDF", lo descarga, pasa las páginas pedidas a imagen y las muestra en el visor.
  // paginas: número o un texto que aparece en esa página. Cada página mide ~525 px en el visor.
  async function verPDF(nombre, paginas, recorrido) {
    const [descarga] = await Promise.all([page.waitForEvent('download'), tocar('#pdf', 300)]);
    const pdf = path.join(carpeta, nombre + '.pdf');
    await descarga.saveAs(pdf);
    const total = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1];
    const conTexto = t => { for (let n = 1; n <= total; n++) if (execFileSync('pdftotext', ['-f', String(n), '-l', String(n), pdf, '-']).toString().includes(t)) return n; throw new Error('No está "' + t + '" en el PDF'); };
    const imgs = paginas.map(p => typeof p === 'number' ? p : conTexto(p)).map(n => {
      const base = path.join(carpeta, nombre + '-' + n);
      execFileSync('pdftoppm', ['-r', '110', '-jpeg', '-singlefile', '-f', String(n), '-l', String(n), pdf, base]);
      return 'data:image/jpeg;base64,' + fs.readFileSync(base + '.jpg').toString('base64');
    });
    await page.evaluate(i => window.vVisor(i), imgs);
    await espera(1800);
    for (const [y, ms] of recorrido) { await page.evaluate(v => document.getElementById('v-visor').scrollTo({ top: v, behavior: 'smooth' }), y); await espera(ms); }
    await page.evaluate(() => window.vVisor(null));
    await espera(600);
  }
  const fotos = async () => {
    const escenas = Object.fromEntries(Ejemplo.NUEVO.fotos.map(k => [k, Ejemplo.ESCENAS[k]]));
    return (await page.evaluate(Ejemplo.fotosEnPagina, escenas)).map(f => ({ name: f.nombre, mimeType: 'image/jpeg', buffer: Buffer.from(f.base64, 'base64') }));
  };
  const fotosNuevas = await fotos();
  const logo = await page.evaluate(() => new URL('icon.svg', location.href).href);
  const titulo = '<img src="' + logo + '" alt=""><h1>Informe de <span>Estado de Planta</span></h1>';

  grabando = true;
  const grabacion = grabar();
  await espera(300);

  // ── Apertura ──
  await placa(titulo + '<p>Armá el informe durante la recorrida, con las fotos del celular, y generá el PDF en un toque.</p><p><b>Gratis, sin cuenta y sin señal.</b></p>', 5500);
  await placa('', 900);
  await cartel('Así se ve a mitad de la recorrida', 'Cada desvío con sus fotos, listo para el informe', 1000);
  await ver('#lista .card:nth-child(2)');
  await espera(2000);
  await arriba(900);

  // ── 1 · Configuración ──
  await cartel('1 · La primera vez: tu empresa y tu logo', 'Se guardan en el celular para todos los informes', 800);
  await tocar('#cfg summary', 900);
  await ver('#logoPrev');
  await espera(2400);
  await tocar('#cfg summary', 600);

  // ── 2 · Un desvío nuevo ──
  await cartel('2 · Cargá cada desvío en el momento', 'Sector, fotos, descripción y acción correctiva', 800);
  await tipear('#sector', Ejemplo.NUEVO.sector);
  await cartel('Sacá las fotos o elegilas de la galería', 'Se achican solas para que el PDF no pese', 600);
  await ver('label.btn:has(#fotos)');
  const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.locator('label.btn:has(#fotos)').click()]);
  await selector.setFiles(fotosNuevas);
  await page.waitForSelector('#thumbs .th:nth-child(2)');
  await espera(1400);
  await cartel('Ordenalas con ◀ ▶ o quitalas con ✕', '', 600);
  await tocar('#thumbs .th:nth-child(2) button[data-a="l"]', 1600);
  await cartel('Escribí, dictá o usá tus frases guardadas', 'Las frases se agregan al texto: completás el dato', 600);
  await tipear('#desc', 'Bolsas de azúcar sin rótulo en el pallet 4 del depósito de MP.');
  await tocar('#fr-desc button.frase', 1200);
  await tipear('#acc', 'Rotular las bolsas con producto, lote y fecha');
  await tocar('#fr-acc button.frase', 1200);
  await cartel('Agregar desvío', 'Queda guardado aunque se cierre la app', 400);
  await tocar('#guardar', 900);
  await ver('#lista .card:last-child');
  await cartel('3 · Editá, reordená o borrá antes de emitir', 'Los N° se acomodan solos', 2800);

  // ── 4 · PDF del reporte diario ──
  await cartel('4 · Al terminar la recorrida: Generar PDF', 'Con tu logo, la portada y las fotos acomodadas', 600);
  await verPDF('diario', [1, 2, 'DEPÓSITO MP'], [[540, 2600], [1080, 2800]]);
  await cartel('Se descarga listo para mandar', 'Por mail, WhatsApp o donde lo entregues', 2600);
  await cartel('', '', 300);

  // ── 5 · Modo auditoría ──
  const placaAud = titulo.replace('Informe de <span>Estado de Planta</span>', 'Modo <span>auditoría interna</span>') +
    '<p>Para la auditoría semanal según ISO 9001: lista de verificación, hallazgos, trazabilidad y firmas.</p>';
  await placa(placaAud, 600);
  grabando = false; await grabacion;              // durante la recarga no hay cuadros: queda la placa
  await cargar(Ejemplo.paqueteAuditoria(), placaAud);
  grabando = true; tandaNueva = true; const grabacion2 = grabar();
  await espera(3600);
  await placa('', 900);
  await cartel('5 · Se activa en Configuración', 'Con el código del registro y los sectores de tu planta', 800);
  await tocar('#cfg summary', 900);
  await ver('#auditoria');
  await espera(2600);
  await tocar('#cfg summary', 600);

  await cartel('Lista de verificación por sector', 'C · NC · N/A · NV, con el % de cumplimiento al día', 800);
  await tocar('#secChips button[data-s="Envasado"]', 1200);
  await ver('#matriz .resumen');
  await espera(1600);
  await ver('#matriz button[data-n="5"]');
  await espera(1800);
  await tocar('#secChips button[data-s="Formulación"]', 1400);

  await cartel('Cada hallazgo con su tipo y su punto', 'Te muestra el criterio, el requisito ISO y frases típicas', 800);
  await tipear('#sector', 'Formulación');
  await elegir('#tipo', 'NC');
  await elegir('#pto', '13');
  await ver('#ptoGuia');
  await espera(2400);
  await tocar('#fr-desc button.frase.tipica', 900);
  await page.keyboard.type('la zona de pesada: dos bidones sin etiqueta.', { delay: 60 });
  await espera(600);
  await tocar('#fr-acc button.frase.tipica', 1400);
  await tocar('#guardar', 900);
  await cartel('El punto 13 queda marcado NC solo', 'Y el hallazgo recibe su N°: NC-261111-04', 600);
  await ver('#matriz button[data-n="13"]');
  await espera(2400);

  await cartel('Trazabilidad y conclusión', 'Un lote hacia atrás y hacia adelante, y el cierre del auditor', 800);
  await ver('#trUsar', 'start');
  await espera(2200);
  await ver('#audConclusion');
  await espera(2000);

  await cartel('El informe de auditoría completo', 'Resultados por sector, hallazgos, firmas y la lista como anexo', 600);
  await verPDF('auditoria', [1, 'Firma y aclaración', 'ANEXO'], [[540, 2800], [1080, 3000]]);
  await cartel('', '', 300);

  // ── Sin señal ──
  await arriba();
  await ctx.setOffline(true);
  await cartel('¿Sin señal en planta? Funciona igual', 'Todo queda en tu celular hasta que generás el PDF', 3200);
  await ctx.setOffline(false);
  await cartel('', '', 300);

  // ── Cierre ──
  await placa(titulo + '<p>Usala gratis en</p><p><b>roca-byte.github.io/informeCalidad</b></p><p>Instalala en el celular desde el navegador</p>', 4800);

  grabando = false;
  await grabacion2;
  const fin = Date.now() / 1000;
  await ctx.close();
  await browser.close();
  srv.close();

  // Cuadros fallados: si la captura cae en medio de un scroll suave, a veces sale con la barra
  // de arriba corrida hacia abajo y se ve un salto. En un cuadro sano la esquina de arriba a la
  // izquierda es siempre oscura (barra de la app, placa o visor de PDF); si es clara, se descarta
  // y el cuadro anterior queda un poco más.
  const luz = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(carpeta, 'c%05d.jpg'), '-vf',
    'crop=20:20:10:10,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-']).toString()
    .split('\n').filter(l => l.includes('YAVG=')).map(l => +l.split('=')[1]);
  let corte = false;
  const sanos = cuadros.filter((c, i) => {
    corte = corte || c.corte;
    if (luz[i] > 120) return false;
    c.corte = corte; corte = false; return true;
  });
  console.log('Cuadros fallados descartados:', cuadros.length - sanos.length);
  cuadros.length = 0; cuadros.push(...sanos);

  // Lista de cuadros con cuánto dura cada uno en pantalla (hasta que llega el siguiente).
  // El hueco de la recarga del modo auditoría no se cuenta: el cuadro de antes dura 0,1 s.
  const lista = path.join(carpeta, 'lista.txt');
  fs.writeFileSync(lista, cuadros.map((c, i) => {
    const sig = cuadros[i + 1], hasta = sig ? sig.t : fin;
    const dura = sig && sig.corte ? 0.1 : Math.max(0.04, hasta - c.t);
    return "file '" + c.archivo + "'\nduration " + dura.toFixed(3);
  }).join('\n') + "\nfile '" + cuadros[cuadros.length - 1].archivo + "'\n");

  // Cuadros → MP4 (H.264) a 25 cuadros por segundo: se reproduce en celulares, WhatsApp,
  // LinkedIn y YouTube. El ancho y el alto tienen que ser pares para H.264.
  const mp4 = path.join(SALIDA, 'informeCalidad-demo.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista,
    '-vf', 'fps=25,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
    '-movflags', '+faststart', '-an', mp4]);
  fs.rmSync(carpeta, { recursive: true, force: true });
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim();
  console.log('Cuadros:', cuadros.length);
  console.log('Video:', path.relative(RAIZ, mp4), Math.round(fs.statSync(mp4).size / 1024) + ' KB,', Math.round(dur) + ' s');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
