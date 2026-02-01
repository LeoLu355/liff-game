document.addEventListener("DOMContentLoaded", () => {
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
    { name: "🍍 旺來好運", weight: 28, sub: "旺旺來！新的⼀年順順利利。" },
    { name: "🧧 紅包加持", weight: 22, sub: "福氣滿滿，恭喜發財！" },
    { name: "🏮 平安順心", weight: 18, sub: "平安順心，日日是好日。" },
    { name: "🧨 爆竹大吉", weight: 14, sub: "爆竹一響，萬事如意！" },
    { name: "🎯 好彩頭", weight: 10, sub: "有彩頭，做啥都順！" },
    { name: "👑 超級好運", weight: 6, sub: "今天運勢爆棚！" },
  ];

  const n = PRIZES.length;
  const degPer = 360 / n;

  let state = "idle";
  let currentRotation = 0;
  let lastSector = 0;

  function pickWeightedIndex() {
    const total = PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < PRIZES.length; i++) {
      r -= PRIZES[i].weight;
      if (r <= 0) return i;
    }
    return PRIZES.length - 1;
  }

  function drawWheel() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const a0 = (i * Math.PI * 2) / n - Math.PI / 2;
      const a1 = a0 + (Math.PI * 2) / n;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, a0, a1);
      ctx.fillStyle = i % 2 ? "rgba(179,0,0,.35)" : "rgba(0,0,0,.2)";
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + Math.PI / n);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "900 26px system-ui";
      ctx.fillText(PRIZES[i].name, radius - 20, 10);
      ctx.restore();
    }
  }

  drawWheel();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function showResult(idx) {
    resultText.textContent = PRIZES[idx].name;
    resultSub.textContent = PRIZES[idx].sub;
    overlay.classList.add("show");
    envelope.classList.add("open");
    document.body.classList.add("locked");
  }

  function hideOverlay() {
    overlay.classList.remove("show");
    envelope.classList.remove("open");
    document.body.classList.remove("locked");
  }

  function spinOnce() {
    if (state !== "idle") return;
    state = "spinning";

    hideOverlay();

    const idx = pickWeightedIndex();
    const targetDeg = idx * degPer + degPer / 2;
    const start = currentRotation;
    const end = start + 6 * 360 + (360 - targetDeg);

    const duration = 4200;
    const t0 = performance.now();
    lastSector = Math.floor((start % 360) / degPer);

    function raf(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = easeOutCubic(t);
      const rot = start + (end - start) * eased;

      const sector = Math.floor((rot % 360) / degPer);
      if (sector !== lastSector) {
        pointer.classList.remove("tick");
        void pointer.offsetWidth;
        pointer.classList.add("tick");
        lastSector = sector;
      }

      currentRotation = rot;
      canvas.style.transform = `rotate(${rot}deg)`;

      if (t < 1) {
        requestAnimationFrame(raf);
      } else {
        currentRotation %= 360;
        showResult(idx);
        state = "idle";
      }
    }
    requestAnimationFrame(raf);
  }

  spinBtn.addEventListener("click", spinOnce);
  againBtn.addEventListener("click", spinOnce);
  closeBtn.addEventListener("click", hideOverlay);
});
