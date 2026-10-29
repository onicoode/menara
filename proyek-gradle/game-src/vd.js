
/* ---------- HUD (icons only), overlays ---------- */
const el={resS:$('resS'),res:$('res'),resIc:$('resIc'),mhp:$('mhp'),bat:$('bat'),batB:$('batB'),coins:$('coins'),chC:$('chC'),chCore:$('chCore'),chMh:$('chMh'),
  day:$('day'),phase:$('phase'),hp:$('hp'),mark:$('mark'),toast:$('toast'),ov:$('ov'),ovT:$('ovT'),ovP:$('ovP'),ovB:$('ovB'),ovBi:$('ovBi'),sndIc:$('sndIc'),dock:$('dock')};
const cache={};
function set(key,v,fn){const o=cache[key];if(o!==v){cache[key]=v;fn(v,o)}}
function paint(e,name){e.textContent='';e.appendChild(mkIcon(name))}
function icon(name,cls){const e=document.createElement('span');e.className='ic'+(cls?' '+cls:'');e.appendChild(mkIcon(name));return e}
function flash(e,cls){e.classList.remove('bump','drop','hit');void e.offsetWidth;e.classList.add(cls)}
function hud(){
  const s=S;
  {const rc=s.res.cur;set('rs',rc?Math.round(rc.t/RES[rc.key].time*100):-1,v=>{el.resS.hidden=v<0;if(v>=0)el.res.style.width=v+'%'});set('rk',rc?rc.key:'',v=>{if(v)paint(el.resIc,v)})}
  set('air',!s.m.st,v=>el.dock.classList.toggle('air',v));
  set('lu',canLure(),v=>{$('bLure').disabled=!v});
  set('bl',canBlast(),v=>{$('bBlast').disabled=!v});
  set('bc',Math.round(BLAST.cost*100),v=>{$('bBlast').querySelector('.cnt').textContent=v+'%'});
  set('ln',LUREMAX-(s.lures||0),v=>{$('lureN').textContent=v});
  set('c',s.coins,(v,o)=>{el.coins.textContent=v;if(o!==undefined&&running)flash(el.chC,v>o?'bump':'drop')});
  set('mh',Math.round(s.m.hp*10),(v,o)=>{el.mhp.style.width=(v/(MECH.hp*10)*100)+'%';if(o!==undefined&&v<o-4)flash(el.chMh,'hit')});
  set('bt',Math.round(s.m.bat*10),v=>{el.bat.style.width=(v/(MECH.bat*10)*100)+'%';el.batB.classList.toggle('low',v<25)});
  set('d',(s.run&&s.run.len?Math.min(s.day,s.run.len):s.day)+'/'+((s.run&&s.run.len)||'-'),v=>el.day.textContent=v);
  set('p',s.t>=DAY,v=>paint(el.phase,v?'moon':'sun'));
  set('h',Math.round(s.hp*10)/10,(v,o)=>{el.hp.style.width=(Math.max(0,v)/s.maxHp*100)+'%';if(o!==undefined&&v<o)flash(el.chCore,'hit')});
  set('m',Math.round(s.t/CYC*1000)/10,v=>el.mark.style.left='calc('+v+'% - 2px)');
}

/* ---------- layout: portrait, fills the phone screen ---------- */
let touch=false;
const view=$('view');
function layout(){
  touch=matchMedia('(pointer:coarse)').matches;
  document.documentElement.classList.toggle('play',touch);
  const iw=innerWidth,ih=innerHeight,st=$('stage');
  const availW=touch?iw:Math.min(iw-32,460),availH=touch?ih:Math.max(380,ih-120);
  setSize(VW*availH/availW);
  const cw=Math.min(availW,availH*VW/VH),ch=cw*VH/VW;
  /* the card dock covers the strip under the ground line (minus a little road) */
  view.style.setProperty('--dock',Math.round((BOT-12)*cw/VW)+'px');
  view.style.width=Math.floor(cw)+'px';view.style.height=Math.floor(ch)+'px';
  if(touch){st.style.width=iw+'px';st.style.height=ih+'px'}else{st.style.width='';st.style.height=''}
}
addEventListener('resize',layout);
addEventListener('orientationchange',layout);

addEventListener('pointerdown',()=>{if(!AU.bg&&AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume()},{passive:true});
document.addEventListener('visibilitychange',()=>{audioBg(document.hidden);if(document.hidden)pause()});
addEventListener('pagehide',()=>audioBg(true));

/* ---------- input ----------
   Ground: swipe left/right and hold to walk.
   Swipe up and hold to light the jetpack thruster. While the finger stays down the thruster burns and the
   finger works like a joystick (slide any direction to steer). Lifting the finger shuts the thruster off. */
const KM={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'thr',KeyW:'thr',Space:'thr',ArrowDown:'dn',KeyS:'dn',Digit1:'o0',Digit2:'o1',Digit3:'o2',Digit4:'o3',KeyE:'blast'};
addEventListener('keydown',e=>{
  const k=KM[e.code];if(!k)return;
  if(running&&!paused&&!S.over)e.preventDefault();
  if(k[0]==='o'){if(!e.repeat)beginHold(ctxOptions()[+k[1]],'kb');return}
  if(k==='blast'){if(!e.repeat)blast();return}
  if(k==='thr'&&!keys.thr&&!canFly())return;
  keys[k]=1;
});
addEventListener('keyup',e=>{
  const k=KM[e.code];if(!k)return;
  if(k[0]==='o'){if(cardHold&&cardHold.pid==='kb')cardHold=null;return}
  keys[k]=0;
});
addEventListener('blur',()=>{keys.l=keys.r=keys.thr=keys.dn=0;ptrs.clear();syncG();cardHold=null});

const ptrs=new Map(),JR=52;
function syncG(){
  g.l=g.r=0;jetIn.on=false;jetIn.x=jetIn.y=0;
  for(const p of ptrs.values()){
    if(p.m==='L')g.l=1;else if(p.m==='R')g.r=1;
    else if(p.m==='J'){jetIn.on=true;jetIn.x=p.jx;jetIn.y=p.jy}
  }
}
view.addEventListener('pointerdown',e=>{
  if(e.target.closest('button')||uiBlocking())return;
  e.preventDefault();
  ptrs.set(e.pointerId,{ox:e.clientX,oy:e.clientY,m:0,ref:0,by:e.clientY,jx:0,jy:0,noFly:false});
  try{view.setPointerCapture(e.pointerId)}catch(_){}
});
view.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;
  if(p.m==='J'){
    const dx=e.clientX-p.ox,dy=e.clientY-p.oy,dz=6;
    p.jx=Math.abs(dx)<dz?0:clamp(dx/JR,-1,1);p.jy=Math.abs(dy)<dz?0:clamp(dy/JR,-1,1);
    syncG();return;
  }
  p.by=Math.max(p.by,e.clientY);
  if(p.by-e.clientY>26&&!p.noFly){
    if(canFly()){p.m='J';p.ox=e.clientX;p.oy=e.clientY+26;p.jx=0;p.jy=-26/JR;syncG();return}
    p.noFly=true;
  }
  const dx=e.clientX-p.ox,T=14;
  if(p.m===0){if(Math.abs(dx)>T){p.m=dx>0?'R':'L';p.ref=dx}}
  else if(p.m==='R'){p.ref=Math.max(p.ref,dx);if(dx<p.ref-T){p.m='L';p.ref=dx}}
  else if(p.m==='L'){p.ref=Math.min(p.ref,dx);if(dx>p.ref+T){p.m='R';p.ref=dx}}
  syncG();
});
const endP=e=>{ptrs.delete(e.pointerId);syncG()};
view.addEventListener('pointerup',endP);
view.addEventListener('pointercancel',endP);
view.addEventListener('lostpointercapture',endP);
view.addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- build menu (top-left cards) ---------- */
const optsEl=$('opts');
function mkIcon(name){
  const c=document.createElement('canvas');c.width=16;c.height=16;
  const g2=c.getContext('2d'),P=(x,y,w,h,col)=>{g2.fillStyle=col;g2.fillRect(x,y,w,h)};
  /* draw a small grid: each row is a string, each char a palette key ('.' = empty), scaled by k */
  const G=(rows,pal,k,ox,oy)=>rows.forEach((r,y)=>{for(let x=0;x<r.length;x++){const c=pal[r[x]];if(c)P(ox+x*k,oy+y*k,k,k,c)}});
  const gear=(c1,c2,hole)=>{P(3,3,10,10,c1);P(6,0,4,3,c2);P(6,13,4,3,c2);P(0,6,3,4,c2);P(13,6,3,4,c2);P(1,1,3,3,c2);P(12,1,3,3,c2);P(1,12,3,3,c2);P(12,12,3,3,c2);P(6,6,4,4,hole);P(4,4,3,1,'#ffffff')};
  const tower=(ox)=>{P(ox+1,13,12,2,'#7a6a4a');P(ox+3,6,8,7,'#77736d');P(ox+3,6,8,1,'#a8a49c');P(ox+3,9,8,1,'#4a4742');P(ox+5,4,4,2,'#4d525c');P(ox+8,3,5,2,'#2d3038')};
  const W2='#e6ecff';
  if(name==='sell'){gear('#b9c8d8','#8fa3b8','#151a2c');P(9,9,7,7,'#14301c');P(12,10,1,5,'#7dff9a');P(10,12,5,1,'#7dff9a');P(11,9,3,1,'#7dff9a');P(11,15,3,1,'#7dff9a');return c}
  if(name==='menu'){P(2,3,12,2,W2);P(2,7,12,2,W2);P(2,11,12,2,W2);return c}
  if(name==='flag'){P(3,1,2,14,'#9aa1ad');P(5,2,9,6,W2);P(5,7,7,1,'#c9d2e6');P(12,3,2,4,'#c9d2e6');return c}
  if(name==='user'){P(5,1,6,6,'#f2c14e');P(4,3,8,3,'#f2c14e');P(6,4,4,3,'#d9a77a');P(3,9,10,6,'#e0782a');P(5,8,6,2,'#e0782a');return c}
  if(name==='trash'){P(3,4,10,1,'#ff8a7a');P(6,2,4,2,'#ff8a7a');P(4,5,8,10,'#c84a3a');P(6,7,1,6,'#ff8a7a');P(9,7,1,6,'#ff8a7a');return c}
  if(name==='plus'){P(7,2,2,12,'#7dff9a');P(2,7,12,2,'#7dff9a');return c}
  if(name==='check'){for(let i=0;i<4;i++)P(2+i,8+i,2,2,'#7dff9a');for(let i=0;i<7;i++)P(6+i,10-i,2,2,'#7dff9a');return c}
  if(name==='music'){P(5,2,8,2,'#c58aff');P(5,2,2,10,'#c58aff');P(11,2,2,8,'#c58aff');P(2,10,5,4,'#c58aff');P(8,8,5,4,'#c58aff');return c}
  if(name==='shake'){P(5,3,6,10,'#9aa1ad');P(6,4,4,7,'#1d2230');P(2,5,1,6,'#ffd36b');P(13,5,1,6,'#ffd36b');P(0,6,1,4,'#ffb347');P(15,6,1,4,'#ffb347');return c}
  if(name==='settings'){gear('#c9d2e6','#9aa1ad','#1b2140');return c}
  if(name==='door'){P(3,1,10,14,'#6a4a3a');P(4,2,8,13,'#8a5a40');P(9,8,2,2,'#ffd36b');P(1,14,14,2,'#4a4f58');return c}
  if(name==='back'){for(let x=0;x<7;x++){const hh=12-Math.round(x*1.6);P(3+x,Math.round(8-hh/2),1,hh,'#e6ecff')}P(8,7,6,2,'#e6ecff');return c}
  if(name==='up'){for(let i=0;i<6;i++)P(7-i,2+i,2+i*2,1,'#2a1a05');P(6,8,4,6,'#2a1a05');return c}
  if(name==='w_rail'){P(1,7,13,3,'#5a6070');P(1,6,6,1,'#8e99a8');P(4,4,3,2,'#2d3038');P(13,7,3,3,'#8ff0ff');P(14,8,2,1,'#ffffff');P(3,10,2,3,'#3a3f4a');return c}
  if(name==='w_saw'){P(4,2,8,12,'#b9c2cc');P(2,4,12,8,'#b9c2cc');P(6,6,4,4,'#59606c');P(3,1,2,2,W2);P(13,4,2,2,W2);P(11,13,2,2,W2);P(1,11,2,2,W2);P(7,7,2,2,'#ffd36b');return c}
  if(name==='w_nade'){P(5,4,7,9,'#4a5a3a');P(5,4,7,1,'#6a7a52');P(7,1,3,3,'#9aa1ad');P(10,1,3,1,'#9aa1ad');P(6,7,5,2,'#2a2e22');P(8,10,2,2,'#9dffb0');return c}
  if(name==='w_buddy'){P(4,6,8,4,'#5a3a8a');P(5,5,6,1,'#8a6ac8');P(1,3,5,1,'#c9d6e6');P(10,3,5,1,'#c9d6e6');P(3,4,1,2,'#9aa1ad');P(12,4,1,2,'#9aa1ad');P(7,8,2,1,'#c58aff');P(7,11,2,2,'#e0b8ff');return c}
  if(name==='coin'){P(4,1,8,14,'#e0a630');P(2,3,12,10,'#e0a630');P(1,5,14,6,'#e0a630');P(4,2,8,12,'#ffc75a');P(3,4,10,8,'#ffc75a');P(2,6,12,4,'#ffc75a');P(6,4,4,8,'#e0a630');P(7,5,2,6,'#ffe8a8');P(4,3,2,1,'#fff6d8');return c}
  if(name==='home'){P(7,1,2,1,'#e6ecff');P(5,2,6,1,'#e6ecff');P(3,3,10,1,'#e6ecff');P(1,4,14,2,'#e6ecff');P(3,6,10,8,'#e6ecff');P(7,9,3,5,'#3c4670');return c}
  if(name==='next'){for(let x=0;x<9;x++){const hh=12-Math.round(x*1.3);P(4+x,Math.round(8-hh/2),1,hh,'#2a1a05')}return c}
  if(name==='mortar'){P(2,12,12,3,'#6a6a4a');P(2,12,12,1,'#8a8a6a');for(let i=0;i<6;i++)P(4+i,9-i,3,3,'#3a3f2a');P(10,2,3,2,'#ffb347')}
  else if(name==='tesla'){P(6,6,4,9,'#8a6a3a');P(5,7,6,1,'#c9a22a');P(5,10,6,1,'#c9a22a');P(5,13,6,1,'#c9a22a');P(5,1,6,5,'#b9c2cc');P(6,2,2,2,'#ffffff');P(12,2,2,1,'#c9a8ff');P(13,3,2,1,'#c9a8ff');P(1,4,2,1,'#c9a8ff');P(0,5,2,1,'#c9a8ff')}
  else if(name==='rocket'){P(7,2,3,9,'#d0d6e2');P(7,1,3,1,'#ff5a4a');P(8,0,1,1,'#ff5a4a');P(5,8,2,4,'#ff5a4a');P(10,8,2,4,'#ff5a4a');P(7,11,3,2,'#ffb347');P(8,13,1,2,'#ffd36b');P(8,4,1,2,'#5a8ad8')}
  else if(name==='laser'){P(1,9,6,5,'#4d525c');P(1,9,6,1,'#7d838e');P(7,10,9,2,'#ff4a6a');P(7,10,9,1,'#ffc0d0');P(2,6,3,3,'#ff6a8a')}
  else if(name==='emp'){P(4,13,8,2,'#9aa1ad');P(7,7,2,6,'#7d838e');P(6,3,4,4,'#9ad8ff');P(7,4,1,1,'#ffffff');P(3,2,1,6,'#9ad8ff');P(12,2,1,6,'#9ad8ff');P(1,1,1,8,'#5a9ad8');P(14,1,1,8,'#5a9ad8')}
  else if(name==='net'){for(let i=0;i<4;i++){P(2+i*4,2,1,13,'#d8e0a0');P(2,2+i*4,13,1,'#d8e0a0')}P(1,1,2,2,'#7a808c');P(13,1,2,2,'#7a808c');P(1,13,2,2,'#7a808c');P(13,13,2,2,'#7a808c')}
  else if(name==='decoy'){P(7,5,2,9,'#9aa1ad');P(5,1,6,4,'#ffb347');P(6,2,4,2,'#ffe08a');P(1,2,3,1,'#ffd36b');P(12,2,3,1,'#ffd36b');P(2,0,2,1,'#ffd36b');P(12,0,2,1,'#ffd36b');P(4,14,8,2,'#6a707c')}
  else if(name==='magnet'){P(2,3,4,8,'#d84a4a');P(10,3,4,8,'#d84a4a');P(2,10,12,4,'#d84a4a');P(2,10,12,1,'#ff8a8a');P(2,1,4,2,'#d0d6e2');P(10,1,4,2,'#d0d6e2');P(7,3,2,2,'#a9bccf');P(7,7,2,1,'#a9bccf')}
  else if(name==='repair'){P(6,2,4,12,'#7dff9a');P(2,6,12,4,'#7dff9a');P(7,3,1,3,'#d0ffd8');P(3,7,3,1,'#d0ffd8')}
  else if(name==='solar'){P(1,5,14,7,'#1d3a6a');P(1,5,14,1,'#9ad8ff');P(1,8,14,1,'#5a8ad8');P(5,5,1,7,'#5a8ad8');P(10,5,1,7,'#5a8ad8');P(7,12,2,3,'#9aa1ad');P(12,0,3,3,'#ffd36b')}
  else if(name==='wp_orbit'){P(7,7,2,2,'#e6ecff');P(7,1,2,3,'#8ff0ff');P(12,9,3,2,'#8ff0ff');P(1,10,3,2,'#8ff0ff');P(3,3,1,1,'#5a8ad8');P(12,3,1,1,'#5a8ad8');P(7,14,1,1,'#5a8ad8')}
  else if(name==='wp_shot'){P(1,8,8,3,'#8e99a8');P(1,8,8,1,'#b9c2cc');P(4,11,3,3,'#6b4a3a');P(11,5,1,1,'#ffe08a');P(13,7,1,1,'#ffe08a');P(12,9,1,1,'#ffe08a');P(14,10,1,1,'#ffe08a');P(11,12,1,1,'#ffe08a');P(9,8,2,2,'#ffd36b')}
  else if(name==='wp_mini'){P(3,7,2,6,'#d0d6e2');P(3,6,2,1,'#ff5a4a');P(9,3,2,6,'#d0d6e2');P(9,2,2,1,'#ff5a4a');P(3,13,2,2,'#ffb347');P(9,9,2,2,'#ffb347');P(12,1,2,1,'#ffd36b')}
  else if(name==='wp_field'){for(let i=0;i<10;i++){const a=i/10*6.283;P(Math.round(7.5+Math.cos(a)*6.5),Math.round(7.5+Math.sin(a)*6.5),1,1,'#9ad8ff')}P(8,3,2,3,'#e6fbff');P(6,6,4,2,'#e6fbff');P(6,8,2,3,'#e6fbff')}
  else if(name==='blast'){for(let i=0;i<8;i++){const a=i/8*6.283;P(Math.round(7.5+Math.cos(a)*6),Math.round(7.5+Math.sin(a)*6),2,2,'#8ff0ff')}P(5,5,6,6,'#e6fbff');P(6,4,4,8,'#e6fbff');P(4,6,8,4,'#e6fbff');P(7,7,2,2,'#5ad1e6')}
  else if(name==='gear')gear('#b9c8d8','#8fa3b8','#151a2c');
  else if(name==='cog')gear('#e6ecff','#c9d2e6','#232a44');
  else if(name==='drone'){P(0,4,6,1,'#c9d6e6');P(10,4,6,1,'#c9d6e6');P(2,5,2,2,'#6a7388');P(12,5,2,2,'#6a7388');P(4,6,8,1,'#6a7388');P(4,7,8,4,'#4a5266');P(6,8,4,2,'#ff4a3a');P(7,8,1,1,'#ffd0c8');P(5,11,1,2,'#6a7388');P(10,11,1,2,'#6a7388')}
  else if(name==='sun'){P(7,0,2,3,'#ffb347');P(7,13,2,3,'#ffb347');P(0,7,3,2,'#ffb347');P(13,7,3,2,'#ffb347');P(2,2,2,2,'#ffb347');P(12,2,2,2,'#ffb347');P(2,12,2,2,'#ffb347');P(12,12,2,2,'#ffb347');P(5,4,6,8,'#ffd36b');P(4,5,8,6,'#ffd36b');P(6,5,2,2,'#fff3c4')}
  else if(name==='moon'){G(['....XXXX....','..XXXX......','.XXX........','XXX.........','XXX.........','XXX.........','XXXX........','.XXXX.....X.','..XXXXXXXX..','....XXXX....'],{X:'#e6ecff'},1,3,3);P(12,2,1,1,'#ffffff');P(13,6,1,1,'#cfe3ff')}
  else if(name==='heart')G(['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'],{X:'#ff5a6a'},2,1,2),P(3,4,2,2,'#ffc0c8');
  else if(name==='wp_katana'){for(let i=0;i<10;i++){P(5+i,11-i,2,2,'#e6ecff');P(6+i,12-i,1,1,'#8ff0ff')}P(14,1,1,1,'#ffffff');P(3,10,4,2,'#c9a22a');P(2,12,3,2,'#6a3a1a');P(1,14,2,2,'#4a2a12')}
  else if(name==='jetfall'){P(5,1,6,7,'#cfd6e2');P(6,2,4,5,'#59606c');P(7,3,2,2,'#9ad8ff');P(4,6,1,3,'#8e99a8');P(11,6,1,3,'#8e99a8');P(6,9,4,2,'#ffd36b');P(7,11,2,3,'#ff9a3a');P(7,14,2,1,'#ff5a1a');P(2,12,2,1,'#9ad8ff');P(12,12,2,1,'#9ad8ff')}
  else if(name==='battery'){P(1,4,12,8,'#cfd6e2');P(2,5,10,6,'#1b2033');P(13,6,2,4,'#cfd6e2');G(['..XX','.XX.','XXXX','.XX.','XX..'],{X:'#ffd36b'},1,5,5)}
  else if(name==='sound'){P(2,6,3,4,'#e6ecff');P(5,4,2,8,'#e6ecff');P(7,2,2,12,'#e6ecff');P(10,6,1,4,'#8ff0ff');P(12,4,1,8,'#8ff0ff');P(14,2,1,12,'#8ff0ff')}
  else if(name==='mute'){P(1,6,3,4,'#8f97b5');P(4,4,2,8,'#8f97b5');P(6,2,2,12,'#8f97b5');for(let i=0;i<6;i++){P(9+i,5+i,1,1,'#ff5a4a');P(14-i,5+i,1,1,'#ff5a4a')}}
  else if(name==='pause'){P(4,3,3,10,'#e6ecff');P(9,3,3,10,'#e6ecff')}
  else if(name==='play'){for(let x=0;x<9;x++){const h=12-Math.round(x*1.3);P(4+x,Math.round(8-h/2),1,h,'#2a1a05')}}
  else if(name==='retry'){G(['...XXXXX.X','..X.....XX','.X.....XXX','X.........','X.........','X.........','X........X','.X......X.','..X....X..','...XXXX...'],{X:'#2a1a05'},1,3,3)}
  else if(name==='lure'){P(7,7,2,7,'#9aa1ad');P(4,13,8,2,'#6a707c');P(6,3,4,4,'#ff5a4a');P(7,4,1,1,'#ffd0c8');P(3,2,1,6,'#ffd36b');P(12,2,1,6,'#ffd36b');P(1,1,1,8,'#ffb347');P(14,1,1,8,'#ffb347')}
  else if(name==='lock'){P(5,1,6,2,'#d0d6e2');P(4,2,2,6,'#d0d6e2');P(10,2,2,6,'#d0d6e2');P(3,7,10,8,'#ffc75a');P(3,7,10,1,'#ffe8a8');P(7,9,2,4,'#5a3a10')}
  else if(name==='slow'){P(3,1,10,2,'#c58aff');P(3,13,10,2,'#c58aff');P(4,3,8,2,'#e8d8ff');P(5,5,6,2,'#e8d8ff');P(7,7,2,2,'#e8d8ff');P(5,9,6,2,'#e8d8ff');P(4,11,8,2,'#e8d8ff');P(6,4,4,1,'#ffd36b');P(7,11,2,2,'#ffd36b');P(7,8,1,3,'#ffd36b')}
  else if(name==='trophy'){P(3,1,10,6,'#ffc75a');P(4,7,8,2,'#ffc75a');P(7,9,2,3,'#e0a630');P(4,12,8,3,'#a8741a');P(0,2,3,1,'#ffc75a');P(0,2,1,4,'#ffc75a');P(13,2,3,1,'#ffc75a');P(15,2,1,4,'#ffc75a');P(5,2,2,3,'#fff0c0')}
  else if(name==='coreoff'){P(2,13,12,2,'#4a4f58');P(3,3,2,10,'#3d4048');P(11,3,2,10,'#3d4048');P(2,2,12,2,'#6a707c');P(5,5,6,6,'#8a3a3a');P(6,6,2,2,'#ff5a4a');P(8,4,1,3,'#1b1d27');P(7,7,1,2,'#1b1d27');P(9,9,1,3,'#1b1d27')}
  else if(name==='mechdown'){P(3,1,10,4,'#f2c14e');P(2,4,12,2,'#f2c14e');P(4,6,8,7,'#d9a77a');for(let i=0;i<3;i++){P(5+i,7+i,1,1,'#7a1a1a');P(7-i,7+i,1,1,'#7a1a1a');P(9+i,7+i,1,1,'#7a1a1a');P(11-i,7+i,1,1,'#7a1a1a')}P(6,12,4,1,'#7a4a2a')}
  else if(name==='platform'){P(1,6,14,4,'#868c96');P(1,6,14,1,'#b9c0c8');P(1,9,14,1,'#5d626c');P(3,10,2,4,'#5d626c');P(11,10,2,4,'#5d626c');P(5,10,6,1,'#c9a22a')}
  else if(name==='crane'){P(12,1,2,14,'#6a707c');P(3,1,11,2,'#c9a22a');P(5,3,1,5,'#2d3038');P(2,8,10,2,'#a9aeb7');P(2,10,10,1,'#5c616b');P(13,12,3,3,'#4a4f58')}
  else if(name==='hub'){P(2,3,12,11,'#1d2a3a');P(2,3,12,1,'#8ff0ff');P(2,13,12,1,'#8ff0ff');P(2,3,1,11,'#8ff0ff');P(13,3,1,11,'#8ff0ff');P(7,5,2,7,'#8ff0ff');P(5,7,6,3,'#8ff0ff')}
  else if(name==='sniper'){P(1,13,13,2,'#7a6a4a');P(3,9,8,4,'#46525e');P(3,9,8,1,'#7a8896');P(8,7,2,2,'#2d3038');P(9,5,6,2,'#2d3038');P(11,4,2,1,'#8ff0ff');P(14,5,2,2,'#b8ff8a');P(5,7,3,2,'#59606c')}
  else if(name==='gatling'){P(1,13,13,2,'#7a6a4a');P(3,8,7,5,'#6a4a3a');P(3,8,7,1,'#9a7a5a');P(10,6,6,1,'#2d3038');P(10,8,6,1,'#2d3038');P(10,10,6,1,'#2d3038');P(15,5,1,7,'#ffd36b');P(5,6,3,2,'#59606c')}
  else if(name==='flame'){tower(0);P(11,3,3,2,'#c0651f');P(13,2,2,4,'#ff7a2a');P(14,1,1,2,'#ffd36b');P(12,6,2,1,'#ff5a1a')}
  else if(name.startsWith('ar_')){const k=name[3];P(2,12,12,2,'#5c616b');
    const a=(x,y)=>P(x,y,1,1,'#ffd36b');
    for(let i=0;i<5;i++){
      if(k==='u'){P(7-i,3+i,1+i*2,1,'#ffd36b')}else if(k==='d'){P(7-i,9-i,1+i*2,1,'#ffd36b')}
      else if(k==='l'){P(3+i,7-i,1,1+i*2,'#ffd36b')}else{P(9-i,7-i,1,1+i*2,'#ffd36b')}}
    if(k==='u')P(7,8,2,3,'#ffd36b');else if(k==='d')P(7,3,2,3,'#ffd36b');else if(k==='l')P(8,7,3,2,'#ffd36b');else P(5,7,3,2,'#ffd36b')}
  else if(name==='shield'){P(3,2,10,2,'#5ad1e6');P(3,2,2,8,'#5ad1e6');P(11,2,2,8,'#5ad1e6');P(4,10,8,2,'#5ad1e6');P(6,12,4,2,'#5ad1e6');P(5,4,6,6,'#1d3a4a');P(7,5,2,4,'#8ff0ff')}
  else if(name==='core'){P(2,13,12,2,'#4a4f58');P(3,3,2,10,'#3d4048');P(11,3,2,10,'#3d4048');P(2,2,12,2,'#6a707c');P(5,5,6,6,'#5ad1e6');P(6,6,4,4,'#e6fbff');P(7,0,2,2,'#c9a22a')}
  else if(name==='research'){P(6,1,4,2,'#9aa1ad');P(7,3,2,4,'#9aa1ad');P(3,7,10,7,'#5ad1e6');P(3,7,10,1,'#e6fbff');P(2,13,12,2,'#9aa1ad');P(5,10,2,2,'#e6fbff');P(9,9,2,2,'#e6fbff')}
  else if(name==='worker'){P(5,2,6,1,'#9aa1ad');P(7,0,2,2,'#9aa1ad');P(4,3,8,6,'#c9a22a');P(4,3,8,1,'#e6c24a');P(5,5,2,2,'#5ad1e6');P(9,5,2,2,'#5ad1e6');P(3,9,10,3,'#6a707c');P(4,12,2,3,'#3d4048');P(10,12,2,3,'#3d4048')}
  else if(name==='tower'){tower(1)}
  else if(name==='towerup'){tower(-2);P(12,1,1,1,'#7dff9a');P(11,2,3,1,'#7dff9a');P(10,3,5,1,'#7dff9a');P(12,4,1,6,'#7dff9a')}
  else if(name==='fuel'){P(4,1,8,2,'#9aa1ad');P(2,3,12,12,'#9aa1ad');P(3,4,10,10,'#14304a');P(4,9,8,4,'#5ad1e6');P(4,9,8,1,'#c8f8ff');P(7,4,2,7,'#e6fbff');P(5,6,6,2,'#e6fbff')}
  else if(name==='weld'){P(2,10,7,3,'#8e99a8');P(2,10,7,1,'#b9c2cc');P(9,10,3,2,'#5a6270');P(12,8,3,3,'#8ff0ff');P(13,6,1,2,'#d8fbff');P(11,12,2,1,'#8ff0ff');P(14,11,1,2,'#8ff0ff')}
  else if(name==='repair'){for(let i=0;i<8;i++)P(3+i,12-i,2,2,'#c9d2dc');P(10,2,5,1,'#e8edf2');P(10,6,5,1,'#e8edf2');P(10,2,1,5,'#e8edf2');P(14,2,1,5,'#e8edf2');P(2,12,2,3,'#7a808c')}
  return c;
}
function beginHold(o,pid){
  if(!running||paused||S.over||!o)return false;
  if((o.kind==='hub'||o.kind==='page')&&o.state==='ok'){audioInit();completeHold(o);return false}
  if(o.state==='locked'){sfx('nope');return false}
  if(o.state==='poor'){sfx('nope');return false}
  if(o.state!=='ok')return false;
  audioInit();sfx('click');
  cardHold={key:o.key,t:0,done:0,pid};return true;
}
let menuSig='',keySig='',cards=[];
function menuSync(opts){
  const sig=opts.map(o=>o.key+'/'+o.icon+'/'+(o.badge||'')+'/'+o.cost+'/'+(o.gain||'')+'/'+o.nm).join('|');
  optsEl.classList.toggle('r1',opts.length<=4);
  const ksig=opts.map(o=>o.key).join('|');
  if(sig!==menuSig){
    const fresh=ksig!==keySig;keySig=ksig;
    menuSig=sig;cards=[];optsEl.textContent='';
    if(fresh&&opts.length)for(let i=0;i<Math.min(opts.length,8);i++)setTimeout(()=>{if(running&&!paused)sfx(i===opts.length-1||i===7?'slotend':'slot')},i*26);
    opts.forEach((o,i)=>{
      const b=document.createElement('button');b.type='button';b.className='opt';
      b.setAttribute('aria-label',o.label+(o.cost!==undefined?', '+o.cost+' suku cadang':''));b.title=o.label;
      if(fresh)b.style.animationDelay=(i*26)+'ms';else b.classList.add('still');
      const key=document.createElement('span');key.className='key';key.textContent=String(i+1);b.appendChild(key);
      if(o.corner){const c=mkIcon(o.corner);c.className='cor';b.appendChild(c)}
      const ic=mkIcon(o.icon);ic.className='icn';b.appendChild(ic);
      const nmE=document.createElement('span');nmE.className='nm';nmE.textContent=o.nm||'';b.appendChild(nmE);
      const bd=document.createElement('span');bd.className='bdg'+(o.badge==='+'||o.badgePlain?' plus':'');bd.textContent=o.badge||'';b.appendChild(bd);
      const cs=document.createElement('span');cs.className='cost';
      if(o.cost!==undefined){cs.appendChild(icon('gear'));const v=document.createElement('b');v.textContent=String(o.cost);cs.appendChild(v)}
      else if(o.gain!==undefined){cs.appendChild(icon('gear'));const v=document.createElement('b');v.textContent='+'+o.gain;v.style.color='#7dff9a';cs.appendChild(v)}
      b.appendChild(cs);
      const ovl=document.createElement('span');ovl.className='ovl';b.appendChild(ovl);
      const fill=document.createElement('span');fill.className='fill';const fi=document.createElement('i');fill.appendChild(fi);b.appendChild(fill);
      b.addEventListener('pointerdown',e=>{
        e.preventDefault();e.stopPropagation();
        const cur=ctxOptions().find(x=>x.key===o.key);
        if(beginHold(cur,e.pointerId)){try{b.setPointerCapture(e.pointerId)}catch(_){}}
        else if(cur&&(cur.state==='poor'||cur.state==='locked')){b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake')}
      });
      const rel=e=>{if(cardHold&&cardHold.pid===e.pointerId)cardHold=null};
      b.addEventListener('pointerup',rel);b.addEventListener('pointercancel',rel);b.addEventListener('lostpointercapture',rel);
      b.addEventListener('contextmenu',e=>e.preventDefault());
      optsEl.appendChild(b);cards.push({b,fill:fi,ovl,o,st:'',pr:-1,held:false});
    });
  }
  opts.forEach((o,i)=>{
    const c=cards[i];if(!c)return;
    if(c.st!==o.state){
      if(c.st)c.b.classList.remove(c.st);c.st=o.state;c.b.classList.add(o.state);
      c.ovl.textContent='';if(o.state==='locked')c.ovl.appendChild(icon('lock'));else if(o.state==='busy')c.ovl.appendChild(icon('cog'));
    }
    const held=!!(cardHold&&cardHold.key===o.key&&!cardHold.done);
    if(c.held!==held){c.held=held;c.b.classList.toggle('held',held)}
    const pr=held?(HT[o.kind]?Math.round(clamp(cardHold.t/HT[o.kind],0,1)*100):100):(o.prog!==undefined?Math.round(o.prog*100):0);
    if(c.pr!==pr){c.pr=pr;c.fill.style.width=pr+'%'}
  });
}

