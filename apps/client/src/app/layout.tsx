import "./globals.css";
import Providers from "./providers";
import { MainLayout } from "@/components/layout/MainLayout";
import { me } from "@/lib/auth";
import type { User } from "@/types";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata = {
  title: "Kosalla - Ticketing System",
  description: "Professional ticketing management system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch current user dari API
  let user: User | null = null;

  try {
    const response = await me();
    user = response?.user;
  } catch (error) {
    console.log("User not authenticated");
  }

  // Jika user tidak login, render halaman tanpa layout
  // (middleware akan redirect ke login)
  if (!user) {
    return (
      <html lang="en">
        <body>
          <ErrorBoundary>
            <Providers>{children}</Providers>
          </ErrorBoundary>
        </body>
      </html>
    );
  }

  // Jika user login, wrap dengan MainLayout
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            <MainLayout user={user}>{children}</MainLayout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

