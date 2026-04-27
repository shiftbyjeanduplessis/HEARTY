// HEARTY Exercise local-first Supabase sync adapter.
// Replace SUPABASE_URL and SUPABASE_ANON_KEY via your existing app config.

const HEARTY_EXERCISE_SYNC_KEY = "hearty_exercise_sync_queue_v1";

export function queueExerciseSyncEvent(event) {
  const queue = JSON.parse(localStorage.getItem(HEARTY_EXERCISE_SYNC_KEY) || "[]");
  queue.push({
    client_event_id: event.client_event_id || crypto.randomUUID(),
    event_type: event.event_type,
    payload: event.payload,
    created_at: new Date().toISOString()
  });
  localStorage.setItem(HEARTY_EXERCISE_SYNC_KEY, JSON.stringify(queue));
}

export async function flushExerciseSyncQueue(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_authenticated" };

  const queue = JSON.parse(localStorage.getItem(HEARTY_EXERCISE_SYNC_KEY) || "[]");
  if (!queue.length) return { ok: true, synced: 0 };

  const remaining = [];
  let synced = 0;

  for (const item of queue) {
    const payload = {
      user_id: user.id,
      client_event_id: item.client_event_id,
      event_type: item.event_type,
      payload: item.payload
    };

    const { error } = await supabase
      .from("exercise_sync_events")
      .upsert(payload, { onConflict: "user_id,client_event_id" });

    if (error) remaining.push(item);
    else synced++;
  }

  localStorage.setItem(HEARTY_EXERCISE_SYNC_KEY, JSON.stringify(remaining));
  return { ok: true, synced, remaining: remaining.length };
}

export function attachExerciseSyncListeners(supabase) {
  window.addEventListener("online", () => flushExerciseSyncQueue(supabase));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushExerciseSyncQueue(supabase);
  });
}
