import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Deployments from "./pages/Deployments";
import Logs from "./pages/Logs";
import EnvVars from "./pages/EnvVars";
import ServiceHealth from "./pages/ServiceHealth";
import Team from "./pages/Team";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/deployments"} component={Deployments} />
      <Route path={"/logs"} component={Logs} />
      <Route path={"/env"} component={EnvVars} />
      <Route path={"/health"} component={ServiceHealth} />
      <Route path={"/team"} component={Team} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="dark">
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
