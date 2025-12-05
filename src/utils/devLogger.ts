/**
 * Development-only logging utilities
 * These functions only execute in development mode (npm run dev)
 * In production builds, these are completely stripped out by Vite
 */

export const devLog = (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.log(message, ...args);
    }
};

export const devError = (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.error(message, ...args);
    }
};

export const devWarn = (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.warn(message, ...args);
    }
};

export const devInfo = (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.info(message, ...args);
    }
};

export const devDebug = (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
        console.debug(message, ...args);
    }
};

export const devTable = (data: unknown) => {
    if (import.meta.env.DEV) {
        console.table(data);
    }
};

export const devGroup = (label: string, callback: () => void) => {
    if (import.meta.env.DEV) {
        console.group(label);
        callback();
        console.groupEnd();
    }
};

export const devTime = (label: string) => {
    if (import.meta.env.DEV) {
        console.time(label);
    }
};

export const devTimeEnd = (label: string) => {
    if (import.meta.env.DEV) {
        console.timeEnd(label);
    }
};

// Emoji helpers for consistent logging
export const logEmojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    cache: '💾',
    network: '🌐',
    refresh: '🔄',
    auth: '🔐',
    user: '👤',
    api: '🔌',
    database: '🗄️',
    file: '📁',
    rocket: '🚀',
    bug: '🐛',
    settings: '⚙️',
    search: '🔍',
    filter: '🔎',
    stats: '📊',
    chart: '📈',
    time: '⏰',
    location: '📍',
    link: '🔗',
    trash: '🗑️',
    edit: '✏️',
    save: '💾',
    upload: '📤',
    download: '📥',
    email: '📧',
    notification: '🔔',
    heart: '❤️',
    star: '⭐',
    fire: '🔥',
    party: '🎉',
} as const;
