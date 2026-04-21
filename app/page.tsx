import Link from "next/link";
import { ArrowDown, Globe, Shield, Zap } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToolCard } from "@/components/tool-card";
import { pdfTools, categories } from "@/lib/pdf-tools";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(228,92,70,0.14),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.07),_transparent_48%)]">
          <div className="absolute inset-x-0 top-0 h-px bg-border" />
          <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/80">
                Browser-first PDF workflow
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
                Every tool you need to work with PDFs
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                Merge, split, compress, convert, rotate, unlock, and watermark PDFs without the
                usual friction. Most file tools stay in your browser, with server rendering only
                where the job actually needs it.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Browser-first handling</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>Fast processing</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>Offline-ready after load</span>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <Link
                  href="/#organize"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Browse tools
                  <ArrowDown className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div id="all-tools">
          {categories.map((category) => {
            const toolsInCategory = pdfTools.filter((tool) => tool.category === category.id);

            return (
              <section key={category.id} id={category.id} className="scroll-mt-20 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                      {category.name}
                    </h2>
                    <p className="mt-2 text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {toolsInCategory.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground">Why choose PDF Tools?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Fast file work, clear security boundaries, and no account friction
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Most file tools run directly in your browser. HTML to PDF uses a server render
                  path because modern browsers cannot reliably print remote pages client-side.
                </p>
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  File-based tools avoid upload round-trips, and the heavier rendering tasks are
                  isolated to the one tool that needs them.
                </p>
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Globe className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Works Anywhere</h3>
                <p className="text-sm text-muted-foreground">
                  Use the app on any modern browser, and core file tools remain usable even when
                  you lose your connection after the site has loaded.
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
