(function(){
  const VALID = ["clean_blue", "sunlit", "midnight", "rose_aurora"];

  function safeTheme(theme){
    return VALID.includes(theme) ? theme : "clean_blue";
  }

  function readTheme(){
    try{
      return safeTheme(
        localStorage.getItem("heartyTheme") ||
        localStorage.getItem("hearty-theme") ||
        document.documentElement.getAttribute("data-theme") ||
        "clean_blue"
      );
    }catch(e){
      return "clean_blue";
    }
  }

  function pickExistingSrc(logo){
    const src = logo.getAttribute("src") || "";
    if(src && !src.startsWith("data:")) return src;
    return "/hearty-logo.png";
  }

  function syncLogos(theme){
    const safe = safeTheme(theme);

    document.querySelectorAll(".brand-logo, .auth-logo").forEach((logo) => {
      const existingDefault =
        logo.getAttribute("data-default-logo") ||
        logo.getAttribute("data-clean-blue-logo") ||
        pickExistingSrc(logo) ||
        "/hearty-logo.png";

      const roseLogo = logo.getAttribute("data-rose-aurora-logo");

      /*
        Important:
        Do NOT force /hearty-logo-gold.png here.
        If that file is missing, the logo flashes then disappears.
        Gold appearance is handled safely by CSS filter.
      */
      let next = existingDefault;

      if(safe === "rose_aurora" && roseLogo){
        next = roseLogo;
      }

      logo.onerror = function(){
        this.onerror = null;
        this.setAttribute("src", existingDefault || "/hearty-logo.png");
      };

      if(next && logo.getAttribute("src") !== next){
        logo.setAttribute("src", next);
      }

      logo.setAttribute("data-default-logo", existingDefault || "/hearty-logo.png");
    });

    document.documentElement.classList.add("logo-ready");
  }

  function applyTheme(theme){
    const safe = safeTheme(theme);

    document.documentElement.setAttribute("data-theme", safe);
    if(document.body) document.body.setAttribute("data-theme", safe);

    try{
      localStorage.setItem("heartyTheme", safe);
      localStorage.setItem("hearty-theme", safe);
      localStorage.setItem("heartyThemeUserSelected", "true");
    }catch(e){}

    document.querySelectorAll("[data-theme], [data-theme-choice]").forEach((button) => {
      const choice = button.getAttribute("data-theme") || button.getAttribute("data-theme-choice");
      if(!VALID.includes(choice)) return;
      const active = choice === safe;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    document.querySelectorAll('select[name="theme"], #themeSelect, .theme-select').forEach((select) => {
      if(select.value !== safe) select.value = safe;
    });

    syncLogos(safe);
  }

  window.heartyApplyTheme = applyTheme;
  window.heartyReadTheme = readTheme;

  applyTheme(readTheme());

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(readTheme());

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme], [data-theme-choice]");
      if(!button) return;

      const theme = button.getAttribute("data-theme") || button.getAttribute("data-theme-choice");
      if(!VALID.includes(theme)) return;

      applyTheme(theme);
    }, true);

    document.addEventListener("change", (event) => {
      const target = event.target;
      if(!target) return;

      const isThemeInput =
        target.matches('select[name="theme"]') ||
        target.matches("#themeSelect") ||
        target.matches(".theme-select") ||
        target.matches("[data-theme-input]");

      if(!isThemeInput) return;
      applyTheme(target.value);
    }, true);
  });

  window.addEventListener("storage", (event) => {
    if(event.key === "heartyTheme" || event.key === "hearty-theme"){
      applyTheme(readTheme());
    }
  });
})();
