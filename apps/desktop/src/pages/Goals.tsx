import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../services/database';
import { enrichGoalWithProgress, type GoalWithProgress } from '@cybo-track/shared-core';
import '../styles/Goals.css';

export default function Goals() {
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
    
    const enriched = await Promise.all(
      allGoals.map(async (goal) => {
        const progress = await db.getProgressForGoal(goal.id);
        return enrichGoalWithProgress(goal, progress);
      })
    );

    setGoals(enriched);
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1>Your Goals</h1>
        <button className="btn-primary" onClick={() => navigate('/goal/new')}>
          + New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
          <p>No goals yet</p>
          <p className="subtext">Create your first goal to get started!</p>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="goal-item"
              onClick={() => navigate(`/goal/${goal.id}`)}
            >
              <div className="goal-main">
                <div className="goal-info">
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                  <div className="goal-dates">
                    {new Date(goal.start_date).toLocaleDateString()} -{' '}
                    {new Date(goal.end_date).toLocaleDateString()}
                  </div>
                </div>
                {goal.completion_percentage >= 100 && (
                  <div className="completed-badge">✓ Done</div>
                )}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(goal.completion_percentage, 100)}%` }}
                />
              </div>
              <div className="goal-stats">
                <span>{goal.completion_percentage.toFixed(0)}% Complete</span>
                <span>🔥 {goal.current_streak} day streak</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

