import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Terminal, Home, Rocket, Sliders, Activity, Users, Menu, Zap, LogOut, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";

const navigationItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Deployments", icon: Rocket, href: "/deployments" },
  { label: "Logs", icon: Terminal, href: "/logs" },
  { label: "Env Variables", icon: Sliders, href: "/env" },
  { label: "Service Health", icon: Activity, href: "/health" },
  { label: "Team", icon: Users, href: "/team" },
];

export default function ServiceHealth() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateServiceId, setUpdateServiceId] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"healthy" | "degraded" | "down">("healthy");
  const [updateUptime, setUpdateUptime] = useState("99.9");

  const { data: services = [], isLoading, refetch } = trpc.services.list.useQuery(undefined, { refetchInterval: 10000 });

  const createMutation = trpc.services.create.useMutation({
    onSuccess: () => { refetch(); setIsAddOpen(false); setNewName(""); setNewDesc(""); toast.success("Service added"); },
    onError: (e) => toast.error(e.message),
  });

  const updateHealthMutation = trpc.services.updateHealth.useMutation({
    onSuccess: () => { refetch(); setIsUpdateOpen(false); toast.success("Health updated"); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <Button onClick={() => (window.location.href = "/")} className="w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); setLocation("/"); };
  const isAdmin = user?.role === "admin";

  const healthyCount = services.filter(s => s.status === "healthy").length;
  const degradedCount = services.filter(s => s.status === "degraded").length;
  const downCount = services.filter(s => s.status === "down").length;

  const openUpdateModal = (service: typeof services[0]) => {
    setUpdateServiceId(service.id);
    setUpdateStatus(service.status);
    setUpdateUptime(service.uptime?.toString() ?? "100");
    setIsUpdateOpen(true);
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.href === "/health" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
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
                  <div className="flex-1 text-left min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-muted-foreground capitalize">{user?.role}</p></div>
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
            className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">Service Health</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2"><RefreshCw className="w-4 h-4" />Refresh</Button>
              {isAdmin && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" />Add Service</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="text-sm font-medium block mb-1">Service Name</label><Input placeholder="api-gateway" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                      <div><label className="text-sm font-medium block mb-1">Description (optional)</label><Input placeholder="Main API gateway service" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} /></div>
                      <Button onClick={() => createMutation.mutate({ name: newName, description: newDesc })} disabled={!newName || createMutation.isPending} className="w-full">
                        {createMutation.isPending ? "Adding..." : "Add Service"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </motion.header>

          <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-auto p-6 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Healthy", count: healthyCount, color: "bg-green-500/10 border-green-500/20 text-green-400", dot: "bg-green-500" },
                { label: "Degraded", count: degradedCount, color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400", dot: "bg-yellow-500" },
                { label: "Down", count: downCount, color: "bg-red-500/10 border-red-500/20 text-red-400", dot: "bg-red-500" },
              ].map((item) => (
                <motion.div key={item.label} whileHover={{ y: -4 }} className={`border rounded-xl p-5 ${item.color}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.dot}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-3xl font-bold ml-auto">{item.count}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Services Grid */}
            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">Loading services...</div>
            ) : services.length === 0 ? (
              <Card className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No services registered yet</p>
                {isAdmin && <Button className="mt-4" onClick={() => setIsAddOpen(true)}>Add First Service</Button>}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => {
                  const uptimeNum = parseFloat(service.uptime?.toString() ?? "100");
                  return (
                    <motion.div key={service.id} whileHover={{ y: -4 }} className="bg-card border border-border rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{service.name}</h3>
                          {service.description && <p className="text-xs text-muted-foreground mt-1 truncate">{service.description}</p>}
                        </div>
                        <div className={`flex items-center gap-1.5 ml-3 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          service.status === "healthy" ? "bg-green-500/20 text-green-400" :
                          service.status === "degraded" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${service.status === "healthy" ? "bg-green-400 animate-pulse" : service.status === "degraded" ? "bg-yellow-400" : "bg-red-400"}`} />
                          <span className="capitalize">{service.status}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Uptime</span>
                          <span className="font-semibold">{uptimeNum.toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-card-foreground/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${uptimeNum > 99 ? "bg-green-500" : uptimeNum > 95 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(uptimeNum, 100)}%` }}
                          />
                        </div>
                      </div>

                      {service.lastHealthCheck && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Last check: {new Date(service.lastHealthCheck).toLocaleString()}
                        </p>
                      )}

                      {isAdmin && (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => openUpdateModal(service)}>
                          Update Status
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.main>
        </div>
      </div>

      {/* Update Health Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Service Health</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Status</label>
              <Select value={updateStatus} onValueChange={(v) => setUpdateStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="down">Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Uptime %</label>
              <Input type="number" min="0" max="100" step="0.01" value={updateUptime} onChange={(e) => setUpdateUptime(e.target.value)} />
            </div>
            <Button onClick={() => updateServiceId && updateHealthMutation.mutate({ id: updateServiceId, status: updateStatus, uptime: parseFloat(updateUptime) })} disabled={updateHealthMutation.isPending} className="w-full">
              {updateHealthMutation.isPending ? "Updating..." : "Update Health"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
