FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=unknown
RUN npm run build -- --configuration=production && printf '%s\n' "$GIT_SHA" > /app/dist/couturix/browser/build-id.txt

FROM nginx:1.27-alpine
RUN apk add --no-cache wget
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/couturix/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
