import React from 'react';
import { useBatchSync } from './msgsBatchSyncer';
import '../styles/sync-status-indicator.css';

const SyncStatusIndicator: React.FC = () => {
  const { syncState, forceSync, clearPending, pendingCount } = useBatchSync();

  if (pendingCount === 0) return null;

  const getStatusMessage = () => {
    switch (syncState.syncStatus) {
      case 'counting_down':
        return `Syncing in ${syncState.syncCountdown || 0}s...`;
      case 'syncing':
        return 'Syncing actions...';
      case 'success':
        return 'Sync completed!';
      case 'error':
        return 'Sync failed. Retrying...';
      case 'idle':
      default:
        return `${pendingCount} action(s) pending sync`;
    }
  };

  const getActionDetails = () => {
    if (syncState.pendingActions.length === 0) return null;

    const actionTypes = syncState.pendingActions.reduce((acc, action) => {
      const actionName = action.type.replace('_', ' ');
      acc[actionName] = (acc[actionName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionTypes)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
  };

  return (
    <div className={`sync-indicator ${syncState.syncStatus}`}>
      <div className="sync-content">
        <div className="sync-icon">
          {syncState.syncStatus === 'counting_down' && '⏰'}
          {syncState.syncStatus === 'syncing' && '🔄'}
          {syncState.syncStatus === 'success' && '✅'}
          {syncState.syncStatus === 'error' && '❌'}
          {syncState.syncStatus === 'idle' && '⏳'}
        </div>

        <div className="sync-info">
          <div className="sync-message">{getStatusMessage()}</div>
          {getActionDetails() && (
            <div className="sync-details">{getActionDetails()}</div>
          )}
        </div>

        <div className="sync-actions">
          {syncState.syncStatus === 'error' && (
            <button onClick={forceSync} className="sync-retry-btn" title="Retry sync">
              🔄
            </button>
          )}
          <button onClick={clearPending} className="sync-clear-btn" title="Clear pending actions">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;