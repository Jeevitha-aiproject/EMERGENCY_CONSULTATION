/*
  # Emergency Medical App Schema

  ## Overview
  Creates the complete database schema for an emergency medical consultation app
  that connects patients with doctors for after-hours consultations.

  ## New Tables

  ### `profiles`
  Extends auth.users with additional user information
  - `id` (uuid, primary key) - References auth.users
  - `user_type` (text) - Either 'patient' or 'doctor'
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `doctors`
  Stores doctor-specific information
  - `id` (uuid, primary key) - References profiles.id
  - `specialization` (text) - Medical specialization
  - `license_number` (text) - Medical license number
  - `is_available` (boolean) - Current availability status
  - `years_of_experience` (integer) - Years of medical practice
  - `bio` (text) - Doctor biography/description
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `consultations`
  Tracks consultation requests and sessions
  - `id` (uuid, primary key)
  - `patient_id` (uuid) - References profiles.id
  - `doctor_id` (uuid) - References doctors.id (nullable until assigned)
  - `status` (text) - 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'
  - `urgency_level` (text) - 'low', 'medium', 'high', 'critical'
  - `symptoms` (text) - Patient's described symptoms
  - `notes` (text) - Doctor's notes (nullable)
  - `scheduled_at` (timestamptz) - When consultation is scheduled
  - `started_at` (timestamptz) - When consultation started
  - `completed_at` (timestamptz) - When consultation completed
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enables RLS on all tables
  - Patients can view and update their own profile
  - Doctors can view and update their own profile and doctor info
  - Patients can create consultations and view their own consultations
  - Doctors can view all pending consultations and their assigned consultations
  - Doctors can update consultations assigned to them
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('patient', 'doctor')),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialization text NOT NULL,
  license_number text NOT NULL UNIQUE,
  is_available boolean DEFAULT false,
  years_of_experience integer DEFAULT 0,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  urgency_level text NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  symptoms text NOT NULL,
  notes text,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for doctors table

CREATE POLICY "Anyone can view doctor profiles"
  ON doctors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can insert own profile"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'doctor')
  );

CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for consultations table

CREATE POLICY "Patients can view own consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid() OR
    doctor_id IN (SELECT id FROM doctors WHERE id = auth.uid())
  );

CREATE POLICY "Patients can create consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'patient')
  );

CREATE POLICY "Patients can update own consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can update assigned consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE id = auth.uid()) OR
    (doctor_id IS NULL AND EXISTS (SELECT 1 FROM doctors WHERE id = auth.uid()))
  )
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE id = auth.uid())
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_doctors_is_available ON doctors(is_available);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_doctors_updated_at') THEN
    CREATE TRIGGER update_doctors_updated_at
      BEFORE UPDATE ON doctors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_consultations_updated_at') THEN
    CREATE TRIGGER update_consultations_updated_at
      BEFORE UPDATE ON consultations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;