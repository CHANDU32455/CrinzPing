import { useState, useEffect, useCallback } from 'react';

export interface BatchAction {
    type: 'like' | 'unlike' | 'add_comment' | 'remove_comment';
    crinzId: string;
    payload?: any;
    timestamp: string;
    userId: string;
}

interface SyncState {
    isSyncing: boolean;
    pendingActions: BatchAction[];
    syncCountdown: number;
    lastSyncTime: number | null;
    syncStatus: 'idle' | 'counting_down' | 'syncing' | 'success' | 'error';
    error: string | null;
}

const SYNC_DEBOUNCE_DELAY = 5000; // 5 seconds debounce
const SYNC_RETRY_DELAY = 30000; // 30 seconds retry delay
const MAX_RETRIES = 3;

class MsgsBatchSyncer {
    private pendingActions: BatchAction[] = [];
    private syncTimeout: ReturnType<typeof setTimeout> | null = null;
    private retryCount = 0;
    private isOnline = navigator.onLine;
    private syncStateCallbacks: Array<(state: SyncState) => void> = [];
    private tempToRealIdMap = new Map<string, string>();


    constructor() {
        this.setupEventListeners();
    }

    getRealCommentId(tempCommentId: string): string | undefined {
        return this.tempToRealIdMap.get(tempCommentId);
    }

    // Subscribe to sync state changes
    subscribe(callback: (state: SyncState) => void) {
        this.syncStateCallbacks.push(callback);
        return () => {
            this.syncStateCallbacks = this.syncStateCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifySubscribers() {
        const state = this.getSyncState();
        this.syncStateCallbacks.forEach(callback => callback(state));
    }

    private getSyncState(): SyncState {
        return {
            isSyncing: this.syncTimeout !== null,
            pendingActions: [...this.pendingActions],
            syncCountdown: this.syncTimeout ? Math.ceil((SYNC_DEBOUNCE_DELAY - (Date.now() - (this.syncTimeout as any)._idleStart)) / 1000) : 0,
            lastSyncTime: null, // You can track this if needed
            syncStatus: this.syncTimeout ? 'counting_down' : this.pendingActions.length > 0 ? 'idle' : 'idle',
            error: null
        };
    }

    private setupEventListeners() {
        // Network status detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.trySync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Sync when page is about to close
        window.addEventListener('beforeunload', () => {
            if (this.pendingActions.length > 0) {
                this.syncNow();
            }
        });
    }

    addAction(action: Omit<BatchAction, 'timestamp'>) {
        let processedAction: BatchAction;

        if (action.type === 'add_comment') {
            processedAction = {
                ...action,
                timestamp: new Date().toISOString(),
                payload: {
                    comment: action.payload?.text || action.payload?.comment || '',
                    commentId: action.payload?.commentId
                }
            };
        } else {
            processedAction = { ...action, timestamp: new Date().toISOString() };
        }

        this.neutralizeActions(processedAction);

        if (this.pendingActions.length === 0) {
            this.pendingActions.push(processedAction);
            this.startDebounce();
        } else {
            this.pendingActions.push(processedAction);
            this.resetDebounce();
        }

        this.notifySubscribers();

    }

    private neutralizeActions(newAction: BatchAction) {
        this.pendingActions = this.pendingActions.filter(existingAction => {
            if (existingAction.userId === newAction.userId &&
                existingAction.crinzId === newAction.crinzId) {

                // Like ↔ Unlike
                if ((existingAction.type === 'like' && newAction.type === 'unlike') ||
                    (existingAction.type === 'unlike' && newAction.type === 'like')) {
                    return false;
                }

                // Comment → Delete same comment
                if (existingAction.type === 'add_comment' &&
                    newAction.type === 'remove_comment' &&
                    existingAction.payload?.commentId === newAction.payload?.commentId) {
                    return false;
                }

                // Same action type → keep only latest
                if (existingAction.type === newAction.type) {
                    if (existingAction.type === 'like' || existingAction.type === 'unlike') {
                        return false;
                    }
                }
            }
            return true;
        });
    }


    private startDebounce() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        this.syncTimeout = setTimeout(() => {
            this.syncNow();
        }, SYNC_DEBOUNCE_DELAY);

        this.notifySubscribers();
    }

    private resetDebounce() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.startDebounce();
        }
    }

    private async syncNow() {
        if (this.pendingActions.length === 0 || !this.isOnline) {
            this.syncTimeout = null;
            this.notifySubscribers();
            return;
        }

        try {
            this.syncTimeout = null;
            this.notifySubscribers();

            const actionsToSync = [...this.pendingActions];
            const response = await fetch(import.meta.env.VITE_BATCH_PROCESS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('id_token')}`
                },
                body: JSON.stringify({
                    actions: actionsToSync,
                    userId: JSON.parse(atob(localStorage.getItem('id_token')!.split('.')[1]))["cognito:username"]
                })
            });

            if (!response.ok) throw new Error(`Sync failed: ${response.status}`);

            const result = await response.json();

            if (result.success) {
                const processedActions = result.processed || [];

                processedActions.forEach((processed: any) => {
                    if (['liked', 'unliked', 'comment_added', 'comment_removed'].includes(processed.status)) {
                        this.pendingActions = this.pendingActions.filter(action =>
                            !(action.crinzId === processed.crinzId && action.type === processed.type)
                        );
                    }

                    if (processed.status === 'already_liked') {
                        this.pendingActions = this.pendingActions.filter(action =>
                            !(action.crinzId === processed.crinzId && action.type === 'like')
                        );
                    }

                    if (processed.status === 'not_liked') {
                        this.pendingActions = this.pendingActions.filter(action =>
                            !(action.crinzId === processed.crinzId && action.type === 'unlike')
                        );
                    }

                    if (processed.status === 'comment_added' && processed.commentId) {
                        // Find the matching action
                        const matchingAction = this.pendingActions.find(action =>
                            action.type === 'add_comment' &&
                            action.crinzId === processed.crinzId &&
                            action.payload?.commentId &&
                            processed.payload === action.payload?.comment
                        );

                        if (matchingAction) {
                            // Store the mapping
                            this.tempToRealIdMap.set(matchingAction.payload.commentId, processed.commentId);

                            // Remove the processed action
                            this.pendingActions = this.pendingActions.filter(action => action !== matchingAction);
                        }
                    }

                    if (processed.status === 'invalid_comment') {
                        this.pendingActions = this.pendingActions.filter(action =>
                            !(action.crinzId === processed.crinzId && action.type === 'add_comment')
                        );
                    }
                });

                this.retryCount = 0;
                console.log('Batch sync successful:', processedActions);
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.retryCount++;
            if (this.retryCount < MAX_RETRIES) {
                setTimeout(() => this.syncNow(), SYNC_RETRY_DELAY * Math.pow(2, this.retryCount - 1));
            }
        } finally {
            this.notifySubscribers();
        }
    }


    private trySync() {
        if (this.isOnline && this.pendingActions.length > 0) {
            this.syncNow();
        }
    }

    // Get current pending actions count
    getPendingCount(): number {
        return this.pendingActions.length;
    }

    // Force sync (for manual retry)
    forceSync() {
        this.syncNow();
    }

    // Clear all pending actions
    clearPending() {
        this.pendingActions = [];
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        this.notifySubscribers();
    }
}

// Singleton instance
export const batchSyncer = new MsgsBatchSyncer();

// React Hook for using the batch syncer
export const useBatchSync = () => {
    const [syncState, setSyncState] = useState<SyncState>({
        isSyncing: false,
        pendingActions: [],
        syncCountdown: 0,
        lastSyncTime: null,
        syncStatus: 'idle',
        error: null
    });

    useEffect(() => {
        const unsubscribe = batchSyncer.subscribe(setSyncState);
        return unsubscribe;
    }, []);

    const addAction = useCallback((action: Omit<BatchAction, 'timestamp'>) => {
        batchSyncer.addAction(action);
    }, []);

    const forceSync = useCallback(() => {
        batchSyncer.forceSync();
    }, []);

    const clearPending = useCallback(() => {
        batchSyncer.clearPending();
    }, []);

    return {
        syncState,
        addAction,
        forceSync,
        clearPending,
        pendingCount: batchSyncer.getPendingCount()
    };
};

//  it is expected to get actions:  like for post by x, unlike for post by x,
// addedcomment for post y by x at time t with message m,
// deletedComment for post y by x at time t; -- we dont want what cntent deleted just comment id matters..

// as soon as you recieve any action start debounce and handle pending actions before batch sync,..

// you got an action so you started debounce and you got another action if same type like or comment,..
// check your pending actions you creaed when you started debounce..
// if you can neutralize that action do..else after debounce time done,. simply make a call to batch sync.
// server responds with a success filure response based on that you decide either to remove that stste compleely you created at debounce to store pending actions
// or let the failed once remain for further internet connected time sync..
// irrespective of situation the debounce must happen(even on page change, tabswitch or closed app completely..) and fallbacks must happen...
// thast the entire balamce plan...