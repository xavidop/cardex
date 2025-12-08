'use client';

import SignupForm from '@/components/auth/SignupForm';
import { AuthPageWrapper } from '@/components/auth/AuthPageWrapper';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function SignupPage() {
  return (
    <AuthPageWrapper>
      <AuthPageLayout
        title="Create your Cardex account"
        subtitle="Start managing your TCG card collection today."
        cardTitle="Get Started"
        cardDescription="It's quick and easy."
        form={<SignupForm />}
        footerText="Already have an account?"
        footerLinkText="Sign in"
        footerLinkHref="/login"
        googleButtonText="Or sign up with"
      />
    </AuthPageWrapper>
  );
}
