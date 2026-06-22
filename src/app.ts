import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "@/shared/config/env.ts";
import { securityHeaders } from "@/infrastructure/http/middlewares/security.middleware.ts";
import { apiRateLimit } from "@/infrastructure/http/middlewares/rateLimiter.middleware.ts";
import { createAuthRoutes } from "@/infrastructure/http/routes/auth.routes.ts";
import { createUserRoutes } from "@/infrastructure/http/routes/user.routes.ts";
import { createArchitectureRoutes } from "@/infrastructure/http/routes/architecture.routes.ts";
import { MongoUserRepository } from "@/infrastructure/persistence/mongodb/repositories/MongoUserRepository.ts";
import { MongoArchitectureRepository } from "@/infrastructure/persistence/mongodb/repositories/MongoArchitectureRepository.ts";
import { PasswordService } from "@/infrastructure/security/argon2.ts";
import { JwtService } from "@/infrastructure/security/jwt.ts";

export function createApp(env: Env) {
  const app = new Hono();

  // Global middlewares
  app.use("*", logger());
  app.use("*", securityHeaders);
  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
    }),
  );
  app.use("/api/*", apiRateLimit);

  // Health check
  app.get("/api/health", (c) => c.json({ status: "ok" }));

  // Initialize services
  const passwordService = new PasswordService();
  const jwtService = new JwtService(env);

  // Initialize repositories
  const userRepository = new MongoUserRepository();
  const architectureRepository = new MongoArchitectureRepository();

  // Routes
  const authRoutes = createAuthRoutes(
    userRepository,
    passwordService,
    jwtService,
  );
  const userRoutes = createUserRoutes(
    userRepository,
    architectureRepository,
    passwordService,
    jwtService,
  );
  const architectureRoutes = createArchitectureRoutes(
    architectureRepository,
    jwtService,
  );

  app.route("/api/auth", authRoutes);
  app.route("/api/users", userRoutes);
  app.route("/api/architectures", architectureRoutes);

  // Global error handler
  app.onError((err, c) => {
    console.error(err);

    if (env.NODE_ENV === "production") {
      return c.json({ error: "Internal server error" }, 500);
    }

    return c.json({ error: err.message }, 500);
  });

  // 404 handler
  app.notFound((c) => c.json({ error: "Endpoint not found" }, 404));

  return app;
}
