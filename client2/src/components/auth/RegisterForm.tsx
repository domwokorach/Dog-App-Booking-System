import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import type { FormikHelpers, FieldProps } from 'formik';
import * as Yup from 'yup';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import LoadingSpinner from '../ui/loading-spinner';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'owner' | 'groomer';
}

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string()
    .oneOf(['owner', 'groomer'])
    .required('Please select your role'),
});

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { register } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (
    values: RegisterFormValues,
    { setSubmitting, setFieldError, setStatus }: FormikHelpers<RegisterFormValues>
  ) => {
    try {
      setStatus(null);
      const userData = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      };
      await register(userData);
    } catch (error: unknown) {
      const apiError = error as { error?: string };
      const errorMessage = apiError.error || 'Registration failed';
      
      setStatus(errorMessage);
      
      if (errorMessage.toLowerCase().includes('email')) {
        setFieldError('email', 'This email is already registered');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // const handleSocialSignUp = () => {
  //   if (nameInputRef.current) {
  //     nameInputRef.current.focus();
  //     nameInputRef.current.reportValidity();
  //   }
  // };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Create your account and start caring for your pets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<RegisterFormValues>
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'owner',
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, status, values, setFieldValue }) => (
              <Form>
                <div className="grid gap-6">
                  {/* <div className="flex flex-col gap-4">
                    <Button variant="outline" className="w-full" type="button" onClick={handleSocialSignUp}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path
                          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                          fill="currentColor"
                        />
                      </svg>
                      Sign up with Apple
                    </Button>
                    <Button variant="outline" className="w-full" type="button" onClick={handleSocialSignUp}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Sign up with Google
                    </Button>
                  </div> */}
                  {/* <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div> */}

                  {status && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm"
                    >
                      {status}
                    </motion.div>
                  )}

                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="name">Full Name</Label>
                      <Field name="name">
                        {({ field }: FieldProps) => (
                          <Input
                            {...field}
                            ref={nameInputRef}
                            id="name"
                            placeholder="Enter your full name"
                            className={errors.name && touched.name ? 'border-destructive' : ''}
                            required
                          />
                        )}
                      </Field>
                      {errors.name && touched.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Field name="email">
                        {({ field }: FieldProps) => (
                          <Input
                            {...field}
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            className={errors.email && touched.email ? 'border-destructive' : ''}
                            required
                          />
                        )}
                      </Field>
                      {errors.email && touched.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="role">I am a</Label>
                      <Select value={values.role} onValueChange={(value) => setFieldValue('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Pet Owner</SelectItem>
                          <SelectItem value="groomer">Pet Groomer</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && touched.role && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive"
                        >
                          {errors.role}
                        </motion.p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Field name="password">
                          {({ field }: FieldProps) => (
                            <Input
                              {...field}
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a strong password"
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
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Field name="confirmPassword">
                          {({ field }: FieldProps) => (
                            <Input
                              {...field}
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
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
                          Creating account...
                        </>
                      ) : (
                        'Create account'
                      )}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="underline underline-offset-4">
                      Sign in
                    </Link>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>.
      </div>
    </div>
  );
}
