# Authentication System

## Overview
The application uses a custom JWT-based authentication system designed for admin-only access during the MVP phase. This replaces traditional session-based authentication with stateless, secure tokens.

## Architecture

### JWT Implementation
- **Token Library**: `jsonwebtoken` for token signing and verification
- **Hash Library**: `bcryptjs` for password comparison
- **Token Duration**: 6 hours (configurable)
- **Storage**: Client-side sessionStorage (auto-clears on tab close)

### Key Components

#### Server-Side
- **`src/lib/jwt.ts`** - Core JWT utilities
  - `generateToken()` - Create signed JWT tokens
  - `verifyToken()` - Validate and decode tokens
  - `validateAdminCredentials()` - Check admin email/password

- **`src/server/api/routers/auth.ts`** - Authentication tRPC router
  - `login` - Authenticate and issue JWT token
  - `verify` - Validate existing token
  - `logout` - Client-side logout confirmation

- **`src/server/api/trpc.ts`** - JWT middleware
  - `adminProcedure` - Protected procedure requiring valid JWT

#### Client-Side
- **`src/lib/auth.ts`** - Client auth utilities
  - `setAdminAuth()` - Store JWT in sessionStorage
  - `isAdmin()` - Check if user is authenticated
  - `clearAdminAuth()` - Remove auth data
  - `getAuthToken()` - Retrieve stored token

- **`src/app/_components/AdminLogin.tsx`** - Login form component

## Environment Variables
```bash
JWT_SECRET="your-very-secure-secret-minimum-32-characters"
ADMIN_EMAIL="admin@yourapp.com" 
ADMIN_PASSWORD="your-secure-admin-password"
```

## Security Features

### Server Security
- JWT tokens signed with strong secret (32+ characters)
- Password comparison using bcrypt
- Token expiration validation
- Header-based authentication (`Authorization: Bearer <token>`)
- Input validation with Zod schemas

### Client Security
- sessionStorage instead of localStorage (XSS protection)
- Automatic token expiration handling
- No sensitive data in client-side storage
- Secure token transmission via HTTPS headers

## API Usage

### Authentication Flow
1. **Login**: `POST /api/trpc/auth.login`
   ```json
   {
     "json": {
       "email": "admin@example.com",
       "password": "password"
     }
   }
   ```

2. **Protected Requests**: Include JWT in headers
   ```bash
   Authorization: Bearer <jwt_token>
   ```

3. **Token Verification**: `GET /api/trpc/auth.verify`
   ```json
   {
     "json": {
       "token": "jwt_token_here"
     }
   }
   ```

### tRPC Integration
```typescript
// Protected procedure example
export const adminOnlyRouter = createTRPCRouter({
  adminFunction: adminProcedure
    .input(z.object({ data: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user available from JWT middleware
      // Contains: { email: string, isAdmin: boolean }
      console.log('Authenticated admin:', ctx.user.email);
      return { success: true };
    }),
});
```

## Component Integration

### Admin Page Guard
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
  setIsAuthenticated(isAdmin()); // Check stored JWT validity
}, []);

if (!isAuthenticated) {
  return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
}

return <AdminInterface />;
```

### Login Component
Uses tRPC mutation for authentication:
```typescript
const loginMutation = api.auth.login.useMutation({
  onSuccess: (data) => {
    setAdminAuth(data.user.email, data.token);
    onLogin(); // Redirect to admin interface
  },
  onError: (error) => {
    setError(error.message);
  },
});
```

## Testing

### curl Examples
```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"admin@example.com","password":"password"}}'

# 2. Use token for protected endpoints  
curl -X GET "http://localhost:3000/api/trpc/topics.adminHello" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling
- Invalid credentials: `401 UNAUTHORIZED`
- Expired tokens: `401 UNAUTHORIZED`
- Missing tokens: `401 UNAUTHORIZED`
- Malformed requests: `400 BAD_REQUEST`

All errors include descriptive messages for debugging without exposing sensitive information.

## Future Considerations
- Multi-admin support with role-based permissions
- Refresh token implementation for longer sessions
- OAuth integration for third-party authentication
- Rate limiting for brute force protection