package com.freeline.common.config;

import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;

@Configuration
public class SwaggerGroupConfig {

    private static final Map<String, Set<PathItem.HttpMethod>> EVENT_ADMIN_SETUP_FLOW = new LinkedHashMap<>();

    static {
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/auth/login", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/events", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/booths/events/{eventId}", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/events/{eventId}/booths/csv", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/auth/booth-admins/bulk", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/auth/entry-codes/bulk", EnumSet.of(PathItem.HttpMethod.POST));
        EVENT_ADMIN_SETUP_FLOW.put("/api/v1/auth/visitors/entry-code/authenticate", EnumSet.of(PathItem.HttpMethod.POST));
    }

    @Bean
    public GroupedOpenApi eventAdminSetupFlowApi() {
        return GroupedOpenApi.builder()
                .group("01-Event-Admin-Setup-Flow")
                .pathsToMatch("/api/v1/**")
                .addOpenApiCustomizer(this::filterEventAdminSetupFlow)
                .build();
    }

    @Bean
    public GroupedOpenApi allApiGroup() {
        return GroupedOpenApi.builder()
                .group("00-All-APIs")
                .pathsToMatch("/api/v1/**")
                .build();
    }

    @Bean
    public GroupedOpenApi allGetApiGroup() {
        return GroupedOpenApi.builder()
                .group("02-All-GET-APIs")
                .pathsToMatch("/api/v1/**")
                .addOpenApiCustomizer(this::filterGetOnly)
                .build();
    }

    private void filterEventAdminSetupFlow(final OpenAPI openApi) {
        if (openApi.getPaths() == null) {
            return;
        }

        openApi.getPaths().entrySet().removeIf(entry -> {
            final String path = entry.getKey();
            final Set<PathItem.HttpMethod> allowedMethods = EVENT_ADMIN_SETUP_FLOW.get(path);

            if (allowedMethods == null) {
                return true;
            }

            final PathItem pathItem = entry.getValue();
            removeDisallowedOperations(pathItem, allowedMethods);
            return hasNoOperations(pathItem);
        });
    }

    private void filterGetOnly(final OpenAPI openApi) {
        if (openApi.getPaths() == null) {
            return;
        }

        openApi.getPaths().entrySet().removeIf(entry -> {
            final PathItem pathItem = entry.getValue();
            removeDisallowedOperations(pathItem, EnumSet.of(PathItem.HttpMethod.GET));
            return hasNoOperations(pathItem);
        });
    }

    private void removeDisallowedOperations(
            final PathItem pathItem,
            final Set<PathItem.HttpMethod> allowedMethods
    ) {
        if (!allowedMethods.contains(PathItem.HttpMethod.GET)) {
            pathItem.setGet(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.PUT)) {
            pathItem.setPut(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.POST)) {
            pathItem.setPost(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.DELETE)) {
            pathItem.setDelete(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.OPTIONS)) {
            pathItem.setOptions(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.HEAD)) {
            pathItem.setHead(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.PATCH)) {
            pathItem.setPatch(null);
        }
        if (!allowedMethods.contains(PathItem.HttpMethod.TRACE)) {
            pathItem.setTrace(null);
        }
    }

    private boolean hasNoOperations(final PathItem pathItem) {
        return pathItem.getGet() == null
                && pathItem.getPut() == null
                && pathItem.getPost() == null
                && pathItem.getDelete() == null
                && pathItem.getOptions() == null
                && pathItem.getHead() == null
                && pathItem.getPatch() == null
                && pathItem.getTrace() == null;
    }
}
