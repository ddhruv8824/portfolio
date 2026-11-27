(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Intro: letters rise (~620ms), the full name holds 0.5s, then the screen lifts ----------
  var intro = document.getElementById("intro");
  var NAME_IN_MS = 620;
  var HOLD_MS = 500;
  document.body.style.overflow = "hidden";
  setTimeout(function () {
    intro.classList.add("done");
    document.body.style.overflow = "";
    setTimeout(function () { intro.classList.add("gone"); }, reduce ? 0 : 650);
  }, reduce ? 300 : NAME_IN_MS + HOLD_MS);

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Nav menu (phones) ----------
  var menuBtn = document.getElementById("menu-btn");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

  // ---------- Gallery: twelve first, all forty on request ----------
  var SHOW_FIRST = 12;
  var photos = window.GALLERY || [];
  var grid = document.getElementById("gallery-grid");
  var showAll = document.getElementById("show-all");
  var cards = photos.map(function (p, i) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "card" + (i >= SHOW_FIRST ? " extra" : "");
    card.dataset.cat = p.cat || "";
    card.setAttribute("aria-label", "Open full size: " + (p.alt || "neon sign"));
    var img = document.createElement("img");
    img.src = p.src.replace("images/gallery/", "images/gallery/thumbs/");
    img.addEventListener("error", function () { if (img.src.indexOf("/thumbs/") > -1) img.src = p.src; }, { once: true });
    img.alt = "";
    img.width = 720;
    img.height = 540;
    img.loading = "lazy";
    card.appendChild(img);
    card.addEventListener("click", function () { openBox(i); });
    grid.appendChild(card);
    return card;
  });
  if (photos.length > SHOW_FIRST) {
    grid.classList.add("collapsed");
    showAll.textContent = "Show all " + photos.length + " signs";
  } else {
    showAll.hidden = true;
  }
  showAll.addEventListener("click", function () {
    grid.classList.remove("collapsed");
    showAll.hidden = true;
    var next = cards[SHOW_FIRST];
    if (next) next.focus();
  });

  // ---------- Filters ----------
  var chips = Array.prototype.slice.call(document.querySelectorAll("#filters .chip"));
  document.getElementById("filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var f = chip.dataset.filter;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
    if (f !== "all") { grid.classList.remove("collapsed"); showAll.hidden = true; }
    cards.forEach(function (c) { c.hidden = !(f === "all" || c.dataset.cat === f); });
  });

  // ---------- Lightbox ----------
  var box = document.getElementById("lightbox");
  var boxImg = box.querySelector("img");
  var boxCap = box.querySelector("figcaption");
  var idx = 0;
  var opener = null;
  function visible() {
    return cards.map(function (_, i) { return i; }).filter(function (i) {
      return cards[i].offsetParent !== null;
    });
  }
  function show(i) {
    idx = i;
    boxImg.src = photos[i].src;
    boxImg.alt = photos[i].alt || "";
    boxCap.textContent = photos[i].alt || "";
  }
  function openBox(i) {
    opener = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.style.overflow = "hidden";
    box.querySelector(".lb-close").focus();
  }
  function closeBox() {
    box.hidden = true;
    document.body.style.overflow = "";
    if (opener) opener.focus();
  }
  function step(d) {
    var v = visible();
    var pos = v.indexOf(idx);
    if (pos < 0) pos = 0;
    show(v[(pos + d + v.length) % v.length]);
  }
  box.querySelector(".lb-close").addEventListener("click", closeBox);
  box.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
  box.querySelector(".lb-next").addEventListener("click", function () { step(1); });
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
})();
