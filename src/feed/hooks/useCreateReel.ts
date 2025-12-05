import { useState, useRef, useEffect, useCallback, type ChangeEvent } from "react";
import { useAuth } from "react-oidc-context";
import { VideoCompressionUtility } from "../../utils/reelsCompressionUtil";
import type { CompressionResult } from "../../utils/reelsCompressionUtil";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_CAPTION_LENGTH = 200;
const MAX_TAG_LENGTH = 100;
const MAX_TAGS_COUNT = 20;

export type UploadState = 'idle' | 'getting_url' | 'getting_video_url' | 'uploading' | 'uploading_video' | 'uploading_thumbnail' | 'saving_metadata' | 'completed' | 'error';
export type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';
export type ThumbnailAction = 'keep' | 'remove' | 'replace';

export interface FileItem {
    url: string;
    type: string;
    isCustom?: boolean;
    fileName?: string;
}

export interface EditData {
    postId?: string;
    reelId?: string;
    caption?: string;
    tags?: string[];
    visibility?: "public" | "private";
    videoUrl?: string;
    thumbnailUrl?: string;
    fileName?: string;
    fileType?: string;
    isEditMode?: boolean;
    existingVideo?: FileItem | null;
    existingThumbnail?: FileItem | null;
    allFiles?: FileItem[];
}

export const useCreateReel = (
    editData?: EditData,
    onSave?: (data: {
        postId?: string;
        reelId?: string;
        caption: string;
        tags: string[];
        visibility: "public" | "private";
        thumbnail?: File | null;
        thumbnailAction: ThumbnailAction;
    }) => void
) => {
    const auth = useAuth();
    const access_token = auth.user?.access_token;

    // State
    const [video, setVideo] = useState<File | null>(null);
    const [processedVideo, setProcessedVideo] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [caption, setCaption] = useState(editData?.caption || "");
    const [tags, setTags] = useState(editData?.tags?.join(', ') || "");
    const [previewMode, setPreviewMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingState, setProcessingState] = useState<ProcessingState>('idle');
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingResult, setProcessingResult] = useState<CompressionResult | null>(null);
    const [visibility, setVisibility] = useState<"public" | "private">(editData?.visibility || "public");
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({
        video: "",
        caption: "",
        tags: ""
    });

    const videoObjectUrl = useRef<string | null>(null);
    const processedVideoUrl = useRef<string | null>(null);
    const thumbnailObjectUrl = useRef<string | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailAction, setThumbnailAction] = useState<ThumbnailAction>('keep');
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(editData?.thumbnailUrl || null);

    const cleanupBlobUrls = useCallback(() => {
        if (videoObjectUrl.current) URL.revokeObjectURL(videoObjectUrl.current);
        if (processedVideoUrl.current) URL.revokeObjectURL(processedVideoUrl.current);
        videoObjectUrl.current = null;
        processedVideoUrl.current = null;
    }, []);

    useEffect(() => {
        return () => {
            cleanupBlobUrls();
            if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
        };
    }, [cleanupBlobUrls]);

    useEffect(() => {
        if (editData?.isEditMode && editData.videoUrl && !videoObjectUrl.current) {
            console.log('📹 Using existing video URL for editing');
            videoObjectUrl.current = editData.videoUrl;
            setProcessingState('completed');
        }

        if (editData?.isEditMode && editData.thumbnailUrl && !thumbnailPreview) {
            setThumbnailPreview(editData.thumbnailUrl);
            setThumbnailAction('keep');
        }
    }, [editData, thumbnailPreview]);

    // Helpers
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const generateThumbnail = async (videoFile: File, timeInSeconds: number = 0.2): Promise<File | null> => {
        return new Promise((resolve) => {
            const videoElement = document.createElement('video');
            const objectUrl = URL.createObjectURL(videoFile);
            videoElement.src = objectUrl;

            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.currentTime = Math.min(timeInSeconds, videoElement.duration);
            });

            videoElement.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                const maxDimension = 800;
                let width = videoElement.videoWidth;
                let height = videoElement.videoHeight;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoElement, 0, 0, width, height);

                    const targetMaxSize = 500 * 1024;
                    const quality = 0.85;

                    const tryConvert = (q: number) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                if (blob.size > targetMaxSize && q > 0.5) {
                                    tryConvert(q - 0.1);
                                } else {
                                    const fileName = `thumbnail-${Date.now()}.jpg`;
                                    const file = new File([blob], fileName, { type: 'image/jpeg' });
                                    URL.revokeObjectURL(objectUrl);
                                    resolve(file);
                                }
                            } else {
                                URL.revokeObjectURL(objectUrl);
                                resolve(null);
                            }
                        }, 'image/jpeg', q);
                    };
                    tryConvert(quality);
                } else {
                    URL.revokeObjectURL(objectUrl);
                    resolve(null);
                }
            });

            videoElement.addEventListener('error', () => {
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            });
        });
    };

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const url = URL.createObjectURL(file);
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                resolve(video.duration);
                URL.revokeObjectURL(url);
            });
            video.addEventListener('error', () => {
                resolve(0);
                URL.revokeObjectURL(url);
            });
        });
    };

    const compressImage = async (file: File, maxSizeKB: number = 500): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const maxDimension = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                const tryCompress = (quality: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }
                        const sizeKB = blob.size / 1024;
                        if (sizeKB > maxSizeKB && quality > 0.5) {
                            tryCompress(quality - 0.1);
                        } else {
                            const fileName = file.name.replace(/\.[^/.]+$/, "") || 'thumbnail';
                            const newFile = new File([blob], `${fileName}-compressed.jpg`, { type: 'image/jpeg' });
                            resolve(newFile);
                        }
                    }, 'image/jpeg', quality);
                };
                tryCompress(0.8);
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };
            img.src = objectUrl;
        });
    };

    // Validation
    const validateVideo = (file: File): string => {
        if (file.size > MAX_SIZE_BYTES) {
            return `Video is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_SIZE_MB}MB.`;
        }
        if (file.size === 0) {
            return "Video file is empty (0 KB)";
        }
        return "";
    };

    const validateForm = () => {
        const newErrors = {
            video: !video && !editData?.isEditMode ? "A video is required" : "",
            caption: caption.trim().length === 0
                ? "Caption is required"
                : caption.length > MAX_CAPTION_LENGTH
                    ? `Caption cannot exceed ${MAX_CAPTION_LENGTH} characters`
                    : "",
            tags: ""
        };

        const tagList = tags.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (tagList.length === 0) {
            newErrors.tags = "At least one tag is required";
        } else {
            for (const tag of tagList) {
                if (tag.length > MAX_TAG_LENGTH) {
                    newErrors.tags = `Each tag cannot exceed ${MAX_TAG_LENGTH} characters`;
                    break;
                }
            }
            if (tagList.length > MAX_TAGS_COUNT) {
                newErrors.tags = `You can use up to ${MAX_TAGS_COUNT} tags only`;
            }
        }

        setErrors(newErrors);

        if (editData?.isEditMode) {
            return !newErrors.caption && !newErrors.tags;
        }

        return !Object.values(newErrors).some(error => error !== "");
    };

    // Handlers
    const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const validationError = validateVideo(file);
            if (validationError) {
                setErrors({ ...errors, video: validationError });
                return;
            }

            setVideo(file);
            setProcessedVideo(null);
            setProcessingState('processing');
            setProcessingProgress(0);
            setProcessingResult(null);
            setErrors({ ...errors, video: "" });

            cleanupBlobUrls();
            videoObjectUrl.current = URL.createObjectURL(file);

            try {
                const duration = await getVideoDuration(file);
                setVideoDuration(duration);

                const thumb = await generateThumbnail(file);
                if (thumb) {
                    setThumbnail(thumb);
                    if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
                    thumbnailObjectUrl.current = URL.createObjectURL(thumb);
                    setThumbnailPreview(thumbnailObjectUrl.current);
                }

                const result = await VideoCompressionUtility.smartCompress(
                    file,
                    (progress) => setProcessingProgress(progress)
                );

                setProcessedVideo(result.file);
                setProcessingResult(result);
                processedVideoUrl.current = URL.createObjectURL(result.file);
                setProcessingState('completed');

            } catch (error) {
                console.error('Compression failed:', error);
                setErrors({ ...errors, video: "Compression failed. Please try another video." });
                setProcessingState('error');
                setProcessedVideo(file);
                setProcessingResult({
                    file,
                    originalSize: file.size,
                    processedSize: file.size,
                    timeTaken: 0,
                    quality: 100,
                    resolution: 'original'
                });
            }
        }
    };

    const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file for thumbnail');
                return;
            }

            const maxSizeBytes = 1024 * 1024;
            if (file.size > maxSizeBytes) {
                try {
                    const compressedFile = await compressImage(file);
                    setThumbnail(compressedFile);
                    if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
                    thumbnailObjectUrl.current = URL.createObjectURL(compressedFile);
                    setThumbnailPreview(thumbnailObjectUrl.current);
                    setThumbnailAction('replace');
                } catch (error) {
                    console.error('Error compressing thumbnail:', error);
                    alert('Failed to process thumbnail. Please try another image.');
                }
            } else {
                setThumbnail(file);
                if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
                thumbnailObjectUrl.current = URL.createObjectURL(file);
                setThumbnailPreview(thumbnailObjectUrl.current);
                setThumbnailAction('replace');
            }
        }
    };

    const handleThumbnailAction = (action: ThumbnailAction) => {
        setThumbnailAction(action);

        if (action === 'remove') {
            setThumbnail(null);
            setThumbnailPreview(null);
            if (thumbnailObjectUrl.current) {
                URL.revokeObjectURL(thumbnailObjectUrl.current);
                thumbnailObjectUrl.current = null;
            }
        } else if (action === 'keep') {
            setThumbnail(null);
            setThumbnailPreview(editData?.thumbnailUrl || null);
            if (thumbnailObjectUrl.current) {
                URL.revokeObjectURL(thumbnailObjectUrl.current);
                thumbnailObjectUrl.current = null;
            }
        } else if (action === 'replace') {
            // UI logic to click input is handled here or in component?
            // It's cleaner if the UI handles the click, but we return a handler for the state update.
            // We'll leave the click triggering to the component because document.getElementById in hook is a bit messy, but acceptable if tied to ID.
            document.getElementById('thumbnail-upload')?.click();
        }
    };

    const handleCaptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_CAPTION_LENGTH) {
            setCaption(value);
            setErrors(prev => ({ ...prev, caption: "" }));
        }
    };

    const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTags(value);
        setErrors(prev => ({ ...prev, tags: "" }));
    };

    const removeVideo = () => {
        setVideo(null);
        setProcessedVideo(null);
        setProcessingState('idle');
        setProcessingProgress(0);
        setProcessingResult(null);
        setVideoDuration(0);
        setThumbnail(null);
        setThumbnailPreview(null);
        setThumbnailAction('keep');
        cleanupBlobUrls();
        if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
    };

    const handleSubmit = async () => {
        if (editData?.isEditMode && onSave) {
            setIsSubmitting(true);
            setUploadState('saving_metadata');

            try {
                const updatedData = {
                    postId: editData.postId,
                    reelId: editData.reelId,
                    caption: caption.trim(),
                    tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
                    visibility: visibility,
                    thumbnail: thumbnailAction === 'replace' ? thumbnail : null,
                    thumbnailAction: thumbnailAction
                };

                await new Promise(resolve => setTimeout(resolve, 800));
                setUploadState('completed');
                await new Promise(resolve => setTimeout(resolve, 300));

                onSave(updatedData);

            } catch (error) {
                console.error('Update failed:', error);
                setUploadState('error');
                alert('Failed to update reel. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        if (!processedVideo) {
            alert("No video selected");
            return;
        }
        if (!access_token) {
            alert("Not authenticated");
            return;
        }

        setIsSubmitting(true);
        setUploadState('getting_url');

        try {
            setUploadState('getting_video_url');
            const safeVideoFilename = encodeURIComponent(processedVideo.name);

            const videoPresignRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.REEL_CONTENT_UPLOADER}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    filename: safeVideoFilename,
                    filetype: processedVideo.type,
                    purpose: "reel_video"
                }),
            });

            if (!videoPresignRes.ok) {
                throw new Error(`Failed to get video presigned URL: ${videoPresignRes.status}`);
            }

            const videoPresignData = await videoPresignRes.json();
            const { url: videoPresignedUrl, key: videoS3Key, reelId } = videoPresignData;

            setUploadState('uploading_video');
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setUploadProgress(percentComplete);
                    }
                });
                xhr.open("PUT", videoPresignedUrl);
                xhr.setRequestHeader("Content-Type", processedVideo.type);
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(true);
                    } else {
                        reject(new Error(`Video upload failed: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error during video upload"));
                xhr.send(processedVideo);
            });

            let thumbnailS3Key = null;
            if (thumbnail) {
                setUploadState('uploading_thumbnail');
                const safeThumbnailFilename = encodeURIComponent(thumbnail.name);
                const thumbnailPresignRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.REEL_CONTENT_UPLOADER}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access_token}`,
                    },
                    body: JSON.stringify({
                        filename: safeThumbnailFilename,
                        filetype: thumbnail.type,
                        purpose: "reel_thumbnail",
                        reelId: reelId
                    }),
                });

                if (thumbnailPresignRes.ok) {
                    const thumbnailPresignData = await thumbnailPresignRes.json();
                    const { url: thumbnailPresignedUrl, key: thumbS3Key } = thumbnailPresignData;

                    await new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", thumbnailPresignedUrl);
                        xhr.setRequestHeader("Content-Type", thumbnail.type);
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                thumbnailS3Key = thumbS3Key;
                                resolve(true);
                            } else {
                                console.warn("Thumbnail upload failed");
                                resolve(false);
                            }
                        };
                        xhr.onerror = () => {
                            console.warn("Network error during thumbnail upload");
                            resolve(false);
                        };
                        xhr.send(thumbnail);
                    });
                }
            }

            setUploadState('saving_metadata');
            const metadataPayload = {
                action: "REELCREATE",
                metadata: {
                    from: "crinzpostsreels",
                    reelFile: {
                        s3Key: videoS3Key,
                        fileName: processedVideo.name,
                        type: processedVideo.type
                    },
                    caption: caption,
                    tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).join(','),
                    visibility: visibility,
                    reelId: reelId,
                    ...(thumbnailS3Key ? {
                        thumbnail: {
                            s3Key: thumbnailS3Key,
                            fileName: thumbnail?.name || "thumbnail.jpg",
                            type: thumbnail?.type || "image/jpeg",
                            isCustom: !!thumbnail
                        }
                    } : {})
                }
            };

            const metadataRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify(metadataPayload),
            });

            if (!metadataRes.ok) {
                throw new Error(`Metadata save failed: ${metadataRes.status}`);
            }

            setUploadState('completed');
            setTimeout(() => {
                setVideo(null);
                setProcessedVideo(null);
                setThumbnail(null);
                setThumbnailPreview(null);
                setThumbnailAction('keep');
                setCaption("");
                setTags("");
                setIsSubmitting(false);
                setPreviewMode(false);
                setUploadState('idle');
                setUploadProgress(0);
                cleanupBlobUrls();
            }, 1000);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            console.error("Upload error:", err);
            setUploadState('error');
            setIsSubmitting(false);
            alert(`Failed to submit reel: ${errorMessage}`);
        }
    };

    return {
        // State
        video,
        processedVideo,
        videoDuration,
        caption,
        tags,
        previewMode,
        isSubmitting,
        processingState,
        processingProgress,
        processingResult,
        visibility,
        uploadState,
        uploadProgress,
        errors,
        thumbnail,
        thumbnailAction,
        thumbnailPreview,
        videoObjectUrl,
        processedVideoUrl,
        thumbnailObjectUrl,

        // Actions
        setPreviewMode,
        setVisibility,
        handleVideoChange,
        handleThumbnailChange,
        handleThumbnailAction,
        handleCaptionChange,
        handleTagsChange,
        removeVideo,
        handleSubmit,
        validateForm,
        formatBytes,
        formatTime
    };
};
