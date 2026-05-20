import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Terminal, Home, Rocket, Sliders, Activity, Users, Menu, Zap, LogOut, Search, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navigationItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Deployments", icon: Rocket, href: "/deployments" },
  { label: "Logs", icon: Terminal, href: "/logs" },
  { label: "Env Variables", icon: Sliders, href: "/env" },
  { label: "Service Health", icon: Activity, href: "/health" },
  { label: "Team", icon: Users, href: "/team" },
];

const levelColors: Record<string, string> = {
  debug: "text-gray-400",
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

const levelBg: Record<string, string> = {
  debug: "bg-gray-500/10",
  info: "bg-blue-500/10",
  warn: "bg-yellow-500/10",
  error: "bg-red-500/10",
};

export default function Logs() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { data: deployments = [] } = trpc.deployments.list.useQuery({ limit: 50 });
  const { data: logs = [], isLoading } = trpc.logs.getByDeployment.useQuery(
    { deploymentId: parseInt(selectedDeployment), limit: 200 },
    { enabled: !!selectedDeployment, refetchInterval: 3000 }
  );

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view logs.</p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); setLocation("/"); };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    const content = filteredLogs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.level?.toUpperCase()}] ${l.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployment-${selectedDeployment}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} transition={{ duration: 0.3 }}
          className={`${sidebarOpen ? "flex" : "hidden"} w-64 bg-card border-r border-border flex-col md:flex`}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-primary-foreground" /></div>
              <h1 className="text-xl font-bold">DevOps</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button key={item.href} whileHover={{ x: 4 }} onClick={() => setLocation(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.href === "/logs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                  <Icon className="w-4 h-4" /><span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.02 }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary text-primary-foreground text-sm">{user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback></Avatar>
                  <div className="flex-1 text-left min-w-0"><p className="text-sm font-medium truncate">{user?.name ?? "User"}</p><p className="text-xs text-muted-foreground capitalize">{user?.role}</p></div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled><span className="text-xs text-muted-foreground">{user?.email}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /><span>Logout</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}
            className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
            <h2 className="text-lg font-semibold">Deployment Logs</h2>
          </motion.header>

          <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a deployment" />
                </SelectTrigger>
                <SelectContent>
                  {deployments.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      #{d.id} · {d.version} ({d.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>

              <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)} className={autoScroll ? "border-primary text-primary" : ""}>
                {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
              </Button>

              {filteredLogs.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
              )}
            </div>

            {/* Log Viewer */}
            <Card className="flex-1 overflow-hidden bg-black/80 border-border">
              <div className="h-full overflow-auto p-4 font-mono text-sm">
                {!selectedDeployment ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Select a deployment to view logs</p>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Loading logs...</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">No logs found</div>
                ) : (
                  filteredLogs.map((log, i) => (
                    <div key={log.id ?? i} className={`flex gap-3 px-2 py-1 rounded mb-1 ${levelBg[log.level ?? "info"]}`}>
                      <span className="text-gray-500 shrink-0 text-xs mt-0.5">{new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19)}</span>
                      <span className={`${levelColors[log.level ?? "info"]} font-bold text-xs mt-0.5 shrink-0 w-12`}>[{(log.level ?? "info").toUpperCase()}]</span>
                      <span className="text-gray-200 break-all">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </Card>

            {selectedDeployment && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{filteredLogs.length} log entries</span>
                <span>·</span>
                <span className="text-green-400">{filteredLogs.filter(l => l.level === "info").length} info</span>
                <span>·</span>
                <span className="text-yellow-400">{filteredLogs.filter(l => l.level === "warn").length} warnings</span>
                <span>·</span>
                <span className="text-red-400">{filteredLogs.filter(l => l.level === "error").length} errors</span>
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
