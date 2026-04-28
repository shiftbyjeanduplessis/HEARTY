HEARTY Phase 1 patch

This is a stability patch, not a full refactor.

Included fixes:
- index.html: splash logo reduced, auth callback bounce fix, PWA links/service worker support retained.
- PWA files: manifest.json, service-worker.js, icons, hearty-logo.png.
- HOME.html: badges removed/hidden, medication CTA centered with text, hydration spacing, mobile spacing, first-use welcome dialog/scroll, weigh-in no longer auto-opens keyboard.
- meals.html: removes visible junk meal placeholder cards, adds first-use meal setup prompt, adds support mode chip.
- meals-onboarding.html: adds safe multi-select behavior for food preference buttons.
- EXERCISE.html: adds support for real exercise images if files exist in /exercise-images, /images/exercises, or /assets/exercises.
- PROGRESS.html: hides badge cabinet/reward overlay.
- SETTINGS.html: adds privacy note about medication/photos.

Notes:
- Browser install/fullscreen cannot be forced. Android can prompt; iPhone requires Share > Add to Home Screen.
- Exercise images still require actual image files with matching kebab-case names.
