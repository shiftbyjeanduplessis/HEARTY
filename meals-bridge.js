(function () {
  "use strict";

  function findEngine() {
    return window.HeartyMealsEngineV6 || window.HeartyMealsEngine || null;
  }

  function createMealsBridge(options) {
    options = options || {};
    var engine = options.engine || findEngine();
    var ui = options.ui || {};

    return {
      state: {
        week: [],
        selectedDayIndex: 0,
        adjustments: { supportMode: null }
      },

      init: function () {
        this.regenerateWeek();
      },

      regenerateWeek: function () {
        var profile = options.initialProfile || {};
        var result = null;

        if (engine && typeof engine.generateWeek === "function") {
          result = engine.generateWeek({
            profile: profile,
            preferences: profile.preferences || profile,
            supportMode: this.state.adjustments.supportMode
          });
        }

        this.state.week = normalizeWeek(result);
        localStorage.setItem("heartyMealsGeneratedWeek", JSON.stringify(this.state.week));
        this.render();
      },

      render: function () {
        renderMeals(this.state.week[this.state.selectedDayIndex], ui.mealList);
        renderShopping(this.state.week, ui.shoppingList);
      }
    };
  }

  function normalizeWeek(result) {
    if (result && Array.isArray(result.week)) return result.week;
    if (result && Array.isArray(result.days)) return result.days;
    if (Array.isArray(result)) return result;

    return [
      day(1), day(2), day(3), day(4), day(5), day(6), day(7)
    ];
  }

  function day(n) {
    return {
      day: n,
      meals: [
        { slot: "breakfast", title: "Eggs with spinach or mushrooms", protein: "Protein meal" },
        { slot: "lunch", title: "Chicken salad with low-calorie dressing", protein: "Protein meal" },
        { slot: "dinner", title: "Grilled fish with vegetables and one portion starch", protein: "Protein meal" }
      ]
    };
  }

  function renderMeals(day, mealList) {
    if (!mealList || !day) return;

    mealList.innerHTML = (day.meals || []).map(function (meal) {
      return `
        <article class="meal-card" data-slot="${meal.slot || "meal"}">
          <div class="meal-card__header">
            <div>
              <div class="meal-card__eyebrow">${label(meal.slot)}</div>
              <h3 class="meal-card__title">${meal.title || meal.name || "Meal"}</h3>
            </div>
            <div class="meal-card__protein">${meal.protein || "Protein meal"}</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderShopping(week, shoppingList) {
    if (!shoppingList) return;
    shoppingList.innerHTML = `
      <div class="shopping-item">Chicken</div>
      <div class="shopping-item">Eggs</div>
      <div class="shopping-item">Fish</div>
      <div class="shopping-item">Vegetables / salad</div>
      <div class="shopping-item">Low-fat dairy</div>
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
