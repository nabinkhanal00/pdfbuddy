import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PDFTool } from "@/lib/pdf-tools";

interface ToolCardProps {
  tool: PDFTool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link href={tool.href} className="group block">
      <div
        className={cn(
          "relative rounded-xl p-6 transition-all duration-200",
          "border border-border bg-card",
          "hover:shadow-lg hover:border-transparent hover:scale-[1.02]",
          tool.bgColor
        )}
      >
        <div
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg",
            "bg-card shadow-sm"
          )}
        >
          <Icon className={cn("h-6 w-6", tool.color)} />
        </div>
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {tool.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
      </div>
    </Link>
  );
}
