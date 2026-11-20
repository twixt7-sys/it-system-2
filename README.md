# LCC BSIT Evaluation & Survey System

React + Firebase version of `lcc-evaluation-system.html`. It looks the same as the mockup, but every sign-in, submission, form edit and account change is stored in **Cloud Firestore**.

- **Students** sign in with their student number (no OTP yet). They evaluate each teacher once per subject and answer the course delivery survey once. Answers are final: the security rules block any edit or resubmission.
- **Admin** signs in with a username and password. The five tabs are Overview, Respondents, Results, Form builder and Student accounts. Dashboards update live as students submit.
- Runs on the free **Spark** plan. There are no Cloud Functions.

---

## 1. Try it locally with no Firebase project (emulators)

You need Node 20+ and Java 11+ (both are already on this PC).

```bash
npm install
npm run emulators
```
Leave that running, then in a second terminal:
```bash
npm run seed:emulator
```
```bash
npm run dev:emulator
```
Open http://localhost:5173.
- **Student:** `2025-1101` (block 1-A) or `2025-1202` (block 1-B)
- **Admin:** username `admin`, password `bsit2026`. This password exists only in the local emulator.
- To see the stored data, open the emulator UI at http://127.0.0.1:4000/firestore.
- `npm run test:rules` runs 21 security-rule checks against the emulator.

---

## 2. Set up the real Firebase project (about 15 minutes, done once)

1. **Create the project.** Go to https://console.firebase.google.com, click **Add project**, name it (e.g. `lcc-bsit-eval`), and turn Google Analytics off.
2. **Create Firestore.** Go to **Build → Firestore Database → Create database**, choose **Production mode**, and pick the location **asia-southeast1 (Singapore)**. The location can't be changed later.
3. **Turn on sign-in methods.** Go to **Build → Authentication → Get started → Sign-in method** and enable:
   - **Anonymous** (used for student sign-in)
   - **Email/Password** (only the first toggle; used for the admin)
4. **Register the web app.** Go to **Project settings (gear icon) → General → Your apps**, click the **`</>`** icon, use the nickname `lcc-web`, and click Register. Keep the `firebaseConfig` values open.
5. **Create `.env.local`.** Copy `.env.example` to `.env.local` and paste in the config values:
   ```
   VITE_FB_API_KEY=AIza...
   VITE_FB_AUTH_DOMAIN=lcc-bsit-eval.firebaseapp.com
   VITE_FB_PROJECT_ID=lcc-bsit-eval
   VITE_FB_STORAGE_BUCKET=lcc-bsit-eval.firebasestorage.app
   VITE_FB_MESSAGING_SENDER_ID=1234567890
   VITE_FB_APP_ID=1:1234567890:web:abc123
   VITE_ADMIN_EMAIL_DOMAIN=lcc-bsit.app
   VITE_DEMO_MODE=false
   ```
   `VITE_DEMO_MODE=true` shows the dashed "Demo IDs" hints on the sign-in page.
6. **Download the service account key** (used only by the seed script). Go to **Project settings → Service accounts → Generate new private key** and save the file in this folder as **`serviceAccount.json`**. It is gitignored. **Never commit or share it.**
7. **Connect the CLI.** Run:
   ```bash
   firebase login
   ```
   ```bash
   firebase use --add
   ```
   Pick your project and give it the alias `default`.
8. **Deploy the security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```
9. **Seed the database** with the admin account, both forms, and the 12 sample students. Choose your own admin password of at least 6 characters:
   ```bash
   npm run seed -- --password YourAdminPassword
   ```
   Options:
   - `--no-students` skips the sample students.
   - `--force-forms` resets both forms to the original questions.
   - Running it again only changes the admin password. Existing forms and students are kept.
10. **Run the app locally against the real project:**
    ```bash
    npm run dev
    ```
    Sign in as admin with `admin` and your password.
11. **Put it online:**
    ```bash
    npm run deploy
    ```
    The first time, the CLI may ask you to set up Hosting. The config is already in `firebase.json`, so accept the defaults and **don't** overwrite `index.html`. The site goes live at `https://<project-id>.web.app`.

**Going live with real students:**
- Delete the sample students in **Student accounts**, or seed with `--no-students`.
- Then **Import CSV** your real enrollment list. The columns are `no, student id, name, group, course, instructor`, with one row per subject.

**Adding more admins:**
1. Create the user under **Authentication → Users → Add user**.
2. In **Firestore**, add a document to the `admins` collection. Its **document ID** must be that user's **UID**, with the field `email`.

---

## How it works

| Collection | Doc ID | Contents |
|---|---|---|
| `students` | student number | `name`, `group`, `load: [{course, instructor}]` |
| `forms` | `faceval`, `survey` | the full questionnaire (sections, items, scale) |
| `responses` | `studentId__formId__targetId` | the answers. Create-only, so a form can't be edited or resubmitted |
| `sessions` | anonymous uid | links a student's sign-in to their student number |
| `admins` | admin uid | marks a login as administrator |

- `firestore.rules` holds all the permission logic:
  - Students can look up one student record, but can't list the roster.
  - Students can submit only for subjects on their own load, and only once.
  - Students can read only their own responses.
  - Only admins can list students, read all responses, or edit forms and accounts.
- Admin views and exports never show which student wrote which answer. The raw JSON export also drops `studentId`.

### Project layout
```
src/
  styles/app.css         original mockup CSS, unchanged
  styles/extra.css       small additions (toast fix, busy buttons)
  firebase.js            Firebase init (+ emulator switch)
  data/api.js            every Firestore/Auth write
  context/               Auth (role), Data (live snapshots), UI (theme, toast, modal)
  components/            top bar + sidebar, background grid, import/export modal
  pages/                 Auth, StudentHome, EvalPicker, FormView
  pages/admin/           Overview, Respondents, Results, FormBuilder, Accounts
scripts/
  seed.mjs, seed-data.mjs  database setup
  test-rules.mjs           security-rules smoke test (emulator)
```

### Changing the background photo
In `src/styles/app.css`, replace `--bg-photo: url(...)` at the top. For example, put `campus.jpg` in `public/` and use `url("/campus.jpg")`.

### Adding OTP later
Moving to the Blaze plan allows a Cloud Function to email a 6-digit code and return a custom token. `studentSignIn` in `src/data/api.js` is the only place that would change. The OTP styles are still in `app.css`.
