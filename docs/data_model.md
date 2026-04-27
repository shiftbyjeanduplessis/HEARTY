# Exercise Data Model

## exercise_sessions

One row per workout attempt or completed workout.

Important fields:

- `mode`: home or gym
- `support_mode_active`: true/false
- `started_at`
- `completed_at`
- `status`

## exercise_session_items

One row per exercise inside a session.

Important fields:

- `pattern`: squat, push, pull, hinge, core
- `exercise_id`
- `level`
- `weight_kg`
- `reps_completed`
- `controlled`
- `progression_paused`

## exercise_progress

Current progression state per user, mode, pattern, and exercise.

Home uses:

- `level`
- `top_rep_confirmations`

Gym uses:

- `weight_kg`
- `top_rep_confirmations`

## exercise_sync_events

Idempotent local-first queue table.

Purpose:

- prevent duplicate inserts
- preserve offline completion events
- allow future backend processing for badges/reports
