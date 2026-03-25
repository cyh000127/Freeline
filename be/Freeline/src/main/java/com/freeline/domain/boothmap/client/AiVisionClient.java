package com.freeline.domain.boothmap.client;

import java.util.List;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AiVisionClient {

    private final RestClient restClient;

    // 스프링 부트가 자동으로 RestClient.Builder를 주입해 줍니다.
    public AiVisionClient(RestClient.Builder restClientBuilder,
                          @org.springframework.beans.factory.annotation.Value("${ai.vision.url:http://localhost:8000}") String aiVisionUrl) {
        // 파이썬 AI 서버의 기본 주소를 설정합니다. (기본값: localhost, 도커에서는 환경변수로 덮어씀)
        this.restClient = restClientBuilder.baseUrl(aiVisionUrl).build();
    }

    public record AiAnalysisResult(int imageWidth, int imageHeight, List<AiBoothRect> booths) {
    }

    public record AiBoothRect(int x, int y, int width, int height) {
    }

    /**
     * 외부 AI 서버에 이미지를 전달하고 부스 픽셀 좌표를 받아옵니다.
     */
    public AiAnalysisResult analyzeMapImage(final String imageUrl) {
        log.info("[AiVisionClient] Requesting AI analysis for imageUrl: {}", imageUrl);

        try {
            // 1. 저장된 이미지 URL에서 원본 이미지 데이터를 바이트(byte) 형태로 다운로드합니다.
            // (배치도 이미지가 클라우드 S3 등에 저장되어 있다고 가정하고, 해당 주소에서 이미지를 가져옵니다.)
            byte[] imageBytes = RestClient.create().get().uri(imageUrl).retrieve().body(byte[].class);

            if (imageBytes == null) {
                throw new AiVisionException("URL에서 이미지를 다운로드할 수 없습니다: " + imageUrl);
            }

            // 2. 파이썬 서버에 보낼 '주문서(Multipart Form)'를 작성합니다.
            // "file"이라는 이름으로 방금 다운로드한 이미지를 첨부합니다.
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "map-image.png"; // 가상의 파일 이름
                }
            });

            // 3. 파이썬 주방장(FastAPI)에게 분석을 요청합니다.
            log.info("[AiVisionClient] 파이썬 AI 서버로 전송 시작...");
            AiAnalysisResult result = restClient.post()
                    .uri("/api/analyze")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiAnalysisResult.class);

            log.info("[AiVisionClient] AI 분석 완료! 발견된 부스 개수: {}", result != null && result.booths() != null ? result.booths().size() : 0);

            return result;

        } catch (org.springframework.web.client.RestClientException e) {
            log.error("[AiVisionClient] 파이썬 AI 서버 통신 중 RestClient 오류 발생", e);
            throw new AiVisionException("AI 서버와 통신 중 오류가 발생했습니다.", e);
        } catch (AiVisionException e) {
            throw e;
        } catch (Exception e) {
            log.error("[AiVisionClient] 파이썬 AI 서버 통신 중 알 수 없는 오류 발생", e);
            throw new AiVisionException("AI 이미지 분석에 실패했습니다.", e);
        }
    }
}
