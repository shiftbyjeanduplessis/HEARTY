(function(){
  function readJsonStorage(key){
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      return null;
    }
  }

  function hasMealProfile(){
    var state =
      readJsonStorage("heartyMealsPageStateVFinal") ||
      readJsonStorage("heartyMealsStateVFinal") ||
      readJsonStorage("heartyMealsStateV1") ||
      readJsonStorage("heartyMealProfile") ||
      readJsonStorage("heartyMealsProfile");

    if (!state) return false;

    var profile =
      state.preferences ||
      state.onboarding ||
      state.profile ||
      state.mealProfile ||
      state;

    if (!profile || typeof profile !== "object") return false;

    return (
      state.profileComplete === true ||
      state.onboardingComplete === true ||
      state.mealsOnboardingComplete === true ||
      profile.profileComplete === true ||
      profile.onboardingComplete === true ||
      Object.keys(profile).length > 2
    );
  }

  try {
    document.documentElement.setAttribute("data-theme", "clean_blue");

    var path = (window.location.pathname || "").toLowerCase();
    if (path.indexOf("meals-onboarding") === -1 && !hasMealProfile()) {
      window.location.replace("meals-onboarding.html");
    }
  } catch(e) {}
})();
