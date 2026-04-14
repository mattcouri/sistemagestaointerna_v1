import React from 'react';
import { Bell, Check, X, FolderOpen } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function InvitationsPanel({ onClose }: { onClose: () => void }) {
  const { pendingInvitations, acceptInvitation, declineInvitation } = useApp();

  if (pendingInvitations.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {pendingInvitations.map(inv => {
        const projectName = (inv.project as any)?.name ?? 'Unknown Project';
        const inviterName = (inv.inviter as any)?.name ?? 'Someone';
        return (
          <div key={inv.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-start space-x-2 mb-2">
              <FolderOpen className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{projectName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Invited by {inviterName}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => acceptInvitation(inv.id)}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => declineInvitation(inv.id)}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
