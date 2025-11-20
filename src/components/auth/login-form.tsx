'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { FormError } from '@/components/shared/form-error';
import { FormSuccess } from '@/components/shared/form-success';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LocaleLink } from '@/i18n/navigation';
import { normalizePhoneNumber } from '@/lib/phone';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { cn } from '@/lib/utils';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

export interface LoginFormProps {
  className?: string;
  callbackUrl?: string;
}

export const LoginForm = ({
  className,
  callbackUrl: propCallbackUrl,
}: LoginFormProps) => {
  const t = useTranslations('AuthPage.login');
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const paramCallbackUrl = searchParams.get('callbackUrl');
  // Use prop callback URL or param callback URL if provided, otherwise use the default login redirect
  const locale = useLocale();
  const defaultCallbackUrl = getUrlWithLocale(DEFAULT_LOGIN_REDIRECT, locale);
  // console.log('login form, propCallbackUrl', propCallbackUrl);
  // console.log('login form, paramCallbackUrl', paramCallbackUrl);
  // console.log('login form, defaultCallbackUrl', defaultCallbackUrl);
  const callbackUrl = propCallbackUrl || paramCallbackUrl || defaultCallbackUrl;

  const [phoneError, setPhoneError] = useState<string | undefined>('');
  const [phoneSuccess, setPhoneSuccess] = useState<string | undefined>('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, []);

  const PhoneLoginSchema = z.object({
    phoneNumber: z.string().min(6, {
      message: t('phoneRequired'),
    }),
    code: z.string().min(4, {
      message: t('codeRequired'),
    }),
  });

  const phoneForm = useForm<z.infer<typeof PhoneLoginSchema>>({
    resolver: zodResolver(PhoneLoginSchema),
    defaultValues: {
      phoneNumber: '',
      code: '',
    },
  });

  const startOtpCooldown = () => {
    setOtpCooldown(60);
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setPhoneError('');
    setPhoneSuccess('');
    if (otpCooldown > 0) return;
    const validPhone = await phoneForm.trigger('phoneNumber');
    if (!validPhone) return;
    const sanitizedPhone = normalizePhoneNumber(
      phoneForm.getValues('phoneNumber')
    );
    phoneForm.setValue('phoneNumber', sanitizedPhone, {
      shouldValidate: true,
    });

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/phone-number/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: sanitizedPhone,
        }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhoneError(data?.message || t('sendCodeFailed'));
        return;
      }
      startOtpCooldown();
    } catch (err) {
      setPhoneError(t('sendCodeFailed'));
      console.error('send otp error', err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onSubmitPhone = async (values: z.infer<typeof PhoneLoginSchema>) => {
    setPhoneError('');
    setPhoneSuccess('');
    const sanitizedPhone = normalizePhoneNumber(values.phoneNumber);
    phoneForm.setValue('phoneNumber', sanitizedPhone, {
      shouldValidate: true,
    });
    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/phone-number/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: sanitizedPhone,
          code: values.code,
        }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhoneError(data?.message || t('verifyFailed'));
        return;
      }
      setPhoneSuccess(t('signInSuccess'));
      window.location.href = callbackUrl;
    } catch (err) {
      console.error('verify otp error', err);
      setPhoneError(t('verifyFailed'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <AuthCard
      headerLabel={t('welcomeBack')}
      bottomButtonLabel={t('signUpHint')}
      bottomButtonHref={`${Routes.Register}`}
      className={cn('', className)}
    >
      <Form {...phoneForm}>
        <form
          onSubmit={phoneForm.handleSubmit(onSubmitPhone)}
          className="mt-4 space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={phoneForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSendingOtp || isVerifyingOtp}
                      placeholder=""
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <FormField
                control={phoneForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>{t('code')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isVerifyingOtp}
                        placeholder=""
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-6"
                onClick={sendOtp}
                disabled={isSendingOtp || isVerifyingOtp || otpCooldown > 0}
              >
                {isSendingOtp ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : null}
                {otpCooldown > 0
                  ? t('resendIn', { seconds: otpCooldown })
                  : t('sendCode')}
              </Button>
            </div>
          </div>
          <FormError message={phoneError || urlError || undefined} />
          <FormSuccess message={phoneSuccess} />
          <div className="text-right">
            <Button
              size="sm"
              variant="link"
              asChild
              className="px-0 font-normal text-muted-foreground"
            >
              <LocaleLink
                href={`${Routes.ForgotPassword}`}
                className="text-xs hover:underline hover:underline-offset-4 hover:text-primary"
              >
                {t('forgotPassword')}
              </LocaleLink>
            </Button>
          </div>
          <Button
            disabled={isVerifyingOtp}
            size="lg"
            type="submit"
            className="w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifyingOtp && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            <span>{t('signInWithPhone')}</span>
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
};
