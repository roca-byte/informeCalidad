/* Genera las capturas de la guía (docs/img/*.png) y el recorrido animado (docs/img/demo.gif).
 *
 * Uso:  node tools/demo.js
 * Necesita Playwright, ffmpeg y pdftoppm (poppler-utils). Carga en el navegador los datos de
 * ejemplo de tools/ejemplo.js, que son inventados: no hay datos de ninguna empresa real.
 * Las páginas del PDF salen del PDF que genera la app (se descarga y se pasa a imagen).
 * Volver a correrlo cada vez que cambie algo visible de la app o del PDF.
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { servidor, RAIZ } = require('./servidor');
const Ejemplo = require('./ejemplo');

const SALIDA = path.join(RAIZ, 'docs', 'img');
const CELULAR = { width: 390, height: 844 };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'informe-demo-'));

// Pasa las páginas pedidas de un PDF a PNG. paginas: [[número, nombre], ...]
function paginasPDF(pdf, paginas) {
  paginas.forEach(([n, nombre]) => {
    const base = path.join(TMP, 'p' + n);
    execFileSync('pdftoppm', ['-r', '100', '-png', '-singlefile', '-f', String(n), '-l', String(n), pdf, base]);
    fs.copyFileSync(base + '.png', path.join(SALIDA, nombre + '.png'));
  });
}
// Busca la primera página del PDF que contiene un texto (para no depender de cuántas páginas salgan)
function paginaCon(pdf, texto) {
  const total = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1];
  for (let n = 1; n <= total; n++)
    if (execFileSync('pdftotext', ['-f', String(n), '-l', String(n), pdf, '-']).toString().includes(texto)) return n;
  throw new Error('No encontré "' + texto + '" en ' + pdf);
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const srv = servidor().listen(0);
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  // --lang: los campos de fecha y hora toman el idioma del navegador (dd/mm/aaaa).
  const browser = await chromium.launch({ args: ['--lang=es-AR'] });
  const capturas = [];

  async function contexto(paquete, opciones) {
    const ctx = await browser.newContext(Object.assign({
      viewport: CELULAR, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: 'light', acceptDownloads: true,
      locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', isMobile: true, hasTouch: true
    }, opciones || {}));
    const page = await ctx.newPage();
    // Reloj fijo en el 11/11: la fecha del informe y los N° de hallazgo salen iguales cada vez.
    await page.clock.setFixedTime(new Date(Ejemplo.HOY + 'T10:30:00-03:00'));
    page.on('dialog', d => d.accept());
    page.on('pageerror', e => { throw e; });
    // La app arranca vacía: se cargan los ejemplos en su localStorage y se recarga.
    await page.goto(url);
    await page.waitForFunction(() => typeof CHECKLIST !== 'undefined');
    await page.evaluate(Ejemplo.cargarEnPagina, paquete);
    await page.reload();
    await page.waitForSelector('#lista .card');
    return { ctx, page };
  }

  // Pantalla visible o, con selector, solo ese bloque (la barra de arriba es fija: se suelta).
  // alto: recorta el bloque a esa altura (para listas largas).
  async function foto(page, nombre, selector, alto) {
    await page.waitForTimeout(350);
    const destino = path.join(SALIDA, nombre + '.png');
    const estilo = await page.addStyleTag({ content: '.q-topbar { position: static !important; }' });
    if (!selector) await page.screenshot({ path: destino });
    else if (!alto) await page.locator(selector).first().screenshot({ path: destino });
    else {
      const el = page.locator(selector).first();
      await el.scrollIntoViewIfNeeded();
      const c = await el.evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; });
      await page.screenshot({ path: destino, fullPage: true, clip: { x: c.x, y: c.y, width: c.width, height: Math.min(alto, c.height) } });
    }
    await estilo.evaluate(e => e.remove());
    capturas.push(nombre);
  }
  async function descargarPDF(page, nombre) {
    const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('#pdf')]);
    const destino = path.join(TMP, nombre + '.pdf');
    await descarga.saveAs(destino);
    return destino;
  }
  // Fotos del desvío nuevo, como si vinieran de la cámara
  async function fotosNuevas(page) {
    const escenas = Object.fromEntries(Ejemplo.NUEVO.fotos.map(k => [k, Ejemplo.ESCENAS[k]]));
    return (await page.evaluate(Ejemplo.fotosEnPagina, escenas)).map(f => ({ name: f.nombre, mimeType: 'image/jpeg', buffer: Buffer.from(f.base64, 'base64') }));
  }
  const form = 'section.card:has(#ftitle)';

  // ── Reporte diario ──
  let { ctx, page } = await contexto(Ejemplo.paqueteDiario());
  await foto(page, '01-inicio');
  await page.click('#cfg summary');
  await foto(page, '02-configuracion', '#cfg');
  await page.click('#cfg summary');
  // Un desvío nuevo con todo cargado (antes de agregarlo)
  await page.fill('#sector', Ejemplo.NUEVO.sector);
  await page.setInputFiles('#fotos', await fotosNuevas(page));
  await page.waitForSelector('#thumbs .th:nth-child(2)');
  await page.fill('#desc', Ejemplo.NUEVO.desc);
  await page.fill('#acc', Ejemplo.NUEVO.acc);
  await page.click('#fr-acc button.frase');   // agrega "Verificar en la próxima recorrida" en una línea nueva
  await foto(page, '03-desvio', form);
  await page.click('#guardar');
  await foto(page, '04-lista', '#lista');
  const diario = await descargarPDF(page, 'diario');
  paginasPDF(diario, [[1, '05-pdf-portada'], [2, '06-pdf-desvios']]);
  await ctx.close();

  // ── Auditoría interna ──
  ({ ctx, page } = await contexto(Ejemplo.paqueteAuditoria()));
  await page.click('#cfg summary');
  await foto(page, '07-auditoria-config', '#cfg');
  await page.click('#cfg summary');
  await foto(page, '08-auditoria-datos', 'section.card:has(#audHora)');
  await page.click('#secChips button[data-s="Envasado"]');
  await foto(page, '09-lista-verificacion', 'section.card:has(#matriz)', 1150);
  // Un hallazgo nuevo con punto de la lista: muestra el criterio y las frases típicas del punto
  await page.fill('#sector', 'Formulación');
  await page.selectOption('#tipo', 'NC');
  await page.selectOption('#pto', '13');
  await page.click('#fr-desc button.frase.tipica');
  await page.keyboard.type('la zona de pesada: dos bidones de solvente sin etiqueta.');
  await foto(page, '10-hallazgo', form);
  // Los cuadros de texto tienen alto fijo: para la foto se estiran al texto (en el celular se deslizan)
  await page.evaluate(() => ['trAtras', 'trAdel', 'audConclusion'].forEach(id => { const t = document.getElementById(id); t.style.height = t.scrollHeight + 4 + 'px'; }));
  await foto(page, '11-trazabilidad', 'section.card:has(#trUsar)');
  await foto(page, '12-conclusion', 'section.card:has(#audConclusion)');
  const aud = await descargarPDF(page, 'auditoria');
  paginasPDF(aud, [[1, '13-pdf-auditoria'], [paginaCon(aud, 'Firma y aclaración'), '14-pdf-conclusion'], [paginaCon(aud, 'ANEXO'), '15-pdf-anexo']]);
  await ctx.close();

  // ── Recorrido animado: cargar un desvío con fotos y agregarlo ──
  const carpetaVideo = path.join(TMP, 'gif');
  ({ ctx, page } = await contexto(Ejemplo.paqueteDiario(), { deviceScaleFactor: 1, recordVideo: { dir: carpetaVideo, size: CELULAR } }));
  const tipear = async (sel, txt, ms) => { await page.click(sel); await page.keyboard.type(txt, { delay: ms || 40 }); await page.waitForTimeout(250); };
  await page.waitForTimeout(700);
  await page.locator(form).evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await page.waitForTimeout(700);
  await tipear('#sector', Ejemplo.NUEVO.sector, 60);
  const [selector] = await Promise.all([page.waitForEvent('filechooser'), page.click('label.btn:has(#fotos)')]);
  await selector.setFiles(await fotosNuevas(page));
  await page.waitForSelector('#thumbs .th:nth-child(2)');
  await page.waitForTimeout(800);
  await tipear('#desc', 'Bolsas de azúcar sin rótulo en el pallet 4.', 35);
  await tipear('#acc', 'Rotular las bolsas con producto y lote', 35);
  await page.click('#fr-acc button.frase');
  await page.waitForTimeout(900);
  await page.click('#guardar');
  await page.waitForTimeout(500);
  await page.locator('#lista .card:last-child').evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await page.waitForTimeout(1500);
  await page.locator('#pdf').evaluate(e => e.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await page.waitForTimeout(1600);
  const video = await page.video().path();
  await ctx.close();
  await browser.close();
  srv.close();

  // webm → GIF liviano (6 cuadros por segundo, 320 px; solo se guarda lo que cambia).
  const gif = path.join(SALIDA, 'demo.gif');
  const filtro = 'fps=6,scale=320:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-vf', filtro, gif]);
  fs.rmSync(TMP, { recursive: true, force: true });

  console.log('Capturas:', capturas.join(', '), '+ 5 páginas de PDF');
  console.log('GIF:', path.relative(RAIZ, gif), Math.round(fs.statSync(gif).size / 1024) + ' KB');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
