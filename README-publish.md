# Publish the Family Step Challenge — 15 minutes, 3 steps

You do everything once. The family just taps a WhatsApp link — zero setup on
their phones.

---

## Step 1 — Deploy the Google Sheet backend (~7 min)

1. Open (or create) the Google Sheet you want as the family record.
2. **Extensions → Apps Script**. Delete any code in the editor and paste the
   whole of `google-apps-script.gs`. Save (💾).
3. Click **Deploy → New deployment**.
4. Click the gear next to "Select type" → **Web app**.
5. Set:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← this is the one people get wrong.
     ("Anyone" means anyone *with the URL* can read/write this one sheet tab —
     the URL is unguessable, and it's a family game, so this is fine.)
6. Click **Deploy**, approve the permissions prompts (Advanced → Go to
   project → Allow), and **copy the Web app URL** — it looks like
   `https://script.google.com/macros/s/AKfycb…/exec`.

⚠️ If you later edit the script, use **Deploy → Manage deployments → ✏️ edit →
New version** — a fresh "New deployment" changes the URL and orphans the family.

## Step 2 — Bake the URL into the app (~1 min)

Open `step-challenge.html` in any text editor, find this near the top of the
`<script>` block:

```js
const BAKED_SYNC_URL = "";
```

Paste your Web app URL between the quotes. Save.

(Alternative: skip editing and instead share the link as
`https://your-host/step-challenge.html?sync=PASTE_URL_HERE` — the app reads
`?sync=` and saves it. Baking it in is cleaner for WhatsApp.)

## Step 3 — Host the file (~5 min)

Any static host works. Two easy options:

**GitHub Pages** (free, permanent, you already have GitHub):
1. Create a public repo, e.g. `step-challenge`.
2. Upload `step-challenge.html` and rename it `index.html`.
3. Repo **Settings → Pages → Deploy from branch → main / root → Save**.
4. Your link: `https://<username>.github.io/step-challenge/` (live in ~1 min).

**tiiny.host** (fastest — drag & drop, no repo): upload the file, get a link.
Free tier links expire, so treat it as a stopgap and move to Pages when calm.

Then WhatsApp the link to the family. Suggest they use "Add to Home Screen"
from the browser menu — it then opens like an app.

---

## How the two-way sync works (so you can debug it)

- The **Sheet is the shared source of truth**; each phone keeps a local copy
  (localStorage) so the app opens instantly and works offline-ish.
- **Phone → Sheet:** every toggle tap POSTs that one entry immediately.
- **Sheet → phones:** each phone re-fetches every 25 s, plus the moment the
  app returns to the foreground. Editing TRUE/FALSE cells in the Sheet by
  hand is fine — phones pick it up on the next poll.
- **First connect:** if the Sheet is empty, the first phone that connects
  copies its data up (seeding). If the Sheet has data, the Sheet wins.
- **Conflicts:** last write wins. For a family game this is plenty; two
  people editing the same person's toggle within the same minute is the only
  losable case.
- Players, entry fee and the sync URL live per phone; a player **added** in
  the Sheet propagates to phones automatically. Removing a player is done in
  each app's Settings (or just delete their rows and ignore them).

## Test it before sharing (2 min)

1. Open your hosted link on your phone → flip your own "Playing" toggle.
2. Watch the `Weeks` tab in the Sheet — a row should appear within a second.
3. Change that row's `completed` to TRUE in the Sheet → within ~25 s the app
   shows it (or immediately after you background/foreground the app).

If step 2 fails: almost always the Web app was deployed with access
"Only myself" instead of "Anyone" — redeploy with a new version.
