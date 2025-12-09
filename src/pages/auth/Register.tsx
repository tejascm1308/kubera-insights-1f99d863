import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  
  const { register, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Username validation
  const validateUsername = (username: string): boolean => {
    const regex = /^[a-zA-Z0-9]{5,10}$/;
    return regex.test(username);
  };

  // Debounced username check
  const checkUsername = useCallback(async (username: string) => {
    if (!username) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (!validateUsername(username)) {
      setUsernameStatus('invalid');
      setUsernameMessage('5-10 alphanumeric characters only');
      return;
    }

    setUsernameStatus('checking');
    const { data, error } = await authApi.checkUsername(username);
    
    if (error) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (data?.available) {
      setUsernameStatus('available');
      setUsernameMessage('Username available');
    } else {
      setUsernameStatus('taken');
      setUsernameMessage('Username already taken');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsername(formData.username);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name || !formData.email || !formData.username || !formData.password) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (usernameStatus !== 'available') {
      toast({
        title: 'Invalid username',
        description: 'Please choose an available username.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { success, error } = await register({
      full_name: formData.full_name,
      email: formData.email,
      username: formData.username,
      password: formData.password,
    });

    if (success) {
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account.',
      });
      // Auto-login for demo purposes
      const loginResult = await login(formData.email, formData.password);
      setIsLoading(false);
      if (loginResult.success) {
        navigate('/chat');
      } else {
        navigate('/auth/login');
      }
    } else {
      setIsLoading(false);
      toast({
        title: 'Registration failed',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getUsernameIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'available':
        return <Check className="h-4 w-4 text-kubera-success" />;
      case 'taken':
      case 'invalid':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground">
                Start your AI-powered investment journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="username"
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getUsernameIcon()}
                  </div>
                </div>
                {usernameMessage && (
                  <p
                    className={`text-xs ${
                      usernameStatus === 'available'
                        ? 'text-kubera-success'
                        : 'text-destructive'
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || usernameStatus !== 'available'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
