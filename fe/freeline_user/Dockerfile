# Stage 1: Build the Expo React Native Web App
FROM node:20-alpine AS builder

WORKDIR /app

# npm 의존성 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드 시 젠킨스로부터 주입받을 환경 변수 선언 (필요한 값들을 ARG로 추가하세요)
# ARG EXPO_PUBLIC_API_URL
# ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Expo Web 정적 파일 빌드
RUN npx expo export -p web

# Stage 2: Nginx 서버로 정적 파일 서빙
FROM nginx:1.24-alpine

# 위에서 만들어둔 nginx.conf 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 웹 파일을 Nginx root 디렉토리로 복사 (expo export 의 기본 결과물은 dist 폴더임)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
