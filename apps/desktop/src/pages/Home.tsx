import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../services/database';
import { enrichGoalWithProgress, getTodayDateString, type GoalWithProgress } from '@cybo-track/shared-core';
import '../styles/Home.css';

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const allGoals = await db.getAllGoals(user.id);
    const today = getTodayDateString();

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

    setGoals(activeGoals);
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home">
      <div className="header">
        <h1>Hello! 👋</h1>
        <p className="date">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{goals.length}</div>
          <div className="stat-label">Active Goals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {goals.filter((g) => g.completion_percentage >= 100).length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {Math.max(...goals.map((g) => g.current_streak), 0)}
          </div>
          <div className="stat-label">Best Streak</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Today's Goals</h2>
          <button className="btn-primary" onClick={() => navigate('/goal/new')}>
            + New Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="empty-state">
            <p>No active goals</p>
            <button className="btn-primary" onClick={() => navigate('/goal/new')}>
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="goal-card"
                onClick={() => navigate(`/goal/${goal.id}`)}
              >
                <div className="goal-header">
                  <h3>{goal.title}</h3>
                  <span className="streak">🔥 {goal.current_streak}</span>
                </div>
                <p className="goal-description">{goal.description}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(goal.completion_percentage, 100)}%` }}
                  />
                </div>
                <div className="goal-footer">
                  <span>{goal.completion_percentage.toFixed(0)}% Complete</span>
                  <span>{goal.days_remaining} days left</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

