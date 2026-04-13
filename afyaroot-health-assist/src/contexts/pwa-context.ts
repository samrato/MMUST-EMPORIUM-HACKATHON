import { createContext } from "react";

export interface PwaContextValue {
  canInstall: boolean;
  installLabel: string;
  isInstalled: boolean;
  isStandalone: boolean;
  isIosInstallable: boolean;
  promptInstall: () => Promise<boolean>;
}

export const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  installLabel: "Install App",
  isInstalled: false,
  isStandalone: false,
  isIosInstallable: false,
  promptInstall: async () => false,
});
