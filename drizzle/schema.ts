import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["viewer", "developer", "admin"] }).default("viewer").notNull(),
  createdAt: text("createdAt").default(new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").default(new Date().toISOString()).notNull(),
  lastSignedIn: text("lastSignedIn").default(new Date().toISOString()).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  deployments: many(deployments),
  environmentVariables: many(environmentVariables),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const services = sqliteTable("services", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: ["healthy", "degraded", "down"] }).default("healthy").notNull(),
  uptime: real("uptime").default(100.0),
  lastHealthCheck: text("lastHealthCheck").default(new Date().toISOString()),
  createdAt: text("createdAt").default(new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").default(new Date().toISOString()).notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export const deployments = sqliteTable("deployments", {
  id: int("id").primaryKey({ autoIncrement: true }),
  serviceId: int("serviceId").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "success", "failed", "rolled_back"] }).default("pending").notNull(),
  version: text("version").notNull(),
  triggeredBy: int("triggeredBy"),
  githubWorkflowId: text("githubWorkflowId"),
  commitSha: text("commitSha"),
  branch: text("branch").default("main"),
  duration: int("duration"),
  createdAt: text("createdAt").default(new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").default(new Date().toISOString()).notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

export const environmentVariables = sqliteTable("environmentVariables", {
  id: int("id").primaryKey({ autoIncrement: true }),
  serviceId: int("serviceId").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  isSecret: int("isSecret", { mode: "boolean" }).default(false),
  createdBy: int("createdBy"),
  createdAt: text("createdAt").default(new Date().toISOString()).notNull(),
  updatedAt: text("updatedAt").default(new Date().toISOString()).notNull(),
});

export type EnvironmentVariable = typeof environmentVariables.$inferSelect;
export type InsertEnvironmentVariable = typeof environmentVariables.$inferInsert;

export const deploymentLogs = sqliteTable("deploymentLogs", {
  id: int("id").primaryKey({ autoIncrement: true }),
  deploymentId: int("deploymentId").notNull(),
  message: text("message").notNull(),
  level: text("level", { enum: ["debug", "info", "warn", "error"] }).default("info"),
  timestamp: text("timestamp").default(new Date().toISOString()).notNull(),
});

export type DeploymentLog = typeof deploymentLogs.$inferSelect;
export type InsertDeploymentLog = typeof deploymentLogs.$inferInsert;
