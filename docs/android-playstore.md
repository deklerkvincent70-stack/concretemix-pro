# ConcreteMix Pro Android / Play Store Build

ConcreteMix Pro uses Capacitor to package the offline web app as an Android app.

## What is already set up

- Capacitor config: `capacitor.config.ts`
- Android project: `android/`
- Mobile static export command: `npm.cmd run build:mobile`
- Android sync command: `npm.cmd run android:sync`

## Required once on the build computer

Install Android Studio, including:

- Android SDK
- Android SDK Platform
- Android SDK Build-Tools
- Android Emulator, optional
- JDK, included with Android Studio

After Android Studio is installed, open it once and let it finish setup.

## Update the Android app after web changes

Run from the project folder:

```powershell
cd "D:\Vincent\Documents\ConcreteMix Pro"
npm.cmd run build:mobile
npm.cmd run android:sync
```

## Open Android Studio

```powershell
cd "D:\Vincent\Documents\ConcreteMix Pro"
npm.cmd run android:open
```

Android Studio should open the `android` project.

## Build for testing

In Android Studio:

1. Wait for Gradle sync to finish.
2. Connect an Android phone with USB debugging enabled, or start an emulator.
3. Click Run.

## Build for Play Store

For Play Store upload, build an Android App Bundle:

1. In Android Studio, choose `Build`.
2. Choose `Generate Signed Bundle / APK`.
3. Choose `Android App Bundle`.
4. Create or select a signing key.
5. Build the release `.aab`.

Keep the signing key safe. Losing it can prevent future Play Store updates.
