'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SignupForm from '@/components/auth/SignupForm';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground font-headline">
          Create your Cardex account
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Start managing your Pokémon card collection today.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>It&apos;s quick and easy.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or sign up with
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <GoogleSignInButton />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" legacyBehavior>
                <a className="font-medium text-primary hover:text-primary/80">
                  Sign in
                </a>
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
