import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure, developerProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    devLogin: publicProcedure.mutation(async ({ ctx }) => {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_LOGIN !== "true") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.upsertUser({
        openId: "dev-user-001",
        name: "Dev User",
        email: "dev@localhost",
        role: "admin",
        loginMethod: "dev",
      });
      const user = await db.getUserByOpenId("dev-user-001");
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-in-production");
      const token = await new SignJWT({ openId: "dev-user-001", appId: process.env.VITE_APP_ID || "local-dev", name: "Dev User" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
      return user;
    }),
  }),

  // Services router
  services: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllServices();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const service = await db.getServiceById(input.id);
        if (!service) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
        }
        return service;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["healthy", "degraded", "down"]).default("healthy"),
      }))
      .mutation(async ({ input }) => {
        return await db.createService({
          name: input.name,
          description: input.description,
          status: input.status,
        });
      }),

    updateHealth: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["healthy", "degraded", "down"]),
        uptime: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateService(input.id, {
          status: input.status,
          uptime: input.uptime,
          lastHealthCheck: new Date().toISOString(),
        });
      }),
  }),

  // Deployments router
  deployments: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return await db.getAllDeployments(input.limit);
      }),

    getByService: protectedProcedure
      .input(z.object({ serviceId: z.number(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return await db.getDeploymentsByService(input.serviceId, input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const deployment = await db.getDeploymentById(input.id);
        if (!deployment) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Deployment not found" });
        }
        return deployment;
      }),

    create: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        version: z.string().min(1),
        branch: z.string().default("main"),
        commitSha: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!["developer", "admin"].includes(ctx.user?.role || "")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only developers and admins can trigger deployments" });
        }

        return await db.createDeployment({
          serviceId: input.serviceId,
          version: input.version,
          branch: input.branch,
          commitSha: input.commitSha,
          triggeredBy: ctx.user?.id,
          status: "pending",
        });
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "success", "failed", "rolled_back"]),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!["developer", "admin"].includes(ctx.user?.role || "")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only developers and admins can update deployments" });
        }

        return await db.updateDeployment(input.id, {
          status: input.status,
          duration: input.duration,
        });
      }),
  }),

  // Environment Variables router
  environmentVariables: router({
    listByService: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEnvironmentVariablesByService(input.serviceId);
      }),

    create: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        key: z.string().min(1),
        value: z.string(),
        isSecret: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!["developer", "admin"].includes(ctx.user?.role || "")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only developers and admins can manage environment variables" });
        }

        return await db.createEnvironmentVariable({
          serviceId: input.serviceId,
          key: input.key,
          value: input.value,
          isSecret: input.isSecret,
          createdBy: ctx.user?.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        value: z.string(),
        isSecret: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!["developer", "admin"].includes(ctx.user?.role || "")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only developers and admins can manage environment variables" });
        }

        return await db.updateEnvironmentVariable(input.id, {
          value: input.value,
          isSecret: input.isSecret,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!["developer", "admin"].includes(ctx.user?.role || "")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only developers and admins can manage environment variables" });
        }

        return await db.deleteEnvironmentVariable(input.id);
      }),
  }),

  // Logs router
  logs: router({
    getByDeployment: protectedProcedure
      .input(z.object({ deploymentId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return await db.getLogsByDeployment(input.deploymentId, input.limit);
      }),

    addLog: protectedProcedure
      .input(z.object({
        deploymentId: z.number(),
        message: z.string(),
        level: z.enum(["debug", "info", "warn", "error"]).default("info"),
      }))
      .mutation(async ({ input }) => {
        return await db.createDeploymentLog({
          deploymentId: input.deploymentId,
          message: input.message,
          level: input.level,
        });
      }),
  }),

  // Team/Users router (admin only)
  team: router({
    listUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["viewer", "developer", "admin"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateUserRole(input.userId, input.role);
      }),

    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteUser(input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
