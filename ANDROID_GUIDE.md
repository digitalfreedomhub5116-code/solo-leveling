
# How to Build the REFORGE APK

Since you have the source code, you can build the Android App (APK) in a few simple steps.

## Prerequisites
1. **Node.js** installed on your computer. (Download from nodejs.org)
2. **Android Studio** installed (Download from developer.android.com).

## 1. Open the Terminal
Before running commands, you need a terminal window open inside this project folder.

**Windows (Easiest Way):**
1. Open this folder in File Explorer.
2. Click the **Address Bar** at the top.
3. Type `cmd` and press **Enter**.

**Mac:**
1. Right-click this folder.
2. Select **New Terminal at Folder**.

**VS Code (Recommended):**
1. Open this folder in VS Code.
2. Press `Ctrl + ~` (Control + Tilde) to open the integrated terminal.

## 2. Install Dependencies
In your terminal, run:
```bash
npm install
```

## 3. Initialize Android Project
Run the automated build script:
```bash
npm run build:android
```
*This command will:*
*   Build the web app.
*   Create the Android native project.
*   Sync your code to the Android project.
*   **Open Android Studio automatically.**

## 4. Generate APK (In Android Studio)
1.  Wait for the project to sync (look for loading bars at the bottom right).
2.  Go to the top menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Wait for the build to finish. A popup will appear in the bottom right corner.
4.  Click **locate** in that popup to find your `.apk` file (usually named `app-debug.apk`).

## 5. Install on Phone
1.  Transfer that `.apk` file to your Android phone (via USB, Google Drive, or email).
2.  Tap the file on your phone to install it.
3.  **Note:** You may need to allow "Install from Unknown Sources" in your phone settings since this is a self-built app.
