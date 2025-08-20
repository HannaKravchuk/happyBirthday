// ===== Helper =====
const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (min, max) => Math.random() * (max - min) + min;

// ===== Elements =====
const candleEls = qa('.candle');
const body = document.body;
const resetBtn = q('#reset');
const balloonsWrap = q('#balloons');
const canvas = q('#fireworks');
const ctx = canvas.getContext('2d');
const hintEl = q('.hint');
const trackEl = q('#music');
const BALLOON_TEXT = '37';

setTimeout(() => {
  if (hintEl) {
    hintEl.classList.add('hide');
    hintEl.setAttribute('aria-hidden', 'true');
  }
}, 5000);

function playTrack() {
  if (trackEl) {
    trackEl.currentTime = 0;
    trackEl.volume = 0.35; // громкость (0..1)
    trackEl.play().catch(() => { try { playBirthday(); } catch {} });
  } else {
    try { playBirthday(); } catch {}
  }
}

// ===== Candles =====
candleEls.forEach(c => {
  c.addEventListener('click', () => toggleCandle(c, false));
  c.querySelector('.flame').addEventListener('click', e => { e.stopPropagation(); toggleCandle(c,false); });
});

function toggleCandle(el, relight){
  const lit = el.getAttribute('data-lit') === '1';
  if(lit && !relight){
    el.classList.add('out');
    el.setAttribute('data-lit','0');
    checkAllOut();
  } else if(!lit && relight){
    el.classList.remove('out');
    el.setAttribute('data-lit','1');
  }
}

function allCandlesOut(){ return candleEls.every(c => c.getAttribute('data-lit') === '0'); }
function relightAll(){ candleEls.forEach(c => toggleCandle(c, true)); }

let celebrationStarted = false;
function checkAllOut(){
  if(!celebrationStarted && allCandlesOut()){
    celebrationStarted = true;
    startCelebration();
  }
}

resetBtn.addEventListener('click', () => {
  stopCelebration();
  relightAll();
});

// ===== Balloons =====
let balloonTimer;
const balloonColors = [
  ['#9fb3c8','#517b9b'], // steel blue
  ['#a7ffeb','#24bfae'], // teal mint
  ['#b9b3ff','#6e64ff'], // violet
  ['#c2d9ff','#5aa7ff'], // sky
  ['#c8f1ff','#44d1ff'], // cyan
  ['#dbe0e8','#6b7280']  // cool gray
];

function spawnBalloon(){
  const b = document.createElement('div');
  b.className = 'balloon';

  const col = balloonColors[Math.floor(Math.random()*balloonColors.length)];
  b.style.background = `linear-gradient(${col[0]}, ${col[1]})`;
  b.style.left = `${rand(2, 96)}%`;
  b.style.animation = `floatUp ${rand(8, 15).toFixed(2)}s linear forwards`;
  b.style.transform = `translateY(${rand(0, 20)}px)`;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = BALLOON_TEXT;
  b.appendChild(label);

  balloonsWrap.appendChild(b);
  setTimeout(() => b.remove(), 16000);
}


function startBalloons(){
  for(let i=0;i<16;i++) setTimeout(spawnBalloon, i*200);
  balloonTimer = setInterval(() => { for(let i=0;i<3;i++) spawnBalloon(); }, 900);
}

function stopBalloons(){
  clearInterval(balloonTimer);
  balloonsWrap.innerHTML = '';
}

// ===== Fireworks =====
let w,h, rafId, runFw=false, spawnTimer=0;
function resize(){
  w = canvas.width = innerWidth * devicePixelRatio;
  h = canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(devicePixelRatio, devicePixelRatio);
}
addEventListener('resize', resize); resize();

const gravity = 0.06;
const friction = 0.985;

class Particle{
  constructor(x,y,color){
    this.x=x; this.y=y;
    const angle = Math.random()*Math.PI*2;
    const speed = Math.random()*3+2.5;
    this.vx=Math.cos(angle)*speed; this.vy=Math.sin(angle)*speed;
    this.alpha=1; this.life=rand(60, 100); this.color=color; this.size=rand(1.5,2.6);
  }
  update(){
    this.vx *= friction; this.vy = this.vy*friction + gravity;
    this.x += this.vx; this.y += this.vy; this.life--; this.alpha -= 0.012;
  }
  draw(){
    ctx.globalAlpha = Math.max(this.alpha,0);
    ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle = this.color; ctx.fill();
  }
}

class Firework{
  constructor(){
    this.x = rand(60, w-60)/devicePixelRatio; this.y = h/devicePixelRatio + 10;
    this.tx = rand(80, w-80)/devicePixelRatio; this.ty = rand(80, h*0.45)/devicePixelRatio;
    this.vx = (this.tx - this.x)/40; this.vy = (this.ty - this.y)/40; this.exploded=false; this.trail = [];
    this.color = `hsl(${Math.floor(rand(180,300))} 90% 60%)`; // cool hues
    this.particles=[];
  }
  update(){
    if(!this.exploded){
      this.trail.push([this.x,this.y]); if(this.trail.length>8) this.trail.shift();
      this.x += this.vx; this.y += this.vy; this.vy += 0.01;
      if(Math.hypot(this.x-this.tx, this.y-this.ty) < 6){
        this.exploded=true; const count = Math.floor(rand(40, 80));
        for(let i=0;i<count;i++) this.particles.push(new Particle(this.x,this.y,this.color));
      }
    } else {
      this.particles.forEach(p=>p.update());
      this.particles = this.particles.filter(p=>p.life>0 && p.alpha>0);
    }
  }
  draw(){
    if(!this.exploded){
      ctx.globalAlpha = 0.6; ctx.strokeStyle=this.color; ctx.lineWidth=2; ctx.beginPath();
      for(let i=0;i<this.trail.length;i++){
        const [tx,ty]=this.trail[i]; if(i===0) ctx.moveTo(tx,ty); else ctx.lineTo(tx,ty);
      }
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,2,0,Math.PI*2); ctx.fill();
    } else {
      this.particles.forEach(p=>p.draw());
    }
  }
  done(){ return this.exploded && this.particles.length===0 }
}

let fireworks=[];
function fwLoop(){
  if(!runFw) return;
  rafId = requestAnimationFrame(fwLoop);
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0,0,innerWidth,innerHeight);
  ctx.globalCompositeOperation='lighter';

  spawnTimer++;
  if(spawnTimer%14===0) fireworks.push(new Firework());

  fireworks.forEach(fw => { fw.update(); fw.draw(); });
  fireworks = fireworks.filter(fw=>!fw.done());
}

function startFireworks(){ runFw=true; fwLoop(); }
function stopFireworks(){ runFw=false; cancelAnimationFrame(rafId); fireworks=[]; ctx.clearRect(0,0,innerWidth,innerHeight); }

// ===== WebAudio: Happy Birthday (synth) =====
let audioCtx=null, master=null;
function noteToFreq(n){
  const A4=440; const map={C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11};
  const m = n.match(/^([A-G](?:#|b)?)(\d)$/); if(!m) return 0; const [_,p,oct]=m; const semi = map[p] + (parseInt(oct)+1)*12; const a4 = 9 + (4+1)*12; const diff = semi - a4; return A4 * Math.pow(2, diff/12);
}

function playNote(time, freq, dur){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(freq, time);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.4, time+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur*0.92);
  o.connect(g).connect(master);
  o.start(time); o.stop(time + dur);
}

function playBirthday(){
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); master = audioCtx.createGain(); master.gain.value = 0.22; master.connect(audioCtx.destination); }
  const bpm = 110; const beat = 60/bpm; let t = audioCtx.currentTime + 0.05;
  const seq = [
    ['G4',1],['G4',1],['A4',2],['G4',2],['C5',2],['B4',4],
    ['G4',1],['G4',1],['A4',2],['G4',2],['D5',2],['C5',4],
    ['G4',1],['G4',1],['G5',2],['E5',2],['C5',2],['B4',2],['A4',3],
    ['F5',1],['F5',1],['E5',2],['C5',2],['D5',2],['C5',4]
  ];
  seq.forEach(([note,len])=>{ const dur = len*beat; const f = noteToFreq(note); playNote(t, f, dur); t += dur; });
}

function stopBirthday(){ if(audioCtx){ try{ master.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+0.2);}catch{} setTimeout(()=>{ try{audioCtx.close();}catch{} audioCtx=null; master=null; }, 400);} }

// ===== Orchestration =====
function startCelebration(){
  body.classList.add('dark');
  startBalloons();
  startFireworks();
  try { playTrack(); } catch(e) {}
}


function stopCelebration(){
  body.classList.remove('dark');
  stopBalloons();
  stopFireworks();
  if (trackEl) { trackEl.pause(); trackEl.currentTime = 0; }
  stopBirthday();
  celebrationStarted = false;
}

// Accessibility: keyboard
candleEls.forEach(c => {
  c.tabIndex = 0; c.setAttribute('role','button'); c.setAttribute('aria-label','Свеча');
  c.addEventListener('keydown', e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); toggleCandle(c,false);} })
});
