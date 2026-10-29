
/* ---------- screens: home, profiles, settings, workshop, in-game menu, results ---------- */
const scr={run:$('run'),home:$('home'),prof:$('prof'),sett:$('sett'),bye:$('bye'),hg:$('hg'),tw:$('tw')};
let demo=false,settBack=null;
function uiBlocking(){return !el.ov.hidden||Object.values(scr).some(e=>!e.hidden)}
function show(name){for(const k in scr)scr[k].hidden=k!==name;if(name)el.ov.hidden=true;view.classList.toggle('inmenu',!!name)}
function btnFx(){audioInit();applyAudio();sfx('click')}
function mk(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function statRow(pairs){
  const r=mk('div','stats');
  for(const[ic,v]of pairs){const c=mk('div','chip');c.appendChild(icon(ic));c.appendChild(mk('b','',v));r.appendChild(c)}
  return r;
}

/* ----- overlay used for pause menu and results ----- */
function showOv(t,nodes,btn,fn,menu){
  ptrs.clear();syncG();sfxCharge(-1);sfxThrust(false);cardHold=null;
  $('ovS').hidden=$('ovF').hidden=$('ovH').hidden=!menu;stopCoinAnim();
  el.ovT.textContent=t;el.ovT.hidden=!t;
  el.ovP.textContent='';(nodes||[]).forEach(n=>el.ovP.appendChild(n));el.ovP.hidden=!nodes;
  paint(el.ovBi,btn);el.ovB.setAttribute('aria-label',btn==='next'?'Lanjut ke bengkel':'Lanjut main');
  ovFn=fn;el.ov.hidden=false;el.ov.style.animation='none';void el.ov.offsetWidth;el.ov.style.animation='';
}
el.ovB.addEventListener('click',()=>{btnFx();stopCoinAnim();el.ov.hidden=true;if(ovFn)ovFn()});
function pause(){
  if(!running||S.over||paused||demo)return;
  paused=true;saveRun();showOv('',[icon('menu','big')],'play',()=>{paused=false},true);
}
$('bPause').addEventListener('click',pause);
$('ovS').addEventListener('click',()=>{btnFx();el.ov.hidden=true;openSettings(()=>{el.ov.hidden=false})});
$('ovF').addEventListener('click',()=>{   /* surrender: the run ends, coins for the nights survived are still paid */
  btnFx();if(!S||S.over)return;
  S.over=true;paused=false;const[n,earn]=endRun();
  resultOv('flag',n,earn);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
$('bLure').addEventListener('click',()=>lure());
$('bBlast').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();audioInit();blast()});

/* ----- save and resume: the running game is stored per profile and can be continued from the main menu ----- */
const RUNKEY=()=>'mr_run_'+PROF.active;
const NOSAVE=new Set(['job','fetch','claim','tw','sh','dc','tgt','aim','atkD']);   /* object links between entities are rebuilt on load */
function saveRep(k,v){if(v instanceof Set)return undefined;if(NOSAVE.has(k)&&v&&typeof v==='object')return undefined;return v}
function saveRun(){
  if(!running||!S||S.over||demo)return;
  try{localStorage.setItem(RUNKEY(),JSON.stringify({v:1,S},saveRep))}catch(e){}
}
function clearRun(i){try{localStorage.removeItem('mr_run_'+(i===undefined?PROF.active:i))}catch(e){}}
function peekRun(){try{const j=JSON.parse(localStorage.getItem(RUNKEY())||'null');return j&&j.S?j.S:null}catch(e){return null}}
function loadRun(){
  const j=peekRun();if(!j)return false;
  try{
    const p=prof();if(j.ch&&p.chars[j.ch]&&p.chars[j.ch].own){p.ch=j.ch;profSave()}
    demo=false;show(null);reset();Object.assign(S,j);
    const s=S;
    for(const k of['missiles','shells','nets','bul','beams','shots','eshots','slugs','bolts','fx','waves','rails','saws','nades','slash','slashMk'])s[k]=[];
    if(!s.crane2)s.crane2={};{const c2=s.crane2;if(!c2.lv)c2.lv=Math.max(1,s.crane.lv|0);if(c2.ox===undefined)c2.ox=0;if(c2.px===undefined)c2.px=CX;if(c2.h===undefined)c2.h=s.crane.h+CRCLEAR;c2.h=Math.max(c2.h,s.crane.h+CRCLEAR);c2.y=GW-c2.h}
    if(s.towers.length<14){const f=reset_towers2();for(let k=s.towers.length;k<14;k++)s.towers.push(f[k-10])}
    /* towers are no longer researched: drop old tower research (the running research is refunded) and, for towers the old run had researched, unlock them in the profile */
    {const old={ball:['gatling','sniper','rocket'],elec:['tesla','laser','emp'],ctrl:['net','decoy'],eco:['magnet','repair','solar']},pp=prof();
     for(const k in old)if(s.res[k]){for(const ty of old[k])pp.tw[ty]=1}
     for(const k of['ball','elec','ctrl','eco','flame','arty'])delete s.res[k];
     if(s.res.cur&&!RES[s.res.cur.key]){s.coins+=20;s.res.cur=null}
     if(s.res.q)s.res.q=s.res.q.filter((k,i,a)=>RES[k]&&a.indexOf(k)===i&&!s.res[k]);
     profSave()}
    s.slow=null;s.wp.katana=s.wp.katana|0;if(!Array.isArray(s.lq))s.lq=[];if(!s.res.q)s.res.q=[];
    for(const b of s.bots){b.job=null;b.fetch=null;b.atkD=null;b.onsite=false;if(b.st==='fetch')b.st='rest'}
    for(const t of s.towers)t.tgt=null;
    for(const d of s.drones)d.atk=null;
    if(!s.run)s.run={len:0};s.pick=null;s.over=false;cardHold=null;
    camY=clamp(s.m.y-VH*.62,0,CAMYMAX);
    running=true;paused=true;
    showOv('',[icon('menu','big')],'play',()=>{paused=false},true);
    return true;
  }catch(e){clearRun();running=false;showHome();return false}
}
$('ovH').addEventListener('click',()=>{btnFx();if(!S||S.over)return;saveRun();el.ov.hidden=true;paused=false;running=false;showHome()});
addEventListener('pagehide',saveRun);
let saveAcc=0;

/* ----- runs ----- */
function start(len){demo=false;show(null);reset();S.run={len:len|0};running=true;paused=false;clearRun()}
function endRun(){
  const p=prof(),n=S.day-1,earn=coinsFor(n);
  p.coins+=earn;p.runs++;if(n>p.best)p.best=n;
  if(n>best){best=n;try{localStorage.setItem('mr_best',String(best))}catch(e){}}
  profSave();return[n,earn];
}
function onOver(){
  const[n,earn]=endRun();
  sfx('over');resultOv(S.cause==='mech'?'mechdown':'coreoff',n,earn);
}
/* ----- results: the earned coins count up with a rolling sound, flying coins and a final chime ----- */
let coinTimer=0,coinNodes=[];
function stopCoinAnim(){if(coinTimer){clearInterval(coinTimer);coinTimer=0}coinNodes.forEach(n=>n.remove());coinNodes=[]}
function onWin(){
  const[n,earn]=endRun(),b=runBonus(S.run.len,n),p=prof();p.coins+=b;profSave();
  sfx('jackpot');resultOv('trophy',n,earn+b,b);
}
function resultOv(ic,n,earn,bonus){
  clearRun();
  const row=statRow([['coin',earn>0?'+0':'+0']]);
  showOv('',[icon(ic,'big'),statRow([['moon',n],['trophy',prof().best]]),row].concat(bonus?[statRow([['check','+'+bonus]])]:[]),'next',()=>showHangar(earn>0));
  if(earn>0)setTimeout(()=>coinAnim(row,earn),650);else row.querySelector('b').textContent='+0';
}
function coinAnim(row,earn){
  stopCoinAnim();
  const chip=row.firstChild,b=chip.querySelector('b'),ovr=el.ov.getBoundingClientRect(),cr=chip.getBoundingClientRect();
  if(!cr.width)return;
  const cx=cr.left-ovr.left+cr.width/2-4,cy=cr.top-ovr.top+cr.height/2-4,T=Math.min(2.6,1+earn*.012),N=Math.min(18,6+Math.floor(earn/8));
  for(let i=0;i<N;i++){
    const f=document.createElement('i');f.className='cfly';
    const a=Math.random()*6.283,r=90+Math.random()*120;
    f.style.left=cx+'px';f.style.top=cy+'px';f.style.setProperty('--x',Math.round(Math.cos(a)*r)+'px');f.style.setProperty('--y',Math.round(Math.sin(a)*r*.8-30)+'px');
    f.style.setProperty('--d','.8s');f.style.setProperty('--w',(i/N*T*.9).toFixed(2)+'s');
    el.ov.appendChild(f);coinNodes.push(f);
  }
  const t0=performance.now();let shown=-1,lastSnd=0;
  coinTimer=setInterval(()=>{
    const p=Math.min(1,(performance.now()-t0)/(T*1000)),v=Math.round(earn*(1-Math.pow(1-p,2)));
    if(v!==shown){shown=v;b.textContent='+'+v;
      const now=performance.now();if(now-lastSnd>55){lastSnd=now;AU.cf=620+p*1100;sfx('coin')}}
    if(p>=1){
      stopCoinAnim();b.textContent='+'+earn;chip.classList.remove('cpop');void chip.offsetWidth;chip.classList.add('cpop');sfx('jackpot');
      for(let i=0;i<14;i++){const s2=document.createElement('i');s2.className='cstar';s2.style.left=cx+'px';s2.style.top=cy+'px';const a=i/14*6.283;
        s2.style.setProperty('--x',Math.round(Math.cos(a)*(36+i%3*12))+'px');s2.style.setProperty('--y',Math.round(Math.sin(a)*(36+i%3*12))+'px');el.ov.appendChild(s2);coinNodes.push(s2);setTimeout(()=>s2.remove(),800)}
    }
  },40);
}

/* ----- home screen: the living game world behind the title ----- */
function homeScene(){
  reset();demo=true;running=false;paused=false;
  const s=S;s.t=DAY-5;s.m.x=CX+40;s.m.dir=-1;
  [[1,'g',3],[4,'tesla',2],[6,'mortar',2],[7,'rocket',2],[3,'f',2]].forEach(([i,ty,lv])=>{const t=s.towers[i];if(t){t.ty=ty;t.lv=lv}});
  for(let k=0;k<7;k++){spawnDrone(k===6?'h':'s',30+k*48);const d=s.drones[s.drones.length-1];d.y=120+Math.random()*260;d.demo=k}
}
function homeTick(dt){
  const s=S;s.anim+=dt;
  for(const d of s.drones){d.ph+=dt;d.x+=Math.sin(s.anim*.4+d.demo*1.7)*22*dt;d.y+=Math.cos(s.anim*.3+d.demo)*8*dt;if(d.x<10)d.x=W-10;if(d.x>W-10)d.x=10}
  for(const t of s.towers)if(t.lv)t.ang=-Math.PI/2+Math.sin(s.anim*.7+t.i)*.6;
}
function showHome(){
  homeScene();show('home');
  const p=prof();$('homeProfName').textContent=p.name;$('homeCoins').textContent=p.coins;
  const sv=peekRun();$('mCont').hidden=!sv;$('mNew').classList.toggle('gold',!sv);if(sv)$('mContD').textContent=String(sv.day||1);
  const lc=$('logoMech'),g=lc.getContext('2d');g.clearRect(0,0,lc.width,lc.height);
  drawCharSprite((ox,oy,w,h,c)=>{g.fillStyle=c;g.fillRect(16+ox,31+oy,w,h)},curChar(),{air:false,lvl:curUp().main,weap:curChar().weap,t:0});
}
$('mCont').addEventListener('click',()=>{btnFx();loadRun()});
$('mNew').addEventListener('click',()=>{btnFx();showHangar(false)});
$('mProf').addEventListener('click',()=>{btnFx();showProfiles()});
$('homeProf').addEventListener('click',()=>{btnFx();showProfiles()});
$('mSet').addEventListener('click',()=>{btnFx();openSettings(showHome)});
$('mQuit').addEventListener('click',()=>{
  btnFx();
  try{if(window.MRApp&&MRApp.quit){audioBg(true);MRApp.quit();return}}catch(e){}   /* the Android app closes itself */
  show('bye');
});
$('byeBack').addEventListener('click',()=>{btnFx();showHome()});

/* ----- settings ----- */
const SETL=[['music','music','Musik'],['sfx','sound','Efek suara'],['shake','shake','Getar layar'],['light','sun','Efek cahaya']];
function openSettings(back){
  settBack=back;show('sett');
  const L=$('setList');L.textContent='';
  for(const[k,ic,label]of SETL){
    const b=mk('button','srow');b.type='button';b.appendChild(icon(ic));b.appendChild(mk('span','sl',label));
    const sw=mk('span','sw'+(SET[k]?' on':''));sw.appendChild(mk('i'));b.appendChild(sw);
    b.setAttribute('role','switch');b.setAttribute('aria-checked',SET[k]?'true':'false');
    b.addEventListener('click',()=>{SET[k]=SET[k]?0:1;setSave();audioInit();applyAudio();sw.classList.toggle('on',!!SET[k]);b.setAttribute('aria-checked',SET[k]?'true':'false');sfx('click')});
    L.appendChild(b);
  }
  /* volume: 10 segments, tap one to set it */
  const v=mk('div','srow vrow');v.appendChild(icon('sound'));v.appendChild(mk('span','sl','Volume'));
  const segs=mk('span','vseg');
  for(let i=1;i<=10;i++){const sb=mk('button','vs'+(i<=SET.vol?' on':''));sb.type='button';sb.setAttribute('aria-label','Volume '+i*10+'%');
    sb.addEventListener('click',()=>{SET.vol=SET.vol===i&&i===1?0:i;setSave();audioInit();applyAudio();sfx('click');segs.querySelectorAll('button').forEach((q,j)=>q.classList.toggle('on',j<SET.vol))});segs.appendChild(sb)}
  v.appendChild(segs);L.prepend(v);
}
$('setBack').addEventListener('click',()=>{btnFx();const f=settBack;settBack=null;show(null);if(f)f()});

/* ----- profiles ----- */
let profDel=-1;
function showProfiles(){
  show('prof');profDel=-1;renderProfiles();
}
function renderProfiles(){
  const L=$('profList');L.textContent='';
  PROF.list.forEach((p,i)=>{
    const row=mk('div','pslot'+(i===PROF.active?' act':''));
    if(p){
      const b=mk('button','pmain');b.type='button';
      const cv2=document.createElement('canvas');cv2.width=32;cv2.height=34;cv2.className='pface';const g=cv2.getContext('2d');
      drawCharSprite((ox,oy,w,h,c)=>{g.fillStyle=c;g.fillRect(16+ox,31+oy,w,h)},CHAR(p.ch),{air:false,lvl:p.chars[p.ch].up.main,weap:CHAR(p.ch).weap,t:0});
      b.appendChild(cv2);
      const info=mk('span','pinfo');info.appendChild(mk('b','pn',p.name));
      const st=mk('span','pst');st.appendChild(icon('coin'));st.appendChild(mk('span','',p.coins));st.appendChild(icon('trophy'));st.appendChild(mk('span','',p.best));
      st.appendChild(icon('user'));st.appendChild(mk('span','',CHARS.filter(c=>p.chars[c.id].own).length+'/'+CHARS.length));
      info.appendChild(st);b.appendChild(info);
      if(i===PROF.active)b.appendChild(icon('check','pchk'));
      b.addEventListener('click',()=>{btnFx();PROF.active=i;profSave();profDel=-1;renderProfiles()});
      const del=mk('button','pdel'+(profDel===i?' sure':''));del.type='button';del.setAttribute('aria-label',profDel===i?'Yakin hapus profil':'Hapus profil');
      del.appendChild(icon('trash'));if(profDel===i)del.appendChild(mk('span','','Yakin?'));
      del.addEventListener('click',()=>{
        btnFx();
        if(profDel!==i){profDel=i;renderProfiles();return}
        clearRun(i);PROF.list[i]=null;profDel=-1;
        if(!PROF.list.some(Boolean))PROF.list[0]=newProfile('Pemain 1');
        if(!PROF.list[PROF.active])PROF.active=PROF.list.findIndex(Boolean);
        profSave();renderProfiles();
      });
      row.appendChild(b);row.appendChild(del);
    }else{
      const b=mk('button','pnew');b.type='button';b.appendChild(icon('plus'));b.appendChild(mk('span','','Profil baru'));
      b.addEventListener('click',()=>{
        btnFx();row.textContent='';
        const inp=mk('input','pinput');inp.maxLength=12;inp.placeholder='Nama';inp.value='Pemain '+(i+1);inp.setAttribute('aria-label','Nama profil');
        const ok=mk('button','pok');ok.type='button';ok.setAttribute('aria-label','Buat profil');ok.appendChild(icon('check'));
        const make=()=>{const nm=inp.value.trim()||('Pemain '+(i+1));PROF.list[i]=newProfile(nm);PROF.active=i;profSave();btnFx();renderProfiles()};
        ok.addEventListener('click',make);inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')make()});
        row.appendChild(inp);row.appendChild(ok);setTimeout(()=>{try{inp.focus();inp.select()}catch(e){}},30);
      });
      row.appendChild(b);
    }
    L.appendChild(row);
  });
}
$('profBack').addEventListener('click',()=>{btnFx();showHome()});

/* ----- workshop (bengkel): characters and their permanent upgrades ----- */
let hgView=0,hgSel='main';
const hgGrid=$('hgGrid'),hgCoins=$('hgCoins');
function viewChar(){return CHARS[hgView]}
function upInfo(k){   /* name / icon / description of an upgrade slot for the viewed character */
  if(k==='main'){const w=WEAP[viewChar().weap];return{name:w.name,icon:w.icon,desc:w.desc}}
  return UPG[k];
}
function hangarSync(){
  const p=prof(),c=viewChar(),st=p.chars[c.id],own=!!st.own,u=st.up;
  hgCoins.textContent=p.coins;$('hgProf').textContent=p.name;
  {const n=TORDER.filter(twOwn).length,aff=TORDER.some(ty=>!twOwn(ty)&&p.coins>=TY[ty].uc);$('hgTwSub').textContent=n+'/'+TORDER.length+' terbuka'+(aff?' · ada yang bisa dibuka':'');$('hgTw').classList.toggle('new',aff)}
  $('chName').textContent=c.name;$('chRole').textContent=c.role+' · '+WEAP[c.weap].name;
  $('chLock').hidden=own;$('chSel').hidden=!(own&&p.ch===c.id);
  const ub=$('chBuy');ub.hidden=own;
  if(!own){ub.querySelector('b').textContent=c.cost;ub.classList.toggle('poor',p.coins<c.cost)}
  $('hgPlay').disabled=!own;
  [...hgGrid.children].forEach(b=>{
    const k=b.dataset.k,lv=u[k],mx=lv>=upCap(k,c.id),cost=mx?0:upCost(k,lv),inf=upInfo(k);
    const ic=b.querySelector('canvas.icn');if(ic.dataset.n!==inf.icon){const n=mkIcon(inf.icon);n.className='icn';n.dataset.n=inf.icon;b.replaceChild(n,ic)}
    b.classList.toggle('max',mx);b.classList.toggle('ok',own&&!mx&&p.coins>=cost);b.classList.toggle('poor',own&&!mx&&p.coins<cost);
    b.classList.toggle('lock',!own);b.classList.toggle('sel',k===hgSel);
    b.querySelectorAll('.pips i').forEach((q,i)=>q.classList.toggle('on',i<lv));
    b.querySelector('.cost b').textContent=mx?'':String(cost);b.querySelector('.cost .ic').hidden=mx;
    b.setAttribute('aria-label',inf.name+' level '+lv);
  });
  /* description of the tapped slot */
  const D=$('hgDesc'),inf=upInfo(hgSel),lv=u[hgSel],mx=lv>=upCap(hgSel,c.id);
  D.querySelector('.dn').textContent=inf.name;D.querySelector('.dl').textContent='Lv '+lv+'/'+upCap(hgSel,c.id);
  D.querySelector('.dt').textContent=inf.desc;
  renderStats(hgSel,lv);
  const bb=$('hgUp');bb.hidden=!own||mx;
  if(own&&!mx){bb.querySelector('b').textContent=upCost(hgSel,lv);bb.classList.toggle('poor',p.coins<upCost(hgSel,lv))}
}
function buildHangar(){
  hgGrid.textContent='';
  UPGK.forEach((k,i)=>{
    const b=mk('button','hu');b.type='button';b.dataset.k=k;b.style.animationDelay=(i*35)+'ms';
    const ic=document.createElement('canvas');ic.className='icn';b.appendChild(ic);
    const pp=mk('span','pips');for(let j=0;j<UMAX;j++)pp.appendChild(mk('i'));b.appendChild(pp);
    const cs=mk('span','cost');cs.appendChild(icon('coin'));cs.appendChild(mk('b'));b.appendChild(cs);
    b.addEventListener('click',()=>{btnFx();hgSel=k;$('hgDesc').hidden=false;hangarSync();setTimeout(()=>{try{$('hgDesc').scrollIntoView({block:'end'})}catch(e){}},30)});
    hgGrid.appendChild(b);
  });
}
/* the slot bar scrolls sideways by dragging (mouse) or swiping (touch scrolls natively) */
(function(){let down=false,sx=0,sl=0,moved=false;
  hgGrid.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=true;moved=false;sx=e.clientX;sl=hgGrid.scrollLeft});
  window.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4){moved=true;hgGrid.classList.add('drag')}if(moved)hgGrid.scrollLeft=sl-dx});
  window.addEventListener('pointerup',()=>{down=false;setTimeout(()=>hgGrid.classList.remove('drag'),0)});
  hgGrid.addEventListener('click',e=>{if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
})();
function showHangar(gain){
  demo=false;running=false;show('hg');
  hgView=Math.max(0,CHARS.findIndex(c=>c.id===prof().ch));hgSel='main';$('hgDesc').hidden=true;
  hangarSync();
  if(gain){const c=hgCoins.parentElement;c.classList.remove('gain');void c.offsetWidth;c.classList.add('gain')}
}
function shake(e){e.classList.remove('shake');void e.offsetWidth;e.classList.add('shake')}
$('hgUp').addEventListener('click',()=>{
  audioInit();applyAudio();
  if(buyUp(hgSel)){sfx('power');const b=hgGrid.querySelector('[data-k="'+hgSel+'"]');b.classList.remove('bought');void b.offsetWidth;b.classList.add('bought')}
  else{sfx('nope');shake($('hgUp'))}
  hangarSync();
});
function stepChar(dir){btnFx();hgView=(hgView+dir+CHARS.length)%CHARS.length;const c=viewChar();if(prof().chars[c.id].own){prof().ch=c.id;profSave()}hangarSync()}
$('chPrev').addEventListener('click',()=>stepChar(-1));
$('chNext').addEventListener('click',()=>stepChar(1));
$('chBuy').addEventListener('click',()=>{
  audioInit();applyAudio();
  if(buyChar(viewChar().id)){sfx('power');const cb=$('charBox');cb.classList.remove('bought');void cb.offsetWidth;cb.classList.add('bought')}
  else{sfx('nope');shake($('chBuy'))}
  hangarSync();
});
$('hgPlay').addEventListener('click',()=>{if(!prof().chars[viewChar().id].own)return;btnFx();prof().ch=viewChar().id;profSave();showRun()});
function showRun(){
  show('run');const L=$('runList');L.textContent='';
  for(const r of RUNS){
    const b=mk('button','mbtn rbtn');b.type='button';b.appendChild(icon('moon'));
    const t=mk('span','rn',r.name);t.appendChild(mk('i','',r.len+' malam'));b.appendChild(t);
    const g=mk('b','','+'+runBonus(r.len,r.len));b.appendChild(g);
    b.addEventListener('click',()=>{btnFx();start(r.len)});L.appendChild(b);
  }
}
$('runBack').addEventListener('click',()=>{btnFx();show('hg');hangarSync()});
$('hgBack').addEventListener('click',()=>{btnFx();showHome()});
/* animated character preview in the workshop */
const chCan=$('chCan'),chG=chCan.getContext('2d');
function drawPreview(t){
  const c=viewChar(),own=prof().chars[c.id].own,u=prof().chars[c.id].up;
  chG.clearRect(0,0,chCan.width,chCan.height);
  chG.fillStyle='rgba(0,0,0,.35)';chG.fillRect(9,32,14,2);
  const bob=Math.floor(t*1.6)%2;
  drawCharSprite((ox,oy,w,h,col)=>{chG.fillStyle=own?col:'#14172a';chG.fillRect(16+ox,32+oy+(oy<=-6?bob:0),w,h)},c,{air:false,lvl:u.main,weap:c.weap,lit:own&&Math.floor(t*2)%3===0,t});
}

/* ----- main loop ----- */
function frame(ts){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,Math.max(0,(ts-last)/1000));last=ts;
  if(!scr.tw.hidden)twTick(dt);   /* draws on the game canvas, so it must run before render() repaints it */
  if(demo)homeTick(dt);
  else if(running&&!paused&&!S.over){update(dt*(1-.5*slowE()));if(S.slow){S.slow.t+=dt;if(S.slow.t>=S.slow.T)S.slow=null}}else{S.anim+=dt;sfxThrust(false)}
  AU.play=running&&!paused&&!S.over;AU.menu=Object.values(scr).some(e=>!e.hidden);AU.dark=AU.play?darkness(S.t):0;
  if(AU.play){saveAcc+=dt;if(saveAcc>4){saveAcc=0;saveRun()}}
  render();hud();menuSync(running&&!paused&&!S.over?ctxOptions():[]);
  if(!scr.hg.hidden){drawPreview(S.anim);demoTick(dt)}
}
document.querySelectorAll('[data-ic]').forEach(e=>paint(e,e.dataset.ic));
const firstTap=()=>{audioInit();applyAudio()};
['pointerdown','touchend','keydown'].forEach(ev=>addEventListener(ev,function f(){firstTap();removeEventListener(ev,f)},{passive:true}));
audioInit();applyAudio();   /* if the browser allows autoplay the menu theme starts right away */
layout();
buildHangar();
buildTowerScreen();
$('hgTw').addEventListener('click',()=>{btnFx();show('tw');twSync(true)});
$('twBack').addEventListener('click',()=>{btnFx();show('hg');hangarSync()});
showHome();
requestAnimationFrame(frame);
})();
