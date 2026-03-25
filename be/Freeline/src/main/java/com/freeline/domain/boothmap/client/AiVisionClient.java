package com.freeline.domain.boothmap.client;

import java.util.List;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AiVisionClient {

    public record AiAnalysisResult(int imageWidth, int imageHeight, List<AiBoothRect> booths) {
    }

    public record AiBoothRect(int x, int y, int width, int height) {
    }

    /**
     * 외부 AI 서버에 이미지를 전달하고 부스 픽셀 좌표를 받아옵니다.
     */
    public AiAnalysisResult analyzeMapImage(final String imageUrl) {
        log.info("[AiVisionClient] Requesting AI analysis for imageUrl: {}", imageUrl);

        // TODO: WebClient를 통해 실제 파이썬 FastAPI 서버( /api/analyze ) 연동

        // 임시 Mock 데이터 반환 (예: 1000x1000 사이즈 이미지에서 부스 2개 검출)
        return new AiAnalysisResult(
                1000, 1000,
                List.of(
                        new AiBoothRect(100, 200, 150, 150),
                        new AiBoothRect(400, 500, 200, 100)
                )
        );
    }
}
