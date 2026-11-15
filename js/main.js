(function () {
  "use strict";

  var dataEl = document.getElementById("designs-data");
  var designs = [];
  try {
    var payload = JSON.parse(dataEl.textContent);
    designs = payload.designs || payload;
  } catch (err) {
    console.warn("Could not parse designs manifest", err);
  }

  var ANGLE_LABELS = {
    "hero-three-quarter": "Hero",
    front: "Front",
    "three-quarter": "Three-quarter",
    side: "Side",
    "top-down": "Top",
    "cap-closeup": "Cap",
  };

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var grid = document.getElementById("gallery-grid");
  var filterBar = document.getElementById("filters");
  var lightbox = document.getElementById("lightbox");
  var lbMain = document.getElementById("lb-main");
  var lbThumbs = document.getElementById("lb-thumbs");
  var lbStyle = document.getElementById("lb-style");
  var lbTitle = document.getElementById("lb-title");
  var lbDesc = document.getElementById("lb-desc");
  var lbSpecs = document.getElementById("lb-specs");
  var lbViewer = document.getElementById("lb-viewer");
  var lbHire = document.getElementById("lb-hire");
  var lbClose = document.getElementById("lb-close");
  var currentSlug = null;
  var currentAngle = null;
  var lastFocus = null;

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function pictureHTML(img, alt, lazy, sizes) {
    if (!img) return "";
    var loading = lazy ? 'loading="lazy"' : 'fetchpriority="high"';
    var sz = sizes || "(min-width: 900px) 50vw, 100vw";
    return (
      "<picture>" +
      (img.thumb_webp
        ? '<source type="image/webp" srcset="' +
          img.thumb_webp +
          " 800w, " +
          img.webp +
          ' 1600w" sizes="' +
          sz +
          '">'
        : "") +
      (img.webp && !img.thumb_webp
        ? '<source type="image/webp" src="' + img.webp + '">'
        : "") +
      '<img src="' +
      (img.thumb_jpg || img.jpg) +
      '" alt="' +
      escapeHtml(alt) +
      '" ' +
      loading +
      ' width="1600" height="1600" decoding="async">' +
      "</picture>"
    );
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findDesign(slug) {
    for (var i = 0; i < designs.length; i++) {
      if (designs[i].slug === slug) return designs[i];
    }
    return null;
  }

  function renderGrid(filter) {
    if (!grid) return;
    var html = "";
    var count = 0;
    designs.forEach(function (d, i) {
      if (filter && filter !== "all" && d.filter !== filter) return;
      var hero = d.images[d.hero] || d.images[Object.keys(d.images)[0]];
      var alt = d.name + " — " + d.styleLabel + " perfume bottle";
      html +=
        '<button class="card" type="button" data-slug="' +
        escapeHtml(d.slug) +
        '" aria-label="View ' +
        escapeHtml(d.name) +
        '">' +
        '<div class="card-frame">' +
        pictureHTML(hero, alt, i > 1, "(min-width: 1400px) 33vw, (min-width: 720px) 50vw, 100vw") +
        "</div>" +
        '<div class="card-meta">' +
        '<span class="card-name">' +
        escapeHtml(d.name) +
        "</span>" +
        '<span class="card-style">' +
        escapeHtml(d.styleLabel) +
        "</span>" +
        "</div></button>";
      count += 1;
    });
    html += '<p class="grid-empty">No designs in this style yet.</p>';
    grid.innerHTML = html;
    grid.classList.toggle("is-empty", count === 0);
  }

  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      renderGrid(btn.getAttribute("data-filter"));
    });
  }

  if (grid) {
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (!card) return;
      openDesign(card.getAttribute("data-slug"));
    });
  }

  function spec(dt, dd) {
    if (!dd) return "";
    return (
      '<div class="spec"><dt>' +
      escapeHtml(dt) +
      "</dt><dd>" +
      escapeHtml(dd) +
      "</dd></div>"
    );
  }

  function formatCm(n) {
    if (n == null || n === "") return "";
    return Number(n).toFixed(1).replace(/\.0$/, "") + " cm";
  }

  function showAngle(design, angle) {
    currentAngle = angle;
    var img = design.images[angle];
    if (!img || !lbMain) return;
    var alt = design.name + " — " + (ANGLE_LABELS[angle] || angle) + " view";
    lbMain.innerHTML =
      '<img src="' +
      img.jpg +
      '" alt="' +
      escapeHtml(alt) +
      '">' +
      '<button type="button" class="lightbox-nav-btn prev" aria-label="Previous angle">‹</button>' +
      '<button type="button" class="lightbox-nav-btn next" aria-label="Next angle">›</button>';
    var thumbs = lbThumbs.querySelectorAll("button");
    thumbs.forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-angle") === angle);
    });
  }

  function stepAngle(dir) {
    var d = findDesign(currentSlug);
    if (!d) return;
    var i = d.angles.indexOf(currentAngle);
    if (i < 0) i = 0;
    var next = d.angles[(i + dir + d.angles.length) % d.angles.length];
    showAngle(d, next);
  }

  function openDesign(slug) {
    var d = findDesign(slug);
    if (!d || !lightbox) return;
    lastFocus = document.activeElement;
    currentSlug = slug;
    lbStyle.textContent = d.styleLabel;
    lbTitle.textContent = d.name;
    lbDesc.textContent = d.description || "";
    var dims = "";
    if (d.height_cm && d.width_cm) {
      dims = formatCm(d.height_cm) + " × " + formatCm(d.width_cm);
    } else if (d.height_cm) {
      dims = formatCm(d.height_cm) + " tall";
    }
    lbSpecs.innerHTML =
      spec("Scale", dims) +
      spec("Liquid", d.liquid) +
      spec("Metal", d.metal) +
      spec("Parts", (d.parts || []).join(", "));

    lbThumbs.innerHTML = d.angles
      .map(function (a) {
        var im = d.images[a];
        if (!im) return "";
        return (
          '<button type="button" data-angle="' +
          a +
          '" aria-label="' +
          escapeHtml(ANGLE_LABELS[a] || a) +
          '">' +
          '<img src="' +
          (im.thumb_jpg || im.jpg) +
          '" alt="">' +
          "</button>"
        );
      })
      .join("");

    showAngle(d, d.hero || d.angles[0]);

    if (lbViewer) {
      lbViewer.setAttribute("src", d.glb);
      if (d.images[d.hero]) {
        lbViewer.setAttribute("poster", d.images[d.hero].jpg);
      }
      lbViewer.setAttribute("alt", "Interactive 3D model of " + d.name);
    }
    if (lbHire) {
      lbHire.href = d.fiverr;
    }

    lightbox.classList.add("is-open");
    lightbox.removeAttribute("hidden");
    document.body.classList.add("is-locked");
    if (history.replaceState) {
      history.replaceState(null, "", "#design/" + slug);
    } else {
      location.hash = "design/" + slug;
    }
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("hidden", "");
    document.body.classList.remove("is-locked");
    if (lbViewer) lbViewer.removeAttribute("src");
    currentSlug = null;
    if (location.hash.indexOf("#design/") === 0) {
      if (history.replaceState) history.replaceState(null, "", location.pathname);
      else location.hash = "";
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (lbThumbs) {
    lbThumbs.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-angle]");
      if (!btn) return;
      var d = findDesign(currentSlug);
      if (d) showAngle(d, btn.getAttribute("data-angle"));
    });
  }
  if (lbMain) {
    lbMain.addEventListener("click", function (e) {
      if (e.target.closest(".prev")) stepAngle(-1);
      else if (e.target.closest(".next")) stepAngle(1);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") stepAngle(1);
    else if (e.key === "ArrowLeft") stepAngle(-1);
  });

  function openFromHash() {
    var h = location.hash || "";
    var q = new URLSearchParams(location.search).get("design");
    var slug = q;
    var m = h.match(/^#design\/([a-z0-9-]+)/i);
    if (m) slug = m[1];
    if (slug && findDesign(slug)) openDesign(slug);
  }

  renderGrid("all");
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();
