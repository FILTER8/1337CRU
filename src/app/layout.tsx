import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import '@/app/globals.css';

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-silkscreen',
});

export const metadata: Metadata = {
  title: '1337 CRU',
  description: 'fully on-chain on eth - CC0',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${silkscreen.variable} antialiased`}>{children}</body>
    </html>
  );
}