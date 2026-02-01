document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("wheelCanvas");
  const ctx = canvas.getContext("2d");

  const spinBtn = document.getElementById("spinBtn");
  const pointer = document.querySelector(".pointer");

  const overlay = document.getElementById("resultOverlay");
  const envelope = document.getElementById("resultEnvelope");
  const resultText = document.getElementById("resultText");
  const resultSub = document.getElementById("resultSub");
  const againBtn = document.getElementById("againBtn");
  const closeBtn = document.getElementById("closeBtn");

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

  // ✅ 等字體載好（iPhone/Chrome canvas 字寬一致）
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
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

  drawWheel();

  function tick() {
    if (!pointer) return;
    pointer.classList.remove("tick");
    void pointer.offsetWidth;
    pointer.classList.add("tick");
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spinOnce() {
    if (state !== "idle") return;
    state = "spinning";

    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    envelope.classList.remove("open");

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
      showResult(idx);
      state = "idle";
    }

    requestAnimationFrame(raf);
  }

  function showResult(idx) {
    const prize = PRIZES[idx];
    resultText.textContent = prize.name;
    resultSub.textContent = prize.sub;

    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      envelope.classList.add("open");
    });
  }

  // 事件
  spinBtn.addEventListener("click", spinOnce);

  againBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.classList.remove("show");
    envelope.classList.remove("open");
    requestAnimationFrame(() => spinOnce());
  });

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.classList.remove("show");
    envelope.classList.remove("open");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("show");
      envelope.classList.remove("open");
    }
  });
});
