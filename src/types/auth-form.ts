import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
  .object({
    email: z.email(),
    name: z.string().min(4, 'Name must be at least 4 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm_password: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

export type SignupFormValues = z.infer<typeof signupFormSchema>
