/* ---------- workshop: tower catalogue (list, full numbers, live preview of every tower type) ---------- */
const TWINFO={
  g:{d:'Penembak serba bisa: damage, jangkauan, akurasi dan peluang kritis semuanya sedang. Tidak ada yang menonjol, tidak ada kelemahan besar.'},
  f:{d:'Damage per detik tertinggi dan membakar semua drone di kerucut apinya, tapi jangkauannya paling pendek.'},
  mortar:{d:'Melontarkan peluru yang meledak di area. Jangkauan jauh, tapi akurasinya rendah, lambat, dan punya titik buta di dekat menara.'},
  gatling:{d:'Menyemburkan peluru lemah sangat cepat. DPS tinggi dan jangkauan menengah, tetapi banyak peluru meleset.'},
  sniper:{d:'Jangkauan paling jauh dan hampir tidak pernah meleset. Satu tembakan keras, tapi sangat lambat, punya titik buta, dan rapuh.'},
  tesla:{d:'Petir yang melompat dari drone ke drone, sesekali membuat drone tersetrum dan bergerak kacau.'},
  rocket:{d:'Rudal pelacak berdamage besar. Mengutamakan drone berat dan bos.'},
  laser:{d:'Sinar menerus. Damage per detik naik sampai 3x selama tetap mengenai satu target.'},
  emp:{d:'Denyut berkala yang membuat semua drone di sekitarnya lumpuh sesaat.'},
  net:{d:'Menjerat satu drone di tempat sehingga menara lain mudah menghabisinya.'},
  decoy:{d:'Suar umpan: drone di sekitarnya menyerangnya lebih dulu. Punya HP dan kembali saat fajar.'},
  magnet:{d:'Menarik suku cadang yang jatuh dan memberi bonus suku cadang untuk drone yang mati di jangkauannya.'},
  repair:{d:'Dok perbaikan: saat malam memulihkan shield di sekitarnya dan juga core.'},
  solar:{d:'Panel surya: mempercepat isi ulang jetpack dan memberi suku cadang tiap fajar.'}
};
const TWDEF={g:'Gun',f:'Api'};
const twName=ty=>TY[ty].name;
const twHpAt=(ty,L)=>ty==='decoy'?TY.decoy.hp[L]:devTwHp(ty,L);
/* rows: [label, value at level, unit, decimals] */
function twRows(ty,L){
  const Y=TY[ty],r=[];
  const add=(n,val,u)=>r.push([n,val,u||'']),pc=a=>Math.round(a*100);
  if(ty==='g'){add('Damage',Y.dmg[L]);add('Jeda tembak',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%');add('Peluang kritis (2x)',pc(Y.crit[L]),'%');add('DPS',Y.dmg[L]/Y.cd[L])}
  else if(ty==='f'){add('Damage/tick',Y.dmg[L]);add('Jeda tick',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',100,'%');add('DPS',Y.dmg[L]/Y.cd[L]);add('Sudut kerucut',Math.round(Y.cone*2*57.3),'°')}
  else if(ty==='mortar'){add('Damage',Y.dmg[L]);add('Area ledak',Y.spl[L]);add('Jeda tembak',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%');add('Titik buta',Y.min);add('DPS',Y.dmg[L]/Y.cd[L])}
  else if(ty==='gatling'){add('Damage',Y.dmg[L]);add('Jeda tembak',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%');add('DPS (jika kena)',Y.dmg[L]/Y.cd[L]);add('DPS rata-rata',Y.dmg[L]/Y.cd[L]*Y.acc[L])}
  else if(ty==='sniper'){add('Damage',Y.dmg[L]);add('Jeda tembak',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%');add('Titik buta',Y.min);add('DPS',Y.dmg[L]/Y.cd[L])}
  else if(ty==='tesla'){add('Damage',Y.dmg[L]);add('Lompatan',Y.jump[L]);add('Jeda sambar',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Peluang setrum',pc(Y.shock[L]),'%');add('DPS (1 target)',Y.dmg[L]/Y.cd[L])}
  else if(ty==='rocket'){add('Damage',Y.dmg[L]);add('Jeda tembak',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%');add('DPS',Y.dmg[L]/Y.cd[L])}
  else if(ty==='laser'){add('Damage/detik',Y.dmg[L]);add('Maks (3x)',Y.dmg[L]*3);add('Jangkauan',Y.rng[L])}
  else if(ty==='emp'){add('Damage',Y.dmg[L]);add('Lumpuh',Y.stun[L],'s');add('Jeda denyut',Y.cd[L],'s');add('Jangkauan',Y.rng[L])}
  else if(ty==='net'){add('Tahan',Y.hold[L],'s');add('Jeda lempar',Y.cd[L],'s');add('Jangkauan',Y.rng[L]);add('Akurasi',pc(Y.acc[L]),'%')}
  else if(ty==='decoy'){add('HP umpan',Y.hp[L]);add('Jangkauan pancing',Y.rng[L])}
  else if(ty==='magnet'){add('Jangkauan',Y.rng[L]);add('Bonus/kill',Y.bonus[L]);add('Dorongan',Y.push[L]);add('Jeda tarik',Y.pcd[L],'s')}
  else if(ty==='repair'){add('Pulih shield',Y.heal[L]);add('Pulih core',Y.core[L]);add('Jeda',Y.cd[L],'s');add('Jangkauan',Y.rng[L])}
  else if(ty==='solar'){add('Isi jetpack',Math.round(Y.chg[L]*100),'%');add('Suku cadang/fajar',Y.parts[L])}
  add('HP menara',twHpAt(ty,L));
  add('Core dibutuhkan','Lv '+coreNeed(L));
  return r;
}
let twSel='g',twLv=3;
const TWD={t:0,dr:[],fx:[],pr:[],bl:[],sig:'',cd:0,tw:{x:0,ang:0,fl:0},laserT:0,loot:[],hpD:1};
const PVW=360,PVH=200,TWGY=172;
const twCan=$('twCan'),twG=twCan.getContext('2d');
/* where the shots really leave each tower type, measured on its sprite: pivot height above the ground and barrel length */
function twGeo(ty,L){
  const hh=TWH[L];
  switch(ty){
    case 'mortar':return{h:4+Math.round(hh*.6)+2,len:9};
    case 'rocket':return{h:hh+7,len:0};
    case 'tesla':return{h:hh+14,len:0};
    case 'laser':return{h:hh+4,len:7};
    case 'emp':return{h:hh+11,len:0};
    case 'net':return{h:hh+3,len:7};
    case 'decoy':case 'magnet':case 'repair':case 'solar':return{h:hh+8,len:0};
    default:return{h:hh+3,len:TWL[L]*(ty==='sniper'?1.7:ty==='gatling'?.85:1)};
  }
}
function twTip(ty,L,ang){const G=twGeo(ty,L),kk=TWD.kk;let a=ang;if(ty==='mortar')a=-Math.PI/2+clamp(Math.cos(ang),-1,1)*.55;return[Math.cos(a)*G.len*kk,(G.h-Math.sin(a)*G.len)*kk]}
function twReset(){
  const Y=TY[twSel],L=twLv,rng=Y.rng&&Y.rng[L]||90;
  Object.assign(TWD,{dr:[],fx:[],pr:[],bl:[],loot:[],t:0,cd:.5,laserT:0,hpD:1,pulse:0,sc:Math.round(clamp((PVW/2-8)/Math.max(rng,60),.8,1)*20)/20});
  TWD.rng=rng;TWD.tw={x:0,ang:-Math.PI/2,fl:0};
  TWD.tsc=TWD.sc;TWD.kk=1;   /* sprite scale vs world scale */
  TWD.pv=[0,twGeo(twSel,twLv).h*TWD.kk];
  TWD.best=TWBEST[twSel];TWD.want=TWD.best.n;
  for(let i=0;i<TWD.want;i++)twSpawn(true);
}
function twDps(){const Y=TY[twSel],L=twLv;
  if(twSel==='g'||twSel==='gatling'||twSel==='sniper'||twSel==='f'||twSel==='mortar'||twSel==='tesla'||twSel==='rocket')return Y.dmg[L]/Y.cd[L];
  if(twSel==='laser')return Y.dmg[L]*1.6;if(twSel==='emp')return Y.dmg[L]/Y.cd[L];return 0}
/* the enemy type and head-count each tower handles best (s scout, m mite swarm, h heavy, b boss) */
const TWBEST={
  g:{k:'s',n:4,w:'Pengintai ×4',why:'Satu per satu, sasaran ringan dan sedang'},
  f:{k:'m',n:9,w:'Kawanan tungau ×9',why:'Api menyapu semua yang ada di kerucut'},
  mortar:{k:'h',n:3,w:'Drone berat ×3',why:'Lambat dan bergerombol, kena ledakan area'},
  gatling:{k:'s',n:5,w:'Pengintai ×5',why:'Banyak peluru ringan, sasaran cepat'},
  sniper:{k:'b',n:1,w:'Bos ×1',why:'Satu tembakan keras ke sasaran besar'},
  tesla:{k:'m',n:8,w:'Kawanan tungau ×8',why:'Petir melompat ke banyak sasaran rapat'},
  rocket:{k:'h',n:2,w:'Drone berat ×2',why:'Rudal pelacak, damage besar per target'},
  laser:{k:'b',n:1,w:'Bos ×1',why:'Damage naik 3x selama satu sasaran bertahan'},
  emp:{k:'s',n:7,w:'Pengintai ×7',why:'Satu denyut melumpuhkan semuanya'},
  net:{k:'h',n:2,w:'Drone berat ×2',why:'Dijerat dulu, lalu dihabisi tower lain'},
  decoy:{k:'s',n:6,w:'Pengintai ×6',why:'Terpancing menyerang umpan'},
  magnet:{k:'s',n:5,w:'Pengintai ×5',why:'Tiap drone mati memberi bonus suku cadang'},
  repair:{k:null,n:3,w:'Tidak menyerang',why:'Memulihkan shield dan core saat malam'},
  solar:{k:null,n:3,w:'Tidak menyerang',why:'Memberi suku cadang dan isi jetpack'}
};
const TWKIND={s:{w:12,h:6,m:2.6,n:'Pengintai'},m:{w:7,h:4,m:1,n:'Tungau'},h:{w:20,h:9,m:7,n:'Drone berat'},b:{w:30,h:10,m:18,n:'Bos'}};
function twSpawn(near){
  const k=TWD.best.k||'s',KD=TWKIND[k],heavy=k==='h'||k==='b',rng=TWD.rng,side=Math.random()<.5?-1:1,sc=TWD.sc,halfW=PVW/2/sc;
  const x=near?side*rnd(rng*.35,Math.min(halfW-6,rng*.9)):side*(Math.min(halfW,rng*1.25)+8),y=rnd(26,Math.max(40,(TWGY-16)/sc*.9));
  const dps=Math.max(twDps(),2),mx=dps*KD.m;
  TWD.dr.push({x,y,hp:mx,mx,heavy,k,w:KD.w,h:KD.h,ph:rnd(0,6),hit:0,stun:0,pin:0,burn:0,kb:0});
}
const twNear=(r,min)=>{let b=null,bd=r;for(const d of TWD.dr){if(d.dead)continue;const dd=Math.hypot(d.x,d.y-8);if(dd<bd&&dd>=(min||0)){bd=dd;b=d}}return b};
function twHit(d,dmg,c){d.hp-=dmg;d.hit=.1;for(let i=0;i<2;i++)TWD.fx.push({x:d.x,y:d.y,vx:rnd(-40,40),vy:rnd(10,60),g:-160,l:rnd(.15,.3),c:c||'#e6fbff'})}
function twBolt(x1,y1,x2,y2,c,l,th){TWD.bl.push({x1,y1,x2,y2,l:l||.12,c,th})}
function twStep(dt){
  const T=TWD,Y=TY[twSel],L=twLv,ty=twSel,rng=T.rng;T.t+=dt;T.cd-=dt;T.tw.fl=Math.max(0,T.tw.fl-dt);
  /* drones fly in and hover inside the reach */
  for(const d of T.dr){
    d.ph+=dt;d.hit=Math.max(0,d.hit-dt);d.stun=Math.max(0,d.stun-dt);d.pin=Math.max(0,d.pin-dt);d.burn=Math.max(0,d.burn-dt);
    if(d.burn>0)d.hp-=Math.max(.4,twDps()*.25)*dt;
    if(d.kb>0){d.kb-=dt;continue}
    if(d.pin>0)continue;
    const dx=-d.x,dy=8-d.y,dd=Math.hypot(dx,dy)||1,stop=Math.min(PVW/2/T.sc*.8,ty==='decoy'?Math.max(20,rng*.35):rng*.62+(d.heavy?-4:6)),sp=(d.stun>0?0:24+(d.heavy?0:12));
    if(d.stun>0){d.x+=rnd(-24,24)*dt;d.y+=rnd(-24,24)*dt}
    else if(dd>stop){d.x+=dx/dd*sp*dt;d.y+=dy/dd*sp*dt}
    else{d.x+=Math.sin(d.ph*2.1)*9*dt;d.y+=Math.cos(d.ph*2.7)*6*dt}
    d.y=clamp(d.y,6,(TWGY-10)/T.sc);
  }
  for(const d of T.dr)if(d.hp<=0&&!d.dead){
    d.dead=1;for(let i=0;i<12;i++){const a=rnd(0,6.28),v=rnd(30,90);T.fx.push({x:d.x,y:d.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:-120,l:rnd(.25,.6),c:['#ffd36b','#ff9a3a','#5a6070','#ffffff'][i&3]})}
    T.pr.push({ring:1,x:d.x,y:d.y,t:0,l:.3,r:d.heavy?20:12,c:'#ffd36b'});sfx('boom');
    if(ty==='magnet'&&Math.hypot(d.x,d.y)<=rng)for(let i=0;i<1+Y.bonus[L];i++)T.loot.push({x:d.x+rnd(-5,5),y:d.y,vy:0,rest:0,t:0});
  }
  T.dr=T.dr.filter(d=>!d.dead);
  T.spawnT=(T.spawnT||0)-dt;if(T.dr.length<T.want&&T.spawnT<=0){twSpawn(false);T.spawnT=.8}
  const tx=T.pv[0],ty0=T.pv[1];   /* pivot of this tower type */
  const aim=t=>{T.tw.ang=Math.atan2(-(t.y-ty0),t.x-tx)};
  const mz=()=>twTip(ty,L,T.tw.ang);   /* where the shot starts: the muzzle / emitter of this type */
  const PL=projLook(ty,L);
  if((ty==='g'||ty==='gatling'||ty==='sniper')&&T.cd<=0){const t=twNear(rng,Y.min||0);if(t){T.cd=Y.cd[L];aim(t);T.tw.fl=.06;
    const k=Math.min(1,Math.hypot(t.x,t.y-ty0)/rng),hit=Math.random()<Y.acc[L]*(1-.35*Math.pow(k,1.6)),cr=ty==='g'&&Math.random()<Y.crit[L];
    const ex=hit?t.x:t.x+rnd(-14,14),ey=hit?t.y:t.y+rnd(-12,12),c=cr?'#fff3b0':PL.col;
    {const M=mz();T.pr.push({kind:'trace',x0:M[0],y0:M[1],x:ex,y:ey,t:0,l:ty==='sniper'?.16:.07,c,sz:PL.size,sh:PL.shape})}if(hit)twHit(t,Y.dmg[L]*(cr?2:1),cr?'#fff3b0':null);
    sfx(ty==='sniper'?'snipe':ty==='gatling'?'gat':'mg')}}
  if(ty==='f'){const t=twNear(rng);if(t){aim(t);T.tw.fl=.1;const a0=Math.atan2(t.y-ty0,t.x-tx);
    if(T.cd<=0){T.cd=.1;for(const d of T.dr){const aa=Math.atan2(d.y-ty0,d.x-tx);let da=Math.abs(aa-a0);if(da>3.14)da=6.28-da;if(Math.hypot(d.x,d.y-ty0)<=rng&&da<Y.cone){twHit(d,Y.dmg[L]);d.burn=2}}}
    {const M=mz();for(let i=0;i<3;i++){const a=a0+rnd(-Y.cone,Y.cone),v=rnd(90,150);T.fx.push({x:M[0],y:M[1],vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:-30,l:rng/v*rnd(.5,1),c:flameCols(L)[i%3],s:L>=8?3:2})}}
    if(Math.random()<dt*3)sfx('burn')}}
  if(ty==='mortar'&&T.cd<=0){const t=twNear(rng,Y.min);if(t){T.cd=Y.cd[L];aim(t);T.tw.fl=.1;const sc0=(1-Y.acc[L])*40;{const M=mz();T.pr.push({kind:'shell',lv:L,x0:M[0],y0:M[1],x1:t.x+rnd(-1,1)*sc0,y1:Math.max(4,t.y+rnd(-1,1)*sc0*.6),t:0,T:.9,spl:Y.spl[L],dmg:Y.dmg[L]})}sfx('mortar')}}
  if(ty==='tesla'&&T.cd<=0){const t=twNear(rng);if(t){T.cd=Y.cd[L];aim(t);T.tw.fl=.1;const seen=new Set();const M=mz();let cur=t,px=M[0],py=M[1];
    for(let j=0;j<Y.jump[L]&&cur;j++){seen.add(cur);twBolt(px,py,cur.x,cur.y,tierCol('tesla',L),.18,L>=5);twHit(cur,Y.dmg[L]*(1-j*.12),tierCol('tesla',L));if(Math.random()<.2)cur.stun=1;px=cur.x;py=cur.y;let nb=null,bd=60;for(const d of T.dr)if(!seen.has(d)&&!d.dead){const dd=Math.hypot(d.x-px,d.y-py);if(dd<bd){bd=dd;nb=d}}cur=nb}
    sfx('zap')}}
  if(ty==='rocket'&&T.cd<=0){const t=twNear(rng);if(t){T.cd=Y.cd[L];aim(t);T.tw.fl=.12;{const M=mz();T.pr.push({kind:'mis',lv:L,x:M[0],y:M[1],vx:0,vy:90,tgt:t,l:3,dmg:Y.dmg[L]})}sfx('rocket')}}
  if(ty==='laser'){const t=twNear(rng);if(t){aim(t);T.laserT=Math.min(3,T.laserT+dt);{const M=mz();twBolt(M[0],M[1],t.x,t.y,tierCol('laser',L),.05,L>=4)}twHit(t,Y.dmg[L]*(1+2*T.laserT/3)*dt*1.0,'#ff7a8a');if(Math.random()<dt*4)sfx('zap')}else T.laserT=0}
  if(ty==='emp'&&T.cd<=0){const any=T.dr.some(d=>Math.hypot(d.x,d.y)<=rng);if(any){T.cd=Y.cd[L]*.7;{const M=mz();T.pr.push({ring:1,x:M[0],y:M[1],t:0,l:.5,r:rng,c:tierCol('emp',L)})}for(const d of T.dr)if(Math.hypot(d.x,d.y-ty0)<=rng){d.stun=Y.stun[L];twHit(d,Y.dmg[L],'#9ad8ff')}sfx('emp')}}
  if(ty==='net'&&T.cd<=0){const t=twNear(rng);if(t){T.cd=Y.cd[L]*.8;aim(t);T.tw.fl=.1;{const M=mz();T.pr.push({kind:'net',lv:L,x:M[0],y:M[1],tgt:t,t:0,T:.35,hold:Y.hold[L]})}sfx('net')}}
  if(ty==='decoy'){T.hpD-=dt*.05*(T.dr.some(d=>Math.hypot(d.x,d.y)<=rng)?1:0);if(T.hpD<.3)T.hpD=1;if(T.cd<=0){const t=twNear(rng);if(t){T.cd=.9;T.pr.push({kind:'trace',x0:t.x,y0:t.y,x:0,y:ty0,t:0,l:.07,c:'#ff6a4a'})}}
    T.pulse=(T.pulse||0)+dt;if(T.pulse>1.4){T.pulse=0;T.pr.push({ring:1,x:0,y:ty0+4,t:0,l:.7,r:rng*.5,c:'#ffb347'})}}
  if(ty==='magnet'){T.pulse=(T.pulse||0)+dt;if(T.pulse>Y.pcd[L]*.35){T.pulse=0;T.pr.push({ring:1,x:0,y:ty0,t:0,l:.8,r:rng,c:'#ff7a7a',in:1})}
    T.k2=(T.k2||0)-dt;if(T.k2<=0){T.k2=2.4;const t=twNear(rng);if(t)t.hp=0}
    for(const c of T.loot){c.t+=dt;const dd=Math.hypot(c.x,c.y-6);if(c.t>.5&&dd>3){c.x+=(-c.x)/dd*70*dt;c.y+=((6-c.y)/dd)*70*dt}else if(c.t<=.5)c.y-=-30*dt*0;else c.dead=1;if(c.t<.5)c.y=Math.max(2,c.y-60*dt)}
    T.loot=T.loot.filter(c=>!c.dead)}
  if(ty==='repair'){T.pulse=(T.pulse||0)+dt;if(T.pulse>Y.cd[L]*.3){T.pulse=0;T.pr.push({ring:1,x:0,y:ty0,t:0,l:.8,r:rng,c:'#7dff9a'});for(let i=0;i<8;i++){const a=i/8*6.28;T.fx.push({x:Math.cos(a)*rng*.6,y:ty0+Math.sin(a)*rng*.4,vx:0,vy:30,g:0,l:.7,c:'#7dff9a',s:2})}}}
  if(ty==='solar'){T.pulse=(T.pulse||0)+dt;if(Math.random()<dt*10)T.fx.push({x:rnd(-14,14),y:ty0+rnd(4,16),vx:rnd(-10,10),vy:rnd(20,45),g:0,l:rnd(.4,.9),c:'#ffe28f',s:2});if(T.pulse>2.5){T.pulse=0;for(let i=0;i<Y.parts[L]&&i<6;i++)T.loot.push({x:rnd(-10,10),y:ty0+12,vy:0,t:0,fly:1});T.fx.push({text:'+'+Y.parts[L],x:0,y:ty0+30,vx:0,vy:20,g:0,l:1.1,c:'#ffe08a'})}
    for(const c of T.loot){c.t+=dt;c.y+=(8-c.y)*dt*1.5;c.x*=1-dt*2;if(c.t>1)c.dead=1}T.loot=T.loot.filter(c=>!c.dead)}
  /* projectiles */
  for(const p of T.pr){
    if(p.ring){p.t+=dt;continue}
    if(p.kind==='trace'){p.t+=dt;continue}
    if(p.kind==='shell'){p.t+=dt;if(p.t>=p.T&&!p.done){p.done=1;for(const d of T.dr)if(Math.hypot(d.x-p.x1,d.y-p.y1)<=p.spl)twHit(d,p.dmg,'#ffd36b');T.pr.push({ring:1,x:p.x1,y:p.y1,t:0,l:.35,r:p.spl,c:'#ffd36b'});sfx('boom')}continue}
    if(p.kind==='net'){p.t+=dt;if(p.t>=p.T&&!p.done){p.done=1;if(p.tgt&&!p.tgt.dead){p.tgt.pin=p.hold;p.tgt.netT=p.hold}}continue}
    if(p.kind==='mis'){p.l-=dt;const t=p.tgt&&!p.tgt.dead?p.tgt:twNear(400);if(t){const a=Math.atan2(p.vy,p.vx),ta=Math.atan2(t.y-p.y,t.x-p.x);let da=ta-a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;const na=a+clamp(da,-5*dt,5*dt),sp=130;p.vx=Math.cos(na)*sp;p.vy=Math.sin(na)*sp;
      if(Math.hypot(t.x-p.x,t.y-p.y)<t.w/2+3){twHit(t,p.dmg,'#ffb347');T.pr.push({ring:1,x:p.x,y:p.y,t:0,l:.3,r:14,c:'#ffb347'});p.l=0;sfx('boom')}}
      p.x+=p.vx*dt;p.y+=p.vy*dt;if(Math.random()<dt*40)T.fx.push({x:p.x,y:p.y,vx:rnd(-8,8),vy:rnd(-8,8),g:0,l:.3,c:'#ffd36b'})}
  }
  T.pr=T.pr.filter(p=>p.ring?p.t<p.l:p.kind==='trace'?p.t<p.l:p.kind==='shell'||p.kind==='net'?!p.done:p.l>0);
  T.bl=T.bl.filter(b=>(b.l-=dt)>0);
  for(const f of T.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=f.g*dt;f.l-=dt}
  T.fx=T.fx.filter(f=>f.l>0);
}
/* the real tower sprite is drawn by the game's own code on the (hidden behind the menu) game canvas, then copied */
function twSprite(ty,lv){
  const t={i:0,ty,lv,x:60,y:100,ang:TWD.tw.ang,fl:TWD.tw.fl,sh:0,au:0,pop:0,hp:towerMaxHp({lv,ty}),hHit:0,shHit:0,brk:false},sv=camY,sg=ctx.globalAlpha;
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;camY=0;
  ctx.clearRect(0,0,Math.round(120*K),Math.round(110*K));
  const B=t.y,x=t.x,hh=TWH[lv],ww=TWW[lv],my=B-hh-3,fT=ty==='f';
  const body=towerBody(t,lv)||(fT?['','#6e4a40','#7a5046','#86564a','#905c4e','#9c6252','#a86a58']:['','#6b6762','#77736d','#85817a','#8d8982','#98948c','#a29e96'])[Math.min(lv,6)];
  R(x-ww/2-3,B-4,ww+6,4,'#7a6a4a');R(x-ww/2-3,B-4,ww+6,1,'#94825a');
  const myB=drawTowerBody(t,x,B,hh,ww,lv,body);
  t.i=0;drawTowerStyle(t,x,B,ww,lv,myB);
  if(TBODY[ty])drawTowerTop(t,x,myB,lv);
  else drawBarrels(t,x,my,lv);
  camY=sv;ctx.globalAlpha=sg;
}
function twDraw(){
  const g=twG,sc=TWD.sc,cx=PVW/2,gy=TWGY;
  g.imageSmoothingEnabled=false;
  const X=x=>Math.round(cx+x*sc),Y=y=>Math.round(gy-y*sc);
  const RS=(x,y,w,h,c)=>{g.fillStyle=c;const x0=X(x),y1=Y(y),x1=X(x+w),y0=Y(y+h);g.fillRect(x0,y0,Math.max(1,x1-x0),Math.max(1,y1-y0))};
  const bands=['#1f2a3a','#26334a','#2e3d52','#3a4a5a','#4a5a66','#5e6a6c'];
  for(let i=0;i<bands.length;i++){g.fillStyle=bands[i];g.fillRect(0,Math.round(i*gy/bands.length),PVW,Math.ceil(gy/bands.length)+1)}
  g.fillStyle='#1b2230';for(let i=0;i<16;i++){const bw=14+((i*37)%18),bh=22+((i*53)%46);g.fillRect(i*22-4,gy-bh,bw,bh)}
  g.fillStyle='#403b3a';g.fillRect(0,gy,PVW,PVH-gy);g.fillStyle='#6a625c';g.fillRect(0,gy,PVW,2);g.fillStyle='#b58f2a';for(let x=6;x<PVW;x+=34)g.fillRect(x,gy+11,14,1);
  /* range ring (dashed) */
  if(TWD.rng>0&&twSel!=='solar'){const rr=TWD.rng*sc;g.fillStyle=TY[twSel].col;const n=Math.max(24,Math.round(rr*2.2));for(let i=0;i<n;i++){if((i>>1)%3===2)continue;const a=i/n*6.283,px=Math.round(cx+Math.cos(a)*rr),py=Math.round(gy-14*sc-Math.sin(a)*rr);if(py<gy&&py>=0)g.fillRect(px,py,2,2)}
    if(TY[twSel].min){const mr=TY[twSel].min*sc;g.globalAlpha=.5;g.fillStyle='#ff6a6a';const n2=Math.round(mr*2.2);for(let i=0;i<n2;i++){if((i>>1)%2)continue;const a=i/n2*6.283,px=Math.round(cx+Math.cos(a)*mr),py=Math.round(gy-14*sc-Math.sin(a)*mr);if(py<gy)g.fillRect(px,py,2,2)}g.globalAlpha=1}}
  /* tower sprite */
  twSprite(twSel,twLv);
  const tsc=TWD.tsc;   /* the sprite is not scaled below its own size so it stays readable */
  g.drawImage(cv,Math.round(36*K),Math.round(36*K),Math.round(48*K),Math.round(68*K),Math.round(cx-24*tsc),Math.round(gy-(100-36)*tsc),Math.round(48*tsc),Math.round(68*tsc));
  /* drones */
  for(const d of TWD.dr){
    const bob=Math.sin(d.ph*3)*1.2,x=d.x,y=d.y+bob,hv=d.heavy,f=Math.floor(d.ph*14)%2;
    const body=d.hit>0?'#e6f6ff':hv?'#3a2e26':'#2d3340',rot=f?'#8e99a8':'#59606c';
    if(d.k==='m'){RS(x-3,y-1,6,3,body);RS(x-2,y-2,4,1,'#3a4252');RS(x-4,y-3,3,1,rot);RS(x+1,y-3,3,1,f?'#59606c':'#8e99a8');RS(x,y,1,1,'#ff4a3a')}
    else if(d.k==='b'){RS(x-14,y-4,29,8,body);RS(x-11,y-6,23,2,'#3a4252');RS(x-9,y+4,19,2,'#59606c');for(const rx of[-12,-4,6,13])RS(x+rx-3,y-8,7,1,f?'#8e99a8':'#59606c');RS(x-10,y-1,3,2,'#ff4a3a');RS(x+8,y-1,3,2,'#ff4a3a')}
    else if(hv){RS(x-10,y-3,20,7,body);RS(x-8,y-5,16,2,'#4a3a30');RS(x-6,y+4,12,2,'#59606c');RS(x-14,y-6,8,1,rot);RS(x+6,y-6,8,1,f?'#59606c':'#8e99a8');RS(x-11,y-1,2,4,'#59606c');RS(x+9,y-1,2,4,'#59606c')}
    else{RS(x-6,y-2,12,5,body);RS(x-4,y-4,8,2,'#3a4252');RS(x-9,y-5,6,1,rot);RS(x+3,y-5,6,1,f?'#59606c':'#8e99a8');RS(x-1,y,2,2,'#ff4a3a');RS(x-3,y+3,6,1,'#59606c')}
    if(d.burn>0&&Math.floor(d.ph*20)%2)RS(x-2,y+6,4,4,'#ff9a3a');
    if(d.stun>0)for(let i=0;i<3;i++){const a=d.ph*9+i*2.1;RS(x+Math.cos(a)*9-1,y+7+Math.sin(a)*2,2,2,'#ffe86a')}
    if(d.pin>0){g.fillStyle='#d8e0a0';for(let i=-2;i<=2;i++){g.fillRect(X(x+i*3.5),Y(y+8),1,Math.round(14*sc)+8);g.fillRect(X(x-8),Y(y+5-i*3.5),Math.round(16*sc)+2,1)}}
    if(d.hp<d.mx){const w=d.k==='b'?26:d.k==='m'?6:hv?16:10;RS(x-w/2,y+(hv?7:5),w,1,'#2a0e0e');RS(x-w/2,y+(hv?7:5),Math.max(0,w*d.hp/d.mx),1,'#7dff9a')}
  }
  /* effects */
  for(const b of TWD.bl){const n=Math.max(2,Math.round(Math.hypot(b.x2-b.x1,b.y2-b.y1)*sc/3));g.fillStyle=b.c;let px=b.x1,py=b.y1;for(let i=1;i<=n;i++){const u=i/n,jx=i<n?rnd(-3,3):0,jy=i<n?rnd(-3,3):0,nx=b.x1+(b.x2-b.x1)*u+jx,ny=b.y1+(b.y2-b.y1)*u+jy;const m=Math.max(1,Math.round(Math.hypot(nx-px,ny-py)*sc/1.5));for(let k=0;k<m;k++){g.fillRect(X(px+(nx-px)*k/m),Y(py+(ny-py)*k/m),b.th?3:2,b.th?3:2)}px=nx;py=ny}}
  for(const p of TWD.pr){
    if(p.ring){const k=p.t/p.l,r=(p.in?p.r*(1-k):p.r*(.3+.7*k))*sc;g.globalAlpha=1-k;g.fillStyle=p.c;const n=Math.max(10,Math.round(r*4));for(let i=0;i<n;i++){const a=i/n*6.283;g.fillRect(Math.round(X(p.x)+Math.cos(a)*r),Math.round(Y(p.y)-Math.sin(a)*r*.55),2,2)}g.globalAlpha=1;continue}
    if(p.kind==='trace'){g.globalAlpha=1-p.t/p.l;g.fillStyle=p.c||'#8ff0ff';const n=Math.max(4,Math.round(Math.hypot(p.x-p.x0,p.y-p.y0)*sc/3)),zz=Math.max(2,Math.round((p.sz||2)*.9));for(let i=0;i<=n;i++){const u=i/n;g.fillRect(X(p.x0+(p.x-p.x0)*u),Y(p.y0+(p.y-p.y0)*u),i>n-3?zz+(p.sh==='diamond'||p.sh==='star'?2:0):2,i>n-3?zz+(p.sh==='diamond'||p.sh==='star'?2:0):2)}g.globalAlpha=1;continue}
    if(p.kind==='shell'){const u=Math.min(1,p.t/p.T),x=p.x0+(p.x1-p.x0)*u,y=p.y0+(p.y1-p.y0)*u+Math.sin(u*Math.PI)*70;p.x=x;p.y=y;{const sz=4+Math.floor((p.lv||1)/3),hc=tierCol('mortar',p.lv||1);RS(x-sz/2,y+sz/2,sz,sz,'#2a2c22');RS(x-sz/2+1,y+sz/2-1,sz-2,sz-2,hc)}continue}
    if(p.kind==='net'){const u=Math.min(1,p.t/p.T),t=p.tgt;if(t){const x=p.x+(t.x-p.x)*u,y=p.y+(t.y-p.y)*u,nc=tierCol('net',p.lv||1);RS(x-3,y+3,6,6,nc);RS(x-2,y+2,4,4,'#4a4e3c')}continue}
    if(p.kind==='mis'){const tl=p.lv||1,zs=3+(tl>=5?1:0)+(tl>=8?1:0);RS(p.x-1,p.y+1,zs,zs,'#e6ecff');RS(p.x-p.vx*.04-1,p.y-p.vy*.04+1,2+(tl>=5?1:0),2+(tl>=5?1:0),tierCol('rocket',tl))}
  }
  if(twSel==='decoy'){const al=.5+.5*Math.sin(TWD.t*6);RS(-2,34,4,4,al>.5?'#ffd36b':'#ff8a3a');
    const w=24;RS(-w/2,48,w,2,'#2a0e0e');RS(-w/2,48,w*TWD.hpD,2,'#7dff9a')}
  for(const c of TWD.loot){RS(c.x-1,c.y+1,3,3,'#ffc75a');RS(c.x,c.y,1,1,'#fff6c8')}
  for(const f of TWD.fx){
    if(f.text){g.globalAlpha=clamp(f.l*3,0,1);g.font='700 12px "Pixelify Sans",monospace';g.textAlign='center';g.fillStyle='#14161e';g.fillText(f.text,X(f.x)+1,Y(f.y)+1);g.fillStyle=f.c;g.fillText(f.text,X(f.x),Y(f.y));g.globalAlpha=1;continue}
    g.globalAlpha=clamp(f.l*3,0,1);RS(f.x,f.y,Math.max(1,(f.s||1)/sc),Math.max(1,(f.s||1)/sc),f.c)}
  g.globalAlpha=1;
}
/* screen: tower buttons, level buttons, numbers, description */
const twGrid=$('twGrid'),twLvBox=$('twLv');
function buildTowerScreen(){
  twGrid.textContent='';
  TORDER.forEach(ty=>{
    const b=mk('button','hu');b.type='button';b.dataset.k=ty;
    const ic=mkIcon(TICON(ty));ic.className='icn';b.appendChild(ic);
    b.appendChild(mk('span','tnm',TY[ty].name));
    const tc=mk('span','tc');tc.appendChild(mkIcon('coin'));tc.appendChild(mk('b','',''));b.appendChild(tc);
    const lk=mkIcon('lock');lk.className='lk';b.appendChild(lk);
    b.addEventListener('click',()=>{btnFx();twSel=ty;twSync(true)});
    twGrid.appendChild(b);
  });
  twLvBox.textContent='';
  for(let i=1;i<=TW.max;i++){const b=mk('button','lvb',String(i));b.type='button';b.dataset.l=i;b.addEventListener('click',()=>{btnFx();twLv=i;twSync(true)});twLvBox.appendChild(b)}
}
function twOwnSync(){
  const p=prof(),sg=TORDER.map(ty=>twOwn(ty)?1:0).join('')+'|'+p.coins;
  if(sg===TWD.osig)return;TWD.osig=sg;
  $('twCoins').textContent=p.coins;
  [...twGrid.children].forEach(b=>{const ty=b.dataset.k,own=twOwn(ty);b.classList.toggle('lock',!own);b.classList.toggle('own',own);b.classList.toggle('can',!own&&p.coins>=TY[ty].uc);
    b.querySelector('.lk').style.display=own?'none':'';
    const c=b.querySelector('.tc');c.firstChild.style.display=own?'none':'';c.lastChild.textContent=own?'Terbuka':String(TY[ty].uc)});
  twBuyRefresh();
}
function twBuyRefresh(){
  const own=twOwn(twSel),bu=$('twBuy');bu.hidden=own;
  $('twNeed').textContent=own?'':'Terkunci: buka di bengkel dengan koin';
  if(!own){bu.querySelector('b').textContent=TY[twSel].uc;bu.classList.toggle('poor',prof().coins<TY[twSel].uc)}
}
$('twBuy').addEventListener('click',()=>{
  const ty=twSel;
  if(buyTower(ty)){sfx('power');TWD.osig='';twOwnSync();const b=twGrid.querySelector('[data-k="'+ty+'"]');if(b){b.classList.remove('bought');void b.offsetWidth;b.classList.add('bought')}const c=$('twCoins').parentElement;c.classList.remove('gain');void c.offsetWidth;c.classList.add('gain')}
  else{sfx('nope');const bu=$('twBuy');bu.classList.remove('shake');void bu.offsetWidth;bu.classList.add('shake')}
});
function twSync(force){
  const sig=twSel+'|'+twLv;
  twOwnSync();
  [...twGrid.children].forEach(b=>b.classList.toggle('sel',b.dataset.k===twSel));
  [...twLvBox.children].forEach(b=>b.classList.toggle('sel',+b.dataset.l===twLv));
  if(force||sig!==TWD.sig){
    TWD.sig=sig;twReset();
    $('twName').textContent=TY[twSel].name;$('twLvl').textContent='Lv '+twLv+'/'+TW.max;
    twBuyRefresh();
    $('twDesc').textContent=TWINFO[twSel].d;
    {const bs=TWBEST[twSel],bx=$('twBest');bx.hidden=false;bx.textContent='';
      const cn=document.createElement('canvas');cn.width=36;cn.height=24;const q=cn.getContext('2d'),P=(x,y,w,h,c)=>{q.fillStyle=c;q.fillRect(x,y,w,h)};
      if(bs.k==='m'){for(const[ox,oy]of[[4,5],[18,3],[26,12],[10,14],[20,17]]){P(ox,oy,6,3,'#2d3340');P(ox-1,oy-2,3,1,'#8e99a8');P(ox+3,oy-2,3,1,'#59606c');P(ox+2,oy+1,1,1,'#ff4a3a')}}
      else if(bs.k==='s'){P(10,10,12,5,'#2d3340');P(12,8,8,2,'#3a4252');P(7,5,6,1,'#8e99a8');P(19,5,6,1,'#59606c');P(15,12,2,2,'#ff4a3a')}
      else if(bs.k==='h'){P(6,9,20,7,'#3a2e26');P(8,7,16,2,'#4a3a30');P(10,16,12,2,'#59606c');P(2,5,8,1,'#8e99a8');P(22,5,8,1,'#59606c');P(15,11,3,3,'#ff4a3a')}
      else if(bs.k==='b'){P(2,9,30,8,'#2d3340');P(5,7,24,2,'#3a4252');P(7,17,20,2,'#59606c');P(6,12,3,2,'#ff4a3a');P(25,12,3,2,'#ff4a3a');P(14,4,6,3,'#8e99a8')}
      else{P(10,4,16,16,'#2a3a30');P(16,8,4,8,'#7dff9a');P(12,12,12,4,'#7dff9a')}
      const tx=document.createElement('div');tx.appendChild(document.createTextNode(bs.k?'Paling efektif: ':'Peran: '));tx.appendChild(mk('b','',bs.w));tx.appendChild(document.createElement('br'));tx.appendChild(mk('span','',bs.why));
      bx.appendChild(cn);bx.appendChild(tx)}
    const a=twRows(twSel,twLv),b=twLv<TW.max?twRows(twSel,twLv+1):null;
    let h='<div class="sr sh"><span></span><b>Lv '+twLv+'</b><b>'+(b?'Lv '+(twLv+1):'MAKS')+'</b></div>';
    const fv=(v,u)=>typeof v==='string'?v:f1(v)+u;
    a.forEach((r,i)=>{const u=r[2]||'';h+='<div class="sr"><span>'+r[0]+'</span><b>'+fv(r[1],u)+'</b><b class="nx">'+(b?fv(b[i][1],u):'')+'</b></div>'});
    const bc=Math.max(2,Math.round(TW.cost[0]*(TY[twSel].cost||1)));
    h+='<div class="sr sh"><span>Biaya</span><b></b><b></b></div>';
    h+='<div class="sr"><span>Buka di bengkel</span><b>'+(TWFREE.includes(twSel)?'Gratis':TY[twSel].uc)+'</b><b></b></div>';
    h+='<div class="sr"><span>Bangun (tower pertama)</span><b>'+bc+'</b><b></b></div>';
    h+='<div class="sr"><span>Naik ke Lv '+Math.min(TW.max,twLv+1)+'</span><b>'+(twLv<TW.max?TW.up[twLv]:'-')+'</b><b></b></div>';
    $('twStats').innerHTML=h;
  }
}
function twTick(dt){if(scr.tw.hidden)return;twSync(false);const n=Math.max(1,Math.round(dt/.016));for(let i=0;i<n;i++)twStep(dt/n);twDraw()}

/* ---------- pixel-art workshop wall behind the workshop pages (drawn once, scaled up crisp) ---------- */
function workshopBg(){
  const W2=96,H2=208,c=document.createElement('canvas');c.width=W2;c.height=H2;const g=c.getContext('2d');
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  P(0,0,W2,H2,'#1b2236');
  for(let x=0;x<W2;x+=4){P(x,0,1,H2,'#171d2f');P(x+2,0,1,H2,'#20283d')}   /* corrugated sheet metal */
  for(let y=0;y<H2;y+=52)P(0,y,W2,2,'#10141f');                          /* panel seams */
  /* pegboard with tools */
  P(6,14,84,70,'#2b3552');P(6,14,84,2,'#3a4668');P(6,82,84,2,'#1a2036');
  for(let y=20;y<80;y+=6)for(let x=10;x<86;x+=6)P(x,y,1,1,'#161c30');
  P(14,22,2,22,'#8e99a8');P(12,22,6,3,'#8e99a8');P(13,40,4,3,'#6a707c');                                   /* wrench */
  P(30,24,12,4,'#a9aeb7');P(34,28,3,18,'#7a5a3a');                                                           /* hammer */
  for(let i=0;i<9;i++)P(50+i*2,26+(i&1),2,3,'#b9c2cc');P(48,28,22,2,'#7a808c');P(70,24,4,8,'#c9a22a');        /* saw */
  P(20,56,12,12,'#c9a22a');P(23,59,6,6,'#2b3552');P(25,53,2,3,'#c9a22a');P(25,68,2,3,'#c9a22a');P(17,61,3,2,'#c9a22a');P(32,61,3,2,'#c9a22a'); /* gear */
  P(46,54,26,3,'#c04a3a');P(46,57,5,10,'#6a707c');P(66,57,5,10,'#6a707c');                                     /* clamp */
  P(76,52,8,18,'#2d3038');P(77,54,6,3,'#8ff0ff');                                                            /* tool case */
  /* hanging lamp and its light */
  P(47,0,2,10,'#10141f');P(40,10,16,5,'#c9a22a');P(42,9,12,1,'#e6c24a');P(44,15,8,2,'#fff2b0');
  g.globalAlpha=.07;g.fillStyle='#ffe9a0';g.beginPath();g.moveTo(44,17);g.lineTo(52,17);g.lineTo(96,160);g.lineTo(0,160);g.closePath();g.fill();g.globalAlpha=1;
  /* shelves with crates, jars and parts */
  for(const sy of[104,134]){P(4,sy,88,3,'#5c4a33');P(4,sy,88,1,'#7a6244');P(4,sy+3,88,1,'#2a2014');P(10,sy+4,3,6,'#3a3040');P(82,sy+4,3,6,'#3a3040')}
  P(8,90,16,14,'#6a5238');P(8,90,16,2,'#8a6a46');P(10,96,12,1,'#3a2c1c');
  P(28,94,10,10,'#4a6a7a');P(30,92,6,2,'#8a96a8');
  P(44,92,6,12,'#7a3a3a');P(52,96,10,8,'#3a5a42');P(66,90,18,14,'#6a5238');P(66,90,18,2,'#8a6a46');P(70,96,10,1,'#3a2c1c');
  P(8,120,8,14,'#c9a22a');P(10,118,4,2,'#8e99a8');P(20,124,14,10,'#59606c');P(22,122,10,2,'#8e99a8');P(40,118,16,16,'#6a5238');P(40,118,16,2,'#8a6a46');
  P(62,124,8,10,'#4a6a7a');P(72,120,12,14,'#7a5a3a');P(74,118,8,2,'#a9aeb7');
  P(6,150,12,16,'#2d3038');P(8,152,8,4,'#8ff0ff');P(8,158,8,1,'#5ad1e6');           /* parts bin */
  /* workbench with a robot arm and a vise */
  P(0,168,W2,6,'#6a5238');P(0,168,W2,2,'#8a6a46');P(0,174,W2,22,'#3a2c1c');P(2,174,3,22,'#2a2014');P(91,174,3,22,'#2a2014');
  P(10,180,28,14,'#2a2014');P(12,182,24,3,'#4a3a28');P(14,187,20,1,'#4a3a28');
  P(52,156,4,12,'#8e99a8');P(52,154,14,3,'#8e99a8');P(64,154,3,8,'#6a707c');P(62,162,7,2,'#c9a22a');   /* arm */
  P(74,158,14,10,'#59606c');P(76,156,3,2,'#b9c2cc');P(84,156,3,2,'#b9c2cc');
  /* hazard-striped floor */
  P(0,196,W2,12,'#2b2b30');for(let x=-8;x<W2;x+=8){g.fillStyle='#c9a22a';g.beginPath();g.moveTo(x,208);g.lineTo(x+4,208);g.lineTo(x+10,196);g.lineTo(x+6,196);g.closePath();g.fill()}
  P(0,194,W2,2,'#10141f');
  return c.toDataURL();
}
const WSBG=workshopBg();
for(const e of[$('hg'),$('tw')]){e.style.backgroundImage='linear-gradient(rgba(9,10,20,.5),rgba(9,10,20,.7)),url('+WSBG+')';e.style.backgroundSize='100% 100%,cover';e.style.backgroundPosition='center'}
