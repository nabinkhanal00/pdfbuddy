"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  children,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Tools
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl shadow-sm",
                iconBgColor,
              )}
            >
              <Icon className={cn("h-7 w-7", iconColor)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
