// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

type Props = { children: ReactNode };

export default function Providers({ children }: Props) {
  // NextAuth v5: no props needed; it reads cookies automatically
  return <SessionProvider>{children}</SessionProvider>;
}
