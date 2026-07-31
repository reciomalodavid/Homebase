(() => {
  "use strict";

  const UI_VERSION = "1.8.3";
  const MONTHS_BEFORE = 8;
  const MONTHS_AFTER = 16;
  let rebuilding = false;
  let activeObserver = null;
  let initialScrollDone = false;

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function monthLabel(date) {
    const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function injectStyles() {
    if (document.querySelector('link[data-homebase-ui="1.8.3"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `./homebase-ui-1.8.3.css?v=${UI_VERSION}`;
    link.dataset.homebaseUi = UI_VERSION;
    document.head.appendChild(link);
  }

  function calendarIsVisible() {
    const page = document.getElementById("calendarPage");
    return !!page?.classList.contains("active");
  }

  function ensureStack() {
    const grid = document.getElementById("monthGrid");
    if (!grid) return null;
    let stack = document.getElementById("continuousMonths");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "continuousMonths";
      stack.className = "continuous-months";
      grid.insertAdjacentElement("afterend", stack);
    }
    grid.closest(".calendar-shell")?.classList.add("continuous-active");
    return stack;
  }

  function wireDayButtons(section) {
    section.querySelectorAll(".day[data-date]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const dateIso = button.dataset.date;
        if (!dateIso) return;
        const date = parseDate(dateIso);
        state.selectedDate = dateIso;
        state.month = new Date(date.getFullYear(), date.getMonth(), 1);
        initialScrollDone = true;
        render();
        requestAnimationFrame(() => {
          document.querySelector(`.continuous-month .day[data-date="${dateIso}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      });
    });
  }

  function updateVisibleMonth(stack) {
    const sections = [...stack.querySelectorAll(".continuous-month")];
    if (!sections.length) return;
    const anchor = Math.max(145, window.innerHeight * 0.22);
    let best = sections[0];
    let bestDistance = Infinity;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - anchor);
      if (rect.bottom > anchor && distance < bestDistance) {
        best = section;
        bestDistance = distance;
      }
    }
    const key = best.dataset.month;
    const title = document.getElementById("periodTitle");
    if (title && best.dataset.label) title.textContent = best.dataset.label;
    sections.forEach(section => section.classList.toggle("is-visible-month", section === best));
    if (key) {
      const [year, month] = key.split("-").map(Number);
      state.month = new Date(year, month - 1, 1);
    }
  }

  function observeMonths(stack) {
    activeObserver?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    activeObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - 150) - Math.abs(b.boundingClientRect.top - 150));
      if (!visible.length) return;
      const section = visible[0].target;
      const title = document.getElementById("periodTitle");
      if (title && section.dataset.label) title.textContent = section.dataset.label;
    }, { rootMargin: "-120px 0px -55% 0px", threshold: [0, .05, .2, .5] });
    stack.querySelectorAll(".continuous-month").forEach(section => activeObserver.observe(section));
  }

  function renderContinuousMonths() {
    if (rebuilding || state.mode !== "month") return;
    const stack = ensureStack();
    const sourceGrid = document.getElementById("monthGrid");
    const sourceWeekdays = document.getElementById("weekdays");
    if (!stack || !sourceGrid || !sourceWeekdays) return;

    rebuilding = true;
    const savedMonth = new Date(state.month);
    const savedTitle = document.getElementById("periodTitle")?.textContent || "";
    const base = new Date(savedMonth.getFullYear(), savedMonth.getMonth(), 1);
    const todayKey = monthKey(new Date());
    const fragment = document.createDocumentFragment();

    try {
      stack.innerHTML = "";
      for (let offset = -MONTHS_BEFORE; offset <= MONTHS_AFTER; offset++) {
        const month = addMonths(base, offset);
        state.month = month;
        baseRenderMonth();

        const section = document.createElement("section");
        section.className = "continuous-month";
        section.dataset.month = monthKey(month);
        section.dataset.label = monthLabel(month);
        if (section.dataset.month === todayKey) section.classList.add("is-current");
        section.innerHTML = `
          <h2 class="continuous-month-title">${section.dataset.label}</h2>
          <div class="weekdays">${sourceWeekdays.innerHTML}</div>
          <div class="month-grid">${sourceGrid.innerHTML}</div>`;
        wireDayButtons(section);
        fragment.appendChild(section);
      }
      stack.appendChild(fragment);
    } finally {
      state.month = savedMonth;
      baseRenderMonth();
      if (document.getElementById("periodTitle")) document.getElementById("periodTitle").textContent = savedTitle || monthLabel(savedMonth);
      rebuilding = false;
    }

    observeMonths(stack);
    requestAnimationFrame(() => {
      const targetKey = monthKey(savedMonth);
      const target = stack.querySelector(`[data-month="${targetKey}"]`);
      if (!initialScrollDone && target) {
        initialScrollDone = true;
        target.scrollIntoView({ block: "start", behavior: "auto" });
        window.scrollBy(0, -150);
      }
      updateVisibleMonth(stack);
    });
  }

  injectStyles();

  if (typeof renderMonth !== "function") return;
  const baseRenderMonth = renderMonth;
  renderMonth = function renderMonthContinuous() {
    if (state.mode !== "month") {
      document.getElementById("continuousMonths")?.replaceChildren();
      document.querySelector(".calendar-shell")?.classList.remove("continuous-active");
      return baseRenderMonth();
    }
    baseRenderMonth();
    queueMicrotask(renderContinuousMonths);
  };

  let scrollTick = false;
  window.addEventListener("scroll", () => {
    if (scrollTick || !calendarIsVisible()) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const stack = document.getElementById("continuousMonths");
      if (stack) updateVisibleMonth(stack);
      scrollTick = false;
    });
  }, { passive: true });

  document.addEventListener("click", event => {
    const nav = event.target.closest?.("[data-page]");
    if (nav?.dataset.page === "calendarPage") {
      initialScrollDone = false;
      setTimeout(renderContinuousMonths, 40);
    }
    if (event.target.closest?.("#todayJump")) initialScrollDone = false;
  });

  window.HOMEBASE_VERSION = UI_VERSION;
  setTimeout(() => {
    if (state.mode === "month") renderContinuousMonths();
  }, 80);
})();
