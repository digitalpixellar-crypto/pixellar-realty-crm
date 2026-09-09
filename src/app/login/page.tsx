import React, { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ email?: string; message?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { email, message, error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-xs">Loading authentication portal...</div>}>
        <LoginForm initialEmail={email} initialMessage={message || error} />
      </Suspense>
    </div>
  );
}
