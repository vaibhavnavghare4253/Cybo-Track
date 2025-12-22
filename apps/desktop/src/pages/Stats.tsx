import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as db from '../services/database';
import { enrichGoalWithProgress } from '@cybo-track/shared-core';
import '../styles/Stats.css';

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

    const allGoals = await db.getAllGoals(user.id);
    const today = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      allGoals.map(async (goal) => {
        const progress = await db.getProgressForGoal(goal.id);
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
    <div className="stats-page">
      <h1>Your Statistics</h1>
      <p className="subtitle">Track your progress over time</p>

      <div className="stats-cards">
        <div className="stat-card primary">
          <div className="stat-value">{stats.totalGoals}</div>
          <div className="stat-label">Total Goals</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.completedGoals}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.activeGoals}</div>
          <div className="stat-label">Active Goals</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.longestStreak}</div>
          <div className="stat-label">Longest Streak</div>
        </div>
      </div>

      <div className="progress-card">
        <h2>Total Progress</h2>
        <div className="big-number">{stats.totalProgress.toFixed(0)}</div>
        <p>units completed across all goals</p>
      </div>

      <div className="insights-card">
        <h2>Insights</h2>
        <div className="insight">
          <span className="insight-emoji">🎯</span>
          <div className="insight-text">
            <h3>Completion Rate</h3>
            <p>
              {stats.totalGoals > 0
                ? ((stats.completedGoals / stats.totalGoals) * 100).toFixed(0)
                : 0}
              % of your goals completed
            </p>
          </div>
        </div>
        <div className="insight">
          <span className="insight-emoji">🔥</span>
          <div className="insight-text">
            <h3>Consistency</h3>
            <p>
              {stats.longestStreak > 0
                ? `Your longest streak is ${stats.longestStreak} days!`
                : 'Start tracking to build a streak'}
            </p>
          </div>
        </div>
        <div className="insight">
          <span className="insight-emoji">⚡</span>
          <div className="insight-text">
            <h3>Activity</h3>
            <p>
              {stats.activeGoals > 0
                ? `You have ${stats.activeGoals} active goal${stats.activeGoals > 1 ? 's' : ''}`
                : 'No active goals. Create one to get started!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

