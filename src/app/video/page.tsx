// src/app/video/page.tsx
import VideoPageClient from "./VideoPageClient";

export default function Page() {
  // pass via server component to avoid reading env directly in client
  return <VideoPageClient />;
}
