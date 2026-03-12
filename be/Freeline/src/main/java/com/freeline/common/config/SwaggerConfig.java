package com.freeline.common.config;

import java.util.Collections;
import java.util.List;

import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import com.freeline.common.constant.BackDomain;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenApi() {

        final SecurityScheme accessTokenAuth = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        final SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList("accessTokenAuth")
                .addList("refreshTokenAuth");

        final Server server = new Server();
        server.setUrl(BackDomain.LOCAL.getUrl());
        server.setDescription(BackDomain.LOCAL.getDescription());

        return new OpenAPI()
                .info(new Info().title("Freeline API")
                        .description("Freeline API 서버")
                        .version("v1.0"))
                .components(new Components()
                        .addSecuritySchemes("accessTokenAuth", accessTokenAuth))
                .security(Collections.singletonList(securityRequirement))
                .servers(List.of(server));
    }

    @Bean
    @Primary
    public SwaggerUiConfigProperties swaggerUiConfigProperties(final SwaggerUiConfigProperties props) {
        props.setPersistAuthorization(true);
        return props;
    }
}
