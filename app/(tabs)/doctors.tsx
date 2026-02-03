import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, XCircle } from 'lucide-react-native';

type Doctor = {
  id: string;
  specialization: string;
  is_available: boolean;
  years_of_experience: number;
  bio: string | null;
  profiles: {
    full_name: string;
  };
};

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuth();

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, profiles(full_name)')
      .order('is_available', { ascending: false });

    if (data && !error) {
      setDoctors(data as Doctor[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDoctors();

    const channel = supabase
      .channel('doctors_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
        },
        () => {
          fetchDoctors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.profiles.full_name}</Text>
          <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
          <Text style={styles.doctorExperience}>{item.years_of_experience} years of experience</Text>
        </View>
        <View style={[styles.statusBadge, item.is_available ? styles.statusAvailable : styles.statusUnavailable]}>
          {item.is_available ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.statusText, item.is_available ? styles.statusTextAvailable : styles.statusTextUnavailable]}>
            {item.is_available ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
      {item.bio && <Text style={styles.doctorBio}>{item.bio}</Text>}
    </View>
  );

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
        <Text style={styles.title}>Available Doctors</Text>
        <Text style={styles.subtitle}>Find medical professionals ready to help</Text>
      </View>

      <FlatList
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No doctors registered yet</Text>
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
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 4,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
  },
  doctorBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusAvailable: {
    backgroundColor: '#d1fae5',
  },
  statusUnavailable: {
    backgroundColor: '#fee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#10b981',
  },
  statusTextUnavailable: {
    color: '#ef4444',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
