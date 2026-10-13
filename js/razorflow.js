/* ============================================================
   RazorFlow v1 — razorflow.js
   Super-smooth motion core. No build step. GSAP + Lenis via CDN.
   Usage: <script src="js/razorflow.js" data-razorflow></script>
   Then add data-attributes in HTML (see index.html demo).
   ============================================================ */
(function () {
  const RF = {
    name: "RazorFlow",
    version: "1.0.0",
    feel: "super-smooth",
  };
  window.RazorFlow = RF;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.documentElement.classList.remove("rf-nojs");

  /* ---------- 1. Super-smooth Lenis ---------- */
  function initLenis() {
    if (prefersReduced || typeof Lenis === "undefined") return null;
    const lenis = new Lenis({
      lerp: 0.075,          // super-smooth: lower = silkier
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
    });
    RF.lenis = lenis;
    if (typeof gsap !== "undefined") {
      if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    return lenis;
  }

  /* ---------- 2. Preloader ---------- */
  function initPreloader() {
    const pre = document.querySelector("[data-rf-preloader]");
    if (!pre) return;
    const bar = pre.querySelector("[data-rf-preloader-bar]");
    const done = () => pre.classList.add("is-done");
    if (typeof gsap !== "undefined" && !prefersReduced) {
      gsap.to(bar, { scaleX: 1, duration: 1.4, ease: "expo.inOut" });
      gsap.delayedCall(1.5, done);
      gsap.delayedCall(2.8, () => pre.remove());
    } else {
      setTimeout(done, 600);
      setTimeout(() => pre.remove(), 1400);
    }
    // Safety: never trap user behind preloader
    setTimeout(() => { if (document.body.contains(pre)) { pre.classList.add("is-done"); setTimeout(() => pre.remove(), 1200); } }, 4000);
  }

  /* ---------- 3. Split headings into chars/lines ---------- */
  function splitToChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const line = document.createElement("span");
    line.className = "rf-line";
    line.setAttribute("aria-hidden", "true");
    [...text].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "rf-char";
      c.textContent = ch === " " ? "\u00A0" : ch;
      line.appendChild(c);
    });
    el.appendChild(line);
    el.classList.add("is-ready");
    return line.querySelectorAll(".rf-char");
  }

  function initHeroIntro() {
    const heroes = document.querySelectorAll('[data-split="heading"]');
    heroes.forEach((h) => {
      const chars = splitToChars(h);
      if (typeof gsap === "undefined" || prefersReduced) return;
      gsap.to(chars, {
        y: "0%", rotate: 0, duration: 1.6, ease: "expo.out",
        stagger: 0.025, delay: 1.55, // after preloader
        onStart: () => h.classList.add("is-ready"),
      });
    });
    // hero image + kickers drift in super-slow
    if (typeof gsap !== "undefined" && !prefersReduced) {
      gsap.fromTo("[data-rf-hero-media]", { yPercent: 8, scale: 1.06, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 1.8, ease: "expo.out", delay: 1.7 });
      gsap.fromTo("[data-rf-hero-kicker] li", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 1.9 });
    }
  }

  /* ---------- 4. Char-roll buttons ---------- */
  function initCharRoll(scope) {
    const root = scope || document;
    root.querySelectorAll("[data-button-animate-chars]").forEach((btn) => {
      if (btn.dataset.rfSplit === "1") return;
      btn.dataset.rfSplit = "1";
      const text = btn.textContent;
      btn.innerHTML = "";
      [...text].forEach((ch, i) => {
        const s = document.createElement("span");
        s.textContent = ch;
        s.style.transitionDelay = `${i * 0.012}s`; // super-smooth ripple
        if (ch === " ") s.style.whiteSpace = "pre";
        btn.appendChild(s);
      });
    });
  }

  /* ---------- 5. Scroll reveals ---------- */
  function initScrollReveals() {
    const els = document.querySelectorAll('[data-animate="typo"]');
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined" || prefersReduced) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    els.forEach((el) => {
      gsap.fromTo(el, { y: 32, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: () => el.classList.add("is-in"),
      });
    });
  }

  /* ---------- 6. Parallax ---------- */
  function initParallax() {
    const triggers = document.querySelectorAll('[data-parallax="trigger"]');
    if (!triggers.length) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined" || prefersReduced) return;
    triggers.forEach((trigger) => {
      const img = trigger.querySelector("img") || trigger;
      const start = parseFloat(trigger.getAttribute("data-parallax-start") ?? "12");
      const end = parseFloat(trigger.getAttribute("data-parallax-end") ?? "-12");
      const scrub = parseFloat(trigger.getAttribute("data-parallax-scrub") ?? "1") || true;
      gsap.fromTo(img, { yPercent: start }, {
        yPercent: end, ease: "none",
        scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub },
      });
    });
  }

  /* ---------- 7. Expertise / card hover ---------- */
  function initCardHover() {
    if (!finePointer || typeof gsap === "undefined" || prefersReduced) {
      document.querySelectorAll(".rf-card li").forEach((li) => { li.style.opacity = "1"; li.style.transform = "none"; });
      return;
    }
    document.querySelectorAll("[data-rf-card]").forEach((item) => {
      const overlay = item.querySelector("[data-rf-card-overlay]");
      const heading = item.querySelector("h3");
      const listItems = item.querySelectorAll("li");
      gsap.set(overlay, { scaleX: 0, scaleY: 0, transformOrigin: "top right" });
      gsap.set(listItems, { y: "1em", opacity: 0 });
      const tl = gsap.timeline({ paused: true })
        .to(overlay, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "expo.inOut" }, 0)
        .to(heading, { color: "#f4f1ea", duration: 0.6, ease: "expo.out" }, 0.1)
        .to(listItems, { y: "0em", opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.07 }, 0.25);
      item.addEventListener("mouseenter", () => tl.timeScale(1).play());
      item.addEventListener("mouseleave", () => tl.timeScale(1.6).reverse());
      item.addEventListener("focusin", () => tl.timeScale(1).play());
      item.addEventListener("focusout", () => tl.timeScale(1.6).reverse());
    });
  }

  /* ---------- 8. Fullscreen nav ---------- */
  function initNav() {
    const nav = document.querySelector("[data-navigation-status]");
    if (!nav) return;
    initCharRoll(nav);
    nav.querySelectorAll('[data-navigation-toggle="toggle"]').forEach((b) =>
      b.addEventListener("click", () => {
        const open = nav.getAttribute("data-navigation-status") !== "active";
        nav.setAttribute("data-navigation-status", open ? "active" : "not-active");
        if (RF.lenis) open ? RF.lenis.stop() : RF.lenis.start();
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        nav.setAttribute("data-navigation-status", "not-active");
        if (RF.lenis) RF.lenis.start();
      }
    });
  }

  /* ---------- 9. Cursor bubble ---------- */
  function initCursor() {
    const cursor = document.querySelector("[data-cursor]");
    const label = document.querySelector("[data-cursor-text-target]");
    if (!cursor || !finePointer || typeof gsap === "undefined" || prefersReduced) return;
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3.out" });
    let mx = 0, my = 0, moved = false;
    const update = () => {
      const hover = document.elementFromPoint(mx, my)?.closest("[data-cursor-hover]");
      const rect = cursor.getBoundingClientRect();
      const edge = rect.right >= window.innerWidth - 8;
      cursor.setAttribute("data-cursor", hover ? (edge ? "active-edge" : "active") : "");
      if (hover && label) label.textContent = hover.getAttribute("data-cursor-text") || "View";
    };
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; moved = true; xTo(mx); yTo(my); requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("scroll", () => { if (moved) requestAnimationFrame(update); }, { passive: true });
  }

  /* ---------- 10. Fit width ---------- */
  function initFitWidth() {
    const els = [...document.querySelectorAll("[data-fit-width]")];
    if (!els.length) return;
    const fit = (el) => {
      const parent = el.parentElement;
      if (!parent) return;
      el.style.whiteSpace = "nowrap";
      let size = parseFloat(getComputedStyle(el).fontSize) || 16;
      for (let i = 0; i < 6; i++) {
        const w = el.getBoundingClientRect().width;
        if (!w) break;
        const avail = parent.clientWidth;
        const ratio = avail / w;
        if (Math.abs(ratio - 1) < 0.003) break;
        size *= ratio;
        el.style.fontSize = size + "px";
      }
    };
    const refit = () => els.forEach(fit);
    let raf = null;
    const schedule = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = null; refit(); }); };
    window.addEventListener("resize", schedule);
    refit();
    if (document.fonts?.ready) document.fonts.ready.then(refit);
  }

  function initYear() {
    const y = new Date().getFullYear();
    document.querySelectorAll("[data-current-year]").forEach((el) => (el.textContent = y));
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    try {
      initLenis();
      initPreloader();
      initCharRoll(document);
      initHeroIntro();
      initScrollReveals();
      initParallax();
      initCardHover();
      initNav();
      initCursor();
      initFitWidth();
      initYear();
      RF.ready = true;
      console.info("%cRazorFlow v1 — super-smooth ready", "color:#1d5c46;font-weight:bold");
    } catch (err) {
      console.error("[RazorFlow] boot failed:", err);
    }
  });
})();
