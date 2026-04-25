ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update Admin status for existing admins
UPDATE public.profiles SET is_approved = TRUE WHERE role = 'ADMIN';

-- Update the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone_number, is_approved)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'EMPLOYEE'),
    new.raw_user_meta_data->>'phone_number',
    CASE WHEN COALESCE(new.raw_user_meta_data->>'role', 'EMPLOYEE') = 'ADMIN' THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the avatars bucket automatically
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 3. Set up Storage RLS Policies
-- Allow public access to view images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow individual uploads" ON storage.objects;
CREATE POLICY "Allow individual uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' );
