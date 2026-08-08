import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import type { FormikHelpers, FieldProps } from 'formik';
import * as Yup from 'yup';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import LoadingSpinner from '../ui/loading-spinner';
import authService from '../../services/authService';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps extends React.ComponentProps<"div"> {
  token: string;
}

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export function ResetPasswordForm({
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (
    values: ResetPasswordFormValues,
    { setSubmitting, setFieldError, setStatus }: FormikHelpers<ResetPasswordFormValues>
  ) => {
    try {
      setStatus(null);
      await authService.resetPassword(token, values.password);
      setIsSuccess(true);
    } catch (error: unknown) {
      const apiError = error as { error?: string };
      const errorMessage = apiError.error || 'Failed to reset password';
      
      setStatus(errorMessage);
      
      if (errorMessage.toLowerCase().includes('password')) {
        setFieldError('password', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </motion.div>
            <CardTitle className="text-xl">Password reset successful</CardTitle>
            <CardDescription>
              Your password has been successfully reset. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Continue to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<ResetPasswordFormValues>
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, status, values }) => (
              <Form>
                <div className="grid gap-6">
                  {status && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
                    >
                      {status}
                    </motion.div>
                  )}

                  <div className="grid gap-3">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Field name="password">
                        {({ field }: FieldProps) => (
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            className={`pr-10 ${errors.password && touched.password ? 'border-destructive' : ''}`}
                            required
                          />
                        )}
                      </Field>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                    
                    {/* pw strength indicator */}
                    {values.password && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs space-y-1"
                      >
                        <div className={`flex items-center ${values.password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          At least 6 characters
                        </div>
                        <div className={`flex items-center ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Contains uppercase, lowercase, and number
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Field name="confirmPassword">
                        {({ field }: FieldProps) => (
                          <Input
                            {...field}
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            className={`pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-destructive' : ''}`}
                            required
                          />
                        )}
                      </Field>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Resetting password...
                      </>
                    ) : (
                      'Reset password'
                    )}
                  </Button>

                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/login" className="flex items-center justify-center">
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
}
