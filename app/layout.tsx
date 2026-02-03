import './globals.css';

export const metadata = {
  title: 'Bizlytics',
  description: 'AI-Powered Business Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        {children}
      </body>
    </html>
  );
}
