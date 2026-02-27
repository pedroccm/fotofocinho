import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fotofocinho-pet.netlify.app"),
  title: "Fotofocinho — Seu pet como obra de arte",
  description:
    "Transforme seu pet em uma obra de arte renascentista. Upload gratuito, preview instantâneo, quadros premium entregues na sua porta.",
  openGraph: {
    title: "Fotofocinho — Pet Portraits",
    description: "Transforme seu pet em uma obra de arte renascentista.",
    type: "website",
    url: "https://fotofocinho-pet.netlify.app",
    siteName: "Fotofocinho",
    locale: "pt_BR",
    images: [
      {
        url: "/samples/output/dog1/renaissance.jpg",
        width: 1200,
        height: 630,
        alt: "Fotofocinho - Pet Portrait",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fotofocinho — Seu pet como obra de arte",
    description: "Transforme seu pet em uma obra de arte renascentista.",
    images: ["/samples/output/dog1/renaissance.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${nunito.variable}`}>
      <head>
        <script
          defer
          data-domain="fotofocinho-pet.netlify.app"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
