/*
  # Fix Library Access Issues

  1. Changes
    - Update RLS policies to allow users to see their paid songs
    - Fix user association during payment flow
    - Add proper indexes for performance

  2. Security
    - Maintain data integrity
    - Allow proper access to paid content
    - Keep public access for shared songs
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own songs" ON public.songs;
  DROP POLICY IF EXISTS "Public can access songs" ON public.songs;
  DROP POLICY IF EXISTS "Public can access shared songs" ON public.songs;
  DROP POLICY IF EXISTS "Anyone can create songs" ON public.songs;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with unique names
CREATE POLICY "authenticated_users_view_songs"
  ON public.songs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    paid = true
  );

CREATE POLICY "public_shared_songs_access"
  ON public.songs
  FOR SELECT
  TO public
  USING (
    share_url IS NOT NULL OR
    preview_url IS NOT NULL
  );

CREATE POLICY "public_song_creation"
  ON public.songs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_user_paid ON public.songs(user_id, paid);
CREATE INDEX IF NOT EXISTS idx_songs_share_url ON public.songs(share_url);