import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Terminal, Home, Rocket, Sliders, Activity, Users, Menu, Zap, LogOut, Plus, Eye, EyeOff, Trash2, Edit, Check, X } from "lucide-react";
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

export default function EnvVars() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: envVars = [], refetch } = trpc.environmentVariables.listByService.useQuery(
    { serviceId: parseInt(selectedService) },
    { enabled: !!selectedService }
  );

  const createMutation = trpc.environmentVariables.create.useMutation({
    onSuccess: () => { refetch(); setIsDialogOpen(false); setNewKey(""); setNewValue(""); setNewIsSecret(false); toast.success("Variable created"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.environmentVariables.update.useMutation({
    onSuccess: () => { refetch(); setEditingId(null); toast.success("Variable updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.environmentVariables.delete.useMutation({
    onSuccess: () => { refetch(); setDeleteConfirmId(null); toast.success("Variable deleted"); },
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
  const canEdit = ["developer", "admin"].includes(user?.role ?? "");

  const handleCreate = () => {
    if (!selectedService || !newKey || !newValue) return;
    createMutation.mutate({ serviceId: parseInt(selectedService), key: newKey, value: newValue, isSecret: newIsSecret });
  };

  const toggleReveal = (id: number) => {
    const next = new Set(revealedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRevealedIds(next);
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.href === "/env" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
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
              <h2 className="text-lg font-semibold">Environment Variables</h2>
            </div>
            {canEdit && selectedService && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" />Add Variable</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Environment Variable</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Key</label>
                      <Input placeholder="DATABASE_URL" value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, "_"))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Value</label>
                      <Input placeholder="value" type={newIsSecret ? "password" : "text"} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isSecret" checked={newIsSecret} onChange={(e) => setNewIsSecret(e.target.checked)} className="rounded" />
                      <label htmlFor="isSecret" className="text-sm">Mark as secret (value will be masked)</label>
                    </div>
                    <Button onClick={handleCreate} disabled={!newKey || !newValue || createMutation.isPending} className="w-full">
                      {createMutation.isPending ? "Adding..." : "Add Variable"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.header>

          <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-auto p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedService && <span className="text-sm text-muted-foreground">{envVars.length} variable{envVars.length !== 1 ? "s" : ""}</span>}
            </div>

            {!selectedService ? (
              <Card className="p-12 text-center">
                <Sliders className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">Select a service to manage its environment variables</p>
              </Card>
            ) : envVars.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No environment variables for this service</p>
                {canEdit && <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>Add First Variable</Button>}
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-card-foreground/5">
                      <th className="px-6 py-3 text-left text-sm font-semibold">Key</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Value</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Updated</th>
                      {canEdit && <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {envVars.map((ev) => (
                      <motion.tr key={ev.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }} className="border-b border-border">
                        <td className="px-6 py-4 font-mono text-sm font-semibold text-blue-400">{ev.key}</td>
                        <td className="px-6 py-4 text-sm font-mono max-w-xs">
                          {editingId === ev.id ? (
                            <div className="flex items-center gap-2">
                              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" type={ev.isSecret ? "password" : "text"} />
                              <button onClick={() => updateMutation.mutate({ id: ev.id, value: editValue })} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-48">
                                {ev.isSecret && !revealedIds.has(ev.id) ? "••••••••••••" : ev.value}
                              </span>
                              {ev.isSecret && (
                                <button onClick={() => toggleReveal(ev.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                                  {revealedIds.has(ev.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${ev.isSecret ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                            {ev.isSecret ? "Secret" : "Plain"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(ev.updatedAt).toLocaleDateString()}</td>
                        {canEdit && (
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {deleteConfirmId === ev.id ? (
                                <>
                                  <button onClick={() => deleteMutation.mutate({ id: ev.id })} className="text-red-400 hover:text-red-300 text-xs font-medium">Confirm Delete</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="text-muted-foreground hover:text-foreground text-xs">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditingId(ev.id); setEditValue(ev.value); }} className="text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => setDeleteConfirmId(ev.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
