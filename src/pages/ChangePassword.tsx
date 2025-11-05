import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ChangePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('يرجى إدخال كلمة المرور الجديدة وتأكيدها');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('ليست هناك جلسة دخول صالحة. يرجى تسجيل الدخول مرة أخرى');
        return;
      }

      await updatePassword(user, newPassword);

      // Clear mustChangePassword flag in Firestore for this admin (MUST succeed)
      const username = localStorage.getItem('pending_password_change_username') || 'ibrahim';
      try {
        await setDoc(doc(db, 'admin_users', username), { mustChangePassword: false }, { merge: true });
        console.log('✅ Successfully updated mustChangePassword to false');
      } catch (flagErr: any) {
        console.error('❌ Failed to clear mustChangePassword flag:', flagErr);
        // Show detailed error for debugging
        const errorMsg = flagErr?.code === 'permission-denied' 
          ? 'خطأ في الصلاحيات. يرجى التحقق من قواعد Firestore. ستحتاج لتغيير mustChangePassword يدوياً إلى false في Firebase Console.'
          : `فشل تحديث حالة التحقق: ${flagErr?.message || 'خطأ غير معروف'}`;
        setError(errorMsg);
        toast.error('فشل تحديث حالة التحقق. يرجى تغيير mustChangePassword إلى false يدوياً في Firebase Console.');
        setLoading(false);
        return; // Don't navigate if flag update failed
      }
      localStorage.removeItem('pending_password_change_username');

      toast.success('تم تحديث كلمة المرور بنجاح');
      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      // Provide clearer Firebase Auth error messages
      let message = 'فشل في تحديث كلمة المرور';
      if (err?.code === 'auth/requires-recent-login') {
        message = 'الأمان يتطلب تسجيل دخول حديث. يرجى تسجيل الدخول مرة أخرى ثم إعادة المحاولة.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'كلمة المرور ضعيفة. يرجى اختيار كلمة أقوى.';
      } else if (err?.code === 'auth/invalid-credential') {
        message = 'جلسة غير صالحة. يرجى تسجيل الدخول وإعادة المحاولة.';
      }
      setError(message);
    } finally {
      setLoading(false);
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
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;


