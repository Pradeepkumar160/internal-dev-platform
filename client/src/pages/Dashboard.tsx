import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { BarChart3, Zap, Users, LogOut, Menu, Home, Rocket, Sliders, Activity, Terminal } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const navigationItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Deployments", icon: Rocket, href: "/deployments" },
  { label: "Logs", icon: Terminal, href: "/logs" },
  { label: "Env Variables", icon: Sliders, href: "/env" },
  { label: "Service Health", icon: Activity, href: "/health" },
  { label: "Team", icon: Users, href: "/team" },
];

const chartData = [
  { name: "Mon", success: 3, failed: 1 },
  { name: "Tue", success: 6, failed: 1 },
  { name: "Wed", success: 3, failed: 0 },
  { name: "Thu", success: 8, failed: 1 },
  { name: "Fri", success: 5, failed: 1 },
  { name: "Sat", success: 2, failed: 0 },
  { name: "Sun", success: 4, failed: 1 },
];

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: deployments = [] } = trpc.deployments.list.useQuery({ limit: 5 });
  const { data: services = [] } = trpc.services.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Internal Developer Platform</h1>
          <p className="text-muted-foreground mb-6">Please sign in to continue</p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const healthyCount = services.filter((s) => s.status === "healthy").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className={`${sidebarOpen ? "flex" : "hidden"} w-64 bg-card border-r border-border flex-col md:flex`}
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">DevOps</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.href}
                  whileHover={{ x: 4 }}
                  onClick={() => setLocation(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0"
          >
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground capitalize">{user?.role}</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </motion.header>

          <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-auto p-6 space-y-6"
          >
            <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-bold mb-1">Welcome back, {user?.name ?? "User"}!</h1>
              <p className="text-muted-foreground">Manage your infrastructure and deployments from here.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Services", value: services.length, icon: Zap, color: "bg-blue-500/10 border-blue-500/20" },
                { label: "Healthy Services", value: healthyCount, icon: Activity, color: "bg-green-500/10 border-green-500/20" },
                { label: "Recent Deploys", value: deployments.length, icon: Rocket, color: "bg-purple-500/10 border-purple-500/20" },
                { label: "Successful", value: deployments.filter(d => d.status === "success").length, icon: BarChart3, color: "bg-orange-500/10 border-orange-500/20" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} whileHover={{ y: -4 }} className={`${stat.color} border rounded-xl p-5`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <Icon className="w-8 h-8 text-muted-foreground opacity-40" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Deployment Trends (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(20,20,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="success" stroke="#22c55e" fill="url(#colorSuccess)" strokeWidth={2} name="Success" />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#colorFailed)" strokeWidth={2} name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Deployments</h3>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/deployments")}>View All</Button>
                </div>
                <div className="space-y-3">
                  {deployments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No deployments yet</p>
                  ) : (
                    deployments.slice(0, 4).map((d) => (
                      <motion.div key={d.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Service #{d.serviceId}</p>
                          <p className="text-xs text-muted-foreground">{d.version} · {d.branch}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${d.status === "success" ? "bg-green-500/20 text-green-400" : d.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {d.status}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Service Health</h3>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/health")}>View All</Button>
                </div>
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No services registered</p>
                  ) : (
                    services.slice(0, 4).map((s) => (
                      <motion.div key={s.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.description && <p className="text-xs text-muted-foreground truncate max-w-40">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${s.status === "healthy" ? "bg-green-500" : s.status === "degraded" ? "bg-yellow-500" : "bg-red-500"}`} />
                          <span className="text-xs text-muted-foreground capitalize">{s.status}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
