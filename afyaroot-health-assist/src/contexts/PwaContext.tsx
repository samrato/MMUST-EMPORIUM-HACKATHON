import { type ReactNode, useEffect, useMemo, useState } from "react";
import { registerSW } from "virtual:pwa-register";

import { ToastAction } from "@/components/ui/toast";
import { PwaContext, type PwaContextValue } from "@/contexts/pwa-context";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const getStandaloneState = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
};

const isIosDevice = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(getStandaloneState);
  const [isInstalled, setIsInstalled] = useState(getStandaloneState);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");

    const syncInstallState = () => {
      const nextState = getStandaloneState();
      setIsStandalone(nextState);
      setIsInstalled(nextState);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsStandalone(true);
      toast({
        title: "App installed",
        description: "AFYAROOT is now available from your home screen for faster access.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener("change", syncInstallState);
    syncInstallState();

    if (import.meta.env.PROD) {
      const updateSW = registerSW({
        immediate: true,
        onOfflineReady() {
          toast({
            title: "Offline mode ready",
            description: "AFYAROOT can now open from cache when the network is unavailable.",
          });
        },
        onNeedRefresh() {
          toast({
            title: "Update available",
            description: "Reload once to use the latest version of the app.",
            action: (
              <ToastAction altText="Reload app" onClick={() => void updateSW()}>
                Reload
              </ToastAction>
            ),
          });
        },
        onRegisterError(error) {
          console.error("PWA registration failed", error);
        },
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode.removeEventListener("change", syncInstallState);
    };
  }, []);

  const isIosInstallable = isIosDevice() && !isStandalone;

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt) || isIosInstallable,
      installLabel: isIosInstallable ? "Add to Home Screen" : "Install App",
      isInstalled,
      isStandalone,
      isIosInstallable,
      promptInstall: async () => {
        if (deferredPrompt) {
          await deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === "accepted") {
            setDeferredPrompt(null);
            return true;
          }
          return false;
        }

        if (isIosInstallable) {
          toast({
            title: "Install on iPhone or iPad",
            description: "Open the Share menu in Safari, then choose Add to Home Screen.",
          });
        }

        return false;
      },
    }),
    [deferredPrompt, isInstalled, isIosInstallable, isStandalone],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
