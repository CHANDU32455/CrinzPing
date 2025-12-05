import type { ComponentProps } from "react";

export const ImageIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const MusicIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export const VideoIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <polygon points="23,7 16,12 23,17 23,7" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export const EditIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const SendIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);

export const EyeIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export const CloseIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const PlusIcon = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const ChevronLeft = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ChevronRight = (props: ComponentProps<'svg'>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
