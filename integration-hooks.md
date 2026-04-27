# Integration hooks

## Onboarding finish()

After writing localStorage:

```js
try {
  if (window.HeartyMealsDB) {
    await window.HeartyMealsDB.saveMealPreferences(normalized.pageState);
  }
} catch (error) {
  console.warn("Preferences saved locally, database save failed:", error);
}
```

## Meals page load

Before auto-generating:

```js
try {
  if (window.HeartyMealsDB) {
    const result = await window.HeartyMealsDB.bootstrapMealsFromDatabase();
    if (result.hasPlan) {
      window.HeartyOnboardingAwareMeals?.renderAll?.();
      return;
    }
  }
} catch (error) {
  console.warn("DB load failed, using local cache:", error);
}
```

## After generating a week

```js
try {
  await window.HeartyMealsDB?.saveCurrentMealPlan(
    window.HeartyMealsDB.readLocalState(),
    { eventType: "generated_week" }
  );
} catch (error) {
  console.warn("Plan saved locally, DB save failed:", error);
}
```

## After locking/unlocking

```js
try {
  await window.HeartyMealsDB?.updateLockedMeals(lockedMeals);
  await window.HeartyMealsDB?.logMealEvent({
    eventType: locked ? "locked_meal" : "unlocked_meal",
    dayIndex,
    mealSlot,
    details: { key }
  });
} catch (error) {
  console.warn("Lock state saved locally, DB save failed:", error);
}
```
