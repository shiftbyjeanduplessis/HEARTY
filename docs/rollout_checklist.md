# Exercise Production Rollout Checklist

## 1. Supabase

- Run `supabase/exercise_schema.sql`.
- Confirm RLS is enabled.
- Confirm authenticated users can insert their own sessions.
- Confirm users cannot read another user’s exercise data.

## 2. Frontend

- Add Supabase client to the app shell.
- Import `frontend/exercise_sync_adapter.js`.
- Queue a sync event whenever a workout is completed.
- Flush queue on app open, online event, and successful login.

## 3. Exercise Page

Confirm:

- Exercise nav strip shows Exercise as active.
- Home/Gym toggle persists.
- Home progress and Gym progress store separately.
- Support mode reads from the shared support key.
- Support mode reduces session and pauses progression.
- Workout is still usable offline.
- Completed workout survives refresh.

## 4. Progression

Home:

- Level up only after top reps are hit twice.
- Support mode does not level up.
- Level does not exceed max ladder level.

Gym:

- Weight only increases after top reps are hit twice at the same weight.
- Increase is +5kg.
- Support mode keeps or reduces weight and pauses progression.

## 5. Final QA

Test on:

- Chrome desktop
- Android PWA install
- iPhone Safari / Add to Home Screen
- Offline mode
- Slow connection
