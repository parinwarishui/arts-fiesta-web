/* ==========================================================================
   Arts Fiesta 2026 — Coming Soon teaser
   Countdown timer + logo fallback
   ========================================================================== */

(function () {
  'use strict';

  // Event start: 2 October 2026, 14:00 SGT (UTC+8)
  var EVENT_START = Date.parse('2026-10-02T14:00:00+08:00');

  var labelEl = document.getElementById('countdown-label');
  var daysEl = document.getElementById('countdown-days');
  var hoursEl = document.getElementById('countdown-hours');
  var minsEl = document.getElementById('countdown-minutes');
  var secsEl = document.getElementById('countdown-seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    var now = Date.now();
    var frozen = now >= EVENT_START;

    labelEl.textContent = frozen ? 'THE FIESTA IS ON' : 'COUNTING DOWN TO ARTS FIESTA';

    var diff = frozen ? 0 : Math.max(0, EVENT_START - now);

    daysEl.textContent = pad(Math.floor(diff / 86400000));
    hoursEl.textContent = pad(Math.floor(diff / 3600000) % 24);
    minsEl.textContent = pad(Math.floor(diff / 60000) % 60);
    secsEl.textContent = pad(Math.floor(diff / 1000) % 60);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Logo fallback: if the SVG logo fails to load, swap in the text wordmark.
  var logoTitle = document.getElementById('hero-title');
  var logoImg = document.getElementById('hero-logo');
  if (logoImg) {
    logoImg.addEventListener('error', function () {
      logoTitle.classList.add('logo-failed');
    });
  }
})();
