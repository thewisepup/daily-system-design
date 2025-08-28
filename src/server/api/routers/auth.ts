import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateToken, validateAdminCredentials } from "~/lib/jwt";

// Return type schemas
export const loginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: z.object({
    email: z.string().email(),
    isAdmin: z.boolean(),
  }),
  message: z.string(),
});

export const verifyResponseSchema = z.object({
  valid: z.boolean(),
  user: z.object({
    email: z.string().email(),
    isAdmin: z.boolean(),
  }),
  expiresAt: z.date().nullable(),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Export TypeScript types
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .output(loginResponseSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      try {
        // Validate admin credentials
        const isValidAdmin = await validateAdminCredentials(email, password);

        if (!isValidAdmin) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Generate JWT token
        const token = generateToken({
          email,
          isAdmin: true,
        });

        return {
          success: true,
          token,
          user: {
            email,
            isAdmin: true,
          },
          message: "Login successful",
        };
      } catch (error) {
        console.error("Login error:", error);

        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }

        // Otherwise, throw a generic error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during login",
        });
      }
    }),

  verify: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
      }),
    )
    .output(verifyResponseSchema)
    .query(async ({ input }) => {
      const { token } = input;

      try {
        const { verifyToken } = await import("~/lib/jwt");
        const payload = verifyToken(token);

        if (!payload) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          });
        }

        return {
          valid: true,
          user: {
            email: payload.email,
            isAdmin: payload.isAdmin,
          },
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        };
      } catch (error) {
        console.error("Token verification error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token verification failed",
        });
      }
    }),

  logout: publicProcedure.output(logoutResponseSchema).mutation(async () => {
    // Since JWTs are stateless, logout is handled client-side
    // by removing the token from storage
    return {
      success: true,
      message: "Logout successful",
    };
  }),
});
