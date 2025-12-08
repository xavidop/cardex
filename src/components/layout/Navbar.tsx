'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserCircle, ScanLine, BookOpen, Sparkles, Camera, Menu, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed out successfully' });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ title: 'Error signing out', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0].substring(0, 2);
  };

  const NavigationItems = ({ className = "", mobile = false }: { className?: string; mobile?: boolean }) => (
    <div className={`${mobile ? 'flex flex-col space-y-3' : 'flex items-center space-x-4'} ${className}`}>
      <Button variant="ghost" asChild className={mobile ? "justify-start" : ""}>
        <Link href="/dashboard/scan">
          <ScanLine className="mr-2 h-4 w-4" /> Scan Card
        </Link>
      </Button>
      <Button variant="ghost" asChild className={mobile ? "justify-start" : ""}>
        <Link href="/dashboard/generate">
          <Sparkles className="mr-2 h-4 w-4" /> Generate Card
        </Link>
      </Button>
      <Button variant="ghost" asChild className={mobile ? "justify-start" : ""}>
        <Link href="/dashboard/generate-from-photo">
          <Camera className="mr-2 h-4 w-4" /> Photo Card
        </Link>
      </Button>
      <Button variant="ghost" asChild className={mobile ? "justify-start" : ""}>
        <Link href="/dashboard/collection">
          <BookOpen className="mr-2 h-4 w-4" /> My Collection
        </Link>
      </Button>
    </div>
  );

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={user ? "/dashboard" : "/"} className="text-2xl font-headline font-bold text-primary hover:opacity-80 transition-opacity">
            Cardex
          </Link>
          
          <div className="flex items-center space-x-4">
            {!loading && user && (
              <>
                {/* Desktop Navigation - Hidden on mobile and tablet (lg:flex) */}
                <NavigationItems className="hidden lg:flex" />
                
                {/* Mobile/Tablet Navigation - Hidden on desktop (lg:hidden) */}
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Navigation</SheetTitle>
                      </SheetHeader>
                      <div className="pt-4">
                        <NavigationItems mobile={true} />
                      </div>
                      <div className="border-t pt-4 mt-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">
                              {user.displayName || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                        <Button variant="ghost" asChild className="w-full justify-start">
                          <Link href="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
            
            {/* User Avatar (Desktop only) - Hidden on mobile and tablet */}
            {!loading && user && (
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            {/* Login Button */}
            {!loading && !user && (
              <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
