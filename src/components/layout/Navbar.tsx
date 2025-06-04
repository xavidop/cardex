'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserCircle, ScanLine, BookOpen } from 'lucide-react';
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
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/scan">
                    <ScanLine className="mr-2 h-4 w-4" /> Scan Card
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/collection">
                    <BookOpen className="mr-2 h-4 w-4" /> My Collection
                  </Link>
                </Button>
              </>
            )}
            {!loading && (
              user ? (
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
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
