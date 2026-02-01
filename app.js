(function () {
  const routes = ["home", "game", "leaderboard", "profile", "rules"];

  function show(route) {
    const r = routes.includes(route) ? route : "home";

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const view = document.getElementById(`view-${r}`);
    if (view) view.classList.add("active");

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const tab = document.querySelector(`.tab[data-route="${r}"]`);
    if (tab) tab.classList.add("active");

    // ✅ 進入 game 時確保輪盤已初始化（只 init 一次）
    if (r === "game" && window.Roulette && typeof window.Roulette.ensureInit === "function") {
      window.Roulette.ensureInit();
    }
  }

  function setRoute(route) {
    location.hash = `#/${route}`;
  }

  function getRouteFromHash() {
    const m = location.hash.match(/^#\/([^/]+)$/);
    return m ? m[1] : "home";
  }

  // tab clicks
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-route]");
    if (!btn) return;
    setRoute(btn.getAttribute("data-route"));
  });

  // home quick enter
  const homeEnterGameBtn = document.getElementById("homeEnterGameBtn");
  if (homeEnterGameBtn) {
    homeEnterGameBtn.addEventListener("click", () => setRoute("game"));
  }

  // simple credits placeholder (之後接 /api/me)
  const creditsText = document.getElementById("creditsText");
  if (creditsText) creditsText.textContent = "（尚未接後端）";

  // hash routing
  window.addEventListener("hashchange", () => show(getRouteFromHash()));

  // initial
  if (!location.hash) location.hash = "#/home";
  show(getRouteFromHash());
})();
