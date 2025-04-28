import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import CalculatorsPage from "@/pages/CalculatorsPage";
import SipCalculatorPage from "@/pages/SipCalculatorPage"; 
import SwpCalculatorPage from "@/pages/SwpCalculatorPage";
import EmiCalculatorPage from "@/pages/EmiCalculatorPage";
import LumpsumCalculatorPage from "@/pages/LumpsumCalculatorPage";
import SipTopUpCalculatorPage from "@/pages/SipTopUpCalculatorPage";
import InflationCalculatorPage from "@/pages/InflationCalculatorPage";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import AdminPanel from "@/pages/AdminPanel";

// Protected Route Component
function ProtectedRoute({ component: Component }: { component: React.ElementType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <Component />;
}

// Admin Route Guard
function AdminRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  if (!user || user.role !== "ADMIN") {
    return <Redirect to="/auth" />;
  }
  
  return <AdminPanel />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/calculators" component={CalculatorsPage} />
      <Route path="/calculators/sip" component={SipCalculatorPage} />
      <Route path="/calculators/swp" component={SwpCalculatorPage} />
      <Route path="/calculators/emi" component={EmiCalculatorPage} />
      <Route path="/calculators/inflation" component={InflationCalculatorPage} />
      <Route path="/calculators/lumpsum">
        {() => <ProtectedRoute component={LumpsumCalculatorPage} />}
      </Route>
      <Route path="/calculators/sip-topup">
        {() => <ProtectedRoute component={SipTopUpCalculatorPage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
