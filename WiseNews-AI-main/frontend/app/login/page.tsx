'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LoadingButton } from '@/components/custom/loading-button';
import { RegisterModal } from '@/components/custom/register-modal';
import { useToast, ToastContainer } from '@/components/custom/toast';
import { Mail, Lock, Facebook } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toasts, toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    login(username);
    toast('Login successful!', 'success');
    setIsLoading(false);
    setTimeout(() => router.push('/'), 500);
  };

  const handleSocialLogin = (provider: string) => {
    toast(`${provider} login - Demo only`, 'error');
  };

  const handleRegisterSuccess = (name: string) => {
    setIsRegisterOpen(false);
    toast(`Welcome ${name}! Account created successfully. You can now login.`, 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-col items-start gap-6 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 p-2 flex items-center justify-center">
                <span className="text-2xl font-serif font-bold text-primary">W</span>
              </div>
              <h1 className="text-4xl font-serif font-bold text-foreground">WiseNews</h1>
            </div>
            <p className="text-xl font-semibold text-foreground">Read your news wisely</p>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
            Stay informed with credibility-verified news articles. Our advanced analysis helps you identify authentic reporting and avoid misinformation.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground">Advanced credibility scoring</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground">AI-powered article summaries</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
              <p className="text-sm text-muted-foreground">Curated breaking news</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-border bg-card p-8 shadow-lg">
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-serif font-bold text-foreground">Login</h2>
                <p className="text-sm text-muted-foreground">Sign in to your WiseNews account</p>
                <div className="h-0.5 w-12 bg-accent rounded mx-auto"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 bg-secondary border-border placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border cursor-pointer"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Sign In Button */}
                <LoadingButton
                  isLoading={isLoading}
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Sign in
                </LoadingButton>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSocialLogin('Facebook')}
                  variant="outline"
                  className="w-full border-border bg-secondary hover:bg-secondary/80"
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                  <span className="hidden sm:inline text-xs">Facebook</span>
                </Button>
                <Button
                  onClick={() => handleSocialLogin('Google')}
                  variant="outline"
                  className="w-full border-border bg-secondary hover:bg-secondary/80"
                  disabled={isLoading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="hidden sm:inline text-xs">Google</span>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Demo account: Use any username and password to login
              </p>

              <div className="text-center pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="text-primary font-semibold hover:underline transition-colors"
                  >
                    Register
                  </button>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
      />

      <ToastContainer toasts={toasts} />
    </div>
  );
}
