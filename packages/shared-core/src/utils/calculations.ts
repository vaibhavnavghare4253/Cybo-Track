import { Goal, DailyProgress, GoalWithProgress } from '../types';

/**
 * Calculate completion percentage for a goal
 */
export function calculateCompletionPercentage(
  goal: Goal,
  progressEntries: DailyProgress[]
): number {
  if (!goal.target_units || goal.target_units === 0) {
    return 0;
  }

  const totalProgress = progressEntries
    .filter(p => !p.deleted)
    .reduce((sum, p) => sum + p.value, 0);

  return Math.min(100, (totalProgress / goal.target_units) * 100);
}

/**
 * Calculate total progress for a goal
 */
export function calculateTotalProgress(progressEntries: DailyProgress[]): number {
  return progressEntries
    .filter(p => !p.deleted)
    .reduce((sum, p) => sum + p.value, 0);
}

/**
 * Calculate current streak (consecutive days with progress)
 */
export function calculateStreak(progressEntries: DailyProgress[]): number {
  if (progressEntries.length === 0) return 0;

  // Sort by date descending
  const sorted = [...progressEntries]
    .filter(p => !p.deleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak) {
      streak++;
      currentDate = entryDate;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}

/**
 * Calculate days remaining until goal end date
 */
export function calculateDaysRemaining(goal: Goal): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(goal.end_date);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if a goal is active (not deleted and within date range)
 */
export function isGoalActive(goal: Goal): boolean {
  if (goal.deleted) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(goal.start_date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(goal.end_date);
  endDate.setHours(0, 0, 0, 0);

  return today >= startDate && today <= endDate;
}

/**
 * Enrich a goal with calculated progress data
 */
export function enrichGoalWithProgress(
  goal: Goal,
  progressEntries: DailyProgress[]
): GoalWithProgress {
  const total_progress = calculateTotalProgress(progressEntries);
  const completion_percentage = calculateCompletionPercentage(goal, progressEntries);
  const current_streak = calculateStreak(progressEntries);
  const days_remaining = calculateDaysRemaining(goal);

  return {
    ...goal,
    total_progress,
    completion_percentage,
    current_streak,
    days_remaining,
  };
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

