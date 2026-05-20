import { eq, desc } from "drizzle-orm";
import { users, services, deployments, environmentVariables, deploymentLogs } from "../drizzle/schema";
import type { User, InsertUser, Service, InsertService, Deployment, InsertDeployment, EnvironmentVariable, InsertEnvironmentVariable, DeploymentLog, InsertDeploymentLog } from "../drizzle/schema";

// In-memory store (persists while server is running)
// SQLite-backed persistence is available via drizzle-kit migrate
const store = {
  users: [] as User[],
  services: [] as Service[],
  deployments: [] as Deployment[],
  environmentVariables: [] as EnvironmentVariable[],
  deploymentLogs: [] as DeploymentLog[],
  nextId: { users: 1, services: 1, deployments: 1, environmentVariables: 1, deploymentLogs: 1 },
};

// Seed some demo data on first start
function seedDemoData() {
  if (store.services.length > 0) return;
  const now = new Date().toISOString();
  
  const demoServices: Service[] = [
    { id: 1, name: "api-gateway", description: "Main API Gateway", status: "healthy", uptime: 99.9, lastHealthCheck: now, createdAt: now, updatedAt: now },
    { id: 2, name: "auth-service", description: "Authentication Service", status: "healthy", uptime: 99.5, lastHealthCheck: now, createdAt: now, updatedAt: now },
    { id: 3, name: "user-service", description: "User Management Service", status: "degraded", uptime: 87.2, lastHealthCheck: now, createdAt: now, updatedAt: now },
    { id: 4, name: "notification-service", description: "Email & Push Notifications", status: "healthy", uptime: 100, lastHealthCheck: now, createdAt: now, updatedAt: now },
  ];
  store.services.push(...demoServices);
  store.nextId.services = 5;

  const demoDeployments: Deployment[] = [
    { id: 1, serviceId: 1, status: "success", version: "v2.1.0", branch: "main", commitSha: "abc1234", githubWorkflowId: null, triggeredBy: null, duration: 142, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: now },
    { id: 2, serviceId: 2, status: "success", version: "v1.5.3", branch: "main", commitSha: "def5678", githubWorkflowId: null, triggeredBy: null, duration: 98, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: now },
    { id: 3, serviceId: 3, status: "failed", version: "v3.0.0-beta", branch: "feature/new-db", commitSha: "ghi9012", githubWorkflowId: null, triggeredBy: null, duration: 45, createdAt: new Date(Date.now() - 10800000).toISOString(), updatedAt: now },
    { id: 4, serviceId: 1, status: "success", version: "v2.0.9", branch: "main", commitSha: "jkl3456", githubWorkflowId: null, triggeredBy: null, duration: 130, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: now },
    { id: 5, serviceId: 4, status: "in_progress", version: "v1.2.1", branch: "main", commitSha: "mno7890", githubWorkflowId: null, triggeredBy: null, duration: null, createdAt: new Date(Date.now() - 300000).toISOString(), updatedAt: now },
  ];
  store.deployments.push(...demoDeployments);
  store.nextId.deployments = 6;

  const demoEnvVars: EnvironmentVariable[] = [
    { id: 1, serviceId: 1, key: "NODE_ENV", value: "production", isSecret: false, createdBy: null, createdAt: now, updatedAt: now },
    { id: 2, serviceId: 1, key: "API_KEY", value: "***hidden***", isSecret: true, createdBy: null, createdAt: now, updatedAt: now },
    { id: 3, serviceId: 2, key: "JWT_SECRET", value: "***hidden***", isSecret: true, createdBy: null, createdAt: now, updatedAt: now },
    { id: 4, serviceId: 2, key: "AUTH_PROVIDER", value: "local", isSecret: false, createdBy: null, createdAt: now, updatedAt: now },
  ];
  store.environmentVariables.push(...demoEnvVars);
  store.nextId.environmentVariables = 5;

  const demoLogs: DeploymentLog[] = [
    { id: 1, deploymentId: 1, message: "Starting deployment pipeline", level: "info", timestamp: new Date(Date.now() - 3700000).toISOString() },
    { id: 2, deploymentId: 1, message: "Building Docker image", level: "info", timestamp: new Date(Date.now() - 3680000).toISOString() },
    { id: 3, deploymentId: 1, message: "Running tests: 42/42 passed", level: "info", timestamp: new Date(Date.now() - 3650000).toISOString() },
    { id: 4, deploymentId: 1, message: "Pushing to registry: api-gateway:v2.1.0", level: "info", timestamp: new Date(Date.now() - 3620000).toISOString() },
    { id: 5, deploymentId: 1, message: "Deployment successful", level: "info", timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 6, deploymentId: 3, message: "Starting deployment pipeline", level: "info", timestamp: new Date(Date.now() - 10900000).toISOString() },
    { id: 7, deploymentId: 3, message: "Database migration failed: connection timeout", level: "error", timestamp: new Date(Date.now() - 10850000).toISOString() },
    { id: 8, deploymentId: 3, message: "Rolling back deployment", level: "warn", timestamp: new Date(Date.now() - 10800000).toISOString() },
  ];
  store.deploymentLogs.push(...demoLogs);
  store.nextId.deploymentLogs = 9;
}

seedDemoData();

// ── Users ──────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  const existing = store.users.find(u => u.openId === user.openId);
  const now = new Date().toISOString();
  if (existing) {
    Object.assign(existing, { ...user, updatedAt: now, lastSignedIn: now });
  } else {
    store.users.push({ ...user, id: store.nextId.users++, role: user.role ?? "viewer", createdAt: now, updatedAt: now, lastSignedIn: now } as User);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  return store.users.find(u => u.openId === openId);
}

export async function getAllUsers(): Promise<User[]> {
  return [...store.users];
}

export async function updateUserRole(userId: number, role: "viewer" | "developer" | "admin") {
  const user = store.users.find(u => u.id === userId);
  if (user) user.role = role;
}

export async function deleteUser(userId: number) {
  store.users = store.users.filter(u => u.id !== userId);
}

// ── Services ───────────────────────────────────────────
export async function getAllServices(): Promise<Service[]> {
  return [...store.services];
}

export async function getServiceById(id: number): Promise<Service | undefined> {
  return store.services.find(s => s.id === id);
}

export async function createService(data: InsertService) {
  const now = new Date().toISOString();
  const svc: Service = { ...data, id: store.nextId.services++, status: data.status ?? "healthy", uptime: data.uptime ?? 100, lastHealthCheck: now, createdAt: now, updatedAt: now };
  store.services.push(svc);
  return svc;
}

export async function updateService(id: number, data: Partial<Service>) {
  const svc = store.services.find(s => s.id === id);
  if (svc) Object.assign(svc, { ...data, updatedAt: new Date().toISOString() });
}

// ── Deployments ────────────────────────────────────────
export async function getAllDeployments(limit = 50): Promise<Deployment[]> {
  return [...store.deployments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getDeploymentsByService(serviceId: number, limit = 20): Promise<Deployment[]> {
  return store.deployments.filter(d => d.serviceId === serviceId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getDeploymentById(id: number): Promise<Deployment | undefined> {
  return store.deployments.find(d => d.id === id);
}

export async function createDeployment(data: InsertDeployment) {
  const now = new Date().toISOString();
  const dep: Deployment = { ...data, id: store.nextId.deployments++, status: data.status ?? "pending", branch: data.branch ?? "main", githubWorkflowId: data.githubWorkflowId ?? null, commitSha: data.commitSha ?? null, triggeredBy: data.triggeredBy ?? null, duration: data.duration ?? null, createdAt: now, updatedAt: now };
  store.deployments.push(dep);
  return dep;
}

export async function updateDeployment(id: number, data: Partial<Deployment>) {
  const dep = store.deployments.find(d => d.id === id);
  if (dep) Object.assign(dep, { ...data, updatedAt: new Date().toISOString() });
}

// ── Environment Variables ──────────────────────────────
export async function getEnvironmentVariablesByService(serviceId: number): Promise<EnvironmentVariable[]> {
  return store.environmentVariables.filter(e => e.serviceId === serviceId);
}

export async function createEnvironmentVariable(data: InsertEnvironmentVariable) {
  const now = new Date().toISOString();
  const ev: EnvironmentVariable = { ...data, id: store.nextId.environmentVariables++, isSecret: data.isSecret ?? false, createdBy: data.createdBy ?? null, createdAt: now, updatedAt: now };
  store.environmentVariables.push(ev);
  return ev;
}

export async function updateEnvironmentVariable(id: number, data: Partial<EnvironmentVariable>) {
  const ev = store.environmentVariables.find(e => e.id === id);
  if (ev) Object.assign(ev, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteEnvironmentVariable(id: number) {
  store.environmentVariables = store.environmentVariables.filter(e => e.id !== id);
}

// ── Deployment Logs ────────────────────────────────────
export async function getLogsByDeployment(deploymentId: number, limit = 100): Promise<DeploymentLog[]> {
  return store.deploymentLogs.filter(l => l.deploymentId === deploymentId).sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(0, limit);
}

export async function createDeploymentLog(data: InsertDeploymentLog) {
  const log: DeploymentLog = { ...data, id: store.nextId.deploymentLogs++, level: data.level ?? "info", timestamp: new Date().toISOString() };
  store.deploymentLogs.push(log);
  return log;
}
