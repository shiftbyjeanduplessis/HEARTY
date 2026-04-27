# Hearty Meals Production Wired Files

This package helps with steps 3 and 4.

## Files
- `001_meals_schema.sql`
- `hearty-meals-db-bridge.js`
- `meals-onboarding.html`
- `meals.html`

## Step 3: Onboarding save
`meals-onboarding.html` now loads `hearty-meals-db-bridge.js`.

When the user finishes onboarding, it saves preferences to:
- localStorage
- Supabase `meal_preferences`

## Step 4: Meals page load/save
`meals.html` now loads:
- `hearty-meals-db-bridge.js`
- production hooks

The page now:
- tries to load the saved plan from Supabase
- saves generated plans to `meal_plans`
- saves preference changes
- saves lock/regenerate changes by re-saving the current plan

## Before testing
1. Run `001_meals_schema.sql` in Supabase SQL Editor.
2. Confirm the user is logged in before Meals loads.
3. Confirm your app creates `window.supabaseClient` before `hearty-meals-db-bridge.js`.

## Test
1. Log in.
2. Complete onboarding.
3. Generate a meal plan.
4. Refresh.
5. Confirm the same plan loads.
6. Log out/in.
7. Confirm the same plan still loads.
