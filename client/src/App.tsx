import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import InvoiceBuilder from "@/pages/invoice-builder";


function Router() {
  return (
    <Switch>
      <Route path="/" component={InvoiceBuilder} />
      <Route path="/settings" component={InvoiceBuilder} />
      <Route path="/dashboard" component={InvoiceBuilder} />
      <Route path="/invoice" component={InvoiceBuilder} />
      <Route path="/delivery" component={InvoiceBuilder} />
      <Route path="/hamali" component={InvoiceBuilder} />
      <Route path="/customers" component={InvoiceBuilder} />
      <Route path="/products" component={InvoiceBuilder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
