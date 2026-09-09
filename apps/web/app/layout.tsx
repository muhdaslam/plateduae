import type { ReactNode } from "react";

export const metadata = {
  title: "Plated",
  description: "Search food by dish, not by restaurant, and compare what it costs nearby.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
