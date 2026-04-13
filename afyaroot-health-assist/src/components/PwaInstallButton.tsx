import { Download } from "lucide-react";

import { usePwa } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";

interface PwaInstallButtonProps {
  className?: string;
  compact?: boolean;
}

export default function PwaInstallButton({ className, compact = false }: PwaInstallButtonProps) {
  const { canInstall, installLabel, promptInstall } = usePwa();

  if (!canInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
        compact && "px-3 py-2 text-xs",
        className,
      )}
    >
      <Download className={cn("h-4 w-4", compact && "h-3.5 w-3.5")} />
      {installLabel}
    </button>
  );
}
