'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingButton } from './loading-button';
import { Card } from '@/components/ui/card';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, username, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    // Simulate logout delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout();
    setIsSigningOut(false);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'News Analyzer', href: '/news-analyzer' },
    { label: 'News Summarizer', href: '/news-summarizer' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 p-1.5">
            <span className="text-lg font-bold text-primary">W</span>
          </div>
          <span className="hidden font-bold text-foreground sm:inline">WiseNews</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} />
                  <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  {username}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <Card className="animate-fadeIn absolute right-0 mt-2 w-48 border-border bg-card shadow-lg z-50">
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">User</p>
                      <p className="text-sm font-semibold text-foreground mt-1">{username}</p>
                    </div>
                    <div className="border-t border-border"></div>
                    <LoadingButton
                      onClick={handleSignOut}
                      isLoading={isSigningOut}
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </LoadingButton>
                  </div>
                </Card>
              )}
            </div>
          ) : null}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-2 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
