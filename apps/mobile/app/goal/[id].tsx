import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from '../../src/database/db';
import {
  enrichGoalWithProgress,
  getTodayDateString,
  type GoalWithProgress,
  type DailyProgress,
} from '@cybo-track/shared-core';
import { v4 as uuidv4 } from 'uuid';

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<GoalWithProgress | null>(null);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [todayValue, setTodayValue] = useState('');
  const [todayNote, setTodayNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoalData();
  }, [id]);

  const loadGoalData = async () => {
    if (!id) return;

    try {
      const goalData = await database.getGoal(id);
      if (!goalData) {
        Alert.alert('Error', 'Goal not found');
        router.back();
        return;
      }

      const progressData = await database.getProgressForGoal(id);
      const enriched = enrichGoalWithProgress(goalData, progressData);

      setGoal(enriched);
      setProgress(progressData);

      // Check if there's progress for today
      const today = getTodayDateString();
      const todayData = await database.getProgressForDate(id, today);
      if (todayData) {
        setTodayProgress(todayData);
        setTodayValue(todayData.value.toString());
        setTodayNote(todayData.note);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      Alert.alert('Error', 'Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!goal || !todayValue) {
      Alert.alert('Error', 'Please enter a progress value');
      return;
    }

    try {
      const today = getTodayDateString();
      const now = new Date().toISOString();
      const value = parseFloat(todayValue);

      if (isNaN(value)) {
        Alert.alert('Error', 'Please enter a valid number');
        return;
      }

      if (todayProgress) {
        // Update existing progress
        const updated: DailyProgress = {
          ...todayProgress,
          value,
          note: todayNote,
          updated_at: now,
        };
        await database.updateProgress(updated);
        await database.queueSync({
          id: 0,
          entity_type: 'daily_progress',
          entity_id: updated.id,
          operation: 'update',
          status: 'pending',
        });
      } else {
        // Create new progress
        const newProgress: DailyProgress = {
          id: uuidv4(),
          goal_id: goal.id,
          date: today,
          value,
          note: todayNote,
          created_at: now,
          updated_at: now,
          deleted: false,
        };
        await database.createProgress(newProgress);
        await database.queueSync({
          id: 0,
          entity_type: 'daily_progress',
          entity_id: newProgress.id,
          operation: 'create',
          status: 'pending',
        });
      }

      Alert.alert('Success', 'Progress saved!');
      loadGoalData();
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.description}>{goal.description}</Text>
        <View style={styles.dates}>
          <Text style={styles.dateText}>
            {new Date(goal.start_date).toLocaleDateString()} -{' '}
            {new Date(goal.end_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {goal.completion_percentage.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{goal.current_streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{goal.days_remaining}</Text>
          <Text style={styles.statLabel}>Days Left</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Today's Progress</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter progress value"
          value={todayValue}
          onChangeText={setTodayValue}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add a note (optional)"
          value={todayNote}
          onChangeText={setTodayNote}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveProgress}>
          <Text style={styles.buttonText}>
            {todayProgress ? 'Update Progress' : 'Save Progress'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Progress History</Text>
        {progress.length === 0 ? (
          <Text style={styles.emptyText}>No progress recorded yet</Text>
        ) : (
          progress
            .filter((p) => !p.deleted)
            .map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyValue}>{item.value}</Text>
                </View>
                {item.note && <Text style={styles.historyNote}>{item.note}</Text>}
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  dates: {
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 24,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#111827',
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
  },
  historyNote: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

