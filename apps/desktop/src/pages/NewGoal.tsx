import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../services/database';
import { v4 as uuidv4 } from 'uuid';
import type { Goal } from '@cybo-track/shared-core';
import '../styles/NewGoal.css';

export default function NewGoal() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetUnits, setTargetUnits] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !description || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const goal: Goal = {
        id: uuidv4(),
        user_id: user.id,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        target_units: targetUnits ? parseInt(targetUnits) : undefined,
        created_at: now,
        updated_at: now,
        deleted: false,
      };

      await db.createGoal(goal);
      await db.queueSync({
        id: 0,
        entity_type: 'goal',
        entity_id: goal.id,
        operation: 'create',
        status: 'pending',
      });

      alert('Goal created successfully');
      navigate('/goals');
    } catch (error) {
      alert('Failed to create goal');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-goal">
      <h1>Create New Goal</h1>

      <form onSubmit={handleCreate}>
        <div className="form-group">
          <label>
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter goal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>
            Description <span className="required">*</span>
          </label>
          <textarea
            placeholder="Describe your goal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Start Date <span className="required">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              End Date <span className="required">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Target Units (Optional)</label>
          <input
            type="number"
            placeholder="e.g., 100 hours"
            value={targetUnits}
            onChange={(e) => setTargetUnits(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </form>
    </div>
  );
}

