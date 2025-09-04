import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, loading: authLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 AdminLogin: Form submitted');
    setError('');
    setLoading(true);
    console.log('🔐 AdminLogin: Loading set to true');

    try {
      // Basic validation
      if (!email.trim()) {
        setError('يرجى إدخال البريد الإلكتروني');
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError('يرجى إدخال كلمة المرور');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        setLoading(false);
        return;
      }

      // Attempt login using the hook's login function
      console.log('🔐 AdminLogin: Calling onLogin...');
      console.log('🔐 AdminLogin: Login credentials:', { email: email.trim(), passwordLength: password.length });
      const result = await onLogin(email.trim(), password);
      console.log('🔐 AdminLogin: Login result:', result);
      
      if (result.success) {
        console.log('🔐 AdminLogin: Login successful, showing toast');
        toast.success('تم تسجيل الدخول بنجاح');
        console.log('🔐 AdminLogin: Toast shown, component should re-render');
        
        // Clear form after successful login
        setEmail('');
        setPassword('');
        setError('');
        
        // Force a small delay to ensure state updates
        setTimeout(() => {
          console.log('🔐 AdminLogin: Form cleared, waiting for parent re-render...');
        }, 100);
      } else {
        console.log('🔐 AdminLogin: Login failed:', result.error);
        setError(result.error || 'فشل في تسجيل الدخول');
        toast.error(result.error || 'فشل في تسجيل الدخول');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('حدث خطأ غير متوقع');
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
      console.log('🔐 AdminLogin: Login process completed, loading set to false');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            تسجيل دخول المسؤول
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            أدخل بيانات الاعتماد للوصول إلى لوحة التحكم
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="admin@example.com"
                disabled={loading}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  disabled={loading}
                  className="h-11 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  </span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              هذا النظام محمي بواسطة Firebase Authentication
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin; 