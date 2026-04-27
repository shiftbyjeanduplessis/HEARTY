HEARTY Exercise Supabase Wiring

Files changed/added:
- EXERCISE.html
- supabase-client.js
- frontend/exercise_sync_adapter.js

Deploy these files with your existing images folder:
- images/exercises/home/...
- images/exercises/gym/...

Test:
1. Log in.
2. Open Exercise.
3. Finish a workout.
4. In Supabase Table Editor, open exercise_sync_events.
5. Confirm a row appears with event_type = exercise_session_completed.

Notes:
- The Exercise page still saves locally first.
- Supabase sync is queued and retried when online / app visible.
- The adapter writes to exercise_sync_events using the logged-in Supabase user.
