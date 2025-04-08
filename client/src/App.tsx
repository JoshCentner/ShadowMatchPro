import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import OpportunityDetail from "@/pages/opportunity-detail";
import CreateOpportunity from "@/pages/create-opportunity";
import Profile from "@/pages/profile";
import Applications from "@/pages/applications";
import YourOpportunities from "@/pages/your-opportunities";
import Auth from "@/pages/auth";
import AuthCallback from "@/pages/auth-callback";
import Header from "@/components/header";
import Footer from "@/components/footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/opportunities/:id" component={OpportunityDetail} />
          <Route path="/create-opportunity" component={CreateOpportunity} />
          <Route path="/edit-opportunity/:id" component={CreateOpportunity} />
          <Route path="/profile" component={Profile} />
          <Route path="/applications" component={Applications} />
          <Route path="/your-opportunities" component={YourOpportunities} />
          <Route path="/auth" component={Auth} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
