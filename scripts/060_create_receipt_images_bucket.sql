-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipt-images',
  'receipt-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for receipt-images bucket
-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipt-images' AND
  (storage.foldername(name))[1] = 'receipts'
);

-- Allow users to read their own receipts
CREATE POLICY "Users can view receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipt-images');

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipt-images' AND
  auth.uid()::text = (storage.foldername(name))[3]
);

-- Allow public access to receipt images (for viewing in the app)
CREATE POLICY "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipt-images');
