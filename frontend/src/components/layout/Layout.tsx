import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner"; // Using sonner for toasts if available, or just placeholder

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white font-sans antialiased selection:bg-secondary/30">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
