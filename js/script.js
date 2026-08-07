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
})();
