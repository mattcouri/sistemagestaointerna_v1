import React from 'react';

interface TaskDateBadgeProps {
  goalDate?: string;
  limitDate?: string;
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatShortDate(dateStr: string): string {
  const d = parseDateLocal(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export type DateStatus = 'on-track' | 'goal-passed' | 'limit-passed' | 'goal-only' | 'no-date';

function getStatus(today: Date, goalDate?: string, limitDate?: string): {
  status: DateStatus;
  label: string;
  progress: number;
  ringColor: string;
  labelColor: string;
  displayDate: string | null;
} {
  if (!goalDate && !limitDate) {
    return { status: 'no-date', label: '', progress: 0, ringColor: '#475569', labelColor: '#94a3b8', displayDate: null };
  }

  const todayMs = today.getTime();

  if (goalDate && !limitDate) {
    const goal = parseDateLocal(goalDate);
    const daysLeft = daysBetween(today, goal);
    if (daysLeft < 0) {
      return {
        status: 'goal-passed',
        label: `${Math.abs(daysLeft)}d over goal`,
        progress: 1,
        ringColor: '#f97316',
        labelColor: '#fb923c',
        displayDate: formatShortDate(goalDate),
      };
    }
    return {
      status: 'goal-only',
      label: daysLeft === 0 ? 'today' : `${daysLeft}d left`,
      progress: 0.6,
      ringColor: '#22c55e',
      labelColor: '#4ade80',
      displayDate: formatShortDate(goalDate),
    };
  }

  if (!goalDate && limitDate) {
    const limit = parseDateLocal(limitDate);
    const daysLeft = daysBetween(today, limit);
    if (daysLeft < 0) {
      return {
        status: 'limit-passed',
        label: `${Math.abs(daysLeft)}d overdue`,
        progress: 1,
        ringColor: '#ef4444',
        labelColor: '#f87171',
        displayDate: formatShortDate(limitDate),
      };
    }
    if (daysLeft <= 3) {
      return {
        status: 'on-track',
        label: daysLeft === 0 ? 'due today' : `${daysLeft}d to limit`,
        progress: 0.85,
        ringColor: '#ef4444',
        labelColor: '#f87171',
        displayDate: formatShortDate(limitDate),
      };
    }
    return {
      status: 'on-track',
      label: `${daysLeft}d to limit`,
      progress: 0.5,
      ringColor: '#f59e0b',
      labelColor: '#fbbf24',
      displayDate: formatShortDate(limitDate),
    };
  }

  const goal = parseDateLocal(goalDate!);
  const limit = parseDateLocal(limitDate!);
  const totalSpan = daysBetween(goal, limit);
  const daysToGoal = daysBetween(today, goal);
  const daysToLimit = daysBetween(today, limit);

  if (todayMs < goal.getTime()) {
    const totalRange = daysBetween(today, goal);
    const progress = totalRange > 0 ? Math.max(0.05, Math.min(0.5, 1 - totalRange / Math.max(totalSpan * 2, 1))) : 0.5;
    return {
      status: 'on-track',
      label: daysToGoal === 0 ? 'goal today' : `${daysToGoal}d left`,
      progress,
      ringColor: '#22c55e',
      labelColor: '#4ade80',
      displayDate: formatShortDate(goalDate!),
    };
  }

  if (todayMs >= goal.getTime() && todayMs <= limit.getTime()) {
    const elapsed = daysBetween(goal, today);
    const progress = totalSpan > 0 ? Math.min(0.95, 0.5 + (elapsed / totalSpan) * 0.45) : 0.75;
    return {
      status: 'goal-passed',
      label: daysToLimit === 0 ? 'due today' : `${daysToLimit}d to limit`,
      progress,
      ringColor: '#f59e0b',
      labelColor: '#fbbf24',
      displayDate: formatShortDate(limitDate!),
    };
  }

  return {
    status: 'limit-passed',
    label: `${Math.abs(daysToLimit)}d overdue`,
    progress: 1,
    ringColor: '#ef4444',
    labelColor: '#f87171',
    displayDate: formatShortDate(limitDate!),
  };
}

export function TaskDateBadge({ goalDate, limitDate }: TaskDateBadgeProps) {
  if (!goalDate && !limitDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { label, progress, ringColor, labelColor, displayDate } = getStatus(today, goalDate, limitDate);

  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <div className="relative flex items-center justify-center" style={{ width: 18, height: 18 }}>
        <svg width="18" height="18" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="9"
            cy="9"
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
          />
          <circle
            cx="9"
            cy="9"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        {displayDate && (
          <span className="text-[9px] text-slate-400 whitespace-nowrap">{displayDate}</span>
        )}
        {label && (
          <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: labelColor }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
