/* ==========================================================================
   Arts Fiesta 2026 — Coming Soon teaser
   Countdown timer + logo fallback
   ========================================================================== */

(function () {
  "use strict";

  // Event start: 2 October 2026, 15:00 SGT (UTC+8)
  var EVENT_START = Date.parse("2026-10-02T15:00:00+08:00");

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

  // ---------- Clubs grid + club detail modal ----------
  // Clicking (or pressing Enter/Space on) a club opens a popup with its
  // artwork and its show-day slots. Slots are read straight from the
  // timetable (events carry data-clubs="Club A|Club B") plus the club's
  // own data-booth attribute, so the timetable stays the single source of
  // truth. Clubs with neither just show their artwork and name.
  (function initClubsSection() {
    var grid = document.getElementById("clubs-grid");
    var modal = document.getElementById("club-modal");
    if (!grid) return;

    var overlay = document.getElementById("club-modal-overlay");
    if (!modal || !overlay) return;

    var tagsEl = document.getElementById("club-modal-tags");
    var imgEl = document.getElementById("club-modal-image");
    var nameEl = document.getElementById("club-modal-name");
    var slotsEl = document.getElementById("club-modal-slots");
    var closeBtn = modal.querySelector(".club-modal__close");
    var lastFocused = null;

    var TRACKS = {
      perf: "Performance",
      workshop: "Workshop",
    };

    // e.g. "Chinese Orchestra (CO)" -> "chinese orchestra"
    function baseName(name) {
      return name
        .replace(/\s*\(.*?\)/g, "")
        .trim()
        .toLowerCase();
    }

    function getSlots(club) {
      var slots = [];
      var events = document.querySelectorAll(".timetable__event[data-clubs]");
      Array.prototype.forEach.call(events, function (ev) {
        if (ev.getAttribute("data-clubs").split("|").indexOf(club) === -1)
          return;
        var track = ev.classList.contains("timetable__event--workshop")
          ? "workshop"
          : "perf";
        var timeEl = ev.querySelector(".timetable__event-time");
        var durationEl = ev.querySelector(".timetable__duration");
        // Drop a "Bands: " style prefix, and the title entirely when it
        // only repeats the club's own name (e.g. "Drama Club Workshop").
        var title = ev
          .querySelector(".timetable__title")
          .textContent.replace(/^[^:]+:\s*/, "")
          .trim();
        var redundant =
          baseName(title).replace(/ workshop$/, "") === baseName(club);
        slots.push({
          time: timeEl ? timeEl.textContent : "",
          track: track,
          detail: [
            redundant ? "" : title,
            durationEl ? durationEl.textContent : "",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      });
      return slots;
    }

    function addTag(tag) {
      var span = document.createElement("span");
      span.className = "club-modal__tag pill club-modal__tag--" + tag;
      span.textContent = tag;
      tagsEl.appendChild(span);
    }

    function addSlot(kind, when, what, detail) {
      var li = document.createElement("li");
      li.className = "club-modal__slot club-modal__slot--" + kind;
      var whenEl = document.createElement("span");
      whenEl.className = "club-modal__slot-when text-eyebrow";
      whenEl.textContent = when;
      var whatEl = document.createElement("span");
      whatEl.className = "club-modal__slot-what";
      whatEl.textContent = what;
      li.appendChild(whenEl);
      li.appendChild(whatEl);
      if (detail) {
        var detailEl = document.createElement("span");
        detailEl.className = "club-modal__slot-detail";
        detailEl.textContent = detail;
        li.appendChild(detailEl);
      }
      slotsEl.appendChild(li);
    }

    // Manually driven (rather than the native <dialog> showModal()/close()),
    // since the browser's own autofocus-on-open behavior scrolls the page
    // to bring the dialog into view — which visibly jumps the page to the
    // top before the popup appears. Focusing with { preventScroll: true }
    // below sidesteps that entirely.
    function openModal() {
      overlay.hidden = false;
      modal.focus({ preventScroll: true });
      document.addEventListener("keydown", onKeydown);
    }

    function closeModal() {
      overlay.hidden = true;
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) lastFocused.focus({ preventScroll: true });
    }

    function onKeydown(e) {
      if (e.key === "Escape") closeModal();
    }

    function openClub(slide) {
      lastFocused = slide;
      var name = slide.getAttribute("data-club");
      var img = slide.querySelector("img");

      nameEl.textContent = name;
      imgEl.src = img ? img.src : "";
      imgEl.alt = img ? img.alt : name;
      tagsEl.innerHTML = "";
      slotsEl.innerHTML = "";

      var slots = getSlots(name);
      var booth = slide.getAttribute("data-booth");
      var hasBooth = booth !== null;

      function hasTrack(track) {
        return slots.some(function (s) {
          return s.track === track;
        });
      }
      if (hasTrack("perf")) addTag("performance");
      if (hasTrack("workshop")) addTag("workshop");
      if (hasBooth) addTag("booth");

      slots.forEach(function (s) {
        addSlot(s.track, s.time, TRACKS[s.track], s.detail);
      });
      if (hasBooth)
        addSlot("booth", "Booth", booth || "Visit us at our booth", "");

      slotsEl.hidden = !slotsEl.children.length;

      openModal();
    }

    // Delegated so it also covers keyboard activation of a focused slide.
    grid.addEventListener("click", function (e) {
      var slide = e.target.closest(".clubs__item");
      if (slide) openClub(slide);
    });

    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var slide = e.target.closest(".clubs__item");
      if (!slide) return;
      e.preventDefault();
      openClub(slide);
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // Clicking the backdrop (outside the modal box, but inside the overlay)
    // should close it.
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  })();

  // ---------- Timetable track panels (phones) ----------
  // Below 760px the grid collapses to a single list, which interleaves
  // all three tracks. Instead, build a swipeable strip of panels (All,
  // then one per track) from clones of the grid's events, with tabs on
  // top. CSS only shows the strip on phones, where it replaces the grid;
  // without JS the plain stacked list still works. Clones drop
  // data-clubs so the clubs popup still reads each slot once.
  (function initTimetablePanels() {
    var timetable = document.querySelector(".timetable");
    var grid = timetable && timetable.querySelector(".timetable__grid");
    if (!grid) return;

    function headLabel(mod, fallback) {
      var head = timetable.querySelector(".timetable__head--" + mod);
      return head ? head.textContent.trim() : fallback;
    }

    var tracks = [
      { label: "All", mods: null },
      { label: headLabel("perf", "Performances"), mods: ["perf", "break"], accent: "perf" },
      { label: headLabel("workshop", "Workshops"), mods: ["workshop"], accent: "workshop" },
      { label: headLabel("mascot", "Fab.io Appears"), mods: ["mascot"], accent: "mascot" },
    ];
    var events = grid.querySelectorAll(".timetable__event");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    var tabList = document.createElement("div");
    tabList.className = "timetable__tabs";
    tabList.setAttribute("role", "tablist");
    tabList.setAttribute("aria-label", "Schedule tracks");

    var scroller = document.createElement("div");
    scroller.className = "timetable__panels";

    var tabs = [];
    var panels = [];

    tracks.forEach(function (track, i) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.id = "timetable-tab-" + i;
      tab.className = "timetable__tab text-eyebrow";
      if (track.accent) tab.classList.add("timetable__tab--" + track.accent);
      tab.textContent = track.label;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "timetable-panel-" + i);
      tab.addEventListener("click", function () {
        goTo(i);
      });
      tabList.appendChild(tab);
      tabs.push(tab);

      var panel = document.createElement("div");
      panel.id = "timetable-panel-" + i;
      panel.className = "timetable__panel";
      // The tab already names the track, so cards don't need to repeat it.
      if (track.mods) panel.classList.add("timetable__panel--track");
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      Array.prototype.forEach.call(events, function (ev) {
        var matches =
          !track.mods ||
          track.mods.some(function (mod) {
            return ev.classList.contains("timetable__event--" + mod);
          });
        if (!matches) return;
        var clone = ev.cloneNode(true);
        clone.removeAttribute("data-clubs");
        clone.removeAttribute("style");
        panel.appendChild(clone);
      });
      scroller.appendChild(panel);
      panels.push(panel);
    });

    timetable.insertBefore(tabList, grid);
    timetable.insertBefore(scroller, grid);
    timetable.classList.add("timetable--panels");

    var current = -1;

    function setActive(i) {
      if (i !== current) {
        current = i;
        tabs.forEach(function (tab, j) {
          var on = j === i;
          tab.classList.toggle("is-active", on);
          tab.setAttribute("aria-selected", on ? "true" : "false");
          tab.tabIndex = on ? 0 : -1;
          panels[j].setAttribute("aria-hidden", on ? "false" : "true");
        });
      }
      // Fit the strip to the visible panel so a short track doesn't leave
      // the tall "All" panel's height as empty space below it.
      scroller.style.height = panels[i].offsetHeight + "px";
    }

    function goTo(i) {
      scroller.scrollTo({
        left: panels[i].offsetLeft - panels[0].offsetLeft,
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
      setActive(i);
    }

    function syncFromScroll() {
      var width = scroller.clientWidth;
      if (!width) return; // Hidden on laptop layouts.
      var i = Math.round(scroller.scrollLeft / width);
      setActive(Math.max(0, Math.min(panels.length - 1, i)));
    }

    tabList.addEventListener("keydown", function (e) {
      var step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      var next = (current + step + tabs.length) % tabs.length;
      goTo(next);
      tabs[next].focus();
      e.preventDefault();
    });

    scroller.addEventListener("scroll", syncFromScroll, { passive: true });
    // Panel heights change with the viewport width and once fonts load.
    window.addEventListener("resize", syncFromScroll);
    window.addEventListener("load", syncFromScroll);

    setActive(0);
  })();

  // ---------- Instagram teaser slider ----------
  // Same drag-to-scroll behavior as the recap slider, but static: no
  // auto-scroll and no duplicated content, since there are only a
  // handful of teaser cards rather than a full photo album.
  (function initInstagramSlider() {
    var slider = document.getElementById("instagram-slider");
    var track = document.getElementById("instagram-track");
    if (!slider || !track) return;

    var dragging = false;
    var dragMoved = false;
    var startX = 0;
    var startScroll = 0;

    function pointerDown(clientX) {
      dragging = true;
      dragMoved = false;
      startX = clientX;
      startScroll = slider.scrollLeft;
      slider.classList.add("is-dragging");
    }

    function pointerMove(clientX) {
      if (!dragging) return;
      var delta = clientX - startX;
      if (Math.abs(delta) > 4) dragMoved = true;
      slider.scrollLeft = startScroll - delta;
    }

    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove("is-dragging");
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
  })();
})();
