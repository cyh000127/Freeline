package com.freeline;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

//@SpringBootTest
//! 해당 테스트의 SonarQube issue는 처리 안하셔도 됩니다.

@ActiveProfiles("local")
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class FreelineApplicationTests {

    @Test
    void contextLoads() {
    }

}
