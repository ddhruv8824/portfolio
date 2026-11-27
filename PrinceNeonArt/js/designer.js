// "See your name in neon": a live preview of a custom sign.
// No AI: the customer's text is set in a neon-style script font and lit with CSS glows.
(function () {
  var input = document.getElementById("neon-input");
  if (!input) return;

  var stage = document.getElementById("neon-stage");
  var acrylic = document.getElementById("neon-acrylic");
  var sign = document.getElementById("neon-text");
  var caseBox = document.getElementById("neon-case");
  var acrylicBox = document.getElementById("neon-acrylic-toggle");
  var colourName = document.getElementById("neon-colour-name");
  var send = document.getElementById("neon-send");

  var PLACEHOLDER = "Your Name";
  var state = { colour: "#ffd9a8", colourName: "Warm white", font: "sacramento", fontName: "Signature", wall: "dark" };

  // Capital first letter of each word, small letters after: "priya & RAHUL" -> "Priya & Rahul"
  function capitalise(text) {
    return text.toLowerCase().replace(/(^|\s)(\S)/g, function (_, space, ch) { return space + ch.toUpperCase(); });
  }

  function currentText() {
    var raw = input.value.replace(/\s+/g, " ").trim();
    if (!raw) return PLACEHOLDER;
    return caseBox.checked ? capitalise(raw) : raw;
  }

  // Shrink the lettering so long names still fit on the wall
  function fit() {
    var max = stage.clientWidth < 520 ? 64 : 104;
    var min = 26;
    sign.style.fontSize = max + "px";
    var room = stage.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft) - 2 * parseFloat(getComputedStyle(acrylic).paddingLeft);
    var width = sign.scrollWidth;
    if (width > room) {
      var size = Math.max(min, Math.floor(max * room / width));
      sign.style.fontSize = size + "px";
      sign.style.whiteSpace = size === min ? "normal" : "nowrap";
    } else {
      sign.style.whiteSpace = "nowrap";
    }
  }

  function flick() {
    sign.classList.remove("flick");
    void sign.offsetWidth;
    sign.classList.add("flick");
  }

  function updateLink() {
    var lines = [
      "Hi Prince Neon Art, I designed a sign on your website:",
      "Text: " + currentText(),
      "Colour: " + state.colourName,
      "Lettering: " + state.fontName,
      "Acrylic backing: " + (acrylicBox.checked ? "Yes" : "No"),
      "Please share the size options and price."
    ];
    send.href = "https://wa.me/919664001741?text=" + encodeURIComponent(lines.join("\n"));
  }

  function render(withFlick) {
    sign.textContent = currentText();
    sign.style.setProperty("--neon", state.colour);
    sign.dataset.font = state.font;
    stage.dataset.wall = state.wall;
    stage.dataset.acrylic = acrylicBox.checked ? "on" : "off";
    colourName.textContent = state.colourName;
    fit();
    updateLink();
    if (withFlick) flick();
  }

  // Pick one button in a group
  function group(containerId, onPick) {
    var box = document.getElementById(containerId);
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn || !box.contains(btn)) return;
      box.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("is-on", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      onPick(btn);
      render(true);
    });
    box.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.classList.contains("is-on"))); });
  }

  group("neon-colours", function (b) { state.colour = b.dataset.colour; state.colourName = b.dataset.name; });
  group("neon-fonts", function (b) { state.font = b.dataset.font; state.fontName = b.dataset.name; });
  group("neon-wall", function (b) { state.wall = b.dataset.wall; });

  input.addEventListener("input", function () { render(false); });
  input.addEventListener("change", function () { render(true); });
  caseBox.addEventListener("change", function () { render(true); });
  acrylicBox.addEventListener("change", function () { render(false); });
  window.addEventListener("resize", fit);

  // Fonts load after the page; refit once they arrive
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); });
  render(false);
})();
