import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Heart, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { LanguageToggle } from '@/components/language-toggle';

export default function UserLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);
      
      if (!result.success) {
        toast({
          title: t('auth.loginFailed'),
          description: result.error || t('auth.invalidCredentials'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeBack') + "! Redirecting...",
      });
      // Redirect based on user role
      const storedUser = localStorage.getItem('currentUser');
      let userRole = null;
      if (storedUser) {
        try {
          userRole = JSON.parse(storedUser).role;
        } catch {}
      }
      if (userRole === 'guest_manager') {
        setLocation('/guest-manager');
      } else {
        setLocation('/dashboard');
      }
      
    } catch (error) {
      toast({
        title: t('auth.loginFailed'),
        description: t('auth.invalidCredentials'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: t('auth.registrationFailed'),
        description: t('auth.passwordsDontMatch'),
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: t('auth.registrationFailed'),
        description: t('auth.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(registerData.name, registerData.email, registerData.password);
      
      if (!result.success) {
        toast({
          title: t('auth.registrationFailed'),
          description: result.error || t('auth.registrationFailed'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('auth.registrationSuccess'),
        description: t('auth.welcomeMessage'),
      });
      
      // New users go directly to wedding creation
      setLocation('/create-wedding');
    } catch (error) {
      toast({
        title: t('auth.registrationFailed'),
        description: t('auth.registrationFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F1F1] to-[#89916B]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md wedding-card elegant-shadow">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="flex items-center justify-center flex-1">
              <Heart className="h-8 w-8 text-[#D4B08C] mr-2" />
              <h1 className="text-2xl font-playfair font-bold text-[#2C3338]">
                LoveStory
              </h1>
            </Link>
            <div className="flex-shrink-0">
              <LanguageToggle />
            </div>
          </div>
          <CardTitle className="text-xl font-playfair text-[#2C3338]">
            {t('auth.welcomeBack')}
          </CardTitle>
          <p className="text-[#2C3338]/70">
            {t('auth.signInDescription')}
          </p>
          <p className="text-sm text-[#2C3338]/60 mt-2">
            {t('auth.freeBasicAccess')}
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('auth.signIn')}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('auth.register')}
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#2C3338] font-semibold">
                    {t('auth.emailAddress')}
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="wedding-input"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#2C3338] font-semibold">
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.enterPassword')}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
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
                        <EyeOff className="h-4 w-4 text-[#2C3338]/50" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#2C3338]/50" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full wedding-button"
                  disabled={isLoading || !loginData.email || !loginData.password}
                >
                  {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-[#2C3338] font-semibold">
                    {t('auth.fullName')}
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder={t('auth.enterFullName')}
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className="wedding-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-[#2C3338] font-semibold">
                    {t('auth.emailAddress')}
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="wedding-input"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-[#2C3338] font-semibold">
                    {t('auth.password')}
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder={t('auth.createPassword')}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="wedding-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[#2C3338] font-semibold">
                    {t('auth.confirmPassword')}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="wedding-input"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full wedding-button"
                  disabled={isLoading || !registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword}
                >
                  {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#2C3338]/70 hover:text-[#D4B08C] transition-colors">
              {t('auth.backToHome')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}