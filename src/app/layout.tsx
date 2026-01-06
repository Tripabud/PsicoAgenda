
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// GeistMono was removed as it's not used and caused an error previously
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// GeistSans is imported as an object.
// Its .variable property is a class name that sets up the CSS variable.
// It should not be called as a function.

export const metadata: Metadata = {
  title: 'PsicoAgenda',
  description: 'Gestiona el horario semanal, asistencia, pagos e informes de tu consulta de psicología.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${GeistSans.variable}`} suppressHydrationWarning>
      {/*
        The GeistSans.variable is a class name that defines
        a CSS custom property (--font-geist-sans) on the html element.
        The globals.css file already uses var(--font-geist-sans) for the body's font-family.
      */}
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

