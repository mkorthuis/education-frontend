# Education Frontend

A reporting and analytics portal for New Hampshire K-12 schools. This application transforms data collected by the New Hampshire Department of Education (NH DOE) into accessible, insightful visualizations and reports for parents, educators, and taxpayers.

The platform makes valuable educational data transparent and actionable, allowing stakeholders to:
- Access school performance metrics and trends
- Compare data across different NH schools and districts
- Understand resource allocation and educational outcomes
- Make informed decisions based on comprehensive NH educational data

## Technologies

- **Frontend Framework**: React 18
- **State Management**: Redux Toolkit
- **UI Components**: Material UI (MUI v6)
- **Routing**: React Router v6
- **API Client**: Axios
- **Data Visualization**: Recharts, MUI X-Charts
- **Build Tool**: Vite
- **Testing**: Vitest with React Testing Library
- **Type Safety**: TypeScript
- **Formatting/Linting**: ESLint, Prettier

## Prerequisites

- Node.js 20.x
- npm 10.x

## Getting Started

### Installation

```sh
# Clone the repository
git clone <repository-url>
cd education-frontend

# Install dependencies
npm install
```

### Development

```sh
# Start development server
npm run dev
```

This will start the development server at http://localhost:5173 (or another port if 5173 is already in use).

### Production Build

```sh
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm start` - Serve production build
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Check TypeScript types

## Project Structure

```
src/
├── components/    # Reusable UI components
├── features/      # Domain-driven feature modules (auth, school, district)
│   ├── auth/      # Authentication feature with its own components, services, and store
│   ├── school/    # School management feature module
│   └── district/  # District management feature module
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── routes/        # React Router configuration
├── services/      # API services
├── store/         # Redux store setup
├── theme/         # MUI theme configuration
├── types/         # TypeScript types
└── utils/         # Utility functions
```

Each feature module follows a consistent structure:
- `components/` - UI components specific to the feature
- `pages/` - Page-level components for the feature
- `services/` - API services for the feature
- `store/` - Redux state management (reducers, actions, selectors)

This domain-driven architecture helps with code organization, maintainability, and separation of concerns.

## Deployment

The application is configured for deployment on Heroku:

```sh
# Deploy to Heroku
git push heroku main
```

## License

MIT License

Copyright (c) 2024 Education Frontend

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.