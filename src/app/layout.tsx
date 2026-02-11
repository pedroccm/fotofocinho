import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fotofocinho — Seu pet como obra de arte",
  description:
    "Transforme seu pet em uma obra de arte renascentista. Upload gratuito, preview instantâneo, quadros premium entregues na sua porta.",
  openGraph: {
    title: "Fotofocinho — Pet Portraits",
    description: "Transforme seu pet em uma obra de arte renascentista.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
