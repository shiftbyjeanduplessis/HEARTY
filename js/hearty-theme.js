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

  function applyTheme(theme){
    const safe = safeTheme(theme);

    document.documentElement.setAttribute("data-theme", safe);
    if(document.body) document.body.setAttribute("data-theme", safe);

    try{
      localStorage.setItem("heartyTheme", safe);
      localStorage.setItem("hearty-theme", safe);
      localStorage.setItem("heartyThemeUserSelected", "true");
    }catch(e){}

    document.querySelectorAll("[data-theme]").forEach((button) => {
      const active = button.getAttribute("data-theme") === safe;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  window.heartyApplyTheme = applyTheme;
  window.heartyReadTheme = readTheme;

  applyTheme(readTheme());

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(readTheme());

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if(!button) return;

      const theme = button.getAttribute("data-theme");
      if(!VALID.includes(theme)) return;

      applyTheme(theme);
    }, true);
  });

  window.addEventListener("storage", (event) => {
    if(event.key === "heartyTheme" || event.key === "hearty-theme"){
      applyTheme(readTheme());
    }
  });
})();
