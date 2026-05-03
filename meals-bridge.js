(function () {
  "use strict";

  const LOG_KEY = "heartyProteinLogsV1";
  const LEFTOVER_KEY = "heartyDinnerToLunchEnabled";

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
        week: []
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
        renderShopping(ui.shoppingList);
      },

      regenerateWeek() {
        this.state.week = buildWeek();
        applyLeftovers(this.state.week);
        this.render();
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
        "Grilled fish (1 Portion hake/salmon) + roasted vegetables + 1 portion brown rice"
      ],
      [
        "Oats bowl (½ cup oats + low-fat milk) with banana and optional sweetener",
        "Tuna salad (1 tin tuna, drained, baby spinach, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Chicken stir-fry (1 Portion chicken strips, broccoli, peppers, baby marrow) + 1 portion rice"
      ],
      [
        "Low-fat yoghurt bowl (1 cup low-fat yoghurt) with berries",
        "Chicken wrap (1 Portion chicken, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Lean beef stew (1 Portion lean beef, carrots, onion, tomato, stock, herbs) + 1 portion sweet potato"
      ],
      [
        "All Bran bowl with low-fat milk and fruit",
        "Egg salad bowl (2 eggs, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Chicken tray bake (1 Portion chicken, butternut, peppers, baby marrow) + 1 portion couscous"
      ],
      [
        "2 x Eggs on 1 slice whole wheat toast",
        "Beef salad bowl (1 Portion lean beef strips, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing",
        "Fish cakes with salad + 1 portion mashed potato"
      ],
      [
        "Overnight oats (½ cup oats + low-fat milk) with blueberries",
        "Cottage cheese plate (1 cup low-fat cottage cheese, salad, 2 rice cakes)",
        "Lean mince bowl (1 Portion lean mince, tomato, onion, vegetables) + 1 portion brown rice"
      ],
      [
        "Low-fat yoghurt bowl with banana",
        "Tuna salad with rice cakes",
        "Chicken stew (1 Portion chicken, carrots, green beans, tomato, stock, herbs) + 1 portion sweet potato"
      ]
    ];

    const p = plans[(n - 1) % plans.length];

    return {
      day: n,
      meals: [
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
      ]
    };
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

      return `
        <article class="meal-card" data-slot="${meal.slot}">
          <div class="meal-card__header">
            <div>
              <div class="meal-card__eyebrow">${label(meal.slot)}</div>
              <h3 class="meal-card__title">${meal.title}</h3>
              <div class="meal-card__subtitle">${meal.subtitle || ""}</div>
            </div>
            <div class="meal-card__protein">${logged ? "Logged" : meal.protein}</div>
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

  function renderShopping(shoppingList) {
    shoppingList = shoppingList || $("shoppingList");
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
