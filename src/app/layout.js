import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YourTurn — Час з дитиною",
  description: "Трекер часу батьків з дитиною. Відстежуйте хто скільки проводить часу з дитиною.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YourTurn",
  },
  openGraph: {
    title: "YourTurn — Час з дитиною",
    description: "Трекер часу батьків з дитиною. Відстежуйте хто скільки проводить часу з дитиною.",
    url: "https://your-turn-three.vercel.app",
    siteName: "YourTurn",
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YourTurn — Час з дитиною",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YourTurn — Час з дитиною",
    description: "Трекер часу батьків з дитиною",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full flex flex-col bg-zinc-950 text-white overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
