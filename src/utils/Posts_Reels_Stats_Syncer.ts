import { useState, useEffect, useCallback } from 'react';
import { batchSyncer, type BatchAction, useBatchSync } from '../feed/utils/msgsBatchSyncer';

// Extended types for all content types
export type ContentType = 'crinz_message' | 'post' | 'reel';

export interface ContentAction extends Omit<BatchAction, 'crinzId'> {
  contentId: string;
  contentType: ContentType;
  crinzId?: string;
}

export interface LikeAction extends Omit<ContentAction, 'type' | 'payload'> {
  type: 'like' | 'unlike';
}

export interface CommentAction extends Omit<ContentAction, 'type'> {
  type: 'add_comment' | 'remove_comment';
  payload: {
    comment: string;
    commentId?: string;
    parentCommentId?: string;
  };
}

export interface ContentStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isLikedByUser: boolean;
  isBookmarked?: boolean;
}

class ContentManager {
  private contentStatsCache = new Map<string, ContentStats>();
  private contentCallbacks = new Map<string, Array<(stats: ContentStats) => void>>();

  likeContent(contentId: string, contentType: ContentType, userId: string, currentlyLiked: boolean): void {
    const action: LikeAction = {
      type: currentlyLiked ? 'unlike' : 'like',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
    };

    console.log('📤 ContentManager - Like Action:', {
      contentId,
      contentType,
      userId,
      currentlyLiked
    });

    // Optimistic update
    this.updateContentStats(contentId, {
      likeCount: currentlyLiked ? -1 : 1,
      isLikedByUser: !currentlyLiked,
    });

    // Convert to legacy format with content type
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: action.type,
      crinzId: contentId,
      userId: action.userId,
      payload: {
        contentType: contentType,
        isCrinzMessage: contentType === 'crinz_message'
      }
    };

    batchSyncer.addAction(legacyAction);
  }

  addComment(
    contentId: string,
    contentType: ContentType,  // This should be 'post' for posts
    userId: string,
    comment: string,
    tempCommentId?: string,
    parentCommentId?: string
  ): void {
    const action: CommentAction = {
      type: 'add_comment',
      contentId,
      contentType,  // Make sure this is correct
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        comment,
        commentId: tempCommentId,
        parentCommentId,
      },
    };

    console.log('📤 ContentManager - Add Comment:', {
      contentId,
      contentType,  // Check what this shows in logs
      userId,
      commentLength: comment.length,
      tempCommentId
    });

    // Optimistic update
    this.updateContentStats(contentId, {
      commentCount: 1,
    });

    // Convert to legacy format - MAKE SURE CONTENT TYPE IS PASSED CORRECTLY
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: 'add_comment',
      crinzId: contentId,
      userId: action.userId,
      payload: {
        text: comment,
        commentId: tempCommentId,
        contentType: contentType,  // ← THIS MUST BE CORRECT
        isCrinzMessage: contentType === 'crinz_message'
      },
    };

    console.log('📤 ContentManager - Legacy Comment Action:', {
      crinzId: contentId,
      contentType: contentType,  // Add this log to verify
      payload: legacyAction.payload
    });

    batchSyncer.addAction(legacyAction);
  }

  removeComment(
    contentId: string,
    contentType: ContentType,
    userId: string,
    commentId: string
  ): void {
    const action: CommentAction = {
      type: 'remove_comment',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        comment: '',
        commentId,
      },
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      commentCount: -1,
    });

    // Convert to legacy format
    const legacyAction: Omit<BatchAction, 'timestamp'> = {
      type: 'remove_comment',
      crinzId: contentId,
      userId: action.userId,
      payload: {
        commentId: commentId,
        contentType: contentType,
        isCrinzMessage: contentType === 'crinz_message'
      },
    };

    batchSyncer.addAction(legacyAction);
  }

  shareContent(
    contentId: string,
    contentType: ContentType,
    userId: string,
    platform?: string,
    message?: string
  ): void {
    const action = {
      type: 'share',
      contentId,
      contentType,
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        platform,
        message,
      },
    };

    // Optimistic update
    this.updateContentStats(contentId, {
      shareCount: 1,
    });

    console.log('Share action:', action);
  }

  private updateContentStats(contentId: string, updates: Partial<ContentStats>): void {
    const currentStats = this.contentStatsCache.get(contentId) || {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLikedByUser: false,
    };

    const newStats: ContentStats = {
      ...currentStats,
      likeCount: Math.max(0, currentStats.likeCount + (updates.likeCount || 0)),
      commentCount: Math.max(0, currentStats.commentCount + (updates.commentCount || 0)),
      shareCount: Math.max(0, currentStats.shareCount + (updates.shareCount || 0)),
      viewCount: Math.max(0, currentStats.viewCount + (updates.viewCount || 0)),
      isLikedByUser: updates.isLikedByUser !== undefined ? updates.isLikedByUser : currentStats.isLikedByUser,
    };

    this.contentStatsCache.set(contentId, newStats);
    this.notifyContentSubscribers(contentId, newStats);
  }

  subscribeToContent(contentId: string, callback: (stats: ContentStats) => void): () => void {
    if (!this.contentCallbacks.has(contentId)) {
      this.contentCallbacks.set(contentId, []);
    }

    const callbacks = this.contentCallbacks.get(contentId)!;
    callbacks.push(callback);

    return () => {
      const callbacks = this.contentCallbacks.get(contentId);
      if (callbacks) {
        this.contentCallbacks.set(
          contentId,
          callbacks.filter(cb => cb !== callback)
        );
      }
    };
  }

  private notifyContentSubscribers(contentId: string, stats: ContentStats): void {
    const callbacks = this.contentCallbacks.get(contentId);
    if (callbacks) {
      callbacks.forEach(callback => callback(stats));
    }
  }

  getContentStats(contentId: string): ContentStats | undefined {
    return this.contentStatsCache.get(contentId);
  }

  initializeContentStats(contentId: string, serverStats: any): void {
    const currentStats = this.contentStatsCache.get(contentId) || {
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLikedByUser: false,
    };

    const likeCount = serverStats.likeCount !== undefined ? serverStats.likeCount :
      serverStats.likes !== undefined ? serverStats.likes :
        currentStats.likeCount;

    const commentCount = serverStats.commentCount !== undefined ? serverStats.commentCount :
      serverStats.comments !== undefined ? serverStats.comments :
        currentStats.commentCount;

    const newStats: ContentStats = {
      ...currentStats,
      likeCount,
      commentCount,
      isLikedByUser: serverStats.isLikedByUser !== undefined ? serverStats.isLikedByUser : currentStats.isLikedByUser,
    };

    this.contentStatsCache.set(contentId, newStats);
    this.notifyContentSubscribers(contentId, newStats);
  }

  getRealCommentId(tempCommentId: string): string | undefined {
    return batchSyncer.getRealCommentId(tempCommentId);
  }

  forceSync(): void {
    batchSyncer.forceSync();
  }

  clearPending(): void {
    batchSyncer.clearPending();
  }

  getPendingCount(): number {
    return batchSyncer.getPendingCount();
  }
}

// Singleton instance
export const contentManager = new ContentManager();

// React Hook for using the content manager
export const useContentManager = () => {
  const { syncState, forceSync, clearPending, pendingCount } = useBatchSync();

  const likeContent = useCallback((
    contentId: string,
    contentType: ContentType,
    userId: string,
    currentlyLiked: boolean
  ) => {
    contentManager.likeContent(contentId, contentType, userId, currentlyLiked);
  }, []);

  const addComment = useCallback((
    contentId: string,
    contentType: ContentType,
    userId: string,
    comment: string,
    tempCommentId?: string,
    parentCommentId?: string
  ) => {
    contentManager.addComment(contentId, contentType, userId, comment, tempCommentId, parentCommentId);
  }, []);

  const removeComment = useCallback((
    contentId: string,
    contentType: ContentType,
    userId: string,
    commentId: string
  ) => {
    contentManager.removeComment(contentId, contentType, userId, commentId);
  }, []);

  const shareContent = useCallback((
    contentId: string,
    contentType: ContentType,
    userId: string,
    platform?: string,
    message?: string
  ) => {
    contentManager.shareContent(contentId, contentType, userId, platform, message);
  }, []);

  const subscribeToContent = useCallback((contentId: string, callback: (stats: ContentStats) => void) => {
    return contentManager.subscribeToContent(contentId, callback);
  }, []);

  const getContentStats = useCallback((contentId: string) => {
    return contentManager.getContentStats(contentId);
  }, []);

  const initializeContentStats = useCallback((contentId: string, serverStats: Partial<ContentStats>) => {
    contentManager.initializeContentStats(contentId, serverStats);
  }, []);

  return {
    likeContent,
    addComment,
    removeComment,
    shareContent,
    subscribeToContent,
    getContentStats,
    initializeContentStats,
    syncState,
    forceSync,
    clearPending,
    pendingCount,
    getRealCommentId: contentManager.getRealCommentId,
  };
};

export const useContentItem = (contentId: string, initialStats?: Partial<ContentStats>) => {
  const [stats, setStats] = useState<ContentStats>(() => ({
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    isLikedByUser: false,
    ...initialStats,
  }));

  const {
    likeContent,
    addComment,
    removeComment,
    shareContent,
    subscribeToContent,
    initializeContentStats
  } = useContentManager();

  useEffect(() => {
    if (initialStats) {
      initializeContentStats(contentId, initialStats);
    }
  }, [contentId, initialStats, initializeContentStats]);

  useEffect(() => {
    const unsubscribe = subscribeToContent(contentId, (newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, [contentId, subscribeToContent]);

  const handleLike = useCallback((
    contentType: ContentType,
    userId: string,
    currentlyLiked: boolean
  ) => {
    likeContent(contentId, contentType, userId, currentlyLiked);
  }, [contentId, likeContent]);

  const handleAddComment = useCallback((
    contentType: ContentType,
    userId: string,
    comment: string,
    tempCommentId?: string,
    parentCommentId?: string
  ) => {
    addComment(contentId, contentType, userId, comment, tempCommentId, parentCommentId);
  }, [contentId, addComment]);

  const handleRemoveComment = useCallback((
    contentType: ContentType,
    userId: string,
    commentId: string
  ) => {
    removeComment(contentId, contentType, userId, commentId);
  }, [contentId, removeComment]);

  const handleShare = useCallback((
    contentType: ContentType,
    userId: string,
    platform?: string,
    message?: string
  ) => {
    shareContent(contentId, contentType, userId, platform, message);
  }, [contentId, shareContent]);

  return {
    stats,
    handleLike,
    handleAddComment,
    handleRemoveComment,
    handleShare,
  };
};