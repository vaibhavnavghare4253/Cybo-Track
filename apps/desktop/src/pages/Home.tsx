import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../services/database';
import { enrichGoalWithProgress, getTodayDateString, type GoalWithProgress } from '@cybo-track/shared-core';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import '../styles/Home.css';

const COLORS = { done: '#6ee7b7', target: '#d1d5db' };

const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill={name === 'Done' ? '#065f46' : '#6b7280'} textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, [user]);

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
    const active = enriched.filter(
      (g) => new Date(g.start_date) <= new Date(today) && new Date(g.end_date) >= new Date(today)
    );
    setGoals(active);
    setLoading(false);
  };

  // --- chart data ---
  const totalTarget = goals.reduce((s, g) => s + (g.target_units ?? 100), 0) || 100;
  const totalDone = goals.reduce((s, g) => s + ((g.target_units ?? 100) * g.completion_percentage) / 100, 0);
  const dailyDonePercent = Math.min((totalDone / totalTarget) * 100, 100);

  const completedGoals = goals.filter((g) => g.completion_percentage >= 100).length;
  const weeklyDonePercent = goals.length ? Math.min((completedGoals / goals.length) * 100, 100) : 0;

  const dailyPie = [
    { name: 'Done', value: parseFloat(dailyDonePercent.toFixed(1)) },
    { name: 'Target', value: parseFloat((100 - dailyDonePercent).toFixed(1)) },
  ];
  const weeklyPie = [
    { name: 'Done', value: parseFloat(weeklyDonePercent.toFixed(1)) },
    { name: 'Target', value: parseFloat((100 - weeklyDonePercent).toFixed(1)) },
  ];

  const barData = goals.map((g) => ({
    name: g.title.length > 16 ? g.title.slice(0, 16) + '…' : g.title,
    Target: g.target_units ?? 100,
    Done: Math.round(((g.target_units ?? 100) * g.completion_percentage) / 100),
  }));

  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      {/* Header */}
      <div className="dash-header">
        <h1>{month} Personal Goals Tracker</h1>
        <button className="btn-primary" onClick={() => navigate('/goal/new')}>+ New Goal</button>
      </div>

      {/* Top row: donuts + bar chart */}
      <div className="dash-top">
        {/* Daily donut */}
        <div className="dash-card donut-card">
          <h3>Daily Progress</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={dailyPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" labelLine={false} label={DonutLabel}>
                <Cell fill={COLORS.done} />
                <Cell fill={COLORS.target} />
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-legend">
            <span><span className="dot done" />Done {dailyDonePercent.toFixed(1)}%</span>
            <span><span className="dot target" />Target {(100 - dailyDonePercent).toFixed(1)}%</span>
          </div>
        </div>

        {/* Weekly donut */}
        <div className="dash-card donut-card">
          <h3>Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={weeklyPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" labelLine={false} label={DonutLabel}>
                <Cell fill={COLORS.done} />
                <Cell fill={COLORS.target} />
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-legend">
            <span><span className="dot done" />Done {weeklyDonePercent.toFixed(1)}%</span>
            <span><span className="dot target" />Target {(100 - weeklyDonePercent).toFixed(1)}%</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="dash-card bar-card">
          <h3>Daily Goals</h3>
          {barData.length === 0 ? (
            <div className="empty-chart">No goals yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Target" fill={COLORS.target} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Done" fill={COLORS.done} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Goals table */}
      <div className="dash-card table-card">
        <table className="goals-table">
          <thead>
            <tr>
              <th>Daily Goals</th>
              <th>Progress</th>
              <th>Goal Target</th>
              <th>Streak 🔥</th>
              <th>Days Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">No active goals — <span className="link" onClick={() => navigate('/goal/new')}>create one</span></td></tr>
            ) : (
              goals.map((g) => (
                <tr key={g.id} onClick={() => navigate(`/goal/${g.id}`)} className="table-row">
                  <td>{g.title}</td>
                  <td>
                    <div className="table-progress-wrap">
                      <div className="table-progress-bar">
                        <div className="table-progress-fill" style={{ width: `${Math.min(g.completion_percentage, 100)}%` }} />
                      </div>
                      <span>{g.completion_percentage.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>{g.target_units ?? '—'}</td>
                  <td>{g.current_streak}</td>
                  <td>{g.days_remaining}</td>
                  <td>
                    <span className={`badge ${g.completion_percentage >= 100 ? 'badge-done' : 'badge-active'}`}>
                      {g.completion_percentage >= 100 ? 'Done' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
