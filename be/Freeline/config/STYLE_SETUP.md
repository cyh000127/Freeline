# 스타일 적용 방법

이 프로젝트는 아래 2가지만 사용합니다.

1. Checkstyle: 빌드 규칙 검사용
2. IntelliJ Code Style XML: `Ctrl+Alt+L`, `Ctrl+Alt+O` 동작 기준

## 1) Checkstyle 적용

- 규칙 파일: `config/checkstyle/checkstyle.xml`
- 현재 강제 규칙:
    - 와일드카드 import 금지 (`AvoidStarImport`)
    - import 순서 강제 (`ImportOrder`)
        - 순서: `java -> javax -> jakarta -> org -> lombok -> com`
        - 그룹 사이 빈 줄 1줄

예시:

```java
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
```

확인 명령:

```bash
./gradlew checkstyleMain checkstyleTest
```

## 2) IntelliJ 코드스타일 적용

- 파일: `config/codestyle/intellij-java-codestyle.xml`
- 설정 의도:
    - 탭 문자 허용
    - 1탭 = 4칸
    - import 정렬 시 Checkstyle 순서와 동일하게 맞춤

Import 방법:

1. IntelliJ 열기
2. `Settings > Editor > Code Style > Java`
3. 톱니바퀴 아이콘 > `Import Scheme > IntelliJ IDEA code style XML`
4. `config/codestyle/intellij-java-codestyle.xml` 선택

## 3) 개발자 사용 루틴

1. 코드 작성
2. `Ctrl+Alt+L` (Reformat)
3. `Ctrl+Alt+O` (Optimize Imports)
4. `./gradlew checkstyleMain checkstyleTest`

## 참고

- 와일드카드 import가 있으면 빌드가 실패합니다.
- import 순서가 다르면 빌드가 실패합니다.
