'use client';

import LoginForm from '@/components/auth/LoginForm';
import { AuthPageWrapper } from '@/components/auth/AuthPageWrapper';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';

export default function LoginPage() {
  return (
    <AuthPageWrapper>
      <AuthPageLayout
        title="Sign in to Cardex"
        subtitle="Access your TCG card collection."
        cardTitle="Welcome back"
        cardDescription="Enter your credentials to continue."
        form={<LoginForm />}
        footerText="Don't have an account?"
        footerLinkText="Sign up"
        footerLinkHref="/signup"
      />
    </AuthPageWrapper>
  );
}
