
/* ---------- update ---------- */
function bolt(x1,y1,x2,y2,c,snd,th){sfx(snd||(c==='#ffd36b'?'shot':'zap'));S.bolts.push({x1,y1,x2,y2,l:.1,c:c||'#8ff0ff',th})}
/* Distance falloff for every weapon: k = distance / weapon reach (0..1).
   At full reach a shot misses 55% of the time and does half damage. */
const ACC={miss:.55,fall:.5};
const rangeK=(dist,reach)=>clamp(dist/Math.max(1,reach),0,1.2);
function missFx(d){S.fx.push({x:d.x+rnd(-6,6),y:d.y+rnd(-6,6),vx:rnd(-20,20),vy:rnd(-30,-10),g:0,l:.25,c:'#9aa1ad',s:1});
  if(!(d.missT>S.anim)){d.missT=S.anim+.35;S.fx.push({text:'MISS',x:d.x,y:d.y-10,vx:rnd(-6,6),vy:-26,g:0,l:.75,c:'#e6ecff'})}}
function hitAt(d,dmg,spark,k){
  if(Math.random()<ACC.miss*Math.pow(k,1.6)){missFx(d);return false}
  hitDrone(d,dmg*(1-ACC.fall*Math.min(1,k)),spark);return true;
}
/* critical hits depend ONLY on the mechanic's own altitude (S.m.y), never on where the enemy is: chance 0% on the ground up to 20% at the top of the sky; damage multiplier 1.5x low down up to 2.5x at the top */
const CRIT={max:.2,mul0:1.5,mul1:2.5};
const critAlt=()=>clamp((GW-S.m.y)/(GW-24),0,1);
const critChance=()=>CRIT.max*critAlt();
const critMul=()=>CRIT.mul0+(CRIT.mul1-CRIT.mul0)*critAlt();
function hitDrone(d,dmg,spark){
  let crit=false;
  if(PLY){const cc=critChance();if(cc>0&&Math.random()<cc){dmg*=critMul();crit=true}}
  if(crit)d.critAt=S.anim;
  if(crit){const s=S;s.fx.push({text:'CRITICAL HIT!!',comic:1,x:clamp(d.x,95,W-95),y:d.y-34,vx:0,vy:-10,g:0,l:1,L:1,c:'#ffe23a'});sfx('crit')}   /* only the lettering: slow motion, zoom and the burst happen only when the hit kills */
  d.hp-=dmg;d.hit=.1;if(!spark)puff(d.x,d.y,2,'#8ff0ff');else if(Math.random()<.4)puff(d.x,d.y,1,spark)}

function boostNow(s){return Math.hypot(s.m.x-CX,(s.m.y-10)-(GW-17))<=CORE.near?1+(s.coreLv-1)/(CORE.max-1):1}
function update(dt){
  const s=S,m=s.m;s.anim+=dt;s.t+=dt;if(s.msgT>0)s.msgT-=dt;
  if(s.t>=CYC)newDay();
  if(s.t>=DAY&&!s.nightOn){s.nightOn=true;startNight()}

  /* research runs on its own once paid for */
  if(s.res.cur){
    const rc=s.res.cur,R2=RES[rc.key];rc.t+=dt;
    if(rc.t>=R2.time){s.res[rc.key]=1;s.res.cur=null;{const nx=resQ().shift();if(nx)s.res.cur={key:nx,t:0}}sfx('power');ring(CX,GW-17,6,90,.9,'#c58aff');ring(CX,GW-17,4,50,.6,'#e0c8ff');say('Riset selesai: '+R2.name+' terbuka',3.5)}
  }
  /* build menu: the held card fills up, then the action happens */
  let charge=-1;
  if(cardHold&&!cardHold.done){
    const o=ctxOptions().find(x=>x.key===cardHold.key);
    if(!o||o.state!=='ok')cardHold=null;
    else if(o.kind==='ctl'){
      const cr=s.crane,k=o.ctl;
      const c2=s.crane2;
      if(k==='up2')c2.h=Math.min(c2.h+36*dt,CR2.h[c2.lv-1]);
      else if(k==='dn2')c2.h=Math.max(c2.h-36*dt,cr.h+CRCLEAR);   /* cannot go below the safe area above platform 1 */
      else if(k==='up')cr.h=Math.min(cr.h+36*dt,CR.h[cr.lv-1],c2.h-CRCLEAR);   /* cannot rise into the safe area under platform 2 */
      else if(k==='dn')cr.h=Math.max(cr.h-36*dt,CR.hmin);
      else if(k==='l')cr.ox-=44*dt;else if(k==='r')cr.ox+=44*dt;
      else if(k==='l2')c2.ox-=44*dt;else if(k==='r2')c2.ox+=44*dt;
    }else{
      const need=HT[o.kind];
      cardHold.t+=dt;charge=cardHold.t/need;
      if(cardHold.t>=need){cardHold.done=1;completeHold(o)}
    }
  }
  sfxCharge(charge>.03&&charge<1?charge:-1);

  /* mechanic: walks on the ground, flies with the jetpack, is hurt by hard landings */
  /* crane: lifts the platform to its level, the platform slots ride with it */
  const cr=s.crane,pw=CR.w[cr.lv-1],c2=s.crane2,pw2=CR.w[c2.lv-1];
  c2.h=clamp(Math.max(c2.h,cr.h+CRCLEAR),CR.hmin+CRCLEAR,CR2.h[c2.lv-1]);cr.h=clamp(cr.h,CR.hmin,Math.min(CR.h[cr.lv-1],c2.h-CRCLEAR));
  cr.y+=clamp(GW-cr.h-cr.y,-60*dt,60*dt);
  const lo=CLMX+10+pw/2-CX,hi=CRMX-8-CX-pw/2;   /* platform 1 slides between the two masts */
  cr.ox+=clamp(clamp(cr.ox,lo,hi)-cr.ox,-40*dt,40*dt);
  const npx=CX+cr.ox,dpx=npx-cr.px;cr.px=npx;
  if(m.st==='p'&&m.pf===1)m.x+=dpx;
  c2.y+=clamp(GW-c2.h-c2.y,-60*dt,60*dt);   /* platform 2 (left crane) has its own controls and level */
  {const lo2=CLMX+10+pw2/2-CX,hi2=CRMX-8-CX-pw2/2;c2.ox+=clamp(clamp(c2.ox,lo2,hi2)-c2.ox,-40*dt,40*dt);const n2=CX+c2.ox,d2=n2-c2.px;c2.px=n2;if(m.st==='p'&&m.pf===2)m.x+=d2}
  for(const t of s.towers)if(t.pl===1){const tx=cr.px+CR.off[cr.lv-1][Math.min(t.k,CR.n[cr.lv-1]-1)];t.x+=(tx-t.x)*Math.min(1,dt*5);t.y=cr.y}
  else if(t.pl===2){const tx=c2.px+CR2.off[c2.lv-1][Math.min(t.k,CR2.n[c2.lv-1]-1)];t.x+=(tx-t.x)*Math.min(1,dt*5);t.y=c2.y}
  for(const bp of s.bps){const t=s.towers[bp.slot];bp.x=t.x;bp.top=t.y}
  if(m.st==='p'){const P=PLAT(m.pf);if(P)m.y=P.y;else{m.st=null;m.peak=m.y;m.vy=0}}
  const kb=keys.thr&&!jetIn.on,wantJet=jetIn.on||!!keys.thr;
  const jx=kb?((keys.r?1:0)-(keys.l?1:0)):jetIn.x,jy=kb?(keys.dn?.8:-1):jetIn.y;
  const wasAir=!m.st,wasThr=m.thr;
  m.hurt=Math.max(0,m.hurt-dt);m.zt=Math.max(0,m.zt-dt);
  if(!wantJet)m.lock=false;
  const wj=wantJet&&!m.lock;
  m.thr=wj&&(wasThr?m.bat>0:m.bat>.4);
  if(wasThr&&!m.thr&&wj){m.lock=true;say('Batre jetpack habis!',1.6)}
  if(m.thr){
    m.st=null;
    m.bat=Math.max(0,m.bat-MECH.drain*dt);
    m.vx+=(jx*MECH.vx-m.vx)*Math.min(1,dt*6);
    m.vy+=(jy*MECH.vy-m.vy)*Math.min(1,dt*6);
    if(Math.abs(jx)>.15)m.dir=jx>0?1:-1;
    m.peak=m.y;
    if(Math.random()<dt*45)s.fx.push({x:m.x-m.dir*7+rnd(-1,1),y:m.y-4,vx:rnd(-14,14),vy:rnd(70,120),g:0,l:rnd(.15,.3),c:Math.random()<.4?'#fff6c8':'#ffb347',s:2});
    if(m.bat<2.5){m.warn-=dt;if(m.warn<=0){m.warn=.45;sfx('beep')}}
  }else{
    m.bat=Math.min(MECH.bat,m.bat+MECH.charge*(1+solarBoost())*(1-darkness(s.t))*dt);   /* the solar panel only works while the sun is up */
    if(!wasAir){
      const din=((keys.r||g.r)?1:0)-((keys.l||g.l)?1:0);
      m.vx+=(din*70-m.vx)*Math.min(1,dt*9);if(din)m.dir=din;
      m.vy=0;
    }else{
      m.vy+=560*dt;
      m.vx-=m.vx*Math.min(1,dt*1.5);
      if(MECH.jet&&m.vy>JETF.v[MECH.jet]){   /* fall assist: the jetpack fires by itself and slows the fall */
        m.vy+=(JETF.v[MECH.jet]-m.vy)*Math.min(1,dt*7);m.soft=1;
        if(Math.random()<dt*40)s.fx.push({x:m.x-m.dir*5+rnd(-2,2),y:m.y-3,vx:rnd(-16,16),vy:rnd(60,110),g:0,l:rnd(.12,.25),c:Math.random()<.5?'#9ad8ff':'#e6fbff',s:2});
      }
      if(m.y<m.peak)m.peak=m.y;
    }
  }
  m.x=clamp(m.x+m.vx*dt,8,W-8);
  if(m.st==='p'){const P=PLAT(m.pf);if(!P||Math.abs(m.x-P.px)>P.w/2+2){m.st=null;m.peak=m.y;m.vy=0}}   /* walked off the edge */
  let ny=m.y+m.vy*dt;
  if(!m.st){
    let land=null;
    let lpf=0;for(const n of[2,1]){const P=PLAT(n);if(P&&m.vy>=0&&m.y<=P.y+.5&&ny>=P.y&&Math.abs(m.x-P.px)<=P.w/2+2){land='p';lpf=n;break}}
    if(!land&&ny>=GW)land='g';
    if(land){
      if(land==='p')m.pf=lpf;
      const sy=land==='p'?PLAT(lpf).y:GW,drop=sy-m.peak,soft=m.soft;m.soft=0;
      let dmg=drop>MECH.safe?Math.max(1,Math.ceil((drop-MECH.safe)/MECH.dmgPer)):0;
      if(dmg&&MECH.jet){const rd=JETF.red[MECH.jet];dmg=rd>=1?0:Math.max(1,Math.ceil(dmg*(1-rd)));if(!dmg&&soft){puff(m.x,sy-2,6,'#9ad8ff');ring(m.x,sy-2,2,14,.25,'#9ad8ff')}}
      if(dmg){
        m.hp-=dmg;m.hurt=.9;sfx('hurt');puff(m.x,sy-2,10,'#8a8f98');
        say('Mendarat keras! HP -'+dmg,1.8);
        if(m.hp<=0&&!s.over){m.hp=0;s.cause='mech';s.over=true;onOver()}
      }else if(m.vy>140)sfx('land');
      ny=sy;m.vy=0;m.peak=sy;m.st=land;
    }else if(ny<24){ny=24;if(m.vy<0)m.vy=0}
  }
  m.y=ny;
  /* standing near the energy core slowly restores the mechanic */
  if(!m.thr&&m.st==='g'&&Math.abs(m.x-CX)<=30&&m.hp<MECH.hp){
    m.hp=Math.min(MECH.hp,m.hp+.12*dt);
    m.rg=(m.rg||0)-dt;
    if(m.rg<=0){m.rg=.85;sfx('regen');ring(m.x,m.y-10,4,22,.7,'#7dff9a');ring(m.x,m.y-10,2,14,.5,'#d0ffd8')}
    m.rp=(m.rp||0)-dt;
    if(m.rp<=0){m.rp=.32;const L=rnd(.8,1.2);s.fx.push({plus:1,x:m.x+rnd(-13,13),y:m.y-rnd(6,22),vx:rnd(-6,6),vy:-rnd(18,36),g:0,l:L,L,c:Math.random()<.35?'#d0ffd8':'#4dff7a',z:1})}
    if(Math.random()<dt*14)s.fx.push({x:m.x+rnd(-9,9),y:m.y-rnd(0,6),vx:rnd(-6,6),vy:-rnd(30,60),g:0,l:rnd(.5,.9),c:'#7dff9a',s:2});
    if(Math.random()<dt*6)s.fx.push({light:1,x:m.x,y:m.y-12,r:26,rgb:'110,255,150',a:.45,l:.35,L:.35,vx:0,vy:0,g:0});
  }else m.rg=0;
  {const mv=Math.abs(m.vx)>4||!m.st||m.thr;m.stillT=mv?0:(m.stillT||0)+dt;m.stillA=clamp((m.stillT-.25)/.9,0,1)}   /* range markers fade in when standing still */
  sfxThrust(m.thr);
  camY+=(clamp(m.y-VH*.62,0,CAMYMAX)-camY)*Math.min(1,dt*4);

  /* drone raid: the wave queue is released over the first 60% of the night */
  if(s.nightOn&&s.queue.length){
    s.spawnT-=dt;
    if(s.spawnT<=0){
      /* later waves arrive in tight groups */
      const solo=s.queue[0]==='b',bx=rnd(30,W-30);
      let gs=solo?1:Math.max(1,1+Math.floor((s.day-1)/WAVE.bd));
      if(s.queue[0]==='m'){   /* a swarm: the whole crowd comes in at once, packed together */
        let c=0;while(c<s.queue.length&&s.queue[c]==='m'&&c<40)c++;
        for(let i=0;i<c;i++){s.queue.shift();spawnDrone('m',clamp(bx+rnd(-16,16),8,W-8));const q=s.drones[s.drones.length-1];q.y-=rnd(0,18);q.ox=rnd(-14,14)}
        gs=Math.max(2,Math.round(c/3));
      }else for(let i=0;i<gs&&s.queue.length;i++)spawnDrone(s.queue.shift(),gs>1?clamp(bx+rnd(-18,18),12,W-12):undefined);
      s.spawnT=(NIGHT*.6)/s.quota*gs*rnd(.6,1.4);
    }
  }

  /* blueprints: up to 4 robots per blueprint, the mechanic can help too */
  for(const b of s.bots)if(b.job&&!s.bps.includes(b.job)){b.job=null;b.onsite=false}
  for(const bp of s.bps){
    let n=s.bots.filter(b=>b.job===bp).length;
    while(n<6){
      let pick=null,bd=1e9;
      for(const b of s.bots){
        if(b.job||(b.st==='back'&&b.carry))continue;
        const d=Math.abs(b.x-bp.x)+Math.abs(b.y-bp.top);if(d<bd){bd=d;pick=b}
      }
      if(!pick)break;
      pick.job=bp;pick.onsite=false;pick.st='rest';pick.t=1;pick.atkD=null;n++;
    }
  }
  m.help=false;
  for(const bp of s.bps){
    let rate=0;
    for(const b of s.bots)if(b.job===bp&&b.onsite)rate+=.11;
    if((bp.kind==='tower'||bp.kind==='rebuild')&&Math.hypot(m.x-bp.x,(m.y-10)-(bp.top+2))<=34){
      rate+=.16;m.help=true;
      if(Math.abs(m.vx)<10)m.dir=bp.x>=m.x?1:-1;
    }
    bp.prog+=rate/(bp.work||1)*dt;
    if(rate>0&&Math.random()<dt*14)s.fx.push({x:bp.x+rnd(-12,12),y:bp.top,vx:rnd(-20,20),vy:-rnd(20,50),g:200,l:.4,c:Math.random()<.5?'#fff6c8':'#8ff0ff',s:1});
    if(bp.prog>=1){
      bp.done=1;sfx('built');
      if(bp.kind==='tup'){
        const t=s.towers[bp.slot];
        t.pop=.45;ring(bp.x,bp.top-12,6,34,.45,bp.what==='sh'?'#5ad1e6':bp.what==='au'?'#c58aff':'#ffd36b');
        if(bp.what==='au'){t.au++;puff(bp.x,bp.top-12,12,'#c58aff')}
        else if(bp.what==='sh'){t.sh++;t.shHp=SH.hp[t.sh];t.brk=false;puff(bp.x,bp.top-12,12,'#5ad1e6');say('Shield menara Lv '+t.sh+' aktif',2)}
        else{const h0=towerMaxHp(t);t.lv++;t.hp=Math.min(towerMaxHp(t),(t.hp||0)+towerMaxHp(t)-h0);puff(bp.x,bp.top-TWH[t.lv],12,'#ffd36b');say('Menara naik ke Lv '+t.lv,2)}
        t.cd=.5;
      }else if(bp.kind==='rebuild'){   /* the skeleton is restored exactly as it was */
        const t=s.towers[bp.slot],rn=t.ruin;
        if(rn){t.ty=rn.ty;t.lv=rn.lv;t.sh=rn.sh;t.au=rn.au;t.spent=rn.spent;t.ruin=null;t.hp=towerMaxHp(t);t.shHp=SH.hp[t.sh]||0;t.brk=false;t.cd=.5;t.pop=.5;
          ring(bp.x,bp.top-10,6,40,.5,'#7dff9a');puff(bp.x,bp.top-12,14,'#ffd36b');s.shake=Math.max(s.shake,.12)}
      }else if(bp.kind==='tower'){
        const t=s.towers[bp.slot];t.lv=1;t.cd=.5;t.ty=bp.ty||'g';t.hp=towerMaxHp(t);t.pop=.5;ring(bp.x,bp.top-10,6,36,.5,'#ffd36b');s.shake=Math.max(s.shake,.12);
        puff(bp.x,bp.top-12,12,'#ffd36b');say('Menara senapan mesin siap',1.8);
      }
    }
  }
  s.bps=s.bps.filter(b=>!b.done);

  /* robot workers: build blueprints; otherwise collect parts on the ground and scavenge by day, weld the campfire by night */
  s.bots.forEach((b,i)=>{
    b.ph+=dt;
    if((b.job||s.nightOn)&&b.fetch){b.fetch.claim=null;b.fetch=null}
    if(b.job){
      const bp=b.job,idx=s.bots.filter(o=>o.job===bp).indexOf(b);
      const tx=bp.x+([-10,10,-17,17,-24,24][idx]||0),ty=bp.top,dx=tx-b.x,dy=ty-b.y,dd=Math.hypot(dx,dy);
      if(dd>2){const st=Math.min(dd,48*dt);b.x+=dx/dd*st;b.y+=dy/dd*st;b.mv=1;b.dir=Math.sign(dx)||b.dir;b.onsite=false}
      else{b.mv=0;b.onsite=true;b.dir=bp.x>=b.x?1:-1}
      return;
    }
    /* idle robots fly up to a drone, stick to its body and weld it (damage grows with the core's robot upgrade) */
    b.attach=0;
    if(b.atkD&&(b.atkD.hp<=0||b.atkD.dead||b.atkD.flee||!s.drones.includes(b.atkD)))b.atkD=null;
    b.fighter=i<(curUp().bots|0);
    if(!b.fighter)b.atkD=null;
    if(b.fighter&&!b.atkD&&!b.carry){
      b.scanT=(b.scanT||0)-dt;
      if(b.scanT<=0){
        b.scanT=.35;let best=null,bd=BOTW.reach;
        for(const d of s.drones){
          if(d.hp<=0||d.flee||d.dead)continue;
          const dd=Math.hypot(d.x-b.x,d.y-b.y);if(dd>=bd)continue;
          if(s.bots.filter(o=>o.atkD===d).length>=3)continue;
          bd=dd;best=d;
        }
        if(best){b.atkD=best;b.ao=rnd(-3,3);if(b.fetch){b.fetch.claim=null;b.fetch=null}}
      }
    }
    if(b.atkD){
      const d=b.atkD,tx=d.x+b.ao,ty=d.y+d.h/2+4,dx=tx-b.x,dy=ty-b.y,dd=Math.hypot(dx,dy);
      b.onsite=false;
      if(dd>2.5){const st=Math.min(dd,BOTW.spd*dt);b.x+=dx/dd*st;b.y+=dy/dd*st;b.mv=1;b.dir=Math.sign(dx)||b.dir}
      else{
        b.x=tx;b.y=ty;b.mv=0;b.attach=1;b.dir=d.x>=b.x?1:-1;
        hurt(d,BOTW.dps[s.botw]*dt);
        if(Math.random()<dt*10)s.fx.push({x:b.x+rnd(-2,2),y:b.y-8,vx:rnd(-25,25),vy:-rnd(10,40),g:150,l:.3,c:Math.random()<.5?'#fff6c8':'#8ff0ff',s:1});
        if(!(b.sT>s.anim)){b.sT=s.anim+.45;sfx('tick')}
      }
      return;
    }
    if(b.y<GW){b.y=Math.min(GW,b.y+110*dt);b.mv=1;return}
    b.onsite=false;
    if(s.nightOn){
      b.st='weld';
      if(walk(b,CX+(i%2?1:-1)*(18+9*Math.floor(i/2)),26,dt)){
        b.dir=i%2?-1:1;b.weld+=dt;
        if(b.weld>=5){b.weld=0;if(s.hp<s.maxHp){s.hp++;puff(CX,GW-12,3,'#fff6c8')}}
      }
      return;
    }
    if(b.st==='weld'){b.st='rest';b.t=rnd(.5,2)}
    if(b.st==='rest'){
      b.mv=0;b.t-=dt;
      if(b.t<=0){
        const dr=s.drops.find(o=>o.rest&&o.y>=GW-1&&!o.claim);
        if(dr){dr.claim=b;b.fetch=dr;b.st='fetch'}
        else{b.st='go';b.tx=PILES[(Math.random()*PILES.length)|0]+rnd(-6,6)}
      }
    }
    else if(b.st==='fetch'){
      const dr=b.fetch;
      if(!dr||!s.drops.includes(dr)){b.fetch=null;b.st='rest';b.t=.3}
      else if(walk(b,dr.x,34,dt)){
        s.drops.splice(s.drops.indexOf(dr),1);b.fetch=null;
        b.carry=1;b.st='back';b.tx=CX+rnd(-10,10);sfx('tick');
      }
    }
    else if(b.st==='go'){if(walk(b,b.tx,26,dt)){b.st='dig';b.t=rnd(4,6)}}
    else if(b.st==='dig'){b.mv=0;b.t-=dt;if(b.t<=0){b.carry=1;b.st='back';b.tx=CX+rnd(-10,10)}}
    else if(b.st==='back'){
      if(walk(b,b.tx,26,dt)){
        if(b.carry){b.carry=0;s.coins++;sfx('tick');puff(b.x,GW-8,4,'#a9bccf')}
        b.st='rest';b.t=rnd(2,4);
      }
    }
  });

  /* machine gun towers on the ground */
  for(const t of s.towers){
    t.shT+=dt;t.shHit=Math.max(0,t.shHit-dt);t.pop=Math.max(0,t.pop-dt);
    if(t.au&&t.lv&&!towerBusy(t)&&nearTower(t)&&Math.random()<dt*6){   /* drifting frost motes inside the slow aura */
      const a=rnd(0,6.28),r=Math.sqrt(Math.random())*SL.r[t.au];
      s.fx.push({x:t.x+Math.cos(a)*r,y:t.y-TWH[t.lv]/2-3+Math.sin(a)*r,vx:rnd(-4,4),vy:rnd(4,10),g:0,l:rnd(.8,1.4),c:Math.random()<.5?'#e0c8ff':'#a98aff',s:1});
    }
    if(t.sh&&!t.brk&&t.shT>5&&t.shHp<SH.hp[t.sh])t.shHp=Math.min(SH.hp[t.sh],t.shHp+SH.hp[t.sh]*.06*dt);
    if(t.lv&&!Number.isFinite(t.hp))t.hp=towerMaxHp(t);
    t.dHit=Math.max(0,(t.dHit||0)-dt);t.hHit=Math.max(0,(t.hHit||0)-dt);
    if(t.lv<1||towerBusy(t)){t.beam=0;continue}
    t.cd-=dt;t.fl=Math.max(0,t.fl-dt);
    if(t.ty!=='g'&&t.ty!=='f'&&t.ty!=='gatling'&&t.ty!=='sniper'){updateTowerType(t,dt);continue}
    const mx=t.x,my=t.y-TWH[t.lv]-3,Y=TY[t.ty||'g'];let tg=null,bd=Y.rng[t.lv];
    for(const d of s.drones){if(d.hp<=0)continue;const dd=Math.hypot(d.x-mx,d.y-my);if(dd<bd&&dd>=(Y.min||0)){bd=dd;tg=d}}
    if(!tg)continue;
    t.ang=Math.atan2(tg.y-my,tg.x-mx);
    if(t.ty==='f'){
      /* flame: a stream of fire, every drone inside the cone keeps burning */
      const ca=Math.cos(t.ang),sn=Math.sin(t.ang),L=TWL[t.lv]+1,R0=Y.rng[t.lv];
      t.fl=.1;
      for(let k=0;k<2;k++){const sp=R0/.3*rnd(.55,1),pj=rnd(-16,16);s.fx.push({x:mx+ca*L,y:my+sn*L,vx:ca*sp-sn*pj,vy:sn*sp+ca*pj,g:-25,l:.3,c:flameCols(t.lv)[(Math.random()*3)|0],s:t.lv>=8?3:2})}
      if(t.cd<=0){
        t.cd=Y.cd[t.lv];sfx('burn');
        for(const d of s.drones){
          if(d.hp<=0)continue;
          const dx=d.x-mx,dy=d.y-my,dd=Math.hypot(dx,dy);
          if(dd>R0+d.w/2)continue;
          let da=Math.abs(Math.atan2(dy,dx)-t.ang);if(da>Math.PI)da=2*Math.PI-da;
          if(dd<14||da<=Y.cone){hitDrone(d,Y.dmg[t.lv]*(1-ACC.fall*rangeK(dd,R0)),'#ff9a3a');ignite(d,3+t.lv*.35,Y.dmg[t.lv]*3)}
        }
      }
    }else if(t.cd<=0){
      t.cd=Y.cd[t.lv];t.fl=.05;const sn=t.ty==='sniper',gt=t.ty==='gatling',pl=projLook(t.ty,t.lv);sfx(sn?'snipe':gt?'gat':'mg');
      const cr=!!Y.crit&&Math.random()<Y.crit[t.lv];   /* Gun: small chance of a double-damage shot */
      shoot(mx+Math.cos(t.ang)*(TWL[t.lv]+1),my+Math.sin(t.ang)*(TWL[t.lv]+1),tg,{dmg:Y.dmg[t.lv]*(cr?2:1),acc:Y.acc[t.lv],spark:cr?'#fff3b0':'#ffcf6a',k:rangeK(bd,Y.rng[t.lv]),col:cr?'#fff3b0':pl.col,sp:Y.sp||560,size:pl.size,trail:pl.trail,shape:pl.shape});
    }
  }


  PMUL=boostNow(s);s.pdm=PMUL;   /* the mechanic hits harder near an upgraded core */
  PLY=true;
  updateMainWeapon(dt);
  updateMainProjectiles(dt);
  updateWeapons(dt);
  PLY=false;
  PMUL=1;
  updateProjectiles(dt);

  /* knockback shock fronts: expand slowly and throw every drone touching the front.
     A drone that lands outside the front and flies back into it gets thrown again. */
  if(s.waves&&s.waves.length){
    for(const w of s.waves){
      w.r+=BLAST.sp*dt;
      for(const d of s.drones){
        if(d.kb>0)continue;
        const dx=d.x-w.x,dy=d.y-w.y,dd=Math.hypot(dx,dy)||1;
        if(dd>w.r+d.w/2+2||dd<w.r-d.w/2-8)continue;   /* only the moving front pushes */
        w.hit.add(d);
        const p=BLAST.pow*(.45+.55*Math.max(0,1-dd/BLAST.r))*(d.boss?.35:d.heavy?.6:1);
        d.kvx=dx/dd*p;d.kvy=dy/dd*p-70;d.kb=.75;d.chase=false;d.atk=null;d.hit=.15;
        d.hp-=BLAST.dmg*(.5+.5*Math.max(0,1-dd/BLAST.r))*(d.boss?.5:1)*boostNow(s);   /* the shock also hurts */
        puff(d.x,d.y,4,'#8ff0ff');
      }
    }
    s.waves=s.waves.filter(w=>w.r<BLAST.r);
  }
  /* daytime lure: the 4 drones are released one at a time */
  if(s.lq&&s.lq.length&&!s.nightOn){
    for(const L of s.lq){
      if(L.n>0){L.t-=dt;if(L.t<=0){spawnDrone('s',rnd(30,W-30));const q=s.drones[s.drones.length-1];q.drop=Math.round(q.drop*1.5);q.lure=L.id;L.n--;L.t=3.2}}
    }
    s.lq=s.lq.filter(L=>L.n>0||s.drones.some(d=>d.lure===L.id&&d.hp>0&&!d.flee&&!d.dead));   /* a raid is over once every drone of it is gone */
  }   /* lured drones drop 50% more parts */
  /* drones: fly down toward the campfire, stop to chew through platforms in the way */
  for(const d of s.drones){
    d.ph+=dt;d.hit=Math.max(0,d.hit-dt);d.cd-=dt;
    const ox0=d.x,oy0=d.y;d.stun=Math.max(0,(d.stun||0)-dt);d.net=Math.max(0,(d.net||0)-dt);d.shock=Math.max(0,(d.shock||0)-dt);let dc=null;
    if(d.burn>0){   /* on fire: keeps taking damage until the flames die out */
      d.burn-=dt;hurt(d,d.bdps*dt);
      if(Math.random()<dt*20)s.fx.push({x:d.x+rnd(-d.w/3,d.w/3),y:d.y-rnd(0,d.h/2),vx:rnd(-8,8),vy:-rnd(20,50),g:-30,l:rnd(.25,.5),c:['#ffd36b','#ff9a3a','#ff5a1a'][(Math.random()*3)|0],s:2});
      if(Math.random()<dt*5)puff(d.x,d.y-d.h/2,1,'#4a4f58');
      if(d.burn<=0){d.bdps=0;puff(d.x,d.y-d.h/2,4,'#8a8f98')}
    }
    const tx=CX+d.ox,ty=GW-16,dx=tx-d.x,dy=ty-d.y,dist=Math.hypot(dx,dy);
    /* aggro: a drone that comes within range of the mechanic chases him, and gives up once he is out of the (wider) leash range */
    const pdx=m.x-d.x,pdy=(m.y-10)-d.y,pd=Math.hypot(pdx,pdy);
    /* drones go for the nearest building (tower or the core) */
    const nb=nearestBuilding(d,dist);
    if(!d.chase&&pd<=AGGRO.on&&pd<nb[1])d.chase=true;else if(d.chase&&(pd>AGGRO.off||pd>nb[1]+30))d.chase=false;
    /* slow aura: inside any active aura the drone moves 4x slower */
    /* slow auras: 10% each, overlapping auras stack up to 50% */
    let na=0;
    for(const t of s.towers){if(t.au&&t.lv&&!towerBusy(t)&&Math.hypot(d.x-t.x,d.y-(t.y-TWH[t.lv]/2-3))<SL.r[t.au])na++}
    d.slow=na>0;const sf=1-Math.min(SL.cap,SL.f*na);
    let tgx=null,tgy=0,spd=d.sp*sf;
    if(d.kb>0){
      d.kb-=dt;d.atk=null;d.chase=false;
      d.x=clamp(d.x+d.kvx*dt,4,W-4);d.y=clamp(d.y+d.kvy*dt,-30,GW-8);
      const k=Math.exp(-2.6*dt);d.kvx*=k;d.kvy=d.kvy*k+40*dt;
      if(Math.random()<dt*30)s.fx.push({x:d.x,y:d.y,vx:-d.kvx*.1,vy:-d.kvy*.1,g:0,l:.25,c:'#8ff0ff',s:1});
    }else if(d.shock>0){   /* tesla shock: it thrashes about in random directions and cannot attack */
      d.atk=null;d.chase=false;d.rt=(d.rt||0)-dt;
      if(d.rt<=0){d.rt=rnd(.05,.14);const a=rnd(0,6.283),v=rnd(45,110);d.rvx=Math.cos(a)*v;d.rvy=Math.sin(a)*v}
      d.x=clamp(d.x+d.rvx*dt,4,W-4);d.y=clamp(d.y+d.rvy*dt,-30,GW-8);
    }else if(d.stun>0||d.net>0){   /* EMP-stunned or netted: cannot move or attack */
      d.atk=null;if(d.stun>0)d.y=Math.min(GW-8,d.y+14*dt);
    }else if(d.flee){
      d.atk=null;d.y-=d.sp*1.4*sf*dt;d.x+=Math.sin(d.ph*2.2)*10*sf*dt;
      if(d.y<Math.max(-30,camY-34))d.dead=1;
    }else if((dc=decoyFor(d))){   /* a decoy beacon in range wins over the mechanic and the core */
      const dy2=dc.y-TWH[dc.lv]-4;
      if(Math.hypot(dc.x-d.x,dy2-d.y)<=14){
        d.atk='decoy';d.dc=dc;
        if(d.cd<=0){d.cd=1;dc.dHit=.25;enemyShot(d,dc.x,dy2);damageTower(dc,d.dmg)}
      }else{d.atk=null;tgx=dc.x;tgy=dy2}
    }else if(d.chase){
      d.atk=null;spd*=1.15;
      /* an active shield that is closer than the mechanic gets attacked first */
      let sh=null,sd=1e9;
      for(const t of s.towers){
        if(!shActive(t))continue;
        const dd=Math.hypot(d.x-t.x,d.y-(t.y-TWH[t.lv]/2-3));
        if(dd>SH.r[t.sh]&&dd-SH.r[t.sh]<sd){sd=dd-SH.r[t.sh];sh=t}
      }
      if(sh&&sd<pd){tgx=sh.x;tgy=sh.y-TWH[sh.lv]/2-3}else{tgx=m.x;tgy=m.y-10}
    }else if(nb[0]){
      const bt=nb[0],cy2=bt.y-TWH[bt.lv]/2-2;
      if(nb[1]<=10+d.w/2){d.atk='tower';d.tw=bt;if(d.cd<=0){d.cd=1;enemyShot(d,bt.x,cy2);damageTower(bt,d.dmg)}}
      else{d.atk=null;tgx=bt.x;tgy=cy2}
    }else{
      if(dist<=18){
      d.atk='fire';
      if(d.cd<=0){d.cd=1;enemyShot(d,CX+d.ox*.4,GW-16);s.hp-=d.dmg;sfx('burn');puff(CX,GW-14,3,'#ff9a6a');ring(CX,GW-17,4,22,.3,'#ff6a4a');s.fx.push({light:1,x:CX,y:GW-16,r:50,rgb:'255,80,60',a:.6,l:.3,L:.3,vx:0,vy:0,g:0});s.shake=Math.max(s.shake,.18);s.coreHit=.3}
      }else{d.atk=null;tgx=tx;tgy=ty}
    }
    if(tgx!==null){
      const ex=tgx-d.x,ey=tgy-d.y,ed=Math.hypot(ex,ey);
      if(ed>5){
        const nx=d.x+ex/ed*spd*dt+Math.sin(d.ph*2.2)*(d.chase?8:10)*dt,ny=d.y+ey/ed*spd*dt;
        let blk=null;   /* no drone gets into an active shield from outside, whether it hunts the mechanic or the core */
        for(const t of s.towers){
          if(!shActive(t))continue;
          const cx=t.x,cy=t.y-TWH[t.lv]/2-3,r=SH.r[t.sh];
          if(Math.hypot(nx-cx,ny-cy)<r&&Math.hypot(d.x-cx,d.y-cy)>=r){blk=t;break}
        }
        if(blk){
          d.atk='shield';d.sh=blk;
          if(d.cd<=0){
            d.cd=1;enemyShot(d,nx,ny);blk.shHp-=d.dmg;blk.shT=0;blk.shHit=.3;sfx('clank');
            if(blk.shHp<=0){blk.shHp=0;blk.brk=true;puff(blk.x,blk.y-12,10,'#5ad1e6');s.fx.push({light:1,x:blk.x,y:blk.y-12,r:70,rgb:'143,240,255',a:.7,l:.4,L:.4,vx:0,vy:0,g:0});ring(blk.x,blk.y-TWH[blk.lv]/2-3,SH.r[blk.sh]*.6,SH.r[blk.sh]*1.3,.5,'#8ff0ff');s.shake=Math.max(s.shake,.2)}
          }
        }else{d.x=nx;d.y=ny}
      }
    }
    if(Math.abs(d.x-m.x)<d.w/2+5&&Math.abs(d.y-(m.y-9))<d.h/2+9&&m.hurt<=0&&!d.flee&&!(d.kb>0)&&!(d.stun>0)&&!(d.net>0)&&!(d.shock>0)){
      const lose=Math.min(s.coins,d.boss?4:d.heavy?3:d.swarm?1:2),away=m.x>=d.x?1:-1;
      s.coins-=lose;m.hurt=1.2;m.vx=away*80;
      m.hp-=d.boss?3:d.heavy?2:d.swarm?.5:1;s.shake=Math.max(s.shake,.25);
      m.st=null;m.peak=m.y;m.vy=-110;m.y-=1;
      for(let i=0;i<lose;i++)s.fx.push({x:m.x,y:m.y-14,vx:rnd(-50,50),vy:rnd(-110,-60),g:400,l:.6,c:'#a9bccf',s:2});
      sfx('hurt');say(lose?'Drone menyerangmu dan mencuri suku cadang!':'Drone menyerangmu!',1.8);
      if(m.hp<=0&&!s.over){m.hp=0;s.cause='mech';s.over=true;onOver()}
    }
    if(d.hp<=0){
      sfx('boom');s.fx.push({light:1,x:d.x,y:d.y,r:d.boss?120:d.heavy?64:42,rgb:'255,180,90',a:.95,l:.4,L:.4,vx:0,vy:0,g:0});ring(d.x,d.y,3,d.boss?60:d.heavy?26:16,d.boss?.6:.3,'#ffd36b');if(d.boss||d.heavy)s.shake=Math.max(s.shake,d.boss?.6:.15);
      for(let i=0;i<(d.boss?8:3);i++)s.fx.push({x:d.x,y:d.y,vx:rnd(-90,90),vy:rnd(-120,-20),g:320,l:rnd(.5,.9),c:'#5a6070',s:2});
      puff(d.x,d.y,d.boss?24:9,'#8a96a8');puff(d.x,d.y,d.boss?12:4,'#ffb347');s.kills++;
      d.drop+=magnetBonus(d.x,d.y);
      const ck=d.critAt!==undefined&&s.anim-d.critAt<.25;
      if(ck){   /* killed by a critical hit: it bursts into pieces with a bigger explosion */
        const cls=d.boss?'b':d.heavy?'h':d.swarm?'m':'s',bc=(DBODY[cls]||DBODY.s)[d.v|0]||'#59606c',n=d.boss?40:d.heavy?28:20;
        for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(50,210);s.fx.push({x:d.x,y:d.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,g:260,l:rnd(.6,1.2),c:['#59606c','#8e99a8','#3a4252',bc,'#ffb347'][i%5],s:i%4===0?3:2})}
        for(let i=0;i<14;i++){const a=i/14*6.283+rnd(-.2,.2),v=rnd(120,260);s.fx.push({x:d.x,y:d.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,l:rnd(.12,.28),c:i&1?'#ffffff':'#ffd36b',s:1})}
        ring(d.x,d.y,2,d.boss?90:40,.45,'#ffffff');ring(d.x,d.y,2,d.boss?64:28,.4,'#ff9a3a');ring(d.x,d.y,2,d.boss?40:16,.3,'#ffe08a');
        s.fx.push({light:1,x:d.x,y:d.y,r:d.boss?170:100,rgb:'255,200,110',a:1,l:.55,L:.55,vx:0,vy:0,g:0});
        puff(d.x,d.y,16,'#ff8a3a');puff(d.x,d.y,12,'#3a3f4a');s.shake=Math.max(s.shake,.45);
      }
      {   /* the farther from the base (higher up), the likelier one extra part drops: 0% at the base, 70% at the top */
        const far=clamp(Math.hypot(d.x-CX,d.y-(GW-16))/(GW-16),0,1);
        if(Math.random()<.7*far){d.drop++;s.fx.push({text:'+1',x:d.x,y:d.y-8,vx:0,vy:-26,g:0,l:.8,c:'#ffe08a'})}
      }
      if(ck&&!s.slow){s.slow={t:0,T:.5,x:d.x,y:d.y};sfx('slowmo');sfx('shatter')}   /* killed by a critical hit: slow motion + zoom */
      for(let i=0;i<d.drop;i++){const a=rnd(0,6.283),v=rnd(35,125);s.drops.push({x:d.x,y:d.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-35,ph:rnd(0,6),life:70})}   /* the blast throws parts in every direction */
      d.dead=1;
    }
    if(dt>0){d.vx=(d.x-ox0)/dt;d.vy=(d.y-oy0)/dt}
  }
  s.drones=s.drones.filter(d=>!d.dead);

  /* dropped spare parts fall to the nearest surface */
  s.drops=s.drops.filter(dr=>{
    dr.life-=dt;if(dr.life<=0)return false;
    const mg=magnetNear(dr.x,dr.y);
    if(mg){   /* magnet tower pulls parts in */
      const tx=mg.x,ty=mg.y-TWH[mg.lv]-4,ex=tx-dr.x,ey=ty-dr.y,ed=Math.hypot(ex,ey)||1;
      if(ed<6){s.coins++;sfx('tick');puff(tx,ty,3,'#ff9a9a');return false}
      const sp=Math.min(ed/dt,90);dr.x+=ex/ed*sp*dt;dr.y+=ey/ed*sp*dt;dr.rest=false;dr.vy=0;dr.vx=0;dr.claim=null;return true;
    }
    if(!dr.rest){
      dr.vy+=300*dt;const ny=dr.y+dr.vy*dt;let ly=ny>=GW?GW:1e9,hit=ny>=GW;
      if(dr.vx){dr.x=clamp(dr.x+dr.vx*dt,4,W-4);dr.vx*=Math.exp(-.7*dt)}
      if(hit){dr.y=ly;dr.rest=true;dr.vy=0;dr.vx=0}else dr.y=ny;
    }
    if(Math.abs(dr.x-m.x)<12&&dr.y>m.y-20&&dr.y<m.y+6){s.coins++;sfx('pickup');puff(dr.x,dr.y-3,3,'#d8e6f2');return false}
    return true;
  });

  if(Math.random()<dt*5)s.fx.push({x:CX+rnd(-3,3),y:GW-14,vx:rnd(-6,6),vy:-rnd(20,40),g:-8,l:rnd(.5,1),c:'#8ff0ff',s:1});
  s.shake=Math.max(0,s.shake-dt);s.coreHit=Math.max(0,(s.coreHit||0)-dt);
  s.pulseT-=dt;if(s.pulseT<=0){s.pulseT=1.8;ring(CX,GW-17,6,34,1.1,'#5ad1e6')}   /* the core breathes out a soft energy ring */
  for(const f of s.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=f.g*dt;f.l-=dt}
  s.fx=s.fx.filter(f=>f.l>0);
  for(const b of s.bolts)b.l-=dt;
  s.bolts=s.bolts.filter(b=>b.l>0);

  if(s.hp<=0&&!s.over){s.hp=0;s.cause='fire';s.over=true;onOver()}
}
