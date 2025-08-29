# Component Architecture

## Overview
The application uses a modular React component architecture with Next.js 15, following T3 Stack patterns. Components are organized by feature and responsibility, with clear separation between layout, business logic, and presentation.

## Component Structure

```
src/app/_components/
├── AdminLogin.tsx              # Authentication interface
├── NewsletterGenerator/        # Newsletter generation feature
│   ├── index.ts
│   └── NoNewsletterFound.tsx
├── NewsletterPreview/          # Newsletter preview system
│   ├── index.ts
│   └── NewsletterPreviewHeader.tsx
├── TopicsManagement/           # Topic generation and management
│   ├── index.ts
│   ├── GenerateTopicsButton.tsx
│   └── DeleteAllTopicsButton.tsx
├── UserList/                   # User management components
│   ├── UserList.tsx
│   └── UserCard.tsx
├── TopicsViewer.tsx            # Split-pane topics browser
├── TopicsList.tsx              # Topic list with status indicators
├── NewsletterPreview.tsx       # Newsletter content preview
├── UserManagement.tsx          # Complete user management interface
├── DailySignupsChart.tsx       # Analytics visualization
├── EmailSignup.tsx             # Landing page signup form
└── ...utility components
```

## Architecture Patterns

### Component Separation
Each major feature is extracted into self-contained components following the pattern:

```typescript
// ❌ BAD - Monolithic component
export default function AdminPage() {
  // Authentication logic
  // Topics generation logic + state + UI
  // Newsletter generation logic + state + UI
  // User management logic + state + UI
  return <div>{/* Everything mixed together */}</div>;
}

// ✅ GOOD - Modular architecture
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  if (!isAuthenticated) return <AdminLogin onLogin={handleLogin} />;
  
  return (
    <div className="admin-layout">
      <TopicsManagement />      {/* Self-contained feature */}
      <NewsletterGenerator />   {/* Self-contained feature */}
      <TopicsViewer />          {/* Self-contained feature */}
      <UserManagement />        {/* Self-contained feature */}
    </div>
  );
}
```

### Self-Contained Components
Each feature component manages its own:
- **State**: Local React state for UI interactions
- **API Calls**: tRPC hooks for data fetching
- **Error Handling**: Success/error states and user feedback
- **Business Logic**: Component-specific data processing

## Core Components

### AdminLogin (`AdminLogin.tsx`)
**Purpose**: JWT-based admin authentication interface

```typescript
interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      setAdminAuth(data.user.email, data.token);
      onLogin();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit}>
        {/* Login form fields */}
      </form>
    </div>
  );
}
```

**Features**:
- Email/password form validation
- tRPC authentication mutation
- JWT token storage via `setAdminAuth()`
- Error state management
- Loading states during authentication

### TopicsManagement (`TopicsManagement.tsx`)
**Purpose**: Syllabus generation and topic management interface

```typescript
export function TopicsManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);

  const generateMutation = api.topics.generate.useMutation({
    onSuccess: (data) => {
      setTopics(data.topics);
      // Success notification
    },
    onError: (error) => {
      // Error handling
    },
  });

  return (
    <div className="space-y-4">
      <h2>Topics Management</h2>
      <GenerateTopicsButton onGenerate={handleGenerate} />
      <DeleteAllTopicsButton onDelete={handleDelete} />
      <TopicsList topics={topics} />
    </div>
  );
}
```

**Sub-components**:
- `GenerateTopicsButton`: AI syllabus generation trigger
- `DeleteAllTopicsButton`: Topic cleanup with confirmation
- Status indicators for generation progress

### NewsletterGenerator (`NewsletterGenerator/index.tsx`)
**Purpose**: Newsletter content generation and management

```typescript
export function NewsletterGenerator() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = api.newsletter.generate.useMutation({
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
    onSuccess: () => {
      // Update UI state
    },
  });

  const sendMutation = api.newsletter.sendToAdmin.useMutation({
    onSuccess: (data) => {
      // Show success message with messageId
    },
  });

  return (
    <div className="newsletter-generator">
      <TopicSelector onSelect={setSelectedTopicId} />
      {selectedTopicId && (
        <NewsletterControls
          topicId={selectedTopicId}
          onGenerate={handleGenerate}
          onSend={handleSend}
        />
      )}
    </div>
  );
}
```

**Features**:
- Topic selection interface
- Newsletter generation with OpenAI
- Email sending to admin for preview
- Status tracking and progress indicators

### TopicsViewer (`TopicsViewer.tsx`)
**Purpose**: Split-pane interface for browsing topics and previewing newsletters

```typescript
export function TopicsViewer() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [topics] = api.topics.getAll.useSuspenseQuery();

  return (
    <div className="flex h-[600px] border rounded-lg">
      {/* Left Pane: Topics List */}
      <div className="w-1/2 border-r">
        <TopicsList 
          topics={topics}
          selectedId={selectedTopicId}
          onSelect={setSelectedTopicId}
        />
      </div>
      
      {/* Right Pane: Newsletter Preview */}
      <div className="w-1/2">
        {selectedTopicId ? (
          <NewsletterPreview topicId={selectedTopicId} />
        ) : (
          <div className="p-4">Select a topic to view newsletter</div>
        )}
      </div>
    </div>
  );
}
```

### UserManagement (`UserManagement.tsx`)
**Purpose**: Complete user administration interface

```typescript
export function UserManagement() {
  const [users] = api.user.getAll.useSuspenseQuery();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  return (
    <div className="user-management">
      <div className="flex justify-between items-center mb-4">
        <h2>User Management</h2>
        <StatisticsCards />
      </div>
      
      <UserList
        users={users}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
      />
      
      <div className="mt-6">
        <DailySignupsChart />
      </div>
    </div>
  );
}
```

**Features**:
- User list with pagination
- Bulk selection for user operations
- Daily signup analytics chart
- User statistics dashboard

## Utility Components

### StatusMessage (`StatusMessage.tsx`)
**Purpose**: Reusable status indicators for operations

```typescript
interface StatusMessageProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  className?: string;
}

export function StatusMessage({ type, message, className }: StatusMessageProps) {
  const statusStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  return (
    <div className={`p-3 border rounded ${statusStyles[type]} ${className}`}>
      {message}
    </div>
  );
}
```

### ConfirmationModal (`ConfirmationModal.tsx`)
**Purpose**: Reusable confirmation dialogs for destructive actions

```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold">{props.title}</h3>
        <p className="mt-2 text-gray-600">{props.message}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={props.onConfirm} className="btn-danger">
            {props.confirmText ?? 'Confirm'}
          </button>
          <button onClick={props.onCancel} className="btn-secondary">
            {props.cancelText ?? 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### CopyButton (`CopyButton.tsx`)
**Purpose**: Copy-to-clipboard functionality with visual feedback

```typescript
interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <button
      onClick={() => copyToClipboard(text)}
      className={`btn-secondary ${className}`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

## Data Fetching Patterns

### tRPC Integration
Components use tRPC React Query hooks for type-safe API calls:

```typescript
// Query data
const [topics] = api.topics.getAll.useSuspenseQuery();

// Mutations with optimistic updates
const generateMutation = api.topics.generate.useMutation({
  onMutate: async (newData) => {
    await utils.topics.getAll.cancel();
    const previousData = utils.topics.getAll.getData();
    utils.topics.getAll.setData(undefined, (old) => [...old, newData]);
    return { previousData };
  },
  onError: (err, newData, context) => {
    utils.topics.getAll.setData(undefined, context?.previousData);
  },
  onSettled: () => {
    utils.topics.getAll.invalidate();
  },
});
```

### Loading States
```typescript
export function TopicsList() {
  const { data: topics, isLoading, error } = api.topics.getAll.useQuery();

  if (isLoading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {topics.map(topic => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
```

## Styling and UI

### Tailwind CSS
All components use Tailwind CSS with consistent design system:

```typescript
// Layout classes
"flex min-h-screen items-center justify-center"  // Centered layout
"container mx-auto space-y-6 p-6"                // Page container
"grid gap-6 md:grid-cols-2"                      // Responsive grid

// Component classes  
"bg-white shadow rounded-lg p-6"                 // Card component
"btn-primary", "btn-secondary", "btn-danger"     // Button variants
"border-l-4 border-blue-500 bg-blue-50"          // Status indicators
```

### Responsive Design
Components are mobile-first responsive:
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Responsive spacing: `p-4 md:p-6 lg:p-8`
- Breakpoint-specific hiding: `hidden md:block`

## Error Boundaries and Handling

### Component-Level Error Handling
```typescript
export function NewsletterGenerator() {
  const [error, setError] = useState<string | null>(null);

  const generateMutation = api.newsletter.generate.useMutation({
    onError: (error) => {
      setError(error.message);
      // Optional: Report to error tracking service
    },
    onSuccess: () => {
      setError(null);
    },
  });

  return (
    <div>
      {error && <StatusMessage type="error" message={error} />}
      {/* Component content */}
    </div>
  );
}
```

### Global Error Boundary
```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ErrorBoundary fallback={<ErrorPage />}>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## Testing Strategy

### Component Testing
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminLogin } from '../AdminLogin';

test('shows error message on invalid credentials', async () => {
  render(<AdminLogin onLogin={jest.fn()} />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'invalid@example.com' }
  });
  fireEvent.click(screen.getByText('Login'));
  
  await screen.findByText('Invalid email or password');
});
```

### Mock API Responses
```typescript
// Setup tRPC mocks for testing
const mockUtils = {
  auth: {
    login: {
      useMutation: () => ({
        mutate: mockLogin,
        isLoading: false,
        error: null,
      }),
    },
  },
};
```

## Performance Optimizations

### Code Splitting
```typescript
// Lazy load heavy components
const DailySignupsChart = lazy(() => import('./DailySignupsChart'));

function UserManagement() {
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <DailySignupsChart />
      </Suspense>
    </div>
  );
}
```

### Memoization
```typescript
// Expensive calculations
const expensiveValue = useMemo(() => {
  return topics.reduce((acc, topic) => {
    // Complex computation
    return acc + topic.complexity;
  }, 0);
}, [topics]);

// Event handlers
const handleTopicSelect = useCallback((topicId: number) => {
  setSelectedTopicId(topicId);
}, []);
```