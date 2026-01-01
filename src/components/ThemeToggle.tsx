"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import * as React from "react";
import Solana from "../../public/solana.svg"

function IconSolana({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={Solana}
        alt="Solana"
        width={20}
        height={20}
      />
    </div>
  );
}

const themes = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "solana", label: "Solana", icon: IconSolana },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];
  const Icon = currentTheme.icon;

  const handleThemeChange = (value: string) => {
    setTheme(value);
    setOpen(false);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <IconSun className="size-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Current theme: ${currentTheme.label}. Click to change theme`}
          className="relative transition-all hover:scale-105 active:scale-95 theme-toggle-button hover:backdrop-blur-md hover:bg-background/80 hover:border hover:border-border/50 hover:shadow-lg"
        >
          {Icon === IconSolana ? (
            <Icon className="size-5 transition-opacity" />
          ) : (
            <Icon className="size-5 transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1.5">
        <div className="flex flex-col gap-1.5">
          {themes.map((t) => {
            const ThemeIcon = t.icon;
            const isSelected = theme === t.value;
            const isSolana = t.value === "solana";
            const isCurrentThemeSolana = theme === "solana";
            return (
              <button
                key={t.value}
                onClick={() => handleThemeChange(t.value)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-sm transition-colors cursor-pointer ${
                  isSelected
                    ? isSolana
                      ? "bg-gradient-to-r from-purple-500/20 to-purple-500/10 text-foreground font-medium backdrop-blur-md shadow-sm"
                      : "bg-accent text-accent-foreground font-medium"
                    : isCurrentThemeSolana
                      ? "text-muted-foreground hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-500/10 hover:backdrop-blur-md hover:text-foreground"
                      : isSolana
                        ? "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                {ThemeIcon === IconSolana ? (
                  <ThemeIcon className="size-4" />
                ) : (
                  <ThemeIcon className="size-4" />
                )}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}