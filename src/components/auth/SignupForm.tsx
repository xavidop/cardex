'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const signupSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters' }).max(50),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.displayName });
      }
      toast({ title: 'Signup successful', description: 'Redirecting to dashboard...' });
      // Redirect handled by AuthProvider or HomePage
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <div className="relative mt-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            {...register('displayName')}
            className="pl-10"
            placeholder="Ash Ketchum"
          />
        </div>
        {errors.displayName && <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>}
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="pl-10"
            placeholder="you@example.com"
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="pl-10"
            placeholder="••••••••"
          />
        </div>
        {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Account
      </Button>
    </form>
  );
}
