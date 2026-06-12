FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Install deps
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build || true

# Verify dist was created
RUN ls -la dist/ 2>/dev/null || echo "WARNING: dist/ is empty"
RUN test -f dist/index.js && echo "dist/index.js OK" || echo "ERROR: dist/index.js missing"

ENV NODE_ENV=production
ENV HOST=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# Run with explicit error output
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || true; node dist/index.js 2>&1"]
