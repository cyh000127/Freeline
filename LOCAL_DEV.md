# Freeline 로컬 개발 환경 가이드

> 백엔드는 **Docker 빌드 없이 네이티브 실행**
> DB/Redis/RabbitMQ와 AI 서버만 Docker로 띄움
> 프론트엔드는 `npm run dev`로 네이티브 실행

---

## 사전 준비

| 도구             | 버전  | 확인 명령                |
| ---------------- | ----- | ------------------------ |
| Java             | 21    | `java -version`          |
| Docker + Compose | 최신  | `docker compose version` |
| Node.js          | 20+   | `node -v`                |
| Python           | 3.10+ | `python --version`       |
| Infisical CLI    | 최신  | `infisical --version`    |

Infisical 로그인 (최초 1회):

```powershell
infisical login
```

```powershell
infisical init
```

---

## Step 1. Docker 네트워크 생성 (최초 1회)

```powershell
cd infra/networks/
docker compose up -d
```

> `infra-public` 브리지 네트워크를 만듭니다. 이후 모든 컨테이너가 이 네트워크를 공유합니다.

---

## Step 2. 인프라 컨테이너 실행 (PostgreSQL + Redis + RabbitMQ)

```powershell
cd infra/backend/
infisical run --path="/be" -- docker compose up freeline-db freeline-redis freeline-rabbitmq -d
```

> `freeline-backend` 서비스는 네이티브로 따로 실행합니다.

헬스체크 확인:

```powershell
docker ps
# freeline-db, freeline-redis, freeline-rabbitmq 모두 healthy 상태여야 함
```

### 포트 충돌 시 (5432 / 6379 / 5672 등이 이미 사용 중)

```powershell
netstat -ano | findstr :5672
taskkill /PID <PID> /F
```

---

## Step 3. AI 비전 서버 실행

부스맵 이미지 분석 기능에 필요한 FastAPI 서버입니다.
백엔드 `ai.vision.url` 기본값이 `http://localhost:8000`이므로 별도 환경변수 불필요.

파이썬이 로컬에 없을 시 먼저 설치.

```powershell
winget install Python.Python.3.10
```

```powershell
$pythonPath = "$env:LOCALAPPDATA\Programs\Python\Python310"
$scriptsPath = "$pythonPath\Scripts"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$pythonPath*") { $currentPath += ";$pythonPath" }
if ($currentPath -notlike "*$scriptsPath*") { $currentPath += ";$scriptsPath" }
[Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
```

```powershell
cd ai/vision-server/

# 최초 1회: 가상환경 + 패키지 설치
python -m venv venv
.\venv\Scripts\Activate.ps1
where.exe python
pip install -r requirements.txt

# 이후 실행
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

정상 확인: `curl http://localhost:8000/health` → `{"status":"ok"}`

> `--reload` 옵션으로 코드 수정 시 자동 재시작됩니다.

---

## Step 4. 백엔드 실행 (Spring Boot 네이티브)

Docker 빌드 없이 Gradle로 직접 실행 → **코드 수정 후 재시작이 빠름**

```powershell
cd be/Freeline/
infisical run --path="/be" -- .\gradlew bootRun
```

인텔리제이로 실행 시 아래 명령어로 .env 파일 얻어온 후 설정하여 실행:

```powershell
infisical --path="/be" export > .env
```

정상 확인: `http://localhost:8080/swagger-ui.html`

### 빠른 재시작 (코드 수정 시)

`bootRun`은 프로세스를 재시작해야 반영됩니다. 아래 방법으로 빌드 시간을 줄일 수 있습니다:

```powershell
# 테스트 제외 빌드 후 바로 실행 (bootRun보다 약간 빠른 경우)
infisical run --path="/be" -- .\gradlew bootRun -x test
```

---

## Step 5. 프론트엔드 실행 (Next.js 네이티브)

`npm run dev`로 HMR 활용 → **파일 저장 즉시 반영, 빌드 대기 없음**

### 5-1. Booth 앱

```powershell
cd fe/freeline-booth/
npm install  # 최초 1회

$env:NEXT_PUBLIC_API_URL="http://localhost:8080/api"; npm run dev
```

접속: `http://localhost:3000/booth`

### 5-2. Super(Admin) 앱

```powershell
cd fe/freeline-super/
npm install  # 최초 1회

$env:NEXT_PUBLIC_API_URL="http://localhost:8080/api"; npm run dev -- --port 3001
```

접속: `http://localhost:3001/super`

> 두 앱을 동시에 띄울 때 포트를 다르게 지정해야 합니다.

---

## Step 6. 모바일 앱 (Expo, 선택)

모바일 API URL이 프로덕션 주소로 하드코딩되어 있습니다 (`fe/freeline_user/api/axios.ts`).
로컬 백엔드와 연결하려면 임시로 수정 후 실행:

```powershell
# baseURL을 로컬 IP로 변경 (localhost는 에뮬레이터에서 동작 안 함)
# Android 에뮬레이터: http://10.0.2.2:8080/api/v1
# 실기기: http://{내 PC IP}:8080/api/v1

cd fe/freeline_user/
npm install
npm run start
```

> 모바일 앱은 프로덕션 서버(`j14a207.p.ssafy.io`)와 연결해도 로컬 개발에 지장 없는 경우가 많습니다.

---

## 전체 기동 순서 요약

```
1. docker network (최초 1회)
2. infra containers (DB + Redis + RabbitMQ)
3. AI vision server (uvicorn)
4. Spring Boot (.\gradlew bootRun)
5. Next.js apps (npm run dev)
```

터미널 탭/창을 4개 열고 각각 Step 3~5를 실행하면 됩니다.

---

## 종료

```powershell
# 인프라 컨테이너 중지
cd infra/backend/
infisical run --path="/be" -- docker compose stop freeline-db freeline-redis freeline-rabbitmq

# 컨테이너 + 볼륨까지 완전 삭제 (DB 초기화 포함)
infisical run --path="/be" -- docker compose down -v
```

---

## 선택 기능 (없어도 기본 동작)

| 기능          | 필요한 설정                  | 없을 때                   |
| ------------- | ---------------------------- | ------------------------- |
| 이미지 업로드 | Cloudflare R2 키 (Infisical) | 업로드 오류               |
| 푸시 알림     | Firebase 키 (Infisical)      | FCM 전송 실패 (앱은 정상) |
| 이메일 인증   | Gmail SMTP 설정 (Infisical)  | 인증 메일 전송 실패       |
| 분석 리포트   | HDFS/Hive 연결               | 리포트 기능 오류          |

이 키들은 Infisical의 `/be` 경로에 저장되어 있으며, `infisical run` 명령으로 자동 주입됩니다.
