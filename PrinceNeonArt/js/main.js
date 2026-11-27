(function () {
  // ---------- Intro: name animates in, stays ~0.5s, then slides away ----------
  var intro = document.getElementById("intro");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NAME_IN_MS = 650;    // time for letters to rise and light up
  var HOLD_MS = 500;       // how long the full name stays on screen
  setTimeout(function () {
    intro.classList.add("done");
    document.body.classList.remove("intro-active");
    setTimeout(function () { intro.classList.add("gone"); }, 700);
  }, reduce ? 300 : NAME_IN_MS + HOLD_MS);

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Nav ----------
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menu-btn");
  var links = document.getElementById("nav-links");
  window.addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
  menuBtn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); }
  });

  // ---------- Gallery ----------
  var photos = window.GALLERY || [];
  var grid = document.getElementById("gallery-grid");
  var figs = photos.map(function (p, i) {
    var fig = document.createElement("figure");
    fig.dataset.cat = p.cat || "";
    var img = document.createElement("img");
    img.src = p.src.replace("images/gallery/", "images/gallery/thumbs/");
    img.onerror = function () { img.onerror = null; img.src = p.src; };
    img.alt = p.alt || "Prince Neon Art sign";
    img.loading = "lazy";
    var cap = document.createElement("figcaption");
    cap.textContent = img.alt;
    fig.appendChild(img); fig.appendChild(cap);
    fig.addEventListener("click", function () { openBox(i); });
    grid.appendChild(fig);
    return fig;
  });

  var current = "all";
  document.getElementById("filters").addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === btn); });
    current = btn.dataset.filter;
    figs.forEach(function (f) {
      var show = current === "all" || f.dataset.cat === current;
      f.classList.toggle("hide", !show);
      if (show) { f.style.animation = "none"; void f.offsetWidth; f.style.animation = ""; }
    });
  });

  // ---------- Lightbox ----------
  var box = document.getElementById("lightbox");
  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector("figcaption");
  var idx = 0;
  function visible() {
    return photos.map(function (_, i) { return i; }).filter(function (i) { return !figs[i].classList.contains("hide"); });
  }
  function show(i) {
    idx = i;
    boxImg.src = photos[i].src;
    boxImg.alt = photos[i].alt;
    boxCap.textContent = photos[i].alt;
  }
  function openBox(i) { show(i); box.hidden = false; document.body.style.overflow = "hidden"; }
  function closeBox() { box.hidden = true; document.body.style.overflow = ""; }
  function step(d) {
    var v = visible(); var pos = v.indexOf(idx);
    show(v[(pos + d + v.length) % v.length]);
  }
  box.querySelector(".lb-close").addEventListener("click", closeBox);
  box.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
  box.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
  box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeBox();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  var tx = null;
  box.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    tx = null;
  });

  // ---------- Reveal on scroll ----------
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in"); });
  }
})();
