// Hearty Meals Bridge
// Upload this file to the ROOT of your repo and name it exactly: meals-bridge.js

(function () {
  "use strict";

  function findEngine() {
    return window.HeartyMealsEngineV6 ||
      window.HeartyMealsEngine ||
      window.heartyMealsEngine ||
      window.MealsEngine ||
      window.mealsEngine ||
      window.HEARTY_MEALS_ENGINE ||
      null;
  }

  function day(n) {
    const plans = [
      ["2 x Eggs scrambled with baby spinach or mushrooms", "Chicken salad (1 Portion skinless chicken breast, lettuce, tomato, cucumber, peppers) + 2 tbsp low-calorie dressing", "Grilled fish (1 Portion hake/salmon) + roasted vegetables + 1 portion brown rice"],
      ["Oats bowl (½ cup oats + low-fat milk) with banana and optional sweetener", "Tuna salad (1 tin tuna, drained, baby spinach, tomato, cucumber) + 2 tbsp low-calorie dressing", "Chicken stir-fry (1 Portion chicken strips, broccoli, peppers, baby marrow) + 1 portion rice"],
      ["Low-fat yoghurt bowl (1 cup low-fat yoghurt) with berries", "Yesterday’s dinner leftovers — no extra starch", "Lean beef stew (1 Portion lean beef, carrots, onion, tomato, stock, herbs) + 1 portion sweet potato"],
      ["All Bran bowl with low-fat milk and fruit", "Chicken wrap (1 Portion chicken, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing", "Fish cakes with salad + 1 portion mashed potato"],
      ["2 x Eggs on 1 slice whole wheat toast", "Beef salad bowl (1 Portion lean beef strips, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing", "Chicken tray bake (1 Portion chicken, butternut, peppers, baby marrow) + 1 portion couscous"],
      ["Overnight oats (½ cup oats + low-fat milk) with blueberries", "Cottage cheese plate (1 cup low-fat cottage cheese, salad, 2 rice cakes)", "Lean mince bowl (1 Portion lean mince, tomato, onion, vegetables) + 1 portion brown rice"],
      ["Low-fat yoghurt bowl with banana", "Egg salad bowl (2 eggs, salad greens, tomato, cucumber) + 2 tbsp low-calorie dressing", "Chicken stew (1 Portion chicken, carrots, green beans, tomato, stock, herbs) + 1 portion sweet potato"]
    ];

    const p = plans[(n - 1) % plans.length];

    return {
      day: n,
      meals: [
        { slot: "breakfast", title: p[0], protein: "Protein meal", subtitle: "Breakfast unit follows Hearty rules: bowl unless eggs." },
        { slot: "lunch", title: p[1], protein: "Protein meal", subtitle: "Lunch uses protein-first structure and low-calorie dressing where needed." },
        { slot: "dinner", title: p[2], protein: "Protein meal", subtitle: "Dinner includes 1 protein portion, vegetables and 1 starch portion." }
      ]
    };
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

        document.querySelectorAll("[data-regenerate-week]").forEach((btn) => {
          btn.onclick = () => this.regenerateWeek();
        });

        document.querySelectorAll("[data-regenerate-day]").forEach((btn) => {
          btn.onclick = () => this.regenerateDay();
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
              supportMode: this.state.adjustments.supportMode
            });
          } catch (e) {
            console.warn("[Meals Bridge] Engine generateWeek failed, using fallback.", e);
          }
        }

        this.state.week = normalizeWeek(result);
        localStorage.setItem("heartyMealsGeneratedWeek", JSON.stringify(this.state.week));
        this.render();
      },

      regenerateDay() {
        this.state.week[this.state.selectedDayIndex] = day(this.state.selectedDayIndex + 1);
        localStorage.setItem("heartyMealsGeneratedWeek", JSON.stringify(this.state.week));
        this.render();
      },

      render() {
        renderTabs(this.state.selectedDayIndex, ui.dayTabs);
        renderMeals(this.state.week[this.state.selectedDayIndex], ui.mealList);
        renderShopping(this.state.week, ui.shoppingList);
        renderProtein(this.state.week[this.state.selectedDayIndex]);
      }
    };
  }

  function normalizeWeek(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.week)) return result.week;
    if (result && Array.isArray(result.days)) return result.days;
    return [day(1), day(2), day(3), day(4), day(5), day(6), day(7)];
  }

  function renderTabs(idx, dayTabs) {
    dayTabs = dayTabs || document.getElementById("plannerDays");
    if (!dayTabs) return;

    dayTabs.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === idx);
      btn.classList.toggle("active", i === idx);
    });
  }

  function renderMeals(dayObj, mealList) {
    mealList = mealList || document.getElementById("mealList");
    if (!mealList || !dayObj) return;

    mealList.innerHTML = (dayObj.meals || []).map((meal) => `
      <article class="meal-card" data-slot="${meal.slot || "meal"}">
        <div class="meal-card__header">
          <div>
            <div class="meal-card__eyebrow">${label(meal.slot)}</div>
            <h3 class="meal-card__title">${meal.title || "Meal"}</h3>
            ${meal.subtitle ? `<div class="meal-card__subtitle">${meal.subtitle}</div>` : ""}
          </div>
          <div class="meal-card__protein">${meal.protein || "Protein meal"}</div>
        </div>
      </article>
    `).join("");
  }

  function renderShopping(week, shoppingList) {
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

  function renderProtein(dayObj) {
    if (!dayObj) return;

    const meals = dayObj.meals || [];
    const count = meals.filter((m) =>
      ["breakfast", "lunch", "dinner"].includes(String(m.slot || "").toLowerCase())
    ).length;

    const meter = document.getElementById("proteinMeter");
    const text = document.getElementById("proteinMeterText");
    const pips = document.getElementById("proteinMeterPips");

    if (meter) meter.style.setProperty("--protein-percent", Math.round((count / 3) * 100));
    if (text) text.textContent = `${count} / 3 protein meals`;
    if (pips) {
      pips.innerHTML = [0, 1, 2].map((i) =>
        `<span class="protein-pip ${i < count ? "is-filled" : ""}"></span>`
      ).join("");
    }

    document.querySelectorAll(".protein-chip").forEach((chip) => {
      chip.classList.add("done");
      const state = chip.querySelector(".protein-state");
      if (state) state.textContent = "Planned";
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
