# Secret Santa Gift Opening Game

A real-time multiplayer game for managing Secret Santa gift opening sessions. Built with Next.js, React, and TypeScript.

## Overview

This app facilitates the gift-opening phase of Secret Santa with two synchronized views:
- **Host/Projector View**: Controls game flow and displays current recipient with a countdown timer
- **Player View**: Allows participants to submit guesses about who each person's Secret Santa is

## Features

- Real-time synchronization between host and all players (via mock event bus)
- Randomized opening order for fairness
- 90-second countdown timer per round
- One submission per player per round
- Enforces "15 questions" rule (players skip when they're the recipient)
- Clean, responsive UI with Tailwind CSS
- Ready for Supabase integration (mock store can be swapped out)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Play

1. **Host Setup**: Open `/host` on a projector or shared screen
   - Enter the host key: `edc2026` to access the host controls
2. **Players Join**: Each player opens `/player` on their phone/device
   - Click "Enter Game" button to proceed
   - Select their name from the list
3. **Start Game**: Host clicks "Start" to randomize the opening order
4. **Open Gifts**: When a name appears, that person opens their gift
5. **Submit Guesses**: All other players guess who that person's Secret Santa is
6. **Repeat**: Host clicks "Next" to continue until everyone has opened their gift

## Access Control

### Host View
- Protected with a password/key
- Default key: `edc2026`
- To change the key, edit the `HOST_KEY` constant in `app/host/page.tsx`

### Player View
- Temporary entry button for mock authentication
- Allows players to proceed to identity selection
- Can be replaced with real authentication later

## Project Structure

```
/app
  /host          # Host/Projector view page
  /player        # Player view page
  page.tsx       # Landing page with navigation
/lib
  /hooks
    useRoomState.ts   # React hook for subscribing to room state
  types.ts            # TypeScript type definitions
  mockStore.ts        # In-memory store with event bus (fallback)
  supabaseStore.ts    # Supabase-powered store with Realtime
  store.ts            # Unified store (auto-switches between mock/Supabase)
  supabase.ts         # Supabase client configuration
/components
  Timer.tsx           # Countdown timer component
supabase-schema.sql   # Database schema for Supabase
```

## Architecture

### Dual-Mode Store System

The app automatically switches between two store implementations:

#### **Mock Store** (Default)
- In-memory storage with event bus pattern
- No setup required - works immediately
- Perfect for local development and testing
- Data resets when server restarts

#### **Supabase Store** (Production-Ready)
- PostgreSQL database with Supabase
- Real-time synchronization via Supabase Realtime
- Persistent data across sessions
- Scalable for multiple concurrent games

### How It Works

The app checks for Supabase environment variables:
- **If found**: Uses `supabaseStore` with real database and Realtime
- **If not found**: Falls back to `mockStore` for local testing

```typescript
// Automatic switching based on environment
const hasSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const store = hasSupabaseConfig ? supabaseStore : mockStore;
```

### Setting Up Supabase

**Want real-time persistence?** Follow the detailed setup guide:

📖 **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete step-by-step instructions

Quick start:
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` to create tables
3. Copy `.env.local.example` to `.env.local` and add your credentials
4. Restart the dev server - you're now using Supabase!

## Configuration

### Player Names
Edit `ALL_PLAYERS` array in `lib/mockStore.ts` to customize the 16 player names.

### Timer Duration
Default is 90 seconds per round. Modify `durationSec` in `lib/mockStore.ts` or add UI controls to adjust.

## Deploy on Vercel

This Next.js app is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy with zero configuration

The app will be available at your Vercel URL, and players can access `/player` while the host projects `/host`.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + custom event bus
- **Deployment**: Vercel (recommended)

## License

MIT
