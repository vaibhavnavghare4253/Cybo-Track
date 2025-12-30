import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { database } from '../../src/database/db';
import { syncService } from '../../src/services/syncService';
import {
  enrichGoalWithProgress,
  getTodayDateString,
  type GoalWithProgress,
} from '@cybo-track/shared-core';

export default function Home() {
  const { user } = useApp();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const allGoals = await database.getAllGoals(user.id);
    const today = getTodayDateString();

    // Enrich goals with progress data
    const enriched = await Promise.all(
      allGoals.map(async (goal) => {
        const progress = await database.getProgressForGoal(goal.id);
        return enrichGoalWithProgress(goal, progress);
      })
    );

    // Filter active goals (within date range)
    const activeGoals = enriched.filter(
      (g) =>
        new Date(g.start_date) <= new Date(today) &&
        new Date(g.end_date) >= new Date(today)
    );

    setGoals(activeGoals);
  };

  const handleSync = async () => {
    if (!user || syncing) return;

    setSyncing(true);
    await syncService.sync(user.id);
    await loadGoals();
    setSyncing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSync();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello! 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{goals.length}</Text>
          <Text style={styles.statLabel}>Active Goals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {goals.filter(g => g.completion_percentage >= 100).length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.max(...goals.map(g => g.current_streak), 0)}
          </Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Goals</Text>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No active goals</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/goal/new')}
            >
              <Text style={styles.addButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              onPress={() => router.push(`/goal/${goal.id}`)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalStreak}>🔥 {goal.current_streak}</Text>
              </View>
              <Text style={styles.goalDescription} numberOfLines={2}>
                {goal.description}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(goal.completion_percentage, 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.goalFooter}>
                <Text style={styles.progressText}>
                  {goal.completion_percentage.toFixed(0)}% Complete
                </Text>
                <Text style={styles.daysText}>
                  {goal.days_remaining} days left
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={handleSync}
        disabled={syncing}
      >
        <Text style={styles.syncButtonText}>
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  goalStreak: {
    fontSize: 16,
    color: '#f59e0b',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  daysText: {
    fontSize: 12,
    color: '#6b7280',
  },
  syncButton: {
    backgroundColor: '#10b981',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

