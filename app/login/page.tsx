'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginFormValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { StarField } from '@/components/cosmos/StarField';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-sm border border-rule-lit bg-void-2/70 px-4 py-3 text-[0.9375rem] text-starlight transition-colors duration-300 placeholder:text-star-ghost focus:border-azure-lit focus:outline-none';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      toast.success('Signed in');
      router.push('/admin/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Sign in failed. Check the address and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main" className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <StarField density={150} meteorRate={2} />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #0080c0, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="relative block h-14 w-14">
            <Image
              src="/images/astro_logo.png"
              alt=""
              fill
              sizes="56px"
              priority
              className="object-contain"
            />
          </span>
          <h1 className="display mt-6 text-[1.75rem]">Committee sign-in</h1>
          <p className="label-chart mt-3">J&apos;pura Astronomy Club</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="label-chart block">
              Email
            </label>
            <input
              id="email"
              {...register('email')}
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(field, 'mt-2.5', errors.email && 'border-destructive/70')}
              placeholder="you@sjp.ac.lk"
            />
            {errors.email && (
              <p id="email-error" className="mt-2 text-[0.8125rem] text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="label-chart block">
              Password
            </label>
            <input
              id="password"
              {...register('password')}
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={cn(field, 'mt-2.5', errors.password && 'border-destructive/70')}
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" className="mt-2 text-[0.8125rem] text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-azure px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,box-shadow] duration-500 hover:bg-azure-lit hover:shadow-[0_10px_36px_-10px_rgba(41,163,221,0.65)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-azure disabled:hover:shadow-none"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Signing in' : 'Sign in'}
          </button>
        </form>

        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
          Back to the site
        </Link>
      </div>
    </main>
  );
}
