
/* ---------- extra tower types, passive player weapons and their projectiles ---------- */
/* continuous damage without spark particles (laser, static field) */
function hurt(d,dmg){d.hp-=dmg;d.hit=Math.max(d.hit,.05)}
/* fire: the drone keeps burning for dur seconds and takes dps damage per second until the flames go out */
function ignite(d,dur,dps){
  if(d.hp<=0)return;
  if(!(d.burn>0)){d.bdps=0;sfx('burn')}
  d.burn=Math.max(d.burn||0,dur);d.bdps=Math.max(d.bdps||0,dps*(d.boss?.7:1));
}
/* tesla shock: the drone is stunned and jerks about at random for dur seconds */
function shock(d,dur){
  if(d.hp<=0||d.flee)return;
  if(!(d.shock>0))sfx('zap');
  d.shock=Math.max(d.shock||0,dur*(d.boss?.5:d.heavy?.75:1));d.atk=null;d.chase=false;d.rt=0;
}
function nearestDrone(x,y,r,skip){
  let tg=null,bd=r;
  for(const d of S.drones){if(d.hp<=0||d.flee||(skip&&skip(d)))continue;const dd=Math.hypot(d.x-x,d.y-y);if(dd<bd){bd=dd;tg=d}}
  return tg;
}
function explode(x,y,r,dmg,col,big){
  const s=S;
  if(big){   /* mortar shell: a proper blast */
    ring(x,y,3,r*1.25,.55,'#fff0b8');ring(x,y,2,r*.8,.4,'#ffb347');ring(x,y,r*.3,r*1.7,.7,'#ff7a3a');
    s.fx.push({light:1,x,y,r:r*3.2,rgb:'255,190,100',a:1,l:.55,L:.55,vx:0,vy:0,g:0});
    s.fx.push({light:1,x,y,r:r*1.5,rgb:'255,250,220',a:1,l:.18,L:.18,vx:0,vy:0,g:0});
    for(let i=0;i<22;i++){const a=rnd(0,6.283),v=rnd(40,150);s.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,g:260,l:rnd(.4,.9),c:['#ffd36b','#ff9a3a','#ff5a1a','#fff0b8'][i&3],s:2})}
    for(let i=0;i<10;i++)s.fx.push({x:x+rnd(-r*.5,r*.5),y,vx:rnd(-30,30),vy:-rnd(30,90),g:-30,l:rnd(.7,1.3),c:i%2?'#6a6f7a':'#4a4f58',s:3});
    for(let i=0;i<8;i++)s.fx.push({x,y,vx:rnd(-110,110),vy:rnd(-170,-60),g:360,l:rnd(.6,1.1),c:i%2?'#5a6070':'#7a6a4a',s:2});
    puff(x,y,14,'#8a8f98');puff(x,y,10,'#ffb347');s.shake=Math.max(s.shake,.28);
  }
  for(const d of s.drones){if(d.hp<=0)continue;const dd=Math.hypot(d.x-x,d.y-y);if(dd<=r+d.w/2){hitDrone(d,dmg*(dd<r*.45?1:.6),col);ignite(d,3.5,clamp(dmg*.3,1,9))}}
  ring(x,y,3,r,.35,col);s.fx.push({light:1,x,y,r:r*1.8,rgb:'255,180,90',a:.8,l:.3,L:.3,vx:0,vy:0,g:0});
  puff(x,y,8,'#8a8f98');puff(x,y,5,'#ffb347');sfx('boom');
}
function fireMissile(x,y,ang,tgt,dmg,spl,small,reach,tlv){
  const v=small?90:60,k=reach?rangeK(Math.hypot(tgt.x-x,tgt.y-y),reach):0,p={x,y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,sp:v,tgt,dmg:dmg*PMUL*(1-ACC.fall*k),spl,small,tlv,l:small?3:5};
  if(Math.random()<ACC.miss*Math.pow(k,1.6)){p.aim={x:tgt.x+rnd(-36,36),y:tgt.y+rnd(-30,30)};p.tgt=null}
  S.missiles.push(p);
}
function nearestBuilding(d,coreDist){   /* [tower or null for the core, distance] */
  let best=null,bd=coreDist;
  for(const t of S.towers){if(!t.lv)continue;const dd=Math.hypot(d.x-t.x,d.y-(t.y-TWH[t.lv]/2-2));if(dd<bd){bd=dd;best=t}}
  return[best,bd];
}
function clearTower(t){
  S.bps=S.bps.filter(b=>b.slot!==t.i);
  Object.assign(t,{ruin:null,lv:0,ty:'g',sh:0,shHp:0,brk:false,au:0,spent:0,hp:0,cd:0,fl:0,beam:0,tgt:null,lock:0,hHit:0});
  for(const d of S.drones)if(d.tw===t){d.tw=null;d.atk=null}
}
function damageTower(t,dmg){
  t.hp-=dmg;t.hHit=.25;sfx('clank');
  if(t.hp<=0){   /* destroyed: the slot is empty again */
    const y=t.y-TWH[t.lv]/2;
    sfx('boom');ring(t.x,y,4,40,.5,'#ffb347');puff(t.x,y,16,'#8a8f98');puff(t.x,y,8,'#ffb347');
    S.fx.push({light:1,x:t.x,y,r:90,rgb:'255,170,80',a:.9,l:.45,L:.45,vx:0,vy:0,g:0});
    for(let i=0;i<10;i++)S.fx.push({x:t.x,y,vx:rnd(-90,90),vy:rnd(-140,-30),g:320,l:rnd(.6,1),c:i%2?'#5a6070':'#7a6a4a',s:2});
    S.shake=Math.max(S.shake,.35);
    const rn={ty:t.ty,lv:t.lv,sh:t.sh,au:t.au,spent:t.spent||0};clearTower(t);t.ruin=rn;   /* a scrap skeleton stays behind; workers can rebuild it for 1/3 of everything spent on it */
  }
}
const nearTower=t=>(S.m.stillA||0)>.02&&Math.abs(S.m.x-t.x)<=34&&Math.abs(S.m.y-t.y)<=40;
const decoyOn=t=>t.ty==='decoy'&&t.lv>0&&!towerBusy(t)&&t.hp>0;
function decoyFor(d){
  let best=null,bd=1e9;
  for(const t of S.towers){if(!decoyOn(t))continue;const dd=Math.hypot(d.x-t.x,d.y-(t.y-TWH[t.lv]-4));if(dd<=TY.decoy.rng[t.lv]&&dd<bd){bd=dd;best=t}}
  return best;
}
function magnetNear(x,y){
  for(const t of S.towers)if(t.ty==='magnet'&&t.lv>0&&!towerBusy(t)&&Math.hypot(x-t.x,y-(t.y-TWH[t.lv]))<=TY.magnet.rng[t.lv])return t;
  return null;
}
function magnetBonus(x,y){let b=0;for(const t of S.towers)if(t.ty==='magnet'&&t.lv>0&&!towerBusy(t)&&Math.hypot(x-t.x,y-(t.y-TWH[t.lv]))<=TY.magnet.rng[t.lv])b+=TY.magnet.bonus[t.lv];return b}
function solarBoost(){let b=0;for(const t of S.towers)if(t.ty==='solar'&&t.lv>0&&!towerBusy(t))b+=TY.solar.chg[t.lv];return Math.min(2,b)}

/* towers other than Gun / Api. Called every frame for a built, idle tower; t.cd already counted down. */
function updateTowerType(t,dt){
  const s=S,Y=TY[t.ty],lv=t.lv,mx=t.x,my=t.y-TWH[lv]-3;
  switch(t.ty){
    case 'mortar':{
      if(t.cd>0)return;
      const tg=nearestDrone(mx,my,Y.rng[lv],d=>Math.hypot(d.x-mx,d.y-my)<Y.min);if(!tg)return;
      const dist=Math.hypot(tg.x-mx,tg.y-my),k=rangeK(dist,Y.rng[lv]),T=.8+dist/420;
      const sc0=(1-Y.acc[lv])*(60+k*40),px=tg.x+(tg.vx||0)*T*.85+rnd(-1,1)*sc0,py=Math.min(GW-6,tg.y+(tg.vy||0)*T*.85+rnd(-1,1)*sc0*.6);
      t.ang=Math.atan2(py-my,px-mx);t.cd=Y.cd[lv];t.fl=.2;
      s.shells.push({x0:mx,y0:my-6,x1:px,y1:py,t:0,T,dmg:Y.dmg[lv]*(1-ACC.fall*k),spl:Y.spl[lv],h:40+T*45,lv});
      sfx('mortar');puff(mx,my-8,5,'#c9c2b0');return;
    }
    case 'rocket':{
      if(t.cd>0)return;
      let tg=null,best=-1;   /* bosses first, then heavies, then the toughest */
      for(const d of s.drones){if(d.hp<=0||d.flee)continue;if(Math.hypot(d.x-mx,d.y-my)>Y.rng[lv])continue;const sc=(d.boss?1e6:d.heavy?1e4:0)+d.hp;if(sc>best){best=sc;tg=d}}
      if(!tg)return;
      t.ang=Math.atan2(tg.y-my,tg.x-mx);t.cd=Y.cd[lv];t.fl=.25;
      fireMissile(mx,my-4,-Math.PI/2+(Math.random()-.5)*.7,tg,Y.dmg[lv]*(Math.random()<Y.acc[lv]?1:.5),14,false,Y.rng[lv],lv);sfx('rocket');return;
    }
    case 'tesla':{
      if(t.cd>0)return;
      const tg=nearestDrone(mx,my-8,Y.rng[lv]);if(!tg)return;
      t.cd=Y.cd[lv];t.fl=.15;
      const k0=rangeK(Math.hypot(tg.x-mx,tg.y-my+8),Y.rng[lv]);
      if(Math.random()<ACC.miss*Math.pow(k0,1.6)){missFx(tg);bolt(mx,my-11,tg.x+rnd(-10,10),tg.y+rnd(-10,10),tierCol('tesla',lv),0,lv>=5);return}
      let cur=tg,px=mx,py=my-11,dmg=Y.dmg[lv]*(1-ACC.fall*k0);const hit=new Set();
      for(let j=0;j<Y.jump[lv]&&cur;j++){
        hit.add(cur);hitDrone(cur,dmg,tierCol('tesla',lv));bolt(px,py,cur.x,cur.y,tierCol('tesla',lv),0,lv>=5);if(Math.random()<Y.shock[lv])shock(cur,1.3+.15*lv);
        px=cur.x;py=cur.y;dmg*=.85;cur=nearestDrone(px,py,104,d=>hit.has(d));
      }
      return;
    }
    case 'laser':{
      let tg=t.tgt;
      if(!tg||tg.hp<=0||tg.flee||!s.drones.includes(tg)||Math.hypot(tg.x-mx,tg.y-my)>Y.rng[lv]){tg=nearestDrone(mx,my,Y.rng[lv]);t.lock=0;t.tgt=tg}
      if(!tg){t.beam=0;return}
      t.lock=(t.lock||0)+dt;t.ang=Math.atan2(tg.y-my,tg.x-mx);
      const mult=1+Math.min(2,t.lock/1.5);t.beam=mult;t.fl=.1;   /* damage ramps up to 3x while locked on */
      hurt(tg,Y.dmg[lv]*mult*dt*(1-ACC.fall*rangeK(Math.hypot(tg.x-mx,tg.y-my),Y.rng[lv])));
      if(Math.random()<dt*24)s.fx.push({x:tg.x+rnd(-2,2),y:tg.y+rnd(-2,2),vx:rnd(-30,30),vy:rnd(-40,0),g:120,l:.25,c:'#ffb0c0',s:1});
      return;
    }
    case 'emp':{
      if(t.cd>0||!nearestDrone(mx,my,Y.rng[lv]))return;
      t.cd=Y.cd[lv];t.fl=.35;
      for(const d of s.drones){if(d.hp<=0)continue;if(Math.hypot(d.x-mx,d.y-my)<=Y.rng[lv]+d.w/2){d.stun=Math.max(d.stun||0,Y.stun[lv]);d.atk=null;hitDrone(d,Y.dmg[lv]*(1-ACC.fall*rangeK(Math.hypot(d.x-mx,d.y-my),Y.rng[lv])),'#9ad8ff')}}
      ring(mx,my-8,4,Y.rng[lv],.5,tierCol('emp',lv));ring(mx,my-8,2,Y.rng[lv]*.6,.4,'#e6fbff');
      s.fx.push({light:1,x:mx,y:my-8,r:Y.rng[lv],rgb:'154,216,255',a:.7,l:.35,L:.35,vx:0,vy:0,g:0});sfx('emp');return;
    }
    case 'net':{
      if(t.cd>0)return;
      const tg=nearestDrone(mx,my,Y.rng[lv],d=>(d.net||0)>0||(d.stun||0)>0);if(!tg)return;
      t.cd=Y.cd[lv];t.fl=.2;
      const dist=Math.hypot(tg.x-mx,tg.y-my),T=dist/230,px=tg.x+(tg.vx||0)*T,py=tg.y+(tg.vy||0)*T,a=Math.atan2(py-my,px-mx)+rnd(-1,1)*(1-Y.acc[lv])*.9;t.ang=a;
      s.nets.push({x:mx,y:my,vx:Math.cos(a)*230,vy:Math.sin(a)*230,l:1.2,hold:Y.hold[lv],r:1,lv});sfx('net');return;
    }
    case 'repair':{
      if(!s.nightOn)return;
      t.rt=(t.rt||0)+dt;if(t.rt<Y.cd[lv])return;t.rt=0;
      let did=false;
      for(const o of s.towers){
        if(o===t||!o.lv||!o.sh||o.brk||o.shHp>=SH.hp[o.sh])continue;
        if(Math.hypot(o.x-t.x,o.y-t.y)>Y.rng[lv])continue;
        o.shHp=Math.min(SH.hp[o.sh],o.shHp+Y.heal[lv]);o.shHit=.2;did=true;
        s.beams.push({x1:t.x,y1:my-12,x2:o.x,y2:o.y-TWH[o.lv]/2-3,l:.4,c:'#7dff9a'});
      }
      for(const o of s.towers){
        if(!o.lv||o===t||o.hp>=towerMaxHp(o)||Math.hypot(o.x-t.x,o.y-t.y)>Y.rng[lv])continue;
        o.hp=Math.min(towerMaxHp(o),o.hp+Y.heal[lv]);did=true;s.beams.push({x1:t.x,y1:my-12,x2:o.x,y2:o.y-TWH[o.lv]/2,l:.4,c:'#7dff9a'});
      }
      if(s.hp<s.maxHp){s.hp=Math.min(s.maxHp,s.hp+Y.core[lv]);did=true;s.beams.push({x1:t.x,y1:my-12,x2:CX,y2:GW-17,l:.4,c:'#7dff9a'})}
      if(did){ring(t.x,my-12,3,16,.3,'#7dff9a');sfx('fuel')}
      return;
    }
    case 'magnet':{   /* every few seconds a short repelling pulse throws nearby drones back */
      if(t.cd>0)return;
      const R0=Y.push[lv],cx=mx,cy=my-4;let n=0;
      for(const d of s.drones){
        if(d.hp<=0||d.flee||d.kb>0)continue;
        const dx=d.x-cx,dy=d.y-cy,dd=Math.hypot(dx,dy)||1;if(dd>R0+d.w/2)continue;
        const p=(190+60*lv)*(d.boss?.3:d.heavy?.6:1);
        d.kvx=dx/dd*p;d.kvy=dy/dd*p-30;d.kb=.45;d.chase=false;d.atk=null;d.hit=.1;n++;
      }
      if(!n){t.cd=.4;return}
      t.cd=Y.pcd[lv];t.fl=.3;
      ring(cx,cy,3,R0,.45,'#ff7a7a');ring(cx,cy,2,R0*.6,.35,'#ffd0d0');
      s.fx.push({light:1,x:cx,y:cy,r:R0*1.4,rgb:'255,110,110',a:.7,l:.3,L:.3,vx:0,vy:0,g:0});
      for(let i=0;i<14;i++){const a=i/14*6.283;s.fx.push({x:cx,y:cy,vx:Math.cos(a)*90,vy:Math.sin(a)*90,g:0,l:.3,c:i%2?'#ff7a7a':'#ffffff',s:2})}
      sfx('repel');return;
    }
    default:return;   /* decoy, solar work through drone targeting, drops and the battery */
  }
}

/* ---------- passive weapons carried by the mechanic (bought and upgraded at the core) ---------- */
const PWD={
  katana:{cd:[0,1,.9,.8,.7,.6],dmg:[0,6,8,11,14,18],r:[0,14,16,18,20,22]},   /* tiny reach, heavy hits (values double below) */
  orbit:{n:[0,2,4,6,8,10],dmg:[0,1.2,1.6,2.2,2.8,3.6],r:[0,22,26,30,34,38]},
  shot:{cd:[0,1.6,1.4,1.2,1.05,.9],n:[0,5,5,6,7,8],dmg:[0,.8,1,1.3,1.6,2],rng:[0,90,100,112,125,140]},
  mini:{cd:[0,3,2.7,2.4,2.1,1.8],n:[0,2,2,3,3,4],dmg:[0,3,3.8,4.8,6,7.5],rng:[0,150,165,180,200,220]},
  field:{dps:[0,1,1.4,1.9,2.5,3.2],r:[0,38,44,50,56,62]}
};
/* passive weapons hit twice as hard and reach twice as far */
for(const k in PWD)for(const f of['dmg','dps','r','rng'])if(PWD[k][f])PWD[k][f]=PWD[k][f].map(v=>v*2);
const orbitPos=(i,n)=>{const m=S.m,a=S.anim*3.2+i*6.283/n,r=PWD.orbit.r[S.wp.orbit];return[m.x+Math.cos(a)*r,m.y-10+Math.sin(a)*r*.8]};
function updateWeapons(dt){
  const s=S,m=s.m,w=s.wp,cx=m.x,cy=m.y-10;
  if(w.orbit){
    const n=PWD.orbit.n[w.orbit];
    for(let i=0;i<n;i++){
      const[bx,by]=orbitPos(i,n);
      for(const d of s.drones){
        if(d.hp<=0||(d.obT||0)>s.anim)continue;
        if(Math.hypot(d.x-bx,d.y-by)<=d.w/2+6){d.obT=s.anim+.4;hitDrone(d,PWD.orbit.dmg[w.orbit]*PMUL,'#e6ecff');sfx('x_orbit')}
      }
    }
  }
  if(w.shot){
    m.shT=(m.shT||0)-dt;
    if(m.shT<=0){
      const P=PWD.shot,tg=nearestDrone(cx,cy,P.rng[w.shot]);
      if(tg){
        m.shT=P.cd[w.shot];const base=Math.atan2(tg.y-cy,tg.x-cx),n=P.n[w.shot];
        for(let i=0;i<n;i++){const a=base+(i/(n-1)-.5)*.55+rnd(-.04,.04);s.bul.push({x:cx,y:cy,x0:cx,y0:cy,reach:P.rng[w.shot],vx:Math.cos(a)*330,vy:Math.sin(a)*330,l:P.rng[w.shot]/330,dmg:P.dmg[w.shot]*PMUL})}
        sfx('x_shot');s.fx.push({light:1,x:cx+Math.cos(base)*8,y:cy,r:18,rgb:'255,225,150',a:.6,l:.1,L:.1,vx:0,vy:0,g:0});
      }else m.shT=.2;
    }
  }
  if(w.mini){
    m.mnT=(m.mnT||0)-dt;
    if(m.mnT<=0){
      const P=PWD.mini,list=s.drones.filter(d=>d.hp>0&&!d.flee&&Math.hypot(d.x-cx,d.y-cy)<=P.rng[w.mini]).sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
      if(list.length){
        m.mnT=P.cd[w.mini];const n=P.n[w.mini];
        for(let i=0;i<n;i++)fireMissile(cx,cy-6,-Math.PI/2+(i/(Math.max(1,n-1))-.5)*1.4,list[i%list.length],P.dmg[w.mini],8,true,P.rng[w.mini]);
        sfx('x_mini');
      }else m.mnT=.25;
    }
  }
  if(s.slash)s.slash=s.slash.filter(q=>(q.t+=dt)<q.l);
  if(s.slashMk)s.slashMk=s.slashMk.filter(q=>(q.t+=dt)<q.l);
  if(w.katana){   /* katana: an arc slash that cuts every drone within its very short reach */
    m.ktT=(m.ktT||0)-dt;
    if(m.ktT<=0){
      const P=PWD.katana,r=P.r[w.katana],hits=s.drones.filter(d=>d.hp>0&&!d.flee&&Math.hypot(d.x-cx,d.y-cy)<=r+d.w/2);
      if(hits.length){
        m.ktT=P.cd[w.katana];hits.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));
        const a=Math.atan2(hits[0].y-cy,hits[0].x-cx);
        for(const d of hits){
          hitDrone(d,P.dmg[w.katana]*PMUL,'#e6fbff');
          const ha=Math.atan2(d.y-cy,d.x-cx);
          ring(d.x,d.y,2,16,.22,'#ffffff');
          for(let i=0;i<10;i++){const sa=ha+rnd(-1.2,1.2),v=rnd(70,190);s.fx.push({x:d.x,y:d.y,vx:Math.cos(sa)*v,vy:Math.sin(sa)*v-20,g:220,l:rnd(.18,.4),c:i%3?'#ffffff':'#8ff0ff',s:i%4?1:2})}
          for(const sd of[-.7,.7]){const hx=Math.cos(ha+sd)*9,hy=Math.sin(ha+sd)*9;(s.slashMk||(s.slashMk=[])).push({x:d.x,y:d.y,dx:hx,dy:hy,t:0,l:.22})}   /* cross-shaped cut mark on the drone */
          if(!d.kb){d.kvx=Math.cos(ha)*160;d.kvy=Math.sin(ha)*160-30;d.kb=.18;d.atk=null}
        }
        const cuts=w.katana>=4?3:w.katana>=2?2:1;
        for(let i=0;i<cuts;i++)(s.slash||(s.slash=[])).push({x:cx,y:cy,a:a+(i===1?.5:i===2?-.5:0),t:-i*.07,l:.3,r:r+6+i*2,sd:(i%2?-1:1)*(s.katSd=-(s.katSd||1))});
        s.shake=Math.max(s.shake,.1+.03*hits.length);
        s.fx.push({light:1,x:cx,y:cy,r:r*3,rgb:'200,240,255',a:.9,l:.18,L:.18,vx:0,vy:0,g:0});
        sfx('slash');
      }else m.ktT=.08;
    }
  }
  if(w.field){
    const r=PWD.field.r[w.field];
    for(const d of s.drones){
      if(d.hp<=0)continue;
      if(Math.hypot(d.x-cx,d.y-cy)<=r+d.w/2){
        hurt(d,PWD.field.dps[w.field]*PMUL*dt*(1-ACC.fall*rangeK(Math.hypot(d.x-cx,d.y-cy),r)));
        if(Math.random()<dt*6){s.bolts.push({x1:cx+rnd(-6,6),y1:cy+rnd(-6,6),x2:d.x,y2:d.y,l:.06,c:'#9ad8ff'});sfx('x_field')}
      }
    }
  }
}

/* ---------- projectiles ---------- */
function updateProjectiles(dt){
  const s=S;
  s.shells=s.shells.filter(p=>{p.t+=dt;if(p.t>=p.T){explode(p.x1,p.y1,p.spl,p.dmg,'#ffb347',true);return false}return true});
  s.missiles=s.missiles.filter(p=>{
    if(!p.aim&&(!p.tgt||p.tgt.hp<=0||!s.drones.includes(p.tgt)))p.tgt=nearestDrone(p.x,p.y,220);
    const max=p.small?260:200;p.sp=Math.min(max,p.sp+260*dt);
    let a=Math.atan2(p.vy,p.vx);
    const aim=p.aim||p.tgt;
    if(aim){let da=Math.atan2(aim.y-p.y,aim.x-p.x)-a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;a+=clamp(da,-(p.small?7:4.5)*dt,(p.small?7:4.5)*dt)}
    p.vx=Math.cos(a)*p.sp;p.vy=Math.sin(a)*p.sp;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
    if(Math.random()<dt*40)s.fx.push({x:p.x-Math.cos(a)*3,y:p.y-Math.sin(a)*3,vx:rnd(-8,8),vy:rnd(-8,8),g:0,l:rnd(.2,.4),c:Math.random()<.5?'#c9c2b0':'#ffb347',s:1});
    if(p.aim&&Math.hypot(p.aim.x-p.x,p.aim.y-p.y)<=6){if(!p.small)explode(p.x,p.y,p.spl,p.dmg,'#ff9a6a');else missFx(p);return false}
    const t=p.tgt;
    if(t&&Math.hypot(t.x-p.x,t.y-p.y)<=t.w/2+3){
      if(p.small){PLY=true;hitDrone(t,p.dmg,'#ffb347');PLY=false;ignite(t,2.5,clamp(p.dmg*.25,.8,5));ring(p.x,p.y,2,10,.2,'#ffb347');sfx('x_minihit')}else explode(p.x,p.y,p.spl,p.dmg,'#ff9a6a');
      return false;
    }
    if(p.l<=0||p.y>=GW-2){if(!p.small)explode(p.x,p.y,p.spl,p.dmg*.5,'#ff9a6a');return false}
    return true;
  });
  s.nets=s.nets.filter(p=>{
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;p.r=Math.min(7,p.r+30*dt);
    for(const d of s.drones){
      if(d.hp<=0||d.flee)continue;
      if(Math.hypot(d.x-p.x,d.y-p.y)<=d.w/2+5){d.net=Math.max(d.net||0,p.hold);d.atk=null;puff(d.x,d.y,4,'#d8e0a0');sfx('clank');return false}
    }
    return p.l>0&&p.y<GW;
  });
  s.bul=s.bul.filter(p=>{
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;
    for(const d of s.drones){if(d.hp<=0)continue;if(Math.hypot(d.x-p.x,d.y-p.y)<=d.w/2+2){PLY=true;if(p.reach)hitAt(d,p.dmg,p.c||'#ffe08a',rangeK(Math.hypot(p.x-p.x0,p.y-p.y0),p.reach));else hitDrone(d,p.dmg,'#ffe08a');PLY=false;return false}}
    return p.l>0;
  });
  s.beams=s.beams.filter(b=>(b.l-=dt)>0);
  updateShots(dt);
}

/* ---------- drawing ---------- */
const TBODY={mortar:'#5e6248',rocket:'#6a5a4a',tesla:'#5a4f6a',laser:'#5a4a52',emp:'#4a5a6a',net:'#5e624e',decoy:'#6a5a3a',magnet:'#6a4a4a',repair:'#4a6250',solar:'#4a5262'};
const TBODYG={sniper:'#46525e',gatling:'#6a4a3a'};
/* ---------- per-level looks: projectile colour / size / shape and the tower's own styling all change as it levels up ---------- */
const PGRAD={g:['#8ff0ff','#7dffa8','#ffe85a','#ff7a5a','#ff6ae6'],gatling:['#ffd36b','#ffa23a','#ff6a3a','#ff4a8a','#ffffff'],sniper:['#b8ff8a','#5af0c8','#5ab8ff','#b48aff','#ffffff'],
  f:['#ffb347','#ff7a2a','#ff4a2a','#7ad0ff','#e0f4ff'],mortar:['#ffb347','#ff8a3a','#ff5a2a','#ff3a6a','#ffe0ff'],rocket:['#ff9a6a','#ff7a4a','#ff5a5a','#ff4aa0','#ffd0ff'],
  tesla:['#c9a8ff','#a88aff','#8aa8ff','#8affff','#ffffff'],laser:['#ff4a6a','#ff6a4a','#ff9a3a','#ffd36b','#ffffff'],emp:['#9ad8ff','#7ab8ff','#8a9aff','#c58aff','#ffffff'],net:['#d8e0a0','#b8e87a','#7ae8a8','#7ad8ff','#ffffff']};
const hx=a=>'#'+a.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
function tierCol(ty,lv){const g=PGRAD[ty]||PGRAD.g,u=(clamp(lv|0,1,9)-1)/8*(g.length-1),i=Math.min(g.length-2,Math.floor(u));return hx(mix(g[i],g[i+1],u-i))}
/* bullet look by tower type and level: colour shifts, size and trail grow, the shape goes dot -> bolt -> diamond -> star */
function projLook(ty,lv){
  lv=clamp(lv|0,1,9);const sn=ty==='sniper',gt=ty==='gatling';
  return{col:tierCol(ty,lv),size:(sn?3:gt?1.6:2)+(lv-1)*(sn?.45:gt?.25:.35),trail:Math.round((sn?18:gt?5:7)*(1+(lv-1)*.14)),shape:lv>=9?'star':lv>=7?'diamond':lv>=4?'bolt':'dot'};
}
function flameCols(lv){return lv>=8?['#e0f4ff','#7ad0ff','#3a7aff']:lv>=5?['#fff0a0','#ffb347','#ff6a1a']:['#ffd36b','#ff9a3a','#ff5a1a']}
/* the real bullet sprite (also used by the workshop preview through its own canvas) */
function drawBullet(p){
  const a=p.a||0,ca=Math.cos(a),sn=Math.sin(a),s=p.size,sh=p.shape||'dot';
  if(sh==='dot'){R(p.x-s/2,p.y-s/2,s,s,'#ffffff');return}
  if(sh==='bolt'){line(p.x-ca*s*1.4,p.y-sn*s*1.4,p.x+ca*s,p.y+sn*s,'#ffffff',0);R(p.x-s/2,p.y-s/2,s,s,p.col);return}
  ctx.globalAlpha=.35;R(p.x-s*1.3,p.y-s*1.3,s*2.6,s*2.6,p.col);ctx.globalAlpha=1;
  R(p.x-s,p.y-s/4,s*2,s/2,p.col);R(p.x-s/4,p.y-s,s/2,s*2,p.col);R(p.x-s/2,p.y-s/2,s,s,'#ffffff');
  if(sh==='star'){const d=s*.8;R(p.x-d,p.y-d,1.5,1.5,p.col);R(p.x+d-1.5,p.y-d,1.5,1.5,p.col);R(p.x-d,p.y+d-1.5,1.5,1.5,p.col);R(p.x+d-1.5,p.y+d-1.5,1.5,1.5,p.col)}
}
/* tower body styling: more plating, lights, trims and finally a crown as the level rises. myB = top of the body as returned by drawTowerBody */
const EFFW={tesla:12,laser:14,emp:16,rocket:18};
function drawTowerStyle(t,x,B,ww,lv,myB){
  if(lv<2)return;
  const ty=t.ty||'g',ac=tierCol(ty,lv),an=S.anim,half=Math.min(ww,EFFW[ty]||ww)/2,top=myB+3,bh=B-top,blink=Math.floor(an*3+t.i)%2;
  if(bh<7)return;
  R(x-half-2,B-6,1,2,'#c9c2b0');R(x+half+1,B-6,1,2,'#c9c2b0');                       /* Lv2: bolted footing */
  if(lv>=3){R(x-half,B-Math.round(bh*.4),half*2,1,ac);R(x-half,B-Math.round(bh*.4)+1,half*2,1,'rgba(0,0,0,.3)')}   /* Lv3: colour band */
  if(lv>=4){for(const sd of[-1,1]){const px=sd<0?x-half-3:x+half;R(px,top+3,3,bh-9,'#59606c');R(px,top+3,3,1,'#8a909b');R(px+(sd<0?0:2),top+4,1,bh-11,'rgba(0,0,0,.3)')}}   /* Lv4: side armour */
  if(lv>=5){R(x-half+1,top+2,2,1,blink?ac:'#2a3040');R(x+half-3,top+2,2,1,blink?'#2a3040':ac)}   /* Lv5: status lights */
  if(lv>=6){line(x+half-1,top,x+half-1,top-7,'#8a909b',0);R(x+half-2,top-9,3,3,blink?ac:'#ffffff')}   /* Lv6: antenna */
  if(lv>=7){R(x-half+1,top+4,1,Math.max(2,bh-12),ac);R(x+half-2,top+4,1,Math.max(2,bh-12),ac)}   /* Lv7: glowing trims */
  if(lv>=8){for(const sd of[-1,1]){const px=sd<0?x-half-6:x+half+3;R(px,top+1,3,5,'#8a909b');R(px,top+1,3,1,'#c8cdd6');R(px+1,top+3,1,1,ac)}}   /* Lv8: shoulder pods */
  if(lv>=9){   /* Lv9: golden crown and a soft halo */
    for(const sd of[-1,1]){const px=sd<0?x-half-1:x+half-2;R(px,top-4,3,5,'#ffd36b');R(px,top-4,3,1,'#fff2b0')}
    R(x-1,top-5,3,4,'#ffd36b');R(x-1,top-5,3,1,'#fff2b0');
    {const gx=x*K,gy=(top+bh*.45-camY)*K,gr=Math.max(half*2+12,bh*.9)*K,gg=ctx.createRadialGradient(gx,gy,gr*.15,gx,gy,gr);
     gg.addColorStop(0,'rgba(255,224,138,.30)');gg.addColorStop(1,'rgba(255,224,138,0)');ctx.globalAlpha=.8+.2*Math.sin(an*3+t.i);ctx.fillStyle=gg;ctx.beginPath();ctx.arc(gx,gy,gr,0,6.283);ctx.fill();ctx.globalAlpha=1}
  }
}
/* barrels and turret housing of Gun / Api / Gatling / Sniper (shared by the game and the workshop preview) */
function drawBarrels(t,x,my,lv){
  const ty=t.ty||'g',fT=ty==='f',L=Math.round(TWL[lv]*(ty==='sniper'?1.7:ty==='gatling'?.85:1))-(t.fl>0&&!fT?2:0),ca=Math.cos(t.ang),sn=Math.sin(t.ang),ac=tierCol(ty,lv);
  R(x-4,my-1,8,4,'#4d525c');R(x-3,my-3,6,3,'#6a707c');
  if(lv>=4){R(x-6,my,12,3,'#59606c');R(x-6,my,12,1,'#8a909b')}
  if(lv>=7)R(x-7,my-4,14,2,ac);
  const offs=ty==='gatling'?[-2.4,0,2.4]:ty==='sniper'?[0]:lv>=7?[-3,0,3]:lv>=3?[-1.8,1.8]:[0],bc=fT?'#3a2a26':lv>=7?'#3a4254':lv>=4?'#363b46':'#2d3038';
  for(const o of offs){const ox=-sn*o,oy=ca*o;line(x+ox,my+oy,x+ox+ca*L,my+oy+sn*L,bc,0);if(lv>=5&&!fT)R(x+ox+ca*L-1,my+oy+sn*L-1,2,2,ac)}
  if(fT){R(x+ca*L-1,my+sn*L-1,3,3,t.fl>0?'#ffd36b':'#ff7a2a');R(x-3,my-5,6,2,'#c0651f')}
}
function towerBody(t,lv){const c=TBODY[t.ty]||TBODYG[t.ty];return c?css(mix(c,'#c8c8c8',Math.min(9,lv)*.045)):null}
function drawTowerTop(t,x,my,lv){
  const a=t.ang,ca=Math.cos(a),sn=Math.sin(a),fl=t.fl>0,an=S.anim;
  switch(t.ty){
    case 'mortar':{
      R(x-6,my-1,12,4,'#3e4230');R(x-6,my-1,12,1,'#6a6e52');
      const ta=-Math.PI/2+clamp(ca,-1,1)*.55,tc=Math.cos(ta),ts=Math.sin(ta),L=9-(fl?2:0);
      for(const o of[-1.5,0,1.5])line(x-ts*o,my+tc*o,x-ts*o+tc*L,my+tc*o+ts*L,'#2d3022',0);
      R(x+tc*L-2,my+ts*L-2,4,3,fl?'#ffd36b':'#4a4e36');break;
    }
    case 'rocket':{
      R(x-6,my-6,12,8,'#4a3e34');R(x-6,my-6,12,1,'#7a6a5a');
      for(const[ox,oy]of[[-4,-4],[1,-4],[-4,-1],[1,-1]]){R(x+ox,my+oy,3,2,'#1d2028');if(t.cd<1.2)R(x+ox+1,my+oy,1,1,'#ff5a4a')}
      if(fl)R(x-2,my+2,4,2,'#ffb347');break;
    }
    case 'tesla':{
      R(x-2,my-9,4,10,'#7a5a2a');for(let k=0;k<3;k++)R(x-3,my-8+k*3,6,1,'#c9a22a');
      R(x-3,my-14,6,5,'#b9c2cc');R(x-2,my-13,2,2,'#e6ecff');
      if(fl||Math.floor(an*7+t.i)%5===0){R(x+3,my-14,2,1,'#c9a8ff');R(x-5,my-12,2,1,'#c9a8ff')}
      break;
    }
    case 'laser':{
      R(x-4,my-2,8,5,'#3e4048');R(x-4,my-2,8,1,'#6a707c');
      line(x,my-1,x+ca*7,my-1+sn*7,'#2d3038',0);R(x+ca*7-1,my-1+sn*7-1,3,3,t.beam?'#ffd0dc':'#ff4a6a');
      R(x-1,my-5,3,3,'#ff6a8a');break;
    }
    case 'emp':{
      R(x-6,my-1,12,2,'#9aa1ad');R(x-4,my-3,8,2,'#7d838e');R(x,my-9,1,7,'#9aa1ad');
      const pc=t.cd<1?(Math.floor(an*10)%2?'#e6fbff':'#9ad8ff'):'#4a7a9a';R(x-1,my-12,3,3,pc);break;
    }
    case 'net':{
      R(x-4,my-2,8,4,'#4a4e3c');
      line(x,my,x+ca*7,my+sn*7,'#3a3e2c',0);R(x+ca*7-2,my+sn*7-2,4,4,'#d8e0a0');R(x+ca*7-1,my+sn*7-1,2,2,'#7a7e5a');break;
    }
    case 'decoy':{
      R(x-1,my-14,2,15,'#9aa1ad');R(x-3,my-18,6,4,'#5a4a2a');
      const on=t.hp>0,bl=Math.floor(an*3)%2;R(x-2,my-17,4,2,on?(bl?'#ffd36b':'#ff9a3a'):'#3a2a1a');
      if(t.dHit>0)R(x-3,my-18,6,4,'#ffffff');
      break;
    }
    case 'magnet':{
      R(x-6,my-9,3,9,'#c83a3a');R(x+3,my-9,3,9,'#c83a3a');R(x-6,my-1,12,3,'#c83a3a');R(x-6,my-1,12,1,'#ff7a7a');
      R(x-6,my-11,3,2,'#d0d6e2');R(x+3,my-11,3,2,'#d0d6e2');
      const k=(an*3+t.i)%1;R(x-1,my-11+Math.round(k*8),2,1,'#a9bccf');break;
    }
    case 'repair':{
      R(x-6,my-1,12,3,'#2e3e32');R(x-1,my-7,3,7,'#7dff9a');R(x-3,my-5,7,3,'#7dff9a');
      const bx=x+Math.sin(an*1.7+t.i)*6,by=my-14+Math.sin(an*3.1)*2;
      R(bx-3,by,7,2,'#9aa1ad');R(bx-4,by-2,9,1,Math.floor(an*20)%2?'#59606c':'#8e99a8');R(bx,by+2,1,1,'#7dff9a');break;
    }
    case 'solar':{
      const tilt=Math.round(clamp((SUN.x-x)/70,-1,1)*3);R(x-1,my-5,2,6,'#9aa1ad');
      for(let i=-8;i<8;i++){const yy=my-6-Math.round(tilt*i/8);R(x+i,yy-1,1,3,'#1d3a6a');if(i%4===0)R(x+i,yy-1,1,3,'#5a8ad8')}
      if(SUN.a>.2&&Math.floor(an*2+t.i)%4===0){const gi=Math.floor((an*5)%14)-7;R(x+gi,my-7-Math.round(tilt*gi/8),2,1,'#e6fbff')}
      break;
    }
  }
}
/* projectiles, beams, weapon visuals, stunned / netted drones (bright pass) */
function drawCombat(){
  const s=S,m=s.m;
  for(const b of s.beams){ctx.globalAlpha=qa(b.l/.4);line(b.x1,b.y1,b.x2,b.y2,b.c,0)}ctx.globalAlpha=1;
  for(const t of s.towers){
    if(t.ty!=='laser'||!t.beam||!t.tgt||towerBusy(t))continue;
    const my=t.y-TWH[t.lv]-4,sx=t.x+Math.cos(t.ang)*7,sy=my+Math.sin(t.ang)*7;
    const bc=tierCol('laser',t.lv);line(sx,sy,t.tgt.x,t.tgt.y,t.beam>2.2?hx(mix(bc,'#ffffff',.4)):bc,t.beam>2?1.5:0);
    if(t.lv>=4){line(sx,sy-1,t.tgt.x,t.tgt.y-1,bc,0);line(sx,sy+1,t.tgt.x,t.tgt.y+1,bc,0)}if(t.lv>=7){line(sx-1,sy,t.tgt.x-1,t.tgt.y,bc,0);line(sx+1,sy,t.tgt.x+1,t.tgt.y,bc,0)}
    line(sx,sy,t.tgt.x,t.tgt.y,'#ffe0e8',0);
  }
  for(const p of s.shells){
    const k=p.t/p.T,x=p.x0+(p.x1-p.x0)*k,y=p.y0+(p.y1-p.y0)*k-Math.sin(Math.PI*k)*p.h;
    const sz=4+Math.floor((p.lv||1)/3),hc=tierCol('mortar',p.lv||1);R(x-sz/2,y-sz/2,sz,sz,'#2a2c22');R(x-sz/2+1,y-sz/2+1,sz-2,sz-2,hc);
    if((p.lv||1)>=5){ctx.globalAlpha=.4;R(x-sz,y-sz,sz*2,sz*2,hc);ctx.globalAlpha=1}
    if(k>.6){ctx.globalAlpha=.5;R(p.x1-3,p.y1,6,1,'#ff5a4a');ctx.globalAlpha=1}
  }
  for(const p of s.missiles){
    const a=Math.atan2(p.vy,p.vx),ca=Math.cos(a),sn=Math.sin(a),tl=p.tlv||0,L=p.small?3:5+tl*.5,hc=tl?tierCol('rocket',tl):'#ff5a4a';
    line(p.x-ca*L,p.y-sn*L,p.x,p.y,p.small?'#d0d6e2':'#e6ecff',0);if(tl>=4)line(p.x-ca*L-sn,p.y-sn*L+ca,p.x-sn,p.y+ca,'#e6ecff',0);R(p.x-1,p.y-1,2+(tl>=7?1:0),2+(tl>=7?1:0),hc);
    R(p.x-ca*(L+2)-1,p.y-sn*(L+2)-1,2+(tl>=5?1:0),2+(tl>=5?1:0),Math.floor(s.anim*30)%2?'#ffd36b':hc);
  }
  for(const p of s.nets){const r=Math.round(p.r),nc=tierCol('net',p.lv||1);for(let i=-r;i<=r;i+=3){R(p.x+i,p.y-r,1,r*2+1,nc);R(p.x-r,p.y+i,r*2+1,1,nc)}}
  for(const p of s.bul)R(p.x-1,p.y-1,2,2,p.c||'#ffe08a');
  /* main weapons of the characters */
  for(const r of s.rails){ctx.globalAlpha=qa(r.l/.3);line(r.x1,r.y1,r.x2,r.y2,'#5ad1e6',3);line(r.x1,r.y1,r.x2,r.y2,'#e6fbff',0)}ctx.globalAlpha=1;
  for(const w of s.saws){const k=Math.floor(w.spin)%2;R(w.x-3,w.y-3,6,6,'#b9c2cc');R(w.x-4,w.y-2,8,4,'#b9c2cc');R(w.x-1,w.y-1,2,2,'#59606c');
    if(k){R(w.x-4,w.y-4,1,1,'#ffffff');R(w.x+3,w.y+3,1,1,'#ffffff')}else{R(w.x+3,w.y-4,1,1,'#ffffff');R(w.x-4,w.y+3,1,1,'#ffffff')}}
  for(const g of s.nades){R(g.x-2,g.y-2,4,4,'#4a5a3a');R(g.x-1,g.y-1,2,2,g.stuck&&Math.floor(g.t*14)%2?'#ff5a4a':'#9dffb0')}
  for(const b of s.buddies){const f=Math.floor(s.anim*30)%2,d=b.dir||1;
    R(b.x-3,b.y-1,7,3,'#5a3a8a');R(b.x-2,b.y-2,5,1,'#8a6ac8');R(b.x-5,b.y-3,4,1,f?'#c9d6e6':'#59606c');R(b.x+2,b.y-3,4,1,f?'#59606c':'#c9d6e6');R(b.x+(d>0?1:-2),b.y,2,1,'#c58aff')}
  /* mechanic's passive weapons */
  if(s.wp.orbit){
    const n=PWD.orbit.n[s.wp.orbit];
    for(let i=0;i<n;i++){const[bx,by]=orbitPos(i,n);R(bx-3,by-2,7,5,'#8ff0ff');R(bx-2,by-3,5,7,'#8ff0ff');R(bx-2,by-2,5,5,'#e6ecff');R(bx-1,by-1,2,2,'#ffffff')}
  }
  if(s.slash)for(const q of s.slash){   /* katana: wide crescent sweep with a bright leading edge, afterglow and the blade itself */
    if(q.t<0)continue;
    const k=q.t/q.l,head=Math.min(1,k*1.6),n=Math.max(8,Math.round(q.r*.9)),span=2.9;
    for(let j=0;j<=n;j++){
      const u=j/n;if(u>head)break;
      const an=q.a+q.sd*(-span/2+span*u),age=head-u,fade=(1-k*.7)*(age>.55?.25:age>.3?.55:1),th=Math.max(1,Math.round(2+5*Math.sin(Math.PI*u)*(1-age)));
      ctx.globalAlpha=fade;
      for(let b=0;b<th;b++){const rr=q.r+2-b;R(q.x+Math.cos(an)*rr-1,q.y+Math.sin(an)*rr-1,2,2,b<=1?'#ffffff':b<3?'#bff4ff':'#5ad1e6')}
    }
    ctx.globalAlpha=1;
    {const an=q.a+q.sd*(-span/2+span*head),c1=Math.cos(an),s1=Math.sin(an);   /* the blade at the tip of the swing */
     line(q.x+c1*(q.r-12),q.y+s1*(q.r-12),q.x+c1*(q.r+4),q.y+s1*(q.r+4),'#ffffff',0);line(q.x+c1*(q.r-4),q.y+s1*(q.r-4),q.x+c1*(q.r+4),q.y+s1*(q.r+4),'#8ff0ff',0);
     R(q.x+c1*(q.r+4)-1,q.y+s1*(q.r+4)-1,3,3,'#ffffff');
     if(k<.8&&Math.random()<.7)s.fx.push({x:q.x+c1*(q.r+3),y:q.y+s1*(q.r+3),vx:-s1*q.sd*60+rnd(-25,25),vy:c1*q.sd*60+rnd(-25,25),g:0,l:rnd(.1,.25),c:Math.random()<.5?'#ffffff':'#8ff0ff',s:1})}
  }
  if(s.slashMk)for(const q of s.slashMk){const k=q.t/q.l;ctx.globalAlpha=1-k;const L=1+k*.8;line(q.x-q.dx*L,q.y-q.dy*L,q.x+q.dx*L,q.y+q.dy*L,'#ffffff',0);ctx.globalAlpha=(1-k)*.6;line(q.x-q.dx*L*.6,q.y-q.dy*L*.6+1,q.x+q.dx*L*.6,q.y+q.dy*L*.6+1,'#8ff0ff',0)}
  ctx.globalAlpha=1;
  if(s.wp.field){
    /* the field's edge is drawn by drawPlayerRanges (only when standing still) */
  }
  for(const d of s.drones){
    const y=d.y+Math.round(Math.sin(d.ph*3));
    if((d.net||0)>0){for(let i=-6;i<=6;i+=3){R(d.x+i,y-6,1,13,'#d8e0a0');R(d.x-6,y+i,13,1,'#d8e0a0')}}
    if((d.burn||0)>0){   /* flames licking up from the body */
      const fh=Math.max(3,Math.round(d.h*.5)),tt=Math.floor(s.anim*14+d.ph*3);
      for(let i=-1;i<=1;i++){const hh=2+((tt+i*2)%3+3)%3*Math.max(1,fh/3|0);R(d.x+i*d.w/4-1,y-d.h/2-hh,3,hh,'#ff5a1a');R(d.x+i*d.w/4,y-d.h/2-hh+1,1,Math.max(1,hh-2),'#ffd36b')}
      if(tt%2){ctx.globalAlpha=.35;R(d.x-d.w/2,y-d.h/2,d.w,d.h,'#ff7a2a');ctx.globalAlpha=1}
    }
    if((d.shock||0)>0){   /* tesla shock: crackling arcs, flickering body, dizzy sparks circling the head */
      const sd=Math.floor(s.anim*20+d.ph*7),rg=i=>{const v=Math.sin((sd+i*17.3)*12.9898)*43758.5453;return v-Math.floor(v)};
      for(let a=0;a<3;a++){
        let px=d.x+(rg(a)-.5)*d.w*.6,py=y+(rg(a+5)-.5)*d.h*.6;const ang=rg(a+9)*6.283;
        for(let j=0;j<4;j++){const nx=px+Math.cos(ang+(rg(a*4+j)-.5)*1.8)*5,ny=py+Math.sin(ang+(rg(a*4+j+20)-.5)*1.8)*5;line(px,py,nx,ny,j%2?'#e6fbff':'#9ad8ff',0);px=nx;py=ny}
      }
      if(sd%2){ctx.globalAlpha=.4;R(d.x-d.w/2-1,y-d.h/2-1,d.w+2,d.h+2,'#c9a8ff');ctx.globalAlpha=1}
      for(let i=0;i<3;i++){const a=s.anim*9+i*2.094;R(d.x+Math.cos(a)*(d.w/2+1)-1,y-d.h/2-5+Math.sin(a)*2,2,2,i%2?'#ffe08a':'#e6fbff')}
    }
    if((d.stun||0)>0&&Math.floor(s.anim*12+d.ph)%2){R(d.x-d.w/2-2,y-3,2,1,'#9ad8ff');R(d.x+d.w/2,y+1,2,1,'#9ad8ff');R(d.x-1,y-7,1,2,'#e6fbff')}
  }
}

/* ---------- tower bodies: every tower type has its own silhouette ----------
   Returns the y where the tower's head (turret / coil / dish ...) sits. */
function drawTowerBody(t,x,B,hh,ww,lv,body){
  const top=B-hh,sr=SUN.x<=x;
  switch(t.ty){
    case 'f':{   /* twin fuel tanks with a hazard band */
      const tw=Math.floor(ww/2)-1;
      for(const ox of[-Math.floor(ww/2),1]){R(x+ox,top+2,tw,hh-6,body);R(x+ox+1,top+1,tw-2,1,body);R(x+ox,top+2,1,hh-6,'rgba(255,255,255,.18)');R(x+ox+tw-2,top+2,2,hh-6,'rgba(0,0,0,.25)')}
      for(let i=top+6;i<B-7;i+=7){R(x-ww/2,i,ww,2,'#e0c040');for(let k=0;k<ww;k+=4)R(x-ww/2+k,i,2,2,'#2a2a2a')}
      return B-hh-3;
    }
    case 'mortar':{   /* low sandbag bunker */
      const hb=Math.round(hh*.6),tp=B-4-hb;
      for(let r=0,yy=B-8;yy>=tp;r++,yy-=4){for(let k=(r&1)*3-3;k<ww+3;k+=6)R(x-ww/2+k,yy,5,4,(((k+9)/6|0)+r)%2?'#8a7a52':'#77683f');R(x-ww/2-1,yy+3,ww+2,1,'#4a4028')}
      return tp-2;
    }
    case 'tesla':{   /* thin copper coil pylon */
      R(x-3,top,6,hh-4,'#4a3a2e');for(let i=top+2;i<B-5;i+=3)R(x-4,i,8,2,((i-top)/3|0)%2?'#c9803a':'#a8642a');
      R(sr?x+2:x-4,top,2,hh-4,'rgba(0,0,0,.25)');return B-hh-3;
    }
    case 'rocket':{   /* launcher on four splayed legs */
      for(const[a,b]of[[-ww/2,-ww/2+4],[ww/2-1,ww/2-5],[-ww/2+3,-ww/2+6],[ww/2-4,ww/2-7]])line(x+a,B-4,x+b,top+8,'#3a3f4a',0);
      line(x-ww/2+3,B-10,x+ww/2-4,top+12,'#2d3038',0);line(x+ww/2-4,B-10,x-ww/2+3,top+12,'#2d3038',0);
      R(x-ww/2+1,top+6,ww-2,3,body);R(x-ww/2+1,top+6,ww-2,1,'rgba(255,255,255,.2)');return top+5;
    }
    case 'laser':{   /* tapered prism with a glowing lens strip */
      const n=hh-4;for(let i=0;i<n;i++){const w=Math.max(4,Math.round(ww*(.4+.6*i/n)));R(x-w/2,top+i,w,1,i%5===0?'#3a3440':body)}
      R(x-1,top+2,2,n-4,Math.floor(S.anim*3+t.i)%3?'#ff4a6a':'#ff8aa0');R(sr?x+1:x-3,top+4,2,n-6,'rgba(0,0,0,.22)');return B-hh-3;
    }
    case 'emp':{   /* tripod mast */
      line(x-ww/2+1,B-4,x-1,top+4,'#6a707c',0);line(x+ww/2-1,B-4,x+1,top+4,'#6a707c',0);line(x,B-4,x,top+4,'#4a4f58',0);
      R(x-ww/2+3,top+Math.round(hh*.55),ww-6,1,'#4a4f58');R(x-3,top,6,5,body);R(x-3,top,6,1,'#9aa1ad');return top+1;
    }
    case 'net':{   /* open lattice frame */
      R(x-ww/2,top,2,hh-4,body);R(x+ww/2-2,top,2,hh-4,body);R(x-ww/2,top,ww,2,body);
      for(let i=top+2;i<B-6;i+=7){line(x-ww/2+2,i,x+ww/2-2,i+6,'#4a4e3c',0);line(x+ww/2-2,i,x-ww/2+2,i+6,'#4a4e3c',0)}
      return B-hh-3;
    }
    case 'decoy':{   /* striped barrier block, the pole and beacon sit on it */
      R(x-ww/2,B-10,ww,6,'#2a2a2a');for(let k=0;k<ww;k+=4)R(x-ww/2+k,B-10,2,6,'#ffc75a');R(x-ww/2,B-10,ww,1,'rgba(255,255,255,.25)');
      return B-10;
    }
    case 'magnet':{   /* squat riveted drum */
      const hb=Math.round(hh*.5),tp=B-4-hb;
      R(x-ww/2,tp,ww,hb,'#4a4f58');R(x-ww/2,tp,ww,2,'#7d838e');R(x-ww/2,B-6,ww,2,'#3a3f48');
      for(let k=2;k<ww-1;k+=4)R(x-ww/2+k,tp+3,1,1,'#9aa1ad');R(sr?x+ww/2-4:x-ww/2,tp+2,4,hb-2,'rgba(0,0,0,.22)');
      return tp-2;
    }
    case 'repair':{   /* small hangar with a green cross */
      const hb=Math.round(hh*.6),tp=B-4-hb;
      R(x-ww/2,tp,ww,hb,body);for(let i=0;i<5;i++)R(x-ww/2+i*2,tp-5+i,ww-i*4,1,'#3e5244');
      R(x-3,B-4-Math.min(8,hb-2),6,Math.min(8,hb-2),'#1d2620');R(x-ww/2+2,tp+2,4,4,'#e6fbff');R(x-ww/2+3,tp+2,2,4,'#3fbf62');R(x-ww/2+2,tp+3,4,2,'#3fbf62');
      return tp-6;
    }
    case 'solar':{   /* battery box on a short post */
      R(x-6,B-10,12,6,'#3a4a5a');R(x-6,B-10,12,1,'#6a7a8a');for(let k=-4;k<5;k+=3)R(x+k,B-8,1,3,'#7dff9a');
      return B-12;
    }
    default:{   /* machine gun: the original stacked block tower */
      R(x-ww/2,B-hh,ww,hh-4,body);R(x-ww/2,B-hh,ww,2,'#a8a49c');
      {const sw=Math.ceil(ww*.38),hw=Math.ceil(ww*.25);H(sr?x+ww/2-sw:x-ww/2,B-hh+2,sw,hh-6,'#000',5);H(sr?x-ww/2:x+ww/2-hw,B-hh+2,hw,hh-6,'#fff',3)}
      for(let i=6;i<hh-4;i+=5)R(x-ww/2,B-hh+i,ww,1,'#4a4742');
      if(lv>=3){R(x-ww/2-1,B-hh+4,1,hh-8,'#5d5953');R(x+ww/2,B-hh+4,1,hh-8,'#5d5953')}
      if(lv>=4)R(x-ww/2,B-hh+8,ww,2,'#e0782a');
      if(lv>=5)R(x-ww/2,B-hh+13,ww,2,'#e0782a');
      return B-hh-3;
    }
  }
}

/* ---------- travelling shots (no more instant straight lines) ----------
   Hit or miss is rolled when fired; damage lands when the bullet arrives. */
function shoot(x,y,d,o){
  const k=o.k||0,miss=Math.random()<(o.acc!==undefined?1-o.acc*(1-.35*Math.pow(k,1.6)):ACC.miss*Math.pow(k,1.6));
  S.shots.push({x,y,d,lx:d.x,ly:d.y,miss,ox:rnd(-12,12),oy:rnd(-10,10),dmg:o.dmg*PMUL*(1-ACC.fall*Math.min(1,k)),pl:o.pl,spark:o.spark,col:o.col,sp:o.sp||540,size:o.size||2,trail:o.trail||7,shape:o.shape,cb:o.cb});
}
/* cosmetic pellets fired by drones at what they attack */
function enemyShot(d,x,y){S.eshots.push({x:d.x,y:d.y+3,tx:x,ty:y,sp:260})}
/* railgun slug: pierces everything along its path */
function fireSlug(x,y,a,reach,dmg){S.slugs.push({x,y,x0:x,y0:y,vx:Math.cos(a)*1100,vy:Math.sin(a)*1100,reach,dmg:dmg*PMUL,hit:new Set()})}
function updateShots(dt){
  const s=S;
  s.shots=s.shots.filter(p=>{
    const alive=s.drones.includes(p.d)&&p.d.hp>0;if(alive){p.lx=p.d.x;p.ly=p.d.y}
    const tx=p.lx+(p.miss?p.ox:0),ty=p.ly+(p.miss?p.oy:0),ex=tx-p.x,ey=ty-p.y,ed=Math.hypot(ex,ey),st=p.sp*dt;
    p.a=Math.atan2(ey,ex);
    if(ed>st){p.x+=ex/ed*st;p.y+=ey/ed*st;return true}
    p.x=tx;p.y=ty;
    if(!p.miss&&alive){PLY=!!p.pl;hitDrone(p.d,p.dmg,p.spark);PLY=false;if(p.cb)p.cb(true)}
    else{if(alive)missFx(p.d);if(p.cb)p.cb(false)}
    return false;
  });
  s.eshots=s.eshots.filter(p=>{const ex=p.tx-p.x,ey=p.ty-p.y,ed=Math.hypot(ex,ey),st=p.sp*dt;if(ed<=st){puff(p.tx,p.ty,1,'#ff9a6a');return false}p.x+=ex/ed*st;p.y+=ey/ed*st;return true});
  s.slugs=s.slugs.filter(p=>{
    for(let k=0;k<4;k++){
      p.x+=p.vx*dt/4;p.y+=p.vy*dt/4;
      const tr=Math.hypot(p.x-p.x0,p.y-p.y0);if(tr>p.reach)return false;
      for(const d of s.drones){if(d.hp<=0||p.hit.has(d))continue;if(Math.hypot(d.x-p.x,d.y-p.y)<=d.w/2+3){p.hit.add(d);PLY=true;hitAt(d,p.dmg,'#e6fbff',rangeK(tr,p.reach));PLY=false}}
    }
    return p.x>-20&&p.x<W+20&&p.y>-40&&p.y<GW+10;
  });
}
function drawShots(){
  const s=S;
  for(const p of s.shots){
    const ca=Math.cos(p.a||0),sn=Math.sin(p.a||0);
    line(p.x-ca*p.trail,p.y-sn*p.trail,p.x,p.y,p.col,0);drawBullet(p);
  }
  for(const p of s.eshots){const a=Math.atan2(p.ty-p.y,p.tx-p.x);R(p.x-1,p.y-1,2,2,'#ff6a4a');R(p.x-Math.cos(a)*3,p.y-Math.sin(a)*3,1,1,'#ffb08a')}
  for(const p of s.slugs){const L=Math.hypot(p.vx,p.vy),ux=p.vx/L,uy=p.vy/L;line(p.x-ux*22,p.y-uy*22,p.x,p.y,'#5ad1e6',0);line(p.x-ux*10,p.y-uy*10,p.x,p.y,'#e6fbff',0);R(p.x-1.5,p.y-1.5,3,3,'#ffffff')}
}
/* player weapon ranges: hidden while moving, fade in when standing still */
function drawPlayerRanges(){
  const s=S,m=s.m,A=m.stillA||0;if(A<=.02)return;
  const cx=m.x,cy=m.y-10,W2=WEAP[s.weap];
  const rings=[[W2.r[s.mlv],MAINC[s.mlv]]];
  if(s.wp.shot)rings.push([PWD.shot.rng[s.wp.shot],'#ffe08a']);
  if(s.wp.mini)rings.push([PWD.mini.rng[s.wp.mini],'#ffb347']);
  if(s.wp.field)rings.push([PWD.field.r[s.wp.field],'#9ad8ff']);
  if(s.wp.katana)rings.push([PWD.katana.r[s.wp.katana],'#e6ecff']);
  for(const[r,c]of rings){ctx.globalAlpha=.5*A;pxCircle(cx,cy,r,c,3,5,s.anim*8)}
  ctx.globalAlpha=1;
}
