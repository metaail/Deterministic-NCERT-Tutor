import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Math Tutor',
  description: 'A high-performance streaming AI tutor specializing in advanced mathematics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
