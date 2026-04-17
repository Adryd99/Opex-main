FROM quay.io/keycloak/keycloak:26.4.0 AS builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres

COPY --chown=keycloak:keycloak themes/keycloak-theme-opex.jar /opt/keycloak/providers/
RUN touch -m --date=@1743465600 /opt/keycloak/providers/*
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.4.0

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY --chown=keycloak:keycloak realm/production/opex-realm.json /opt/keycloak/data/import/opex-realm.json

EXPOSE 8080
EXPOSE 9000

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm", "--http-enabled=true", "--proxy-headers=xforwarded"]
