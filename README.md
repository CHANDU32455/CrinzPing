# CrinzPing

This is a React + TypeScript + Vite application.

## Getting Started

### Prerequisites

- Node.js (v20 or later recommended)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in the required values.

### Development

Start the development server:
```bash
npm run dev
```

### Testing

Run unit tests:
```bash
npm test
```

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Deployment

1. Build the project using `npm run build`.
2. The output will be in the `dist` directory.
3. Deploy the contents of the `dist` directory to your hosting provider (e.g., AWS S3 + CloudFront, Vercel, Netlify).

## CI/CD

This project uses GitHub Actions for CI. The workflow is defined in `.github/workflows/ci.yml` and runs linting, building, and testing on every push and pull request.
