import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

type Consultation = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string;
  notes: string | null;
  created_at: string;
  patient?: {
    full_name: string;
  };
  doctor?: {
    profiles: {
      full_name: string;
    };
  } | null;
};

export default function ConsultationsScreen() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();

  const isDoctor = profile?.user_type === 'doctor';

  const fetchConsultations = async () => {
    let query = supabase.from('consultations').select(`
      *,
      patient:profiles!consultations_patient_id_fkey(full_name),
      doctor:doctors!consultations_doctor_id_fkey(profiles(full_name))
    `);

    if (isDoctor) {
      query = query.or(`doctor_id.eq.${profile?.id},status.eq.pending`);
    } else {
      query = query.eq('patient_id', profile?.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (data && !error) {
      setConsultations(data as Consultation[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchConsultations();

    const channel = supabase
      .channel('consultations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultations',
        },
        () => {
          fetchConsultations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const handleAcceptConsultation = async (consultationId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({
        doctor_id: profile?.id,
        status: 'assigned',
      })
      .eq('id', consultationId);

    if (error) {
      Alert.alert('Error', 'Failed to accept consultation');
    } else {
      Alert.alert('Success', 'Consultation accepted');
      fetchConsultations();
    }
  };

  const handleStartConsultation = async (consultationId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', consultationId);

    if (error) {
      Alert.alert('Error', 'Failed to start consultation');
    } else {
      fetchConsultations();
    }
  };

  const handleCompleteConsultation = async (consultationId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', consultationId);

    if (error) {
      Alert.alert('Error', 'Failed to complete consultation');
    } else {
      Alert.alert('Success', 'Consultation completed');
      fetchConsultations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'assigned':
        return '#3b82f6';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      case 'critical':
        return '#991b1b';
      default:
        return '#9ca3af';
    }
  };

  const renderConsultation = ({ item }: { item: Consultation }) => {
    const isPending = item.status === 'pending' && isDoctor && !item.doctor_id;
    const isAssigned = item.status === 'assigned' && isDoctor && item.doctor_id === profile?.id;
    const isInProgress = item.status === 'in_progress' && isDoctor && item.doctor_id === profile?.id;

    return (
      <View style={styles.consultationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                {item.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getUrgencyColor(item.urgency_level) + '20' }]}>
              <Text style={[styles.badgeText, { color: getUrgencyColor(item.urgency_level) }]}>
                {item.urgency_level.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {isDoctor && item.patient && (
          <Text style={styles.patientName}>Patient: {item.patient.full_name}</Text>
        )}

        {!isDoctor && item.doctor?.profiles && (
          <Text style={styles.doctorName}>Doctor: {item.doctor.profiles.full_name}</Text>
        )}

        <Text style={styles.symptomsLabel}>Symptoms:</Text>
        <Text style={styles.symptomsText}>{item.symptoms}</Text>

        {item.notes && (
          <>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </>
        )}

        {isPending && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptConsultation(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept Consultation</Text>
          </TouchableOpacity>
        )}

        {isAssigned && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartConsultation(item.id)}
          >
            <Text style={styles.startButtonText}>Start Consultation</Text>
          </TouchableOpacity>
        )}

        {isInProgress && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteConsultation(item.id)}
          >
            <Text style={styles.completeButtonText}>Complete Consultation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isDoctor ? 'Manage Consultations' : 'My Consultations'}
        </Text>
        <Text style={styles.subtitle}>
          {isDoctor ? 'Accept and manage patient requests' : 'Track your consultation history'}
        </Text>
      </View>

      <FlatList
        data={consultations}
        renderItem={renderConsultation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {isDoctor ? 'No consultations available' : 'No consultations yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isDoctor
                ? 'Pending requests will appear here'
                : 'Request a consultation from the Home tab'}
            </Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  symptomsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  symptomsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
