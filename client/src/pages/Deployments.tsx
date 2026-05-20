import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Rocket, Plus, CheckCircle, AlertCircle, Clock, LogOut, Home, Terminal, Sliders, Activity, Users, Menu, Zap } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navigationItems = [
  { label: "Dashboard", icon: Home, href: "/dashboard" },
  { label: "Deployments", icon: Rocket, href: "/deployments" },
  { label: "Logs", icon: Terminal, href: "/logs" },
  { label: "Env Variables", icon: Sliders, href: "/env" },
  { label: "Service Health", icon: Activity, href: "/health" },
  { label: "Team", icon: Users, href: "/team" },
];

export default function Deployments() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [version, setVersion] = useState("");
  const [branch, setBranch] = useState("main");

  const { data: deployments = [], isLoading, refetch } = trpc.deployments.list.useQuery({ limit: 50 });
  const { data: services = [] } = trpc.services.list.useQuery();
  const createDeploymentMutation = trpc.deployments.create.useMutation({
    onSuccess: () => { refetch(); setIsDialogOpen(false); setSelectedService(""); setVersion(""); setBranch("main"); toast.success("Deployment triggered!"); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view deployments.</p>
          <Button onClick={() => (window.location.href = "/")} className="w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); setLocation("/"); };

  const handleTriggerDeployment = async () => {
    if (!selectedService || !version) return;
    createDeploymentMutation.mutate({ serviceId: parseInt(selectedService), version, branch });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "pending": case "in_progress": return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "failed": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending": case "in_progress": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const canDeploy = ["developer", "admin"].includes(user?.role ?? "");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Sidebar */}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.href === "/deployments" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}
            className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">Deployments</h2>
            </div>
            {canDeploy && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" />Trigger Deployment</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Trigger New Deployment</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Service</label>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                        <SelectContent>
                          {services.length === 0 ? (
                            <SelectItem value="none" disabled>No services available</SelectItem>
                          ) : services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>{service.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Version</label>
                      <Input placeholder="e.g., v1.2.3" value={version} onChange={(e) => setVersion(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Branch</label>
                      <Input placeholder="main" value={branch} onChange={(e) => setBranch(e.target.value)} />
                    </div>
                    <Button onClick={handleTriggerDeployment} disabled={!selectedService || !version || createDeploymentMutation.isPending} className="w-full">
                      {createDeploymentMutation.isPending ? "Triggering..." : "Trigger Deployment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.header>

          <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-auto p-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total", value: deployments.length, color: "text-foreground" },
                { label: "Success", value: deployments.filter(d => d.status === "success").length, color: "text-green-400" },
                { label: "Failed", value: deployments.filter(d => d.status === "failed").length, color: "text-red-400" },
                { label: "In Progress", value: deployments.filter(d => ["pending", "in_progress"].includes(d.status)).length, color: "text-yellow-400" },
              ].map((stat) => (
                <Card key={stat.label} className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-card-foreground/5">
                      <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Service</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Version</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Branch</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Commit</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading deployments...</td></tr>
                    ) : deployments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Rocket className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground">No deployments yet</p>
                          {canDeploy && <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>Trigger First Deployment</Button>}
                        </td>
                      </tr>
                    ) : (
                      deployments.map((deployment) => {
                        const svc = services.find(s => s.id === deployment.serviceId);
                        return (
                          <motion.tr key={deployment.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }} className="border-b border-border">
                            <td className="px-6 py-4 text-sm text-muted-foreground">#{deployment.id}</td>
                            <td className="px-6 py-4 text-sm font-medium">{svc?.name ?? `Service #${deployment.serviceId}`}</td>
                            <td className="px-6 py-4 text-sm font-mono text-blue-400">{deployment.version}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(deployment.status)}`}>
                                {getStatusIcon(deployment.status)}
                                <span className="capitalize text-xs">{deployment.status.replace("_", " ")}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{deployment.branch}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{deployment.commitSha ? deployment.commitSha.substring(0, 8) : "—"}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(deployment.createdAt).toLocaleDateString()}</td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
