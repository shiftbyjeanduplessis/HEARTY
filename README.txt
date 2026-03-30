
HEARTY wiring starter package

What is included
- index.html (your uploaded landing page converted into the public entry page)
- login.html
- signup.html
- onboarding.html
- app.html (protected shell)
- js/config.example.js
- js/supabase-client.js
- js/auth.js
- css/auth.css
- legal placeholder pages
- sql/hearty_core_schema.sql

What you need to do
1. Copy js/config.example.js to js/config.js
2. Add your Supabase URL and anon key to js/config.js
3. Run sql/hearty_core_schema.sql in Supabase
4. Enable Email + Password auth in Supabase
5. Deploy the folder

Current flow
Landing -> Signup -> Onboarding -> App
Landing -> Login -> App or Onboarding

Notes
- This is a real wiring starter, not a final polished product build.
- It assumes your existing standalone HOME/MEALS/PROGRESS/SETTINGS files remain in the same folder.
- The app shell is intentionally lean so you can now wire real data into it.


V3 schema note:
- Your Supabase project already has profiles, purchases, billing_events, tester_invites, and access_grants.
- Run sql/hearty_missing_app_tables.sql instead of the older hearty_core_schema.sql file.
- Onboarding completion now lives in user_settings.onboarding_complete so the existing profiles table is left intact.
- Theme now lives in user_settings.theme.
