"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/lib/auth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { login: contextLogin, register: contextRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "code">("password");
  const [emailForCode, setEmailForCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regErrors, setRegErrors] = useState({ email: "", password: "", firstName: "", lastName: "" });
  
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [verificationError, setVerificationError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = { email: "", password: "" };
    
    if (!validateEmail(loginEmail)) {
      errors.email = "Введите корректный email";
    }
    if (!loginPassword || loginPassword.trim() === "") {
      errors.password = "Введите пароль";
    }
    
    if (errors.email || errors.password) {
      setLoginErrors(errors);
      return;
    }
    
    setLoginErrors({ email: "", password: "" });
    setIsLoading(true);
    
    try {
      await contextLogin(loginEmail, loginPassword);
      toast.success("Вход выполнен успешно!");
      onOpenChange(false);
      
      setTimeout(() => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.role === 'admin') {
            window.location.href = "/admin";
          } else if (user.role === 'manager') {
            window.location.href = "/manager";
          } else {
            window.location.href = "/hotels";
          }
        } else {
          window.location.href = "/hotels";
        }
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Ошибка входа");
      setLoginErrors({ email: "", password: "Неверный email или пароль" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = { email: "", password: "", firstName: "", lastName: "" };
    
    if (!validateEmail(regEmail)) {
      errors.email = "Введите корректный email";
    }
    if (!regEmail) {
      errors.email = "Email обязателен";
    }
    if (!validatePassword(regPassword)) {
      errors.password = "Пароль должен быть минимум 8 символов";
    }
    if (!regPassword) {
      errors.password = "Пароль обязателен";
    }
    
    if (regFirstName.trim().length > 0 && regFirstName.trim().length < 2) {
      errors.firstName = "Имя должно содержать минимум 2 символа";
    }
    if (regLastName.trim().length > 0 && regLastName.trim().length < 2) {
      errors.lastName = "Фамилия должна содержать минимум 2 символа";
    }
    
    if (errors.email || errors.password || errors.firstName || errors.lastName) {
      setRegErrors(errors);
      return;
    }
    
    setRegErrors({ email: "", password: "", firstName: "", lastName: "" });
    setIsLoading(true);
    
    try {
      const fullName = `${regFirstName.trim()} ${regLastName.trim()}`.trim() || regEmail.split('@')[0];
      await contextRegister(fullName, regEmail, regPassword);
      toast.success("Регистрация успешна! Теперь войдите в аккаунт");
      setRegEmail("");
      setRegPassword("");
      setRegFirstName("");
      setRegLastName("");
      setRegErrors({ email: "", password: "", firstName: "", lastName: "" });
      setActiveTab("login");
    } catch (error: any) {
      toast.error(error.message || "Ошибка регистрации");
      if (error.message?.includes("email")) {
        setRegErrors(prev => ({ ...prev, email: error.message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    countdownTimerRef.current = timer;
  };
  
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const emailToUse = codeSent ? emailForCode : forgotEmail;
      if (codeSent) {
        await AuthService.sendLoginCode(emailToUse);
      } else {
        await AuthService.resendCode(emailToUse);
      }
      setResendAttempts((prev) => prev + 1);
      toast.success("Новый код отправлен!");
      setCountdown(60);
      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
      setVerificationError("");
      startCountdown();
    } catch (error: any) {
      toast.error(error.message || "Ошибка отправки кода");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^[0-9A-Za-z]$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.toUpperCase();
    setVerificationCode(newCode);

    if (value && index < 5) {
      const inputId = codeSent ? `login-code-${index + 1}` : `code-${index + 1}`;
      const nextInput = document.getElementById(inputId);
      nextInput?.focus();
    }
  };

  const handleVerificationCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const inputId = codeSent ? `login-code-${index - 1}` : `code-${index - 1}`;
      const prevInput = document.getElementById(inputId);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setVerificationError("Введите код из 6 символов");
      return;
    }
    setVerificationError("");
    setIsLoading(true);
    try {
      const token = await AuthService.verifyCode(forgotEmail, code);
      setResetToken(token);
      setShowResetPassword(true);
      setShowVerificationCode(false);
      toast.success("Код подтвержден! Теперь установите новый пароль.");
    } catch (error: any) {
      setVerificationError(error.message || "Неверный код");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    
    if (!validatePassword(newPassword)) {
      errors.push("Пароль должен быть минимум 8 символов");
    }
    if (newPassword !== confirmNewPassword) {
      errors.push("Пароли не совпадают");
    }
    
    if (errors.length > 0) {
      setResetPasswordError(errors.join(", "));
      return;
    }
    
    setResetPasswordError("");
    setIsLoading(true);
    
    try {
      await AuthService.resetPassword(resetToken, newPassword);
      toast.success("Пароль успешно изменен! Теперь войдите в аккаунт.");
      setShowResetPassword(false);
      setShowForgotPassword(false);
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setForgotEmail("");
      setActiveTab("login");
    } catch (error: any) {
      setResetPasswordError(error.message || "Ошибка сброса пароля");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowVerificationCode(false);
    setShowResetPassword(false);
    setForgotEmail("");
    setVerificationCode(["", "", "", "", "", ""]);
    setVerificationError("");
    setForgotError("");
    setResetToken("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetPasswordError("");
    setCountdown(60);
    setCanResend(false);
    setResendAttempts(0);
  };

  const handleOAuthLogin = (provider: string) => {
    if (provider === "Apple") {
      toast.info("Вход через Apple отключен");
      return;
    }
    
    if (provider === "Google") {
      AuthService.loginWithGoogle();
    } else if (provider === "Mail.ru") {
      AuthService.loginWithMailru();
    }
  };

  const handleSendLoginCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(emailForCode)) {
      setLoginErrors({ email: "Введите корректный email", password: "" });
      return;
    }
    setIsLoading(true);
    setLoginErrors({ email: "", password: "" });
    try {
      await AuthService.sendLoginCode(emailForCode);
      setCodeSent(true);
      setCountdown(60);
      setCanResend(false);
      startCountdown();
      toast.success("Код отправлен на вашу почту!");
    } catch (error: any) {
      toast.error(error.message || "Ошибка отправки кода");
      setLoginErrors({ email: error.message || "Ошибка отправки", password: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setVerificationError("Введите код из 6 символов");
      return;
    }
    setVerificationError("");
    setIsLoading(true);
    try {
      const user = await AuthService.loginByCode(emailForCode, code);
      toast.success("Вход выполнен успешно!");
      onOpenChange(false);
      setTimeout(() => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const userObj = JSON.parse(userData);
          if (userObj.role === 'admin') {
            window.location.href = "/admin";
          } else if (userObj.role === 'manager') {
            window.location.href = "/manager";
          } else {
            window.location.href = "/hotels";
          }
        } else {
          window.location.href = "/hotels";
        }
      }, 100);
    } catch (error: any) {
      setVerificationError(error.message || "Неверный код");
      toast.error(error.message || "Неверный код");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      setForgotError("Введите корректный email");
      return;
    }
    setForgotError("");
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(forgotEmail);
      setShowVerificationCode(true);
      setCountdown(60);
      setCanResend(false);
      startCountdown();
      toast.success("Код отправлен на вашу почту!");
    } catch (error: any) {
      setForgotError(error.message || "Ошибка отправки кода");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
            Добро пожаловать
          </h1>
          <p className="text-center text-muted-foreground mb-4">
            Войдите или создайте аккаунт
          </p>
        </DialogHeader>
        
        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Установить новый пароль</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Новый пароль *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-10 text-black dark:text-white ${resetPasswordError ? "border-red-500" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Подтвердите пароль *</Label>
              <div className="relative">
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={`pr-10 ${resetPasswordError ? "border-red-500" : ""}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {resetPasswordError && <p className="text-sm text-destructive">{resetPasswordError}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Изменение..." : "Изменить пароль"}
            </Button>
          </form>
        ) : showVerificationCode ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Введите код подтверждения</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Код отправлен на {forgotEmail || emailForCode}
            </p>
            <div className="flex gap-2 justify-center">
              {verificationCode.map((digit, index) => (
                <Input
                  key={index}
                  id={codeSent ? `login-code-${index}` : `code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleVerificationCodeKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold"
                />
              ))}
            </div>
            {verificationError && <p className="text-sm text-destructive text-center">{verificationError}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Проверка..." : "Подтвердить"}
            </Button>
            <div className="text-center">
              {canResend ? (
                <Button type="button" variant="link" onClick={handleResendCode}>
                  Отправить код повторно
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Отправить код повторно через {countdown} сек
                </p>
              )}
            </div>
          </form>
        ) : showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Восстановление пароля</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email *</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={forgotError ? "border-red-500" : ""}
                required
              />
              {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Отправка..." : "Отправить код"}
            </Button>
          </form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              {!codeSent ? (
                <>
                  <div className="flex gap-2 border-b">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("password");
                        setCodeSent(false);
                        setEmailForCode("");
                        setLoginErrors({ email: "", password: "" });
                      }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        loginMethod === "password"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Пароль
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("code");
                        setLoginEmail("");
                        setLoginPassword("");
                        setLoginErrors({ email: "", password: "" });
                      }}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        loginMethod === "code"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Код с email
                    </button>
                  </div>

                  {loginMethod === "password" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email *</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={loginErrors.email ? "border-red-500" : ""}
                          required
                        />
                        {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Пароль *</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className={`pr-10 ${loginErrors.password ? "border-red-500" : ""}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Вход..." : "Войти"}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Забыли пароль?
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleSendLoginCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code-email">Email *</Label>
                        <Input
                          id="code-email"
                          type="email"
                          placeholder="your@email.com"
                          value={emailForCode}
                          onChange={(e) => setEmailForCode(e.target.value)}
                          className={loginErrors.email ? "border-red-500" : ""}
                          required
                        />
                        {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Отправка..." : "Отправить код"}
                      </Button>
                    </form>
                  )}
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Или войти через</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("Google")}
                      className="w-full"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("Mail.ru")}
                      className="w-full"
                    >
                      <Mail className="w-5 h-5 mr-2 text-[#005FF9]" />
                      Mail.ru
                    </Button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleLoginWithCode} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Код отправлен на {emailForCode}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`login-code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleVerificationCodeKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-bold"
                      />
                    ))}
                  </div>
                  {verificationError && <p className="text-sm text-destructive text-center">{verificationError}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Вход..." : "Войти по коду"}
                  </Button>
                  <div className="text-center">
                    {canResend ? (
                      <Button type="button" variant="link" onClick={handleResendCode}>
                        Отправить код повторно
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Отправить код повторно через {countdown} сек
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => {
                      setCodeSent(false);
                      setEmailForCode("");
                      setVerificationCode(["", "", "", "", "", ""]);
                    }}
                  >
                    Вернуться назад
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={`text-foreground ${regErrors.email ? "border-destructive" : ""}`}
                    required
                  />
                  {regErrors.email && <p className="text-sm text-destructive">{regErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Пароль *</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`pr-10 text-foreground ${regErrors.password ? "border-destructive" : ""}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {regErrors.password && <p className="text-sm text-destructive">{regErrors.password}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-firstname">Имя</Label>
                    <Input
                      id="reg-firstname"
                      type="text"
                      placeholder="Иван"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      className={`text-foreground ${regErrors.firstName ? "border-destructive" : ""}`}
                    />
                    {regErrors.firstName && <p className="text-sm text-destructive">{regErrors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-lastname">Фамилия</Label>
                    <Input
                      id="reg-lastname"
                      type="text"
                      placeholder="Иванов"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      className={`text-foreground ${regErrors.lastName ? "border-destructive" : ""}`}
                    />
                    {regErrors.lastName && <p className="text-sm text-destructive">{regErrors.lastName}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Или зарегистрироваться через</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin("Google")}
                    className="w-full"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin("Mail.ru")}
                    className="w-full"
                  >
                    <Mail className="w-5 h-5 mr-2 text-[#005FF9]" />
                    Mail.ru
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

