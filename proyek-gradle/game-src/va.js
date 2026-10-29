(function(){
'use strict';
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
/* K = canvas pixels per world unit. 1.5 makes every pixel 1/3 smaller than before (finer detail).
   fillRect / drawImage take world-unit coords and snap edges to the finer grid; fr / di draw raw device pixels. */
const K=1.5;
const fr=ctx.fillRect.bind(ctx),di=ctx.drawImage.bind(ctx);
ctx.fillRect=function(x,y,w,h){const x0=Math.round(x*K),y0=Math.round(y*K);fr(x0,y0,Math.round((x+w)*K)-x0,Math.round((y+h)*K)-y0)};
ctx.drawImage=function(img,x,y,w,h){if(w===undefined){w=img.width;h=img.height}const x0=Math.round(x*K),y0=Math.round(y*K);di(img,x0,y0,Math.round((x+w)*K)-x0,Math.round((y+h)*K)-y0)};
/* World = exactly one phone screen wide (360). It only scrolls up and down. Ground line is y=GW. */
const VW=360,W=360,CX=W/2,TIER=38,MAXT=18,GW=MAXT*TIER+110;
/* BOT = screen space under the ground line: a strip of road plus the card dock */
const BOT=146;   /* the dock is BOT-12 = 134 px tall (96 before: 40% more room) */
let VH=700,GSC=VH-BOT,CAMYMAX=Math.max(0,GW-GSC);
const MAXBOTS=16;
const HT={sell:1.2,worker:1.2,fuel:.5,weld:1,tbuild:.8,tup:1,crane:1.2,res:1,core:1.5,botw:1.2};
/* crane: carries the platform. lv -> width, tower slots, lift height above the ground, price of reaching that level */
const CRMX=350,CLMX=10;   /* right crane (platform 1, with the controls) and left crane (platform 2, higher) */
const CRCLEAR=84,CRROPE=64,CR2H=120;   /* platform 2 never goes lower than the top of platform 1's reach plus CRCLEAR (room for towers and cables); it can rise CR2H above that */
/* platform 2 (left crane) has its own level; it always stays CRCLEAR above platform 1 (the mover yields to the other platform's safe area) */
const c2lim=()=>[S.crane.h+CRCLEAR,CR2.h[S.crane2.lv-1]];
const CR={w:[84,124,164],n:[2,3,4],h:[110,170,240],hmin:46,up:[0,10,20],max:3,off:[[-18,18],[-36,0,36],[-54,-18,18,54]]};
const CR2={w:CR.w,n:CR.n,h:[250,340,444],up:CR.up,max:3,off:CR.off};
/* jetpack and body (a body is about 20 px tall): battery in seconds of thrust, safe fall = 3 bodies */
const AGGRO={on:70,off:110};   /* drones chase the mechanic only when he is this close AND closer than any building */
const MECH={hp:10,bat:20,drain:1,charge:1.4,vx:95,vy:110,safe:60,dmgPer:40,jet:0};
/* fall-assist jetpack (permanent upgrade): top falling speed and share of landing damage removed, by level. Level 5 = no damage at all. */
const JETF={v:[1e9,360,280,210,150,100],red:[0,.25,.5,.7,.88,1]};
let cardHold=null;   /* the menu card the player is holding: {key,t,done,pid} */
const DAY=50,NIGHT=40,CYC=DAY+NIGHT,DUSK=7;
const TOOL=[null,{r:60,cd:.9,dmg:1,chain:0},{r:70,cd:.6,dmg:1,chain:0},{r:85,cd:.6,dmg:2,chain:1}];
const TOOLCOST=[0,0,5,8];
/* ground: six building slots, scrap piles sit in the gaps between them */
const SLOTX=[34,80,126,234,280,326];
const PILES=[57,103,257,303];
/* machine gun tower. cost = price of the Nth tower; up[L] = price of L -> L+1 */
/* shield: invisible bubble around a tower. Enemies cannot fly into it and shoot at it instead. up[n] = price of level n+1 */
const SH={max:5,up:[6,10,16,25,40],hp:[0,8,15,25,40,63],r:[0,32,44,56,70,86]};
/* core energy: level -> max HP, price of reaching that level. Research unlocks Tower Api and the shield upgrade. */
const CORE={hp:[40,60,85,120],up:[0,12,22,36],max:4,near:110};   /* near: the mechanic deals up to 2x damage within this distance of the core */
/* idle robots stick to a drone and weld it: damage per second per robot by level, price of reaching a level */
const BOTW={dps:[0,.7,1.4,2.3,3.4,4.8],up:[0,0,14,24,38,56],max:5,reach:280,spd:130};   /* reach x4 (was 70) */
let PLY=false;   /* true while a player weapon deals damage: those hits can be critical */
let PMUL=1;   /* damage multiplier of the mechanic's own weapons while he stands near the core */
/* in-game research only covers the shield and slow-aura upgrades; towers themselves are unlocked in the workshop with coins (profile.tw, TY[ty].uc) */
const RES={shield:{name:'Shield',cost:15,time:90},slow:{name:'Aura lambat',cost:20,time:120}};
const RESK=['shield','slow'];
const RNM={shield:'Shield',slow:'Aura'};
const TWFREE=['g','f','mortar'];
const twOwn=ty=>TWFREE.includes(ty)||!!(prof().tw&&prof().tw[ty]);
/* slow aura: each aura slows drones by 10%; overlapping auras stack up to 50%. Radius is 4x the shield radius. */
const SL={max:5,up:[8,14,22,34,50],r:[0,136,160,184,208,232],f:.1,cap:.5};
/* Tower levels 1..9. A tower may only grow past Lv 3 after the core is upgraded, and past Lv 6 after another core upgrade (cap = 3 x core level). */
const TW={cost:[4,5,6,7,8,9,10,11,12,13],up:[0,5,9,15,26,44,70,105,150],max:9};
const towerCap=()=>Math.min(TW.max,3*S.coreLv);
const coreNeed=lv=>Math.ceil(lv/3);   /* core level needed to hold a tower of this level */
/* a stat curve from its Lv 1 value to its Lv 9 value (p>1 makes the late levels grow faster) */
const ramp=(a,b,p,int)=>{const r=[0];for(let i=1;i<=9;i++){const v=a+(b-a)*Math.pow((i-1)/8,p||1);r.push(int?Math.round(v):Math.round(v*100)/100)}return r};
/* Every tower trades something for something. Gun is the all-rounder: decent damage, reach, accuracy and a small crit chance, nothing extreme.
   acc = chance a shot lands (it also drops with distance); min = blind spot close to the tower.
   Always available: Gun, Api, Mortir. The rest need research. */
const TY={
  g:{name:'Gun',dmg:ramp(.8,6,1.1),cd:ramp(.34,.16),rng:ramp(150,300,1,1),acc:ramp(.85,.97),crit:ramp(.05,.2),sp:560,col:'#8ff0ff'},
  /* Api: strongest damage per second but a short reach; burns everything in its cone */
  f:{name:'Api',dmg:ramp(.5,8,1.25),cd:ramp(.1,.1),rng:ramp(55,125,1,1),cone:.42,col:'#ff9a3a'},
  /* Mortir: lobbed shell with splash; long reach, poor accuracy, blind spot, slow */
  mortar:{name:'Mortir',cost:1.2,rng:ramp(170,330,1,1),min:45,cd:ramp(2.8,1.5),dmg:ramp(4,34,1.15),spl:ramp(26,50,1,1),acc:ramp(.5,.8),col:'#ffd36b'},
  /* Gatling: a hail of weak shots, many miss; medium-short reach */
  gatling:{name:'Gatling',uc:60,cost:1.1,dmg:ramp(.45,2.8),cd:ramp(.09,.05),rng:ramp(110,190,1,1),acc:ramp(.45,.7),sp:640,col:'#ffd36b'},
  /* Penembak jitu: huge reach and accuracy, hits hard but very slowly, blind spot, fragile */
  sniper:{name:'Penembak jitu',uc:100,cost:1.5,dmg:ramp(8,52,1.2),cd:ramp(2.6,1.5),rng:ramp(260,460,1,1),min:70,acc:ramp(.92,.99),sp:1500,col:'#b8ff8a'},
  /* Rudal: homing missile, big hit, slow reload, prefers bosses and heavies */
  rocket:{name:'Rudal',uc:120,cost:1.4,rng:ramp(170,300,1,1),cd:ramp(3.6,2.2),dmg:ramp(12,80,1.25),acc:ramp(.8,.95),col:'#ff9a6a'},
  /* Tesla: never misses, jumps between drones and shocks them; short reach */
  tesla:{name:'Tesla',uc:80,cost:1.1,rng:ramp(75,160,1,1),cd:ramp(1.1,.6),dmg:ramp(2,16,1.1),jump:ramp(2,7,1,1),shock:ramp(.12,.38),col:'#c9a8ff'},
  /* Laser: continuous beam, damage per second ramps to 3x on one target; low burst */
  laser:{name:'Laser',uc:140,cost:1.2,rng:ramp(110,230,1,1),dmg:ramp(2,14,1.1),col:'#ff4a6a'},
  /* EMP: periodic pulse that stuns every drone around it; almost no damage */
  emp:{name:'EMP',uc:90,cost:1,rng:ramp(55,130,1,1),cd:ramp(6.5,3.5),dmg:ramp(.8,5),stun:ramp(1.2,3),col:'#9ad8ff'},
  /* Jaring: pins one drone in place; the net can miss */
  net:{name:'Jaring',uc:70,cost:.9,rng:ramp(120,240,1,1),cd:ramp(4.2,2.4),hold:ramp(1.8,4.5),acc:ramp(.6,.9),col:'#d8e0a0'},
  /* Suar umpan: drones nearby attack it first; it has HP and comes back at dawn */
  decoy:{name:'Suar umpan',uc:50,cost:.8,rng:ramp(90,180,1,1),hp:ramp(30,200,1.2,1),col:'#ffb347'},
  /* Magnet: pulls dropped parts in, extra parts for kills in range, repels drones */
  magnet:{name:'Magnet',uc:70,cost:.8,rng:ramp(70,160,1,1),bonus:ramp(1,4,1,1),push:ramp(34,62,1,1),pcd:ramp(9,4.5),col:'#ff7a7a'},
  /* Dok perbaikan: at night mends shields in range and the core */
  repair:{name:'Dok perbaikan',uc:90,cost:1,rng:ramp(75,165,1,1),cd:ramp(8,3.5),heal:ramp(4,22,1,1),core:ramp(1,3.5),col:'#7dff9a'},
  /* Panel surya: faster jetpack charging, parts every dawn */
  solar:{name:'Panel surya',uc:60,cost:.7,rng:[0,0,0,0,0,0,0,0,0,0],chg:ramp(.25,1),parts:ramp(2,10,1,1),col:'#5ad1e6'}
};
/* tower hit points per level; types scale it (decoys use their own table) */
const TWHP=[0,24,32,42,54,68,84,102,122,144];
const THPM={f:1.1,mortar:1.4,rocket:.9,laser:.8,magnet:1.2,repair:1.1,solar:.7,net:.9,emp:.9,gatling:.9,sniper:.7,tesla:.9};
const towerMaxHp=t=>!t.lv?0:t.ty==='decoy'?TY.decoy.hp[t.lv]:devTwHp(t.ty,t.lv);
const TORDER=['g','f','mortar','gatling','sniper','rocket','tesla','laser','emp','net','decoy','magnet','repair','solar'];
const TICON=t=>t==='g'?'tower':t==='f'?'flame':t;
/* passive weapons for the mechanic; level 0 = not owned. The arc welder (S.tool) is the first one. */
const PW={katana:{name:'Katana',cost:[0,12,18,28]},orbit:{name:'Bilah orbit',cost:[0,10,16,26]},shot:{name:'Senapan tabur',cost:[0,10,16,26]},mini:{name:'Roket mini',cost:[0,12,18,28]},field:{name:'Medan statis',cost:[0,10,16,26]}};
const PWK=['katana','orbit','shot','mini','field'];

const TWH=[0,12,16,20,23,25,26,28,30,32],TWL=[0,8,10,12,14,15,16,17,18,19],TWW=[0,14,16,18,20,22,22,24,24,26];
const keys={l:0,r:0,thr:0,dn:0},g={l:0,r:0};
let S,camY=CAMYMAX,running=false,paused=false,best=0,last=0,ovFn=null;
try{best=+localStorage.getItem('mr_best')||0}catch(e){}

const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const toA=c=>typeof c==='string'?[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]:c;
const mix=(a,b,t)=>{a=toA(a);b=toA(b);return a.map((v,i)=>v+(b[i]-v)*t)};
const css=a=>'rgb('+a.map(Math.round).join(',')+')';
const darkness=t=>t<DAY-DUSK?0:t<DAY?(t-(DAY-DUSK))/DUSK:t<CYC-DUSK?1:1-(t-(CYC-DUSK))/DUSK;
function setSize(h){
  VH=clamp(Math.round(h),600,GW+BOT);GSC=VH-BOT;CAMYMAX=Math.max(0,GW-GSC);
  cv.width=Math.round(VW*K);cv.height=Math.round(VH*K);ctx.imageSmoothingEnabled=false;
  camY=clamp(camY,0,CAMYMAX);
}

/* ---------- waves: every night is stronger than the last ---------- */
const WAVE={nk:1.3,n2:.6,n2f:10,nmax:90,hk:.2,h2:.2,h2f:6,h3:.15,h3f:14,hvMax:.4,bossHp:21,bossDmg:2.5,bd:6};
/* enemy hit-point multiplier per night (1..15), from the owner's difficulty curve: x1 at night 1, x250 at night 15 */
const HPX=[0,1,10,18.6,27.9,39.1,53.2,70.2,89.7,111,133.8,157.4,181.3,205.1,228.1,250];
function waveInfo(d){
  return{
    /* progressive curve: night 1 is gentle (two towers are enough), then count and hit points bend upward (convex) */
    n:2*Math.min(WAVE.nmax,Math.round(3+.7*(d-1)+.07*(d-1)*(d-1))),                                       /* drones in the wave */
    hpm:3*HPX[Math.max(1,Math.min(15,Math.round(d)))],                                                                            /* hit point multiplier */
    spm:Math.min(1.55,.9+.045*(d-1)),                                                                      /* speed multiplier */
    dmm:d<4?.7+.1*(d-1):1.0*(1+Math.floor((d-1)/10)*.5),                                                                         /* damage multiplier */
    hv:d<3?0:Math.min(WAVE.hvMax,.1+.025*(d-3)),                                                           /* share of heavy drones */
    boss:d%5===0                                                                                           /* every 5th wave brings a boss */
  };
}

/* ---------- state (S.coins = spare parts, S.hp = energy core) ---------- */
const mkBot=x=>({x,y:GW,st:'rest',tx:x,t:rnd(.5,2),carry:0,dir:1,ph:rnd(0,6),mv:0,weld:0,job:null,onsite:false,fetch:null});
function applyMeta(){   /* permanent upgrades of the chosen character (vm.js) */
  const u=curUp();
  MECH.jet=u.jet|0;MECH.hp=10+2*u.hp;MECH.bat=20+4*u.bat;MECH.charge=1.4*MECH.bat/20;
  BLAST.cost=Math.max(.3,.75-.09*u.aura);   /* battery share: 75% at Lv 0 down to 30% at Lv 5 */
  BLAST.r=Math.round(192*(1+.15*u.aura));BLAST.pow=Math.round(540*(1+.15*u.aura));BLAST.dmg=5*(1+.15*u.aura);
}
const reset_towers2=()=>CR2.off[2].map((o,k)=>({i:10+k,k,pl:2,ty:'g',x:CX+CR2.off[0][Math.min(k,1)],y:GW-CR.h[0]-CRCLEAR,lv:0,cd:0,ang:-Math.PI/2,fl:0,sh:0,shHp:0,shT:0,shHit:0,brk:false,au:0,pop:0}));
function reset(){
  applyMeta();
  S={run:{len:0},t:0,day:1,coins:7,hp:40,maxHp:40,coreLv:1,botw:1,res:{shield:0,slow:0,cur:null,q:[]},wp:{katana:curUp().katana,orbit:curUp().orbit,shot:curUp().shot,mini:curUp().mini,field:curUp().field},pg:{},
    ch:prof().ch,weap:curChar().weap,mlv:curUp().main,rails:[],saws:[],nades:[],buddies:[],
    missiles:[],shells:[],nets:[],bul:[],beams:[],shots:[],eshots:[],slugs:[],shake:0,pulseT:0,tool:1,anim:0,
    m:{x:CX-34,y:GW,vx:0,vy:0,dir:1,st:'g',pf:1,hurt:0,cdz:0,zt:0,help:false,hp:MECH.hp,bat:MECH.bat,thr:false,lock:false,peak:GW,warn:0},
    bps:[],crane:{lv:1,y:GW-CR.h[0],h:CR.h[0],ox:0,px:CX},crane2:{lv:1,y:GW-CR.h[0]-CRCLEAR,h:CR.h[0]+CRCLEAR,ox:0,px:CX},pick:null,
    towers:SLOTX.map((x,i)=>({i,x,y:GW,ty:'g',lv:0,cd:0,ang:-Math.PI/2,fl:0,sh:0,shHp:0,shT:0,shHit:0,brk:false,au:0,pop:0})).concat(CR.off[2].map((o,k)=>({i:6+k,k,pl:1,ty:'g',x:CX+CR.off[0][Math.min(k,1)],y:GW-CR.h[0],lv:0,cd:0,ang:-Math.PI/2,fl:0,sh:0,shHp:0,shT:0,shHit:0,brk:false,au:0,pop:0}))).concat(CR2.off[2].map((o,k)=>({i:10+k,k,pl:2,ty:'g',x:CX+CR2.off[0][Math.min(k,1)],y:GW-CR.h[0]-CRCLEAR,lv:0,cd:0,ang:-Math.PI/2,fl:0,sh:0,shHp:0,shT:0,shHit:0,brk:false,au:0,pop:0}))),
    bots:[mkBot(CX-20),mkBot(CX+20)],drones:[],bolts:[],fx:[],drops:[],
    queue:[],lq:[],lid:0,wv:null,spawnT:0,quota:0,nightOn:false,msg:'',msgT:0,over:false,kills:0};
  camY=CAMYMAX;
  hint('Dekati kotak biru di tanah, lalu tahan kartu menara. Terbang ke platform crane di tengah untuk slot menara tambahan. Kendali crane ada di pondasinya (kanan)',6);
}
/* no on-screen tutorial or info text: the player works the rules out alone. Only the error sound is kept. */
const say=(m)=>{if(/habis|butuh/.test(m))sfx('nope')};
const hint=()=>{};
/* expanding ring effect */
function ring(x,y,r0,r1,l,c){S.fx.push({ring:1,x,y,r0,r1,l,L:l,c,vx:0,vy:0,g:0})}
function puff(x,y,n,c){for(let i=0;i<n;i++)S.fx.push({x:x+rnd(-4,4),y:y+rnd(-4,4),vx:rnd(-30,30),vy:rnd(-50,-5),g:120,l:rnd(.3,.6),c})}

/* research queue: one project runs, up to RQMAX more wait their turn (paid when queued) */
const RQMAX=3;
const resQ=()=>S.res.q||(S.res.q=[]);
/* ---------- grid, towers, blueprints, hold actions ---------- */
function towerCost(ty){
  const n=S.towers.filter(t=>t.lv>0).length+S.bps.filter(b=>b.kind==='tower').length;
  return twBuildCost(ty,Math.max(2,Math.round(TW.cost[Math.min(n,TW.cost.length-1)]*(ty&&TY[ty].cost||1))));
}
/* show at most 5 cards: 4 options + a 'next page' card */
function paged(list,id,cap){
  cap=cap||8;   /* the dock has exactly 2 rows of 4 cards: never more than 8 cards including the 'next page' card */
  if(list.length<=cap)return list;
  const n=cap-1,pages=Math.ceil(list.length/n),p=(S.pg[id]||0)%pages,out=list.slice(p*n,p*n+n);
  out.push({key:'pg_'+id+p,kind:'page',icon:'next',label:'Pilihan lain',state:'ok',page:id,badge:(p+1)+'/'+pages,badgePlain:1});
  return out;
}
const towerBusy=t=>S.bps.some(b=>b.slot===t.i);
const ruinCost=t=>Math.max(1,Math.round((t.ruin.spent||0)/3));   /* a third of what was spent on building and upgrading it */
const shActive=t=>t.lv>=1&&t.sh>0&&!t.brk&&!towerBusy(t);
const TOOLC=[null,'#8ff0ff','#7dff9a','#c8ff6a','#ff7ae6','#ffd36b'];   /* welder shot colour per level */
/* ---------- build menu: the cards on offer depend on where the mechanic stands ---------- */
const ZONE=26;
const slotActive=t=>!t.pl||t.k<CR.n[(t.pl===2?S.crane2:S.crane).lv-1];
/* platform n (1 or 2): where it is and how wide; null when platform 2 is not built yet */
const PLAT=n=>{const c=n===2?S.crane2:S.crane;return{px:c.px,y:c.y,w:CR.w[c.lv-1]}};
const NMAP={'Bangun tower':'Bangun','Sedang dikerjakan':'Dibangun','Upgrade tower':'Naik Lv','Tower maks':'Maks','Upgrade shield':'Shield','Shield maks':'Shield','Upgrade aura lambat':'Aura','Aura maks':'Aura','Jual tower':'Jual','Crane naik':'Naik','Crane turun':'Turun','Putar kiri':'Kiri','Putar kanan':'Kanan','Upgrade crane kiri':'Crane kiri','Upgrade crane kanan':'Crane kanan','Upgrade crane':'Crane','Crane maks':'Crane','Isi energi core':'Isi core','Upgrade core':'Core','Las robot':'Las robot','Las robot maks':'Las robot','Pekerja baru':'Pekerja','Riset':'Riset','Upgrade alat las':'Alat las','Alat las maks':'Alat las','Pilihan lain':'Lainnya'};
function ctxOptions(){
  const s=S,m=s.m,o=[];
  if(!m.st||m.thr){s.pick=null;return o}
  const onP=m.st==='p',base=!onP&&m.x>=338,base2=!onP&&!base&&m.x<=22,nearCore=!onP&&!base&&!base2&&Math.abs(m.x-CX)<=ZONE;
  let tw=null,bd=ZONE+1;
  for(const t of s.towers){if(base||base2||(t.pl||0)!==(onP?m.pf:0)||!slotActive(t))continue;const dd=Math.abs(m.x-t.x);if(dd<bd){bd=dd;tw=t}}
  if(tw){
    const i=tw.i;
    if(towerBusy(tw)){
      const bp=s.bps.find(b=>b.slot===i),ic=bp.kind==='tower'?TICON(bp.ty||'g'):bp.what==='sh'?'shield':bp.what==='au'?'slow':'towerup';
      o.push({key:'tw'+i+'b'+ic,kind:'tbuild',icon:ic,label:'Sedang dikerjakan',state:'busy',tw,prog:bp.prog});
    }else if(tw.lv===0&&tw.ruin){
      const rn=tw.ruin;
      o.push({key:'tw'+i+'rp'+rn.lv+rn.ty,kind:'tbuild',icon:TICON(rn.ty),badge:String(rn.lv),label:'Perbaiki tower',nm:'Perbaiki',cost:ruinCost(tw),tw,rebuild:1});
      o.push({key:'tw'+i+'clr',kind:'sell',icon:'sell',label:'Bongkar rongsokan',nm:'Bongkar',gain:0,tw,clear:1,state:'ok'});
    }else if(tw.lv===0){
      if(s.pick===i){
        o.push(...paged(TORDER.filter(twOwn).map(ty=>({key:'tw'+i+ty,kind:'tbuild',icon:TICON(ty),label:'Tower '+TY[ty].name,cost:towerCost(ty),tw,ty})),'tw',onP?7:8));
      }else o.push({key:'tw'+i+'h',kind:'hub',icon:'hub',label:'Bangun tower',state:'ok',tw});
    }else{
      const ti=TICON(tw.ty||'g');
      if(tw.lv<twMax(tw.ty)&&tw.lv>=towerCap())o.push({key:'tw'+i+'ck'+tw.lv,kind:'tup',icon:ti,badge:String(tw.lv+1),label:'Butuh upgrade core Lv '+coreNeed(tw.lv+1),nm:'Core Lv '+coreNeed(tw.lv+1),tw,state:'locked'});
      else if(tw.lv<twMax(tw.ty))o.push({key:'tw'+i+'u'+tw.lv,kind:'tup',icon:ti,badge:String(tw.lv+1),label:'Upgrade tower',cost:twUpCost(tw.ty,tw.lv),tw});
      else o.push({key:'tw'+i+'m',kind:'tup',icon:ti,label:'Tower maks',state:'max',tw});
      if(tw.sh<SH.max)o.push({key:'tw'+i+'s'+tw.sh,kind:'tup',icon:'shield',badge:String(tw.sh+1),label:'Upgrade shield',cost:SH.up[tw.sh],tw,shield:1,state:s.res.shield?undefined:'locked'});
      else o.push({key:'tw'+i+'sm',kind:'tup',icon:'shield',label:'Shield maks',state:'max',tw,shield:1});
      if(tw.au<SL.max)o.push({key:'tw'+i+'a'+tw.au,kind:'tup',icon:'slow',badge:String(tw.au+1),label:'Upgrade aura lambat',cost:SL.up[tw.au],tw,aura:1,state:s.res.slow?undefined:'locked'});
      else o.push({key:'tw'+i+'am',kind:'tup',icon:'slow',label:'Aura maks',state:'max',tw,aura:1});
      o.push({key:'tw'+i+'sell'+(tw.spent||0),kind:'sell',icon:'sell',label:'Jual tower',gain:Math.floor((tw.spent||0)/2),tw,state:'ok'});
    }
  }
  if(!(nearCore?(s.pick==='core'||s.pick==='wpn'):tw&&s.pick===tw.i))s.pick=null;
  if(base){
    o.push({key:'cup',kind:'ctl',icon:'ar_u',label:'Crane naik',state:'ok',ctl:'up'});
    o.push({key:'cdn',kind:'ctl',icon:'ar_d',label:'Crane turun',state:'ok',ctl:'dn'});
    o.push({key:'cl',kind:'ctl',icon:'ar_l',label:'Putar kiri',state:'ok',ctl:'l'});
    o.push({key:'cr',kind:'ctl',icon:'ar_r',label:'Putar kanan',state:'ok',ctl:'r'});
  }
  if(base2){
    o.push({key:'c2up',kind:'ctl',icon:'ar_u',label:'Crane kiri naik',nm:'Naik',state:'ok',ctl:'up2'});
    o.push({key:'c2dn',kind:'ctl',icon:'ar_d',label:'Crane kiri turun',nm:'Turun',state:'ok',ctl:'dn2'});
    o.push({key:'c2l',kind:'ctl',icon:'ar_l',label:'Geser kiri',nm:'Kiri',state:'ok',ctl:'l2'});
    o.push({key:'c2r',kind:'ctl',icon:'ar_r',label:'Geser kanan',nm:'Kanan',state:'ok',ctl:'r2'});
  }
  if(onP){
    const pn=m.pf===2?2:1,cr=pn===2?s.crane2:s.crane;
    if(cr.lv<CR.max)o.push({key:'cr'+pn+cr.lv,kind:'crane',icon:'crane',badge:String(cr.lv+1),label:'Upgrade crane '+(pn===2?'kiri':'kanan'),cost:CR.up[cr.lv],crane:pn});
    else o.push({key:'crm'+pn,kind:'crane',icon:'crane',label:'Crane maks',state:'max',crane:pn});
  }
  if(nearCore){
    if(s.pick==='core'){
      const cur=s.res.cur,rq=resQ(),L=[];
      for(const k of RESK){
        if(s.res[k])continue;
        const R2=RES[k],ic=R2.icon||k,qi=rq.indexOf(k);
        if(cur&&cur.key===k)L.push({key:'rs_'+k,kind:'res',icon:ic,corner:'research',label:'Riset '+R2.name,state:'busy',prog:cur.t/R2.time,rkey:k});
        else if(qi>=0)L.push({key:'rs_'+k+'q',kind:'res',icon:ic,corner:'research',label:'Batalkan antrian '+R2.name,nm:'Batal',gain:R2.cost,state:'ok',badge:String(qi+1),badgePlain:1,rkey:k,cancel:1});
        else L.push({key:'rs_'+k,kind:'res',icon:ic,corner:'research',label:'Riset '+R2.name,cost:R2.cost,state:cur&&rq.length>=RQMAX?'busy':undefined,rkey:k});
      }
      o.push(...paged(L,'rs'));
    }else if(s.pick==='wpn'){
      const L=[];
      if(s.tool<3)L.push({key:'weld'+s.tool,kind:'weld',icon:'weld',badge:String(s.tool+1),label:'Upgrade alat las',cost:TOOLCOST[s.tool+1],fire:2});
      else L.push({key:'weldm',kind:'weld',icon:'weld',label:'Alat las maks',state:'max'});
      for(const k of PWK){
        const lv=s.wp[k];
        if(lv<3)L.push({key:'wp'+k+lv,kind:'weld',icon:'wp_'+k,badge:String(lv+1),label:(lv?'Upgrade ':'Pasang ')+PW[k].name,cost:PW[k].cost[lv+1],wp:k});
        else L.push({key:'wp'+k+'m',kind:'weld',icon:'wp_'+k,label:PW[k].name+' maks',state:'max'});
      }
      o.push(...paged(L,'wp'));
    }else{
      if(s.hp<s.maxHp)o.push({key:'fuel',kind:'fuel',icon:'fuel',label:'Isi energi core',cost:1,fire:1});
      if(s.coreLv<CORE.max)o.push({key:'core'+s.coreLv,kind:'core',icon:'core',badge:String(s.coreLv+1),label:'Upgrade core',cost:CORE.up[s.coreLv],core:1});
      if(s.botw<BOTW.max)o.push({key:'bw'+s.botw,kind:'botw',icon:'worker',corner:'weld',badge:String(s.botw+1),label:'Las robot',cost:BOTW.up[s.botw+1],botw:1});
      else o.push({key:'bwm',kind:'botw',icon:'worker',corner:'weld',label:'Las robot maks',state:'max',botw:1});
      o.push({key:'wk'+s.bots.length,kind:'worker',icon:'worker',badge:s.bots.length<MAXBOTS?'+':'',label:'Pekerja baru',cost:10,worker:1,state:s.bots.length<MAXBOTS?undefined:'max'});
      const left=RESK.some(k=>!s.res[k]);
      o.push({key:'rs',kind:'hub',icon:'research',label:'Riset',state:left?'ok':'max',core:1});
    }
  }
  if(o.length>8){const keep=o.filter(x=>x.kind!=='page');o.length=0;o.push(...paged(keep,'all'))}   /* safety net: never more than 2 rows */
  for(const x of o){
    if(!x.state)x.state=s.coins>=x.cost?'ok':'poor';
    if(!x.nm)x.nm=NMAP[x.label]||(x.rkey?(x.label.startsWith('Antri')?'Antri ':'')+RNM[x.rkey]:/^Tower /.test(x.label)?x.label.slice(6):x.label.replace(/^(Upgrade|Pasang) /,'').replace(/ maks$/,''));
  }
  return o;
}
/* where the in-world progress bar for a held card is drawn */
function optPos(o){
  if(o.kind==='ctl')return[o.ctl.endsWith('2')?CLMX+4:CRMX-4,GW-30];
  if(o.tw)return[o.tw.x,o.tw.y-34];
  if(o.fire)return[CX,GW-38];
  return[S.m.x,S.m.y-34];
}
function completeHold(o){
  const s=S;
  if(o.fire===1){
    if(s.hp>=s.maxHp)return say('Core sudah penuh',1.2);
    if(s.coins<1)return say('Suku cadang habis');
    s.coins--;s.hp=Math.min(s.maxHp,s.hp+4);sfx('fuel');puff(CX,GW-14,6,'#8ff0ff');ring(CX,GW-17,4,26,.35,'#8ff0ff');return say('Core diisi energi',1.6);
  }
  if(o.fire===2){
    if(s.tool>=3)return say('Alat las sudah maksimal');
    const c=TOOLCOST[s.tool+1];
    if(s.coins<c)return say('Upgrade alat las butuh '+c+' suku cadang');
    s.coins-=c;s.tool++;sfx('power');puff(CX,GW-20,12,'#8ff0ff');return say('Alat las naik ke Lv '+s.tool,2.2);
  }
  if(o.kind==='hub'){s.pick=o.wpn?'wpn':o.core?'core':o.tw.i;sfx('click');return}
  if(o.clear){const t=o.tw;if(t.lv||!t.ruin||towerBusy(t))return;t.ruin=null;sfx('pickup');puff(t.x,t.y-8,10,'#a9bccf');return}
  if(o.kind==='sell'){   /* sell: half of everything spent on building and upgrading this tower */
    const t=o.tw;if(!t.lv||towerBusy(t))return;
    s.coins+=o.gain;sfx('pickup');puff(t.x,t.y-12,12,'#a9bccf');ring(t.x,t.y-10,4,26,.35,'#a9bccf');
    for(let k=0;k<Math.min(8,o.gain);k++)s.fx.push({x:t.x,y:t.y-14,vx:rnd(-40,40),vy:rnd(-90,-40),g:300,l:.6,c:'#a9bccf',s:2});
    clearTower(t);return;
  }
  if(o.kind==='page'){s.pg[o.page]=(s.pg[o.page]||0)+1;sfx('click');return}
  if(o.wp){
    const k=o.wp,lv=s.wp[k];if(lv>=3)return;
    const c=PW[k].cost[lv+1];if(s.coins<c)return say('Senjata butuh '+c+' suku cadang');
    s.coins-=c;s.wp[k]++;sfx('power');puff(CX,GW-20,12,'#8ff0ff');ring(s.m.x,s.m.y-10,4,30,.4,'#8ff0ff');return;
  }
  if(o.kind==='res'){
    const R2=RES[o.rkey];
    const rq=resQ();
    if(o.cancel){const qi=rq.indexOf(o.rkey);if(qi>=0){rq.splice(qi,1);s.coins+=R2.cost;sfx('coin');ring(s.m.x,s.m.y-10,3,22,.3,'#ffe08a')}return}
    if(s.res[o.rkey]||(s.res.cur&&s.res.cur.key===o.rkey)||rq.includes(o.rkey))return;
    if(s.coins<R2.cost)return say('Riset butuh '+R2.cost+' suku cadang');
    if(s.res.cur){   /* another project is running: wait in line */
      if(rq.length>=RQMAX){sfx('nope');return}
      s.coins-=R2.cost;rq.push(o.rkey);sfx('blueprint');return;
    }
    s.coins-=R2.cost;s.res.cur={key:o.rkey,t:0};sfx('blueprint');
    return say('Riset '+R2.name+' dimulai ('+R2.time+' detik)',3);
  }
  if(o.kind==='botw'){
    if(s.botw>=BOTW.max)return;
    const c=BOTW.up[s.botw+1];
    if(s.coins<c)return say('Butuh '+c+' suku cadang');
    s.coins-=c;s.botw++;sfx('power');puff(CX,GW-14,10,'#8ff0ff');ring(CX,GW-10,4,34,.5,'#8ff0ff');
    return;
  }
  if(o.kind==='worker'){
    if(s.bots.length>=MAXBOTS)return say('Pekerja sudah maksimal');
    if(s.coins<10)return say('Pekerja butuh 10 suku cadang');
    s.coins-=10;s.bots.push(mkBot(CX+rnd(-14,14)));sfx('built');puff(CX,GW-12,10,'#8ff0ff');ring(CX,GW-8,4,30,.4,'#ffd36b');
    return;
  }
  if(o.kind==='core'){
    if(s.coreLv>=CORE.max)return say('Core sudah level maksimal');
    const c=CORE.up[s.coreLv];
    if(s.coins<c)return say('Upgrade core butuh '+c+' suku cadang');
    s.coins-=c;s.coreLv++;const nm=CORE.hp[s.coreLv-1];s.hp+=nm-s.maxHp;s.maxHp=nm;
    sfx('power');puff(CX,GW-16,14,'#8ff0ff');ring(CX,GW-17,6,70,.7,'#8ff0ff');
    return say('Core Lv '+s.coreLv+': HP maks '+nm,2.6);
  }
  if(o.crane){
    const cr=o.crane===2?s.crane2:s.crane;
    if(cr.lv>=CR.max)return say('Crane sudah level maksimal');
    const c=CR.up[cr.lv];
    if(s.coins<c)return say('Upgrade crane butuh '+c+' suku cadang');
    s.coins-=c;cr.lv++;sfx('power');puff(cr.px,cr.y,14,'#ffd36b');
    return say('Crane Lv '+cr.lv+': platform lebih luas, tinggi maks '+CR.h[cr.lv-1]+', '+CR.n[cr.lv-1]+' slot menara',3);
  }
  if(o.tw){
    const tw=o.tw;
    if(o.rebuild){
      if(tw.lv||!tw.ruin||towerBusy(tw))return;
      const c=ruinCost(tw);
      if(s.coins<c)return say('Perbaikan butuh '+c+' suku cadang');
      s.coins-=c;
      s.bps.push({kind:'rebuild',slot:tw.i,x:tw.x,top:tw.y,prog:0,w:26,work:4+tw.ruin.lv*1.2,rl:tw.ruin.lv});
      s.pick=null;sfx('blueprint');puff(tw.x,tw.y-8,8,'#8ff0ff');return;
    }
    if(tw.lv===0){
      if(towerBusy(tw))return;
      const c=towerCost(o.ty);
      if(s.coins<c)return say('Menara butuh '+c+' suku cadang');
      s.coins-=c;tw.spent=c;
      s.bps.push({kind:'tower',slot:tw.i,x:tw.x,top:tw.y,prog:0,w:26,work:8.5,ty:o.ty||'g'});
      s.pick=null;sfx('blueprint');puff(tw.x,tw.y-8,8,'#8ff0ff');
      return say('Cetak biru menara terpasang. Robot datang membangun, kamu bisa membantu.',2.8);
    }
    if(towerBusy(tw))return;
    if(o.aura){
      if(tw.au>=SL.max)return;
      const c=SL.up[tw.au];
      if(s.coins<c)return say('Aura butuh '+c+' suku cadang');
      s.coins-=c;tw.spent=(tw.spent||0)+c;
      s.bps.push({kind:'tup',what:'au',slot:tw.i,x:tw.x,top:tw.y,prog:0,w:26,work:2+tw.au*1.3});
      sfx('blueprint');return;
    }
    if(o.shield){
      if(tw.sh>=SH.max)return say('Shield sudah level maksimal');
      const c=SH.up[tw.sh];
      if(s.coins<c)return say('Shield butuh '+c+' suku cadang');
      s.coins-=c;tw.spent=(tw.spent||0)+c;
      s.bps.push({kind:'tup',what:'sh',slot:tw.i,x:tw.x,top:tw.y,prog:0,w:26,work:2+tw.sh*1.3});
      sfx('blueprint');return say('Robot memasang shield. Menara nonaktif selama pengerjaan.',2.8);
    }
    if(tw.lv>=twMax(tw.ty))return say('Menara sudah level maksimal');
    if(tw.lv>=towerCap())return;
    const c=twUpCost(tw.ty,tw.lv);
    if(s.coins<c)return say('Upgrade menara butuh '+c+' suku cadang');
    s.coins-=c;tw.spent=(tw.spent||0)+c;
    s.bps.push({kind:'tup',what:'lv',slot:tw.i,x:tw.x,top:tw.y,prog:0,w:26,work:3+tw.lv});
    sfx('blueprint');return say('Robot meng-upgrade menara. Menara nonaktif selama pengerjaan.',2.8);
  }
}
/* ---------- daytime lure: call one small raid of 4 drones per day ---------- */
const LUREMAX=4,LUREPAR=2;   /* up to 4 lure raids per day, at most 2 on the field at once (a raid counts until all its drones are gone) */
const canLure=()=>!!S&&running&&!paused&&!S.over&&!S.nightOn&&(S.lures||0)<LUREMAX&&(S.lq||[]).length<LUREPAR&&S.t<DAY-4;
function lure(){
  if(!canLure())return;
  const s=S;s.lures=(s.lures||0)+1;s.wv=waveInfo(s.day);
  (s.lq||(s.lq=[])).push({id:s.lid=(s.lid||0)+1,n:8,t:0});   /* they arrive one at a time, see update() */
  sfx('night');
}
/* ---------- knockback aura: a shockwave around the mechanic, costs 3/4 of the jetpack battery ---------- */
/* the shock front grows from the mechanic at sp units/s; drones are thrown when the front reaches them */
const BLAST={cost:.75,r:192,pow:540,sp:48,dmg:5};
const canBlast=()=>!!S&&running&&!paused&&!S.over&&S.m.bat>=MECH.bat*BLAST.cost-1e-6;
function blast(){
  if(!S||!running||paused||S.over)return;
  if(!canBlast()){sfx('nope');return}
  const s=S,m=s.m,cx=m.x,cy=m.y-10;
  m.bat-=MECH.bat*BLAST.cost;
  (s.waves||(s.waves=[])).push({x:cx,y:cy,r:4,hit:new Set()});
  s.fx.push({light:1,x:cx,y:cy,r:90,rgb:'143,240,255',a:1,l:.5,L:.5,vx:0,vy:0,g:0});
  for(let i=0;i<36;i++){const a=i/36*6.283,v=rnd(40,65);s.fx.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,l:rnd(1.2,1.8),c:i%3?'#8ff0ff':'#ffffff',s:2})}
  s.shake=Math.max(s.shake,.4);sfx('blast');
}
/* ---------- jetpack ---------- */
const jetIn={on:false,x:0,y:0};   /* thruster input: on while a finger is down, x/y steer between -1 and 1 */
function canFly(){
  if(!S||!running||paused||S.over)return false;
  if(S.m.bat<.4){say('Batre jetpack habis. Matahari akan mengisinya lagi.',1.6);return false}
  return true;
}

/* ---------- day / night ---------- */
function newDay(){
  const s=S;s.t-=CYC;s.nightOn=false;s.lures=0;
  for(const d of s.drones)puff(d.x,d.y,5,'#8a96a8');
  for(const d of s.drones){d.flee=true;d.chase=false}   /* survivors of the night fly off instead of vanishing */
  s.queue=[];s.lq=[];
  const bonus=6+2*s.day;s.coins+=bonus;s.day++;
  if(s.day-1>best){best=s.day-1;try{localStorage.setItem('mr_best',String(best))}catch(e){}}
  if(s.run&&s.run.len&&s.day-1>=s.run.len){s.over=true;onWin();return}
  s.hp=Math.min(s.maxHp,s.hp+3);
  for(const t of s.towers)if(t.sh){t.shHp=SH.hp[t.sh];t.brk=false}   /* shields come back at dawn */
  for(const t of s.towers){
    if(t.lv)t.hp=Math.min(towerMaxHp(t),t.hp+towerMaxHp(t)*.5);   /* crews patch half the damage overnight */
    if(t.ty==='solar'&&t.lv){s.coins+=TY.solar.parts[t.lv];puff(t.x,t.y-TWH[t.lv]-8,5,'#ffd36b')}
  }
  sfx('dawn');
  const nx=waveInfo(s.day);
  say('Fajar. Bonus selamat +'+bonus+' suku cadang. Gelombang berikutnya: '+nx.n+' drone'+(nx.boss?' dan 1 bos':'')+'.',4);
  for(let i=0;i<Math.min(bonus,10);i++)s.fx.push({x:CX+rnd(-20,20),y:GW-40-rnd(0,20),vx:rnd(-20,20),vy:-rnd(30,70),g:300,l:.8,c:'#a9bccf',s:2});
}
function startNight(){
  const s=S,w=waveInfo(s.day);s.wv=w;
  const q=[];let heavy=0;
  for(let i=0;i<w.n;i++){const h=Math.random()<w.hv;if(h)heavy++;q.push(h?'h':'s')}
  /* every wave also brings swarms of tiny drones that arrive in a tight crowd */
  const sw=Math.min(36,Math.round(2+.5*s.day+.04*s.day*s.day)),parts=s.day>=6?2:1;
  for(let p=0;p<parts;p++){const cnt=Math.round(sw/parts),at=Math.floor(Math.random()*(q.length+1));q.splice(at,0,...Array(cnt).fill('m'))}
  if(w.boss)q.unshift('b');
  s.queue=q;s.quota=q.length;s.spawnT=1.5;
  sfx('night');
  say('Gelombang '+s.day+': '+w.n+' drone'+(heavy?' ('+heavy+' berat)':'')+(w.boss?' dan 1 bos':'')+'. Lindungi core energimu!',3.6);
}
/* number of body variants per drone class: scout, heavy, boss */
const DVAR={s:4,h:3,b:2,m:2};
function spawnDrone(kind,sx){
  const s=S,w=s.wv||waveInfo(s.day);
  let hp,dmg,wd,ht,sp,heavy=false,boss=false,drop=1;
  if(kind==='m'){hp=Math.max(1,Math.round(.3*w.hpm));dmg=.45*w.dmm;wd=5;ht=3;sp=rnd(78,96)*w.spm;drop=Math.random()<.35?1:0}
  else if(kind==='b'){boss=true;hp=Math.round(WAVE.bossHp*w.hpm);dmg=WAVE.bossDmg*w.dmm;wd=24;ht=10;sp=24*w.spm;drop=14}
  else if(kind==='h'){heavy=true;hp=Math.round(9*w.hpm);dmg=2*w.dmm;wd=13;ht=7;sp=40*w.spm;drop=4}
  else{hp=Math.max(2,Math.round(2*w.hpm));dmg=1*w.dmm;wd=8;ht=4;sp=rnd(58,72)*w.spm;drop=2}
  hp=devEnemy(kind,'hp',s.day);dmg=devEnemy(kind,'dmg',s.day);   /* Dev menu */
  s.drones.push({x:sx!==undefined?sx:rnd(20,W-20),y:Math.max(-24,camY-24),hp,max:hp,heavy,boss,drop,w:wd,h:ht,sp,dmg,ph:rnd(0,6),hit:0,cd:0,ox:rnd(-12,12),atk:null,atkY:0,v:(Math.random()*(boss?DVAR.b:heavy?DVAR.h:kind==='m'?DVAR.m:DVAR.s))|0,swarm:kind==='m'});
}
function walk(b,tx,sp,dt){
  const dx=tx-b.x;
  if(Math.abs(dx)>1){b.x+=Math.sign(dx)*Math.min(Math.abs(dx),sp*dt);b.dir=Math.sign(dx);b.mv=1;return false}
  b.mv=0;return true;
}
