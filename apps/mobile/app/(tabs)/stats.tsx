import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../../src/context/AppContext';
import { database } from '../../src/database/db';
import { enrichGoalWithProgress, type GoalWithProgress } from '@cybo-track/shared-core';

export default function Stats() {
  const { user } = useApp();
  const [stats, setStats] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    longestStreak: 0,
    totalProgress: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    const allGoals = await database.getAllGoals(user.id);
    const today = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      allGoals.map(async (goal) => {
        const progress = await database.getProgressForGoal(goal.id);
        return enrichGoalWithProgress(goal, progress);
      })
    );

    const activeGoals = enriched.filter(
      (g) =>
        new Date(g.start_date) <= new Date(today) &&
        new Date(g.end_date) >= new Date(today)
    );

    const completedGoals = enriched.filter((g) => g.completion_percentage >= 100);
    const longestStreak = Math.max(...enriched.map((g) => g.current_streak), 0);
    const totalProgress = enriched.reduce((sum, g) => sum + g.total_progress, 0);

    setStats({
      totalGoals: allGoals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      longestStreak,
      totalProgress,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Statistics</Text>
        <Text style={styles.subtitle}>Track your progress over time</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.primaryValue}>{stats.totalGoals}</Text>
          <Text style={styles.primaryLabel}>Total Goals</Text>
        </View>

        <View style={[styles.statCard, styles.successCard]}>
          <Text style={styles.successValue}>{stats.completedGoals}</Text>
          <Text style={styles.successLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.warningValue}>{stats.activeGoals}</Text>
          <Text style={styles.warningLabel}>Active Goals</Text>
        </View>

        <View style={[styles.statCard, styles.dangerCard]}>
          <Text style={styles.dangerValue}>{stats.longestStreak}</Text>
          <Text style={styles.dangerLabel}>Longest Streak</Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Total Progress</Text>
        <Text style={styles.progressValue}>{stats.totalProgress.toFixed(0)}</Text>
        <Text style={styles.progressLabel}>units completed across all goals</Text>
      </View>

      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>Insights</Text>
        <View style={styles.insight}>
          <Text style={styles.insightEmoji}>🎯</Text>
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Completion Rate</Text>
            <Text style={styles.insightValue}>
              {stats.totalGoals > 0
                ? ((stats.completedGoals / stats.totalGoals) * 100).toFixed(0)
                : 0}
              % of your goals completed
            </Text>
          </View>
        </View>

        <View style={styles.insight}>
          <Text style={styles.insightEmoji}>🔥</Text>
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Consistency</Text>
            <Text style={styles.insightValue}>
              {stats.longestStreak > 0
                ? `Your longest streak is ${stats.longestStreak} days!`
                : 'Start tracking to build a streak'}
            </Text>
          </View>
        </View>

        <View style={styles.insight}>
          <Text style={styles.insightEmoji}>⚡</Text>
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Activity</Text>
            <Text style={styles.insightValue}>
              {stats.activeGoals > 0
                ? `You have ${stats.activeGoals} active goal${stats.activeGoals > 1 ? 's' : ''}`
                : 'No active goals. Create one to get started!'}
            </Text>
          </View>
        </View>
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
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: '#6366f1',
  },
  successCard: {
    backgroundColor: '#10b981',
  },
  warningCard: {
    backgroundColor: '#f59e0b',
  },
  dangerCard: {
    backgroundColor: '#ef4444',
  },
  primaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  primaryLabel: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  successValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  successLabel: {
    fontSize: 14,
    color: '#d1fae5',
  },
  warningValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  warningLabel: {
    fontSize: 14,
    color: '#fef3c7',
  },
  dangerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dangerLabel: {
    fontSize: 14,
    color: '#fee2e2',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  insightsCard: {
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
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    color: '#6b7280',
  },
});

