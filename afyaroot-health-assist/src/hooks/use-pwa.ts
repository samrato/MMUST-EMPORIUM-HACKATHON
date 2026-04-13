import { useContext } from "react";

import { PwaContext } from "@/contexts/pwa-context";

export const usePwa = () => useContext(PwaContext);
