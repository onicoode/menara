
/* ---------- audio: everything is synthesized in the browser, no files ---------- */
const AU={bg:false,ctx:null,on:true,master:null,mus:null,sfxg:null,padG:null,padF:null,noise:null,dark:0,play:false,step:0,next:0,last:{},ch:null};
try{AU.on=localStorage.getItem('mr_snd')!=='0'}catch(e){}
const midi=n=>440*Math.pow(2,(n-69)/12);
/* eight bars: Am F C/G G Am F G E */
const PROG=[[57,60,64],[53,57,60],[55,60,64],[55,59,62],[57,60,64],[53,57,60],[55,59,62],[52,56,59]];
const ARP=[0,-1,2,-1,1,-1,2,1];
const SFXLIM={mortar:.15,rocket:.2,emp:.3,net:.2,blast:.3,zap:.12,shot:.07,mg:.06,beep:.4,boom:.05,clank:.25,slash:.1,x_weld:.1,x_rail:.2,x_saw:.4,x_throw:.15,x_nade:.2,x_buddy:.09,x_buddy2:.1,x_rail2:.1,regen:.9,x_orbit:.1,x_shot:.1,x_mini:.15,x_minihit:.08,x_field:.14,snipe:.2,gat:.035,slot:.015,slotend:.04,crit:.12,slowmo:1,shatter:.3,burn:.4,hurt:.3,pickup:.05,repel:.3,coin:0,jackpot:.5,land:.1,jump:.1,tick:.05,crash:.2};

/* the game is in the background (minimized, screen off, quit): silence everything and never resume on its own */
function audioBg(on){AU.bg=!!on;const c=AU.ctx;if(!c)return;try{if(on)c.suspend();else if(AU.on&&!document.hidden)c.resume()}catch(e){}}
window.mrBg=audioBg;
function audioInit(){
  if(AU.bg)return;
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return}
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=new C();AU.ctx=c;
    AU.comp=c.createDynamicsCompressor();AU.comp.threshold.value=-16;AU.comp.knee.value=8;AU.comp.ratio.value=8;AU.comp.attack.value=.004;AU.comp.release.value=.2;AU.comp.connect(c.destination);
    AU.master=c.createGain();AU.master.gain.value=3.2;AU.master.connect(AU.comp);   /* 2x the old .8 */
    AU.mus=c.createGain();AU.mus.gain.value=.5;AU.mus.connect(AU.master);
    AU.sfxg=c.createGain();AU.sfxg.gain.value=.9;AU.sfxg.connect(AU.master);
    AU.wpg=c.createGain();AU.wpg.gain.value=2;AU.wpg.connect(AU.sfxg);   /* player weapons play louder than everything else */
    const len=c.sampleRate,buf=c.createBuffer(1,len,c.sampleRate),dat=buf.getChannelData(0);
    for(let i=0;i<len;i++)dat[i]=Math.random()*2-1;
    AU.noise=buf;
    /* low drone under the music */
    const pf=c.createBiquadFilter();pf.type='lowpass';pf.frequency.value=380;pf.Q.value=.7;
    AU.padF=pf;AU.padG=c.createGain();AU.padG.gain.value=0;
    [110,164.81,110].forEach((f,i)=>{const o=c.createOscillator();o.type=i===2?'triangle':'sawtooth';o.frequency.value=f;o.detune.value=i*6;o.connect(pf);o.start()});
    pf.connect(AU.padG);AU.padG.connect(AU.mus);
    setInterval(musicTick,90);
  }catch(e){AU.ctx=null}
}
function tone(f,when,dur,type,vol,dest,slide,lp){
  const c=AU.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,when);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),when+dur);
  g.gain.setValueAtTime(.0001,when);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),when+.01);
  g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  let n=o;
  if(lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl}
  n.connect(g);g.connect(dest||AU.mus);o.start(when);o.stop(when+dur+.05);
}
function noise(when,dur,type,freq,vol,dest,sweep){
  const c=AU.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=AU.noise;f.type=type;f.frequency.setValueAtTime(freq,when);
  if(sweep)f.frequency.exponentialRampToValueAtTime(Math.max(40,sweep),when+dur);
  g.gain.setValueAtTime(Math.max(.0002,vol),when);
  g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  s.connect(f);f.connect(g);g.connect(dest||AU.mus);s.start(when,Math.random()*.4);s.stop(when+dur+.05);
}
function scheduleStep(i,when){
  const bar=(i>>3)&7,s=i&7,ch=PROG[bar],d=AU.dark,aw=1-d,root=ch[0]-24;
  if(s===0||s===4)tone(midi(root),when,.55,'sine',.26,AU.mus);
  if(d>.15)tone(midi(root),when,.18,'sawtooth',.11*d*(s%2?.7:1),AU.mus,0,260+d*200);
  if(aw>.12&&ARP[s]>=0)tone(midi(ch[ARP[s]]+12),when,.5,'triangle',.12*aw,AU.mus);
  if(s===6&&(bar&1)&&aw>.3)tone(midi(ch[2]+24),when,1,'sine',.06*aw,AU.mus);
  if(d>.2)noise(when,.04,'highpass',6500,.09*d*(s%2?.6:1),AU.mus);
  if(d>.4&&s===0&&(bar&1))tone(midi(ch[0]+13),when,.7,'square',.045*d,AU.mus,0,900);
}
/* main menu theme: a slower, heroic loop with a lead melody, pad, bass and a soft beat */
const MEL=[[76,0,0,0,74,0,72,0],[77,0,0,0,76,0,72,0],[79,0,0,76,0,0,72,76],[74,0,0,0,71,0,74,0],
           [76,0,0,0,81,0,79,0],[77,0,76,0,72,0,69,0],[74,0,76,0,79,0,76,0],[71,0,0,0,68,0,71,0]];
function scheduleMenu(i,when){
  const bar=(i>>3)&7,s=i&7,ch=PROG[bar],root=ch[0]-24,st=60/92/2;
  if(s===0){for(const n of ch)tone(midi(n),when,st*8.2,'triangle',.055,AU.mus,0,1400);tone(midi(root+12),when,st*3.8,'sawtooth',.06,AU.mus,0,420)}
  if(s===4)tone(midi(root+(bar&1?7:12)),when,st*3.5,'sawtooth',.05,AU.mus,0,380);
  if(s===0||s===4){tone(95,when,.16,'sine',.3,AU.mus,45);noise(when,.05,'lowpass',500,.12,AU.mus,150)}
  if(s===4)noise(when,.12,'bandpass',1900,.09,AU.mus,900);
  if(s&1)noise(when,.03,'highpass',7000,.05,AU.mus);
  const m=MEL[bar][s];
  if(m){tone(midi(m),when,st*(MEL[bar][(s+1)&7]?1.2:3.6),'square',.065,AU.mus,0,2300);tone(midi(m-12),when,st*2,'triangle',.05,AU.mus)}
  if(s===2||s===6)tone(midi(ch[(s>>1)%3]+24),when,st*1.6,'sine',.045,AU.mus);
}
function musicTick(){
  const c=AU.ctx;if(!c)return;
  const t=c.currentTime;
  AU.padG.gain.setTargetAtTime(AU.play?.055+.04*AU.dark:0,t,.5);
  AU.padF.frequency.setTargetAtTime(320+AU.dark*520,t,.5);
  const mode=AU.play?1:AU.menu?2:0;
  if(!mode||c.state!=='running'){AU.next=0;return}
  if(AU.mode!==mode){AU.mode=mode;AU.step=0;AU.next=0}
  if(!AU.next||AU.next<t-.2)AU.next=t+.05;
  while(AU.next<t+.35){
    if(mode===2){scheduleMenu(AU.step,AU.next);AU.next+=60/92/2}
    else{scheduleStep(AU.step,AU.next);AU.next+=60/(76+AU.dark*30)/2}
    AU.step=(AU.step+1)%64;
  }
}
function sfx(n){
  const c=AU.ctx;if(!c||!AU.on)return;
  if(AU.bg)return;
  if(c.state==='suspended'){c.resume();return}
  const t=c.currentTime,lim=SFXLIM[n]||0;
  if(AU.last[n]&&t-AU.last[n]<lim)return;
  AU.last[n]=t;
  const o=(n.charAt(0)==='x'&&n.charAt(1)==='_')||n==='slash'?AU.wpg:AU.sfxg;
  switch(n){
    case'zap':noise(t,.09,'bandpass',2200,.16,o,800);tone(520,t,.1,'square',.07,o,180);break;
    case'shot':noise(t,.07,'highpass',1800,.18,o,600);tone(220,t,.09,'square',.08,o,70);break;
    case'mg':noise(t,.045,'highpass',2200,.1,o,900);tone(170,t,.05,'square',.05,o,80);break;
    case'beep':tone(1000,t,.07,'square',.07,o);break;
    case'mortar':noise(t,.18,'lowpass',700,.32,o,120);tone(140,t,.16,'sine',.25,o,60);break;
    case'rocket':noise(t,.4,'bandpass',1500,.16,o,500);tone(300,t,.3,'sawtooth',.05,o,900);break;
    case'emp':tone(1400,t,.35,'sine',.12,o,120);noise(t,.3,'highpass',3000,.12,o,600);break;
    case'net':noise(t,.12,'bandpass',900,.14,o,300);tone(260,t,.08,'triangle',.08,o,160);break;
    case'blast':noise(t,.6,'lowpass',3200,.42,o,120);tone(220,t,.5,'sine',.32,o,40);tone(880,t,.18,'square',.08,o,1800);noise(t,.25,'highpass',4000,.16,o,9000);break;
    case'boom':noise(t,.35,'lowpass',1800,.34,o,150);tone(110,t,.3,'sine',.3,o,40);break;
    case'x_weld':noise(t,.12,'bandpass',3600,.2,o,1100);tone(150,t,.12,'sawtooth',.13,o,430);tone(1900,t,.05,'square',.06,o,900);tone(95,t+.03,.08,'square',.06,o,200);break;
    case'x_rail':tone(180,t,.18,'sawtooth',.12,o,1600);noise(t+.12,.3,'lowpass',5200,.4,o,180);tone(900,t+.12,.3,'sine',.28,o,55);tone(2600,t+.12,.12,'square',.07,o,420);break;
    case'x_saw':tone(110,t,.4,'sawtooth',.15,o,280);tone(114,t,.4,'sawtooth',.11,o,285);noise(t,.36,'bandpass',800,.16,o,3200);tone(1500,t+.05,.2,'triangle',.05,o,500);break;
    case'x_throw':tone(280,t,.1,'triangle',.2,o,110);noise(t,.07,'bandpass',700,.16,o,300);tone(520,t+.05,.08,'sine',.07,o,260);break;
    case'x_nade':noise(t,.55,'lowpass',2600,.55,o,90);tone(85,t,.45,'sine',.55,o,32);tone(1300,t,.08,'square',.06,o,200);noise(t+.02,.2,'highpass',4000,.16,o,1500);break;
    case'x_buddy2':tone(1100,t,.06,'square',.1,o,1900);tone(1500,t+.03,.06,'square',.09,o,800);tone(1900,t+.07,.07,'triangle',.07,o,900);noise(t,.05,'highpass',5000,.08,o,8000);break;
    case'x_rail2':tone(1400,t,.2,'sawtooth',.09,o,260);noise(t,.18,'highpass',4500,.18,o,900);tone(520,t,.2,'sine',.15,o,90);break;
    case'x_buddy':tone(950,t,.07,'square',.1,o,1600);tone(1400,t+.035,.06,'triangle',.08,o,700);break;
    case'x_orbit':tone(1150,t,.16,'triangle',.14,o,1700);noise(t,.09,'highpass',3500,.13,o,6500);tone(2300,t+.02,.1,'sine',.05,o,1800);break;
    case'x_shot':noise(t,.13,'bandpass',1500,.45,o,280);tone(125,t,.13,'square',.22,o,48);noise(t+.015,.06,'highpass',3200,.22,o,1000);break;
    case'x_mini':noise(t,.4,'bandpass',1900,.22,o,650);tone(480,t,.32,'sawtooth',.09,o,1300);tone(240,t,.2,'square',.05,o,520);break;
    case'x_minihit':noise(t,.12,'lowpass',2400,.34,o,280);tone(230,t,.12,'sine',.28,o,85);tone(900,t,.05,'square',.05,o,300);break;
    case'x_field':tone(105,t,.13,'sawtooth',.11,o,58);noise(t,.08,'bandpass',2700,.15,o,5200);tone(1400,t+.02,.05,'square',.04,o,700);break;
    case'snipe':noise(t,.1,'highpass',3500,.4,o,900);tone(1300,t,.08,'sawtooth',.2,o,160);tone(110,t+.01,.28,'sine',.3,o,40);noise(t+.06,.35,'lowpass',1200,.12,o,200);break;
    case'gat':noise(t,.03,'bandpass',2600,.2,o,1400);tone(210,t,.03,'square',.07,o,120);break;
    case'regen':tone(660,t,.14,'sine',.1,o,990);tone(990,t+.09,.2,'sine',.09,o,1320);tone(1320,t+.2,.3,'triangle',.07,o,1760);noise(t,.3,'highpass',6000,.04,o,9000);break;
    case'slot':noise(t,.02,'highpass',3000,.05,o,6000);tone(520,t,.025,'square',.02,o,330);break;
    case'slotend':noise(t,.04,'bandpass',1800,.07,o,900);tone(210,t,.06,'square',.035,o,110);tone(840,t,.02,'square',.02,o,400);break;
    case'crit':tone(1568,t,.09,'square',.13,o);tone(2093,t+.07,.2,'square',.11,o);noise(t,.08,'highpass',5000,.15,o,9000);break;
    case'shatter':noise(t,.5,'lowpass',3800,.5,o,120);tone(70,t,.4,'sine',.5,o,30);for(let i=0;i<7;i++){tone(1800+Math.random()*2500,t+.02+i*.035,.05,'square',.06,o,500)}noise(t+.03,.3,'highpass',5000,.2,o,1500);break;
    case'slowmo':tone(520,t,1.6,'sawtooth',.09,o,70,900);tone(260,t,1.8,'sine',.12,o,45);break;
    case'slash':noise(t,.2,'bandpass',5200,.26,o,700);noise(t+.02,.12,'highpass',6000,.14,o,2500);tone(2100,t+.03,.22,'triangle',.07,o,3200);tone(330,t,.12,'sawtooth',.09,o,110);tone(1400,t+.1,.12,'sine',.05,o,600);break;
    case'clank':tone(420,t,.12,'square',.07,o,300);noise(t,.05,'bandpass',3000,.1,o);break;
    case'crash':noise(t,.5,'lowpass',2600,.4,o,200);tone(90,t,.4,'sawtooth',.2,o,40);break;
    case'burn':noise(t,.2,'lowpass',900,.18,o,300);break;
    case'hurt':tone(300,t,.28,'sawtooth',.18,o,90);noise(t,.2,'bandpass',900,.15,o);break;
    case'pickup':tone(880,t,.08,'sine',.16,o);tone(1320,t+.07,.14,'sine',.16,o);break;
    case'tick':tone(1200,t,.05,'sine',.08,o);break;
    case'jump':tone(260,t,.14,'square',.06,o,520);break;
    case'land':noise(t,.08,'lowpass',500,.2,o);tone(90,t,.1,'sine',.18,o,50);break;
    case'drop':noise(t,.18,'bandpass',700,.08,o,250);break;
    case'blueprint':[660,880,1100].forEach((f,i)=>tone(f,t+i*.06,.12,'triangle',.14,o));break;
    case'built':tone(180,t,.2,'square',.1,o,90);noise(t,.12,'bandpass',2500,.14,o);tone(1040,t+.12,.25,'triangle',.12,o);tone(1560,t+.12,.25,'sine',.06,o);break;
    case'turret':tone(120,t,.25,'sawtooth',.18,o,60);noise(t,.15,'lowpass',1200,.2,o);[523,659,784,1046].forEach((f,i)=>tone(f,t+.15+i*.06,.18,'square',.07,o));break;
    case'fuel':noise(t,.3,'highpass',2500,.12,o,5000);tone(330,t,.2,'triangle',.12,o,500);break;
    case'power':[392,523,659,784,1046].forEach((f,i)=>tone(f,t+i*.07,.2,'square',.07,o));break;
    case'nope':tone(200,t,.12,'square',.09,o);tone(150,t+.1,.16,'square',.09,o);break;
    case'night':tone(220,t,1.4,'sawtooth',.12,o,110);tone(223,t,1.4,'sawtooth',.1,o,112);break;
    case'dawn':[440,554,659,880].forEach((f,i)=>tone(f,t+i*.14,.5,'triangle',.12,o));break;
    case'over':[330,294,262,196,131].forEach((f,i)=>tone(f,t+i*.22,.45,'sawtooth',.12,o,f*.97));break;
    case'repel':tone(180,t,.3,'sine',.2,o,520);noise(t,.2,'bandpass',1200,.16,o,3000);tone(90,t,.2,'square',.07,o,40);break;
    case'coin':{const f=AU.cf||880;tone(f,t,.07,'square',.07,o);tone(f*1.5,t+.04,.12,'sine',.1,o);break}
    case'jackpot':[784,988,1175,1568,1976].forEach((f,i)=>{tone(f,t+i*.08,.35,'triangle',.14,o);tone(f*2,t+i*.08,.2,'sine',.05,o)});noise(t+.35,.5,'highpass',5000,.1,o,9000);break;
    case'click':tone(700,t,.05,'square',.06,o);break;
  }
}
/* rising tone while a press-and-hold fills up; p<0 stops it */
function sfxCharge(p){
  const c=AU.ctx;if(!c||!AU.on)return;
  if(p<0){
    if(AU.ch){const k=AU.ch;AU.ch=null;k.g.gain.setTargetAtTime(0,c.currentTime,.03);setTimeout(()=>{try{k.o.stop()}catch(e){}},250)}
    return;
  }
  if(!AU.ch){
    const o=c.createOscillator(),g=c.createGain();
    o.type='triangle';g.gain.value=0;o.connect(g);g.connect(AU.sfxg);o.start();AU.ch={o,g};
  }
  AU.ch.o.frequency.setTargetAtTime(200+p*520,c.currentTime,.03);
  AU.ch.g.gain.setTargetAtTime(.07,c.currentTime,.03);
}
/* continuous jetpack whoosh while the thruster burns */
function sfxThrust(on){
  const c=AU.ctx;if(!c||!AU.on)return;
  if(!AU.th){
    if(!on)return;
    const s=c.createBufferSource(),f=c.createBiquadFilter(),g2=c.createGain();
    s.buffer=AU.noise;s.loop=true;f.type='bandpass';f.frequency.value=650;f.Q.value=.8;g2.gain.value=0;
    s.connect(f);f.connect(g2);g2.connect(AU.sfxg);s.start();AU.th={g:g2,f};
  }
  AU.th.g.gain.setTargetAtTime(on?.17:0,c.currentTime,.06);
  AU.th.f.frequency.setTargetAtTime(on?620+Math.random()*90:450,c.currentTime,.05);
}
