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

  /* Блоки выезжают при прокрутке (один раз); фото .pop вылетают после текста */
  const shown = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); shown.unobserve(e.target); }
  }, { rootMargin: "0px 0px -12% 0px" });
  document.querySelectorAll(".reveal, .pop").forEach((el) => shown.observe(el));

  /* Листалки вбок (шаги рецепта, отзывы): свайп пальцем или стрелки */
  document.querySelectorAll(".rail").forEach((rail) => {
    const box = rail.closest("section");
    const btns = [...box.querySelectorAll(".arrow")];
    const count = box.querySelector(".count b");
    const items = [...rail.children];
    const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : rail.clientWidth);
    btns.forEach((b) => b.addEventListener("click", () => rail.scrollBy({ left: step() * Number(b.dataset.dir), behavior: calm.matches ? "auto" : "smooth" })));
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      if (btns[0]) btns[0].disabled = rail.scrollLeft <= 2;
      if (btns[1]) btns[1].disabled = rail.scrollLeft >= max;
      const i = rail.scrollLeft >= max ? items.length - 1 : Math.min(items.length - 1, Math.round(rail.scrollLeft / step()));
      items.forEach((it, k) => it.classList.toggle("is-active", k === i));
      if (count) count.textContent = i + 1;
    };
    let t = 0;
    rail.addEventListener("scroll", () => { cancelAnimationFrame(t); t = requestAnimationFrame(update); }, { passive: true });
    rail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: step() * (e.key === "ArrowRight" ? 1 : -1), behavior: calm.matches ? "auto" : "smooth" }); }
    });
    addEventListener("resize", update);
    update();
  });

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
