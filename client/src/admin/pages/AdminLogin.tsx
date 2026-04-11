import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
          title: "Login Successful",
          description: "Welcome to the admin dashboard!",
        });
        
        setLocation('/system/dashboard');
      } else {
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description: errorData.message || "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
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
          <div className="mx-auto w-16 h-16 bg-[#D4B08C] rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-playfair font-bold text-[#2C3338]">
            Admin Login
          </CardTitle>
          <p className="text-[#2C3338]/70">
            Access the invitation platform management dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#2C3338] font-semibold">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="wedding-input"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#2C3338] font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
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
              disabled={isLoading || !credentials.username || !credentials.password}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}