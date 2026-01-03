-- Create vehicle_certificates table
CREATE TABLE IF NOT EXISTS public.vehicle_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) NOT NULL,
  issued_by_workshop_id UUID REFERENCES public.profiles(id) NOT NULL,
  certificate_type TEXT NOT NULL, -- 'basic', 'full', 'premium'
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  qr_public_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'revoked', 'expired'
  checklist JSONB,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vehicle_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Certificates are viewable by everyone" 
ON public.vehicle_certificates FOR SELECT 
USING (true);

CREATE POLICY "Workshops can create certificates" 
ON public.vehicle_certificates FOR INSERT 
WITH CHECK (auth.uid() = issued_by_workshop_id);

-- Add storage bucket for certificates if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access Certificates" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Workshops Upload Certificates" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');