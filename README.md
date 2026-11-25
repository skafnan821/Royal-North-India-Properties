# Royal North India Properties — React + Vite

A complete frontend property-management project adapted from the PPMS React application and branded for Royal North India Properties. It includes public property discovery, login and registration, owner and tenant dashboards, property management, tenant records, rental payments, leases, and messaging. Demo data is stored in browser Local Storage; no Supabase credentials or backend are required.

## Run in VS Code

1. Extract this ZIP.
2. Open the **Royal-North-India-Properties** folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

```bash
npm install
npm run dev
```

If PowerShell blocks npm scripts on Windows, use:

```bash
npm.cmd install
npm.cmd run dev
```

Open the localhost URL shown in the terminal (usually http://localhost:5173).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Owner | owner@example.com | 123456 |
| Tenant | rahul@example.com | 123456 |

You can also register a new account.

## Main features

- Royal North India landing page and property discovery
- Search, property-type and availability filters, sorting, favourites and enquiry form
- Login and registration with role selection
- Owner dashboard with property CRUD, tenant management, payments, leases and messages
- Tenant dashboard with property, payment history, lease and messages
- Responsive layout for desktop and mobile
- Local Storage persistence with a project-specific storage namespace

## Build check

```bash
npm run build
```

## Important academic-demo note

This is a frontend demonstration. Demo passwords are stored in browser Local Storage and must not be used for production authentication or real financial transactions. Property listings and images are sample content, not verified real-world listings.
