FROM node:22-alpine AS build
WORKDIR /app

ARG BUILD_API_BASE_URL=
ARG BUILD_API_ORIGIN=https://api.example.com
ARG BUILD_IDP_LOGIN_URL=https://auth.example.com/realms/opex/protocol/openid-connect/auth
ARG BUILD_IDP_EXCHANGE_URL=https://auth.example.com/realms/opex/protocol/openid-connect/token
ARG BUILD_KEYCLOAK_LOGOUT_URL=https://auth.example.com/realms/opex/protocol/openid-connect/logout
ARG BUILD_KEYCLOAK_CLIENT_ID=opex
ARG BUILD_KEYCLOAK_SCOPE="openid profile email"
ARG BUILD_KEYCLOAK_REDIRECT_URI=https://app.example.com

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN VITE_API_BASE_URL="$BUILD_API_BASE_URL" \
    VITE_API_ORIGIN="$BUILD_API_ORIGIN" \
    VITE_KEYCLOAK_AUTH_URL="$BUILD_IDP_LOGIN_URL" \
    VITE_KEYCLOAK_TOKEN_URL="$BUILD_IDP_EXCHANGE_URL" \
    VITE_KEYCLOAK_LOGOUT_URL="$BUILD_KEYCLOAK_LOGOUT_URL" \
    VITE_KEYCLOAK_CLIENT_ID="$BUILD_KEYCLOAK_CLIENT_ID" \
    VITE_KEYCLOAK_SCOPE="$BUILD_KEYCLOAK_SCOPE" \
    VITE_KEYCLOAK_REDIRECT_URI="$BUILD_KEYCLOAK_REDIRECT_URI" \
    npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
