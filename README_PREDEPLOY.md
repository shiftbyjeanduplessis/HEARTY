# Hearty Predeploy Data Layer Package

This package adds a shared storage bridge without breaking deployed Meals and Exercise.

## Files

- `js/hearty-data-layer.v1.js`  
  Local-first compatibility bridge. Reads existing `hearty...` localStorage keys and writes one canonical record: `hearty:data:v1`.

- `js/hearty-supabase-sync.v1.js`  
  Optional Supabase sync layer. Only runs when an initialized Supabase client exists on `window.supabaseClient`, `window.heartySupabase`, or `window.supabase`.

- `supabase/hearty_predeploy_schema.sql`  
  Supabase tables and RLS policies for settings + progress.

- `pages/`  
  Patched copies of Home, Settings, Support and Community with the data layer script tag inserted.

## Deploy order

1. Upload `/js/hearty-data-layer.v1.js` to your app.
2. Replace the four pages with the patched versions from `/pages`.
3. Test locally/deployed with existing Meals and Exercise untouched.
4. Run `supabase/hearty_predeploy_schema.sql` in Supabase SQL Editor.
5. Only after your Supabase client is present on the page, upload and include `hearty-supabase-sync.v1.js`.

## What stays local-only

Progress photos/images stay local-only. This package only stores photo check-in metadata such as date and count.

## Canonical local key

`hearty:data:v1`

This becomes the clean shared app state while old keys continue to work.
