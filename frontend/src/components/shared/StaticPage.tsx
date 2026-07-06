import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const StaticPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 max-w-4xl pt-24 pb-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};

