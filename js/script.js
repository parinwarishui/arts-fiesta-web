/* ==========================================================================
   Arts Fiesta 2026 — Coming Soon teaser
   Countdown timer + logo fallback
   ========================================================================== */

(function () {
  "use strict";

  // Event start: 2 October 2026, 14:00 SGT (UTC+8)
  var EVENT_START = Date.parse("2026-10-02T14:00:00+08:00");

  var labelEl = document.getElementById("countdown-label");
  var defaultLabel = labelEl
    ? labelEl.textContent.trim()
    : "ARTS FIESTA IS COMING TO YOU IN...";
  var daysEl = document.getElementById("countdown-days");
  var hoursEl = document.getElementById("countdown-hours");
  var minsEl = document.getElementById("countdown-minutes");
  var secsEl = document.getElementById("countdown-seconds");
  var timerId = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function updateCountdown() {
    var now = Date.now();
    var frozen = !isNaN(EVENT_START) && now >= EVENT_START;

    if (labelEl) {
      labelEl.textContent = frozen ? "THE FIESTA IS ON!" : defaultLabel;
    }

    var diff = frozen || isNaN(EVENT_START) ? 0 : EVENT_START - now;

    if (daysEl) daysEl.textContent = pad(Math.floor(diff / 86400000));
    if (hoursEl) hoursEl.textContent = pad(Math.floor(diff / 3600000) % 24);
    if (minsEl) minsEl.textContent = pad(Math.floor(diff / 60000) % 60);
    if (secsEl) secsEl.textContent = pad(Math.floor(diff / 1000) % 60);

    if (frozen && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  updateCountdown();
  if (!isNaN(EVENT_START) && Date.now() < EVENT_START) {
    // Align ticks to the top of each second so the displayed value
    // doesn't lag behind the real time by setInterval's scheduling jitter.
    var msToNextSecond = 1000 - (Date.now() % 1000);
    setTimeout(function () {
      updateCountdown();
      timerId = setInterval(updateCountdown, 1000);
    }, msToNextSecond);
  }

  // Logo fallback: if the SVG logo fails to load, swap in the text wordmark.
  var logoTitle = document.getElementById("hero-title");
  var logoImg = document.getElementById("hero-logo");
  if (logoImg) {
    logoImg.addEventListener("error", function () {
      logoTitle.classList.add("logo-failed");
    });
  }

  // ---------- Recap photo slider ----------
  // Built on native horizontal scrolling (scrollLeft) rather than a custom
  // CSS-transform animation, so it degrades gracefully: with no JS at all,
  // it's still a normal scrollable/swipeable strip (the markup already
  // contains two copies of the photos back-to-back for the loop).
  // Auto-scrolls continuously; pauses while the user is dragging or has
  // a pointer over it. Clicking a photo (without dragging) opens the album.
  (function initRecapSlider() {
    var slider = document.getElementById("recap-slider");
    var track = document.getElementById("recap-track");
    if (!slider || !track) return;

    var dragging = false;
    var dragMoved = false;
    var startX = 0;
    var startScroll = 0;
    var autoTimer = null;

    function loopWidth() {
      return track.scrollWidth / 2;
    }

    function normalize() {
      var lw = loopWidth();
      if (lw <= 0) return;
      if (slider.scrollLeft >= lw) slider.scrollLeft -= lw;
      else if (slider.scrollLeft < 0) slider.scrollLeft += lw;
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(function () {
        slider.scrollLeft += 1;
        normalize();
      }, 30);
    }

    function stopAuto() {
      if (autoTimer !== null) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function pointerDown(clientX) {
      dragging = true;
      dragMoved = false;
      startX = clientX;
      startScroll = slider.scrollLeft;
      slider.classList.add("is-dragging");
      stopAuto();
    }

    function pointerMove(clientX) {
      if (!dragging) return;
      var delta = clientX - startX;
      if (Math.abs(delta) > 4) dragMoved = true;
      slider.scrollLeft = startScroll - delta;
      normalize();
    }

    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove("is-dragging");
      startAuto();
    }

    slider.addEventListener("mousedown", function (e) {
      pointerDown(e.clientX);
      e.preventDefault();
    });
    window.addEventListener("mousemove", function (e) {
      pointerMove(e.clientX);
    });
    window.addEventListener("mouseup", pointerUp);

    slider.addEventListener(
      "touchstart",
      function (e) {
        pointerDown(e.touches[0].clientX);
      },
      { passive: true }
    );
    slider.addEventListener(
      "touchmove",
      function (e) {
        pointerMove(e.touches[0].clientX);
      },
      { passive: true }
    );
    slider.addEventListener("touchend", pointerUp);

    // Prevent the link from firing if the user was dragging.
    track.addEventListener(
      "click",
      function (e) {
        if (dragMoved) e.preventDefault();
      },
      true
    );

    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", function () {
      if (!dragging) startAuto();
    });

    startAuto();
  })();
})();
