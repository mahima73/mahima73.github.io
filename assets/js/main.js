/* ===================================================================
   Interactions & UI logic
   =================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  const preloader = $("#preloader");
  const bar = $(".preloader-bar span");
  let prog = 0;
  const tick = setInterval(() => {
    prog = Math.min(100, prog + Math.random() * 18);
    if (bar) bar.style.width = prog + "%";
    if (prog >= 100) clearInterval(tick);
  }, 120);

  window.addEventListener("load", () => {
    prog = 100;
    if (bar) bar.style.width = "100%";
    setTimeout(() => preloader && preloader.classList.add("hidden"), 500);
  });
  // safety: never trap the user behind the loader
  setTimeout(() => preloader && preloader.classList.add("hidden"), 3500);

  /* ---------- Year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Custom cursor ---------- */
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (dot && ring && window.matchMedia("(min-width: 901px)").matches) {
    let rx = 0, ry = 0, dx = 0, dy = 0;
    window.addEventListener("mousemove", (e) => {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    });
    (function follow() {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    })();
    const hoverSel = 'a, button, [data-cursor="hover"], .stat, .skill-card, .project-card, .timeline-content';
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverSel)) ring.classList.add("grow");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverSel)) ring.classList.remove("grow");
    });
  }

  /* ---------- Header + scroll progress + active nav ---------- */
  const header = $("#header");
  const progressBar = $("#scrollProgress");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav-link");

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);

    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";

    let current = "home";
    sections.forEach((sec) => {
      if (y >= sec.offsetTop - window.innerHeight * 0.35) current = sec.id;
    });
    navLinks.forEach((l) =>
      l.classList.toggle("active", l.getAttribute("href") === "#" + current)
    );
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const toggle = $("#navToggle");
  const navList = $("#navList");
  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const open = navList.classList.toggle("open");
      toggle.innerHTML = open ? '<i class="bx bx-x"></i>' : '<i class="bx bx-menu"></i>';
    });
    navList.addEventListener("click", (e) => {
      if (e.target.closest(".nav-link")) {
        navList.classList.remove("open");
        toggle.innerHTML = '<i class="bx bx-menu"></i>';
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.style.transitionDelay =
              (en.target.dataset.delay || (revealDelay(en.target))) + "ms";
            en.target.classList.add("visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }
  // stagger siblings inside a grid
  function revealDelay(el) {
    const parent = el.parentElement;
    if (!parent) return 0;
    const sibs = Array.from(parent.children).filter((c) => c.classList.contains("reveal"));
    const i = sibs.indexOf(el);
    return i > 0 ? Math.min(i, 5) * 80 : 0;
  }

  /* ---------- Role typing effect ---------- */
  const roleEl = $("#roleText");
  if (roleEl && !reduce) {
    const roles = ["Software Developer", "Singer 🎤", "AI Video Creator", "Spring Boot Engineer", "Storyteller"];
    let ri = 0, ci = 0, deleting = false;
    function type() {
      const word = roles[ri];
      roleEl.textContent = word.substring(0, ci);
      if (!deleting && ci < word.length) {
        ci++;
        setTimeout(type, 90);
      } else if (!deleting && ci === word.length) {
        deleting = true;
        setTimeout(type, 1600);
      } else if (deleting && ci > 0) {
        ci--;
        setTimeout(type, 45);
      } else {
        deleting = false;
        ri = (ri + 1) % roles.length;
        setTimeout(type, 300);
      }
    }
    type();
  }

  /* ---------- Count-up stats ---------- */
  const stats = $$(".stat-num");
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          const goal = parseInt(el.dataset.count, 10) || 0;
          let n = 0;
          const step = Math.max(1, Math.ceil(goal / 40));
          const run = () => {
            n = Math.min(goal, n + step);
            el.textContent = n;
            if (n < goal) requestAnimationFrame(run);
          };
          run();
          so.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach((s) => so.observe(s));
  } else {
    stats.forEach((s) => (s.textContent = s.dataset.count));
  }

  /* ---------- Hero card 3D tilt ---------- */
  const card = $("#heroCard");
  if (card && window.matchMedia("(min-width: 861px)").matches && !reduce) {
    const visual = card.parentElement;
    visual.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 16}deg) translateZ(10px)`;
    });
    visual.addEventListener("mouseleave", () => {
      card.style.transform = "rotateY(0) rotateX(0)";
    });
  }

  /* ---------- Music player (real audio) ---------- */
  const playBtn = $("#playerPlay");
  const art = $("#playerArt");
  const viz = $("#playerViz");
  const audio = $("#playerAudio");
  const fill = $("#playerProgressFill");
  const progress = $("#playerProgress");
  const curEl = $("#playerCurrent");
  const durEl = $("#playerDuration");
  const restartBtn = $("#playerRestart");
  const muteBtn = $("#playerMute");

  if (viz) {
    for (let i = 0; i < 28; i++) viz.appendChild(document.createElement("span"));
    $$("span", viz).forEach((s) => {
      s.style.animationDelay = -(Math.random() * 0.8).toFixed(2) + "s";
      s.style.animationDuration = (0.5 + Math.random() * 0.6).toFixed(2) + "s";
    });
  }

  const fmt = (t) => {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  };

  if (playBtn && audio) {
    const setPlaying = (on) => {
      playBtn.innerHTML = on ? '<i class="bx bx-pause"></i>' : '<i class="bx bx-play"></i>';
      if (art) art.classList.toggle("spinning", on);
      if (viz) viz.classList.toggle("active", on);
    };

    playBtn.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("ended", () => setPlaying(false));

    audio.addEventListener("loadedmetadata", () => {
      if (durEl) durEl.textContent = fmt(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      if (fill) fill.style.width = pct + "%";
      if (curEl) curEl.textContent = fmt(audio.currentTime);
    });

    if (progress) {
      progress.addEventListener("click", (e) => {
        const r = progress.getBoundingClientRect();
        if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
      });
    }
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        muteBtn.innerHTML = audio.muted
          ? '<i class="bx bx-volume-mute"></i>'
          : '<i class="bx bx-volume-full"></i>';
      });
    }
  }

  /* ---------- Contact form (mailto handoff) ---------- */
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cName").value.trim();
      const email = $("#cEmail").value.trim();
      const msg = $("#cMsg").value.trim();
      if (!name || !email || !msg) return;
      const subject = encodeURIComponent(`Portfolio message from ${name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:mahimatolani1998@gmail.com?subject=${subject}&body=${body}`;

      let note = $(".form-msg", form);
      if (!note) {
        note = document.createElement("p");
        note.className = "form-msg";
        form.appendChild(note);
      }
      note.textContent = "Opening your email app… thank you! ✨";
      form.reset();
    });
  }

  /* ---------- Smooth anchor scrolling with header offset ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
