import Link from "next/link";
import { FileText } from "lucide-react";
import { pdfTools, categories } from "@/lib/pdf-tools";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">PDF Tools</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Browser-first PDF tools to edit, convert, and manage documents without setup or
              account friction.
            </p>
          </div>

          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-semibold text-foreground mb-3">{category.name}</h3>
              <ul className="space-y-2">
                {pdfTools
                  .filter((tool) => tool.category === category.id)
                  .slice(0, 4)
                  .map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={tool.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} PDF Tools. Most tools run locally in your browser; HTML to
            PDF is rendered server-side.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
