
/* ---------- characters, their main weapons, permanent upgrades, profiles and settings ---------- */
const CHARS=[
  {id:'mek',name:'Bara',role:'Mekanik',weap:'weld',cost:0,suit:'#e0782a',suitD:'#7a4a1a',helm:'#f2c14e',visor:'#5ad1e6',skin:'#d9a77a',pack:'#6a707c'},
  {id:'snp',name:'Sela',role:'Penembak',weap:'rail',cost:0,suit:'#4f7a4a',suitD:'#2a4a2a',helm:'#3a5a3a',visor:'#ff6a4a',skin:'#c99a72',pack:'#5a5f50',acc:'hood'},
  {id:'saw',name:'Gerinda',role:'Pemotong',weap:'saw',cost:150,suit:'#a83a3a',suitD:'#5a1a1a',helm:'#2a2a30',visor:'#ffd36b',skin:'#b98a62',pack:'#6a5a4a',acc:'band'},
  {id:'bom',name:'Dinamo',role:'Peledak',weap:'nade',cost:250,suit:'#6a6e78',suitD:'#3a3a40',helm:'#4a4f58',visor:'#9dffb0',skin:'#d9a77a',pack:'#4a4f58',acc:'mask'},
  {id:'drn',name:'Nara',role:'Operator drone',weap:'buddy',cost:400,suit:'#6a4a9a',suitD:'#3a2a5a',helm:'#e6ecff',visor:'#c58aff',skin:'#e0b48a',pack:'#5a5f7a',acc:'goggle'}
];
const CHAR=id=>CHARS.find(c=>c.id===id)||CHARS[0];
/* main weapons: index = level 1..5. Every level also raises the reach (r). */
const WEAP={
  weld:{name:'Las busur',icon:'weld',desc:'Busur listrik otomatis ke drone terdekat. Sambarannya melompat ke drone lain (sampai 5 lompatan) dan bisa menyetrum drone hingga lumpuh.',
        r:[0,60,70,80,92,105],cd:[0,.9,.75,.62,.52,.44],dmg:[0,1,1.4,1.9,2.5,3.2],chain:[0,0,0,1,2,3]},
  rail:{name:'Railgun',icon:'w_rail',desc:'Mengisi daya lalu menembakkan sinar lurus yang menembus semua drone di jalurnya. Jangkauan paling jauh. Mulai Lv 3 sinarnya menggema: tembakan susulan di jalur yang sama (dua susulan di Lv 5).',
        r:[0,170,190,210,235,260],cd:[0,2.2,2,1.8,1.6,1.4],dmg:[0,4,6,8.5,11.5,15]},
  saw:{name:'Bumerang gergaji',icon:'w_saw',desc:'Gergaji yang terbang menjauh lalu kembali ke tangan, memotong semua drone yang dilewati di kedua arah. Lv 3 melempar dua, Lv 5 melempar tiga bilah sekaligus.',
        r:[0,90,105,120,135,150],cd:[0,1.8,1.6,1.4,1.25,1.1],dmg:[0,1.5,2,2.8,3.6,4.6]},
  nade:{name:'Granat lengket',icon:'w_nade',desc:'Granat yang menempel di drone lalu meledak sesaat kemudian, melukai semua drone di sekitarnya. Mulai Lv 3 pecah jadi bom-bom kecil susulan (lima di Lv 5).',
        r:[0,110,125,140,155,170],cd:[0,2.4,2.1,1.9,1.7,1.5],dmg:[0,4,5.5,7.5,10,13],spl:[0,24,27,30,33,36]},
  buddy:{name:'Drone pendamping',icon:'w_buddy',desc:'Drone kecil yang terbang menyerang drone musuh di sekitarmu dengan peluru cepat. Lv 5 menjadi dua drone. Mulai Lv 3 menembakkan dua peluru sekaligus.',
        r:[0,110,125,140,155,170],cd:[0,.7,.6,.5,.45,.4],dmg:[0,.8,1.1,1.5,2,2.6]}
};
/* main weapons hit twice as hard and reach twice as far */
for(const k in WEAP){WEAP[k].r=WEAP[k].r.map(v=>v*2);WEAP[k].dmg=WEAP[k].dmg.map(v=>v*3.4)}
WEAP.weld.chain=[0,1,2,3,4,5];WEAP.rail.cd=[0,1.9,1.7,1.5,1.35,1.2];WEAP.saw.cd=[0,1.5,1.35,1.2,1.05,.9];WEAP.nade.cd=[0,2,1.8,1.6,1.45,1.3];WEAP.buddy.cd=[0,.5,.44,.38,.33,.28];WEAP.weld.cd=[0,.7,.6,.5,.42,.35];
/* upgrade slots, per character. main starts at 1, the rest at 0. Max level 5. */
const UPG={
  main:{cost:[0,0,40,100,200,360]},
  katana:{name:'Katana',icon:'wp_katana',desc:'Tebasan pedang otomatis dengan jangkauan sangat pendek, tapi damage-nya tinggi dan memotong semua drone yang terjangkau. Level menambah damage, kecepatan tebas, dan jangkauan.',cost:[0,40,100,190,320,500]},
  orbit:{name:'Bilah orbit',icon:'wp_orbit',desc:'Bilah yang berputar mengelilingimu dan melukai drone yang tersentuh. Level menambah jumlah bilah, damage, dan jarak putarnya.',cost:[0,30,80,160,280,450]},
  shot:{name:'Senapan tabur',icon:'wp_shot',desc:'Semburan peluru melebar ke drone terdekat. Level menambah peluru, damage, kecepatan tembak, dan jangkauan.',cost:[0,30,80,160,280,450]},
  mini:{name:'Roket mini',icon:'wp_mini',desc:'Roket kecil pelacak yang mengejar drone di sekitarmu. Level menambah jumlah roket, damage, dan jangkauan.',cost:[0,40,100,190,320,500]},
  field:{name:'Medan statis',icon:'wp_field',desc:'Lingkaran listrik di sekitarmu yang terus melukai drone di dalamnya. Level menambah damage dan memperluas lingkaran.',cost:[0,30,80,160,280,450]},
  bots:{name:'Robot tempur',icon:'worker',desc:'Robot pekerja ikut bertempur: menempel di drone musuh dan mengelasnya. Level 1 hanya satu robot yang menyerang, tiap level menambah satu robot (maks 5). Robot lain tetap bekerja mengumpulkan suku cadang dan memperbaiki.',cost:[0,50,110,190,300,450]},
  hp:{name:'Baju zirah',icon:'heart',desc:'Menambah 2 HP maksimum per level.',cost:[0,40,70,110,160,230]},
  bat:{name:'Batre jetpack',icon:'battery',desc:'Menambah 4 detik waktu terbang per level. Kecepatan isi ulang ikut naik.',cost:[0,40,70,110,160,230]},
  jet:{name:'Jet peredam',icon:'jetfall',desc:'Jetpack menyala sendiri saat kamu jatuh: jatuh jadi lebih mulus dan damage pendaratan berkurang tiap level. Di Lv 5 pendaratan selalu mulus tanpa damage.',cost:[0,40,80,140,220,340]},
  aura:{name:'Aura kejut',icon:'blast',desc:'Memperbesar radius dan dorongan aura kejut 15% per level, dan membuatnya makin hemat batre: 75% di Lv 0 turun ke 30% di Lv 5.',cost:[0,50,90,140,200,280]}
};
const UPGK=['main','katana','orbit','shot','mini','field','bots','hp','bat','jet','aura'];
const UMAX=5;

/* ---------- profiles (up to 3) saved in localStorage 'mr_prof' ---------- */
const PSLOTS=3;
let PROF={active:0,list:[]};
function newUp(){const u={};for(const k of UPGK)u[k]=k==='main'?1:0;return u}
function newProfile(name){
  const p={name:String(name||'Pemain').slice(0,12),coins:0,best:0,runs:0,ch:'mek',chars:{},tw:{}};
  for(const c of CHARS)p.chars[c.id]={own:c.cost===0?1:0,up:newUp()};
  return p;
}
function fixProfile(p){
  const q=newProfile(p&&p.name);
  if(!p||typeof p!=='object')return q;
  if(p.tw&&typeof p.tw==='object')for(const k in p.tw)if(p.tw[k]&&TY[k])q.tw[k]=1;
  q.coins=Math.max(0,p.coins|0);q.best=Math.max(0,p.best|0);q.runs=Math.max(0,p.runs|0);q.ch=CHARS.some(c=>c.id===p.ch)?p.ch:'mek';
  for(const c of CHARS){
    const src=p.chars&&p.chars[c.id];if(!src)continue;
    q.chars[c.id].own=src.own||c.cost===0?1:0;
    for(const k of UPGK)q.chars[c.id].up[k]=clamp((src.up&&src.up[k])|0,k==='main'?1:0,UMAX);
  }
  if(!q.chars[q.ch].own)q.ch='mek';
  return q;
}
function profSave(){try{localStorage.setItem('mr_prof',JSON.stringify(PROF))}catch(e){}}
function profLoad(){
  let j=null;try{j=JSON.parse(localStorage.getItem('mr_prof')||'null')}catch(e){}
  if(j&&Array.isArray(j.list)){PROF.list=j.list.slice(0,PSLOTS).map(p=>p?fixProfile(p):null);PROF.active=clamp(j.active|0,0,PSLOTS-1)}
  while(PROF.list.length<PSLOTS)PROF.list.push(null);
  if(!PROF.list.some(Boolean)){
    /* first run, or carry over the workshop data from the version before profiles */
    const p=newProfile('Pemain 1');
    try{const old=JSON.parse(localStorage.getItem('mr_meta')||'null');
      if(old){p.coins=Math.max(0,old.coins|0);const u=old.up||{},m=p.chars.mek.up;m.main=clamp(u.weld|0||1,1,UMAX);for(const k of['orbit','shot','mini','field','hp','bat','aura'])m[k]=clamp(u[k]|0,0,UMAX)}}catch(e){}
    try{p.best=+localStorage.getItem('mr_best')||0}catch(e){}
    PROF.list[0]=p;PROF.active=0;
  }
  if(!PROF.list[PROF.active])PROF.active=PROF.list.findIndex(Boolean);
  profSave();
}
const prof=()=>PROF.list[PROF.active];
const curChar=()=>CHAR(prof().ch);
const curUp=()=>prof().chars[prof().ch].up;
function upCost(k,lv){return UPG[k].cost[lv+1]}
function buyUp(k){
  const p=prof(),u=curUp(),lv=u[k];if(lv>=upCap(k,p.ch))return false;
  const c=upCost(k,lv);if(p.coins<c)return false;
  p.coins-=c;u[k]=lv+1;profSave();return true;
}
function buyTower(ty){
  const p=prof();if(twOwn(ty))return true;
  const c=TY[ty].uc;if(p.coins<c)return false;p.coins-=c;p.tw[ty]=1;profSave();return true;
}
function buyChar(id){
  const p=prof(),c=CHAR(id),st=p.chars[id];if(st.own)return true;
  if(p.coins<c.cost)return false;p.coins-=c.cost;st.own=1;p.ch=id;profSave();return true;
}
/* coins for a finished run: grows faster than the number of nights */
const coinsFor=n=>n<=0?0:8*n+n*(n-1);
/* run categories: length in nights and the completion bonus (share of the coins earned + a fixed sum) */
const RUNS=[{len:5,name:'Short run',f:.25,b:10},{len:10,name:'Medium run',f:.6,b:40},{len:15,name:'Long run',f:1.2,b:100}];
const runBonus=(len,n)=>{const r=RUNS.find(q=>q.len===len);return r?Math.round(coinsFor(n)*r.f+r.b):0};

/* ---------- settings ('mr_set') ---------- */
const SET={music:1,sfx:1,shake:1,light:1,vol:8};   /* vol: 0..10 */
function setLoad(){try{const j=JSON.parse(localStorage.getItem('mr_set')||'null');if(j)for(const k in SET)if(k in j)SET[k]=k==='vol'?clamp(j[k]|0,0,10):(j[k]?1:0)}catch(e){}
  try{if(localStorage.getItem('mr_snd')==='0'){SET.music=0;SET.sfx=0}}catch(e){}}
function setSave(){try{localStorage.setItem('mr_set',JSON.stringify(SET))}catch(e){}}
function applyAudio(){
  if(!AU.ctx)return;const t=AU.ctx.currentTime;
  AU.master.gain.setTargetAtTime(3.2*SET.vol/8,t,.05);   /* 8 = default (2x the old level), 10 = louder */
  AU.mus.gain.setTargetAtTime(SET.music?.5:0,t,.05);AU.sfxg.gain.setTargetAtTime(SET.sfx?.9:0,t,.05);
  if(!SET.sfx){sfxCharge(-1);sfxThrust(false)}
}
profLoad();setLoad();AU.on=true;

/* ---------- main weapon of the current character ---------- */
function updateMainWeapon(dt){
  const s=S,m=s.m,lv=s.mlv,W=WEAP[s.weap],cx=m.x,cy=m.y-10;
  m.cdz-=dt;
  if(m.echo&&m.echo.length){for(const e of m.echo)e.t-=dt;const fire=m.echo.filter(e=>e.t<=0);m.echo=m.echo.filter(e=>e.t>0);for(const e of fire){fireSlug(cx+m.dir*10,cy-1,e.a,e.L,e.dmg);s.fx.push({light:1,x:cx+m.dir*10,y:cy,r:22,rgb:'200,250,255',a:.7,l:.14,L:.14,vx:0,vy:0,g:0});sfx('x_rail2')}}
  if(s.weap==='buddy'){updateBuddies(dt,W,lv);return}
  if(m.cdz>0)return;
  switch(s.weap){
    case 'weld':{
      const tg=nearestDrone(cx,cy,W.r[lv]);if(!tg)return;
      const col=TOOLC[lv];m.cdz=W.cd[lv];m.zt=.12;
      if(Math.abs(m.vx)<10)m.dir=Math.sign(tg.x-cx)||m.dir;
      const hit=new Set([tg]);let left=W.chain[lv];
      const pmv=PMUL,jump=from=>{   /* on impact the arc jumps on to the next drone */
        if(left--<=0)return;const t2=nearestDrone(from.x,from.y,48,d=>hit.has(d));if(!t2)return;hit.add(t2);
        shoot(from.x,from.y,t2,{pl:1,dmg:W.dmg[lv]*.75*pmv,spark:col,k:0,col,sp:460,size:2,cb:ok=>{if(ok){if(Math.random()<.2)shock(t2,1);jump(t2)}}});
      };
      shoot(cx+m.dir*9,cy-1,tg,{pl:1,dmg:W.dmg[lv],spark:col,k:rangeK(Math.hypot(tg.x-cx,tg.y-cy),W.r[lv]),col,sp:420,size:3,trail:9,cb:ok=>{if(ok){if(Math.random()<.2+.06*lv)shock(tg,1+.2*lv);jump(tg)}}});
      sfx('x_weld');return;
    }
    case 'rail':{
      const tg=nearestDrone(cx,cy,W.r[lv]);if(!tg){m.cdz=.15;return}
      m.cdz=W.cd[lv];m.zt=.2;m.dir=Math.sign(tg.x-cx)||m.dir;
      const a=Math.atan2(tg.y-cy,tg.x-cx);fireSlug(cx+m.dir*10,cy-1,a,W.r[lv],W.dmg[lv]);
      s.fx.push({light:1,x:cx+m.dir*10,y:cy,r:30,rgb:'200,250,255',a:.9,l:.2,L:.2,vx:0,vy:0,g:0});
      s.shake=Math.max(s.shake,.1);sfx('x_rail');
      if(lv>=3)m.echo=[{t:.2,a,L:W.r[lv],dmg:W.dmg[lv]*.6}].concat(lv>=5?[{t:.4,a,L:W.r[lv],dmg:W.dmg[lv]*.4}]:[]);
      return;
    }
    case 'saw':{
      if(s.saws.length)return;   /* wait until the blades are back in hand */
      const tg=nearestDrone(cx,cy,W.r[lv]);if(!tg){m.cdz=.15;return}
      m.cdz=W.cd[lv];m.dir=Math.sign(tg.x-cx)||m.dir;
      const a=Math.atan2(tg.y-cy,tg.x-cx),n=lv>=5?3:lv>=3?2:1;
      for(let i=0;i<n;i++){const aa=a+(n>1?(i-(n-1)/2)*.3:0);s.saws.push({x:cx,y:cy,a:aa,d:0,max:W.r[lv],back:false,hit:new Set(),dmg:W.dmg[lv]*PMUL,spin:0})}
      sfx('x_saw');return;
    }
    case 'nade':{
      const tg=nearestDrone(cx,cy,W.r[lv]);if(!tg){m.cdz=.15;return}
      m.cdz=W.cd[lv];m.dir=Math.sign(tg.x-cx)||m.dir;
      const T=.45,k=rangeK(Math.hypot(tg.x-cx,tg.y-cy),W.r[lv]),vx=(tg.x+(tg.vx||0)*T+rnd(-1,1)*k*26-cx)/T,vy=(tg.y+(tg.vy||0)*T+rnd(-1,1)*k*18-cy)/T-.5*240*T;
      s.nades.push({x:cx+m.dir*8,y:cy-2,vx,vy,stuck:null,ox:0,oy:0,t:0,dmg:W.dmg[lv]*PMUL,spl:W.spl[lv],lv});sfx('x_throw');return;
    }
  }
}
function updateBuddies(dt,W,lv){
  const s=S,m=s.m,n=lv>=5?2:1;
  while(s.buddies.length<n)s.buddies.push({x:m.x,y:m.y-24,cd:.5,ph:Math.random()*6});
  s.buddies.length=n;
  s.buddies.forEach((b,i)=>{
    b.ph+=dt;b.cd-=dt;
    const hx=m.x+(i?14:-14),hy=m.y-26+Math.sin(b.ph*3)*2;
    const tg=nearestDrone(m.x,m.y-10,W.r[lv]);
    let gx=hx,gy=hy;
    if(tg){const a=Math.atan2(b.y-tg.y,b.x-tg.x);gx=tg.x+Math.cos(a)*44;gy=tg.y+Math.sin(a)*44;
      const lx=gx-m.x,ly=gy-m.y,ll=Math.hypot(lx,ly);if(ll>W.r[lv]*.7){gx=m.x+lx/ll*W.r[lv]*.7;gy=m.y+ly/ll*W.r[lv]*.7}}
    const ex=gx-b.x,ey=gy-b.y,ed=Math.hypot(ex,ey);if(ed>1){const sp=Math.min(ed/dt,150);b.x+=ex/ed*sp*dt;b.y+=ey/ed*sp*dt}
    b.dir=tg?(tg.x>=b.x?1:-1):(m.dir);
    if(tg&&b.cd<=0&&Math.hypot(tg.x-b.x,tg.y-b.y)<=80){
      b.cd=W.cd[lv];const a=Math.atan2(tg.y-b.y,tg.x-b.x);
      for(const da of(lv>=3?[-.12,.12]:[0]))s.bul.push({x:b.x,y:b.y,x0:b.x,y0:b.y,reach:112,vx:Math.cos(a+da)*320,vy:Math.sin(a+da)*320,l:.35,dmg:W.dmg[lv]*PMUL*(lv>=3?.7:1),c:'#e0b8ff'});sfx(lv>=3?'x_buddy2':'x_buddy');
    }
  });
}
function updateMainProjectiles(dt){
  const s=S,m=s.m;
  s.rails=s.rails.filter(r=>(r.l-=dt)>0);
  s.saws=s.saws.filter(w=>{
    w.spin+=dt*30;
    if(!w.back){w.d+=230*dt;w.x+=Math.cos(w.a)*230*dt;w.y+=Math.sin(w.a)*230*dt;if(w.d>=w.max){w.back=true;w.hit.clear()}}
    else{const ex=m.x-w.x,ey=m.y-10-w.y,ed=Math.hypot(ex,ey);if(ed<8){puff(m.x,m.y-10,2,'#d0d6e2');return false}w.x+=ex/ed*270*dt;w.y+=ey/ed*270*dt}
    for(const d of s.drones){if(d.hp<=0||w.hit.has(d))continue;if(Math.hypot(d.x-w.x,d.y-w.y)<=d.w/2+5){w.hit.add(d);if(hitAt(d,w.dmg,'#ffd36b',rangeK(Math.hypot(d.x-m.x,d.y-m.y+10),w.max)))sfx('clank')}}
    return true;
  });
  s.nades=s.nades.filter(g=>{
    if(g.stuck){
      if(s.drones.includes(g.stuck)&&g.stuck.hp>0){g.x=g.stuck.x+g.ox;g.y=g.stuck.y+g.oy}
      g.t+=dt;if(g.t>=.8){explode(g.x,g.y,g.spl,g.dmg,'#9dffb0');sfx('x_nade');if(g.lv>=3){const nb=g.lv>=5?5:3;for(let i=0;i<nb;i++){const a=i/nb*6.283+rnd(0,1),dd=g.spl*rnd(.9,1.5);const bx=g.x+Math.cos(a)*dd,by=Math.min(GW-3,g.y+Math.sin(a)*dd*.6);setTimeout(()=>{if(S===s&&!S.over)explode(bx,by,g.spl*.6,g.dmg*.45,'#c8ff6a')},120+i*90)}}return false}
      return true;
    }
    g.vy+=240*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;
    for(const d of s.drones){if(d.hp<=0)continue;if(Math.hypot(d.x-g.x,d.y-g.y)<=d.w/2+3){g.stuck=d;g.ox=g.x-d.x;g.oy=g.y-d.y;sfx('clank');return true}}
    if(g.y>=GW-2){g.y=GW-2;g.stuck={x:g.x,y:g.y,hp:1};g.ox=0;g.oy=0}
    return g.x>-20&&g.x<W+20;
  });
}
/* ---------- character sprite, shared by the game and the workshop preview ----------
   P(ox,oy,w,h,col) draws relative to the feet, facing right. o: {air,thr,step,lvl,lit,weap,sawOut} */
const MAINC=[null,'#8ff0ff','#7dff9a','#c8ff6a','#ff7ae6','#ffd36b'];
function drawCharSprite(P,c,o){
  const step=o.step,air=o.air;
  P(-3,-5,2,air?(o.thr?2:3):5-(step?1:0),'#3a3f4a');P(1,-5,2,air?(o.thr?3:4):5-(step?0:1),'#3a3f4a');
  P(-4,-12,8,7,c.suit);P(-4,-7,8,1,c.suitD);P(1,-10,3,2,c.suitD);P(-4,-12,2,7,'rgba(255,255,255,.12)');
  P(-8,-13,3,8,c.pack);P(-8,-13,3,1,'#9aa1ad');P(-8,-5,3,1,'#2d3038');P(-5,-11,1,4,'#4a4f5c');
  if(o.thr){const fl=Math.floor(o.t*30)%2;P(-8,-4,3,5+fl*2,'#ffb347');P(-7,-4,1,4+fl,'#fff6c8')}
  P(-3,-17,6,5,c.skin);
  if(c.acc==='hood'){P(-4,-20,8,4,c.helm);P(-5,-18,2,6,c.helm);P(1,-16,3,1,c.visor)}
  else if(c.acc==='band'){P(-4,-19,8,2,'#2a2a30');P(-4,-17,8,1,c.helm);P(-6,-17,2,1,'#a83a3a');P(-7,-16,2,1,'#a83a3a');P(1,-16,3,2,c.visor)}
  else if(c.acc==='mask'){P(-4,-19,8,3,c.helm);P(-3,-20,6,1,c.helm);P(0,-15,4,3,'#2d3038');P(3,-14,2,2,'#59606c');P(1,-17,3,1,c.visor)}
  else if(c.acc==='goggle'){P(-4,-19,8,3,c.helm);P(-3,-20,6,1,c.helm);P(-1,-17,5,2,'#2d3038');P(0,-17,2,1,c.visor);P(3,-17,1,1,c.visor);P(-2,-22,1,3,'#9aa1ad');P(-2,-23,1,1,c.visor)}
  else{P(-4,-19,8,3,c.helm);P(-3,-20,6,1,c.helm);P(1,-16,3,2,c.visor)}
  P(2,-10,4,2,c.skin);
  const lv=o.lvl,lc=MAINC[lv],lit=o.lit;
  switch(o.weap){
    case 'weld':
      if(lv<=1){P(5,-11,5,3,'#8e99a8');P(9,-11,2,3,lit?lc:'#5a6270')}
      else if(lv<=3){P(5,-12,7,4,'#8e99a8');P(5,-12,7,1,'#b9c0c8');P(7,-13,2,1,'#5a6270');P(12,-11,2,3,lit?lc:'#3f5a48');P(7,-9,3,1,'#c9a22a')}
      else{P(5,-13,8,5,'#a9aeb7');P(5,-13,8,1,'#d0d4da');P(6,-8,6,1,'#5c616b');P(8,-15,2,2,'#c9a22a');P(13,-12,3,3,lit?lc:'#7a3a70');P(10,-10,2,1,'#c9a22a');P(6,-11,1,1,lit?lc:'#7a3a70')}
      break;
    case 'rail':
      P(3,-11,12+(lv>=4?2:0),2,'#5a6070');P(3,-12,6,1,'#8e99a8');P(6,-13,3,1,'#2d3038');P(4,-9,2,2,'#3a3f4a');
      P(14+(lv>=4?2:0),-11,2,2,lit?'#ffffff':lc);if(lv>=3)P(9,-10,4,1,lc);break;
    case 'saw':
      if(!o.sawOut){P(5,-14,6,6,'#b9c2cc');P(4,-13,8,4,'#b9c2cc');P(7,-12,2,2,'#59606c');P(5,-15,1,1,'#e6ecff');P(10,-9,1,1,'#e6ecff');if(lv>=4)P(11,-15,2,2,lc)}
      P(4,-10,2,2,'#59606c');break;
    case 'nade':
      P(3,-12,8,4,'#4a5a3a');P(3,-12,8,1,'#6a7a52');P(10,-12,2,4,'#2a2e22');P(5,-8,2,2,'#3a3f2a');
      P(-3,-10,1,1,'#7dff9a');P(-1,-10,1,1,'#7dff9a');if(lv>=3)P(1,-10,1,1,'#7dff9a');break;
    case 'buddy':
      P(4,-11,5,3,'#2d3038');P(5,-11,1,1,lc);P(7,-11,1,1,lit?'#ffffff':'#c58aff');P(6,-13,1,2,'#9aa1ad');break;
  }
}
