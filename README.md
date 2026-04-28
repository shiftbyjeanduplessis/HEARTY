# Hearty Home Onboarding + Lessons Pack

## Add files

1. Put `js/hearty-lessons.v1.js` into your repo at:

```txt
/js/hearty-lessons.v1.js
```

2. In `home.html`, near the bottom before `</body>`, add:

```html
<script src="./js/hearty-lessons.v1.js"></script>
```

3. Then paste the contents of:

```txt
home-onboarding-and-lessons-patch.html
```

directly after that script include and still before `</body>`.

## Includes

- Name onboarding modal
- Supabase profile save for name
- Placeholder data removal
- Badge box removal
- Empty medication state
- 10 daily lessons
- Max one lesson completed per calendar day
- Lesson card disappears after lesson 10

## Home onboarding rules locked

- “What should we call you?” is a modal, not a task.
- Daily Rhythm becomes “Welcome to Hearty” during first setup.
- Intro task list:
  - Add today’s weight
  - Take first progress photo
  - Set medication schedule
  - Complete a 15-minute walk
- Front photo is required.
- Side/back photos are optional.
- Photos stay local/device-only.
- Every task must survive interruption.
