import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        // Store admin session with token
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminUser', data.user.email);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        toast({
          title: t('auth.loginSuccess'),
          description: t('adminLogin.welcomeToast'),
        });

        setLocation('/system/dashboard');
      } else {
        const errorData = await response.json();
        toast({
          title: t('adminLogin.loginFailed'),
          description: errorData.message || t('adminLogin.invalidCredentials'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('adminLogin.loginErrorOccurred'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-taklif-cream to-taklif-gold/10">
      {/* Top Navigation */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b border-taklif-gold/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/takliflinklogo.jpg"
              alt={t('adminLogin.logoAlt')}
              className="h-10 w-10 object-contain rounded-full shadow-md"
            />
            <h1 className="text-2xl font-playfair font-bold text-taklif-burgundy">
              Taklif Link
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-73px)]">
        <Card className="w-full max-w-md wedding-card elegant-shadow">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-taklif-burgundy rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-playfair font-bold text-taklif-navy text-center">
              {t('adminLogin.title')}
            </CardTitle>
            <p className="text-taklif-navy/70 text-center">
              {t('adminLogin.subtitle')}
            </p>
          </CardHeader>
          <CardContent className="px-6">
            <div className="w-full">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-taklif-navy font-semibold">
                {t('adminLogin.username')}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t('adminLogin.usernamePlaceholder')}
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="wedding-input"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-taklif-navy font-semibold">
                {t('adminLogin.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('adminLogin.passwordPlaceholder')}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="wedding-input pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-taklif-navy/50" />
                  ) : (
                    <Eye className="h-4 w-4 text-taklif-navy/50" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full wedding-button"
              disabled={isLoading || !credentials.username || !credentials.password}
            >
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}