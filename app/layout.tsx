import type { Metadata } from "next";
import { Alfa_Slab_One } from "next/font/google";
import "./globals.css";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa",
});

export const metadata: Metadata = {
  title: "MovenTrax",
  description: "Transportation Request Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${alfa.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}