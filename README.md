# Cardex - Pokémon Card Collection Manager

A modern web application for managing your Pokémon card collection with AI-powered card scanning and identification.

## Features

- 🤖 **AI Card Scanning**: Use Gemini Vision to automatically identify Pokémon cards from photos
- 🔐 **Secure Authentication**: Firebase Authentication with email and Google login
- 📱 **Responsive Design**: Modern UI built with Next.js and Tailwind CSS
- 💾 **Cloud Storage**: Real-time data synchronization with Firestore
- ✏️ **CRUD Operations**: Create, read, update, and delete cards in your collection
- 🎯 **Type Safety**: Full TypeScript implementation for better development experience

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js 15] --> B[React 18]
        B --> C[TypeScript]
        C --> D[Tailwind CSS]
        D --> E[Radix UI Components]
        B --> F[React Hook Form]
        F --> G[Zod Validation]
    end
    
    subgraph "Backend Services"
        H[Firebase Auth] --> I[Google Authentication]
        J[Firestore Database] --> K[Real-time Updates]
        L[Gemini AI] --> M[Vision API]
        M --> N[Card Recognition]
    end
    
    subgraph "Development Tools"
        O[Genkit AI Framework] --> P[AI Flow Management]
        Q[ESLint] --> R[Code Quality]
        S[PostCSS] --> T[CSS Processing]
    end
    
    A --> H
    A --> J
    A --> L
    O --> L
```

## Project Structure

```
src/
├── ai/
│   └── flows/
│       └── scan-pokemon-card.ts    # AI card scanning logic
├── app/
│   ├── dashboard/
│   │   ├── collection/             # Card collection pages
│   │   └── scan/                   # Card scanning page
│   └── page.tsx                    # Root page with auth routing
├── components/
│   ├── cards/
│   │   ├── CardForm.tsx           # Reusable card form
│   │   ├── CardItem.tsx           # Individual card display
│   │   └── CardScanner.tsx        # AI scanning component
│   └── ui/                        # Reusable UI components
├── hooks/
│   └── useAuth.tsx                # Authentication hook
├── lib/
│   ├── firebase.ts                # Firebase configuration
│   └── firestore.ts              # Database operations
└── types/
    └── index.ts                   # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore and Authentication enabled
- Google AI API key for Gemini Vision

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cardex
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with:
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. (Optional) Start the Genkit AI development server:
```bash
npm run genkit:dev
```

## Usage

### Card Scanning
1. Navigate to the scan page
2. Upload a photo of your Pokémon card
3. Click "Scan Card" to identify the card using AI
4. Review and edit the detected information
5. Save the card to your collection

### Collection Management
- View all your cards in a responsive grid layout
- Edit card details by clicking on any card
- Delete cards from your collection
- Cards are automatically sorted by last updated date

## Database Structure

```
Firestore Collection: users/{userId}/pokemon_cards/{cardId}
├── name: string
├── set: string
├── rarity: string
├── imageDataUrl: string (base64 encoded image)
├── userId: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

## AI Integration

The app uses Google's Gemini Vision API through the Genkit framework to:
- Analyze uploaded card images
- Extract card name, set, and rarity information
- Provide structured data for user review and confirmation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit with file watching


## Support

For support and questions, please open an issue in the repository.
