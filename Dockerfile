# ---- build stage: compile server TS and bundle the PWA ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root
COPY apps ./apps
RUN npm run build --workspace apps/server && npm run build --workspace apps/web

# ---- runtime stage: production deps + built artifacts only ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY apps/server/package.json apps/server/
RUN npm install --workspace apps/server --omit=dev && npm cache clean --force
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/web/dist apps/web/dist
ENV WEB_DIST_PATH=/app/apps/web/dist
ENV PORT=31400
USER node
EXPOSE 31400
CMD ["node", "apps/server/dist/main.js"]
