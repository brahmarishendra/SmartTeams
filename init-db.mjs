import pg from 'pg';

const { Client } = pg;

// postgresql://postgres:P75NNzI3Vgr9Zulk@db.ipuksbnsyqqssqtherbb.supabase.co:5432/postgres
const connectionString = 'postgresql://postgres.ipuksbnsyqqssqtherbb:P75NNzI3Vgr9Zulk@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function initDB() {
  const projectId = 'ipuksbnsyqqssqtherbb';
  const password = 'P75NNzI3Vgr9Zulk';
  const hosts = [
    `db.${projectId}.supabase.co`, // Direct
    `aws-0-ap-south-1.pooler.supabase.com`, // Mumbai
    `aws-0-us-east-1.pooler.supabase.com`, // US East
    `aws-0-ap-southeast-1.pooler.supabase.com`, // Singapore
  ];

  let client;
  let connected = false;

  for (const host of hosts) {
    const isDirect = host.includes('.supabase.co');
    const port = isDirect ? 5432 : 6543;
    const user = isDirect ? 'postgres' : `postgres.${projectId}`;
    const connectionString = `postgresql://${user}:${password}@${host}:${port}/postgres`;

    try {
      console.log(`Attempting connection to ${host}...`);
      client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
      await client.connect();
      console.log(`Connected successfully to ${host}!`);
      connected = true;
      break;
    } catch (err) {
      console.log(`Failed to connect to ${host}: ${err.message}`);
    }
  }

  if (!connected) {
    console.error('All connection attempts failed. Please verify your database password and project ID.');
    return;
  }

  try {
    const createTablesQuery = `
      -- 1. Create profiles table linked to auth.users
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
        is_approved BOOLEAN DEFAULT FALSE,
        phone_number TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Ensure avatar_url exists even if table was created previously
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
          ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
          ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_approved') THEN
          ALTER TABLE public.profiles ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_number') THEN
          ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
        END IF;
      END $$;

      -- 2. Create tasks table
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Blocked')),
        due_date DATE,
        assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 3. STORAGE SETUP (Automatic Bucket Creation)
      -- Insert the 'avatars' bucket into storage.buckets if it doesn't exist
      INSERT INTO storage.buckets (id, name, public)
      SELECT 'avatars', 'avatars', true
      WHERE NOT EXISTS (
          SELECT 1 FROM storage.buckets WHERE id = 'avatars'
      );

      -- RLS for Storage
      CREATE POLICY "Public Access" 
      ON storage.objects FOR SELECT 
      USING ( bucket_id = 'avatars' );

      CREATE POLICY "Allow individual uploads" 
      ON storage.objects FOR INSERT 
      WITH CHECK ( bucket_id = 'avatars' );

      -- 4. Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

      -- 5. Policies for profiles
      -- Allow everyone to read profiles
      DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
      CREATE POLICY "Profiles are viewable by everyone" 
        ON public.profiles FOR SELECT USING (true);
        
      -- Allow users to update their own profiles
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE USING (auth.uid() = id);

      -- Allow Admins to insert/update any profile
      DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
      CREATE POLICY "Admins can update any profile" 
        ON public.profiles FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
          )
        );

      -- 6. Policies for tasks
      -- Allow everyone to read tasks
      DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
      CREATE POLICY "Tasks are viewable by everyone" 
        ON public.tasks FOR SELECT USING (true);

      -- Allow Admins to create tasks
      DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
      CREATE POLICY "Admins can insert tasks" 
        ON public.tasks FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
          )
        );

      -- Allow Admins to update any tasks
      DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;
      CREATE POLICY "Admins can update tasks" 
        ON public.tasks FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
          )
        );

      -- Allow Assigned users to update task status
      DROP POLICY IF EXISTS "Assigned users can update task status" ON public.tasks;
      CREATE POLICY "Assigned users can update task status" 
        ON public.tasks FOR UPDATE USING (
          auth.uid() = assigned_to
        );

      -- Allow Admins to delete tasks
      DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
      CREATE POLICY "Admins can delete tasks" 
        ON public.tasks FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
          )
        );

      -- 7. Trigger to automatically create profile on signup
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

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

      -- 8. Enable Real-time for tasks
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END $$;
    `;

    console.log('Executing database schema creation and policies...');
    await client.query(createTablesQuery);
    console.log('Database initialized successfully!');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    if (client) await client.end();
  }
}

initDB();
