/* hearty-meals-db-bridge.js */
(function () {
  "use strict";

  const UI_STATE_KEY = "heartyMealsStateV1";
  const PAGE_STATE_KEY = "heartyMealsPageStateVFinal";

  function getSupabase() {
    if (!window.supabaseClient) throw new Error("Missing window.supabaseClient");
    return window.supabaseClient;
  }

  async function getUserId() {
    const { data, error } = await getSupabase().auth.getUser();
    if (error) throw error;
    if (!data || !data.user) throw new Error("User is not logged in");
    return data.user.id;
  }

  function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  function readLocalState() {
    try {
      const raw = localStorage.getItem(PAGE_STATE_KEY) || localStorage.getItem(UI_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.warn("Could not read meals local state:", error);
      return {};
    }
  }

  function writeLocalState(state) {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
    localStorage.setItem(PAGE_STATE_KEY, JSON.stringify(state));
  }

  function toPreferencesPayload(userId, state) {
    const onboarding = state.onboarding || state.preferences || {};
    return {
      user_id: userId,
      country: state.selectedCountry || state.country || onboarding.country || "ZA",
      diet_type: state.dietType || onboarding.dietType || "omnivore",
      proteins: onboarding.proteins || [],
      breakfast_preference: onboarding.breakfast || onboarding.breakfast_preference || "both",
      starches: onboarding.starches || [],
      vegetables: onboarding.vegetables || [],
      fruits: onboarding.fruits || [],
      snacks_enabled: Boolean(state.snacksEnabled ?? onboarding.snacksEnabled ?? false),
      dinner_for_lunch: Boolean(state.dinnerForLunch ?? onboarding.dinnerForLunch ?? false)
    };
  }

  function mergePreferencesIntoState(state, prefs) {
    if (!prefs) return state;
    const onboarding = {
      country: prefs.country,
      dietType: prefs.diet_type,
      proteins: prefs.proteins || [],
      breakfast: prefs.breakfast_preference,
      starches: prefs.starches || [],
      vegetables: prefs.vegetables || [],
      fruits: prefs.fruits || [],
      snacksEnabled: prefs.snacks_enabled,
      dinnerForLunch: prefs.dinner_for_lunch
    };
    return {
      ...state,
      profileComplete: true,
      selectedCountry: prefs.country,
      country: prefs.country,
      dietType: prefs.diet_type,
      snacksEnabled: prefs.snacks_enabled,
      dinnerForLunch: prefs.dinner_for_lunch,
      onboarding,
      preferences: onboarding
    };
  }

  async function saveMealPreferences(state = readLocalState()) {
    const userId = await getUserId();
    const payload = toPreferencesPayload(userId, state);
    const { data, error } = await getSupabase()
      .from("meal_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function loadMealPreferences() {
    const userId = await getUserId();
    const { data, error } = await getSupabase()
      .from("meal_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data) writeLocalState(mergePreferencesIntoState(readLocalState(), data));
    return data;
  }

  async function saveCurrentMealPlan(state = readLocalState(), options = {}) {
    const userId = await getUserId();
    const weekStart = options.weekStart || getWeekStart();
    const onboarding = state.onboarding || state.preferences || {};
    const plan = state.weekPlan || [];
    if (!Array.isArray(plan) || plan.length === 0) throw new Error("No meal plan to save");

    const payload = {
      user_id: userId,
      week_start: weekStart,
      country: state.selectedCountry || state.country || onboarding.country || "ZA",
      diet_type: state.dietType || onboarding.dietType || "omnivore",
      snacks_enabled: Boolean(state.snacksEnabled ?? onboarding.snacksEnabled ?? false),
      dinner_for_lunch: Boolean(state.dinnerForLunch ?? onboarding.dinnerForLunch ?? false),
      plan,
      locked_meals: state.lockedMeals || {}
    };

    const { data, error } = await getSupabase()
      .from("meal_plans")
      .upsert(payload, { onConflict: "user_id,week_start" })
      .select()
      .single();
    if (error) throw error;

    await logMealEvent({
      mealPlanId: data.id,
      eventType: options.eventType || "generated_week",
      details: options.details || {}
    }).catch(() => {});

    return data;
  }

  async function loadCurrentMealPlan(options = {}) {
    const userId = await getUserId();
    const weekStart = options.weekStart || getWeekStart();
    const { data, error } = await getSupabase()
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      const nextState = {
        ...readLocalState(),
        profileComplete: true,
        selectedCountry: data.country,
        country: data.country,
        dietType: data.diet_type,
        snacksEnabled: data.snacks_enabled,
        dinnerForLunch: data.dinner_for_lunch,
        weekPlan: data.plan || [],
        lockedMeals: data.locked_meals || {},
        lastGeneratedAt: data.updated_at
      };
      writeLocalState(nextState);
      await logMealEvent({ mealPlanId: data.id, eventType: "loaded_plan", details: { week_start: weekStart } }).catch(() => {});
    }
    return data;
  }

  async function updateLockedMeals(lockedMeals, options = {}) {
    const userId = await getUserId();
    const weekStart = options.weekStart || getWeekStart();
    const { data, error } = await getSupabase()
      .from("meal_plans")
      .update({ locked_meals: lockedMeals || {} })
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .select()
      .single();
    if (error) throw error;

    const state = readLocalState();
    state.lockedMeals = lockedMeals || {};
    writeLocalState(state);
    return data;
  }

  async function logMealEvent({ mealPlanId = null, eventType, dayIndex = null, mealSlot = null, details = {} }) {
    const userId = await getUserId();
    const { data, error } = await getSupabase()
      .from("meal_plan_events")
      .insert({
        user_id: userId,
        meal_plan_id: mealPlanId,
        event_type: eventType,
        day_index: dayIndex,
        meal_slot: mealSlot,
        details
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function bootstrapMealsFromDatabase() {
    await loadMealPreferences();
    const plan = await loadCurrentMealPlan();
    return { hasPlan: Boolean(plan), state: readLocalState() };
  }

  window.HeartyMealsDB = {
    getWeekStart,
    readLocalState,
    writeLocalState,
    saveMealPreferences,
    loadMealPreferences,
    saveCurrentMealPlan,
    loadCurrentMealPlan,
    updateLockedMeals,
    logMealEvent,
    bootstrapMealsFromDatabase
  };
})();
