# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## APK 배포 (발표용, 심사 없이 설치)

### 1) 최초 1회 설정

```bash
npm install
npx eas-cli login
npm run apk:configure
npm run apk:update:configure
```

- `apk:configure`: EAS Build 연결 및 `projectId` 설정
- `apk:update:configure`: OTA(EAS Update) 연결 설정

### 2) 클라우드에서 APK 빌드

```bash
npm run apk:build
```

- 완료 후 EAS에서 제공하는 URL로 APK 다운로드/공유
- 안드로이드 기기에서 URL 열어 바로 설치 가능

### 3) 수정사항 빠른 반영 (APK 재빌드 없이)

```bash
npm run apk:update -- --message "발표 직전 텍스트 수정"
```

- JS/TS/스타일/이미지 변경은 OTA 업데이트로 빠르게 반영 가능
- 설치된 앱을 재실행하거나 새로고침하면 최신 업데이트를 받음

### 4) APK 재빌드가 필요한 경우

- 네이티브 의존성 추가/변경
- `app.json`의 네이티브 설정(권한/패키지/플러그인 등) 변경
- Expo SDK 업그레이드
