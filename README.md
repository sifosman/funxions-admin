# Vibeventz Admin Dashboard

A Next.js-based admin dashboard for managing the Vibeventz mobile application backend.

## Features

### ✅ Implemented
- **Authentication**: Secure admin login with role-based access control
- **Dashboard Overview**: View key stats (pending applications, total vendors, users)
- **Application Review System**: 
  - View all subscriber applications
  - Filter by status (pending, approved, rejected, etc.)
  - Review detailed application data (company info, service details, uploaded files)
  - Approve/Reject applications with admin notes
  - Auto-create vendor records upon approval
  - View portfolio images and business documents

### 🚧 Coming Soon
- User Management (view all users, manage roles, ban/suspend)
- Vendor Management (edit profiles, featured listings)
- Analytics & Reporting (charts, conversion rates, revenue)

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (same as mobile app)
- **Auth**: Supabase Auth

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://fhlocaqndxawkbztncwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run the development server:
```bash
npm run dev
```

### Creating an Admin User

To access the dashboard, update a user to have admin role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Login page
│   └── dashboard/
│       ├── layout.tsx        # Dashboard layout
│       ├── page.tsx          # Dashboard home
│       ├── applications/     # Application review
│       ├── users/            # User management
│       ├── vendors/          # Vendor management
│       └── analytics/        # Analytics
├── lib/
│   └── supabase.ts           # Supabase client
└── ...
```

## Deployment

1. Push to GitHub
2. Import on Vercel
3. Add environment variables
4. Deploy!

## License

Private - For Vibeventz internal use only.
