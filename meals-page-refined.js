(function(){
"use strict";

/* ---------------- STORAGE ---------------- */

const SNACKS_KEY = "heartyMealsSnacksOn";

function safeGet(key, fallback){
  try { return localStorage.getItem(key) || fallback; } catch(e){ return fallback; }
}

function safeSet(key, value){
  try { localStorage.setItem(key, value); } catch(e){}
}

function getSnacksOn(){
  return localStorage.getItem(SNACKS_KEY) !== "false";
}

function setSnacksOn(value){
  safeSet(SNACKS_KEY, value ? "true" : "false");
}

/* ---------------- SUPPORT ---------------- */

function readGlobalSupport(){
  try {
    var raw = localStorage.getItem("heartySupportMode") || "";
    if (raw && raw.charAt(0) === "{"){
      var parsed = JSON.parse(raw);
      if (parsed && parsed.isActive) return parsed.reason;
    }
    return "";
  } catch(e){
    return "";
  }
}

function writeGlobalSupport(reason){
  if (reason){
    safeSet("heartySupportMode", JSON.stringify({
      isActive:true,
      reason:reason,
      sourcePage:"meals",
      startedAt:new Date().toISOString()
    }));
  } else {
    safeSet("heartySupportMode", JSON.stringify({
      isActive:false,
      reason:null,
      sourcePage:"meals",
      endedAt:new Date().toISOString()
    }));
  }
}

function updateSupportUI(reason){
  const pill = document.getElementById("supportPill");
  if (!pill) return;

  const on = !!reason;
  pill.textContent = on ? "Support On" : "Support Off";
  pill.classList.toggle("is-on", on);
  pill.classList.toggle("is-off", !on);
}

/* ---------------- SNACK TOGGLE ---------------- */

function bindSnackToggle(bridge){
  const btn = document.getElementById("snackToggleBtn");
  const label = document.getElementById("snackToggleLabel");
  if (!btn) return;

  function sync(){
    const on = getSnacksOn();
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    if (label) label.textContent = on ? "On" : "Off";
  }

  btn.onclick = function(){
    const next = !getSnacksOn();
    setSnacksOn(next);

    if (bridge && bridge.state){
      bridge.state.adjustments = bridge.state.adjustments || {};
      bridge.state.adjustments.snacksOn = next;

      if (bridge.rebuildWeekFromEngine) bridge.rebuildWeekFromEngine();
      if (bridge.refreshMealsUI) bridge.refreshMealsUI();
    }

    sync();
  };

  sync();
}

/* ---------------- SUPPORT OFF BUTTON ---------------- */

function bindSupportOff(){
  const btn = document.getElementById("supportOffBtn");
  if (!btn) return;

  btn.onclick = function(){
    writeGlobalSupport(null);
    updateSupportUI(null);

    if (window.heartyMealsBridge){
      window.heartyMealsBridge.state.adjustments.supportMode = null;

      if (window.heartyMealsBridge.rebuildWeekFromEngine)
        window.heartyMealsBridge.rebuildWeekFromEngine();

      if (window.heartyMealsBridge.refreshMealsUI)
        window.heartyMealsBridge.refreshMealsUI();
    }
  };
}

/* ---------------- PDF SHOPPING ---------------- */

function downloadShopping(title, items){
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;

  const rows = (items || []).map(item => `
    <tr>
      <td>${item.name || ""}</td>
      <td>${item.qty7 || ""}</td>
      <td>${item.qty30 || ""}</td>
    </tr>
  `).join("");

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body{font-family:Inter,Arial;padding:32px}
        table{width:100%;border-collapse:collapse}
        th,td{padding:10px;border-bottom:1px solid #ddd}
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead><tr><th>Item</th><th>7 days</th><th>30 days</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=()=>window.print();<\/script>
    </body>
    </html>
  `);

  win.document.close();
}

/* ---------------- ENGINE LOADER ---------------- */

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

async function bootMeals(){

  const today = document.getElementById("todayLabel");
  if (today){
    const d = new Date();
    today.textContent = d.toLocaleDateString(undefined,{
      weekday:"long", month:"short", day:"numeric"
    });
  }

  const supportMode = readGlobalSupport();
  updateSupportUI(supportMode);

  try{

    await loadScript("./meals-engine-v6.5.js");
    await loadScript("./meals-bridge.js");

    const engine =
      window.HeartyMealsEngineV6 ||
      window.HeartyMealsEngine;

    const factory =
      window.createMealsBridge ||
      window.createHeartyMealsBridge;

    if (!engine || !factory) throw new Error("Engine or bridge missing");

    const bridge = factory({
      engine,
      ui:{
        dayTabs:document.getElementById("plannerDays"),
        mealList:document.getElementById("mealList"),
        shoppingList:null // 🚫 removed inline shopping list
      }
    });

    bridge.state.adjustments = bridge.state.adjustments || {};
    bridge.state.adjustments.supportMode = supportMode || null;
    bridge.state.adjustments.snacksOn = getSnacksOn();

    window.heartyMealsBridge = bridge;

    if (bridge.init) bridge.init();

    bindSnackToggle(bridge);
    bindSupportOff();

  } catch(e){
    console.warn("Meals boot failed", e);
  }
}

/* ---------------- INIT ---------------- */

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootMeals);
} else {
  bootMeals();
}

})();
