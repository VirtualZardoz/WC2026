import Sidebar from '@/components/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col md:flex-row bg-bg-light dark:bg-bg-dark">
      {/* Sidebar (desktop) / Header (mobile) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
              <p>World Cup Pronostics 2026 - Family Prediction Competition</p>
              <p className="mt-1">&copy; {new Date().getFullYear()} All rights reserved</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
