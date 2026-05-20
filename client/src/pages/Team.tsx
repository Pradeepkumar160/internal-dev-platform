import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Terminal, Home, Rocket, Sliders, Activity, Users, Menu, Zap, LogOut, Trash2, Shield, User, Eye } from "lucide-react";
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

const roleIcons: Record<string, React.ElementType> = {
  admin: Shield,
  developer: User,
  viewer: Eye,
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  developer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  viewer: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function Team() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: teamUsers = [], isLoading, refetch } = trpc.team.listUsers.useQuery();

  const updateRoleMutation = trpc.team.updateUserRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteUserMutation = trpc.team.deleteUser.useMutation({
    onSuccess: () => { refetch(); setDeleteConfirmId(null); toast.success("User removed"); },
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

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2">Admin Only</h1>
          <p className="text-muted-foreground mb-6">Team management requires admin privileges.</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => { await logout(); setLocation("/"); };

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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${item.href === "/team" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
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
            className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-accent rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
            <h2 className="text-lg font-semibold">Team Management</h2>
            <div className="ml-auto">
              <span className="text-sm text-muted-foreground">{teamUsers.length} member{teamUsers.length !== 1 ? "s" : ""}</span>
            </div>
          </motion.header>

          <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex-1 overflow-auto p-6">
            {/* Role legend */}
            <div className="flex gap-3 mb-6 flex-wrap">
              {["admin", "developer", "viewer"].map((role) => {
                const Icon = roleIcons[role];
                return (
                  <div key={role} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${roleColors[role]}`}>
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{role}</span>
                  </div>
                );
              })}
              <span className="text-xs text-muted-foreground ml-2 self-center">· Click dropdown to change roles</span>
            </div>

            {isLoading ? (
              <div className="text-center text-muted-foreground py-12">Loading team...</div>
            ) : teamUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No users registered yet</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-card-foreground/5">
                      <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Last Signed In</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamUsers.map((member) => {
                      const RoleIcon = roleIcons[member.role] ?? User;
                      return (
                        <motion.tr key={member.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }} className="border-b border-border">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {member.name?.charAt(0).toUpperCase() ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.name ?? "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{member.loginMethod ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{member.email ?? "—"}</td>
                          <td className="px-6 py-4 text-sm">
                            <Select
                              value={member.role}
                              onValueChange={(v) => member.id !== user?.id && updateRoleMutation.mutate({ userId: member.id, role: v as any })}
                              disabled={member.id === user?.id}
                            >
                              <SelectTrigger className={`w-36 h-8 text-xs border ${roleColors[member.role]}`}>
                                <div className="flex items-center gap-1.5">
                                  <RoleIcon className="w-3 h-3" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="developer">Developer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {member.lastSignedIn ? new Date(member.lastSignedIn).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {member.id === user?.id ? (
                              <span className="text-xs text-muted-foreground italic">You</span>
                            ) : deleteConfirmId === member.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => deleteUserMutation.mutate({ userId: member.id })} className="text-red-400 hover:text-red-300 text-xs font-medium">Confirm</button>
                                <button onClick={() => setDeleteConfirmId(null)} className="text-muted-foreground hover:text-foreground text-xs">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirmId(member.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
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
