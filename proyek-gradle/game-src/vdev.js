
/* ---------- Dev / balancing menu ----------
   Layer 1: per entity (enemy kind, tower type, weapon) and per stat: Min (value at level 1), Max (value at the max level),
            Max level, Curve (exponent: 1 straight, >1 slow start, <1 fast start) or a growth factor per level.
            A blank field means "keep the game's own value / shape".
   Layer 2: global multipliers for enemies, towers and weapons, applied on top of the Layer 1 result (the slider range is adjustable).
   Everything lives in DEV (saved in localStorage 'mr_dev'); devApply() pushes it into the live game tables, so changes act at once.
   Open it with the ` key or F2, or with the DEV button (switch it on by tapping the title of the settings page 5 times). */
const DEVKEY='mr_dev';
const DEV={btn:false,pause:true,g:{enemy:1,tower:1,weapon:1,rmax:10},e:{enemy:{},tower:{},weapon:{}}};
const DEVCATS=['enemy','tower','weapon'];
const numOrNull=v=>{if(v===null||v===undefined||v==='')return null;const n=typeof v==='number'?v:parseFloat(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
function devClean(j){   /* copy a loaded / imported config into DEV, keeping only well-formed numbers */
  if(!j||typeof j!=='object')return false;
  if(j.g)for(const k of['enemy','tower','weapon','rmax']){const v=numOrNull(j.g[k]);if(v!==null&&v>0)DEV.g[k]=v}
  if(j.e)for(const c of DEVCATS){
    const src=j.e[c];if(!src||typeof src!=='object')continue;DEV.e[c]={};
    for(const id in src){
      const s=src[id];if(!s||typeof s!=='object')continue;
      const o={maxLv:numOrNull(s.maxLv),st:{}};
      for(const k in(s.st||{})){const q=s.st[k]||{};o.st[k]={min:numOrNull(q.min),max:numOrNull(q.max),curve:numOrNull(q.curve),mul:numOrNull(q.mul)}}
      DEV.e[c][id]=o;
    }
  }
  if('btn'in j)DEV.btn=!!j.btn;
  if('pause'in j)DEV.pause=j.pause!==false;
  return true;
}
function devSave(){try{localStorage.setItem(DEVKEY,JSON.stringify(DEV))}catch(e){}}
function devLoad(){try{devClean(JSON.parse(localStorage.getItem(DEVKEY)||'null'))}catch(e){}}

/* ----- the original (un-tweaked) values, taken once when the game loads ----- */
const TPRI={g:['dmg','Damage'],f:['dmg','Damage/tick'],mortar:['dmg','Damage'],gatling:['dmg','Damage'],sniper:['dmg','Damage'],rocket:['dmg','Damage'],
  tesla:['dmg','Damage'],laser:['dmg','Damage/detik'],emp:['dmg','Damage'],net:['hold','Tahan (detik)'],decoy:['hp','HP umpan',1],
  magnet:['bonus','Bonus suku cadang/kill',1],repair:['heal','Pulih shield',1],solar:['parts','Suku cadang/fajar',1]};
const WARRS={weld:WEAP.weld.dmg,rail:WEAP.rail.dmg,saw:WEAP.saw.dmg,nade:WEAP.nade.dmg,buddy:WEAP.buddy.dmg,
  katana:PWD.katana.dmg,orbit:PWD.orbit.dmg,shot:PWD.shot.dmg,mini:PWD.mini.dmg,field:PWD.field.dps};
const WNAME=id=>WEAP[id]?WEAP[id].name:UPG[id].name;
const ORIGT={},ORIGW={};
for(const id in TPRI)ORIGT[id]=TY[id][TPRI[id][0]].slice();
for(const id in WARRS)ORIGW[id]=WARRS[id].slice();
const EBASE={s:{hp:2,dmg:1,min:2,n:'Pengintai'},h:{hp:9,dmg:2,min:1,n:'Drone berat'},m:{hp:.3,dmg:.45,min:1,n:'Tungau'},b:{hp:WAVE.bossHp,dmg:WAVE.bossDmg,min:1,n:'Bos'}};

/* ----- entity catalogue: what can be edited for each category ----- */
const DEVC={
  enemy:{label:'Musuh',lv:15,hard:99,ids:()=>['s','h','m','b'],name:id=>EBASE[id].n,gl:'enemy',
    stats:id=>[
      {k:'hp',label:'HP (per malam)',int:1,orig:L=>Math.max(EBASE[id].min,Math.round(EBASE[id].hp*waveInfo(L).hpm))},
      {k:'dmg',label:'Damage (per malam)',orig:L=>EBASE[id].dmg*waveInfo(L).dmm}]},
  tower:{label:'Tower',lv:9,hard:9,ids:()=>TORDER,name:id=>TY[id].name,gl:'tower',
    stats:id=>{
      const p=TPRI[id],r=[{k:'pri',label:p[1],int:p[2],orig:L=>ORIGT[id][L]}];
      if(id!=='decoy')r.push({k:'hp',label:'HP menara',int:1,orig:L=>Math.round(TWHP[L]*(THPM[id]||1))});
      r.push({k:'cost',label:'Harga naik ke level ini (tanpa multiplier global)',int:1,noGl:1,orig:L=>L<=1?Math.max(2,Math.round(TW.cost[0]*(TY[id].cost||1))):TW.up[L-1]});
      return r}},
  weapon:{label:'Senjata',lv:5,hard:5,ids:()=>Object.keys(WARRS),name:WNAME,gl:'weapon',
    stats:id=>[{k:'dmg',label:id==='field'?'Damage/detik':'Damage',orig:L=>ORIGW[id][L]}]}
};
const devEnt=(c,id)=>DEV.e[c][id]||(DEV.e[c][id]={maxLv:null,st:{}});
const devEntOf=(c,id)=>DEV.e[c][id]||null;
function devMaxLv(c,id){const e=devEntOf(c,id),C=DEVC[c];const v=e&&e.maxLv!==null?Math.round(e.maxLv):C.lv;return clamp(v,1,C.hard)}
function devStatDef(c,id,k){return DEVC[c].stats(id).find(s=>s.k===k)}
/* value of one stat at level L: Layer 1 (min / max / max level / curve) and then Layer 2 (global multiplier) */
function devVal(c,id,k,L,noGlobal){
  const def=devStatDef(c,id,k),ml=devMaxLv(c,id),e=devEntOf(c,id),q=e&&e.st[k];
  L=clamp(Math.round(L),1,ml);
  let v;
  if(!q||(q.min===null&&q.max===null&&q.curve===null&&q.mul===null))v=def.orig(L);
  else{
    const a=def.orig(1),b=def.orig(ml),mn=q.min!==null?q.min:a,mx=q.max!==null?q.max:b,t=ml>1?(L-1)/(ml-1):0;
    if(q.mul!==null){v=mn*Math.pow(q.mul,L-1);if(q.max!==null)v=mx>=mn?Math.min(v,mx):Math.max(v,mx)}
    else{
      const s=q.curve!==null?Math.pow(t,Math.max(.05,q.curve)):(b===a?t:(def.orig(L)-a)/(b-a));
      v=mn+(mx-mn)*s;
    }
  }
  if(!noGlobal&&!def.noGl)v*=DEV.g[DEVC[c].gl];
  return def.int?Math.max(def.k==='hp'?1:0,Math.round(v)):Math.round(v*1000)/1000;
}
/* push the config into the live game tables */
function devApply(){
  for(const id in ORIGT){const arr=TY[id][TPRI[id][0]];for(let L=1;L<arr.length;L++)arr[L]=devVal('tower',id,'pri',L)}
  for(const id in WARRS){const arr=WARRS[id];for(let L=1;L<arr.length;L++)arr[L]=devVal('weapon',id,'dmg',L)}
}
/* hooks used by the game code */
const devEnemy=(kind,stat,day)=>devVal('enemy',EBASE[kind]?kind:'s',stat,day);
const devTwHp=(ty,L)=>devVal('tower',ty,'hp',L);
const twMax=ty=>devMaxLv('tower',ty);
const devCostRatio=(ty,L)=>{const e=devEntOf('tower',ty);if(!e||!e.st.cost)return 1;const d=devStatDef('tower',ty,'cost');return devVal('tower',ty,'cost',L)/Math.max(1,d.orig(Math.min(L,devMaxLv('tower',ty))))};
const twBuildCost=(ty,base)=>Math.max(2,Math.round(base*devCostRatio(ty,1)));
const twUpCost=(ty,lv)=>Math.max(1,Math.round(TW.up[lv]*devCostRatio(ty,lv+1)));
function upCap(k,chId){   /* max level of a workshop slot; weapon slots follow the Dev menu */
  if(k==='main')return devMaxLv('weapon',CHAR(chId).weap);
  if(WARRS[k])return devMaxLv('weapon',k);
  return UMAX;
}

/* ----- UI ----- */
const devEl=$('dev'),devBtn=$('devBtn');
let devTab='g',devSel={enemy:'s',tower:'g',weapon:'weld'},devHeld=false,devSure=false;
const devFmt=v=>{if(v===null||v===undefined)return'';const a=Math.abs(v);return String(a>=100?Math.round(v):a>=10?Math.round(v*10)/10:Math.round(v*1000)/1000)};
const devEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function devPreview(c,id,k){
  const ml=devMaxLv(c,id),def=devStatDef(c,id,k),pts=[...new Set([1,Math.max(1,Math.round(ml/2)),ml])];
  return pts.map(L=>'Lv'+L+' <b>'+devFmt(devVal(c,id,k,L))+'</b>').join(' · ');
}
function devGlobalHtml(){
  const G=DEV.g,rows=[['enemy','Musuh (HP + damage)'],['tower','Tower (damage + HP)'],['weapon','Senjata (damage)']];
  let h='<div class="dsec">Multiplier global (dikali setelah Layer 1)</div>';
  for(const[k,l]of rows)h+='<div class="dr"><span>'+l+'</span><input type="range" data-g="'+k+'" min="0.1" max="'+Math.max(G.rmax,G[k])+'" step="0.05" value="'+G[k]+'"><input class="dn" inputmode="decimal" data-g="'+k+'" value="'+G[k]+'"></div>';
  h+='<div class="dr"><span>Batas maks slider</span><span></span><input class="dn" inputmode="decimal" data-g="rmax" value="'+G.rmax+'"></div>';
  h+='<div class="dsec">Simpan / pindahkan konfigurasi</div><textarea id="devJson" rows="6" spellcheck="false"></textarea>';
  h+='<div class="dbt"><button data-a="exp">Ekspor</button><button data-a="imp">Impor</button><button data-a="reset" class="'+(devSure?'warn':'')+'">'+(devSure?'Yakin reset?':'Reset semua')+'</button></div>';
  h+='<div class="dbt"><button data-a="btn" class="'+(DEV.btn?'on':'')+'">Tombol DEV: '+(DEV.btn?'ON':'OFF')+'</button></div>';
  return h;
}
function devEntHtml(c){
  const C=DEVC[c],ids=C.ids(),id=ids.includes(devSel[c])?devSel[c]:ids[0];devSel[c]=id;
  const e=devEntOf(c,id),ml=devMaxLv(c,id);
  let h='<div class="dr"><span>'+C.label+'</span><select data-sel="'+c+'">'+ids.map(i=>'<option value="'+i+'"'+(i===id?' selected':'')+'>'+devEsc(C.name(i))+'</option>').join('')+'</select></div>';
  h+='<div class="dr"><span>Level maksimal (1-'+C.hard+')</span><span></span><input class="dn" inputmode="numeric" data-c="'+c+'" data-i="'+id+'" data-f="maxLv" placeholder="'+C.lv+'" value="'+(e&&e.maxLv!==null?e.maxLv:'')+'"></div>';
  for(const s of C.stats(id)){
    const q=(e&&e.st[s.k])||{};
    const inp=(f,ph)=>'<label>'+({min:'Min (Lv 1)',max:'Max (Lv maks)',curve:'Kurva',mul:'Faktor/level'})[f]+'<input inputmode="decimal" data-c="'+c+'" data-i="'+id+'" data-s="'+s.k+'" data-f="'+f+'" placeholder="'+ph+'" value="'+(q[f]!==undefined&&q[f]!==null?q[f]:'')+'"></label>';
    h+='<div class="dsec">'+devEsc(s.label)+'</div><div class="dgrid">'+inp('min',devFmt(s.orig(1)))+inp('max',devFmt(s.orig(ml)))+inp('curve','asli')+inp('mul','-')+'</div>';
    h+='<div class="dpv" data-pv="'+c+'|'+id+'|'+s.k+'">'+devPreview(c,id,s.k)+'</div>';
  }
  h+='<div class="dbt"><button data-a="rent">Reset '+devEsc(C.name(id))+'</button></div>';
  return h;
}
function devRender(){
  const T=[['g','Global'],['enemy','Musuh'],['tower','Tower'],['weapon','Senjata']];
  devEl.innerHTML='<div class="dh2"><b>DEV</b><button data-a="pause" class="'+(DEV.pause?'on':'')+'">Jeda '+(DEV.pause?'ON':'OFF')+'</button><button data-a="close">Tutup</button></div>'
    +'<div class="dtabs">'+T.map(t=>'<button data-t="'+t[0]+'" class="'+(t[0]===devTab?'on':'')+'">'+t[1]+'</button>').join('')+'</div>'
    +'<div class="dbody">'+(devTab==='g'?devGlobalHtml():devEntHtml(devTab))+'</div>';
}
function devRefreshPv(){devEl.querySelectorAll('[data-pv]').forEach(e=>{const[c,i,k]=e.dataset.pv.split('|');e.innerHTML=devPreview(c,i,k)})}
function devOpen(){
  devRender();devEl.hidden=false;
  if(DEV.pause&&running&&!paused&&!S.over&&!demo){paused=true;devHeld=true}
}
function devClose(){devEl.hidden=true;if(devHeld){devHeld=false;paused=false}}
function devToggle(){if(devEl.hidden)devOpen();else devClose()}
function devSyncBtn(){devBtn.hidden=!DEV.btn}
devEl.addEventListener('pointerdown',e=>e.stopPropagation());
devEl.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Backquote'||e.code==='F2'){e.preventDefault();devClose()}});
devEl.addEventListener('keyup',e=>e.stopPropagation());
devEl.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.t){devTab=b.dataset.t;devSure=false;devRender();return}
  const a=b.dataset.a;if(!a)return;
  if(a==='close')devClose();
  else if(a==='pause'){DEV.pause=!DEV.pause;devSave();devRender();if(!DEV.pause&&devHeld){devHeld=false;paused=false}else if(DEV.pause&&running&&!paused&&!S.over&&!demo){paused=true;devHeld=true}}
  else if(a==='btn'){DEV.btn=!DEV.btn;devSave();devSyncBtn();devRender()}
  else if(a==='exp'){const t=$('devJson');t.value=JSON.stringify({g:DEV.g,e:DEV.e});t.select();try{navigator.clipboard.writeText(t.value).catch(()=>{})}catch(_){}}
  else if(a==='imp'){try{const j=JSON.parse($('devJson').value);DEV.e={enemy:{},tower:{},weapon:{}};if(devClean(j)){devApply();devSave();devRender();$('devJson').value=''}}catch(_){$('devJson').value='JSON tidak valid'}}
  else if(a==='reset'){if(!devSure){devSure=true;devRender();return}devSure=false;DEV.g={enemy:1,tower:1,weapon:1,rmax:10};DEV.e={enemy:{},tower:{},weapon:{}};devApply();devSave();devRender()}
  else if(a==='rent'){delete DEV.e[devTab][devSel[devTab]];devApply();devSave();devRender()}
});
devEl.addEventListener('change',e=>{const s=e.target.closest('select');if(s&&s.dataset.sel){devSel[s.dataset.sel]=s.value;devRender()}});
devEl.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.g){   /* Layer 2 */
    const k=t.dataset.g,v=numOrNull(t.value);if(v===null||v<=0)return;
    DEV.g[k]=v;
    if(k==='rmax'){devEl.querySelectorAll('input[type=range]').forEach(r=>{r.max=Math.max(v,DEV.g[r.dataset.g])})}
    else{devEl.querySelectorAll('[data-g="'+k+'"]').forEach(o=>{if(o!==t){if(o.type==='range')o.max=Math.max(DEV.g.rmax,v);o.value=v}})}
    devApply();devSave();return;
  }
  if(t.dataset.c){   /* Layer 1 */
    const c=t.dataset.c,id=t.dataset.i,e2=devEnt(c,id),v=numOrNull(t.value);
    if(t.dataset.f==='maxLv'){e2.maxLv=v===null?null:clamp(Math.round(v),1,DEVC[c].hard)}
    else{const q=e2.st[t.dataset.s]||(e2.st[t.dataset.s]={min:null,max:null,curve:null,mul:null});q[t.dataset.f]=v}
    devApply();devSave();devRefreshPv();
  }
});
devBtn.addEventListener('click',()=>{btnFx();devToggle()});
addEventListener('keydown',e=>{if(e.code==='Backquote'||e.code==='F2'){const t=e.target;if(t&&t.tagName==='INPUT'&&!devEl.contains(t))return;e.preventDefault();devToggle()}});
/* tap the title of the settings page 5 times to switch the DEV button on or off */
{let n=0,t0=0;$('sett').querySelector('.stitle').addEventListener('click',()=>{const now=performance.now();n=now-t0>3000?1:n+1;t0=now;if(n>=5){n=0;DEV.btn=!DEV.btn;devSave();devSyncBtn();sfx('power')}})}
devLoad();devApply();devSyncBtn();
