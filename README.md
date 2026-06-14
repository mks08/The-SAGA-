# The SAGA Varanasi - Angular Landing Page

A modern, single-page scroll landing page for **The SAGA Varanasi** commercial real estate project, built with **Angular v16+** and **SCSS**.

## Project Structure

```
the-saga-varanasi/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── core/                    # Singleton services
│   │   │   └── services/
│   │   │       ├── lead.service.ts
│   │   │       └── scroll.service.ts
│   │   ├── shared/                  # Reusable UI components
│   │   │   └── components/
│   │   │       ├── button/
│   │   │       ├── icon/
│   │   │       └── chatbot-widget/
│   │   └── components/              # Page sections
│   │       ├── navbar/
│   │       ├── main-layout/
│   │       ├── hero/
│   │       ├── highlights/
│   │       ├── ideal-for/
│   │       ├── location/
│   │       └── contact/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
└── package.json
```

## Features

- **Modular Architecture**
  - AppModule: Root bootstrapper
  - CoreModule: Singleton services (LeadService, ScrollService)
  - SharedModule: Reusable UI components
  
- **Responsive Components**
  - Sticky navigation with active section highlighting
  - Hero section with 3D canvas placeholder and parallax support
  - Highlights grid with VDA approval badges
  - Tabbed "Ideal For" section
  - Google Maps embedded location
  - Contact form with Reactive Forms validation
  - Floating chatbot widget with quick email form
  
- **Technologies**
  - Angular 16+
  - Reactive Forms for form validation
  - RxJS for state management
  - SCSS for styling
  - Angular Animations (@angular/animations)
  - Google Maps integration (@angular/google-maps)

## Setup

### Prerequisites
- Node.js v24.15.0+ (or run `nvm install 24.15.0`)
- npm v8.0.0+

### Installation

```bash
cd the-saga-varanasi
npm install --legacy-peer-deps
```

### Development Server

```bash
npm run start
```

Navigate to **http://localhost:4200**. The app will automatically reload on source file changes.

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Development Notes

1. **Adding New Components**
   ```bash
   ng generate component app/components/your-component --style=scss
   ```

2. **Adding Services**
   ```bash
   ng generate service app/core/services/your-service
   ```

3. **Styling**
   - All components use SCSS with the pattern `component.component.scss`
   - Global styles are in `src/styles.scss`
   - CSS variables defined in `app.component.scss`

4. **Form Validation**
   - Contact form: `src/app/components/contact/contact.component.ts`
   - Chatbot form: `src/app/shared/components/chatbot-widget/chatbot-widget.component.ts`
   - Both use Reactive Forms with built-in validators

## API Integration

Update `src/app/core/services/lead.service.ts` with your backend API endpoint:

```typescript
private endpoint = 'your-api-endpoint/leads';
```

## Scroll Tracking

The `ScrollService` tracks the active section as users scroll. Connected to the navbar for active link highlighting. Modify in:
- `src/app/core/services/scroll.service.ts`
- `src/app/components/navbar/navbar.component.ts`

## License

Private Project - The SAGA Varanasi

## Support

For issues or questions, reach out to the development team.
