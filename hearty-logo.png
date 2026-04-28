/* Hearty Data Layer v1
   Backward-compatible local-first bridge for Home, Settings, Support, Social, Meals and Exercise.
   - Keeps old localStorage keys working.
   - Creates one canonical local record at hearty:data:v1.
   - Leaves progress photos local-only and does not upload images.
*/
(function(){
  'use strict';

  var CANONICAL_KEY = 'hearty:data:v1';
  var DEVICE_ID_KEY = 'heartyDeviceId';
  var SYNC_QUEUE_KEY = 'hearty:syncQueue:v1';
  var VERSION = 1;
  var suppressPatch = false;
  var migrateTimer = null;

  function todayKey(d){
    var x = d ? new Date(d) : new Date();
    var y = x.getFullYear();
    var m = String(x.getMonth()+1).padStart(2,'0');
    var day = String(x.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }

  function safeGet(key){ try { return localStorage.getItem(key); } catch(e){ return null; } }
  function safeSet(key,value){ try { localStorage.setItem(key, value); } catch(e){} }
  function safeRemove(key){ try { localStorage.removeItem(key); } catch(e){} }
  function parseJSON(value, fallback){ try { return value ? JSON.parse(value) : fallback; } catch(e){ return fallback; } }
  function num(value, fallback){ var n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function bool(value, fallback){
    if(value === true || value === 'true' || value === '1') return true;
    if(value === false || value === 'false' || value === '0') return false;
    return fallback;
  }
  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function deviceId(){
    var id = safeGet(DEVICE_ID_KEY);
    if(!id){
      id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
      safeSet(DEVICE_ID_KEY, id);
    }
    return id;
  }

  function emptyData(){
    return {
      version: VERSION,
      device_id: deviceId(),
      updated_at: new Date().toISOString(),
      settings: {
        theme: 'clean_blue',
        units_system: 'metric',
        hydration_auto: true,
        hydration_target_litres: 3.0,
        social_enabled: true,
        injection_reminder_enabled: true,
        photo_privacy: 'local_only',
        onboarding_complete: false
      },
      profile: {
        first_name: '',
        user_name: '',
        account_email: '',
        height_cm: null,
        starting_weight_kg: null,
        current_weight_kg: null,
        target_weight_kg: null,
        medication_name: '',
        injection_name: '',
        injection_dose: '',
        injection_day: ''
      },
      progress: {
        weight_logs: {},
        hydration_logs: {},
        task_logs: {},
        lesson_logs: {},
        badge_events: [],
        injection_logs: {},
        photo_checkins: []
      },
      support: {
        active_state: '',
        active_date: '',
        symptom_logs: []
      },
      social: {
        enabled: true,
        share_photos_updates: true,
        share_water: false,
        posts_local_only: true
      },
      meals: {
        plans: {},
        locked_meals: {}
      },
      exercise: {
        sessions: []
      },
      meta: {
        last_migration_at: null,
        last_sync_at: null
      }
    };
  }

  function mergeDeep(base, incoming){
    if(!incoming || typeof incoming !== 'object') return base;
    Object.keys(incoming).forEach(function(k){
      if(incoming[k] && typeof incoming[k] === 'object' && !Array.isArray(incoming[k])){
        if(!base[k] || typeof base[k] !== 'object' || Array.isArray(base[k])) base[k] = {};
        mergeDeep(base[k], incoming[k]);
      } else if(incoming[k] !== undefined && incoming[k] !== null && incoming[k] !== '') {
        base[k] = incoming[k];
      }
    });
    return base;
  }

  function readCanonical(){
    return mergeDeep(emptyData(), parseJSON(safeGet(CANONICAL_KEY), {}));
  }

  function writeCanonical(data, reason){
    data.version = VERSION;
    data.device_id = data.device_id || deviceId();
    data.updated_at = new Date().toISOString();
    data.meta = data.meta || {};
    data.meta.last_migration_at = data.meta.last_migration_at || new Date().toISOString();
    safeSet(CANONICAL_KEY, JSON.stringify(data));
    queueSync(reason || 'local_update', data.updated_at);
    return data;
  }

  function readLegacy(){
    var data = emptyData();
    var today = todayKey();

    data.settings.theme = safeGet('heartyTheme') || safeGet('hearty-theme') || data.settings.theme;
    data.settings.units_system = safeGet('heartyUnitsSystem') || data.settings.units_system;
    data.settings.hydration_auto = bool(safeGet('heartyWaterAuto'), data.settings.hydration_auto);
    data.settings.hydration_target_litres = num(safeGet('heartyWaterTargetLitres'), data.settings.hydration_target_litres);
    data.settings.injection_reminder_enabled = bool(safeGet('heartyInjectionReminderEnabled'), data.settings.injection_reminder_enabled);
    data.settings.onboarding_complete = safeGet('heartyCoreSetupDone') === 'true';
    data.settings.social_enabled = bool(safeGet('heartySocialEnabled'), bool(safeGet('heartyCommunityEnabled'), true));

    data.profile.first_name = safeGet('heartyFirstName') || '';
    data.profile.user_name = safeGet('heartyUserName') || '';
    data.profile.account_email = safeGet('heartyAccountEmail') || '';
    data.profile.height_cm = num(safeGet('heartyHeightCm'), null);
    data.profile.starting_weight_kg = num(safeGet('heartyStartingWeightKg'), null);
    data.profile.current_weight_kg = num(safeGet('heartyCurrentWeightKg') || safeGet('heartyTodayWeightKg') || safeGet('heartyTodayWeightKg:' + today), null);
    data.profile.target_weight_kg = num(safeGet('heartyTargetWeightKg'), null);
    data.profile.medication_name = safeGet('heartyMedicationName') || '';
    data.profile.injection_name = safeGet('heartyInjectionName') || '';
    data.profile.injection_dose = safeGet('heartyInjectionDose') || '';
    data.profile.injection_day = safeGet('heartyInjectionDay') || '';

    var profileObj = parseJSON(safeGet('hearty_profile'), null);
    if(profileObj){
      data.profile = mergeDeep(data.profile, {
        first_name: profileObj.firstName || profileObj.first_name,
        user_name: profileObj.userName || profileObj.name || profileObj.user_name,
        height_cm: profileObj.heightCm || profileObj.height_cm,
        current_weight_kg: profileObj.currentWeightKg || profileObj.weightKg || profileObj.current_weight_kg,
        starting_weight_kg: profileObj.startingWeightKg || profileObj.starting_weight_kg,
        target_weight_kg: profileObj.targetWeightKg || profileObj.target_weight_kg
      });
    }

    var progressObj = parseJSON(safeGet('hearty_progress'), null);
    if(progressObj){ data.progress.raw_legacy_progress = progressObj; }

    var todaysWeight = num(safeGet('heartyTodayWeightKg:' + today) || safeGet('heartyTodayWeightKg'), null);
    if(todaysWeight){ data.progress.weight_logs[today] = { date: today, weight_kg: todaysWeight, source: 'legacy_home' }; }
    if(data.profile.current_weight_kg){ data.progress.weight_logs[today] = data.progress.weight_logs[today] || { date: today, weight_kg: data.profile.current_weight_kg, source: 'legacy_settings' }; }

    var supportState = safeGet('heartySupportState') || '';
    data.support.active_state = supportState;
    data.support.active_date = supportState ? today : '';

    var symptomKeys = ['heartySymptomTrendLog','heartySupportSymptomLog','heartySupportTrendLog','heartySymptomLog'];
    symptomKeys.forEach(function(k){
      var arr = parseJSON(safeGet(k), null);
      if(Array.isArray(arr) && arr.length){
        data.support.symptom_logs = arr.map(function(item, idx){
          return Object.assign({ source_key: k, index: idx }, item);
        });
      }
    });

    var photoAt = safeGet('heartyLastPhotoCheckInAt');
    if(photoAt){ data.progress.photo_checkins.push({ checked_in_at: photoAt, count: num(safeGet('heartyLastPhotoCheckInCount'), null), storage: 'local_only' }); }

    var badgeCabinet = parseJSON(safeGet('heartyBadgeCabinet'), null);
    if(Array.isArray(badgeCabinet)){ data.progress.badge_events = badgeCabinet; }

    Object.keys(localStorage).forEach(function(k){
      if(k.indexOf('heartyInjectionLogged:') === 0){
        var date = k.split(':').slice(1).join(':') || today;
        data.progress.injection_logs[date] = { date: date, logged: safeGet(k) === '1' || safeGet(k) === 'true' };
      }
      if(k.indexOf('heartyTask:') === 0 || k.indexOf('heartyDailyTask:') === 0){
        data.progress.task_logs[k] = parseJSON(safeGet(k), safeGet(k));
      }
    });

    data.social.enabled = data.settings.social_enabled;
    data.social.share_photos_updates = bool(safeGet('heartySocialSharePhotosUpdates'), bool(safeGet('heartyCommunitySharePhotosUpdates'), true));
    data.social.share_water = bool(safeGet('heartySocialShareWater'), bool(safeGet('heartyCommunityShareWater'), false));

    return data;
  }

  function writeLegacy(data){
    suppressPatch = true;
    try{
      safeSet('heartyTheme', data.settings.theme || 'clean_blue');
      safeSet('hearty-theme', data.settings.theme || 'clean_blue');
      safeSet('heartyUnitsSystem', data.settings.units_system || 'metric');
      safeSet('heartyWaterAuto', String(data.settings.hydration_auto !== false));
      safeSet('heartyWaterTargetLitres', String(data.settings.hydration_target_litres || 3.0));
      safeSet('heartyInjectionReminderEnabled', String(data.settings.injection_reminder_enabled !== false));
      safeSet('heartySocialEnabled', String(data.settings.social_enabled !== false));
      safeSet('heartyCommunityEnabled', String(data.settings.social_enabled !== false));
      safeSet('heartySocialSharePhotosUpdates', String(data.social.share_photos_updates !== false));
      safeSet('heartySocialShareWater', String(data.social.share_water === true));

      if(data.settings.onboarding_complete) safeSet('heartyCoreSetupDone','true');
      if(data.profile.first_name) safeSet('heartyFirstName', data.profile.first_name);
      if(data.profile.user_name) safeSet('heartyUserName', data.profile.user_name);
      if(data.profile.account_email) safeSet('heartyAccountEmail', data.profile.account_email);
      if(data.profile.height_cm != null) safeSet('heartyHeightCm', String(data.profile.height_cm));
      if(data.profile.starting_weight_kg != null) safeSet('heartyStartingWeightKg', String(data.profile.starting_weight_kg));
      if(data.profile.current_weight_kg != null) safeSet('heartyCurrentWeightKg', String(data.profile.current_weight_kg));
      if(data.profile.target_weight_kg != null) safeSet('heartyTargetWeightKg', String(data.profile.target_weight_kg));
      if(data.profile.medication_name) safeSet('heartyMedicationName', data.profile.medication_name);
      if(data.profile.injection_name) safeSet('heartyInjectionName', data.profile.injection_name);
      if(data.profile.injection_dose) safeSet('heartyInjectionDose', data.profile.injection_dose);
      if(data.profile.injection_day) safeSet('heartyInjectionDay', data.profile.injection_day);
      if(data.support.active_state) safeSet('heartySupportState', data.support.active_state); else safeRemove('heartySupportState');
    } finally { suppressPatch = false; }
  }

  function migrate(reason){
    var canonical = readCanonical();
    var legacy = readLegacy();
    var merged = mergeDeep(canonical, legacy);
    merged.meta.last_migration_at = new Date().toISOString();
    writeLegacy(merged);
    return writeCanonical(merged, reason || 'migration');
  }

  function queueSync(reason, updatedAt){
    var q = parseJSON(safeGet(SYNC_QUEUE_KEY), []);
    q.push({ reason: reason || 'update', updated_at: updatedAt || new Date().toISOString() });
    if(q.length > 50) q = q.slice(q.length - 50);
    safeSet(SYNC_QUEUE_KEY, JSON.stringify(q));
  }

  function setPath(path, value){
    var data = readCanonical();
    var parts = path.split('.');
    var cur = data;
    for(var i=0;i<parts.length-1;i++){
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length-1]] = value;
    writeLegacy(data);
    return writeCanonical(data, 'set:' + path);
  }

  function getPath(path, fallback){
    var data = readCanonical();
    var cur = data;
    var parts = path.split('.');
    for(var i=0;i<parts.length;i++){
      if(cur == null || cur[parts[i]] === undefined) return fallback;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function logWeight(weightKg, date){
    var d = date || todayKey();
    var data = readCanonical();
    data.profile.current_weight_kg = num(weightKg, data.profile.current_weight_kg);
    data.progress.weight_logs[d] = { date: d, weight_kg: data.profile.current_weight_kg, source: 'data_layer' };
    safeSet('heartyTodayWeightKg', String(data.profile.current_weight_kg));
    safeSet('heartyTodayWeightKg:' + d, String(data.profile.current_weight_kg));
    safeSet('heartyCurrentWeightKg', String(data.profile.current_weight_kg));
    writeLegacy(data);
    return writeCanonical(data, 'weight_log');
  }

  function logHydration(litres, date){
    var d = date || todayKey();
    var data = readCanonical();
    var current = data.progress.hydration_logs[d] || { date: d, litres: 0, count: 0 };
    current.litres = Math.max(0, num(litres, current.litres || 0));
    current.count = Math.round(current.litres / 0.25);
    data.progress.hydration_logs[d] = current;
    return writeCanonical(data, 'hydration_log');
  }

  function setSupportState(state){
    var data = readCanonical();
    data.support.active_state = state || '';
    data.support.active_date = state ? todayKey() : '';
    if(state) safeSet('heartySupportState', state); else safeRemove('heartySupportState');
    return writeCanonical(data, state ? 'support_on' : 'support_off');
  }

  function setSocialEnabled(enabled){
    var data = readCanonical();
    data.settings.social_enabled = !!enabled;
    data.social.enabled = !!enabled;
    safeSet('heartySocialEnabled', String(!!enabled));
    safeSet('heartyCommunityEnabled', String(!!enabled));
    return writeCanonical(data, 'social_enabled');
  }

  function exportData(){ return clone(readCanonical()); }

  function importData(incoming){
    var merged = mergeDeep(readCanonical(), incoming || {});
    writeLegacy(merged);
    return writeCanonical(merged, 'import');
  }

  function patchLocalStorage(){
    if(localStorage.__heartyDataLayerPatched) return;
    var originalSetItem = localStorage.setItem.bind(localStorage);
    var originalRemoveItem = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function(key, value){
      var out = originalSetItem(key, value);
      if(!suppressPatch && typeof key === 'string' && key.indexOf('hearty') === 0 && key !== CANONICAL_KEY && key !== SYNC_QUEUE_KEY){ scheduleMigrate('legacy_set:' + key); }
      return out;
    };
    localStorage.removeItem = function(key){
      var out = originalRemoveItem(key);
      if(!suppressPatch && typeof key === 'string' && key.indexOf('hearty') === 0 && key !== CANONICAL_KEY && key !== SYNC_QUEUE_KEY){ scheduleMigrate('legacy_remove:' + key); }
      return out;
    };
    try { Object.defineProperty(localStorage, '__heartyDataLayerPatched', { value:true }); } catch(e){ localStorage.__heartyDataLayerPatched = true; }
  }

  function scheduleMigrate(reason){
    clearTimeout(migrateTimer);
    migrateTimer = setTimeout(function(){ migrate(reason); }, 120);
  }

  window.HeartyData = {
    version: VERSION,
    canonicalKey: CANONICAL_KEY,
    todayKey: todayKey,
    migrate: migrate,
    get: getPath,
    set: setPath,
    export: exportData,
    import: importData,
    logWeight: logWeight,
    logHydration: logHydration,
    setSupportState: setSupportState,
    setSocialEnabled: setSocialEnabled,
    isSocialEnabled: function(){ return getPath('settings.social_enabled', true) !== false; },
    queueKey: SYNC_QUEUE_KEY
  };

  patchLocalStorage();
  migrate('startup');
  window.addEventListener('beforeunload', function(){ try { migrate('beforeunload'); } catch(e){} });
})();
