/* Frases rápidas para redactar sin escribir todo (reemplazan a la IA, que se quitó).
   Debajo de "Descripción" y de "Acción correctiva" aparecen botones con:
   - las frases típicas del punto de la lista elegido (f / a en checklist.js), y
   - las frases propias que el usuario guardó con "⭐ Guardar como frase".
   Tocar un botón AGREGA el texto al campo (no lo reemplaza) y deja el cursor al final
   para completar con el dato concreto. Se carga antes que app.js y solo define funciones. */
const FKEY='informe_frases';

const Frases={
  propias:null,                 // {desc:[...], acc:[...]}
  admin:{desc:false,acc:false}, // modo "quitar frases" de cada campo
  MAX:40,                       // tope por campo: más botones que esto ya no ayudan

  cargar(){
    if(this.propias)return;
    try{this.propias=JSON.parse(localStorage.getItem(FKEY)||'null')}catch(e){}
    if(!this.propias)this.propias={desc:[],acc:[]};
  },
  guardar(){try{localStorage.setItem(FKEY,JSON.stringify(this.propias))}catch(e){msg('No hay espacio para guardar la frase.')}},

  init(){
    this.cargar();
    ['desc','acc'].forEach(k=>{
      $('fr-'+k).addEventListener('click',e=>{const b=e.target.closest('button');if(b)this.tocar(k,b)});
      $('frGuardar-'+k).onclick=()=>this.agregarPropia(k);
      $('frAdmin-'+k).onclick=()=>{this.admin[k]=!this.admin[k];this.pintar()};
    });
    this.pintar();
  },

  // Guarda lo escrito en el campo. En la acción, cada línea es una acción: se guarda cada una aparte
  agregarPropia(k){
    const t=$(k).value.trim();if(!t){msg('Escribí la frase en el campo y después guardala.');return}
    const nuevas=(k==='acc'?t.split('\n'):[t]).map(s=>s.trim()).filter(s=>s&&!this.propias[k].includes(s));
    if(!nuevas.length){msg('Esa frase ya estaba guardada.');return}
    this.propias[k]=nuevas.concat(this.propias[k]).slice(0,this.MAX);
    this.guardar();this.pintar();msg(nuevas.length>1?`${nuevas.length} frases guardadas.`:'Frase guardada.');
  },

  tocar(k,b){
    const i=+b.dataset.i,propia=b.dataset.o==='p';
    const lista=propia?this.propias[k]:(this.puntoActual()||{})[k==='desc'?'f':'a']||[];
    const t=lista[i];if(t===undefined)return;
    if(propia&&this.admin[k]){
      if(confirm(`¿Quitar la frase "${t}"?`)){this.propias[k].splice(i,1);this.guardar();this.pintar()}
      return;
    }
    this.insertar(k,t);
  },

  // Agrega al final: en la descripción, seguido; en la acción, en una línea nueva (una acción por línea)
  insertar(k,t){
    const ta=$(k),v=ta.value.replace(/\s+$/,'');
    ta.value=v?v+(k==='acc'?'\n':' ')+t:t;
    ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
  },

  puntoActual(){return Aud.puntos[$('pto').value]},

  pintar(){
    this.cargar();
    const p=this.puntoActual();
    ['desc','acc'].forEach(k=>{
      const delPunto=p?(p[k==='desc'?'f':'a']||[]):[],propias=this.propias[k],adm=this.admin[k];
      const boton=(t,i,o)=>`<button type="button" class="frase${o==='t'?' tipica':''}${adm&&o==='p'?' borrar':''}" data-i="${i}" data-o="${o}">${adm&&o==='p'?'✕ ':''}${esc(t)}</button>`;
      $('fr-'+k).innerHTML=
        (delPunto.length&&!adm?`<p class="fr-tit">Típicas del punto ${p.n}</p>`+delPunto.map((t,i)=>boton(t,i,'t')).join(''):'')+
        (propias.length?`<p class="fr-tit">${adm?'Tocá una frase para quitarla':'Tus frases'}</p>`+propias.map((t,i)=>boton(t,i,'p')).join(''):'');
      $('frAdmin-'+k).hidden=!propias.length;
      $('frAdmin-'+k).textContent=adm?'Listo':'Quitar frases';
      if(!propias.length)this.admin[k]=false;
    });
  }
};
