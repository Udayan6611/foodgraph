# FoodGraph authentication design

## Status

Design only. No signup/sign-in UI, new Auth provider, user creation or session has been enabled for the website. The existing Discover page explicitly says no account is required and continues to store anonymous preference/feedback state in the browser.

## Current verified foundation

The connected Supabase project has an `auth.users` insert trigger named `on_auth_user_created` that calls `public.handle_new_auth_user()`. The function is present and the trigger is registered. A new Auth user is intended to create:
- one `public.users` identity row;
- one private `public.user_profiles` row;
- one private `public.user_privacy_settings` row.

At the time of this design review, both `auth.users` and the three FoodGraph user/profile tables contain zero rows. No real test account was created.

Defaults in the current schema:
- `user_profiles.profile_visibility = private`;
- diary, visit and taste-profile visibility defaults are private;
- `allow_taste_matching = false`;
- `allow_activity_sharing = false`.

## Recommended first authentication slice

Start with email/password authentication for the first account flow, subject to confirming email delivery and recovery settings in the project. Do not add social login or phone/SMS authentication in the first slice. This keeps third-party credentials, SMS costs and provider setup out of the initial release.

Implementation should use the official `@supabase/supabase-js` client, pinned to an exact version with a committed lockfile. The current site has no package manager or build step, so decide the smallest preview-only build approach before adding the SDK to the production page. Do not hand-roll password storage, JWT parsing or refresh-token rotation.

Use the project's modern `sb_publishable_` key in browser code. It is designed to be public and remains constrained by grants/RLS. Never place an `sb_secret_` or service-role key in a browser, static asset, build output or client-side environment variable.

## Consent and onboarding sequence

1. Explain the account purpose and privacy choices before sign-up.
2. Create the Supabase Auth identity; let the database trigger create the FoodGraph identity/profile/privacy rows.
3. Ask the user to set a handle/display name and optionally location context. Keep the profile private.
4. Capture purpose-specific consent in `user_consents` with the notice version and capture method. Do not treat general Terms acceptance as consent to social sharing, location check-ins, receipt processing, analytics or taste matching.
5. Keep the taste diary, visits, evidence and interactions private unless the user explicitly changes a specific visibility setting.
6. Offer importing browser-stored anonymous preferences only through a separate explicit choice. Never silently convert `foodgraph_behavior_v1` or anonymous visitor/session IDs into an account history.

## Authorization rules

- Authenticate with Supabase Auth; authorize every query through database RLS.
- Do not trust `raw_user_meta_data` / `user_metadata` for authorization decisions. It is user-editable. Keep authoritative role/permission attributes in server-controlled `app_metadata` only if a future use case requires them.
- Keep the `service_role` / secret key server-only. Browser clients use the publishable key.
- A signed-in role alone is not authorization. Policies must continue to check row ownership with `(select auth.uid()) = user_id` (or the correct owner field).
- Keep computed taste profiles, similarity snapshots and recommendation runs/items read-only to browser clients.
- Do not turn on connections/circles/public profile access until block-aware read/write policies are specified and tested.

## Session and account lifecycle

The Auth SDK should manage session refresh and sign-out. Do not implement custom refresh-token storage or log access/refresh tokens. Supabase sessions use short-lived access tokens and refresh tokens; signing out removes relevant sessions, but a JWT can remain valid until expiration unless a sensitive operation also verifies the session. For strict session invalidation on sensitive endpoints, evaluate checking the JWT `session_id` against `auth.sessions`.

Account deletion must be a reviewed server-side process: revoke sessions, process associated FoodGraph rows and evidence, retain or remove minimal tombstones where required, and confirm the resulting retention policy. Never implement account deletion by deleting the browser's local storage alone.

## Email delivery and release gate

Supabase's built-in email service is best-effort and rate-limited; custom SMTP is recommended for production use. Do not promise dependable email confirmation or password recovery until the project's Auth email settings and delivery path have been verified. Do not add a paid SMTP provider without approval.

Before any public signup launch, run a disposable-account test covering:
- signup and confirmation behavior;
- trigger-created `users`, `user_profiles` and `user_privacy_settings` rows;
- private defaults and owner-only RLS;
- sign-in, refresh, sign-out and password recovery;
- attempts to read/change another user's rows;
- account deletion and session invalidation design;
- consent capture, withdrawal and anonymous-preference import boundaries.

## Not included

No UI change, new Auth configuration, OAuth provider, SMTP provider, Edge Function, service-role secret or hosted database migration is part of this design document.
