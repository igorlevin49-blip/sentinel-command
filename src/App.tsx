import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Objects from "./pages/Objects";
import Personnel from "./pages/Personnel";
import Incidents from "./pages/Incidents";
import Shifts from "./pages/Shifts";
import Patrols from "./pages/Patrols";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/objects" element={<Objects />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/patrols" element={<Patrols />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;