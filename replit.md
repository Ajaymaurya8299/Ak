# Aviator Game

## Overview

This is a 3D Aviator crash game built with React, Three.js, and Express. The game features a plane that flies upward with an increasing multiplier, and players must cash out before the plane crashes. The application combines real-time 3D graphics with betting mechanics, creating an engaging gambling-style experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Main UI framework with strong typing
- **Three.js + React Three Fiber**: 3D rendering engine for the game scene
- **Vite**: Build tool and development server with hot module replacement
- **Tailwind CSS + Radix UI**: Styling framework with accessible component library
- **Zustand**: State management for game logic and audio controls
- **TanStack Query**: Server state management and API caching

### Backend Architecture
- **Express.js**: REST API server handling game statistics and player data
- **TypeScript**: Full-stack type safety with ESM modules
- **In-memory Storage**: Simple data persistence using Map-based storage
- **RESTful Endpoints**: `/api/stats`, `/api/player/balance`, `/api/game/result`

### Game Engine Design
- **State-driven Architecture**: Game phases (waiting, preparing, flying, crashed)
- **Multiplier Calculation**: Exponential growth algorithm with crash point prediction
- **Real-time Updates**: 60fps game loop using `useFrame` from React Three Fiber
- **Betting System**: Support for manual and auto-play modes with configurable cash-out

### 3D Graphics Pipeline
- **Scene Components**: Modular 3D components (Plane, Background, Clouds)
- **Physics Simulation**: Custom plane movement and rotation calculations
- **Visual Effects**: Particle systems, lighting, and post-processing
- **Asset Loading**: Support for GLTF models, textures, and audio files

### Data Storage Solutions
- **PostgreSQL Ready**: Drizzle ORM configured for production database
- **Memory Storage**: Development-friendly in-memory data persistence
- **Schema Definition**: Shared type-safe database schema using Drizzle + Zod

### Mobile Responsiveness & PWA Features
- **Progressive Web App**: Full PWA implementation with offline support
- **Mobile Install**: Custom install prompts for home screen installation
- **Touch Optimization**: Mobile-first betting controls and game interaction
- **Responsive Canvas**: Full-screen 3D rendering across all device sizes
- **Safe Area Support**: Proper handling of notched devices and dynamic islands
- **Performance Optimization**: GPU acceleration and reduced motion support

## External Dependencies

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect
- **Neon Database**: Serverless PostgreSQL integration (`@neondatabase/serverless`)
- **Database Migrations**: Automated schema management in `/migrations`

### 3D Graphics & Animation
- **Three.js Ecosystem**: Core 3D rendering (`@react-three/fiber`, `@react-three/drei`)
- **Post-processing**: Visual effects pipeline (`@react-three/postprocessing`)
- **GLSL Shaders**: Custom shader support via `vite-plugin-glsl`

### UI Component Library
- **Radix UI**: Comprehensive accessible component system
- **Lucide Icons**: Modern icon library for UI elements
- **Class Variance Authority**: Utility for component variant management

### Development Tools
- **Replit Integration**: Runtime error overlay (`@replit/vite-plugin-runtime-error-modal`)
- **Build Pipeline**: ESBuild for server bundling, Vite for client assets
- **Type Checking**: Strict TypeScript configuration with path mapping

### Progressive Web App (PWA)
- **Service Worker**: Offline functionality and background sync (`/sw.js`)
- **Web App Manifest**: Installation prompts and app metadata (`/manifest.json`)
- **Push Notifications**: Real-time updates and engagement features
- **Mobile Optimizations**: Touch gestures, safe areas, and performance enhancements
- **Install Prompts**: Custom install UI for both Android and iOS devices
- **Offline Support**: Cached assets and background synchronization

### Payment Gateway Integration
- **Razorpay**: Real money payment processing for UPI, bank transfers, cards
- **Payment Security**: Server-side signature verification and fraud protection
- **Withdrawal System**: Automated payout processing to bank accounts and UPI
- **API Integration**: Full checkout flow with real-time payment status

### Audio System
- **HTML5 Audio**: Native audio playback for game sounds and music
- **Sound Management**: Zustand-based audio state with mute controls
- **Asset Types**: Support for MP3, OGG, and WAV audio formats