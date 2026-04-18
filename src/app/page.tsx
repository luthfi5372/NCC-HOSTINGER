// Server Component — ZERO browser APIs, ZERO client imports
// All client-side content is loaded inside HomeClient component
import HomeClient from "@/components/HomeClient";

export default function Home() {
  return <HomeClient />;
}
