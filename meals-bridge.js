(function () {
  "use strict";

  const LOG_KEY = "heartyProteinLogsV1";
  const LEFTOVER_KEY = "heartyDinnerToLunchEnabled";
  const SNACKS_KEY = "heartyMealsSnacksOn";

  const $ = (id) => document.getElementById(id);

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function snacksEnabled() {
    return localStorage.getItem(SNACKS_KEY) !== "false";
  }

  function isProteinLogged(slot) {
    const logs = readJSON(LOG_KEY, {});
    return !!(logs[todayKey()] && logs[todayKey()][slot]);
  }

  function toggleProtein(slot) {
    const logs = readJSON(LOG_KEY, {});
    const day = todayKey();
    logs[day] = logs[day] || {};
    logs[day][slot] = !logs[day][slot];
    writeJSON(LOG_KEY, logs);
  }

  function leftoversEnabled() {
    return localStorage.getItem(LEFTOVER_KEY) === "true";
  }

  function setLeftoversEnabled(value) {
    localStorage.setItem(LEFTOVER_KEY, value ? "true" : "false");
  }

  function createMealsBridge(options) {
    options = options || {};
    const ui = options.ui || {};

    const bridge = {
      state: {
        selectedDayIndex: Number(localStorage.getItem("heartyMealsCurrentDay") || 0),
        week: [],
        shoppingList: []
      },

      init() {
        this.state.week = buildWeek();
        applyLeftovers(this.state.week);
        this.bind();
        this.render();
      },

      bind() {
        const dayTabs = ui.dayTabs || $("plannerDays");

        if (dayTabs && !dayTabs.__bound) {
          dayTabs.__bound = true;
          dayTabs.addEventListener("click", (event) => {
            const btn = event.target.closest("button");
            if (!btn) return;

            const buttons = Array.from(dayTabs.querySelectorAll("button"));
            const idx = buttons.indexOf(btn);

            if (idx >= 0) {
              this.state.selectedDayIndex = idx;
              localStorage.setItem("heartyMealsCurrentDay", String(idx));
              this.render();
            }
          });
        }

        document.addEventListener("click", (event) => {
          const proteinBtn = event.target.closest("[data-log-protein]");
          if (proteinBtn) {
            toggleProtein(proteinBtn.dataset.logProtein);
            this.render();
          }

          if (event.target.closest("[data-regenerate-week]")) {
            this.state.week = buildWeek();
            applyLeftovers(this.state.week);
            this.render();
          }

          if (event.target.closest("[data-regenerate-day]")) {
            this.state.week[this.state.selectedDayIndex] = buildDay(this.state.selectedDayIndex + 1);
            applyLeftovers(this.state.week);
            this.render();
          }
        });

        document.addEventListener("change", (event) => {
          const toggle = event.target.closest("[data-leftover-toggle]");
          if (toggle) {
            setLeftoversEnabled(toggle.checked);
            this.state.week = buildWeek();
            applyLeftovers(this.state.week);
            this.render();
          }
        });
      },

      render() {
        renderTabs(this.state.selectedDayIndex, ui.dayTabs);
        renderLeftoverToggle();
        renderMeals(this.state.week[this.state.selectedDayIndex], ui.mealList);
        renderProteinMeter();
        this.state.shoppingList = buildShoppingList(this.state.week);
      },

      regenerateWeek() {
        this.state.week = buildWeek();
        applyLeftovers(this.state.week);
        this.render();
      },

      generateWeek() {
        this.regenerateWeek();
      },

      refresh() {
        this.render();
      },

      getShoppingList() {
        return buildShoppingList(this.state.week);
      }
    };

    return bridge;
  }

  function buildWeek() {
    return [1, 2, 3, 4, 5, 6, 7].map(buildDay);
  }

  function buildDay(n) {
    const plans = [
      [
        "2 x Eggs scrambled with baby spinach or mushrooms",
        "Chicken salad (1 Portion skinless chicken breast, lettuce, tomato, cucumber, peppers) + 2 tbsp low-calorie dressing",
        "Grilled fish (1 Portion hake/salmon) + roasted vegetables + 1 portion brown rice",
        "1 cup low-fat yoghurt + berries"
      ],
      [
        "Oats bowl (½ cup oats + low-fat milk) with banana and optional sweetener",
        "Tuna salad (1 tin tuna, drained, baby spinach, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Chicken stir-fry (1 Portion chicken strips, broccoli, peppers, baby marrow) + 1 portion rice",
        "Cottage cheese on 2 rice cakes"
      ],
      [
        "Low-fat yoghurt bowl (1 cup low-fat yoghurt) with berries",
        "Chicken wrap (1 Portion chicken, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Lean beef stew (1 Portion lean beef, carrots, onion, tomato, stock, herbs) + 1 portion sweet potato",
        "Small handful biltong"
      ],
      [
        "All Bran bowl with low-fat milk and fruit",
        "Egg salad bowl (2 eggs, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Chicken tray bake (1 Portion chicken, butternut, peppers, baby marrow) + 1 portion couscous",
        "Apple with 1 tbsp peanut butter"
      ],
      [
        "2 x Eggs on 1 slice whole wheat toast",
        "Beef salad bowl (1 Portion lean beef strips, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Fish cakes with salad + 1 portion mashed potato",
        "Low-fat yoghurt"
      ],
      [
        "Overnight oats (½ cup oats + low-fat milk) with blueberries",
        "Cottage cheese plate (1 cup low-fat cottage cheese, salad, 2 rice cakes)",
        "Lean mince bowl (1 Portion lean mince, tomato, onion, vegetables) + 1 portion brown rice",
        "Fruit + small handful nuts"
      ],
      [
        "Low-fat yoghurt bowl with banana",
        "Tuna salad with rice cakes",
        "Chicken stew (1 Portion chicken, carrots, green beans, tomato, stock, herbs) + 1 portion sweet potato",
        "Biltong or cottage cheese"
      ]
    ];

    const p = plans[(n - 1) % plans.length];

    const meals = [
      {
        slot: "breakfast",
        title: p[0],
        subtitle: "Breakfast follows Hearty rules: bowl unless eggs.",
        protein: "Protein meal"
      },
      {
        slot: "lunch",
        title: p[1],
        subtitle: "Lunch uses protein-first structure and low-calorie dressing where needed.",
        protein: "Protein meal"
      },
      {
        slot: "dinner",
        title: p[2],
        subtitle: "Dinner includes 1 protein portion, vegetables and 1 starch portion.",
        protein: "Protein meal"
      }
    ];

    if (snacksEnabled()) {
      meals.splice(1, 0, {
        slot: "snack",
        title: p[3],
        subtitle: "Optional snack based on your snack setting.",
        protein: "Snack"
      });
    }

    return { day: n, meals };
  }

  function applyLeftovers(week) {
    if (!leftoversEnabled()) return;

    for (let i = 1; i < week.length; i++) {
      const yesterdayDinner = week[i - 1].meals.find((m) => m.slot === "dinner");
      const lunchIndex = week[i].meals.findIndex((m) => m.slot === "lunch");

      if (yesterdayDinner && lunchIndex >= 0) {
        week[i].meals[lunchIndex] = {
          slot: "lunch",
          title: "Yesterday’s dinner leftovers — no extra starch",
          subtitle: yesterdayDinner.title,
          protein: "Protein meal"
        };
      }
    }
  }

  function renderTabs(idx, dayTabs) {
    dayTabs = dayTabs || $("plannerDays");
    if (!dayTabs) return;

    dayTabs.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === idx);
      btn.classList.toggle("active", i === idx);
    });
  }

  function renderLeftoverToggle() {
    const planner = document.querySelector(".planner-card");
    const days = $("plannerDays");
    if (!planner || !days) return;

    let wrap = $("leftoverToggleWrap");

    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "leftoverToggleWrap";
      wrap.className = "support-banner";
      planner.insertBefore(wrap, days);
    }

    wrap.innerHTML = `
      <label style="display:flex;align-items:center;gap:10px;font-weight:750;">
        <input type="checkbox" data-leftover-toggle ${leftoversEnabled() ? "checked" : ""}>
        Use dinner for tomorrow’s lunch
      </label>
    `;
  }

  function renderMeals(day, mealList) {
    mealList = mealList || $("mealList");
    if (!mealList || !day) return;

    mealList.innerHTML = day.meals.map((meal) => {
      const logged = isProteinLogged(meal.slot);
      const isSnack = String(meal.slot).toLowerCase().includes("snack");

      return `
        <article class="meal-card" data-slot="${meal.slot}">
          <div class="meal-card__header">
            <div>
              <div class="meal-card__eyebrow">${label(meal.slot)}</div>
              <h3 class="meal-card__title">${meal.title}</h3>
              <div class="meal-card__subtitle">${meal.subtitle || ""}</div>
            </div>
            <div class="meal-card__protein">${isSnack ? "Optional" : logged ? "Logged" : meal.protein}</div>
          </div>

          ${isSnack ? "" : `
            <div class="meal-card__actions">
              <button type="button" data-log-protein="${meal.slot}">
                ${logged ? "Protein logged ✓" : "Log protein"}
              </button>
            </div>
          `}
        </article>
      `;
    }).join("");
  }

  function renderProteinMeter() {
    const slots = ["breakfast", "lunch", "dinner"];
    const count = slots.filter(isProteinLogged).length;

    const meter = $("proteinMeter");
    const text = $("proteinMeterText");
    const pips = $("proteinMeterPips");

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

  function buildShoppingList() {
    return [
      { name: "Eggs", qty7: "12–14 eggs", qty30: "52–60 eggs" },
      { name: "Chicken breast / strips", qty7: "1.2–1.5 kg", qty30: "5–6.5 kg" },
      { name: "Fish / hake / salmon", qty7: "700–900 g", qty30: "3–4 kg" },
      { name: "Canned tuna", qty7: "3–4 tins", qty30: "13–17 tins" },
      { name: "Lean beef / mince", qty7: "700–900 g", qty30: "3–4 kg" },
      { name: "Low-fat yoghurt", qty7: "1.5–2 kg", qty30: "6.5–8.5 kg" },
      { name: "Low-fat cottage cheese", qty7: "500–750 g", qty30: "2–3.2 kg" },
      { name: "Vegetables / salad", qty7: "4–6 kg mixed", qty30: "17–26 kg mixed" },
      { name: "Fruit", qty7: "7–10 portions", qty30: "30–43 portions" },
      { name: "Rice / couscous / sweet potato", qty7: "7 starch portions", qty30: "30 starch portions" },
      { name: "Low-calorie dressing", qty7: "1 bottle", qty30: "3–4 bottles" },
      { name: "Optional snacks", qty7: snacksEnabled() ? "7 snack portions" : "Off", qty30: snacksEnabled() ? "30 snack portions" : "Off" }
    ];
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
