import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'AIFlows',
  description: 'Hosted Mission Control for watching AI agent Flows.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
