-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT CHECK (role IN ('conductor', 'taller', 'admin')) DEFAULT 'conductor',
  full_name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  workshop_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate TEXT UNIQUE NOT NULL,
  vin_full TEXT UNIQUE NOT NULL,
  engine_number_full TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  photo_url TEXT,
  current_owner_id UUID REFERENCES public.users(id),
  status TEXT CHECK (status IN ('active', 'unregistered_deposit', 'sold', 'stolen')) DEFAULT 'active',
  qr_code TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verified Maintenance
CREATE TABLE IF NOT EXISTS public.verified_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES public.users(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  mileage INTEGER,
  service_type TEXT,
  description TEXT,
  cost DECIMAL(10,2),
  next_maintenance_date DATE,
  verified_label TEXT DEFAULT 'Verificado por Taller Afiliado',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owner Notes
CREATE TABLE IF NOT EXISTS public.owner_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.users(id),
  date DATE DEFAULT CURRENT_DATE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seal TEXT DEFAULT 'Nota del propietario (no verificada)'
);

-- Structural Changes
CREATE TABLE IF NOT EXISTS public.structural_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  km NUMERIC,
  odo_not_working BOOLEAN DEFAULT false,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Certifications
CREATE TABLE IF NOT EXISTS public.vehicle_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    workshop_id UUID REFERENCES public.users(id),
    checklist_score INTEGER DEFAULT 50,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfers
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  from_owner_id UUID REFERENCES public.users(id),
  to_owner_id UUID REFERENCES public.users(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unregistered Deposit (Limbo)
CREATE TABLE IF NOT EXISTS public.unregistered_deposit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  last_mileage INTEGER,
  last_workshop_id UUID REFERENCES public.users(id),
  visible_in_search BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  price DECIMAL(12,2),
  description TEXT,
  photos_url JSONB,
  photo_url TEXT,
  status TEXT CHECK (status IN ('available', 'sold', 'reserved')) DEFAULT 'available',
  traction TEXT,
  fuel_type TEXT,
  engine_displacement TEXT,
  owner_count INTEGER,
  general_condition TEXT,
  location TEXT,
  odometer_not_working BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for Users to allow registration
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- RLS Policies
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public vehicles read" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Users can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = current_owner_id);
CREATE POLICY "Owners can update vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = current_owner_id);

ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public marketplace read" ON public.marketplace FOR SELECT USING (true);
CREATE POLICY "Users can insert marketplace" ON public.marketplace FOR INSERT WITH CHECK (true);

ALTER TABLE public.verified_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public maintenance read" ON public.verified_maintenance FOR SELECT USING (true);
CREATE POLICY "Workshops can insert maintenance" ON public.verified_maintenance FOR INSERT WITH CHECK (true);

ALTER TABLE public.structural_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public structural changes read" ON public.structural_changes FOR SELECT USING (true);
CREATE POLICY "Workshops can insert structural changes" ON public.structural_changes FOR INSERT WITH CHECK (true);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see transfers" ON public.transfers FOR SELECT USING (true);
CREATE POLICY "Users can insert transfers" ON public.transfers FOR INSERT WITH CHECK (true);

ALTER TABLE public.unregistered_deposit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public deposit read" ON public.unregistered_deposit FOR SELECT USING (true);
CREATE POLICY "Users can insert deposit" ON public.unregistered_deposit FOR INSERT WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
