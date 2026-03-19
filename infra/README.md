# Infrastructure Management

이 디렉토리는 서비스 인프라 구성을 위한 Docker Compose 파일들과 CI/CD 설정을 포함합니다.

## 디렉토리 구조

```
infra/
├── Jenkinsfile              ← 인프라 CI/CD 파이프라인
├── hosts.conf               ← 컴포넌트별 배포 대상 호스트 맵핑
├── scripts/
│   ├── deploy.sh            ← 표준 배포 스크립트 (헬스체크 포함)
│   ├── bootstrap.sh         ← 새 서버 초기 구축 스크립트
│   └── backup.sh            ← 볼륨 백업/복원 스크립트
├── networks/                ← Docker 공용 네트워크 정의
├── nginx/                   ← 리버스 프록시 (template 기반)
│   ├── upstream.env         ← upstream 호스트 설정
│   └── conf.d/
│       ├── default.conf.template  ← nginx 설정 템플릿
│       └── default.conf           ← (자동 생성)
├── infisical/               ← 시크릿 관리 서비스
├── jenkins/                 ← CI/CD 서버 (Master + Agent)
├── backend/                 ← DB, Redis, BE 서비스
├── frontend/                ← (확장 예정)
└── monitoring/              ← (확장 예정)
```

## CI/CD 3대 원칙

### 원칙 1. 확장성 (Scalability)
새 기술 스택을 추가하려면:
1. `infra/` 아래에 디렉토리를 만듭니다 (예: `infra/monitoring/`)
2. `docker-compose.yml`을 작성합니다
3. Git 커밋 → Jenkins가 자동 감지 후 해당 컴포넌트만 배포

> 배포 순서는 `Jenkinsfile`의 `DEPLOY_ORDER`에서 관리됩니다.

### 원칙 2. 분리 운영 (Separation)
`hosts.conf`에서 컴포넌트별로 개별 서버를 지정할 수 있습니다:
```conf
# CI/CD 서버 (10.0.0.1)
jenkins=10.0.0.1
infisical=10.0.0.1

# 배포 서버 (10.0.0.2)
backend=10.0.0.2
frontend=10.0.0.2
```

nginx의 upstream도 `nginx/upstream.env`에서 설정:
```env
BACKEND_HOST=10.0.0.2   # 컨테이너명 대신 IP 사용
```

### 원칙 3. 이전 편의성 (Portability)
새 서버로 이전할 때:
```bash
# 1. 기존 서버에서 볼륨 백업
./scripts/backup.sh all /path/to/backup

# 2. 새 서버에서 부트스트랩
sudo ./scripts/bootstrap.sh

# 3. 볼륨 복원
./scripts/backup.sh all /path/to/backup restore
```

## 스크립트 사용법

```bash
# 컴포넌트 배포
./scripts/deploy.sh nginx

# 전체 초기 구축
sudo ./scripts/bootstrap.sh

# 볼륨 백업
./scripts/backup.sh backend /tmp/backup

# 볼륨 복원
./scripts/backup.sh backend /tmp/backup restore
```

## Jenkins 설정

1. **Pipeline Job**: SCM에서 `infra/Jenkinsfile` 경로 설정
2. **SSH Credentials**: ID `infra-ssh-key`로 등록
3. **Parameters**: `DEPLOY_ALL`, `SSH_CREDENTIALS_ID` 자동 제공
