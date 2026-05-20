import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Rocket, Shield, BarChart3, Terminal, Activity, Users } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const [devLogging, setDevLogging] = React.useState(false);
  const [devLoginError, setDevLoginError] = React.useState<string | null>(null);
  
  const devLogin = async () => {
    setDevLogging(true);
    setDevLoginError(null);
    try {
      const res = await fetch("/api/dev-login", { method: "POST", credentials: "include" });
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        const body = await res.text();
        setDevLoginError(`Login failed: ${body}`);
      }
    } catch (e: any) {
      setDevLoginError(`Error: ${e.message}`);
    } finally {
      setDevLogging(false);
    }
  };

  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Internal Developer Platform</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl sm:text-6xl font-bold mb-6 leading-tight"
          >
            Manage Your Infrastructure with Elegance
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            A production-grade platform for CI/CD automation, deployment management, and real-time infrastructure monitoring.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Button
              onClick={devLogin}
              size="lg"
              className="gap-2 min-w-[200px]"
              disabled={devLogging}
            >
              {devLogging ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Enter Platform
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>

          {devLoginError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg"
            >
              {devLoginError}
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            Running locally — no OAuth required. Logs in as Admin automatically.
          </motion.p>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: "Deployment Management",
                description: "Trigger and monitor deployments with real-time status updates and version tracking.",
              },
              {
                icon: Shield,
                title: "Role-Based Access Control",
                description: "Manage team access with admin, developer, and viewer roles for fine-grained permissions.",
              },
              {
                icon: BarChart3,
                title: "Real-Time Monitoring",
                description: "Monitor service health, deployment logs, and infrastructure metrics in real-time.",
              },
              {
                icon: Terminal,
                title: "Live Log Streaming",
                description: "Stream deployment logs in real-time via WebSockets for immediate feedback.",
              },
              {
                icon: Activity,
                title: "Service Health Tracking",
                description: "Track uptime and health status of all your services in one dashboard.",
              },
              {
                icon: Users,
                title: "Team Management",
                description: "Invite teammates, assign roles, and manage access from a central admin panel.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border text-center text-sm text-muted-foreground">
        <p>Internal Developer Platform · Built for your team</p>
      </footer>
    </div>
  );
}
