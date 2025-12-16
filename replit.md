# GeoLingua

## Overview

GeoLingua is a peer-to-peer translator marketplace mobile application built with React Native and Expo. The platform connects users who need translation services with professional translators for instant or scheduled video translation calls. The app targets Georgians abroad and foreigners in Georgia, offering both human translators and an AI-powered translation option.

Key features include:
- Instant "need now" translation requests using broadcast-style matching
- Scheduled translation bookings
- AI translator option for simple conversations (24/7, lower cost)
- Category-based pricing (general, administrative, business, medical, legal)
- Video calling between users and translators
- Rating and payment systems

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with bottom tabs and native stack navigators
- **State Management**: TanStack React Query for server state
- **UI Components**: Custom themed components with dark/light mode support
- **Animations**: React Native Reanimated for smooth UI interactions
- **Styling**: StyleSheet API with a centralized theme system in `client/constants/theme.ts`

The client code lives in the `client/` directory with screens, components, navigation, hooks, and constants organized into separate folders.

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON API with full internationalization support (Georgian and English)
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Routes**: Centralized in `server/routes.ts` handling languages, categories, translators, users, and calls
- **Internationalization**: `server/i18n.ts` provides bilingual responses for all API endpoints

The server uses a storage abstraction layer (`server/storage.ts`) that wraps Drizzle queries, making it easier to test and modify data access patterns.

### Bilingual API Response Format
All API responses include both Georgian and English text:
- **Success responses**: `{ data: {...}, locale: "en" | "ka" }`
- **Error responses**: `{ error: "...", errorKa: "...", errorEn: "...", locale }`
- **Categories/Languages**: Include both `name` (Georgian) and `nameEn` (English) fields
- **Online count**: Returns `labelKa` and `labelEn` for display text

The locale is determined by the `Accept-Language` header ("ka" for Georgian, "en" for English).

### Data Models
- **Users**: Basic user profiles with language preferences
- **Translators**: Extended profiles with ratings, languages, categories, and online status
- **Calls**: Translation session records with duration, pricing, and ratings
- **Categories**: Translation categories with per-minute pricing
- **Languages**: Supported language pairs

### Shared Code
The `shared/` directory contains schema definitions and types used by both frontend and backend, enabling type safety across the full stack.

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via Drizzle ORM
- **Connection**: Configured through `DATABASE_URL` environment variable

### Planned Integrations (from design docs)
- **Twilio**: Video calling functionality (not yet implemented)
- **Stripe**: Payment processing (not yet implemented)
- **OpenAI**: AI translator using Whisper for transcription and GPT for translation (not yet implemented)
- **Authentication**: Apple Sign-In and Google Sign-In planned (not yet implemented)

### Build and Development
- **Expo**: Handles mobile builds and development server
- **esbuild**: Server-side bundling for production
- **Drizzle Kit**: Database migrations and schema management