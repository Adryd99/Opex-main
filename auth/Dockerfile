ARG KEYCLOAK_VERSION=26.4.0
ARG KEYCLOAK_MAJOR_VERSION=26

FROM node:20-bookworm-slim AS theme-builder

ARG KEYCLOAK_MAJOR_VERSION

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jdk maven \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/auth/keycloakify

COPY keycloakify/package.json ./
COPY keycloakify/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY keycloakify ./

RUN set -eux; \
    rm -rf dist dist_keycloak; \
    yarn build-keycloak-theme; \
    mkdir -p /workspace/out; \
    THEME_JAR=""; \
    for jar in dist_keycloak/*.jar; do \
        name="$(basename "$jar")"; \
        range="$(printf '%s' "$name" | sed -n 's/.*kc-\([0-9]\+\)-to-\([0-9]\+\).*/\1 \2/p')"; \
        if [ -n "$range" ]; then \
            set -- $range; \
            min="$1"; \
            max="$2"; \
            if [ "$KEYCLOAK_MAJOR_VERSION" -ge "$min" ] && [ "$KEYCLOAK_MAJOR_VERSION" -le "$max" ]; then \
                THEME_JAR="$jar"; \
                break; \
            fi; \
        fi; \
    done; \
    if [ -z "$THEME_JAR" ]; then \
        THEME_JAR="$(find dist_keycloak -maxdepth 1 -type f -name '*all-other-versions*.jar' | head -n 1)"; \
    fi; \
    test -n "$THEME_JAR"; \
    cp "$THEME_JAR" /workspace/out/keycloak-theme-opex.jar

FROM maven:3.9.9-eclipse-temurin-17 AS provider-builder

WORKDIR /workspace/auth/extensions/keycloak-onboarding-actions

COPY extensions/keycloak-onboarding-actions/pom.xml ./
COPY extensions/keycloak-onboarding-actions/src ./src

RUN mvn -q -DskipTests package \
    && mkdir -p /workspace/out \
    && find target -maxdepth 1 -type f -name '*.jar' ! -name '*sources*' ! -name '*javadoc*' -exec cp {} /workspace/out/keycloak-onboarding-actions.jar \;

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION} AS builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres

COPY --chown=keycloak:keycloak --from=theme-builder /workspace/out/keycloak-theme-opex.jar /opt/keycloak/providers/keycloak-theme-opex.jar
COPY --chown=keycloak:keycloak --from=provider-builder /workspace/out/keycloak-onboarding-actions.jar /opt/keycloak/providers/keycloak-onboarding-actions.jar
RUN touch -m --date=@1743465600 /opt/keycloak/providers/* && /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY --chown=keycloak:keycloak realm/production/opex-realm.json /opt/keycloak/data/import/opex-realm.json

EXPOSE 8080
EXPOSE 9000

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm", "--http-enabled=true", "--proxy-headers=xforwarded"]
