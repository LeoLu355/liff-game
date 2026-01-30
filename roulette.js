/* ===============================
   New Year Roulette Engine v1.1
   Product-grade Game Module
================================ */

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const againBtn = document.getElementById("againBtn");

const resultEnvelope = document.getElementById("resultEnvelope");
const resultText = document.getElementById("resultText");
const resultSub = document.getElementById("resultSub");

const W = canvas.width;
const H = canvas.height;
const cx = W / 2;
const cy = H / 2;
const radius = 270;

/* ===============================
   State Machine
================================ */
let state = "idle"; 
// idle | spinning | stopping | result

let currentRotation = 0;
let velocity = 0;
let targetAngle = 0;
let targetIndex = 0;

/* ===============================
   Prize Pool
================================ */
const PRIZES = [
  { name:"🍍 旺來好運", weight:28, tier:"common", sub:"旺旺來！新的一年順順利利。" },
  { name:"🧧 紅包加持", weight:22, tier:"common", sub:"福氣滿滿，恭喜發財！" },
  { name:"🏮 平安順心", weight:18, tier:"common", sub:"平安順心，日日是好日。" },
  { name:"🧨 爆竹大吉", weight:14, tier:"rare",   sub:"爆竹一響，萬事如意！" },
  { name:"🎯 好彩頭",   weight:10, tier:"rare",   sub:"有彩頭，做啥都順！" },
  { name:"👑 超級好運", weight:6,  tier:"jackpot",sub:"今天運勢爆棚！" },
];

const n = PRIZES.length;
const slice = (Math.PI * 2) / n;

/* ===============================
   Weighted Random Engine
================================ */
function pickWeightedIndex(){
  const total = PRIZES.reduce((s,p)=>s+p.weight,0);
  let r = Math.random() * total;
  for(let i=0;i<PRIZES.length;i++){
    r -= PRIZES[i].weight;
    if(r <= 0) return i;
  }
  return PRIZES.length - 1;
}

/* ===============================
   Wheel Drawing Engine
================================ */
function tierColor(i){
  const t = PRIZES[i].tier;
  if(t === "jackpot") return i%2===0 ? "rgba(242,195,107,.45)" : "rgba(255,107,107,.30)";
  if(t === "rare")    return i%2===0 ? "rgba(255,204,102,.22)" : "rgba(179,0,0,.28)";
  return i%2===0 ? "rgba(179,0,0,.32)" : "rgba(0,0,0,.15)";
}

function drawWheel(){
  ctx.clearRect(0,0,W,H);

  // background glow
  const grd = ctx.createRadialGradient(cx,cy,20,cx,cy,radius);
  grd.addColorStop(0,"rgba(242,195,107,.25)");
  grd.addColorStop(1,"rgba(0,0,0,.35)");
  ctx.beginPath();
  ctx.arc(cx,cy,radius,0,Math.PI*2);
  ctx.fillStyle = grd;
  ctx.fill();

  for(let i=0;i<n;i++){
    const a0 = i*slice - Math.PI/2;
    const a1 = a0 + slice;

    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,radius,a0,a1);
    ctx.closePath();

    ctx.fillStyle = tierColor(i);
    ctx.fill();

    ctx.strokeStyle = PRIZES[i].tier==="jackpot"
      ? "rgba(242,195,107,.65)"
      : "rgba(255,255,255,.12)";
    ctx.lineWidth = PRIZES[i].tier==="jackpot" ? 5 : 3;
    ctx.stroke();

    // text
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(a0 + slice/2);
    ctx.textAlign="right";
    ctx.fillStyle="rgba(255,255,255,.95)";
    ctx.font = PRIZES[i].tier==="jackpot"
      ? "1000 28px system-ui"
      : "900 26px system-ui";
    ctx.fillText(PRIZES[i].name, radius-20, 10);
    ctx.restore();
  }

  // outer ring
  ctx.beginPath();
  ctx.arc(cx,cy,radius-10,0,Math.PI*2);
  ctx.strokeStyle="rgba(242,195,107,.45)";
  ctx.lineWidth=10;
  ctx.stroke();
}

drawWheel();

/* ===============================
   Physics Engine
================================ */
function deg2rad(d){ return d * Math.PI / 180; }
function rad2deg(r){ return r * 180 / Math.PI; }

/* ===============================
   Tick Pointer
================================ */
const pointer = document.querySelector(".pointer");
function tick(){
  pointer.classList.remove("tick");
  void pointer.offsetWidth;
  pointer.classList.add("tick");
}

/* ===============================
   Spin Logic
================================ */
function startSpin(){
  if(state !== "idle" && state !== "result") return;

  state = "spinning";
  resultEnvelope.style.display="none";

  targetIndex = pickWeightedIndex();

  const degPer = 360 / n;
  const centerDeg = (targetIndex + 0.5) * degPer;

  const extraRounds = 4 + Math.floor(Math.random()*2);
  targetAngle = currentRotation + extraRounds*360 + (360 - centerDeg);

  velocity = 28 + Math.random()*6;   // 初速度
  animateSpin();
}

/* ===============================
   Animation Loop
================================ */
function animateSpin(){
  if(state !== "spinning" && state !== "stopping") return;

  currentRotation += velocity;
  velocity *= 0.985;  // 慣性衰減

  // sector snapping（逐格停靠）
  if(state==="spinning" && velocity < 4){
    state="stopping";
  }

  if(state==="stopping"){
    const diff = targetAngle - currentRotation;
    velocity = diff * 0.12;  // 吸附感
    if(Math.abs(diff) < 0.5){
      currentRotation = targetAngle;
      finishSpin();
      return;
    }
  }

  // tick effect
  const degPer = 360/n;
  if(Math.floor(currentRotation/degPer) !== Math.floor((currentRotation-velocity)/degPer)){
    tick();
  }

  canvas.style.transform = `rotate(${currentRotation}deg)`;

  requestAnimationFrame(animateSpin);
}

/* ===============================
   Finish
================================ */
function finishSpin(){
  state="result";

  const prize = PRIZES[targetIndex];

  // envelope animation
  resultText.innerText = prize.name;
  resultSub.innerText = prize.sub;
  resultEnvelope.style.display="block";

  // confetti
  launchConfetti(prize.tier);

  currentRotation = currentRotation % 360;
}

/* ===============================
   Confetti
================================ */
function launchConfetti(tier){
  const count = tier==="jackpot" ? 140 : tier==="rare" ? 80 : 40;

  for(let i=0;i<count;i++){
    const c = document.createElement("div");
    c.style.position="fixed";
    c.style.left=Math.random()*100+"vw";
    c.style.top="-10px";
    c.style.width="8px";
    c.style.height="14px";
    c.style.background=["#f6d17b","#e7b84f","#fff","#ff6b6b"][Math.floor(Math.random()*4)];
    c.style.opacity=0.9;
    c.style.zIndex=9999;
    c.style.borderRadius="2px";
    document.body.appendChild(c);

    const dx=(Math.random()*2-1)*200;
    const dur=1200+Math.random()*1500;

    c.animate([
      {transform:`translate(0,0) rotate(0deg)`},
      {transform:`translate(${dx}px,110vh) rotate(${360+Math.random()*360}deg)`}
    ],{duration:dur,easing:"linear",fill:"forwards"});

    setTimeout(()=>c.remove(),dur);
  }
}

/* ===============================
   Controls
================================ */
spinBtn.addEventListener("click", startSpin);
againBtn.addEventListener("click", ()=>{
  if(state==="result"){
    state="idle";
    resultEnvelope.style.display="none";
    startSpin();
  }
});
