"use strict";
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* Начало: круг с чашкой растёт по прокрутке, пока не закроет шляпы */
  const intro = document.querySelector(".intro");
  const media = intro && intro.querySelector(".intro__media");
  const cup = intro && intro.querySelector(".intro__cup");
  const head = document.querySelector(".top");
  let geo = null;

  function measure() {
    if (!media) return;
    const w = media.clientWidth, h = media.clientHeight;
    const cy = parseFloat(getComputedStyle(media).getPropertyValue("--cy")) / 100 * h;
    const cx = w / 2;
    const r0 = Math.min(w, h) * (w < 500 ? 0.34 : 0.26);
    const rMax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2;
    geo = { r0, rMax, span: intro.offsetHeight - innerHeight };
  }

  let ticking = false;
  function frame() {
    ticking = false;
    if (intro && geo) {
      const top = intro.getBoundingClientRect().top;
      const p = calm.matches ? 0 : clamp(-top / Math.max(1, geo.span), 0, 1);
      const g = ease(clamp((p - 0.08) / 0.62, 0, 1));
      intro.style.setProperty("--p", p.toFixed(4));
      intro.style.setProperty("--g", g.toFixed(4));
      cup.style.setProperty("--r", (geo.r0 + (geo.rMax - geo.r0) * g).toFixed(1) + "px");
      intro.classList.toggle("is-late", p > 0.42);
    }
    if (head && intro) head.classList.toggle("is-solid", intro.getBoundingClientRect().bottom <= head.offsetHeight + 1);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  measure(); frame();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { measure(); onScroll(); });

  /* Видео играют, только пока видны на экране */
  const play = (v) => { if (!calm.matches) { const pr = v.play(); if (pr) pr.catch(() => {}); } };
  const vids = document.querySelectorAll("video[data-auto], .intro__video");
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; play(v); }
      else v.pause();
    }
  }, { rootMargin: "120px 0px" });
  vids.forEach((v) => seen.observe(v));

  /* Рецепт: какой шаг на середине экрана, тот кусок ролика и играет */
  const rv = document.querySelector(".recipe__video");
  const steps = [...document.querySelectorAll(".step")];
  let cur = steps[0];
  function setStep(s) {
    if (!rv || s === cur && !rv.paused) return;
    cur = s;
    steps.forEach((x) => x.classList.toggle("is-on", x === s));
    const t = parseFloat(s.dataset.t);
    if (rv.readyState >= 1) rv.currentTime = calm.matches ? t + 0.6 : t;
    else rv.addEventListener("loadedmetadata", () => { rv.currentTime = t; }, { once: true });
    play(rv);
  }
  if (rv && steps.length) {
    const stepIo = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setStep(e.target);
    }, { rootMargin: matchMedia("(max-width: 860px)").matches ? "-76% 0px -22% 0px" : "-48% 0px -48% 0px" });
    steps.forEach((s) => stepIo.observe(s));
    rv.addEventListener("timeupdate", () => {
      if (cur && rv.currentTime >= parseFloat(cur.dataset.end)) rv.currentTime = parseFloat(cur.dataset.t);
    });
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { rv.preload = "auto"; play(rv); } else rv.pause();
      }
    }).observe(rv);
  }

  /* Вкладки меню */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  if (tabs.length) {
    select(tabs[0], false);
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t, false));
      t.addEventListener("keydown", (e) => {
        const k = e.key;
        let j = null;
        if (k === "ArrowRight") j = (i + 1) % tabs.length;
        else if (k === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (k === "Home") j = 0;
        else if (k === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
  }

  /* Открыто ли сейчас (по времени Ташкента, UTC+5): каждый день 07:00-00:00 */
  const now = document.getElementById("now");
  if (now) {
    const d = new Date(Date.now() + 5 * 3600e3);
    const m = d.getUTCHours() * 60 + d.getUTCMinutes();
    const open = m >= 7 * 60;
    now.textContent = open ? "Сейчас открыто, до 00:00" : "Сейчас закрыто, откроемся в 07:00";
    now.classList.toggle("is-closed", !open);
    now.hidden = false;
  }
})();
