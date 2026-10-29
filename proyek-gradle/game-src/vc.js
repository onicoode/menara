
/* ---------- drawing (camera only moves vertically) ---------- */
const camX=0;
const stars=Array.from({length:130},()=>({x:rnd(0,VW),y:rnd(0,900),p:rnd(0,6),sp:rnd(1.2,4.2),big:Math.random()<.14,col:['#ffffff','#cfe3ff','#fff1c9'][(Math.random()*3)|0]}));
const clouds=Array.from({length:9},(_,i)=>({x:rnd(-40,VW),y:rnd(30,330),s:rnd(.8,1.7),sp:rnd(2,6),k:i>=5,seed:i}));
let cloudT=0;
const CLOUD=[[0,7,26,5],[5,3,13,6],[12,0,11,7],[19,4,13,7],[26,7,10,4]];
function mkCity(span,minH,maxH,minW,maxW){
  const a=[];let x=-8;
  while(x<span){const w=Math.round(rnd(minW,maxW)),h=Math.round(rnd(minH,maxH));a.push({x,w,h,st:Math.random()<.5?rnd(.3,.6):0,seed:Math.floor(rnd(0,99))});x+=w+Math.round(rnd(-3,5))}
  return a;
}
const farCity=mkCity(400,80,220,20,40),midCity=mkCity(400,50,140,20,38);
const WRECKS=[30,330];

const SX=x=>Math.round(x-camX),SY=y=>Math.round(y-camY);
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y-camY),w,h)}
function bar(x,y,w,f,c){R(x-w/2-1,y-1,w+2,4,'#0d0f1a');R(x-w/2,y,Math.max(1,Math.round(w*f)),2,c)}
/* pixel circle (no anti-aliasing), world coords; on/off = dash lengths in pixels, ph = dash phase */
function pxCircle(cx,cy,r,c,on,off,ph){
  if(r<1)return;
  ctx.fillStyle=c;const rk=r*K,n=Math.max(8,Math.ceil(6.283*rk)),per=on&&off?Math.round((on+off)*K):0,onk=on*K,p0=Math.floor((ph||0)*K);
  let lx=1e9,ly=1e9;const oy=(cy-camY)*K,ox=cx*K;
  for(let i=0;i<n;i++){
    if(per&&((i+p0)%per+per)%per>=onk)continue;
    const a=i/n*6.283,x=Math.round(ox+Math.cos(a)*rk),y=Math.round(oy+Math.sin(a)*rk);
    if(x===lx&&y===ly)continue;lx=x;ly=y;fr(x,y,1,1);
  }
}
const qa=a=>Math.round(clamp(a,0,1)*4)/4;   /* stepped transparency */
const shade=(col,lv)=>col==='#fff'?'rgba(255,255,255,'+(lv/16)+')':'rgba(0,0,0,'+(lv/16)+')';
function H(x,y,w,h,col,lv){ctx.fillStyle=shade(col,lv);ctx.fillRect(x,y-camY,w,h)}   /* flat shadow / highlight, world coords */
/* sun: position and how strong cast shadows are (set every frame in render) */
const SUN={x:180,e:1,a:1};
/* cast shadow on a surface (default: the street), pointing away from the sun, longer when the sun is low */
function gShadow(x,w,h,y0){
  if(SUN.a<.03)return;
  const fx=clamp((x-SUN.x)/140,-1,1),dir=fx>=0?1:-1,L=w*.3+h*(.25+(1-SUN.e)*2.4)*Math.abs(fx);
  const x0=dir>0?x-w/2:x+w/2,x1=x0+dir*(w+L),Y=Math.round(((y0||GW)-camY)*K);
  const g=ctx.createLinearGradient(x0*K,0,x1*K,0);g.addColorStop(0,'rgba(0,0,0,'+(.42*SUN.a)+')');g.addColorStop(.6,'rgba(0,0,0,'+(.22*SUN.a)+')');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;const X0=Math.round(Math.min(x0,x1)*K),X1=Math.round(Math.max(x0,x1)*K);fr(X0,Y,X1-X0,Math.round(4*K));
}
/* smooth, realistic light: additive radial glow (not pixelated) */
function light(x,y,r,rgb,a){
  if(a<=.01)return;
  const X=x*K,Y=(y-camY)*K,RR=r*K,g=ctx.createRadialGradient(X,Y,0,X,Y,RR);
  g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(.35,'rgba('+rgb+','+(a*.4)+')');g.addColorStop(1,'rgba('+rgb+',0)');
  ctx.fillStyle=g;fr(X-RR,Y-RR,RR*2,RR*2);
}
const hexRgb=h=>parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16);
/* sky: banded gradient with dithered seams, cached until the colours change */
const skyC=document.createElement('canvas');let skyKey='';
function line(x1,y1,x2,y2,c,j){
  ctx.fillStyle=c;
  const dx=x2-x1,dy=y2-y1,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2)),vert=Math.abs(dy)>Math.abs(dx);
  for(let i=0;i<=n;i++){
    const t=i/n,o=j&&i>0&&i<n?(Math.random()-.5)*j:0;
    ctx.fillRect(Math.round(x1+dx*t+(vert?o:0)),Math.round(y1+dy*t-camY+(vert?0:o)),2,2);
  }
}
const layC={};
function layer(arr,f,col,win,div,id){
  const base=Math.round(GSC+f*(CAMYMAX-camY));
  ctx.fillStyle=col;ctx.fillRect(0,base+4,VW,VH-base);
  let L=layC[id];const key=col+win;
  if(!L||L.key!==key){
    let mh=0;for(const b of arr)mh=Math.max(mh,b.h+(b.st?Math.round(b.h*b.st*.5)+6:0));mh+=4;
    const sc=K/div,c=L?L.c:document.createElement('canvas');c.width=Math.ceil(VW*sc);c.height=Math.ceil((mh+8)*sc);
    const g=c.getContext('2d');g.setTransform(sc,0,0,sc,0,0);
    for(const b of arr){
      const x=b.x,top=mh-b.h;
      g.fillStyle=col;g.fillRect(x,top,b.w,b.h+8);
      if(b.st){const sh=Math.round(b.h*b.st*.5);g.fillRect(x+2,top-sh,Math.round(b.w*.5),sh+1);g.fillRect(x+3,top-sh-5,1,5)}
      g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+Math.round(b.w*.62),top,Math.ceil(b.w*.38),b.h+8);
      g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x,top,Math.ceil(b.w*.2),b.h+8);
      g.fillStyle=win;
      for(let wy=top+4;wy<mh-2;wy+=7)for(let wx=x+3;wx<x+b.w-3;wx+=5)if(((wx+wy+b.seed)*13)%7<3)g.fillRect(wx,wy,2,3);
    }
    L=layC[id]={c,key,mh};
  }
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;
  di(L.c,0,Math.round((base-L.mh)*K),Math.round(VW*K),Math.round(L.c.height*div));
  ctx.imageSmoothingEnabled=sm;
}
function drawFireBarrel(){
  /* energy core housing: it gets more advanced with every upgrade (Lv 1 bare plinth, Lv 2 cells, Lv 3 dish and antenna, Lv 4 gold armour with an energy halo) */
  const lv=S.coreLv,an=S.anim;
  R(CX-15,GW-5,30,5,'#4a4f58');R(CX-15,GW-5,30,1,'#7d838e');
  R(CX-11,GW-9,22,4,'#5c616b');R(CX-11,GW-9,22,1,'#9aa1ad');
  R(CX-11,GW-25,3,16,'#3d4048');R(CX+8,GW-25,3,16,'#3d4048');H(CX-15,GW-5,30,5,'#000',6);H(CX+3,GW-9,8,4,'#000',5);R(CX-12,GW-27,24,3,'#6a707c');R(CX-12,GW-27,24,1,'#9aa1ad');
  if(lv>=2){   /* side power cells */
    R(CX-20,GW-13,5,9,'#3d4048');R(CX+15,GW-13,5,9,'#3d4048');R(CX-19,GW-12,3,7,'#c9a22a');R(CX+16,GW-12,3,7,'#c9a22a');
    R(CX-19,GW-12+Math.floor(an*4)%6,3,1,'#fff2b0');R(CX+16,GW-12+Math.floor(an*4+3)%6,3,1,'#fff2b0');
    R(CX-17,GW-5,34,2,'#5c616b');R(CX-12,GW-26,24,1,'#8ff0ff');R(CX-20,GW-17,5,1,'#8ff0ff');R(CX+15,GW-17,5,1,'#8ff0ff');
  }
  if(lv>=3){   /* antenna mast with a beacon and a turning dish */
    R(CX-1,GW-36,2,9,'#9aa1ad');R(CX-2,GW-37,4,1,Math.floor(an*3)%2?'#ff5a4a':'#7a2a2a');
    const da=Math.floor(an*2)%4;R(CX+4-da%2,GW-33,5,1,'#cfd6e2');R(CX+5,GW-34,3,1,'#8e99a8');R(CX+6,GW-32,1,5,'#6a707c');
    R(CX-9,GW-23,1,12,'#8ff0ff');R(CX+8,GW-23,1,12,'#8ff0ff');   /* glowing conduits */
  }
  if(lv>=4){   /* gold armour, twin antennas and an energy halo */
    R(CX-13,GW-28,26,1,'#e6c24a');R(CX-14,GW-7,3,3,'#e6c24a');R(CX+11,GW-7,3,3,'#e6c24a');
    R(CX-8,GW-33,1,6,'#e6c24a');R(CX+7,GW-33,1,6,'#e6c24a');R(CX-9,GW-34,3,1,'#fff2b0');R(CX+6,GW-34,3,1,'#fff2b0');
    R(CX-11,GW-27,22,1,'#fff2b0');
    ctx.globalAlpha=.6;pxCircle(CX,GW-17,13+Math.round(Math.sin(an*3)),'#8ff0ff',3,3,an*10);ctx.globalAlpha=1;
    for(let i=0;i<3;i++){const a=an*2+i*2.094;R(CX+Math.cos(a)*13-1,GW-17+Math.sin(a)*6-1,3,3,'#e6fbff')}
  }
}
function drawFlame(){
  const s=S,f=s.hp/s.maxHp,low=f<.3,pu=Math.floor(s.anim*6)%3;
  const col=s.coreHit>0?'#ffffff':low?(Math.floor(s.anim*5)%2?'#ff5a4a':'#8a3a3a'):'#5ad1e6',hi=low?'#ffb0a0':'#e6fbff';
  const r=3+Math.round(4*f)+(pu===0?1:0);
  ctx.globalAlpha=.35;R(CX-8,GW-24,16,15,'#8ff0ff');ctx.globalAlpha=1;
  R(CX-r,GW-17-r,2*r,2*r,col);R(CX-Math.round(r*.55),GW-17-Math.round(r*.55),Math.round(r*1.1),Math.round(r*1.1),hi);
}
function drawBot(b){
  const x=b.x,y=b.y,s=S,w=b.mv&&Math.floor(s.anim*10+b.ph)%2,fly=y<GW-1;
  R(x-3,y-6-(w?1:0),7,4,'#d8a02a');R(x-2,y-9-(w?1:0),5,3,'#e8c04a');R(x,y-11-(w?1:0),1,2,'#9aa1ad');
  R(x-3,y-2,2,2,'#2a2a30');R(x+2,y-2,2,2,'#2a2a30');R(x-3,y-5-(w?1:0),7,1,'#9a6a1a');H(SUN.x<=x?x+1:x-3,y-6-(w?1:0),3,4,'#000',5);H(SUN.x<=x?x-2:x+1,y-9-(w?1:0),2,2,'#fff',4);
  if(fly){R(x-4,y-13,9,1,Math.floor(s.anim*30)%2?'#9aa1ad':'#59606c');R(x-1,y-12,3,1,'#59606c');R(x-1,y,3,2,Math.floor(s.anim*20)%2?'#ffb347':'#ff7a3d')}
  if(b.fighter)R(x-3,y-8-(w?1:0),7,1,'#ff5a4a');
  if(b.carry)R(x-2,y-14,4,3,'#a9bccf');
  if(b.st==='dig'&&Math.floor(s.anim*8)%2)R(x+b.dir*5,y-4,2,2,'#fff6c8');
  if((b.st==='weld'&&!b.mv||b.onsite)&&Math.floor(s.anim*12)%2)R(x+b.dir*5,y-5,2,2,'#8ff0ff');
  if(b.attach&&Math.floor(s.anim*14)%2){R(x-2,y-15,5,2,'#fff6c8');R(x-1,y-17,3,2,'#8ff0ff')}
}
/* Drone bodies. Scouts: quad, wasp, orb, dart. Heavies: lifter, crab, gunship. Bosses: fortress, saucer. */
const DBODY={s:['#2d3340','#3a3326','#26333a','#33263a'],h:['#2d3340','#3a2e26','#283a2e'],b:['#2d3340','#2a2840'],m:['#3b2c34','#2c3b34']};
function droneFace(d){return (d.chase?S.m.x:CX+d.ox)>=d.x?1:-1}
function drawDrone(d){
  const sk=d.shock>0,x=d.x+(sk?Math.round(rnd(-2,2)):0),y=d.y+Math.round(Math.sin(d.ph*3))+(sk?Math.round(rnd(-2,2)):0),f=Math.floor(d.ph*14)%2,v=d.v|0;
  const cls=d.boss?'b':d.heavy?'h':d.swarm?'m':'s',c=d.hit>0||(sk&&Math.floor(S.anim*16)%3===0)?'#e6f6ff':d.slow?'#4a3f72':DBODY[cls][v];
  const rA=f?'#8e99a8':'#59606c',rB=f?'#59606c':'#8e99a8',M='#59606c',T='#3a4252',fd=droneFace(d);
  const P=(ox,oy,w,h,col)=>R(fd>0?x+ox:x-ox-w+1,y+oy,w,h,col);   /* mirrored toward where it is heading */
  if(cls==='m'){   /* mite: a tiny buzzing bead, two body variants */
    if(v===0){R(x-2,y-1,5,3,c);R(x-1,y-2,3,1,T);R(x-3,y-3,2,1,rA);R(x+1,y-3,2,1,rB)}
    else{R(x-2,y-1,4,2,c);R(x-1,y-2,2,1,T);R(x-2,y+1,1,1,M);R(x+1,y+1,1,1,M);R(x-2,y-3,5,1,rA)}
  }else if(cls==='b'){
    if(v===0){
      R(x-12,y-4,25,9,c);R(x-10,y-6,21,2,T);R(x-8,y+5,17,2,M);R(x-3,y+7,7,2,'#2a2e38');
      for(const rx of[-16,-8,8,15]){R(x+rx-4,y-9,8,1,f?'#8e99a8':M);R(x+rx,y-8,1,4,M)}
      R(x-13,y-2,2,5,M);R(x+12,y-2,2,5,M);H(x-12,y+1,25,4,'#000',7);
    }else{   /* saucer carrier */
      R(x-14,y-1,29,4,c);R(x-11,y-3,23,2,T);R(x-16,y,2,2,M);R(x+15,y,2,2,M);
      R(x-5,y-6,11,3,M);R(x-4,y-7,9,1,'#8e99a8');R(x-3,y-8,7,1,'#b9c2cc');
      R(x-10,y+3,21,2,'#2a2e38');R(x-6,y+5,13,1,'#1d2028');H(x-14,y+1,29,2,'#000',6);
      for(const bx of[-9,-1,7]){R(x+bx,y+6,2,2+((d.ph*6+bx)|0)%2,M)}
    }
  }else if(cls==='h'){
    if(v===0){
      R(x-6,y-2,13,5,c);R(x-5,y-3,11,1,T);
      R(x-10,y-5,8,1,rA);R(x+3,y-5,8,1,rB);
      R(x-8,y-4,1,3,M);R(x+8,y-4,1,3,M);R(x-3,y+3,7,1,M);H(x-6,y+1,13,2,'#000',7);
    }else if(v===1){   /* crab lifter with claws */
      R(x-6,y-2,13,4,c);R(x-5,y-3,11,1,T);R(x-2,y-4,5,1,T);
      R(x-12,y-5,6,1,rA);R(x+7,y-5,6,1,rB);R(x-9,y-4,4,1,M);R(x+6,y-4,4,1,M);R(x-9,y-4,1,2,M);R(x+9,y-4,1,2,M);
      R(x-6,y+2,1,3,M);R(x-7,y+4,2,1,'#8e99a8');R(x+6,y+2,1,3,M);R(x+6,y+4,2,1,'#8e99a8');
      R(x-2,y+2,5,2,'#6b5a3a');R(x-2,y+2,5,1,'#8a7a50');H(x-6,y,13,2,'#000',6);
    }else{   /* gunship: fuselage, tail rotor, chin gun */
      P(-7,-1,13,4,c);P(-6,-2,10,1,T);P(4,-2,3,2,'#59707c');P(5,-1,2,1,'#8fb4c4');
      P(-11,0,4,1,M);P(-12,-2,1,4,f?'#8e99a8':M);
      R(x-9,y-4,19,1,rA);R(x,y-3,1,2,M);
      P(-1,3,3,2,'#2a2e38');P(2,4,3,1,M);H(x-7,y+1,13,2,'#000',6);
    }
  }else{
    if(v===0){
      R(x-4,y-1,8,3,c);R(x-3,y-2,6,1,T);
      R(x-7,y-3,5,1,rA);R(x+2,y-3,5,1,rB);
      R(x-5,y-2,1,2,M);R(x+4,y-2,1,2,M);R(x-1,y+2,2,1,M);H(x-4,y+1,8,1,'#000',8);
    }else if(v===1){   /* wasp: striped body, stinger, single rotor */
      P(-4,-1,7,3,c);P(3,-1,2,2,T);P(-2,-1,1,3,'#c9a22a');P(0,-1,1,3,'#c9a22a');P(-6,0,2,1,M);
      R(x-4,y-4,9,1,rA);R(x,y-3,1,2,M);P(-2,2,1,1,M);P(1,2,1,1,M);H(x-4,y+1,7,1,'#000',6);
    }else if(v===2){   /* orb: round body, big eye socket, side rotors */
      R(x-3,y-3,6,6,c);R(x-4,y-2,8,4,c);R(x-2,y-3,2,1,M);R(x-2,y-1,4,3,'#14161e');
      R(x-7,y-1,3,1,rA);R(x+4,y-1,3,1,rB);R(x,y-5,1,2,M);R(x,y-6,1,1,'#ff6a4a');H(x-3,y+2,6,1,'#000',7);
    }else{   /* dart: delta wing, fins and a jet instead of rotors */
      P(-4,-1,9,2,c);P(-2,-2,5,1,c);P(5,-1,2,1,T);P(-5,-3,2,2,M);P(-5,1,2,2,M);
      P(-6,-1,1,2,f?'#ffb347':'#ff7a3d');P(-7,0,1,1,f?'#ffd36b':'#ff9a3a');H(x-4,y,9,1,'#000',6);
    }
  }
  if(!d.swarm&&(d.hp<d.max||d.boss))bar(x,y-(d.boss?(v===1?13:14):9),d.boss?26:10,d.hp/d.max,d.boss?'#ff3a3a':'#ff7a3d');
}
/* glowing eyes / lights, drawn in the bright pass after the night overlay */
function droneEyes(dr,y,fl){
  const x=dr.x,v=dr.v|0,fd=droneFace(dr),P=(ox,oy,w,h,col)=>R(fd>0?x+ox:x-ox-w+1,y+oy,w,h,col);
  if(dr.boss){
    if(v===0){R(x-8,y-1,3,2,fl?'#ff3030':'#ff8a30');R(x+6,y-1,3,2,fl?'#ff8a30':'#ff3030');R(x-2,y+1,5,1,'#ff4040')}
    else{for(let i=-12;i<=12;i+=4)R(x+i,y+1,2,1,(((i+12)/4+S.anim*8)|0)%3===0?'#ffd36b':'#ff3a3a');R(x-1,y-6,3,2,fl?'#ff3030':'#ff8a30')}
  }else if(dr.heavy){
    if(v===0)R(x-2,y,5,1,fl?'#ff7a2a':'#ffb347');
    else if(v===1){R(x-4,y-1,2,1,fl?'#ff7a2a':'#ffb347');R(x+3,y-1,2,1,fl?'#ff7a2a':'#ffb347')}
    else{P(4,-1,2,1,'#ff5a3a');P(-6,1,1,1,fl?'#ff3030':'#661010')}
  }else if(dr.swarm){R(x,y,1,1,'#ff4a3a');if(v===0)R(x+1,y,1,1,'#ff9a8a')
  }else{
    if(v===0)R(x-1,y,2,1,'#ff4040');
    else if(v===1)P(4,-1,1,1,'#ff4040');
    else if(v===2){R(x-1,y,2,2,'#ff4040');R(x-1,y,1,1,'#ffc0b8')}
    else P(3,-1,2,1,'#ff4040');
  }
}
function drawMech(m){
  if(m.hurt>0&&Math.floor(S.anim*20)%2)return;
  const d=m.dir,x=m.x,y=m.y,air=!m.st,step=!air&&Math.abs(m.vx)>6&&Math.floor(S.anim*9)%2;
  const bob=!air&&Math.abs(m.vx)<6&&Math.floor(S.anim*1.6)%2?1:0;   /* idle breathing */
  const P=(ox,oy,w,h,c)=>R(d>0?x+ox:x-ox-w,y+oy+(oy<=-6?bob:0),w,h,c);
  if(!air)R(x-6,y,12,2,'rgba(0,0,0,.28)');
  drawCharSprite(P,CHAR(S.ch),{air,thr:m.thr,step,lvl:S.mlv,lit:m.zt>0||m.help,weap:S.weap,sawOut:S.saws.length>0,t:S.anim});
  if(m.thr||m.bat<MECH.bat-.05)bar(x,y-27,16,m.bat/MECH.bat,m.bat<2.5?'#ff5a4a':'#ffd36b');
  if(m.hp<MECH.hp)bar(x,y-32,16,m.hp/MECH.hp,'#7dff9a');
}

function drawCar(x){
  R(x-16,GW-9,32,6,'#5c4a42');R(x-8,GW-14,16,5,'#4e3e38');R(x-6,GW-13,5,3,'#2a2a34');R(x+1,GW-13,5,3,'#2a2a34');
  R(x-12,GW-4,6,4,'#1f1f24');R(x+6,GW-4,6,4,'#1f1f24');R(x-16,GW-9,32,1,'#74594e');R(x+10,GW-8,6,2,'#3a2e29');
}
function drawPile(x){
  R(x-8,GW-5,16,5,'#4a423c');R(x-5,GW-8,9,4,'#5a4f46');R(x+2,GW-10,4,3,'#7a5a3a');
  R(x-3,GW-7,2,2,'#a9bccf');R(x-7,GW-6,3,1,'#7a5a3a');R(x+5,GW-4,3,2,'#a9bccf');
}
function outline(x,y,w,h,c){R(x,y,w,1,c);R(x,y+h-1,w,1,c);R(x,y,1,h,c);R(x+w-1,y,1,h,c)}

function deck(px,y,pw){
  R(px-pw/2,y,pw,3,'#a9aeb7');R(px-pw/2,y,pw,1,'#d0d4da');R(px-pw/2,y+3,pw,5,'#5c616b');H(px-pw/2,y+5,pw,3,'#000',7);
  for(let xx=px-pw/2+3;xx<px+pw/2-3;xx+=8)R(xx,y+3,2,5,'#3d4048');
  R(px-pw/2-1,y-1,3,9,'#c9a22a');R(px+pw/2-2,y-1,3,9,'#c9a22a');
  if(Math.floor(S.anim*2)%2){R(px-pw/2,y-3,2,2,'#ff5a4a');R(px+pw/2-2,y-3,2,2,'#ff5a4a')}
}
/* one crane: a telescoping mast at x=mx, a jib reaching over its platform, a trolley and long cables. side=+1 puts the mast to the right of the platform, -1 to the left */
function rig(mx,side,y,px,pw,box){
  const top=y-CRROPE,mh=GW-top,sd=side;
  const RM=(x,yy,w,h,c)=>R(sd>0?x:2*mx-x-w,yy,w,h,c);       /* rectangle mirrored around the mast */
  const LM=(x1,y1,x2,y2,c)=>line(sd>0?x1:2*mx-x1,y1,sd>0?x2:2*mx-x2,y2,c,0);
  const s1=Math.round(mh*.4),s2=Math.round(mh*.7);
  R(mx-4,GW-s1,8,s1,'#5a5f69');R(mx-4,GW-s1,1,s1,'#7d838e');R(mx+3,GW-s1,1,s1,'#3d4048');H(mx,GW-s1,3,s1,'#000',6);
  R(mx-3,GW-s2,6,s2-s1,'#6a707c');R(mx-3,GW-s2,1,s2-s1,'#8a909b');R(mx+2,GW-s2,1,s2-s1,'#454951');
  R(mx-2,top,4,mh-s2,'#7d838e');R(mx-2,top,1,mh-s2,'#a3a9b3');R(mx+1,top,1,mh-s2,'#555a64');
  for(let yy=GW-s1+3;yy<GW-6;yy+=8)line(mx-4,yy,mx+4,yy+8,'#3d4048',0);
  R(mx-5,GW-s1-1,10,2,'#c9a22a');R(mx-4,GW-s2-1,8,2,'#c9a22a');
  R(mx-9,GW-6,18,6,'#4a4f58');R(mx-9,GW-6,18,1,'#6d737e');
  if(box){   /* control box at the foot of the mast */
    RM(mx-17,GW-14,9,14,'#c9a22a');RM(mx-17,GW-14,9,2,'#e6c24a');RM(mx-15,GW-10,5,3,'#1d2230');
    RM(mx-14,GW-6,2,2,Math.floor(S.anim*2)%2?'#7dff9a':'#2f6a3c');
  }
  /* jib with counterweight; the trolley slides along it */
  const reach=Math.round(Math.abs(px-mx)+pw/2+8);
  const x0=sd>0?mx+8-reach:mx-8,w0=reach;
  R(x0,top,w0,3,'#c9a22a');R(x0,top+3,w0,1,'#7a6215');
  for(let k=0;k<w0-8;k+=10){const xx=x0+k+2;line(xx,top+4,xx+10,top,'#8a6f1a',0)}
  RM(mx+3,top-5,9,8,'#6a707c');RM(mx-5,top-8,2,8,'#c9a22a');RM(mx-5,top-8,9,1,'#c9a22a');
  R(px-4,top+3,8,3,'#3d4048');
  line(px,top+6,px-pw/2+6,y-1,'#2d3038',0);line(px,top+6,px+pw/2-6,y-1,'#2d3038',0);
  line(px-1,top+6,px-pw/2+5,y-1,'#2d3038',0);line(px+1,top+6,px+pw/2-5,y-1,'#2d3038',0);
}
function drawCrane(){
  const cr=S.crane,y=Math.round(cr.y),pw=CR.w[cr.lv-1];
  rig(CRMX,1,y,cr.px,pw,true);deck(cr.px,y,pw);
  /* the left crane is taller and holds a second platform above the first one */
  const c2=S.crane2,P2=PLAT(2),y2=Math.round(c2.y);
  rig(CLMX,-1,y2,P2.px,P2.w,true);deck(P2.px,y2,P2.w)
}
/* what is left of a destroyed tower: the foundation slab, bent rebar, broken wall chunks and a few embers */
function drawRuin(t){
  const x=t.x,B=t.y,rl=t.ruin.lv,h=Math.round(TWH[rl]*.5)+4,w=TWW[rl],sd=t.i*7;
  R(x-w/2-3,B-4,w+6,4,'#6a5c40');R(x-w/2-3,B-4,w+6,1,'#7d6d4c');R(x-w/2-3,B-1,w+6,1,'#3f3626');
  for(const[ox,hh]of[[-w/2+1,h],[-1,Math.round(h*.55)],[w/2-3,Math.round(h*.8)]]){R(x+ox,B-4-hh,2,hh,'#59606c');R(x+ox,B-4-hh,2,1,'#8a5a3a');R(x+ox+1,B-4-hh,1,hh,'rgba(255,255,255,.12)')}
  line(x-w/2+2,B-5,x+3,B-3-h,'#3d4048',0);line(x+w/2-2,B-5,x+2,B-3-Math.round(h*.7),'#4a4f58',0);
  R(x-w/2,B-9,5,5,'#5d5953');R(x-w/2+1,B-9,3,1,'#7a766f');R(x+w/2-4,B-8,5,4,'#4a4742');R(x+w/2-3,B-8,2,1,'#6a665f');
  R(x-3,B-7,3,3,'#77736d');R(x+1+(sd%3),B-6,2,2,'#4d525c');
  H(x-w/2-3,B-4,w+6,3,'#000',6);
  if(Math.floor(S.anim*3+t.i)%4===0)R(x+(sd%9)-4,B-6,1,1,'#ff7a2a');
  if(S.fx.length<300&&Math.random()<.025)S.fx.push({x:x+(sd%7)-3,y:B-8,vx:rnd(-4,4),vy:-rnd(10,22),g:-6,l:1.1,c:'#4a4f58',s:2});
}
function drawTowers(){
  for(const t of S.towers){
    if(t.lv<1){if(t.ruin&&slotActive(t))drawRuin(t);continue}
    if(t.au&&!towerBusy(t)&&nearTower(t)){   /* slow aura: only shown while the mechanic stands near this tower */
      const acy=t.y-TWH[t.lv]/2-3-camY,ar=SL.r[t.au]+Math.sin(S.anim*2+t.i)*1.5;
      const R0=SL.r[t.au],X=t.x*K,Y=acy*K,RR=R0*K,ag=ctx.createRadialGradient(X,Y,RR*.35,X,Y,RR);
      ag.addColorStop(0,'rgba(170,130,255,0)');ag.addColorStop(1,'rgba(170,130,255,.15)');ctx.fillStyle=ag;ctx.globalAlpha=S.m.stillA;ctx.beginPath();ctx.arc(X,Y,RR,0,6.283);ctx.fill();
      ctx.globalAlpha=.75*S.m.stillA;pxCircle(t.x,acy+camY,Math.round(ar),'#c9a8ff',3,5,S.anim*12);ctx.globalAlpha=1;
    }
    const B=t.y-(t.pop>0?Math.round(Math.sin((1-t.pop/.5)*Math.PI)*5):0),x=t.x,lv=t.lv,hh=TWH[lv],ww=TWW[lv],my=B-hh-3;
    const fT=t.ty==='f',bz=towerBusy(t);
    if(bz)ctx.globalAlpha=.5;
    const body=towerBody(t,lv)||(fT?['','#6e4a40','#7a5046','#86564a','#905c4e','#9c6252','#a86a58']:['','#6b6762','#77736d','#85817a','#8d8982','#98948c','#a29e96'])[Math.min(lv,6)];
    R(x-ww/2-3,B-4,ww+6,4,'#7a6a4a');R(x-ww/2-3,B-4,ww+6,1,'#94825a');
    const myB=drawTowerBody(t,x,B,hh,ww,lv,body);
    if(lv>=6&&Math.floor(S.anim*4)%2)R(x+ww/2-2,B-hh+2,1,1,'#ff4040');
    if(TBODY[t.ty]){drawTowerStyle(t,x,B,ww,lv,myB);drawTowerTop(t,x,myB,lv);ctx.globalAlpha=1;{const mh=towerMaxHp(t);if(t.hp<mh)bar(x,myB-22,18,Math.max(0,t.hp)/mh,t.hp<mh*.35?'#ff5a4a':'#7dff9a')}if(t.hHit>0){ctx.globalAlpha=.5;R(x-ww/2,B-hh,ww,hh-4,'#ffffff');ctx.globalAlpha=1}if(t.sh&&!t.brk&&!t.shHit&&nearTower(t)){ctx.globalAlpha=.4*S.m.stillA;pxCircle(x,B-hh/2-3,SH.r[t.sh],'#8ff0ff',2,4,S.anim*6);ctx.globalAlpha=1}if(t.sh&&t.shHit>0){ctx.globalAlpha=qa(t.shHit*3);pxCircle(x,B-hh/2-3,SH.r[t.sh],'#8ff0ff');pxCircle(x,B-hh/2-3,SH.r[t.sh]+1,'#8ff0ff');ctx.globalAlpha=1}continue}
    drawTowerStyle(t,x,B,ww,lv,myB);
    drawBarrels(t,x,my,lv);
    ctx.globalAlpha=1;
    if(t.sh&&t.shHit>0){ctx.globalAlpha=qa(t.shHit*3);pxCircle(x,B-hh/2-3,SH.r[t.sh],'#8ff0ff');pxCircle(x,B-hh/2-3,SH.r[t.sh]+1,'#8ff0ff');ctx.globalAlpha=1}
    else if(t.sh&&!t.brk&&nearTower(t)){ctx.globalAlpha=.4*S.m.stillA;pxCircle(x,B-hh/2-3,SH.r[t.sh],'#8ff0ff',2,4,S.anim*6);ctx.globalAlpha=1}   /* shield edge, only up close */
    {const mh=towerMaxHp(t);if(t.hp<mh)bar(x,B-hh-(TBODY[t.ty]?22:14),18,Math.max(0,t.hp)/mh,t.hp<mh*.35?'#ff5a4a':'#7dff9a')}
    if(t.hHit>0){ctx.globalAlpha=.5;R(x-ww/2,B-hh,ww,hh-4,'#ffffff');ctx.globalAlpha=1}
  }
}
function drawTowerBp(bp){
  const x=bp.x,B=bp.top,H=bp.kind==='tup'?TWH[S.towers[bp.slot].lv]+6:bp.kind==='rebuild'?TWH[bp.rl]+6:22;
  ctx.globalAlpha=.5;R(x-12,B-H,24,H,'#3a7f9a');
  for(let i=0;i<24;i+=4)R(x-12+i,B-H,2,H,'#8ff0ff');
  ctx.globalAlpha=1;outline(x-12,B-H,24,H,'#8ff0ff');
  R(x-11,B-H+1+Math.floor((S.anim*26)%(H-2)),22,1,'#e6fbff');
  bar(x,B+(bp.top<GW?9:6),22,clamp(bp.prog,0,1),'#8ff0ff');
}
function drawSlots(){
  const s=S,pulse=.45+.25*Math.sin(s.anim*4),can=s.coins>=towerCost();
  const opts=ctxOptions(),near=opts.find(o=>o.tw),holdOpt=cardHold&&!cardHold.done?opts.find(x=>x.key===cardHold.key):null;
  for(const t of s.towers){
    if(!slotActive(t))continue;
    const x=t.x,B=t.y,on=!!near&&near.tw===t;
    if(t.lv<1){
      if(towerBusy(t)||t.ruin)continue;
      /* ghost placeholder only appears when the mechanic is close */
      const nd=Math.hypot(s.m.x-x,(s.m.y-10)-(B-10));if(nd>56)continue;
      const fade=nd<36?1:nd<46?.5:.25;
      const col=can?'#8ff0ff':'#8a96a8';
      ctx.globalAlpha=qa((on?.95:(can?pulse:.35))*fade);
      outline(x-13,B-20,26,20,col);R(x-1,B-14,3,9,col);R(x-4,B-11,9,3,col);
      if(on){ctx.globalAlpha=.25;R(x-13,B-20,26,20,col)}
      ctx.globalAlpha=1;continue;
    }
    const hh=TWH[t.lv],up=t.lv<twMax(t.ty)&&t.lv<towerCap()&&s.coins>=twUpCost(t.ty,t.lv);
    const pc=up&&Math.floor(s.anim*3)%2?'#7dff9a':'#ffd36b';
    for(let i=0;i<twMax(t.ty);i++)R(x-(twMax(t.ty)*4-1)/2+i*4,B+(t.pl?2:5),3,3,i<t.lv?pc:'#3a3f4a');
    if(t.sh)for(let i=0;i<SH.max;i++)R(x-(SH.max*4-1)/2+i*4,B+(t.pl?2:5)+4,3,2,i<t.sh?(t.brk?'#8a4a4a':'#5ad1e6'):'#2a3340');
    if(t.fl>0){const L=TWL[t.lv]+2;R(x+Math.cos(t.ang)*L-2,B-hh-3+Math.sin(t.ang)*L-2,4,4,'#fff3b0')}
    if(on){ctx.globalAlpha=.25;R(x-12,B-hh-4,24,hh+4,'#8ff0ff');ctx.globalAlpha=1}
  }
  /* range of the tower the mechanic is next to (the range it will have after building or upgrading) */
  if(near&&near.kind!=='hub'&&near.state!=='max'&&near.state!=='busy'&&!near.tw.ruin){
    const tw=near.tw,lv=Math.min(TW.max,tw.lv+1),cx=tw.x,cy=tw.y-(tw.lv?TWH[tw.lv]:12)-3-camY;
    for(const o of opts){
      if(!o.tw||o.tw!==tw||o.kind==='hub'||o.state==='max'||o.state==='busy')continue;
      const Y=TY[o.ty||tw.ty||'g'];
      ctx.globalAlpha=(holdOpt===o?.75:.5)*(S.m.stillA||0);
      pxCircle(cx,cy+camY,o.shield?SH.r[Math.min(SH.max,tw.sh+1)]:o.aura?SL.r[Math.min(SL.max,tw.au+1)]:Y.rng[lv],o.shield?'#5ad1e6':o.aura?'#c58aff':Y.col,3,4,0);
    }
    ctx.globalAlpha=1;
  }
}
/* pre-rendered pixel lettering of CRITICAL HIT!! (halftone dots, outline, hard shadow, oversized '!!') */
let comicC=null;
function comicImg(){
  if(comicC)return comicC;
  const W2=190,H2=60,c=document.createElement('canvas');c.width=W2;c.height=H2;const g=c.getContext('2d');
  const F1='700 17px "Pixelify Sans",monospace',F2='700 44px "Pixelify Sans",monospace',T1='CRITICAL HIT',T2='!!';
  g.font=F1;const w1=g.measureText(T1).width;g.font=F2;const w2=g.measureText(T2).width;
  const x0=Math.round((W2-(w1+3+w2))/2),b2=50,b1=b2-6;
  const glyphs=(h,dx,dy,col)=>{h.fillStyle=col;h.textBaseline='alphabetic';h.font=F1;h.fillText(T1,x0+dx,b1+dy);h.font=F2;h.fillText(T2,x0+w1+3+dx,b2+dy)};
  for(let a=0;a<16;a++){const an=a/16*6.283;glyphs(g,Math.round(Math.cos(an)*2.4),Math.round(Math.sin(an)*2.4),'#14161e')}
  for(let k=1;k<=3;k++)glyphs(g,0,k,'#a3130f');
  glyphs(g,0,0,'#ffe23a');
  /* halftone: orange dots grow toward the bottom of the letters, clipped to the glyphs */
  const D=document.createElement('canvas');D.width=W2;D.height=H2;const d=D.getContext('2d');d.fillStyle='#ff7a1a';
  for(let y=0;y<H2;y+=3)for(let x=(y/3&1)*1.5;x<W2;x+=3){const r=Math.max(0,(y-12)/H2*1.9);if(r>.2)d.fillRect(Math.round(x-r/2),y,Math.max(1,Math.round(r)),Math.max(1,Math.round(r)))}
  const T=document.createElement('canvas');T.width=W2;T.height=H2;const h=T.getContext('2d');glyphs(h,0,0,'#fff');h.globalCompositeOperation='source-in';h.drawImage(D,0,0);g.drawImage(T,0,0);
  /* a bright strip along the top edge of the letters */
  const U=document.createElement('canvas');U.width=W2;U.height=H2;const u=U.getContext('2d');glyphs(u,0,0,'#fff7b0');u.globalCompositeOperation='destination-in';u.fillStyle='#000';u.fillRect(0,0,W2,26);g.globalAlpha=.5;g.drawImage(U,0,0);g.globalAlpha=1;
  return comicC=c;
}
/* slow motion after a critical kill: the envelope eases in, holds, and eases out over 2 real seconds (0..1) */
const sstep=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
function slowE(){const sl=S&&S.slow;if(!sl)return 0;const u=sl.t/sl.T;return sstep(u/.15)*(1-sstep((u-.6)/.4))}   /* quick in, short hold, quick out */
/* ---------- underground cross-section under the road: strata, pebbles, buried pipes, roots, junk and the core's conduit.
   Painted once into an offscreen canvas; the dock's translucent panels sit on top of it. ---------- */
const UG0=14;
let ugC=null;
function undergroundImg(){
  if(ugC)return ugC;
  const H=BOT-UG0,c=document.createElement('canvas');c.width=Math.round(VW*K);c.height=Math.round(H*K);
  const g=c.getContext('2d'),P=(x,y,w,h,col)=>{g.fillStyle=col;const x0=Math.round(x*K),y0=Math.round(y*K);g.fillRect(x0,y0,Math.round((x+w)*K)-x0,Math.round((y+h)*K)-y0)};
  let sd=777;const r=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
  const strata=[[0,['#3b2f25','#362b22','#41342a']],[22,['#4b3a2b','#45352a','#51402f']],[52,['#5a4635','#534131','#624d3a']],[86,['#3d414c','#373b46','#454955']]];
  for(let cy=0;cy<H;cy+=6)for(let cx=0;cx<VW;cx+=6){
    const yy=cy+Math.sin(cx*.13)*3+Math.sin(cx*.047+2)*4;let si=0;
    for(let k=0;k<strata.length;k++)if(yy>=strata[k][0])si=k;
    P(cx,cy,6,6,strata[si][1][(r()*3)|0]);
  }
  for(let i=0;i<150;i++){const x=r()*VW|0,y=r()*H|0,w=1+(r()*3|0),h=1+(r()*2|0);P(x,y,w,h,r()<.45?'#76664f':r()<.6?'#241b14':'#8a7a62')}
  for(let i=0;i<10;i++){const x=r()*VW|0,y=r()*(H-10)|0;P(x,y,4+(r()*5|0),3,'#6a6d78');P(x+1,y,2,1,'#8e92a0')}   /* embedded stones */
  /* roots hanging from the road */
  for(let x=10;x<VW;x+=20+(r()*16|0)){let cx=x,L=10+(r()*22|0);for(let y=0;y<L;y++){if(r()<.25)cx+=r()<.5?-1:1;P(cx,y,1,1,'#2b1e14');if(y>5&&r()<.08)P(cx+1,y,2,1,'#2b1e14')}}
  /* buried pipes */
  const pipe=(y,h,body,hi,sh,gap)=>{
    for(let x=0;x<VW;x++){if(gap&&x>gap[0]&&x<gap[1])continue;P(x,y,1,h,body)}
    P(0,y,VW,1,hi);P(0,y+h-1,VW,1,sh);
    for(let x=18;x<VW;x+=58){P(x,y-2,4,h+4,'#7a808c');P(x,y-2,4,1,'#a0a6b2');P(x+1,y-1,1,1,'#2a2c35');P(x+1,y+h,1,1,'#2a2c35')}
    for(let i=0;i<9;i++)P(r()*VW|0,y+1+(r()*(h-2)|0),2+(r()*3|0),1,'#8a5a3a');
  };
  pipe(30,7,'#59606c','#8a909c','#3a3f4a',[120,134]);
  pipe(70,5,'#8a5a3a','#b4784a','#5a3a24',null);
  P(120,26,14,15,'#2a2c35');P(121,27,12,13,'#1a1b21');for(let i=0;i<4;i++)P(122+i*3,28,1,11,'#3a3f4a');   /* a pipe break */
  /* conduit from the energy core down to a buried generator */
  P(CX-2,0,4,46,'#3a3f4a');P(CX-2,0,1,46,'#59606c');P(CX,0,1,46,'#1d2e3a');
  for(let y=4;y<44;y+=9)P(CX-3,y,6,2,'#6a707c');
  P(CX-17,46,34,18,'#3f4450');P(CX-17,46,34,2,'#6a707c');P(CX-17,62,34,2,'#262a33');
  P(CX-13,50,12,9,'#10202a');P(CX-12,51,10,7,'#1d4a5c');P(CX-12,51,10,1,'#5ad1e6');
  for(let i=0;i<3;i++)P(CX+3+i*4,51,3,3,['#7dff9a','#ffd36b','#5ad1e6'][i]);
  P(CX+3,56,12,2,'#262a33');
  /* junk */
  P(52,42,12,15,'#7a4a3a');P(52,42,12,2,'#9a6a52');P(52,47,12,1,'#4a2a20');P(52,52,12,1,'#4a2a20');P(53,43,2,13,'rgba(255,255,255,.14)');
  P(46,56,8,3,'#4d525c');P(64,54,6,5,'#6a5a3a');
  {const gx=292,gy2=88;P(gx+3,gy2,6,12,'#6a707c');P(gx,gy2+3,12,6,'#6a707c');P(gx+2,gy2+2,8,8,'#59606c');P(gx+4,gy2+4,4,4,'#3d414c');P(gx+5,gy2+5,2,2,'#2a2c35');P(gx+3,gy2,6,1,'#8e92a0')}
  {const bx=212,by=56;P(bx+6,by,2,16,'#d8d0b6');for(let i=0;i<4;i++){P(bx+1+(i&1),by+2+i*3,5,1,'#cfc6ad');P(bx+8,by+2+i*3,5-(i&1),1,'#cfc6ad')}P(bx+3,by-5,8,5,'#d8d0b6');P(bx+4,by-3,2,2,'#241b14');P(bx+8,by-3,2,2,'#241b14');P(bx+5,by-1,4,1,'#241b14')}
  {const kx=148,ky=96;P(kx,ky,18,10,'#6a4a2a');P(kx,ky,18,2,'#8a6a3a');P(kx+1,ky+4,16,1,'#4a3018');P(kx+8,ky,2,10,'#4a3018')}   /* a crate */
  /* depth: darker toward the bottom */
  for(let i=0;i<H;i+=4){g.fillStyle='rgba(0,0,0,'+(i/H*.5)+')';g.fillRect(0,Math.round(i*K),c.width,Math.round(4*K))}
  P(0,0,VW,2,'rgba(0,0,0,.45)');
  return ugC=c;
}
function render(){
  const s=S,d=darkness(s.t),warm=1-Math.abs(2*d-1),m=s.m;
  /* screen shake */
  /* zoom toward the enemy that died from the critical hit (2x at the peak of the slow motion) */
  const ze=slowE(),zz=1+.12*ze;let ztx=0,zty=0;
  if(ze>0){const sl=s.slow,Wk=VW*K,Hk=VH*K,fx=sl.x*K,fy=(sl.y-camY)*K;ztx=clamp(Wk/2-fx*zz,Wk*(1-zz),0);zty=clamp(Hk*.45-fy*zz,Hk*(1-zz),0);ztx*=ze;zty*=ze}
  ctx.setTransform(zz,0,0,zz,ztx,zty);
  const shk=SET.shake&&s.shake>0?Math.min(3,s.shake*12):0;
  if(shk){ctx.fillStyle='#000';ctx.fillRect(0,0,VW,VH);ctx.setTransform(zz,0,0,zz,ztx+Math.round(rnd(-shk,shk)*K),zty+Math.round(rnd(-shk,shk)*K))}
  /* sky */
  const top=mix(mix('#8d7d78','#06070f',d),'#6a3a4a',warm*.5);
  const bot=mix(mix('#e0a86c','#1d2038',d),'#e26a3a',warm*.8);
  {const g=ctx.createLinearGradient(0,0,0,GSC*K);g.addColorStop(0,css(top));g.addColorStop(1,css(bot));ctx.fillStyle=g;fr(0,0,Math.round(VW*K),Math.round(GSC*K))}ctx.fillStyle=css(bot);
  ctx.fillRect(0,GSC,VW,VH-GSC);
  if(d>.3){
    ctx.fillStyle='#fff';
    for(const st of stars){
      if(st.y>GSC-30)continue;
      const tw=.15+.85*Math.abs(Math.sin(s.anim*st.sp+st.p)),x=st.x|0,y=st.y|0;
      ctx.globalAlpha=Math.min(1,(d-.25)*1.6)*tw;ctx.fillStyle=st.col;
      const X=Math.round(x*K),Y=Math.round(y*K);
      if(st.big){fr(X,Y,2,2);if(tw>.8){fr(X-3,Y,8,1);fr(X,Y-3,1,8)}}
      else fr(X,Y,1,1);
    }
    ctx.globalAlpha=1;
  }
  const night=s.t>=DAY,q=night?(s.t-DAY)/NIGHT:s.t/DAY,bx=18+(VW-36)*q,by=GSC-30-Math.sin(Math.PI*q)*(GSC-90);
  SUN.x=night?CX:bx;SUN.e=night?0:Math.sin(Math.PI*q);SUN.a=night?0:(1-d)*Math.min(1,SUN.e*4+.2);
  ctx.fillStyle=night?'#dfe5f5':css(mix('#f3d9a0','#e8905a',warm));
  ctx.fillRect((bx-5)|0,(by-6)|0,10,12);ctx.fillRect((bx-6)|0,(by-5)|0,12,10);

  /* drifting clouds: they pick up speed and more of them roll in as night falls */
  {
    const dtc=Math.min(.1,Math.max(0,s.anim-(cloudT||s.anim)));cloudT=s.anim;
    const ccol=css(mix(mix('#f6e3c8','#343a63',d),'#f2a272',warm*.5)),cshd=css(mix(mix('#d9b08e','#1e2240',d),'#c97a5a',warm*.4));
    for(const cd of clouds){
      cd.x+=cd.sp*(1+2.2*d)*dtc;if(cd.x>VW+50)cd.x=-50;
      const al=(cd.k?d:1)*(.5+.25*d);if(al<.02||cd.y>GSC-60)continue;
      ctx.globalAlpha=al;
      for(const b of CLOUD){
        ctx.fillStyle=cshd;ctx.fillRect(Math.round(cd.x+b[0]*cd.s),Math.round(cd.y+(b[1]+b[3]-2)*cd.s),Math.ceil(b[2]*cd.s),Math.ceil(2*cd.s));
        ctx.fillStyle=ccol;ctx.fillRect(Math.round(cd.x+b[0]*cd.s),Math.round(cd.y+b[1]*cd.s),Math.ceil(b[2]*cd.s),Math.ceil((b[3]-1)*cd.s));
      }
    }
    ctx.globalAlpha=1;
  }

  {const dq=Math.round(d*20)/20;   /* distant buildings are out of focus: the further layer is blurrier */
   layer(farCity,.55,css(mix('#7a695e','#10101c',dq)),css(mix('#5f5149','#0a0a14',dq)),3.2,'far');
   layer(midCity,.8,css(mix('#5c4d45','#0c0c16',dq)),css(mix('#463a34','#07070f',dq)),1.9,'mid');}

  /* ground */
  const gy=GW-Math.round(camY);
  if(gy<VH){
    ctx.fillStyle=css(mix('#403b3a','#15141b',d));ctx.fillRect(0,gy,VW,Math.min(VH-gy+1,UG0));
    if(gy+UG0<VH)ctx.drawImage(undergroundImg(),0,gy+UG0,VW,BOT-UG0);
    ctx.fillStyle=css(mix('#6a625c','#1f1e28',d));ctx.fillRect(0,gy,VW,2);
    ctx.fillStyle=css(mix('#b58f2a','#3a3014',d));
    for(let x=4;x<VW;x+=28)ctx.fillRect(x,gy+12,12,1);
    ctx.fillStyle=css(mix('#2c2827','#0d0c12',d));
    for(let x=0;x<VW;x++){if(x%37===5)ctx.fillRect(x,gy+4+(x%7)*4,4,1);if(x%53===9)ctx.fillRect(x,gy+6+(x%5)*5,1,3)}

  }
  /* cast shadows that follow the sun */
  {
    const cr=s.crane;
    gShadow(CX,24,30);gShadow(CRMX,8,GW-cr.y+CRROPE);gShadow(CLMX,8,GW-s.crane2.y+CRROPE);
    for(const t of s.towers)if(t.lv>0)gShadow(t.x,TWW[t.lv],TWH[t.lv]+6,t.pl?t.y:GW);
    for(const x of PILES)gShadow(x,14,6);
    for(const b of s.bots)if(b.y>=GW-1)gShadow(b.x,7,11);
    if(m.st)gShadow(m.x,8,20,m.st==='p'?m.y:GW);
  }
  for(const x of PILES)drawPile(x);
  drawFireBarrel();
  drawCrane();
  drawTowers();
  for(const b of s.bots)drawBot(b);
  for(const dr of s.drones)drawDrone(dr);

  ctx.fillStyle='rgba(6,10,38,'+(.5*d)+')';ctx.fillRect(0,0,VW,VH);

  /* bright layer: grid placeholders, blueprints, flame, mechanic */
  const pulse=.4+.25*Math.sin(s.anim*4);
  const holdOpt=cardHold&&!cardHold.done?ctxOptions().find(x=>x.key===cardHold.key):null;
  for(const bp of s.bps)drawTowerBp(bp);
  drawSlots();
  drawFlame();
  for(const dr of s.drops){const y=dr.y-(dr.rest?Math.round(Math.sin(s.anim*4+dr.ph)*1+1):0);R(dr.x-2,y-4,4,4,'#a9bccf');R(dr.x-1,y-3,2,2,'#2a2e3a');if(((s.anim*1.2+dr.ph)%2)<.14){R(dr.x+1,y-6,1,3,'#fff');R(dr.x,y-5,3,1,'#fff')}}
  drawMech(m);
  if(holdOpt){const pos=optPos(holdOpt);bar(pos[0],pos[1],30,clamp(cardHold.t/HT[holdOpt.kind],0,1),'#ffd36b')}

  /* glow */
  ctx.globalCompositeOperation='lighter';
  if(SET.light){
    const nk=.35+.65*d;
    light(CX,GW-16,78,'90,209,230',(.2+.32*d)*(s.coreHit>0?1.8:1));
    light(CX,GW+UG0+54,56,'90,209,230',(.1+.12*d)*(.75+.25*Math.sin(s.anim*3)));
    if(m.thr)light(m.x-m.dir*7,m.y-1,28,'255,170,80',.55*nk+.15);
    if(m.zt>0)light(m.x+m.dir*10,m.y-11,14,hexRgb(MAINC[s.mlv]),.5);
    for(const w of s.saws)light(w.x,w.y,10,'255,230,160',.3*nk);
    if(s.slash)for(const q of s.slash)if(q.t>=0){const k=q.t/q.l,an=q.a+q.sd*(-1.45+2.9*Math.min(1,k*1.6));light(q.x+Math.cos(an)*q.r,q.y+Math.sin(an)*q.r,34,'170,235,255',.85*(1-k))}
    for(const b of s.buddies)light(b.x,b.y,10,'200,150,255',.35*nk);
    for(const t of s.towers){
      if(!t.lv||t.fl<=0)continue;
      const my=t.y-TWH[t.lv]-3,L=TWL[t.lv]+2,ax=t.x+Math.cos(t.ang)*L,ay=my+Math.sin(t.ang)*L;
      if(t.ty==='f')light(ax+Math.cos(t.ang)*20,ay+Math.sin(t.ang)*20,48,'255,140,60',.45*nk+.1);
      else light(ax,ay,16,'255,225,150',.5*nk+.1);
    }
    for(const b of s.bolts)light(b.x2,b.y2,15,hexRgb(b.c),.45*nk+.1);
    for(const p of s.missiles)light(p.x,p.y,p.small?10:16,'255,170,80',.45*nk+.1);
    for(const t of s.towers)if(t.ty==='laser'&&t.beam&&t.tgt){light(t.tgt.x,t.tgt.y,14+t.beam*4,'255,80,110',.4*nk+.15)}
    for(const t of s.towers)if(t.ty==='decoy'&&t.lv&&t.hp>0&&Math.floor(s.anim*3)%2)light(t.x,t.y-TWH[t.lv]-20,22,'255,170,70',.5*nk);
    for(const dr of s.drones)light(dr.x,dr.y,dr.boss?26:12,'255,70,50',.28*d);
    for(const f of s.fx)if(f.light)light(f.x,f.y,f.r,f.rgb,f.a*(f.l/f.L));
    if(Math.floor(s.anim*2)%2)for(const n of[1,2]){const P=PLAT(n);if(P){light(P.px-P.w/2+1,P.y-2,10,'255,80,60',.35*d);light(P.px+P.w/2-1,P.y-2,10,'255,80,60',.35*d)}}
  }
  /* halation: warm bloom around the low sun at dawn and dusk */
  if(SET.light){
    const low=night?0:Math.max(0,1-SUN.e*2.4)*(1-d),halo=Math.min(1,Math.max(warm*.95,low*.8));
    if(halo>.03){
      let hx=bx,hy=by;
      if(night){hx=s.t>CYC-DUSK*1.5?18:VW-18;hy=GSC-30}
      const X=hx*K,Y=hy*K,RR=260*K,g=ctx.createRadialGradient(X,Y,0,X,Y,RR);
      g.addColorStop(0,'rgba(255,214,150,'+(.6*halo)+')');g.addColorStop(.12,'rgba(255,170,100,'+(.32*halo)+')');
      g.addColorStop(.45,'rgba(255,130,70,'+(.12*halo)+')');g.addColorStop(1,'rgba(255,110,60,0)');
      ctx.fillStyle=g;fr(0,0,Math.round(VW*K),Math.round(VH*K));
      ctx.fillStyle='rgba(255,150,90,'+(.05*halo)+')';fr(0,0,Math.round(VW*K),Math.round(VH*K));
    }
  }
  ctx.globalCompositeOperation='source-over';
  const fl=Math.floor(s.anim*10)%2;
  for(const b of s.bots)R(b.x+b.dir*1,b.y-8,1,1,'#5ad1e6');
  for(const dr of s.drones){
    const y=dr.y+Math.round(Math.sin(dr.ph*3));
    droneEyes(dr,y,fl);
    if(dr.slow){const k=Math.floor(s.anim*4+dr.ph)%3;R(dr.x-dr.w/2-2+k,y-4,1,1,'#e0c8ff');R(dr.x+dr.w/2+1-k,y+2,1,1,'#e0c8ff');R(dr.x-1+k,y-6,1,1,'#c9a8ff')}
    if(dr.chase&&!dr.boss)R(dr.x,y-9,1,4,'#ff4a3a'),R(dr.x,y-4,1,1,'#ff4a3a');else if(dr.chase)R(dr.x,y-12,2,6,'#ff4a3a'),R(dr.x,y-5,2,2,'#ff4a3a');
    if(dr.atk&&Math.floor(s.anim*14)%2){
      R(dr.x-1,y+3,2,2,'#ff6a4a');   /* muzzle flicker; the pellets themselves fly (enemyShot) */
    }
  }
  for(const b of s.bolts){line(b.x1,b.y1,b.x2,b.y2,b.c,(b.c==='#8ff0ff'||b.c==='#7dff9a'||b.c==='#ff7ae6'||b.th)?4:0);if(b.th){line(b.x1+1,b.y1,b.x2+1,b.y2,b.c,3);line(b.x1,b.y1+1,b.x2,b.y2+1,b.c,3)}line(b.x1,b.y1,b.x2,b.y2,'#ffffff',0)}
  for(const f of s.fx){
    if(f.light)continue;
    if(f.plus){   /* floating green plus symbol that fades out */
      const k=f.l/f.L,z=f.z||1,X=Math.round(f.x),Y=Math.round(f.y);ctx.globalAlpha=qa(Math.min(1,k*1.6));
      R(X-1,Y-2,3,5,'#0d2a14');R(X-2,Y-1,5,3,'#0d2a14');R(X,Y-1,1,3,f.c);R(X-1,Y,3,1,f.c);ctx.globalAlpha=1;continue;
    }
    if(f.text&&f.comic){   /* comic-book lettering: halftone shading, thick outline, hard shadow; the exclamation marks are bigger than the words */
      const img=comicImg(),t=1-f.l/(f.L||1),sc=t<.1?.4+t/.1*.9:t<.2?1.3-(t-.1)/.1*.2:1.1+Math.sin(t*12)*.015,al=f.l<.25?f.l/.25:1;
      const X=Math.round(f.x*K),Y=Math.round((f.y-camY)*K),w=img.width*K*1.05*sc,h=img.height*K*1.05*sc;
      ctx.save();ctx.globalAlpha=qa(al);ctx.translate(X,Y);ctx.rotate(-.08);const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;di(img,Math.round(-w/2),Math.round(-h*.62),Math.round(w),Math.round(h));ctx.imageSmoothingEnabled=sm;ctx.restore();ctx.globalAlpha=1;continue;
    }
    if(f.text){
      const X=Math.round(f.x*K),Y=Math.round((f.y-camY)*K);ctx.globalAlpha=qa(Math.min(1,f.l*2.5));
      ctx.font='700 '+Math.round(8*K)+'px "Pixelify Sans",monospace';ctx.textAlign='center';
      ctx.fillStyle='#14161e';ctx.fillText(f.text,X+K,Y+K);ctx.fillStyle=f.c;ctx.fillText(f.text,X,Y);continue;
    }
    if(f.ring){
      const k=1-f.l/f.L,r=f.r0+(f.r1-f.r0)*(1-(1-k)*(1-k));
      ctx.globalAlpha=qa(f.l/f.L);pxCircle(f.x,f.y,Math.round(r),f.c);pxCircle(f.x,f.y,Math.round(r)+1,f.c);continue;
    }
    ctx.globalAlpha=Math.min(1,f.l*4);R(f.x,f.y,f.s||2,f.s||2,f.c);
  }
  ctx.globalAlpha=1;
  drawCombat();
  drawShots();
  drawPlayerRanges();
  if(s.waves)for(const w of s.waves){   /* shock fronts */
    const k=w.r/BLAST.r;ctx.globalAlpha=qa(1-k*.8);
    pxCircle(w.x,w.y,Math.round(w.r),'#8ff0ff');pxCircle(w.x,w.y,Math.round(w.r)+1,'#e6fbff');pxCircle(w.x,w.y,Math.round(w.r*.82),'#5ad1e6',4,3,S.anim*20);
    ctx.globalAlpha=1;
  }
  ctx.setTransform(1,0,0,1,0,0);
  /* arrows for drones still above the screen */
  ctx.fillStyle='#ff4a3a';
  for(const dr of s.drones){
    if(dr.y-camY>=2)continue;
    const px=Math.round(dr.x);if(px<3||px>VW-4)continue;
    const ay=74+Math.round(Math.sin(s.anim*6)*1.5);ctx.fillRect(px-2,ay,5,1);ctx.fillRect(px-1,ay+1,3,1);ctx.fillRect(px,ay+2,1,1);
  }
}
