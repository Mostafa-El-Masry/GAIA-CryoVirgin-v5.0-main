import LoginClient from './LoginClient';

interface LoginPageProps {
  searchParams?: {
    mode?: string;
    [key: string]: string | string[] | undefined;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const modeParam = typeof searchParams?.mode === 'string' ? searchParams!.mode : undefined;
  const initialMode = modeParam === 'signup' ? 'signup' : 'signin';

  return <LoginClient initialMode={initialMode} />;
}
