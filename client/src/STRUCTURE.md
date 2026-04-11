# Project Structure

This document explains the organization of the codebase.

## Directory Structure

```
client/src/
├── admin/                  # Admin Dashboard & Management
│   ├── components/         # Admin-only components
│   │   ├── add-guest-dialog.tsx
│   │   ├── admin-guest-book-manager.tsx
│   │   ├── budget-planner.tsx
│   │   ├── couple-photo-upload.tsx
│   │   ├── enhanced-rsvp-manager.tsx
│   │   ├── guest-list-manager.tsx
│   │   ├── guest-management-dashboard.tsx
│   │   ├── guest-manager-assignment.tsx
│   │   ├── guest-manager-guest-book.tsx
│   │   ├── mobile-guest-manager.tsx
│   │   ├── personalized-guest-dashboard.tsx
│   │   ├── progressive-onboarding.tsx
│   │   ├── restricted-admin-dashboard.tsx
│   │   ├── standard-template-settings.tsx
│   │   ├── wedding-admin-enhanced.tsx
│   │   └── wedding-language-settings.tsx
│   └── pages/              # Admin pages
│       ├── AdminDashboard.tsx
│       ├── AdminLogin.tsx
│       ├── CreateWedding.tsx
│       ├── GuestManagerDashboard.tsx
│       ├── UserDashboard.tsx
│       ├── WeddingEdit.tsx
│       └── WeddingManage.tsx
│
├── website/                # Public Wedding Website
│   ├── components/         # Public-facing components
│   │   ├── templates/      # Wedding template designs
│   │   │   ├── azamat-template.tsx
│   │   │   ├── classic-template.tsx
│   │   │   ├── elegant-template.tsx
│   │   │   ├── modern-template.tsx
│   │   │   └── romantic-template.tsx
│   │   ├── background-music-player.tsx
│   │   ├── birthday-animations.tsx
│   │   ├── birthday-cake.tsx
│   │   ├── birthday-countdown.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── enhanced-countdown-timer.tsx
│   │   ├── enhanced-rsvp-form.tsx
│   │   ├── enhanced-social-share.tsx
│   │   ├── epic-rsvp-form.tsx
│   │   ├── guest-book-form.tsx
│   │   ├── guest-book-manager.tsx
│   │   ├── language-toggle.tsx
│   │   ├── milestone-countdown.tsx
│   │   ├── photo-gallery.tsx
│   │   ├── photo-upload.tsx
│   │   ├── pricing-section.tsx
│   │   ├── rsvp-form.tsx
│   │   ├── social-share.tsx
│   │   └── wedding-language-switcher.tsx
│   └── pages/              # Public pages
│       ├── DemoWedding.tsx
│       ├── Landing.tsx
│       ├── NotFound.tsx
│       └── WeddingSite.tsx
│
├── shared/                 # Shared Across Admin & Website
│   ├── components/         # Reusable utility components
│   │   ├── data-protection-warning.tsx
│   │   ├── protected-route.tsx
│   │   └── smart-image-upload.tsx
│   └── pages/              # Authentication & payment pages
│       ├── GetStarted.tsx
│       ├── Payment.tsx
│       ├── PaymentSuccess.tsx
│       └── UserLogin.tsx
│
├── components/             # UI Component Library
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/                  # React hooks
│   ├── useAuth.tsx
│   ├── useMediaQuery.tsx
│   └── ...
│
├── lib/                    # Utilities & configuration
│   ├── i18n.ts
│   ├── queryClient.ts
│   ├── utils.ts
│   └── ...
│
├── locales/                # Translations
│   ├── en/
│   ├── ru/
│   ├── uz/
│   ├── kk/
│   └── kaa/
│
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## Import Path Conventions

### From Admin Components/Pages
```typescript
import { GuestListManager } from '@/admin/components/guest-list-manager';
import { CreateWedding } from '@/admin/pages/CreateWedding';
import { ProtectedRoute } from '@/shared/components/protected-route';
import { EpicRSVPForm } from '@/website/components/epic-rsvp-form';
import { Button } from '@/components/ui/button';
```

### From Website Components/Pages
```typescript
import { AzamatTemplate } from '@/website/components/templates/azamat-template';
import { PhotoUpload } from '@/website/components/photo-upload';
import { ProtectedRoute } from '@/shared/components/protected-route';
import { Input } from '@/components/ui/input';
```

### From Shared Components/Pages
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
```

## Key Principles

1. **Separation of Concerns**: Admin and public website code are completely separate
2. **Shared Code**: Common utilities and auth in `/shared`
3. **UI Library**: shadcn/ui components remain in `/components/ui`
4. **Type Safety**: All TypeScript imports use absolute paths with `@/` prefix
5. **Scalability**: Easy to add new admin features or website templates

## Adding New Features

### Adding a New Admin Feature
1. Create component in `admin/components/`
2. Add page (if needed) in `admin/pages/`
3. Import in routes with `@/admin/...`

### Adding a New Wedding Template
1. Create template in `website/components/templates/`
2. Use existing wedding components from `@/website/components/`
3. Register template in template selection system

### Adding Shared Utilities
1. Create component in `shared/components/`
2. Can be imported from both admin and website code
