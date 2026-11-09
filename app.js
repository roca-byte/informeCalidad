const KEY='informe_planta_v1',NKEY='informe_nombre',$=id=>document.getElementById(id);
let items=[],fotos=[],editIdx=null,sample=null,dls=null;
try{items=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
// Fecha LOCAL: toISOString() da la fecha en UTC y en Argentina después de las 21 h marcaba el día siguiente
const hoy=()=>{const d=new Date(),dd=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${dd(d.getMonth()+1)}-${dd(d.getDate())}`};
$('fecha').value=hoy();
try{$('nombre').value=localStorage.getItem(NKEY)||''}catch(e){}
const logoImgEl=$('logoImg');
const hex2rgb=h=>{const n=parseInt(h.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255]};
const msg=t=>{$('msg').textContent=t};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Tema: sigue al del sistema (claro u oscuro) desde style.css; ya no hay botón
// Limpieza de claves que ya no se usan (tema manual y código de acceso de la IA, ya quitados)
try{['informe_tema','informe_ia_token'].forEach(k=>localStorage.removeItem(k))}catch(e){}
/* Configuración de la empresa: se guarda en el dispositivo y aplica a todos los informes */
const CKEY='informe_config';
let cfg={};try{cfg=JSON.parse(localStorage.getItem(CKEY)||'{}')}catch(e){}
const saveCfg=()=>{try{localStorage.setItem(CKEY,JSON.stringify(cfg));return true}catch(e){msg('No hay espacio para guardar la configuración. Probá con un logo más chico.');return false}};
$('empresa').value=cfg.empresa||'';
$('depto').value=cfg.depto||'';$('depto').placeholder=BRAND.departamento;
function pintarCfg(){
  const l=cfg.logo;$('logoPrev').hidden=$('logoQuitar').hidden=!l;if(l)$('logoPrev').src=l.d;
  $('logoTxt').textContent=l?'Cambiar logo':'Elegir logo';
  $('cfgRes').textContent=cfg.empresa?'· '+cfg.empresa+(l?' (con logo)':''):(l?'· con logo':'· falta cargar la empresa');
}
['empresa','depto'].forEach(k=>$(k).addEventListener('input',()=>{cfg[k]=$(k).value.trim();saveCfg();pintarCfg()}));
// El logo se reduce (máx. 800x300 px) y se guarda en PNG para conservar la transparencia
$('logoFile').addEventListener('change',e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const k=Math.min(1,800/im.width,300/im.height),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    const prev=cfg.logo;cfg.logo={d:c.toDataURL('image/png'),w:c.width,h:c.height};
    if(saveCfg())msg('Logo guardado.');else cfg.logo=prev;pintarCfg()};
    im.onerror=()=>msg('No se pudo leer esa imagen.');im.src=r.result};r.readAsDataURL(f);
});
$('logoQuitar').onclick=()=>{delete cfg.logo;saveCfg();pintarCfg();msg('Logo quitado.')};
if(!cfg.empresa&&!cfg.logo)$('cfg').open=true;
pintarCfg();

Aud.init();   // auditoria.js: lista de verificación, trazabilidad y conclusión (modo opcional)

function persist(){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){msg('No hay espacio para guardar el borrador en el celular. Generá el PDF antes de seguir.')}}

function resize(f){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res({d:c.toDataURL('image/jpeg',.75),w:c.width,h:c.height})};im.src=r.result};r.readAsDataURL(f)})}

$('fotos').addEventListener('change',async e=>{
  msg('Cargando fotos…');
  for(const f of e.target.files)fotos.push(await resize(f));
  e.target.value='';msg('');drawThumbs();
});
function drawThumbs(){
  $('thumbs').innerHTML=fotos.map((f,i)=>`<div class="th"><img src="${f.d}" alt="Foto ${i+1}"><div><button data-a="l" data-i="${i}">◀</button><button data-a="x" data-i="${i}">✕</button><button data-a="r" data-i="${i}">▶</button></div></div>`).join('');
}
$('thumbs').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i,a=b.dataset.a;
  if(a==='x')fotos.splice(i,1);
  else{const j=a==='l'?i-1:i+1;if(j>=0&&j<fotos.length)[fotos[i],fotos[j]]=[fotos[j],fotos[i]]}
  drawThumbs();
});

function resetForm(){
  editIdx=null;fotos=[];['sector','desc','acc','pto'].forEach(k=>$(k).value='');$('tipo').value='NC';Aud.pintarForm();
  $('ftitle').textContent='Nuevo desvío';$('guardar').textContent='Agregar desvío';$('cancelar').hidden=true;drawThumbs();
}
$('guardar').onclick=()=>{
  const it={sector:$('sector').value.trim(),desc:$('desc').value.trim(),acc:$('acc').value.trim(),fotos:fotos.slice()};
  // Al editar sin cambiar de punto se conserva la copia original del punto
  const viejo=editIdx!==null?items[editIdx]:{},prev=viejo.pto,p=Aud.puntos[$('pto').value];
  if(prev&&String(prev.n)===$('pto').value)it.pto=prev;else if(p)it.pto={...p};
  // Tipo de hallazgo: solo con el bloque de auditoría visible (si no, se conserva el que tenía)
  if(!$('ptoBox').hidden)it.tipo=$('tipo').value;else if(viejo.tipo)it.tipo=viejo.tipo;
  if(!it.sector&&!it.desc&&!it.fotos.length){msg('Cargá al menos el sector, una foto o una descripción.');return}
  if(editIdx===null)items.push(it);else items[editIdx]=it;
  Aud.alGuardarDesvio(it);persist();resetForm();render();msg('Desvío guardado.');
};
$('cancelar').onclick=resetForm;

function render(){
  $('n').textContent=items.length;
  const ids=Aud.ids(items);
  $('sectores').innerHTML=[...new Set([...Aud.sectoresConfig(),...Aud.sectoresAuditados(),...items.map(i=>i.sector)].filter(Boolean))].map(s=>`<option value="${esc(s)}">`).join('');
  $('lista').innerHTML=items.map((it,i)=>`<div class="card it"><h3>${it.tipo?`${ids[i]} · ${TIPOS[it.tipo]}`:`Desvío N.° ${i+1}`} - ${esc(it.sector||'Sin sector')}</h3>
  <div class="thumbs">${it.fotos.map(f=>`<div class="th"><img src="${f.d}" alt=""></div>`).join('')}</div>
  ${it.pto?`<p><b>Punto N° ${it.pto.n}: ${esc(it.pto.p)}</b> · ISO ${esc(it.pto.r)}</p>`:''}<p>${esc(it.desc)}</p><p><b>Acción:</b> ${esc(it.acc)}</p>
  <div class="row"><button data-a="e" data-i="${i}">Editar</button><button data-a="u" data-i="${i}">↑</button><button data-a="d" data-i="${i}">↓</button><button class="danger" data-a="b" data-i="${i}">Borrar</button></div></div>`).join('');
}
$('lista').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i,a=b.dataset.a;
  if(a==='e'){const it=items[i];editIdx=i;fotos=it.fotos.slice();$('sector').value=it.sector;$('desc').value=it.desc;$('acc').value=it.acc;
    // Si el desvío tenía punto y el modo auditoría está apagado, se muestra igual para no perderlo
    Aud.pintarForm(!!(it.pto||it.tipo));$('pto').value=it.pto?it.pto.n:'';$('tipo').value=it.tipo||'NC';Aud.pintarGuia();
    $('ftitle').textContent='Editando desvío N.° '+(i+1);$('guardar').textContent='Guardar cambios';$('cancelar').hidden=false;drawThumbs();scrollTo({top:0,behavior:'smooth'});return}
  if(a==='b'){if(confirm('¿Borrar este desvío?')){items.splice(i,1);if(editIdx===i)resetForm()}}
  else{const j=a==='u'?i-1:i+1;if(j>=0&&j<items.length)[items[i],items[j]]=[items[j],items[i]]}
  persist();render();
});
$('nuevo').onclick=()=>{if(confirm('Se borran todos los desvíos cargados'+(Aud.activo()?' y los datos de la auditoría (lista por sector, trazabilidad, conclusión)':'')+'. ¿Empezar un informe nuevo?')){items=[];persist();Aud.reiniciar();resetForm();render();msg('')}};


/* PDF: encabezado de marca en cada página, desvíos en flujo continuo, pie con página.
   Con el modo auditoría suma: datos de la auditoría, resultados por sector, tipo y N° de
   cada hallazgo, trazabilidad, conclusión, firmas y la lista de verificación como anexo. */
$('pdf').onclick=async()=>{
  const aud=Aud.activo(),A=Aud.datos,secs=aud?Aud.sectoresAuditados():[];
  if(!items.length&&!secs.length){msg(aud?'Todavía no cargaste hallazgos ni la lista de verificación.':'Todavía no cargaste desvíos.');return}
  if(!window.jspdf){msg('No cargó el generador de PDF. Revisá la conexión.');return}
  const nombre=$('nombre').value.trim();try{localStorage.setItem(NKEY,nombre)}catch(e){}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),W=210,M=20,CW=W-2*M;let y=0;
  const [yy,mm,dd]=$('fecha').value.split('-'),fecha=`${dd}/${mm}/${yy}`;
  // Logo: primero el cargado en Configuración; si no, logo.png del repo (opcional)
  const logo=cfg.logo?{src:cfg.logo.d,w:cfg.logo.w,h:cfg.logo.h}
    :(logoImgEl&&logoImgEl.complete&&logoImgEl.naturalWidth>0)?{src:logoImgEl,w:logoImgEl.naturalWidth,h:logoImgEl.naturalHeight}:null;
  const empresa=(cfg.empresa||'').trim()||BRAND.empresa,depto=(cfg.depto||'').trim()||BRAND.departamento;
  const accentRGB=hex2rgb(BRAND.colorAcento);
  const codigo=(cfg.codigo||'').trim(),rev=(cfg.revision||'').trim();
  const ids=Aud.ids(items);

  function drawHeader(){
    let bottom=20;
    if(logo){
      const maxH=14,ratio=logo.w/logo.h;let h=maxH,w=h*ratio;
      if(w>70){w=70;h=w/ratio}
      doc.addImage(logo.src,'PNG',M,12,w,h,'logo','FAST');bottom=12+h;
    }else{
      doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(40);
      doc.text(empresa,M,20);doc.setTextColor(0);bottom=22;
    }
    doc.setDrawColor(200);doc.setLineWidth(.3);doc.line(M,bottom+4,W-M,bottom+4);
    y=bottom+16;
  }
  const need=h=>{if(y+h>278){const f=doc.getFont(),sz=doc.internal.getFontSize();doc.addPage();drawHeader();doc.setFont(f.fontName,f.fontStyle);doc.setFontSize(sz)}};
  const lines=(t,size,style)=>{doc.setFont('courier',style==='bold'?'bold':style==='italic'?'italic':'normal');doc.setFontSize(size);
    for(const l of doc.splitTextToSize(t,CW)){need(6);doc.text(l,M,y);y+=5.6}};
  // Título de sección: mayúsculas en negrita con la línea de color de acento debajo
  const titulo=t=>{need(16);doc.setFont('courier','bold');doc.setFontSize(12.5);doc.text(t,M,y);
    doc.setDrawColor(...accentRGB);doc.setLineWidth(.5);doc.line(M,y+2,W-M,y+2);y+=9};
  const campo=(etq,val)=>{if(val)lines(`${etq}: ${val}`,10.5,'normal')};
  function bulletList(t){
    doc.setFont('courier','normal');doc.setFontSize(10.5);
    t.split('\n').map(s=>s.trim()).filter(Boolean).forEach(item=>{
      const w=doc.splitTextToSize(item,CW-8);need(6);doc.text('•',M,y);doc.text(w[0],M+6,y);y+=5.6;
      for(let k=1;k<w.length;k++){need(6);doc.text(w[k],M+6,y);y+=5.6}
    });
  }
  function photoGrid(fs){
    if(!fs.length)return;
    lines('Registro fotográfico',10.5,'italic');y+=1;
    const n=fs.length,cols=n===1?1:2,gap=6,cellW=cols===1?CW*.55:(CW-gap)/2;
    for(let k=0;k<n;k+=cols){
      const row=fs.slice(k,k+cols).map(f=>{let w=cellW,h=w*f.h/f.w;if(h>120){h=120;w=h*f.w/f.h}return{f,w,h}});
      const rowH=Math.max(...row.map(r=>r.h));need(rowH+6);
      row.forEach((r,idx)=>{const x=M+idx*(cellW+gap)+(cellW-r.w)/2;doc.addImage(r.f.d,'JPEG',x,y,r.w,r.h)});
      y+=rowH+6;
    }
    y+=1;
  }
  // Fila de tabla en Courier: cada celda en su columna x (mm desde el margen)
  const fila=(cols,xs,size,style)=>{doc.setFont('courier',style||'normal');doc.setFontSize(size);need(5.2);
    cols.forEach((c,k)=>doc.text(String(c),M+xs[k],y));y+=5.2};
  const corta=(t,max)=>t.length>max?t.slice(0,max-1)+'…':t;

  /* ---------- Portada ---------- */
  drawHeader();
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...accentRGB);
  doc.text(BRAND.etiqueta.split('').join(' '),M,y);doc.setTextColor(0);y+=9;
  doc.setFont('times','bold');doc.setFontSize(22);
  (aud?BRAND.tituloAuditoria:BRAND.tituloInforme).split('\n').forEach(l=>{doc.text(l,M,y);y+=9});
  y+=4;
  doc.setFont('courier','normal');doc.setFontSize(10);
  const meta=aud
    ?[codigo?`${codigo}${rev?' · REV. '+rev:''}`:'',`FECHA ${fecha}${A.hora?' · HORA '+A.hora:''}`,nombre?'AUDITOR: '+nombre.toUpperCase():'',depto]
    :[`FECHA ${fecha}`,nombre?nombre.toUpperCase():'',depto];
  meta.filter(Boolean).forEach(l=>{doc.text(l,M,y);y+=5.5});
  y+=4;

  if(!aud){lines(BRAND.objetivo,10.5,'normal');y+=6}
  else{
    // Datos que pide un informe de auditoría (ISO 19011, 6.5.1): objetivo, alcance, criterios, auditados
    lines(BRAND.objetivoAuditoria,10.5,'normal');y+=2;
    const alcance=[...new Set([...secs,...items.map(i=>i.sector).filter(Boolean)])];
    campo('Alcance (sectores auditados)',alcance.join(', ')||'-');
    campo('Criterios',`ISO 9001:2015 y lista de verificación${codigo?' '+codigo:''}`);
    campo('Auditados',A.auditados.trim());
    y+=6;
    if(secs.length){
      titulo('RESULTADOS POR SECTOR');
      const xs=[0,62,74,86,100,112,140];
      fila(['Sector','C','NC','N/A','NV','Sin compl.','% cumpl.'],xs,9,'bold');
      const tot={C:0,NC:0,NA:0,NV:0,sin:0};
      secs.forEach(s=>{const c=Aud.conteo(s);['C','NC','NA','NV','sin'].forEach(k=>tot[k]+=c[k]);
        fila([corta(s,30),c.C,c.NC,c.NA,c.NV,c.sin,c.pct],xs,9)});
      const pt=tot.C+tot.NC?Math.round(100*tot.C/(tot.C+tot.NC))+'%':'-';
      fila(['TOTAL',tot.C,tot.NC,tot.NA,tot.NV,tot.sin,pt],xs,9,'bold');
      lines('% de cumplimiento = C / (C + NC)',8.5,'italic');y+=6;
    }
    titulo(`HALLAZGOS (${items.length})`);
    if(!items.length){lines('No se registraron hallazgos.',10.5,'normal');y+=6}
  }

  /* ---------- Desvíos / hallazgos ---------- */
  items.forEach((it,i)=>{
    need(14);
    doc.setFont('courier','bold');doc.setFontSize(12.5);
    const cab=it.tipo?ids[i]:`DESVÍOS N°${i+1}`;
    doc.text(`${cab} ${(it.sector||'SIN SECTOR').toUpperCase()}`,M,y);
    doc.setDrawColor(...accentRGB);doc.setLineWidth(.5);doc.line(M,y+2,W-M,y+2);y+=9;
    if(it.tipo)lines(`Tipo de hallazgo: ${TIPOS[it.tipo]}`,10.5,'bold');
    if(it.pto){lines('Punto de la lista de verificación:',10.5,'italic');lines(`N° ${it.pto.n} · ${it.pto.p}`,10.5,'bold');
      lines(`Criterio de aceptación: ${it.pto.c}`,10.5,'normal');lines(`Requisito ISO 9001:2015: ${it.pto.r}`,10.5,'normal');y+=3}
    else if(it.tipo)y+=3;
    if(it.desc){lines('Descripción:',10.5,'italic');lines(it.desc,10.5,'normal');y+=3}
    photoGrid(it.fotos);
    if(it.acc){lines('Acción Correctiva Propuesta:',10.5,'bold');y+=1;bulletList(it.acc);y+=3}
    y+=4;
  });

  /* ---------- Ejercicio de trazabilidad (opcional) ---------- */
  const T=A.traza;
  if(aud&&T.usar){
    titulo('EJERCICIO DE TRAZABILIDAD');
    campo('Producto',T.producto.trim());campo('Lote de producto terminado',T.lote.trim());
    if(T.atras.trim()){lines('Hacia atrás (materias primas, lotes y proveedores):',10.5,'italic');bulletList(T.atras);y+=2}
    if(T.adelante.trim()){lines('Hacia adelante (despachos y clientes):',10.5,'italic');bulletList(T.adelante);y+=2}
    campo('Tiempo para reunir la información',T.tiempo.trim());
    campo('Resultado',{C:'Conforme',NC:'No conforme'}[T.resultado]||'Sin indicar');
    if(T.obs.trim()){lines('Observaciones:',10.5,'italic');lines(T.obs.trim(),10.5,'normal')}
    y+=6;
  }

  /* ---------- Resumen por punto de la lista ---------- */
  // Agrupa los desvíos por punto (ordenados por N°) para ver qué requisitos ISO tuvieron desvíos
  const grupos={};items.forEach((it,i)=>{if(it.pto)(grupos[it.pto.n]=grupos[it.pto.n]||{p:it.pto,ds:[]}).ds.push(it.tipo?ids[i]:i+1)});
  const ns=Object.keys(grupos).map(Number).sort((a,b)=>a-b);
  if(ns.length){
    y+=2;need(20);titulo('RESUMEN POR PUNTO DE LA LISTA');
    ns.forEach(n=>{const g=grupos[n];need(18);
      lines(`N° ${n} · ${g.p.p}`,10.5,'bold');
      lines(`Requisito ISO 9001:2015: ${g.p.r}`,10.5,'normal');
      const refs=g.ds.join(', ');
      lines(typeof g.ds[0]==='number'?`Desvío${g.ds.length>1?'s':''} N° ${refs}`:`Hallazgo${g.ds.length>1?'s':''}: ${refs}`,10.5,'italic');y+=3});
    const sin=items.length-ns.reduce((t,n)=>t+grupos[n].ds.length,0);
    lines(`Puntos con desvío: ${ns.length} · Desvíos sin punto de la lista: ${sin}`,10.5,'normal');y+=6;
  }

  /* ---------- Conclusión y firmas (auditoría) ---------- */
  if(aud){
    titulo('CONCLUSIÓN');
    lines(A.conclusion.trim()||'(Sin conclusión cargada)',10.5,'normal');
    need(36);y+=22;
    const fw=75;
    doc.setDrawColor(120);doc.setLineWidth(.3);doc.line(M,y,M+fw,y);doc.line(W-M-fw,y,W-M,y);
    doc.setFont('courier','normal');doc.setFontSize(7.5);
    doc.text('Firma y aclaración - Auditor',M,y+4.5);doc.text('Firma y aclaración - Responsable de calidad',W-M-fw,y+4.5);
    y+=12;
  }

  /* ---------- Anexo: lista de verificación por sector ---------- */
  // Es la evidencia de QUÉ se verificó (no solo lo que falló). Los sectores van en columnas
  // numeradas S1, S2… con referencia arriba; si hay muchos, se parte en tandas de 8.
  if(secs.length){
    const pts=Aud.puntosMatriz(),cats=CHECKLIST.map(g=>({cat:g.cat,items:g.items.filter(it=>!it.ej)})).filter(g=>g.items.length);
    for(let k=0;k<secs.length;k+=8){
      const tanda=secs.slice(k,k+8),x0=96,cw=10;
      doc.addPage();drawHeader();
      titulo(`ANEXO · LISTA DE VERIFICACIÓN${secs.length>8?` (${k/8+1}/${Math.ceil(secs.length/8)})`:''}`);
      lines('C = Cumple · NC = No cumple · N/A = No aplica · NV = No verificado · vacío = sin completar',8.5,'normal');
      lines(tanda.map((s,j)=>`S${k+j+1} = ${s}`).join(' · '),8.5,'bold');y+=2;
      const cabecera=()=>{doc.setFont('courier','bold');doc.setFontSize(8);doc.text('Punto',M,y);
        tanda.forEach((s,j)=>doc.text(`S${k+j+1}`,M+x0+j*cw,y));doc.setDrawColor(180);doc.setLineWidth(.2);doc.line(M,y+1.2,W-M,y+1.2);y+=5};
      // Salto de página propio para repetir la cabecera de columnas
      const lugar=h=>{if(y+h>278){doc.addPage();drawHeader();cabecera()}};
      cabecera();
      cats.forEach(g=>{
        lugar(9);doc.setFont('courier','bold');doc.setFontSize(7.5);doc.text(g.cat.toUpperCase(),M,y);y+=4.2;
        g.items.forEach(p=>{lugar(4.2);doc.setFont('courier','normal');doc.setFontSize(7.5);
          doc.text(corta(`${p.n}. ${p.p}`,58),M,y);
          tanda.forEach((s,j)=>{const e=(A.matriz[s].est||{})[p.n];if(!e)return;
            doc.setFont('courier',e==='NC'?'bold':'normal');doc.setTextColor(e==='NC'?180:0,0,0);
            doc.text(EST_TXT[e],M+x0+j*cw,y);doc.setTextColor(0)});
          y+=4.2});
      });
    }
    // Datos de cada sector (como en el pie del Excel)
    const conDatos=secs.filter(s=>{const h=A.matriz[s];return h.lote||h.notifica||h.motivo});
    if(conDatos.length){y+=4;need(14);lines('Datos de cada sector',10.5,'bold');
      conDatos.forEach(s=>{const h=A.matriz[s];need(12);lines(s,9.5,'bold');
        if(h.lote)lines(`Producto / lote en línea: ${h.lote}`,9.5,'normal');
        if(h.notifica)lines(`Se notifica a: ${h.notifica}`,9.5,'normal');
        if(h.motivo)lines(`Motivo de N/A y NV: ${h.motivo}`,9.5,'normal');y+=2});
    }
  }

  /* ---------- Pie en cada página (segunda pasada: recién acá se sabe el total) ---------- */
  const total=doc.internal.getNumberOfPages();
  for(let p=1;p<=total;p++){
    doc.setPage(p);doc.setFont('courier','normal');doc.setFontSize(8);doc.setTextColor(120);
    const pie=aud
      ?`Auditoría interna${codigo?' '+codigo:''}${rev?' Rev. '+rev:''} · ${fecha}${nombre?` | ${nombre}`:''} | Página ${p} de ${total}`
      :`Estado de planta · ${fecha}${nombre?` | ${nombre}`:''} | Página ${p}`;
    doc.text(pie,W/2,290,{align:'center'});
    doc.setTextColor(0);
  }

  const filename=`${aud?'Auditoria_Interna':'Reporte_Estado_de_Planta'}_${$('fecha').value}.pdf`;
  try{const a=document.createElement('a');a.href=URL.createObjectURL(doc.output('blob'));a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);msg('PDF generado.')}
  catch(e){msg('No se pudo guardar el PDF.')}
};
render();

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=15'));
