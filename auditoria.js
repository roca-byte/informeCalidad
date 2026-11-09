/* Auditoría interna de planta (opcional: se activa en ⚙️ Configuración).
   Acá están los datos y las pantallas propias de la auditoría: datos generales,
   lista de verificación por sector (C / NC / N/A / NV), ejercicio de trazabilidad y
   conclusión. app.js lo usa al guardar desvíos y al armar el PDF.
   Se carga ANTES que app.js pero solo define funciones: Aud.init() se llama desde
   app.js cuando ya existen $, esc, msg, cfg y saveCfg. */
const AKEY='informe_auditoria_v1';
const TIPOS={NC:'No conformidad',OBS:'Observación',OM:'Oportunidad de mejora'};
const EST_TXT={C:'C',NC:'NC',NA:'N/A',NV:'NV'};

const Aud={
  datos:null,
  puntos:{},     // n -> punto, para buscar rápido
  sector:'',     // sector abierto en la lista de verificación

  vacio(){return {hora:'',auditados:'',conclusion:'',matriz:{},
    traza:{usar:false,producto:'',lote:'',atras:'',adelante:'',tiempo:'',resultado:'',obs:''}}},
  activo(){return !!cfg.auditoria},
  guardar(){try{localStorage.setItem(AKEY,JSON.stringify(this.datos))}catch(e){msg('No hay espacio para guardar la auditoría en el celular.')}},
  reiniciar(){this.datos=this.vacio();this.sector='';this.guardar();this.pintarTodo()},

  // Puntos que se marcan por sector (el ejercicio de trazabilidad no: es uno por auditoría)
  puntosMatriz(){return CHECKLIST.flatMap(g=>g.items.filter(it=>!it.ej))},
  hoja(s){const m=this.datos.matriz;return m[s]||(m[s]={est:{},lote:'',notifica:'',motivo:''})},
  sectoresAuditados(){return Object.keys(this.datos.matriz)},
  sectoresConfig(){return (cfg.sectores||'').split('\n').map(s=>s.trim()).filter(Boolean)},

  // Cuenta estados de un sector. % de cumplimiento = C / (C + NC), igual que el Excel REG-XX
  conteo(s){
    const est=(this.datos.matriz[s]||{est:{}}).est,c={C:0,NC:0,NA:0,NV:0,total:0};
    this.puntosMatriz().forEach(p=>{c.total++;if(est[p.n])c[est[p.n]]++});
    c.sin=c.total-c.C-c.NC-c.NA-c.NV;c.pct=c.C+c.NC?Math.round(100*c.C/(c.C+c.NC))+'%':'-';
    return c;
  },

  // N° de hallazgo por tipo y fecha (ej.: NC-261109-01). Sirve para pasarlo al Registro NC.
  // Se calcula, no se guarda: si se reordenan los desvíos antes de emitir, se renumeran.
  ids(lista){
    const f=($('fecha').value||'').replace(/-/g,'').slice(2),cuenta={};
    return lista.map(it=>{if(!it.tipo)return '';cuenta[it.tipo]=(cuenta[it.tipo]||0)+1;
      return `${it.tipo}-${f}-${String(cuenta[it.tipo]).padStart(2,'0')}`});
  },

  // Una NC vinculada a un punto marca ese punto como NC en la hoja del sector
  alGuardarDesvio(it){
    if(it.tipo!=='NC'||!it.pto||it.pto.ej||!it.sector)return;
    this.hoja(it.sector).est[it.pto.n]='NC';this.guardar();
    if(this.sector===it.sector)this.pintarMatriz();this.pintarChips();
  },

  /* ---------- Pantalla ---------- */
  init(){
    try{this.datos=JSON.parse(localStorage.getItem(AKEY)||'null')}catch(e){}
    if(!this.datos)this.datos=this.vacio();
    CHECKLIST.forEach(g=>g.items.forEach(it=>{this.puntos[it.n]=it}));
    $('pto').innerHTML='<option value="">— Sin punto de la lista —</option>'+CHECKLIST.map(g=>
      `<optgroup label="${esc(g.cat)}">${g.items.map(it=>`<option value="${it.n}">${it.n}. ${esc(it.p)}</option>`).join('')}</optgroup>`).join('');
    this.enlazar();this.pintarTodo();
  },

  enlazar(){
    $('auditoria').addEventListener('change',()=>{cfg.auditoria=$('auditoria').checked;saveCfg();this.pintarTodo()});
    ['codigo','revision'].forEach(k=>$(k).addEventListener('input',()=>{cfg[k]=$(k).value.trim();saveCfg()}));
    $('sectoresCfg').addEventListener('input',()=>{cfg.sectores=$('sectoresCfg').value;saveCfg();render()});
    // Datos generales: cada campo se guarda al escribir
    [['audHora','hora'],['audAuditados','auditados'],['audConclusion','conclusion']].forEach(([id,k])=>
      $(id).addEventListener('input',()=>{this.datos[k]=$(id).value;this.guardar()}));
    $('pto').addEventListener('change',()=>this.pintarGuia());
    // Lista de verificación
    // Se actualiza al escribir (no en 'change'): 'change' llega recién al tocar otro lado y,
    // si redibuja la lista en ese momento, el toque sobre C/NC/N/A/NV se pierde.
    $('secAud').addEventListener('input',()=>{const s=$('secAud').value.trim();if(s===this.sector)return;
      this.sector=s;this.pintarMatriz();this.pintarChips()});
    $('secChips').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
      this.sector=b.dataset.s;$('secAud').value=this.sector;this.pintarMatriz()});
    $('matriz').addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;const s=this.sector;
      if(b.dataset.quitar!==undefined){if(confirm(`¿Quitar el sector ${s} de esta auditoría?`)){delete this.datos.matriz[s];this.sector='';$('secAud').value='';this.guardar();this.pintarMatriz();this.pintarChips()}return}
      const est=this.hoja(s).est,n=b.dataset.n,v=b.dataset.e;
      if(est[n]===v)delete est[n];else est[n]=v;   // tocar la marca elegida la borra
      this.guardar();this.pintarMatriz();this.pintarChips();
    });
    $('matriz').addEventListener('input',e=>{const f=e.target.dataset.f;if(!f)return;this.hoja(this.sector)[f]=e.target.value;this.guardar();this.pintarChips()});
    // Trazabilidad
    $('trUsar').addEventListener('change',()=>{this.datos.traza.usar=$('trUsar').checked;this.guardar();this.pintarTraza()});
    document.querySelectorAll('[data-t]').forEach(el=>el.addEventListener('input',()=>{this.datos.traza[el.dataset.t]=el.value;this.guardar()}));
    $('trRes').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=this.datos.traza;
      t.resultado=t.resultado===b.dataset.r?'':b.dataset.r;this.guardar();this.pintarTraza()});
  },

  pintarTodo(){
    const a=this.activo(),d=this.datos;
    $('auditoria').checked=a;
    document.querySelectorAll('.solo-aud').forEach(el=>el.hidden=!a);
    $('codigo').value=cfg.codigo||'';$('revision').value=cfg.revision||'';$('sectoresCfg').value=cfg.sectores||'';
    // La hora se propone al empezar la auditoría; después queda la que se cargó
    if(a&&!d.hora){d.hora=new Date().toTimeString().slice(0,5);this.guardar()}
    $('audHora').value=d.hora;$('audAuditados').value=d.auditados;$('audConclusion').value=d.conclusion;
    $('secAud').value=this.sector;
    this.pintarForm();this.pintarChips();this.pintarMatriz();this.pintarTraza();
  },

  // Bloque de auditoría dentro del formulario de desvío (tipo de hallazgo + punto)
  pintarForm(forzar){
    $('ptoBox').hidden=!(this.activo()||forzar);
    if($('ptoBox').hidden){$('pto').value='';$('tipo').value='NC'}
    this.pintarGuia();
  },
  pintarGuia(){
    const p=this.puntos[$('pto').value];$('ptoGuia').hidden=!p;
    // Orienta la redacción: el hallazgo describe qué se ve que NO cumple el criterio
    if(p)$('ptoGuia').innerHTML=`<b>Criterio de aceptación:</b> ${esc(p.c)}<br><b>Requisito ISO 9001:2015:</b> ${esc(p.r)}`;
    $('desc').placeholder=p?'Qué se ve que no cumple el criterio, dónde y con qué evidencia':'Qué se ve, dónde y qué no se cumple';
    Frases.pintar();   // las frases típicas cambian con el punto elegido
  },

  pintarChips(){
    $('secChips').innerHTML=this.sectoresAuditados().map(s=>{const c=this.conteo(s);
      return `<button class="chip${s===this.sector?' on':''}" data-s="${esc(s)}">${esc(s)} <small>${c.total-c.sin}/${c.total}</small></button>`}).join('');
  },

  pintarMatriz(){
    const s=this.sector;if(!s){$('matriz').innerHTML='';return}
    const h=this.datos.matriz[s]||{est:{},lote:'',notifica:'',motivo:''},c=this.conteo(s);
    const fila=p=>`<div class="pt"><div class="pt-t"><b>${p.n}.</b> ${esc(p.p)}<small>${esc(p.c)}</small></div><div class="pt-b">${
      Object.keys(EST_TXT).map(e=>`<button data-n="${p.n}" data-e="${e}" class="e-${e}${h.est[p.n]===e?' on':''}" aria-pressed="${h.est[p.n]===e}">${EST_TXT[e]}</button>`).join('')}</div></div>`;
    $('matriz').innerHTML=`<p class="resumen">C ${c.C} · NC ${c.NC} · N/A ${c.NA} · NV ${c.NV} · sin completar ${c.sin} · cumplimiento ${c.pct}</p>`+
      CHECKLIST.map(g=>{const ps=g.items.filter(it=>!it.ej);return ps.length?`<h3 class="cat">${esc(g.cat)}</h3>`+ps.map(fila).join(''):''}).join('')+
      `<label>Producto / lote en línea</label><input data-f="lote" value="${esc(h.lote)}">
      <label>Se notifica a (si hay NC)</label><input data-f="notifica" value="${esc(h.notifica)}">
      <label>Motivo de cada N/A y NV</label><textarea data-f="motivo" rows="2">${esc(h.motivo)}</textarea>
      <div class="row"><button class="ghost danger" data-quitar>Quitar sector de la auditoría</button></div>`;
  },

  pintarTraza(){
    const t=this.datos.traza;$('trUsar').checked=t.usar;$('trBox').hidden=!t.usar;
    document.querySelectorAll('[data-t]').forEach(el=>{el.value=t[el.dataset.t]||''});
    $('trRes').querySelectorAll('button').forEach(b=>{const on=b.dataset.r===t.resultado;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  }
};
