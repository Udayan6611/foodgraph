# FoodGraph signup backend setup

The website signup page is already wired to the existing Apps Script web-app URL. The script below preserves the current Events GET tracking behavior and adds a separate Signups sheet for POST submissions.

## One-time deployment (about 3 minutes)

1. Open the existing FoodGraph Apps Script project that currently receives website tracking events.
2. Replace the contents of `Code.gs` with the complete code in this folder's `Code.gs`.
3. Save the project.
4. Select **Deploy → Manage deployments**.
5. Open the existing web app deployment, click the pencil icon, choose **New version**, and deploy. Keep the existing web app URL and access setting unchanged.
6. Approve the requested Google permissions if prompted.

Do not create a new deployment unless the existing deployment cannot be edited. The website already posts to the current web-app URL.

## What it changes

- Existing `doGet` event tracking remains intact and continues writing to the existing `Events` tab.
- New `doPost` signup submissions write to a separate `Signups` tab.
- The Signups tab is created automatically on the first valid signup. The new legal-acknowledgement columns are added to an existing Signups tab when the updated script first runs.
- Email addresses are normalized to lowercase and duplicate email submissions are not added twice.
- The required `legal_acknowledged` field is validated by the backend. The Signups sheet records the acknowledgement, legal-page version (`2026-11-09`) and acknowledgement timestamp. Repeated signups with an existing email also refresh those legal-acknowledgement fields.
- The separate product-updates `consent` field is recorded as `yes` or `no`; that checkbox remains optional.
- Referral, source, campaign, landing path, and session attribution are captured.
- A script lock protects duplicate checks and writes from simultaneous submissions.
- A hidden honeypot field filters basic bot submissions.

## Important

- Keep the web app's existing access setting so public website visitors can submit the form.
- Do not change or delete the existing Events tab.
- The website does not need a new URL after updating the existing deployment.
- After deploying the new Apps Script version, test using an email address you control. Confirm the legal acknowledgement is required, the product-updates checkbox can be left unchecked, and the Signups row records `legal_acknowledged`, `legal_version` and `legal_acknowledged_at`. Submit the same email again and confirm no duplicate row is added and the legal-acknowledgement fields are refreshed.
- The email is stored in the private Google Sheet. Limit access to people who need it.
