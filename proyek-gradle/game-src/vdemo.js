/* ---------- workshop demo: a small live scene that shows how the selected weapon works in the real game ----------
   A mini simulation on its own canvas: the mechanic stands in the middle, drones fly in, the weapon fires at its real stats
   (level currently owned, at least 1), and the dashed ring is the weapon's real reach. Nothing here touches the game state. */
const dmCan=$('hgDemo'),dmG=dmCan.getContext('2d');
const DMW=320,DMH=176,DMGY=DMH-26;
const DEMOK=['main','katana','orbit','shot','mini','field','aura'];
const DM={sig:'',t:0,dr:[],fx:[],pr:[],bl:[],sw:[],cd:0,ch:0,k:'main',lv:1,R:60,sc:1,spawnT:0,wave:null,wt:0,stat:{}};
function demoSpec(){
  const c=viewChar(),u=prof().chars[c.id].up,k=hgSel;
  if(!DEMOK.includes(k))return null;
  const lv=Math.max(1,u[k]|0);
  let R=60,col='#8ff0ff';
  if(k==='main'){const W=WEAP[c.weap];R=W.r[lv];col=MAINC[lv]}
  else if(k==='katana'){R=PWD.katana.r[lv];col='#e6ecff'}
  else if(k==='orbit'){R=PWD.orbit.r[lv]+8;col='#8ff0ff'}
  else if(k==='shot'){R=PWD.shot.rng[lv];col='#ffe08a'}
  else if(k==='mini'){R=PWD.mini.rng[lv];col='#ffb347'}
  else if(k==='field'){R=PWD.field.r[lv];col='#9ad8ff'}
  else if(k==='aura'){R=Math.round(192*(1+.15*lv));col='#8ff0ff'}
  return{k,lv,R,col,ch:c};
}
function demoReset(sp){
  Object.assign(DM,{k:sp.k,lv:sp.lv,R:sp.R,col:sp.col,ch:sp.ch,dr:[],fx:[],pr:[],bl:[],sw:[],cd:.4,chg:0,t:0,spawnT:0,wave:null,wt:1.2,stat:{}});
  DM.sc=clamp(Math.min((DMW/2-6)/sp.R,(DMGY-12)/sp.R),.26,2.3);
  DM.ref=demoDmg();
  for(let i=0;i<DM.want();i++)demoSpawn(true);
}
DM.want=()=>DM.k==='katana'||DM.k==='field'||DM.k==='orbit'?5:DM.k==='aura'?6:4;
function demoDmg(){
  const k=DM.k,lv=DM.lv;
  if(k==='main')return WEAP[DM.ch.weap].dmg[lv];
  if(k==='katana')return PWD.katana.dmg[lv];
  if(k==='orbit')return PWD.orbit.dmg[lv];
  if(k==='shot')return PWD.shot.dmg[lv]*3;
  if(k==='mini')return PWD.mini.dmg[lv];
  if(k==='field')return PWD.field.dps[lv]*1.2;
  return 8;
}
function demoSpawn(near){
  const heavy=Math.random()<.22,sc=DM.sc,halfW=DMW/2/sc,topY=(DMGY-14)/sc;
  const side=Math.random()<.5?-1:1;
  const x=near?side*rnd(DM.R*.5,Math.min(halfW-6,DM.R*1.3)):side*(halfW+8),y=rnd(26,Math.max(40,topY-8));
  DM.dr.push({x,y,hp:0,mx:0,heavy,w:heavy?20:12,h:heavy?9:6,ph:rnd(0,6),hit:0,kvx:0,kvy:0,kb:0,tt:0,ob:0});
  const d=DM.dr[DM.dr.length-1];d.mx=d.hp=DM.ref*(heavy?9:3.2)*(DM.k==='field'?1.6:1);
}
const dmNear=(x,y,r,skip)=>{let b=null,bd=r;for(const d of DM.dr){if(d.dead||(skip&&skip(d)))continue;const dd=Math.hypot(d.x-x,d.y-y);if(dd<bd){bd=dd;b=d}}return b};
const dmCy=10;   /* height of the mechanic's body centre above the ground */
function dmHit(d,dmg,fxc){d.hp-=dmg;d.hit=.1;for(let i=0;i<2;i++)DM.fx.push({x:d.x,y:d.y,vx:rnd(-40,40),vy:rnd(10,60),g:-160,l:rnd(.15,.3),c:fxc||'#e6fbff'})}
function dmBolt(x1,y1,x2,y2,c,l){DM.bl.push({x1,y1,x2,y2,l:l||.12,c})}
function demoStep(dt){
  const k=DM.k,lv=DM.lv,mx=0,my=dmCy;DM.t+=dt;
  /* drones: fly in, hover close to the mechanic */
  for(const d of DM.dr){
    d.ph+=dt;d.hit=Math.max(0,d.hit-dt);d.tt+=dt;
    if(d.kb>0){d.kb-=dt;d.x+=d.kvx*dt;d.y+=d.kvy*dt;d.kvx*=Math.exp(-2.6*dt);d.kvy=d.kvy*Math.exp(-2.6*dt)-30*dt}
    else{
      const dx=mx-d.x,dy=my+4-d.y,dd=Math.hypot(dx,dy)||1,sp=(22/DM.sc+30)*(d.heavy?.7:1),stop=d.heavy?20:15;
      if(dd>stop){d.x+=dx/dd*sp*dt;d.y+=dy/dd*sp*dt}
      else{d.x+=Math.sin(d.ph*2.2)*8*dt;d.y+=Math.cos(d.ph*3)*6*dt}
    }
    d.y=clamp(d.y,6,DMGY/DM.sc-4);
    if(d.hp<=0&&!d.dead){
      d.dead=1;
      for(let i=0;i<12;i++){const a=rnd(0,6.28),v=rnd(30,90);DM.fx.push({x:d.x,y:d.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:-120,l:rnd(.25,.6),c:['#ffd36b','#ff9a3a','#5a6070','#ffffff'][i&3]})}
      DM.pr.push({ring:1,x:d.x,y:d.y,t:0,l:.3,r:d.heavy?20:12});
    }
  }
  DM.dr=DM.dr.filter(d=>!d.dead);
  DM.spawnT-=dt;if(DM.dr.length<DM.want()&&DM.spawnT<=0){demoSpawn(false);DM.spawnT=.7}
  DM.cd-=dt;
  const W=DM.k==='main'?WEAP[DM.ch.weap]:null;
  if(k==='main'){
    const wp=DM.ch.weap;
    if(wp==='weld'&&DM.cd<=0){const t=dmNear(mx+6,my,W.r[lv]);if(t){sfx('x_weld');DM.cd=W.cd[lv];let cur=t,px=mx+8,py=my-2;const seen=new Set();for(let j=0;j<=W.chain[lv]&&cur;j++){seen.add(cur);dmHit(cur,W.dmg[lv]*(j?.7:1),'#8ff0ff');dmBolt(px,py,cur.x,cur.y,MAINC[lv]);px=cur.x;py=cur.y;cur=dmNear(px,py,70,d=>seen.has(d))}}}
    if(wp==='rail'){
      if(dmNear(mx,my,W.r[lv]*1.05)||DM.chg>0){DM.chg+=dt;
        if(DM.chg>=W.cd[lv]){DM.chg=0;const t=dmNear(mx,my,W.r[lv]*1.05);if(t){sfx('x_rail');const a=Math.atan2(t.y-my,t.x-mx),L=W.r[lv]*1.3;
          DM.sw.push({kind:'rail',x:mx,y:my,a,L,t:0,l:.3});
          for(const d of DM.dr){const px=d.x-mx,py=d.y-my,al=px*Math.cos(a)+py*Math.sin(a),pe=Math.abs(-px*Math.sin(a)+py*Math.cos(a));if(al>0&&al<L&&pe<d.w/2+3)dmHit(d,W.dmg[lv],'#5ad1e6')}}}}
    }
    if(wp==='saw'&&DM.cd<=0){const t=dmNear(mx,my,W.r[lv]);if(t){sfx('x_saw');DM.cd=W.cd[lv];const n=lv>=5?3:lv>=3?2:1;for(let i=0;i<n;i++){const a=Math.atan2(t.y-my,t.x-mx)+(n>1?(i-(n-1)/2)*.35:0);DM.sw.push({kind:'saw',a,t:0,l:1.1,R:W.r[lv],hits:new Map()})}}}
    if(wp==='nade'&&DM.cd<=0){const t=dmNear(mx,my,W.r[lv]);if(t){sfx('x_throw');DM.cd=W.cd[lv];DM.sw.push({kind:'nade',x:mx+6,y:my,tx:t.x,ty:t.y,t:0,T:.45,tgt:t,stuck:0,spl:W.spl[lv]})}}
    if(wp==='buddy'){
      const n=lv>=5?2:1;DM.stat.bd=DM.stat.bd||[0,0];
      for(let i=0;i<n;i++){DM.stat.bd[i]-=dt;if(DM.stat.bd[i]<=0){const bx=mx+Math.cos(DM.t*1.6+i*3.14)*16,by=my+10+Math.sin(DM.t*2+i)*4,t=dmNear(bx,by,W.r[lv]);if(t){sfx('x_buddy');DM.stat.bd[i]=W.cd[lv];const a=Math.atan2(t.y-by,t.x-bx);DM.pr.push({kind:'bul',x:bx,y:by,vx:Math.cos(a)*300,vy:Math.sin(a)*300,l:W.r[lv]/300,dmg:W.dmg[lv],c:'#c58aff'})}else DM.stat.bd[i]=.15}}
    }
  }
  if(k==='katana'&&DM.cd<=0){
    const r=PWD.katana.r[lv],hits=DM.dr.filter(d=>Math.hypot(d.x-mx,d.y-my)<=r+d.w/2);
    if(hits.length){sfx('slash');DM.cd=PWD.katana.cd[lv];const a=Math.atan2(hits[0].y-my,hits[0].x-mx);
      for(const d of hits){dmHit(d,PWD.katana.dmg[lv],'#ffffff');const ha=Math.atan2(d.y-my,d.x-mx);for(let i=0;i<8;i++){const sa=ha+rnd(-1.2,1.2),v=rnd(60,160);DM.fx.push({x:d.x,y:d.y,vx:Math.cos(sa)*v,vy:Math.sin(sa)*v,g:-200,l:rnd(.15,.35),c:i%3?'#ffffff':'#8ff0ff'})}
        DM.pr.push({ring:1,x:d.x,y:d.y,t:0,l:.22,r:14});d.kvx=Math.cos(ha)*150;d.kvy=Math.sin(ha)*150;d.kb=.18}
      const cuts=lv>=4?3:lv>=2?2:1;for(let i=0;i<cuts;i++){DM.sw.push({kind:'slash',a:a+(i===1?.5:i===2?-.5:0),t:-i*.07,l:.3,r:r+6+i*2,sd:(i%2?-1:1)*(DM.katSd=-(DM.katSd||1))})}}
  }
  if(k==='orbit'){const n=PWD.orbit.n[lv],r=PWD.orbit.r[lv];for(let i=0;i<n;i++){const a=DM.t*3.2+i*6.283/n,bx=mx+Math.cos(a)*r,by=my+Math.sin(a)*r*.8;for(const d of DM.dr)if((d.ob||0)<=DM.t&&Math.hypot(d.x-bx,d.y-by)<=d.w/2+6){d.ob=DM.t+.4;sfx('x_orbit');dmHit(d,PWD.orbit.dmg[lv],'#e6ecff')}}}
  if(k==='shot'&&DM.cd<=0){const P=PWD.shot,t=dmNear(mx,my,P.rng[lv]);if(t){sfx('x_shot');DM.cd=P.cd[lv];const base=Math.atan2(t.y-my,t.x-mx),n=P.n[lv];for(let i=0;i<n;i++){const a=base+(i/(n-1)-.5)*.55+rnd(-.04,.04);DM.pr.push({kind:'bul',x:mx,y:my,vx:Math.cos(a)*330,vy:Math.sin(a)*330,l:P.rng[lv]/330,dmg:P.dmg[lv],c:'#ffe08a'})}DM.fx.push({x:mx+8,y:my,vx:0,vy:0,g:0,l:.08,c:'#fff3b0'})}else DM.cd=.2}
  if(k==='mini'&&DM.cd<=0){const P=PWD.mini,list=DM.dr.filter(d=>Math.hypot(d.x-mx,d.y-my)<=P.rng[lv]).sort((a,b)=>Math.hypot(a.x-mx,a.y-my)-Math.hypot(b.x-mx,b.y-my));if(list.length){sfx('x_mini');DM.cd=P.cd[lv];const n=P.n[lv];for(let i=0;i<n;i++){const a=-Math.PI/2+(i/Math.max(1,n-1)-.5)*1.4;DM.pr.push({kind:'mis',x:mx,y:my+6,vx:Math.cos(a)*90,vy:Math.sin(a)*90,tgt:list[i%list.length],l:3,dmg:P.dmg[lv]})}}else DM.cd=.25}
  if(k==='field'){const r=PWD.field.r[lv];for(const d of DM.dr){if(Math.hypot(d.x-mx,d.y-my)<=r+d.w/2){d.hp-=PWD.field.dps[lv]*1.2*dt;d.hit=Math.max(d.hit,.05);if(Math.random()<dt*6){sfx('x_field');dmBolt(mx+rnd(-5,5),my+rnd(-5,5),d.x,d.y,'#9ad8ff',.06)}}}}
  if(k==='aura'){DM.wt-=dt;if(DM.wave===null&&DM.wt<=0){sfx('blast');DM.wave={r:4,hit:new Set()};DM.wt=3}
    if(DM.wave){DM.wave.r+=BLAST.sp*dt*1.6;for(const d of DM.dr){if(d.kb>0||DM.wave.hit.has(d))continue;const dx=d.x-mx,dy=d.y-my,dd=Math.hypot(dx,dy)||1;if(dd<=DM.wave.r+d.w/2&&dd>DM.wave.r-d.w/2-8){DM.wave.hit.add(d);const p=.8*(DM.R*.9)*(1.2-dd/DM.R*.6);d.kvx=dx/dd*p;d.kvy=dy/dd*p+30;d.kb=.7;dmHit(d,DM.ref*.5,'#8ff0ff')}}
      if(DM.wave.r>=DM.R)DM.wave=null}}
  /* projectiles and effects */
  for(const p of DM.pr){
    if(p.ring){p.t+=dt;continue}
    p.l-=dt;
    if(p.kind==='bul'){p.x+=p.vx*dt;p.y+=p.vy*dt;for(const d of DM.dr)if(Math.abs(d.x-p.x)<d.w/2+1&&Math.abs(d.y-p.y)<d.h/2+2){dmHit(d,p.dmg,p.c);p.l=0;break}}
    else if(p.kind==='mis'){const t=p.tgt&&!p.tgt.dead?p.tgt:dmNear(p.x,p.y,300);if(t){const a=Math.atan2(p.vy,p.vx),ta=Math.atan2(t.y-p.y,t.x-p.x);let da=ta-a;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;const na=a+clamp(da,-6*dt,6*dt);p.vx=Math.cos(na)*100;p.vy=Math.sin(na)*100;if(Math.hypot(t.x-p.x,t.y-p.y)<t.w/2+3){dmHit(t,p.dmg,'#ffb347');DM.pr.push({ring:1,x:p.x,y:p.y,t:0,l:.2,r:10});p.l=0}}
      p.x+=p.vx*dt;p.y+=p.vy*dt;if(Math.random()<dt*40)DM.fx.push({x:p.x,y:p.y,vx:rnd(-8,8),vy:rnd(-8,8),g:0,l:.25,c:'#ffd36b'});if(p.y<-2)p.l=0}
  }
  DM.pr=DM.pr.filter(p=>p.ring?p.t<p.l:p.l>0);
  for(const s of DM.sw){
    s.t+=dt;
    if(s.kind==='saw'){const u=s.t/s.l,ph=u<.5?u*2:(1-u)*2,dist=s.R*Math.sin(ph*Math.PI/2);s.x=Math.cos(s.a)*dist;s.y=my+Math.sin(s.a)*dist;
      for(const d of DM.dr)if((s.hits.get(d)||0)<=s.t&&Math.hypot(d.x-s.x,d.y-s.y)<d.w/2+6){s.hits.set(d,s.t+.35);dmHit(d,WEAP.saw.dmg[DM.lv],'#e6ecff')}}
    else if(s.kind==='nade'){
      if(!s.stuck){const u=Math.min(1,s.t/s.T),tg=s.tgt;s.cx=s.x+(tg.x-s.x)*u;s.cy=s.y+(tg.y-s.y)*u+Math.sin(u*Math.PI)*22;if(s.t>=s.T){s.stuck=1;s.ft=0}}
      else{s.ft+=dt;s.cx=s.tgt.x;s.cy=s.tgt.y;if(s.ft>=.8||s.tgt.dead){s.done=1;for(const d of DM.dr)if(Math.hypot(d.x-s.cx,d.y-s.cy)<=s.spl*1.6)dmHit(d,WEAP.nade.dmg[DM.lv],'#9dffb0');DM.pr.push({ring:1,x:s.cx,y:s.cy,t:0,l:.35,r:s.spl*1.6});for(let i=0;i<14;i++){const a=rnd(0,6.28),v=rnd(30,100);DM.fx.push({x:s.cx,y:s.cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:-100,l:rnd(.2,.5),c:['#9dffb0','#ffd36b','#ffffff'][i%3]})}}}
    }
  }
  DM.sw=DM.sw.filter(s=>!s.done&&s.t<(s.l||s.T+1));
  DM.bl=DM.bl.filter(b=>(b.l-=dt)>0);
  for(const f of DM.fx){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=f.g*dt;f.l-=dt}
  DM.fx=DM.fx.filter(f=>f.l>0);
}
function demoDraw(){
  const g=dmG,sc=DM.sc,cx=DMW/2,gy=DMGY;
  g.imageSmoothingEnabled=false;
  const X=x=>Math.round(cx+x*sc),Y=y=>Math.round(gy-y*sc);
  const RS=(x,y,w,h,c)=>{g.fillStyle=c;const x0=X(x),y1=Y(y),x1=X(x+w),y0=Y(y+h);g.fillRect(x0,y0,Math.max(1,x1-x0),Math.max(1,y1-y0))};
  /* backdrop: banded dusk sky, far skyline, street */
  const bands=['#2a2438','#33283a','#3d2c3c','#4a3140','#583a42','#6a4646'];
  for(let i=0;i<bands.length;i++){g.fillStyle=bands[i];g.fillRect(0,Math.round(i*gy/bands.length),DMW,Math.ceil(gy/bands.length)+1)}
  g.fillStyle='#231d2e';for(let i=0;i<16;i++){const bw=14+((i*37)%18),bh=22+((i*53)%46);g.fillRect(i*22-4,gy-bh,bw,bh)}
  g.fillStyle='#1c1726';for(let i=0;i<12;i++){const bw=12+((i*29)%16),bh=14+((i*41)%30);g.fillRect(i*30+6,gy-bh,bw,bh)}
  g.fillStyle='#403b3a';g.fillRect(0,gy,DMW,DMH-gy);g.fillStyle='#6a625c';g.fillRect(0,gy,DMW,2);g.fillStyle='#b58f2a';for(let x=6;x<DMW;x+=34)g.fillRect(x,gy+11,14,1);
  /* range ring, dashed */
  {const rr=DM.R*sc;g.fillStyle=DM.col;const n=Math.max(24,Math.round(rr*2.2));for(let i=0;i<n;i++){if((i>>1)%3===2)continue;const a=i/n*6.283,px=Math.round(cx+Math.cos(a)*rr),py=Math.round(gy-dmCy*sc+Math.sin(a)*rr);if(py<gy-1)g.fillRect(px,py,1,1)}}
  if(DM.k==='field'){const pr=PWD.field.r[DM.lv]*sc,a=.08+.05*Math.sin(DM.t*5);g.globalAlpha=a;g.fillStyle='#9ad8ff';g.beginPath();g.arc(cx,gy-dmCy*sc,pr,Math.PI,0);g.fill();g.globalAlpha=1}
  /* mechanic */
  {const c=DM.ch,k=DM.k,lvl=prof().chars[c.id].up.main||1,sh=DM.cd>0&&DM.cd<.1?1:0;
   drawCharSprite((ox,oy,w,h,col)=>{RS(ox,-oy-h,w,h,col)},c,{air:false,lvl:Math.max(1,lvl),weap:c.weap,lit:Math.floor(DM.t*2)%3===0,t:DM.t,sawOut:DM.sw.some(s=>s.kind==='saw')});
   if(k==='orbit'){const n=PWD.orbit.n[DM.lv],r=PWD.orbit.r[DM.lv];for(let i=0;i<n;i++){const a=DM.t*3.2+i*6.283/n,bx=Math.cos(a)*r,by=dmCy+Math.sin(a)*r*.8;RS(bx-3,by-2,7,5,'#8ff0ff');RS(bx-2,by-3,5,7,'#8ff0ff');RS(bx-2,by-2,5,5,'#e6ecff');RS(bx-1,by-1,2,2,'#ffffff')}}
   if(k==='main'&&c.weap==='buddy'){const n=DM.lv>=5?2:1;for(let i=0;i<n;i++){const bx=Math.cos(DM.t*1.6+i*3.14)*16,by=dmCy+10+Math.sin(DM.t*2+i)*4,f=Math.floor(DM.t*30)%2;RS(bx-3,by-1,7,3,'#5a3a8a');RS(bx-2,by+1,5,1,'#8a6ac8');RS(bx-5,by+2,4,1,f?'#c9d6e6':'#59606c');RS(bx+2,by+2,4,1,f?'#59606c':'#c9d6e6')}}
   if(k==='main'&&c.weap==='rail'&&DM.chg>0){g.globalAlpha=Math.min(1,DM.chg/WEAP.rail.cd[DM.lv]);RS(14,dmCy-1,4,4,'#e6fbff');g.globalAlpha=1}}
  /* drones */
  for(const d of DM.dr){
    const bob=Math.sin(d.ph*3)*1.2,x=d.x,y=d.y+bob,hv=d.heavy,f=Math.floor(d.ph*14)%2;
    const body=d.hit>0?'#e6f6ff':hv?'#3a2e26':'#2d3340',rot=f?'#8e99a8':'#59606c';
    if(hv){RS(x-10,y-3,20,7,body);RS(x-8,y-5,16,2,'#4a3a30');RS(x-6,y+4,12,2,'#59606c');RS(x-14,y-6,8,1,rot);RS(x+6,y-6,8,1,f?'#59606c':'#8e99a8');RS(x-11,y-1,2,4,'#59606c');RS(x+9,y-1,2,4,'#59606c');RS(x-1,y-1,3,3,'#ff4a3a')}
    else{RS(x-6,y-2,12,5,body);RS(x-4,y-4,8,2,'#3a4252');RS(x-9,y-5,6,1,rot);RS(x+3,y-5,6,1,f?'#59606c':'#8e99a8');RS(x-1,y,2,2,'#ff4a3a');RS(x-3,y+3,6,1,'#59606c')}
    if(d.hp<d.mx){const w=hv?16:10;RS(x-w/2,y+(hv?7:5),w,1,'#2a0e0e');RS(x-w/2,y+(hv?7:5),Math.max(0,w*d.hp/d.mx),1,'#7dff9a')}
  }
  /* weapon effects */
  for(const b of DM.bl){const n=Math.max(2,Math.round(Math.hypot(b.x2-b.x1,b.y2-b.y1)*sc/3));g.fillStyle=b.c;let px=b.x1,py=b.y1;for(let i=1;i<=n;i++){const u=i/n,jx=i<n?rnd(-3,3):0,jy=i<n?rnd(-3,3):0;const nx=b.x1+(b.x2-b.x1)*u+jx,ny=b.y1+(b.y2-b.y1)*u+jy;g.fillRect(X(nx),Y(ny),2,2);px=nx;py=ny}}
  for(const p of DM.pr){
    if(p.ring){const k=p.t/p.l,r=(p.r*(.3+.7*k))*sc;g.globalAlpha=1-k;g.fillStyle='#ffd36b';const n=Math.max(10,Math.round(r*4));for(let i=0;i<n;i++){const a=i/n*6.283;g.fillRect(Math.round(X(p.x)+Math.cos(a)*r),Math.round(Y(p.y)+Math.sin(a)*r),1,1)}g.globalAlpha=1;continue}
    if(p.kind==='bul')RS(p.x-1,p.y+1,2,2,p.c);
    else if(p.kind==='mis'){RS(p.x-1,p.y+1,3,3,'#e6ecff');RS(p.x-p.vx*.04-1,p.y-p.vy*.04+1,2,2,'#ff9a3a')}
  }
  for(const s of DM.sw){
    if(s.kind==='rail'){const u=s.t/s.l;g.globalAlpha=1-u;const n=Math.round(s.L*sc/2);for(let i=0;i<n;i++){const d=i*2/sc;RS(s.x+Math.cos(s.a)*d-1,s.y+Math.sin(s.a)*d+1,3,3,'#5ad1e6');RS(s.x+Math.cos(s.a)*d,s.y+Math.sin(s.a)*d+1,1,1,'#e6fbff')}g.globalAlpha=1}
    else if(s.kind==='saw'){const f=Math.floor(DM.t*24)%2;RS(s.x-3,s.y+3,6,6,'#b9c2cc');RS(s.x-4,s.y+2,8,4,'#b9c2cc');RS(s.x-1,s.y,2,2,'#59606c');if(f)RS(s.x-4,s.y+4,1,1,'#fff');else RS(s.x+3,s.y-3+6,1,1,'#fff')}
    else if(s.kind==='nade'){const x=s.stuck?s.tgt.x:s.cx,y=s.stuck?s.tgt.y:s.cy;if(x!==undefined){RS(x-2,y+2,4,4,'#4a5a3a');RS(x-1,y+1,2,2,s.stuck&&Math.floor(s.ft*14)%2?'#ff5a4a':'#9dffb0')}}
    else if(s.kind==='slash'&&s.t>=0){
      const k=s.t/s.l,head=Math.min(1,k*1.6),n=Math.max(8,Math.round(s.r*.9)),span=2.9;
      for(let j=0;j<=n;j++){const u=j/n;if(u>head)break;const an=s.a+s.sd*(-span/2+span*u),age=head-u,fade=(1-k*.7)*(age>.55?.25:age>.3?.55:1),th=Math.max(1,Math.round(2+5*Math.sin(Math.PI*u)*(1-age)));g.globalAlpha=fade;for(let b=0;b<th;b++){const rr=s.r+2-b;RS(Math.cos(an)*rr-1,dmCy+Math.sin(an)*rr+1,2,2,b<=1?'#ffffff':b<3?'#bff4ff':'#5ad1e6')}}
      g.globalAlpha=1;const an=s.a+s.sd*(-span/2+span*head),c1=Math.cos(an),s1=Math.sin(an);
      for(let i=-12;i<=4;i+=2)RS(c1*(s.r+i)-1,dmCy+s1*(s.r+i)+1,2,2,i>-5?'#8ff0ff':'#ffffff');RS(c1*(s.r+4)-1,dmCy+s1*(s.r+4)+1,3,3,'#ffffff');
    }
  }
  if(DM.wave){const k=DM.wave.r/DM.R,rr=DM.wave.r*sc;g.globalAlpha=1-k*.7;g.fillStyle='#8ff0ff';const n=Math.max(16,Math.round(rr*3));for(let i=0;i<n;i++){const a=i/n*6.283,py=Math.round(gy-dmCy*sc+Math.sin(a)*rr);if(py<gy)g.fillRect(Math.round(cx+Math.cos(a)*rr),py,2,2)}g.globalAlpha=1}
  for(const f of DM.fx){g.globalAlpha=clamp(f.l*3,0,1);RS(f.x,f.y,Math.max(1,1/sc),Math.max(1,1/sc),f.c)}g.globalAlpha=1;
}
function demoSync(){
  const sp=demoSpec(),wrap=$('hgDemo');
  wrap.hidden=!sp;
  if(!sp){DM.sig='';return null}
  const sig=sp.k+'|'+sp.ch.id+'|'+sp.lv+'|'+sp.R;
  if(sig!==DM.sig){DM.sig=sig;demoReset(sp)}
  return sp;
}
function demoTick(dt){
  if($('hgDesc').hidden){return}
  if(!demoSync())return;
  const n=Math.max(1,Math.round(dt/.016));for(let i=0;i<n;i++)demoStep(dt/n);
  demoDraw();
}

/* ---------- full numbers of the selected slot, current level vs next level ---------- */
const f1=v=>(Math.round(v*10)/10).toString().replace('.',',');
function statRows(k,lv){
  const c=viewChar(),L=Math.max(0,Math.min(UMAX,lv));
  if(k==='main'){const W=WEAP[c.weap],r=[['Damage',W.dmg[L]],['Jangkauan',W.r[L]],['Jeda tembak',W.cd[L],'s']];
    if(W.chain)r.push(['Lompatan',W.chain[L]]);if(W.spl)r.push(['Area ledak',W.spl[L]]);
    r.push(['DPS',W.dmg[L]/W.cd[L]*(c.weap==='buddy'?(L>=5?2:1):c.weap==='saw'?(L>=5?3:L>=3?2:1):1)]);return r}
  if(k==='katana'){const P=PWD.katana;return[['Damage',P.dmg[L]],['Jangkauan',P.r[L]],['Jeda tebas',P.cd[L],'s'],['DPS',P.dmg[L]/P.cd[L]]]}
  if(k==='orbit'){const P=PWD.orbit;return[['Jumlah bilah',P.n[L]],['Damage',P.dmg[L]],['Radius putar',P.r[L]]]}
  if(k==='shot'){const P=PWD.shot;return[['Peluru',P.n[L]],['Damage/peluru',P.dmg[L]],['Jangkauan',P.rng[L]],['Jeda tembak',P.cd[L],'s'],['DPS',P.n[L]*P.dmg[L]/P.cd[L]]]}
  if(k==='mini'){const P=PWD.mini;return[['Roket',P.n[L]],['Damage',P.dmg[L]],['Jangkauan',P.rng[L]],['Jeda tembak',P.cd[L],'s'],['DPS',P.n[L]*P.dmg[L]/P.cd[L]]]}
  if(k==='field'){const P=PWD.field;return[['Damage/detik',P.dps[L]],['Radius',P.r[L]]]}
  if(k==='aura'){return[['Radius',Math.round(192*(1+.15*L))],['Dorongan',Math.round(540*(1+.15*L))],['Damage',5*(1+.15*L)],['Biaya batre',Math.round(Math.max(.3,.75-.09*L)*100),'%']]}
  if(k==='bots')return[['Robot menyerang',L],['Damage las/detik (tiap robot)',BOTW.dps[1]]];
  if(k==='hp')return[['HP maks',10+2*L]];
  if(k==='bat')return[['Waktu terbang',20+4*L,'s'],['Isi ulang',1.4*(20+4*L)/20,'x']];
  if(k==='jet')return[['Redam jatuh',Math.round(JETF.red[L]*100),'%']];
  return[];
}
function renderStats(k,lv){
  const box=$('hgStats');if(!box)return;
  const a=statRows(k,lv),mx=lv>=upCap(k,viewChar().id),b=mx?null:statRows(k,lv+1);
  let h='<div class="sr sh"><span></span><b>Lv '+lv+'</b><b>'+(mx?'MAKS':'Lv '+(lv+1))+'</b></div>';
  a.forEach((r,i)=>{
    const u=r[2]||'',cur=lv<1&&k!=='main'?'-':f1(r[1])+u,nx=b?f1(b[i][1])+u:'';
    h+='<div class="sr"><span>'+r[0]+'</span><b>'+cur+'</b><b class="nx">'+nx+'</b></div>'});
  box.innerHTML=h;
}
