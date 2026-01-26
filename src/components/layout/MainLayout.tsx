import { forwardRef, ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 ml-64">
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </main>
      </div>
    );
  }
);

MainLayout.displayName = 'MainLayout';
