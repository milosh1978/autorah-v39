-- Create vehicle_claims table
CREATE TABLE IF NOT EXISTS vehicle_claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  claimant_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  evidence_urls TEXT[], -- Array of strings for photo URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ownership_history table
CREATE TABLE IF NOT EXISTS ownership_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id),
  previous_owner_id UUID REFERENCES users(id),
  new_owner_id UUID REFERENCES users(id),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transfer_type TEXT, -- 'sale', 'claim', 'initial'
  notes TEXT
);

-- Enable RLS for security (basic policies)
ALTER TABLE vehicle_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_history ENABLE ROW LEVEL SECURITY;

-- Policies for vehicle_claims
CREATE POLICY "Users can view their own claims" ON vehicle_claims
  FOR SELECT USING (auth.uid() = claimant_user_id);

CREATE POLICY "Users can create claims" ON vehicle_claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_user_id);

-- Policies for ownership_history
CREATE POLICY "Users can view history of their vehicles" ON ownership_history
  FOR SELECT USING (
    auth.uid() = previous_owner_id OR 
    auth.uid() = new_owner_id OR
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND current_owner_id = auth.uid())
  );
