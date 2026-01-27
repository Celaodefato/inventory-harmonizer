import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
                'relative h-9 w-9 rounded-lg transition-all',
                'hover:bg-sidebar-accent'
            )}
            aria-label="Toggle theme"
        >
            <Sun className={cn(
                'h-5 w-5 transition-all',
                theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
            )} />
            <Moon className={cn(
                'absolute h-5 w-5 transition-all',
                theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
            )} />
        </Button>
    );
}
