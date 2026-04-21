import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { pdfTools, categories } from "@/lib/pdf-tools";
import { Shield, Zap, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance">
                Every tool you need to work with PDFs
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty">
                Free online PDF tools to merge, split, compress, convert, rotate, unlock, and 
                watermark PDFs with ease. No registration or installation required.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-full px-4 py-2 border border-border">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>100% Secure</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-full px-4 py-2 border border-border">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>Fast Processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-full px-4 py-2 border border-border">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>Works Offline</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools by Category */}
        {categories.map((category) => {
          const toolsInCategory = pdfTools.filter((tool) => tool.category === category.id);
          return (
            <section key={category.id} id={category.id} className="py-16 scroll-mt-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{category.name}</h2>
                  <p className="mt-2 text-muted-foreground">{category.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {toolsInCategory.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* Features Section */}
        <section className="py-20 bg-card border-y border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">Why choose PDF Tools?</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                All our tools are designed to be fast, secure, and easy to use
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  All files are processed locally in your browser. Your data never leaves your device.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Process PDFs instantly without uploading. No waiting for server responses.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Works Anywhere</h3>
                <p className="text-sm text-muted-foreground">
                  Use on any device with a modern browser. No software installation required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
