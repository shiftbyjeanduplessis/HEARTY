/* Optional Hearty Supabase Sync v1
   Requires window.supabaseClient or window.supabase to be an initialized Supabase client.
   This file never syncs progress photos/images. It only syncs metadata and logs.
*/
(function(){
  'use strict';
  if(!window.HeartyData) return;

  function client(){ return window.supabaseClient || window.heartySupabase || window.supabase || null; }
  function today(){ return window.HeartyData.todayKey(); }
  function entries(obj){ return Object.keys(obj || {}).map(function(k){ return obj[k]; }); }

  async function currentUser(sb){
    if(!sb || !sb.auth || !sb.auth.getUser) return null;
    var res = await sb.auth.getUser();
    return res && res.data && res.data.user ? res.data.user : null;
  }

  async function syncNow(){
    var sb = client();
    if(!sb || !sb.from) return { ok:false, reason:'No Supabase client found on window.' };
    var user = await currentUser(sb);
    if(!user) return { ok:false, reason:'No authenticated user.' };

    var data = window.HeartyData.migrate('sync_start');
    var now = new Date().toISOString();

    await sb.from('profiles').upsert({
      user_id: user.id,
      first_name: data.profile.first_name || null,
      user_name: data.profile.user_name || null,
      account_email: data.profile.account_email || user.email || null,
      height_cm: data.profile.height_cm,
      starting_weight_kg: data.profile.starting_weight_kg,
      current_weight_kg: data.profile.current_weight_kg,
      target_weight_kg: data.profile.target_weight_kg,
      medication_name: data.profile.medication_name || null,
      injection_name: data.profile.injection_name || null,
      injection_dose: data.profile.injection_dose || null,
      injection_day: data.profile.injection_day || null,
      updated_at: now
    }, { onConflict:'user_id' });

    await sb.from('user_settings').upsert({
      user_id: user.id,
      theme: data.settings.theme,
      units_system: data.settings.units_system,
      hydration_auto: data.settings.hydration_auto,
      hydration_target_litres: data.settings.hydration_target_litres,
      social_enabled: data.settings.social_enabled,
      injection_reminder_enabled: data.settings.injection_reminder_enabled,
      photo_privacy: data.settings.photo_privacy || 'local_only',
      onboarding_complete: data.settings.onboarding_complete,
      updated_at: now
    }, { onConflict:'user_id' });

    var weights = entries(data.progress.weight_logs).filter(Boolean).map(function(row){
      return { user_id:user.id, log_date:row.date || today(), weight_kg:row.weight_kg, source:row.source || 'app', updated_at:now };
    }).filter(function(row){ return row.weight_kg != null; });
    if(weights.length) await sb.from('weight_logs').upsert(weights, { onConflict:'user_id,log_date' });

    var hydration = entries(data.progress.hydration_logs).filter(Boolean).map(function(row){
      return { user_id:user.id, log_date:row.date || today(), litres:row.litres || 0, glass_count:row.count || 0, updated_at:now };
    });
    if(hydration.length) await sb.from('hydration_logs').upsert(hydration, { onConflict:'user_id,log_date' });

    var injections = entries(data.progress.injection_logs).filter(Boolean).map(function(row){
      return { user_id:user.id, log_date:row.date || today(), logged:!!row.logged, updated_at:now };
    });
    if(injections.length) await sb.from('injection_logs').upsert(injections, { onConflict:'user_id,log_date' });

    var supportLogs = (data.support.symptom_logs || []).map(function(row){
      return {
        user_id:user.id,
        log_date:row.date || today(),
        nausea:Number(row.nausea || 0),
        low_appetite:Number(row.lowAppetite || row.appetite || row['low appetite'] || 0),
        fatigue:Number(row.fatigue || 0),
        constipation:Number(row.constipation || 0),
        raw:row,
        updated_at:now
      };
    });
    if(supportLogs.length) await sb.from('support_logs').upsert(supportLogs, { onConflict:'user_id,log_date' });

    await sb.from('social_settings').upsert({
      user_id:user.id,
      enabled: data.social.enabled,
      share_photos_updates: data.social.share_photos_updates,
      share_water: data.social.share_water,
      posts_local_only: true,
      updated_at: now
    }, { onConflict:'user_id' });

    data.meta.last_sync_at = now;
    window.HeartyData.import(data);
    try { localStorage.setItem(window.HeartyData.queueKey, '[]'); } catch(e){}
    return { ok:true, synced_at:now };
  }

  window.HeartySync = { syncNow: syncNow };
  window.addEventListener('online', function(){ syncNow().catch(function(){}); });
  setTimeout(function(){ syncNow().catch(function(){}); }, 1200);
})();
