package com.freeline;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

// TODO: Jenkins Agent 분리 후 이 테스트 다시 활성화
//  - Server B에 빌드/테스트 전용 Agent 추가 (Docker 소켓 접근 가능)
//  - Server A Agent는 배포 전용으로 분리
//  - test/resources/application.yml에 Firebase 더미 설정 추가
//  - Jenkinsfile에서 스테이지별 Agent 라벨 분리 (agent { label 'build' } vs 'deploy')

@Disabled("CI 환경에서 Testcontainers Docker 접근 불안정 - Agent 분리 후 활성화 예정")
@ActiveProfiles("local")
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class FreelineApplicationTests {

    @Test
    void contextLoads() {
    }

}

