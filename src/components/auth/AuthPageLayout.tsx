'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  form: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  googleButtonText?: string;
}

/**
 * Shared layout component for authentication pages (login/signup).
 * Provides consistent structure with header, form, Google sign-in, and footer.
 */
export function AuthPageLayout({
  title,
  subtitle,
  cardTitle,
  cardDescription,
  form,
  footerText,
  footerLinkText,
  footerLinkHref,
  googleButtonText = 'Or continue with',
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground font-headline">
          {title}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {form}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">
                    {googleButtonText}
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
              {footerText}{' '}
              <Link href={footerLinkHref} legacyBehavior>
                <a className="font-medium text-primary hover:text-primary/80">
                  {footerLinkText}
                </a>
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
