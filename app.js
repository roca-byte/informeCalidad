const KEY='informe_planta_v1',NKEY='informe_nombre',$=id=>document.getElementById(id);
const aiEndpoint=typeof IA_ENDPOINT==='string'&&IA_ENDPOINT.trim()?IA_ENDPOINT:'https://informe-planta-ia.myworker-dev.workers.dev';
let items=[],fotos=[],editIdx=null,sample=null,dls=null;
try{items=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
$('fecha').value=new Date().toISOString().slice(0,10);
try{$('nombre').value=localStorage.getItem(NKEY)||''}catch(e){}
const logoImgEl=$('logoImg');
const hex2rgb=h=>{const n=parseInt(h.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255]};
const msg=t=>{$('msg').textContent=t};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Tema claro/oscuro: el botón alterna y se recuerda en localStorage
const temaOscuro=()=>(document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))==='dark';
const pintarTema=()=>{$('tema').textContent=temaOscuro()?'☀️':'🌙'};
$('tema').addEventListener('click',()=>{const t=temaOscuro()?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('informe_tema',t)}catch(e){}pintarTema()});
pintarTema();
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

/* Auditoría interna (opcional): cada desvío puede vincularse a un punto de CHECKLIST.
   El desvío guarda una COPIA del punto, así los informes viejos no cambian si se edita la lista. */
const puntos={};CHECKLIST.forEach(g=>g.items.forEach(it=>{puntos[it.n]=it}));
$('pto').innerHTML='<option value="">— Sin punto de la lista —</option>'+CHECKLIST.map(g=>
  `<optgroup label="${esc(g.cat)}">${g.items.map(it=>`<option value="${it.n}">${it.n}. ${esc(it.p)}</option>`).join('')}</optgroup>`).join('');
$('auditoria').checked=!!cfg.auditoria;
const ptoTexto=p=>`Punto N° ${p.n}: ${p.p}`;
function pintarGuia(){
  const p=puntos[$('pto').value];$('ptoGuia').hidden=!p;
  // Orienta la redacción: el desvío describe qué se ve que NO cumple el criterio
  if(p)$('ptoGuia').innerHTML=`<b>Criterio de aceptación:</b> ${esc(p.c)}<br><b>Requisito ISO 9001:2015:</b> ${esc(p.r)}`;
  $('desc').placeholder=p?'Qué se ve que no cumple el criterio, dónde y con qué evidencia':'Qué se ve, dónde y qué no se cumple';
}
function pintarAuditoria(){$('ptoBox').hidden=!cfg.auditoria;if(!cfg.auditoria)$('pto').value='';pintarGuia()}
$('auditoria').addEventListener('change',()=>{cfg.auditoria=$('auditoria').checked;saveCfg();pintarAuditoria()});
$('pto').addEventListener('change',pintarGuia);
pintarAuditoria();

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
  editIdx=null;fotos=[];['sector','desc','acc','pto'].forEach(k=>$(k).value='');pintarAuditoria();
  $('ftitle').textContent='Nuevo desvío';$('guardar').textContent='Agregar desvío';$('cancelar').hidden=true;
  $('undo-desc').hidden=$('undo-acc').hidden=true;drawThumbs();
}
$('guardar').onclick=()=>{
  const it={sector:$('sector').value.trim(),desc:$('desc').value.trim(),acc:$('acc').value.trim(),fotos:fotos.slice()};
  // Al editar sin cambiar de punto se conserva la copia original del punto
  const prev=editIdx!==null&&items[editIdx].pto,p=puntos[$('pto').value];
  if(prev&&String(prev.n)===$('pto').value)it.pto=prev;else if(p)it.pto={...p};
  if(!it.sector&&!it.desc&&!it.fotos.length){msg('Cargá al menos el sector, una foto o una descripción.');return}
  if(editIdx===null)items.push(it);else items[editIdx]=it;
  persist();resetForm();render();msg('Desvío guardado.');
};
$('cancelar').onclick=resetForm;

function render(){
  $('n').textContent=items.length;
  $('sectores').innerHTML=[...new Set(items.map(i=>i.sector).filter(Boolean))].map(s=>`<option value="${esc(s)}">`).join('');
  $('lista').innerHTML=items.map((it,i)=>`<div class="card it"><h3>Desvío N.° ${i+1} - ${esc(it.sector||'Sin sector')}</h3>
  <div class="thumbs">${it.fotos.map(f=>`<div class="th"><img src="${f.d}" alt=""></div>`).join('')}</div>
  ${it.pto?`<p><b>${esc(ptoTexto(it.pto))}</b> · ISO ${esc(it.pto.r)}</p>`:''}<p>${esc(it.desc)}</p><p><b>Acción:</b> ${esc(it.acc)}</p>
  <div class="row"><button data-a="e" data-i="${i}">Editar</button><button data-a="u" data-i="${i}">↑</button><button data-a="d" data-i="${i}">↓</button><button class="danger" data-a="b" data-i="${i}">Borrar</button></div></div>`).join('');
}
$('lista').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i,a=b.dataset.a;
  if(a==='e'){const it=items[i];editIdx=i;fotos=it.fotos.slice();$('sector').value=it.sector;$('desc').value=it.desc;$('acc').value=it.acc;
    // Si el desvío tenía punto y el modo auditoría está apagado, se muestra igual para no perderlo
    if(it.pto&&$('ptoBox').hidden)$('ptoBox').hidden=false;$('pto').value=it.pto?it.pto.n:'';pintarGuia();
    $('ftitle').textContent='Editando desvío N.° '+(i+1);$('guardar').textContent='Guardar cambios';$('cancelar').hidden=false;drawThumbs();scrollTo({top:0,behavior:'smooth'});return}
  if(a==='b'){if(confirm('¿Borrar este desvío?')){items.splice(i,1);if(editIdx===i)resetForm()}}
  else{const j=a==='u'?i-1:i+1;if(j>=0&&j<items.length)[items[i],items[j]]=[items[j],items[i]]}
  persist();render();
});
$('nuevo').onclick=()=>{if(confirm('Se borran todos los desvíos cargados. ¿Empezar un informe nuevo?')){items=[];persist();resetForm();render();msg('')}};

/* IA: mejora el texto y lo deja editable */
if(aiEndpoint)document.querySelectorAll('.ia').forEach(b=>b.hidden=false);
const TKEY='informe_ia_token';
async function askAI(prompt,onText){
  let tk='';try{tk=localStorage.getItem(TKEY)||''}catch(e){}
  if(!tk){tk=(window.prompt('Código de acceso a la IA (el APP_TOKEN que configuraste en el Worker):')||'').trim();if(!tk)throw {code:'sin_codigo'};try{localStorage.setItem(TKEY,tk)}catch(e){}}
  const r=await fetch(aiEndpoint,{method:'POST',headers:{'Content-Type':'application/json','X-App-Token':tk},body:JSON.stringify({prompt})});
  if(r.status===401){try{localStorage.removeItem(TKEY)}catch(e){}throw {code:'codigo_incorrecto'}}
  if(!r.ok)throw {code:'http_'+r.status};
  const t=(((await r.json()).text)||'').trim();if(onText)onText({text:t});return {text:t};
}
async function mejorar(k){
  if(!aiEndpoint){msg('La IA todavía no está configurada.');return}
  const ta=$(k),orig=ta.value.trim();if(!orig){msg('Escribí algo primero y después lo mejoro.');return}
  const b=$('ia-'+k);b.disabled=true;b.textContent='Pensando…';ta.dataset.prev=ta.value;
  const reglas=k==='desc'
    ?'Reescribí la descripción de un desvío de calidad en planta: 2 a 4 líneas que digan qué se ve, dónde y qué norma o buena práctica no se cumple.'
    :'Reescribí la acción correctiva propuesta: máximo 2 acciones, cada una en su propia línea (sin números ni viñetas), con verbo + qué hacer + con qué, en lenguaje claro y no muy técnico. No uses los nombres en japonés de las 5S (Seiri, Seiton, etc.).';
  const otro=k==='desc'?$('acc').value:$('desc').value,p=puntos[$('pto').value];
  const ref=p?`\nPunto de la lista de verificación de auditoría: ${p.p}. Criterio de aceptación: ${p.c}. Requisito ISO 9001:2015: ${p.r}. Relacioná el texto con ese criterio sin inventar hechos.`:'';
  const prompt=`Sos asistente de un Checker de Calidad en una planta. ${reglas} Mantené los hechos del texto original y no inventes datos. Español claro y profesional. Respondé SOLO con el texto final, sin comillas ni explicaciones.\nSector: ${$('sector').value||'(sin indicar)'}\nContexto (el otro campo del desvío): ${otro||'(vacío)'}${ref}\nTexto original:\n${orig}`;
  try{
    const r=await askAI(prompt,({text})=>{ta.value=text});
    ta.value=r.text.trim();$('undo-'+k).hidden=false;msg('Listo. Podés editar el texto o deshacer.');
  }catch(e){ta.value=ta.dataset.prev;msg(e&&e.code==='not_granted'?'Necesito tu permiso para usar la IA.':'No se pudo mejorar el texto ('+(e&&e.code||'error')+').')}
  b.disabled=false;b.textContent='✨ Mejorar con IA';
}
['desc','acc'].forEach(k=>{
  $('ia-'+k).onclick=()=>mejorar(k);
  $('undo-'+k).onclick=()=>{$(k).value=$(k).dataset.prev||'';$('undo-'+k).hidden=true};
});

/* PDF: encabezado de marca en cada página, desvíos en flujo continuo, pie con página */
$('pdf').onclick=async()=>{
  if(!items.length){msg('Todavía no cargaste desvíos.');return}
  if(!window.jspdf){msg('No cargó el generador de PDF. Revisá la conexión.');return}
  const nombre=$('nombre').value.trim();try{localStorage.setItem(NKEY,nombre)}catch(e){}
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),W=210,M=20,CW=W-2*M;let y=0;
  const [yy,mm,dd]=$('fecha').value.split('-'),fecha=`${dd}/${mm}/${yy}`;
  // Logo: primero el cargado en Configuración; si no, logo.png del repo (opcional)
  const logo=cfg.logo?{src:cfg.logo.d,w:cfg.logo.w,h:cfg.logo.h}
    :(logoImgEl&&logoImgEl.complete&&logoImgEl.naturalWidth>0)?{src:logoImgEl,w:logoImgEl.naturalWidth,h:logoImgEl.naturalHeight}:null;
  const empresa=(cfg.empresa||'').trim()||BRAND.empresa,depto=(cfg.depto||'').trim()||BRAND.departamento;
  const accentRGB=hex2rgb(BRAND.colorAcento);

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

  drawHeader();
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...accentRGB);
  doc.text(BRAND.etiqueta.split('').join(' '),M,y);doc.setTextColor(0);y+=9;
  doc.setFont('times','bold');doc.setFontSize(22);
  BRAND.tituloInforme.split('\n').forEach(l=>{doc.text(l,M,y);y+=9});
  y+=4;
  doc.setFont('courier','normal');doc.setFontSize(10);
  [`FECHA ${fecha}`,nombre?nombre.toUpperCase():'',depto].filter(Boolean).forEach(l=>{doc.text(l,M,y);y+=5.5});
  y+=4;
  lines(BRAND.objetivo,10.5,'normal');y+=6;

  items.forEach((it,i)=>{
    need(14);
    doc.setFont('courier','bold');doc.setFontSize(12.5);
    doc.text(`DESVÍOS N°${i+1} ${(it.sector||'SIN SECTOR').toUpperCase()}`,M,y);
    doc.setDrawColor(...accentRGB);doc.setLineWidth(.5);doc.line(M,y+2,W-M,y+2);y+=9;
    if(it.pto){lines('Punto de la lista de verificación:',10.5,'italic');lines(`N° ${it.pto.n} · ${it.pto.p}`,10.5,'bold');
      lines(`Criterio de aceptación: ${it.pto.c}`,10.5,'normal');lines(`Requisito ISO 9001:2015: ${it.pto.r}`,10.5,'normal');y+=3}
    if(it.desc){lines('Descripción:',10.5,'italic');lines(it.desc,10.5,'normal');y+=3}
    photoGrid(it.fotos);
    if(it.acc){lines('Acción Correctiva Propuesta:',10.5,'bold');y+=1;bulletList(it.acc);y+=3}
    y+=4;
  });

  const total=doc.internal.getNumberOfPages();
  for(let p=1;p<=total;p++){
    doc.setPage(p);doc.setFont('courier','normal');doc.setFontSize(8);doc.setTextColor(120);
    doc.text(`Estado de planta · ${fecha}${nombre?` | ${nombre}`:''} | Página ${p}`,W/2,290,{align:'center'});
    doc.setTextColor(0);
  }

  const filename=`Reporte_Estado_de_Planta_${$('fecha').value}.pdf`;
  try{const a=document.createElement('a');a.href=URL.createObjectURL(doc.output('blob'));a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);msg('PDF generado.')}
  catch(e){msg('No se pudo guardar el PDF.')}
};
render();

if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=11'));
