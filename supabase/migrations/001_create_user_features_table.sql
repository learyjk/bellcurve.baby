-- Create user_features table for feature flags
CREATE TABLE user_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  
  -- Ensure a user can only have one entry per feature
  UNIQUE(user_id, feature)
);

-- Create indexes for better performance
CREATE INDEX idx_user_features_user_id ON user_features(user_id);
CREATE INDEX idx_user_features_feature ON user_features(feature);

-- Enable RLS (Row Level Security)
ALTER TABLE user_features ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own features
CREATE POLICY "Users can view own features" ON user_features
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy: no one can insert/update/delete directly (only through admin functions)
CREATE POLICY "No direct modifications" ON user_features
  FOR ALL USING (false);
