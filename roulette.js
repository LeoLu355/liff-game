document.addEventListener("DOMContentLoaded", async () => {
  // ---------------- Tabs ----------------
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const views = Array.from(document.querySelectorAll(".view"));

  function switchTab(id, el) {
    views.forEach(v => v.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    tabs.forEach(t => t.classList.remove("active"));
    el.classList.add("active");
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => switchTab(t.dataset.tab, t));
  });

  document.getElementById("goRules")?.addEventListener("click", () => {
    switchTab("rules", tabs[4]);
  });

  // ---------------- Local record (pure frontend) ----------------
  const LS_KEY = "tw_ny_roulette_records_v1";
  function loadRec(){ try{ return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }catch{ return {}; } }
  function saveRec(obj){ localStorage.setItem(LS_KEY, JSON.stringify(obj)); }

  function bumpRec(lastText){
    const r = loadRec();
    r.rouletteCnt = r.rouletteCnt || 0;
    r.rouletteCnt += 1;
    if(lastText) r.last = lastText;
    saveRec(r);
    renderRec();
  }
  function renderRec(){
    const r = loadRec();
    document.getElementById("myRouletteCnt").textContent = (r.rouletteCnt || 0) + " 次";
    document.getElementById("myLast").textContent = r.last || "—";
  }
  renderRec();

  // ---------------- Confetti / Fireworks ----------------
  const confetti = document.getElementById("confetti");
  function burstConfetti(count, style="normal"){
    confetti.innerHTML = "";
    const colors = style === "firework"
      ? ["#f6d17b","#e7b84f","#ffffff","#ff6b6b","rgba(255,255,255,.75)"]
      : ["#f6d17b","#e7b84f","#ffffff","rgba(255,255,255,.75)"];

    for(let i=0;i<count;i++){
      const el = document.createElement("i");
      el.style.left = (Math.random()*100) + "vw";
      el.style.top = (-10 - Math.random()*20) + "px";
      el.style.width = (6 + Math.random()*10) + "px";
      el.style.height = (10 + Math.random()*18) + "px";
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.borderRadius = (Math.random() > 0.6) ? "999px" : "2px";
      el.style.opacity = 0.85 + Math.random()*0.15;

      const dur = 1200 + Math.random()*1600;
      const dx = (Math.random()*2-1)*160;
      const rot = 360 + Math.random()*540;

      confetti.appendChild(el);
      el.animate(
        [
          { transform: `translateY(0) translateX(0) rotate(0deg)` },
          { transform: `translateY(110vh) translateX(${dx}px) rotate(${rot}deg)` }
        ],
        { duration: dur, fill: "forwards", easing: "linear" }
      );
    }
    setTimeout(()=>{ confetti.innerHTML=""; }, 2600);
  }

  // ---------------- Roulette Overlay (open/close) ----------------
  const rouletteOverlay = document.getElementById("rouletteOverlay");
  const backBtn = document.getElementById("backBtn");

  function openRoulette(){
    rouletteOverlay.classList.add("show");
    rouletteOverlay.setAttribute("aria-hidden", "false");
    // 每次打開都確保輪盤已畫好（避免 iOS 切頁/縮放後 canvas 模糊或字寬跑掉）
    ensureWheelReady();
  }
  function closeRoulette(){
    rouletteOverlay.classList.remove("show");
    rouletteOverlay.setAttribute("aria-hidden", "true");
  }

  window.openRoulette = openRoulette;
  window.closeRoulette = closeRoulette;

  document.getElementById("goRoulette1")?.addEventListener("click", openRoulette);
  document.getElementById("goRoulette2")?.addEventListener("click", openRoulette);
  backBtn?.addEventListener("click", closeRoulette);

  // ---------------- Result Envelope Overlay ----------------
  const overlay = document.getElementById("resultOverlay");
  const envelope = document.getElementById("resultEnvelope");
  const resultText = document.getElementById("resultText");
  const resultSub = document.getElementById("resultSub");
  const againBtn = document.getElementById("againBtn");
  const closeBtn = document.getElementById("closeBtn");

  function showResult(prize){
    resultText.textContent = prize.name;
    resultSub.textContent = prize.sub;

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      envelope.classList.add("open");
    });
  }

  function hideResult(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    envelope.classList.remove("open");
  }

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideResult();
  });

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hideResult();
  });

  // ---------------- New Roulette (canvas + pointer tick + easing) ----------------
  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");

  const spinBtn = document.getElementById("spinBtn");
  const spinBtn2 = document.getElementById("spinBtn2");
  const pointer = document.querySelector(".pointer");

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 270;

  const PRIZES = [
    { name: "🍍 旺來好運", weight: 28, sub: "旺旺來！新的一年順順利利。" },
    { name: "🧧 紅包加持", weight: 22, sub: "福氣滿滿，恭喜發財！" },
    { name: "🏮 平安順心", weight: 18, sub: "平安順心，日日是好日。" },
    { name: "🧨 爆竹大吉", weight: 14, sub: "爆竹一響，萬事如意！" },
    { name: "🎯 好彩頭",   weight: 10, sub: "有彩頭，做啥都順！" },
    { name: "👑 超級好運", weight: 6,  sub: "今天運勢爆棚！" },
  ];

  const n = PRIZES.length;
  const slice = (Math.PI * 2) / n;

  let state = "idle";
  let currentRotation = 0;
  let lastSector = 0;
  let wheelReady = false;

  async function ensureWheelReady(){
    if (wheelReady) return;

    // ✅ 等字體載好（iPhone/Chrome canvas 字寬一致）
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch {}
    }
    drawWheel();
    wheelReady = true;
  }

  function pickWeightedIndex() {
    const total = PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < PRIZES.length; i++) {
      r -= PRIZES[i].weight;
      if (r <= 0) return i;
    }
    return PRIZES.length - 1;
  }

  function tierColor(i) {
    if (i === n - 1) return "rgba(242,195,107,.60)";
    if (i >= n - 3) return i % 2 ? "rgba(255,204,102,.28)" : "rgba(179,0,0,.32)";
    return i % 2 ? "rgba(0,0,0,.16)" : "rgba(179,0,0,.34)";
  }

  function drawWheel() {
    ctx.clearRect(0, 0, W, H);

    const grd = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
    grd.addColorStop(0, "rgba(242,195,107,.22)");
    grd.addColorStop(1, "rgba(0,0,0,.30)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    for (let i = 0; i < n; i++) {
      const a0 = i * slice - Math.PI / 2;
      const a1 = a0 + slice;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, a0, a1);
      ctx.closePath();
      ctx.fillStyle = tierColor(i);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,.14)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.font = (i === n - 1)
        ? '900 28px "Noto Sans TC", system-ui, sans-serif'
        : '900 26px "Noto Sans TC", system-ui, sans-serif';
      ctx.fillText(PRIZES[i].name, radius - 20, 10);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(242,195,107,.45)";
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  function tick() {
    if (!pointer) return;
    pointer.classList.remove("tick");
    void pointer.offsetWidth;
    pointer.classList.add("tick");
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  async function spinOnce() {
    if (state !== "idle") return;
    await ensureWheelReady();

    state = "spinning";
    hideResult(); // 先收掉結果層

    const idx = pickWeightedIndex();

    const degPer = 360 / n;
    const centerDeg = (idx + 0.5) * degPer;

    const extraRounds = 5 + Math.floor(Math.random() * 2);
    const start = currentRotation;
    const end = start + extraRounds * 360 + (360 - centerDeg);

    const duration = 4200;
    const t0 = performance.now();

    lastSector = Math.floor(start / degPer);

    function raf(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = easeOutCubic(t);
      const rot = start + (end - start) * eased;

      const sector = Math.floor(rot / degPer);
      if (sector !== lastSector) {
        tick();
        lastSector = sector;
      }

      currentRotation = rot;
      canvas.style.transform = `rotate(${currentRotation}deg)`;

      if (t < 1) {
        requestAnimationFrame(raf);
        return;
      }

      currentRotation = currentRotation % 360;

      // 喜氣特效（你原本 confetti 保留）
      const prize = PRIZES[idx];
      const isBig = prize.weight <= 10;
      if (isBig) burstConfetti(70, "firework");
      else burstConfetti(32, "normal");

      bumpRec("輪盤：" + prize.name);
      showResult(prize);

      state = "idle";
    }

    requestAnimationFrame(raf);
  }

  spinBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    spinOnce();
  });
  spinBtn2?.addEventListener("click", (e) => {
    e.preventDefault();
    spinOnce();
  });

  againBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideResult();
    requestAnimationFrame(() => spinOnce());
  });

  // escape to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideResult();
      closeRoulette();
    }
  });

  // 若一進來就已經在 overlay 打開狀態（例如某些 SPA 恢復），保險畫一次
  if (rouletteOverlay.classList.contains("show")) {
    ensureWheelReady();
  }
});
