(function () {
  "use strict";

  const LOG_KEY = "heartyProteinLogsV1";
  const LEFTOVER_KEY = "heartyDinnerToLunchEnabled";

  function findEngine() {
    return window.HeartyMealsEngineV6 || window.HeartyMealsEngine || null;
  }

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function isLeftoversEnabled() {
    return localStorage.getItem(LEFTOVER_KEY) === "true";
  }

  function setLeftoversEnabled(value) {
    localStorage.setItem(LEFTOVER_KEY, value ? "true" : "false");
  }

  function proteinLogs() {
    return readJSON(LOG_KEY, {});
  }

  function isProteinLogged(slot) {
    const logs = proteinLogs();
    return !!(logs[todayKey()] && logs[todayKey()][slot]);
  }

  function toggleProtein(slot) {
    const logs = proteinLogs();
    const day = todayKey();
    logs[day] = logs[day] || {};
    logs[day][slot] = !logs[day][slot];
    writeJSON(LOG_KEY, logs);
  }

  function createMealsBridge(options) {
    options = options || {};
    const engine = options.engine || findEngine();
    const ui = options.ui || {};

    return {
      state: {
        week: [],
        selectedDayIndex: 0,
        adjustments: { supportMode: null }
      },

      init() {
        this.regenerateWeek();
        this.bindTabs();
        this.bindGlobalClicks();
      },

      bindTabs() {
        const dayTabs = ui.dayTabs || document.getElementById("plannerDays");
        if (!dayTabs || dayTabs.__bound) return;
        dayTabs.__bound = true;

        dayTabs.addEventListener("click", (event) => {
          const btn = event.target.closest("button");
          if (!btn) return;
          const buttons = Array.from(dayTabs.querySelectorAll("button"));
          const idx = buttons.indexOf(btn);
          if (idx < 0) return;
          this.state.selectedDayIndex = idx;
          this.render();
        });

        document.querySelector("[data-regenerate-week]")?.addEventListener("click", () => this.regenerateWeek());
        document.querySelector("[data-regenerate-day]")?.addEventListener("click", () => this.regenerateDay());
      },

      bindGlobalClicks() {
        document.addEventListener("click", (event) => {
          const proteinBtn = event.target.closest("[data-log-protein]");
          if (proteinBtn) {
            toggleProtein(proteinBtn.dataset.logProtein);
            this.render();
          }

          const leftoverToggle = event.target.closest("[data-leftover-toggle]");
          if (leftoverToggle) {
            setLeftoversEnabled(leftoverToggle.checked);
            this.regenerateWeek();
          }
        });
      },

      regenerateWeek() {
        let result = null;
        const profile = options.initialProfile || {};

        if (engine && typeof engine.generateWeek === "function") {
          try {
            result = engine.generateWeek({
              profile,
              preferences: profile.preferences || profile,
              supportMode: this.state.adjustments.supportMode,
              useDinnerForLunch: isLeftoversEnabled()
            });
          } catch (e) {
            console.warn("[Meals Bridge] Engine failed, using fallback.", e);
          }
        }

        this.state.week = normalizeWeek(result);
        applyLeftoverRule(this.state.week);
        localStorage.setItem("heartyMealsGeneratedWeek", JSON.stringify(this.state.week));
        this.render();
      },

      regenerateDay() {
        this.state.week[this.state.selectedDayIndex] = day(this.state.selectedDayIndex + 1);
        applyLeftoverRule(this.state.week);
        localStorage.setItem("heartyMealsGeneratedWeek", JSON.stringify(this.state.week));
        this.render();
      },

      render() {
        renderTabs(this.state.selectedDayIndex, ui.dayTabs);
        renderLeftoverToggle();
        renderMeals(this.state.week[this.state.selectedDayIndex], ui.mealList);
        renderShopping(ui.shoppingList);
        renderProtein();
      }
    };
  }

  function applyLeftoverRule(week) {
    if (!isLeftoversEnabled()) return;

    for (let i = 1; i < week.length; i++) {
      const yesterdayDinner = week[i - 1].meals.find(m => m.slot === "dinner");
      const lunchIndex = week[i].meals.findIndex(m => m.slot === "lunch");

      if (yesterdayDinner && lunchIndex >= 0) {
        week[i].meals[lunchIndex] = {
          slot: "lunch",
          title: "Yesterday’s dinner leftovers — no extra starch",
          protein: "Protein meal",
          subtitle: yesterdayDinner.title
        };
      }
    }
  }

  function normalizeWeek(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.week)) return result.week;
    if (result && Array.isArray(result.days)) return result.days;
    return [day(1), day(2), day(3), day(4), day(5), day(6), day(7)];
  }

  function day(n) {
    const plans = [
      ["2 x Eggs scrambled with baby spinach or mushrooms", "Chicken salad (1 Portion skinless chicken breast, lettuce, tomato, cucumber, peppers) + 2 tbsp low-calorie dressing", "Grilled fish (1 Portion hake/salmon) + roasted vegetables + 1 portion brown rice"],
      ["Oats bowl (½ cup oats + low-fat milk) with banana", "Tuna salad (1 tin tuna, drained, baby spinach, tomato, cucumber) + 2 tbsp low-calorie dressing", "Chicken stir-fry (1 Portion chicken strips, broccoli, peppers, baby marrow) + 1 portion rice"],
      ["Low-fat yoghurt bowl with berries", "Chicken wrap with salad + 2 tbsp low-calorie dressing", "Lean beef stew + 1 portion sweet potato"],
      ["All Bran bowl with low-fat milk and fruit", "Egg salad bowl + 2 tbsp low-calorie dressing", "Chicken tray bake + 1 portion couscous"],
      ["2 x Eggs on 1 slice whole wheat toast", "Beef salad bowl + 2 tbsp low-calorie dressing", "Fish cakes with salad + 1 portion mashed potato"],
      ["Overnight oats with low-fat milk and blueberries", "Cottage cheese plate with salad and 2 rice cakes", "Lean mince bowl + 1 portion brown rice"],
      ["Low-fat yoghurt bowl with banana", "Tuna salad with rice cakes", "Chicken stew + 1 portion sweet potato"]
    ];

    const p = plans[(n - 1) % plans.length];

    return {
      day: n,
      meals: [
        { slot: "breakfast", title: p[0], protein: "Protein meal" },
        { slot: "lunch", title: p[1], protein: "Protein meal" },
        { slot: "dinner", title: p[2], protein: "Protein meal" }
      ]
    };
  }

  function renderTabs(idx, dayTabs) {
    dayTabs = dayTabs || document.getElementById("plannerDays");
    if (!dayTabs) return;
    dayTabs.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === idx);
      btn.classList.toggle("active", i === idx);
    });
  }

  function renderLeftoverToggle() {
    const planner = document.querySelector(".planner-card");
    if (!planner || document.getElementById("leftoverToggleWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "leftoverToggleWrap";
    wrap.className = "support-banner";
    wrap.innerHTML = `
      <label style="display:flex;align-items:center;gap:10px;font-weight:750;">
        <input type="checkbox" data-leftover-toggle ${isLeftoversEnabled() ? "checked" : ""}>
        Use dinner for tomorrow’s lunch
      </label>
    `;

    const days = document.getElementById("plannerDays");
    planner.insertBefore(wrap, days);
  }

  function renderMeals(dayObj, mealList) {
    mealList = mealList || document.getElementById("mealList");
    if (!mealList || !dayObj) return;

    mealList.innerHTML = (dayObj.meals || []).map((meal) => {
      const logged = isProteinLogged(meal.slot);

      return `
        <article class="meal-card" data-slot="${meal.slot}">
          <div class="meal-card__header">
            <div>
              <div class="meal-card__eyebrow">${label(meal.slot)}</div>
              <h3 class="meal-card__title">${meal.title}</h3>
              ${meal.subtitle ? `<div class="meal-card__subtitle">${meal.subtitle}</div>` : ""}
            </div>
            <div class="meal-card__protein">${logged ? "Logged" : "Protein meal"}</div>
          </div>

          <div class="meal-card__actions">
            <button type="button" data-log-protein="${meal.slot}">
              ${logged ? "Protein logged ✓" : "Log protein"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderShopping(shoppingList) {
    shoppingList = shoppingList || document.getElementById("shoppingList");
    if (!shoppingList) return;

    shoppingList.innerHTML = `
      <div class="shopping-item">Chicken</div>
      <div class="shopping-item">Eggs</div>
      <div class="shopping-item">Fish / hake / salmon</div>
      <div class="shopping-item">Canned tuna</div>
      <div class="shopping-item">Lean beef / mince</div>
      <div class="shopping-item">Vegetables / salad</div>
      <div class="shopping-item">Low-fat yoghurt / cottage cheese</div>
      <div class="shopping-item">Rice / sweet potato / couscous</div>
      <div class="shopping-item">Low-calorie dressing</div>
    `;
  }

  function renderProtein() {
    const slots = ["breakfast", "lunch", "dinner"];
    const count = slots.filter(isProteinLogged).length;

    const meter = document.getElementById("proteinMeter");
    const text = document.getElementById("proteinMeterText");
    const pips = document.getElementById("proteinMeterPips");

    if (meter) meter.style.setProperty("--protein-percent", Math.round((count / 3) * 100));
    if (text) text.textContent = `${count} / 3 protein meals`;

    if (pips) {
      pips.innerHTML = slots.map((slot) =>
        `<span class="protein-pip ${isProteinLogged(slot) ? "is-filled" : ""}"></span>`
      ).join("");
    }

    document.querySelectorAll(".protein-chip").forEach((chip) => {
      const name = chip.querySelector(".protein-name")?.textContent?.toLowerCase();
      const done = isProteinLogged(name);
      chip.classList.toggle("done", done);
      const state = chip.querySelector(".protein-state");
      if (state) state.textContent = done ? "Logged" : "Pending";
    });
  }

  function label(slot) {
    slot = String(slot || "").toLowerCase();
    if (slot.includes("break")) return "Breakfast";
    if (slot.includes("lunch")) return "Lunch";
    if (slot.includes("dinner")) return "Dinner";
    if (slot.includes("snack")) return "Snack";
    return "Meal";
  }

  window.createMealsBridge = createMealsBridge;
})();
