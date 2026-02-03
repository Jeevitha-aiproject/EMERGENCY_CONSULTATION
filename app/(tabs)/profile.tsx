import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Phone, Stethoscope, Award, FileText, LogOut } from 'lucide-react-native';

type DoctorProfile = {
  specialization: string;
  license_number: string;
  is_available: boolean;
  years_of_experience: number;
  bio: string;
};

export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>({
    specialization: '',
    license_number: '',
    is_available: false,
    years_of_experience: 0,
    bio: '',
  });

  const isDoctor = profile?.user_type === 'doctor';

  useEffect(() => {
    if (isDoctor) {
      fetchDoctorProfile();
    }
  }, [isDoctor]);

  const fetchDoctorProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', profile?.id)
      .maybeSingle();

    if (data && !error) {
      setDoctorProfile({
        specialization: data.specialization || '',
        license_number: data.license_number || '',
        is_available: data.is_available || false,
        years_of_experience: data.years_of_experience || 0,
        bio: data.bio || '',
      });
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
      })
      .eq('id', profile?.id);

    if (profileError) {
      Alert.alert('Error', 'Failed to update profile');
      setSaving(false);
      return;
    }

    if (isDoctor) {
      const { data: existingDoctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', profile?.id)
        .maybeSingle();

      if (existingDoctor) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .update(doctorProfile)
          .eq('id', profile?.id);

        if (doctorError) {
          Alert.alert('Error', 'Failed to update doctor profile');
          setSaving(false);
          return;
        }
      } else {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: profile?.id!,
            ...doctorProfile,
          });

        if (doctorError) {
          Alert.alert('Error', 'Failed to create doctor profile: ' + doctorError.message);
          setSaving(false);
          return;
        }
      }
    }

    await refreshProfile();
    setSaving(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleToggleAvailability = (value: boolean) => {
    setDoctorProfile({ ...doctorProfile, is_available: value });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color="#fff" />
        </View>
        <Text style={styles.title}>{profile?.full_name}</Text>
        <Text style={styles.subtitle}>{profile?.user_type === 'doctor' ? 'Doctor' : 'Patient'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {isDoctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor Information</Text>

            <View style={styles.availabilityContainer}>
              <Text style={styles.availabilityLabel}>Available for Consultations</Text>
              <Switch
                value={doctorProfile.is_available}
                onValueChange={handleToggleAvailability}
                trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
                thumbColor={doctorProfile.is_available ? '#dc2626' : '#f3f4f6'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialization</Text>
              <TextInput
                style={styles.input}
                value={doctorProfile.specialization}
                onChangeText={(text) => setDoctorProfile({ ...doctorProfile, specialization: text })}
                placeholder="e.g., General Practitioner, Cardiologist"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number</Text>
              <TextInput
                style={styles.input}
                value={doctorProfile.license_number}
                onChangeText={(text) => setDoctorProfile({ ...doctorProfile, license_number: text })}
                placeholder="Enter your medical license number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                value={doctorProfile.years_of_experience.toString()}
                onChangeText={(text) => setDoctorProfile({ ...doctorProfile, years_of_experience: parseInt(text) || 0 })}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={doctorProfile.bio}
                onChangeText={(text) => setDoctorProfile({ ...doctorProfile, bio: text })}
                placeholder="Tell patients about yourself..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#991b1b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fca5a5',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#fee',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee',
  },
  signOutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
