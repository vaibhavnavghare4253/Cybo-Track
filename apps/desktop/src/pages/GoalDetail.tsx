import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as db from '../services/database';
import {
  enrichGoalWithProgress,
  getTodayDateString,
  type GoalWithProgress,
  type DailyProgress,
} from '@cybo-track/shared-core';
import { v4 as uuidv4 } from 'uuid';
import '../styles/GoalDetail.css';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      const goalData = await db.getGoal(id);
      if (!goalData) {
        alert('Goal not found');
        navigate('/goals');
        return;
      }

      const progressData = await db.getProgressForGoal(id);
      const enriched = enrichGoalWithProgress(goalData, progressData);

      setGoal(enriched);
      setProgress(progressData);

      const today = getTodayDateString();
      const todayData = await db.getProgressForDate(id, today);
      if (todayData) {
        setTodayProgress(todayData);
        setTodayValue(todayData.value.toString());
        setTodayNote(todayData.note);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      alert('Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!goal || !todayValue) {
      alert('Please enter a progress value');
      return;
    }

    try {
      const today = getTodayDateString();
      const now = new Date().toISOString();
      const value = parseFloat(todayValue);

      if (isNaN(value)) {
        alert('Please enter a valid number');
        return;
      }

      if (todayProgress) {
        const updated: DailyProgress = {
          ...todayProgress,
          value,
          note: todayNote,
          updated_at: now,
        };
        await db.updateProgress(updated);
        await db.queueSync({
          id: 0,
          entity_type: 'daily_progress',
          entity_id: updated.id,
          operation: 'update',
          status: 'pending',
        });
      } else {
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
        await db.createProgress(newProgress);
        await db.queueSync({
          id: 0,
          entity_type: 'daily_progress',
          entity_id: newProgress.id,
          operation: 'create',
          status: 'pending',
        });
      }

      alert('Progress saved!');
      loadGoalData();
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!goal) {
    return <div>Goal not found</div>;
  }

  return (
    <div className="goal-detail">
      <div className="goal-header">
        <div>
          <h1>{goal.title}</h1>
          <p className="description">{goal.description}</p>
          <p className="dates">
            {new Date(goal.start_date).toLocaleDateString()} -{' '}
            {new Date(goal.end_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">{goal.completion_percentage.toFixed(0)}%</div>
          <div className="stat-label">Complete</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{goal.current_streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{goal.days_remaining}</div>
          <div className="stat-label">Days Left</div>
        </div>
      </div>

      <div className="progress-section">
        <h2>Today's Progress</h2>
        <input
          type="number"
          placeholder="Enter progress value"
          value={todayValue}
          onChange={(e) => setTodayValue(e.target.value)}
        />
        <textarea
          placeholder="Add a note (optional)"
          value={todayNote}
          onChange={(e) => setTodayNote(e.target.value)}
          rows={3}
        />
        <button className="btn-primary" onClick={handleSaveProgress}>
          {todayProgress ? 'Update Progress' : 'Save Progress'}
        </button>
      </div>

      <div className="history-section">
        <h2>Progress History</h2>
        {progress.length === 0 ? (
          <p className="empty">No progress recorded yet</p>
        ) : (
          <div className="history-list">
            {progress
              .filter((p) => !p.deleted)
              .map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-header">
                    <span className="history-date">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="history-value">{item.value}</span>
                  </div>
                  {item.note && <p className="history-note">{item.note}</p>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

