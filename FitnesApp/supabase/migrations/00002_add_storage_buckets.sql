-- Create a bucket for food scans
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-scans', 'food-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access control for the bucket
-- Allow public access to read files (or just authenticated?)
-- Step 5.1 verification says "public URL", so let's make it public for now or authenticated.
-- Usually, we want it to be private but for testing let's allow public read.

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'food-scans' );

-- We rely on "Users can manage their own scans" for security

CREATE POLICY "Users can manage their own scans"
ON storage.objects FOR ALL
USING (
  bucket_id = 'food-scans' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
