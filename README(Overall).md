# Planora — Personal Task Manager with AI Assistant

**ITMAWD11A - Group 1**

📃Planora is a productivity app that helps you manage tasks, notes, and focus sessions. It comes with a built-in AI chat assistant named Nora that can help plan your day, create tasks through conversation, and give you productivity insights.

🔗Fun fact: Nora is not running with LLM or any OpenAI Agent APIs, instead, I manually programmed every command alongside it's Text/Data Extractor to understand our users. That's why it doesn't rely on any paid usages and even internet connection itself. She was built for almost a month of hardwork and sleepless nights (￣o￣) . z Z.
---

## What's in this folder

| Folder | What it is |
|--------|------------|
| `Planora/` | The Android app source code (Java, Gradle project) |
| `Planora-Official-Webpage/` | Official landing page for the app |
| `Planora-Official-Webpage/app/` | Web version of the app (works in browser) |
| `Planora-Documentation/` | Final documentation (PDF + DOCX) and screenshots |
| `Planora-PPT/` | Presentation slides |

---

## Quick Setup Guide (@kkyleee23 on github)

### Android App

1. Open Android Studio
2. Click **File > Open** and select the `Planora/` folder
3. Wait for Gradle sync to finish (it'll download dependencies automatically)
4. Connect a device or start an emulator (minimum API 26 / Android 8.0)
5. Hit the green Run button

That's it. Our app uses SQLite locally so there's no server or database setup needed.

**Important:** If the project won't sync or build, it's probably a version mismatch. Make sure you're using the same versions we used (listed below). Mismatched AGP or Gradle versions will cause errors on import.

| Tool | Version we used |
|------|-----------------|
| Android Studio | Meerkat (2024.3+) or newer |
| Android Gradle Plugin (AGP) | 8.13.2 |
| Gradle | 8.13 |
| Java | 11 |
| compileSdk / targetSdk | 35 (Android 15) |
| minSdk | 24 (Android 7.0) |

If Android Studio asks you to update the Gradle plugin, **don't** — just use the versions above. If you're on an older Android Studio that doesn't support AGP 8.13, you'll need to update Android Studio first.

### Web App

1. Open `Planora-Official-Webpage/app/index.html` in any browser
2. Done — it runs entirely in the browser using localStorage

No build tools, no npm install, no server required. Just open the HTML file.

### Landing Page

Same deal — open `Planora-Official-Webpage/index.html` in a browser. It's a static site.

---

## App Features (quick overview)

- **Tasks** — create, edit, set due dates, priorities, categories, recurring schedules
- **Notes** — rich text editor with color coding
- **Focus Timer** — pomodoro-style timer with break cycles and session history
- **Calendar View** — see tasks by date, add tasks to specific days
- **Nora (AI Chat)** — natural language task creation, daily briefings, weekly planning, productivity tips
- **Smart Notifications** — deadline reminders, overload detection, completion celebrations, nudges
- **Progress Tracking** — streaks, achievements, productivity insights, peak hour detection
- **Dark Mode** — full dark theme support
- **Backup/Export** — JSON backup, CSV and PDF export

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Android app | Java, SQLite, Material Design, WorkManager, AlarmManager |
| Web app | Vanilla JS (jQuery), localStorage, CSS |
| Landing page | HTML/CSS/JS (static, no frameworks) |

---

## Screenshots

Screenshots of all the main screens are in `Planora-Documentation/screenshots/`. Here's what you'll find:

- Login & registration flow
- Dashboard home screen
- Task list and task details
- Calendar view
- Notes editor
- Focus timer
- Progress/stats screen
- Nora chat assistant
- Dark mode
- Notifications

---

## Building the APK

If you want to generate a signed release APK:

1. In Android Studio, go to **Build > Generate Signed Bundle / APK**
2. Select APK
3. Create or select a keystore
4. Choose the `release` build variant
5. The APK will be in `Planora/app/build/outputs/apk/release/`

For a debug APK (no signing needed), just run:
```
cd Planora
./gradlew assembleDebug
```

---

## Project Structure (Android)

```
Planora/
  app/
    src/main/
      java/com/example/rojjava/   ← all Java source files
      res/
        layout/                   ← XML layouts
        drawable/                 ← icons and shapes
        font/                     ← Plus Jakarta Sans font files
        values/                   ← colors, strings, themes
      AndroidManifest.xml
    build.gradle.kts
  build.gradle.kts                ← project-level gradle config
  settings.gradle.kts
```

Key source files:
- `DashboardActivity.java` — main screen with bottom navigation
- `NoraChatFragment.java` — the Nora chat interface
- `NoraChatEngine.java` — handles conversation logic and memory
- `IntentClassifier.java` — classifies what the user is asking Nora
- `TaskDbHelper.java` — all database operations
- `FocusTimerService.java` — foreground service for the pomodoro timer
- `NotificationHelper.java` — schedules task reminders
- `NoraNudgeWorker.java` — periodic smart notifications

---

## Group Members

1. Juniz Kyle M. Sarmiento - Team/Group Leader, Solo Developer, Finalized both the documentation paper and designed the Powerpoint Presentation.
2. Jenine Hayden Dael - Gave 2 specific content for the presentation and documentation.
3. Daniella Caparas - Gave 1 specific content for the presentation and documentation.
4. Allesandro Gonzales - Gave 1 specific content for the presentation and documentation.
5. Tiffany Carlos - No contribution.


---

## Version Info

| | |
|--|--|
| App version | 3.0.0 (versionCode 7) |
| Min Android version | 7.0 Nougat (API 24) |
| Target/Compile SDK | 35 (Android 15) |
| AGP | 8.13.2 |
| Gradle | 8.13 |
| Java compatibility | 11 |
| Material Components | 1.13.0 |
| AndroidX AppCompat | 1.7.1 |
| WorkManager | 2.9.1 |

---

## Notes

- No external API keys or internet connection required — everything runs offline
- The web version shows similarity with our Android app's core features but stores data in the browser's localStorage
- If you get a "Failed to find target" error, make sure you have SDK 35 installed via SDK Manager
