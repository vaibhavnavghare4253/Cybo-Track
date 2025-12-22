import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { database } from '../../src/database/db';
import { enrichGoalWithProgress, type GoalWithProgress } from '@cybo-track/shared-core';

export default function Goals() {
  const { user } = useApp();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const allGoals = await database.getAllGoals(user.id);
    
    const enriched = await Promise.all(
      allGoals.map(async (goal) => {
        const progress = await database.getProgressForGoal(goal.id);
        return enrichGoalWithProgress(goal, progress);
      })
    );

    setGoals(enriched);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const renderGoal = ({ item }: { item: GoalWithProgress }) => (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => router.push(`/goal/${item.id}`)}
    >
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{item.title}</Text>
        {item.completion_percentage >= 100 && (
          <Text style={styles.completedBadge}>✓ Done</Text>
        )}
      </View>
      <Text style={styles.goalDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.goalMeta}>
        <Text style={styles.metaText}>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(item.completion_percentage, 100)}%` },
          ]}
        />
      </View>
      <View style={styles.goalStats}>
        <Text style={styles.statText}>
          {item.completion_percentage.toFixed(0)}% Complete
        </Text>
        <Text style={styles.statText}>
          🔥 {item.current_streak} day streak
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first goal to get started!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/goal/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  list: {
    padding: 16,
  },
  goalCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  completedBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  goalMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
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
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});

