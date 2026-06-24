import React from 'react';
import NavigationSidebar from '../components/NavigationSidebar';
import { AppProvider } from '../components/AppContext';
import './globals.css';

export const metadata = {
  title: 'Classic Flight Engineer Panel',
  description: 'Flight calculation panel for classic aircraft simulation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <AppProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <NavigationSidebar />
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
