import { useState, useEffect, useCallback } from 'react';

interface CommentPayload {
    comment: string;
    commentId?: string;
    contentType?: string;
    isCrinzMessage?: boolean;
    text?: string; // Add text for backward compatibility
}

interface LikePayload {
    contentType?: string;
    isCrinzMessage?: boolean;
    commentId?: string;
}

export interface BatchAction {
    type: 'like' | 'unlike' | 'add_comment' | 'remove_comment';
    crinzId: string;
    payload?: CommentPayload | LikePayload;
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

interface ProcessedAction {
    status: string;
    crinzId: string;
    type: string;
    commentId?: string;
    payload?: string;
}

import { API_ENDPOINTS } from '../constants/apiEndpoints';

const BATCH_PROCESS_API_URL = `${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.BATCH_PROCESSER}`;
const SYNC_DEBOUNCE_DELAY = 5000;
const SYNC_RETRY_DELAY = 30000;
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

    subscribe(callback: (state: SyncState) => void) {
        this.syncStateCallbacks.push(callback);
        callback(this.getSyncState());

        return () => {
            this.syncStateCallbacks = this.syncStateCallbacks.filter(cb => cb !== callback);
        };
    }

    private notifySubscribers() {
        const state = this.getSyncState();
        this.syncStateCallbacks.forEach(callback => callback(state));
    }

    private getSyncState(): SyncState {
        const countdown = this.syncTimeout ? Math.ceil(SYNC_DEBOUNCE_DELAY / 1000) : 0;

        return {
            isSyncing: this.syncTimeout !== null,
            pendingActions: [...this.pendingActions],
            syncCountdown: countdown,
            lastSyncTime: null,
            syncStatus: this.syncTimeout ? 'counting_down' : 'idle',
            error: null
        };
    }

    private setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.trySync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        window.addEventListener('beforeunload', () => {
            if (this.pendingActions.length > 0) {
                this.syncNow();
            }
        });
    }

    addAction(action: Omit<BatchAction, 'timestamp'>) {
        let processedAction: BatchAction;

        if (action.type === 'add_comment') {
            const payload = action.payload as CommentPayload;
            processedAction = {
                ...action,
                timestamp: new Date().toISOString(),
                payload: {
                    comment: payload?.text || payload?.comment || '',
                    commentId: payload?.commentId,
                    contentType: payload?.contentType,
                    isCrinzMessage: payload?.isCrinzMessage
                }
            };
        } else {
            const payload = action.payload as LikePayload;
            processedAction = {
                ...action,
                timestamp: new Date().toISOString(),
                payload: payload ? {
                    contentType: payload.contentType,
                    isCrinzMessage: payload.isCrinzMessage,
                    commentId: payload.commentId
                } : undefined
            };
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

                if ((existingAction.type === 'like' && newAction.type === 'unlike') ||
                    (existingAction.type === 'unlike' && newAction.type === 'like')) {
                    return false;
                }

                const existingPayload = existingAction.payload as CommentPayload;
                const newPayload = newAction.payload as CommentPayload;

                if (existingAction.type === 'add_comment' &&
                    newAction.type === 'remove_comment' &&
                    existingPayload?.commentId === newPayload?.commentId) {
                    return false;
                }

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
            const userId = JSON.parse(atob(localStorage.getItem('id_token')!.split('.')[1]))["cognito:username"];

            const payload = {
                actions: actionsToSync,
                userId: userId
            };

            const response = await fetch(BATCH_PROCESS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('id_token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                const processedActions: ProcessedAction[] = result.processed || [];

                processedActions.forEach((processed: ProcessedAction) => {
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
                        const matchingAction = this.pendingActions.find(action =>
                            action.type === 'add_comment' &&
                            action.crinzId === processed.crinzId &&
                            (action.payload as CommentPayload)?.commentId &&
                            processed.payload === (action.payload as CommentPayload)?.comment
                        );

                        if (matchingAction) {
                            const commentPayload = matchingAction.payload as CommentPayload;
                            this.tempToRealIdMap.set(commentPayload.commentId!, processed.commentId);
                            this.pendingActions = this.pendingActions.filter(action => action !== matchingAction);
                        }
                    }

                    if (['post_not_found', 'reel_not_found', 'content_not_found'].includes(processed.status)) {
                        this.pendingActions = this.pendingActions.filter(action =>
                            !(action.crinzId === processed.crinzId && action.type === processed.type)
                        );
                    }
                });
                this.retryCount = 0;
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('❌ BatchSyncer - Sync error:', error);
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

    getPendingCount(): number {
        return this.pendingActions.length;
    }

    getPendingActions(): BatchAction[] {
        return [...this.pendingActions];
    }

    forceSync() {
        this.syncNow();
    }

    clearPending() {
        this.pendingActions = [];
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
            this.syncTimeout = null;
        }
        this.notifySubscribers();
    }
}

export const batchSyncer = new MsgsBatchSyncer();

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

    const getPendingActions = useCallback(() => {
        return batchSyncer.getPendingActions();
    }, []);

    return {
        syncState,
        addAction,
        forceSync,
        clearPending,
        getPendingActions,
        pendingCount: batchSyncer.getPendingCount()
    };
};