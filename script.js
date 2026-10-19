"use strict";
(() => {
  document.documentElement.classList.add("js");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const play = (v) => { if (!calm.matches) { const p = v.play(); if (p) p.catch(() => {}); } };

  /* Фон начала: широкое видео на компьютере, вертикальное на телефоне */
  const hv = document.querySelector(".hero__video");
  if (hv) {
    const tall = matchMedia("(max-width: 860px)").matches;
    hv.poster = tall ? "v/street-m.jpg" : "v/street.jpg";
    if (!calm.matches) { hv.src = tall ? hv.dataset.tall : hv.dataset.wide; hv.preload = "auto"; play(hv); }
  }

  /* Шапка становится плотной, когда начало ушло вверх */
  const bar = document.getElementById("topbar");
  const hero = document.getElementById("top");
  if (bar && hero) {
    new IntersectionObserver(([e]) => bar.classList.toggle("is-solid", !e.isIntersecting), { rootMargin: "-80px 0px 0px" }).observe(hero);
  }

  /* Блоки выезжают при прокрутке (один раз) */
  const shown = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); shown.unobserve(e.target); }
  }, { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => shown.observe(el));

  /* Рецепт: на компьютере экран закреплён, шаги выезжают по очереди; на телефоне просто появляются */
  const recipe = document.getElementById("recipe");
  const slides = [...document.querySelectorAll(".slide")];
  const dots = [...document.querySelectorAll(".dots li")];
  const pinned = matchMedia("(min-width: 861px) and (prefers-reduced-motion: no-preference)");
  let last = -1, ticking = false;
  const setStep = (k) => {
    if (k === last) return;
    last = k;
    slides.forEach((s, i) => {
      s.classList.toggle("is-on", i <= k);
      s.classList.toggle("is-past", i < k);
      s.style.setProperty("--back", Math.max(0, k - i));
    });
    dots.forEach((d, i) => d.classList.toggle("is-on", i === k));
  };
  const onScroll = () => {
    ticking = false;
    if (!pinned.matches || !recipe) return;
    const r = recipe.getBoundingClientRect();
    const total = recipe.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    setStep(Math.min(slides.length - 1, Math.floor(p * slides.length * 1.08)));
  };
  if (slides.length) {
    setStep(0);
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
    slides.forEach((s) => shown.observe(s));
  }

  /* Ролики играют, только пока видны на экране */
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; play(v); }
      else v.pause();
    }
  }, { rootMargin: "120px 0px" });
  document.querySelectorAll("video[data-auto]").forEach((v) => seen.observe(v));
  if (hv) new IntersectionObserver(([e]) => { if (e.isIntersecting) play(hv); else hv.pause(); }).observe(hv);

  /* Лента отзывов: вторая копия для бесшовной прокрутки */
  const qt = document.querySelector(".quotes__track");
  if (qt && !calm.matches) {
    [...qt.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); qt.append(c); });
  }

  /* Меню: вкладки и фото раздела */
  const pic = document.getElementById("menu-pic");
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const vertical = () => getComputedStyle(list).flexDirection === "column";
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      if (!vertical()) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: calm.matches ? "auto" : "smooth" });
      if (pic && tab.dataset.pic && !pic.src.endsWith(tab.dataset.pic)) {
        pic.classList.add("is-swap");
        setTimeout(() => {
          pic.src = tab.dataset.pic;
          pic.onload = () => pic.classList.remove("is-swap");
        }, calm.matches ? 0 : 200);
      }
    };
    tabs.forEach((t, i) => {
      t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1;
      if (t.getAttribute("aria-selected") !== "true") document.getElementById(t.getAttribute("aria-controls")).hidden = true;
      t.addEventListener("click", () => select(t, false));
      t.addEventListener("keydown", (e) => {
        const next = (i + 1) % tabs.length, prev = (i - 1 + tabs.length) % tabs.length;
        const map = { ArrowDown: next, ArrowRight: next, ArrowUp: prev, ArrowLeft: prev, Home: 0, End: tabs.length - 1 };
        if (e.key in map) { e.preventDefault(); select(tabs[map[e.key]], true); }
      });
    });
    const warm = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      warm.disconnect();
      tabs.forEach((t) => { if (t.dataset.pic) new Image().src = t.dataset.pic; });
    }, { rootMargin: "400px 0px" });
    warm.observe(list);
  });

  /* Открыто ли сейчас по времени Ташкента (UTC+5): каждый день 07:00-00:00 */
  const now = document.getElementById("now");
  if (now) {
    const h = new Date(Date.now() + 5 * 3600e3).getUTCHours();
    const open = h >= 7;
    now.querySelector("b").textContent = open ? "Открыто" : "Закрыто";
    now.lastChild.textContent = open ? " до 00:00" : " откроемся в 07:00";
    now.classList.toggle("is-closed", !open);
  }
})();
