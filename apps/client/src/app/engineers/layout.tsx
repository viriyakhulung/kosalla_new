import { AuthGuard } from "@/components/AuthGuard";

export default function EngineerLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
