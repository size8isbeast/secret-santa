# Supabase Setup Guide

This guide will walk you through setting up Supabase for your Secret Santa app.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Secret Santa app repository

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: Secret Santa
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project root
4. Paste it into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see success messages for each table creation

### What Gets Created

- **`rooms` table**: Stores game state (opening order, current round, timer)
- **`submissions` table**: Stores player guesses
- **Indexes**: For better query performance
- **RLS Policies**: Security policies (currently permissive for development)
- **Realtime**: Enabled on the `rooms` table for live updates

## Step 3: Enable Realtime

1. Go to **Database** → **Replication** in the Supabase dashboard
2. Find the `rooms` table
3. Toggle the switch to enable replication
4. This allows real-time updates to sync across all connected clients

## Step 4: Get Your API Credentials

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 5: Configure Your App

1. In your project root, create a file named `.env.local`
2. Add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. Restart your Next.js dev server: `npm run dev`

## Step 6: Verify the Connection

1. Start your app: `npm run dev`
2. Open the browser console (F12 or Cmd/Opt + J)
3. You should see: `🎅 Using Supabase store for Secret Santa`
4. If you see "Using Mock store", check your `.env.local` file

## Testing

1. Open the app in multiple browser windows/tabs
2. Navigate to `/host` in one window (use key: `edc2026`)
3. Navigate to `/player` in other windows
4. Click "Start Game" on the host view
5. All player views should update in real-time!

## Database Schema

### `rooms` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (default: auto-generated) |
| `opening_order` | text[] | Array of player names in opening order |
| `current_index` | integer | Current round index (0-15) |
| `round_started_at` | timestamptz | When the current round started |
| `duration_sec` | integer | Timer duration in seconds (default: 90) |
| `is_started` | boolean | Whether the game has started |
| `created_at` | timestamptz | When the room was created |
| `updated_at` | timestamptz | When the room was last updated |

### `submissions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `room_id` | uuid | Foreign key to `rooms` table |
| `player_name` | text | Name of the player submitting |
| `round_index` | integer | Round number (0-15) |
| `guessed_santa_name` | text | Who they think is the Secret Santa |
| `created_at` | timestamptz | When the guess was submitted |

**Unique Constraint**: `(room_id, player_name, round_index)` - ensures one guess per player per round

## Security Considerations

### For Development

The current RLS policies allow all operations:
```sql
create policy "Allow all operations on rooms"
  on rooms for all
  using (true)
  with check (true);
```

This is fine for development and private use.

### For Production

If deploying publicly, consider:

1. **Add authentication**: Use Supabase Auth to identify users
2. **Restrict operations**:
   - Only authenticated users can read/write
   - Only the host (specific user) can update game state
   - Players can only submit their own guesses
3. **Rate limiting**: Prevent abuse
4. **Room expiration**: Clean up old rooms automatically

Example production-ready RLS policy:
```sql
-- Example: Only allow authenticated users
create policy "Authenticated users can read rooms"
  on rooms for select
  using (auth.role() = 'authenticated');

-- Example: Only room creator can update
create policy "Only creator can update room"
  on rooms for update
  using (auth.uid() = creator_id);
```

## Troubleshooting

### "Using Mock store" appears in console

- Check that `.env.local` exists and has the correct variables
- Make sure variable names start with `NEXT_PUBLIC_`
- Restart the dev server after adding env variables

### Real-time not working

- Verify Realtime is enabled for the `rooms` table (Step 3)
- Check browser console for WebSocket connection errors
- Ensure your Supabase project is on a plan that supports Realtime

### "relation does not exist" errors

- Run the SQL schema again (Step 2)
- Verify tables were created in the SQL Editor

### Players not seeing updates

- Check that all clients are connected to the same room ID
- Default room ID is `00000000-0000-0000-0000-000000000001`
- Modify `DEFAULT_ROOM_ID` in `lib/supabaseStore.ts` if needed

## Next Steps

- Customize player names in `lib/mockStore.ts` or `lib/supabaseStore.ts`
- Add authentication with Supabase Auth
- Deploy to Vercel (environment variables are set in project settings)
- Set up proper RLS policies for production use

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Project Issues](https://github.com/your-repo/issues)
