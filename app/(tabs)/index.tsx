import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Clock } from 'lucide-react-native';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);

  const isPatient = profile?.user_type === 'patient';

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'critical', label: 'Critical', color: '#991b1b' },
  ] as const;

  const handleRequestConsultation = async () => {
    if (!symptoms.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('consultations')
      .insert({
        patient_id: profile!.id,
        symptoms: symptoms.trim(),
        urgency_level: urgencyLevel,
        status: 'pending',
      });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to request consultation. Please try again.');
    } else {
      Alert.alert('Success', 'Your consultation request has been submitted. A doctor will be assigned shortly.');
      setSymptoms('');
      setUrgencyLevel('medium');
    }
  };

  const currentHour = new Date().getHours();
  const isAfterHours = currentHour < 8 || currentHour >= 20;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Medical Care</Text>
        <Text style={styles.subtitle}>24/7 Online Consultations</Text>
      </View>

      {isAfterHours && (
        <View style={styles.alertContainer}>
          <AlertCircle size={20} color="#dc2626" />
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>Hospitals Closed</Text>
            <Text style={styles.alertText}>Most hospitals are currently unavailable. Use our online consultation service.</Text>
          </View>
        </View>
      )}

      {isPatient ? (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Request Emergency Consultation</Text>
            <Text style={styles.cardSubtitle}>Describe your symptoms and we'll connect you with a doctor</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Urgency Level</Text>
              <View style={styles.urgencyButtons}>
                {urgencyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.urgencyButton,
                      urgencyLevel === level.value && { backgroundColor: level.color },
                    ]}
                    onPress={() => setUrgencyLevel(level.value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.urgencyButtonText,
                        urgencyLevel === level.value && styles.urgencyButtonTextActive,
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Symptoms</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your symptoms in detail..."
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestConsultation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Request Consultation</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Clock size={24} color="#dc2626" />
            <Text style={styles.infoText}>Average response time: 5-10 minutes</Text>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Doctor Dashboard</Text>
            <Text style={styles.cardSubtitle}>Manage your availability and view pending consultations</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Pending Requests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Active Consultations</Text>
              </View>
            </View>

            <Text style={styles.infoText}>View the Consultations tab to see and manage patient requests</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fee',
  },
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: '#fee',
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#991b1b',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  urgencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  urgencyButtonTextActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
