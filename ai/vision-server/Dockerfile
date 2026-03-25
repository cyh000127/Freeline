# 파이썬 3.10 버전이 설치된 가벼운 리눅스(slim)를 가져옵니다.
FROM python:3.10-slim

# 작업할 폴더(디렉토리)를 지정합니다.
WORKDIR /app

# 파이썬 패키지를 설치할 때 필요한 추가 도구들을 리눅스에 먼저 설치합니다.
# (OpenCV 등이 정상적으로 돌기 위해 필요한 라이브러리들입니다.)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 영수증(requirements.txt) 파일을 복사해옵니다.
COPY requirements.txt .

# 영수증에 적힌 파이썬 도구(FastAPI 등)들을 모두 설치합니다.
RUN pip install --no-cache-dir -r requirements.txt

# 우리가 작성한 서버 코드(main.py 등)를 전부 복사합니다.
COPY . .

# 8000번 포트를 사용하겠다고 선언합니다.
EXPOSE 8000

# 컨테이너가 켜질 때 이 명령어를 실행해서 서버를 시작합니다.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
