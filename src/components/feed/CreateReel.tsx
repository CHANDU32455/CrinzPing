import { useState, type ChangeEvent, useRef, useEffect, useCallback } from "react";
import { VideoCompressionUtility } from "../../utils/reelsCompressionUtil";
import type { CompressionResult } from "../../utils/reelsCompressionUtil";
import { useAuth } from "react-oidc-context";

type UploadState = 'idle' | 'getting_url' | 'getting_video_url' | 'uploading' | 'uploading_video' | 'uploading_thumbnail' | 'saving_metadata' | 'completed' | 'error';
type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';
type ThumbnailAction = 'keep' | 'remove' | 'replace';

const MAX_SIZE_MB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_CAPTION_LENGTH = 200;
const MAX_TAG_LENGTH = 100;
const MAX_TAGS_COUNT = 20;

interface CreateReelProps {
    editData?: {
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
        existingVideo?: any;
        existingThumbnail?: any;
        allFiles?: any[];
    };
    onSave?: (data: any) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export default function CreateReel({ editData, onSave, onCancel, isModal = false }: CreateReelProps) {
    const auth = useAuth();
    const access_token = auth.user?.access_token;

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

    const VideoIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <polygon points="23,7 16,12 23,17 23,7" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    const EditIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const SendIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );

    const EyeIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    const CloseIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const ImageIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

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
                    let quality = 0.85;

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

    const VisibilityToggle = () => {
        const isPublic = visibility === "public";
        const handleToggle = () => setVisibility(isPublic ? "private" : "public");

        return (
            <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-gray-400">Visibility:</span>
                <button
                    type="button"
                    onClick={handleToggle}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
          ${isPublic ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
        `}
                    title={isPublic ? "Visible to everyone globally" : "Visible only to friends"}
                >
                    {isPublic ? "🌍 Public" : "🔒 Protected"}
                </button>
            </div>
        );
    };

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
            for (let tag of tagList) {
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

        // For edit mode, we don't need video validation
        if (editData?.isEditMode) {
            return !newErrors.caption && !newErrors.tags;
        }

        return !Object.values(newErrors).some(error => error !== "");
    };

    const validateVideo = (file: File): string => {
        if (file.size > MAX_SIZE_BYTES) {
            return `Video is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_SIZE_MB}MB.`;
        }
        if (file.size === 0) {
            return "Video file is empty (0 KB)";
        }
        return "";
    };

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

    const handlePreview = () => {
        if (validateForm()) {
            setPreviewMode(true);
        }
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
                    // Send thumbnail based on action
                    thumbnail: thumbnailAction === 'replace' ? thumbnail : null,
                    // Indicate thumbnail action
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

            const videoPresignRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}/reelContentUploader`, {
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
                const thumbnailPresignRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}/reelContentUploader`, {
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

            const metadataRes = await fetch(`${import.meta.env.VITE_BASE_API_URL}/addCrinzMemePost`, {
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

        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadState('error');
            setIsSubmitting(false);
            alert(`Failed to submit reel: ${err.message}`);
        }
    };

    const renderActions = () => {
        if (isModal) {
            return (
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-700">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePreview}
                        disabled={editData?.isEditMode ? false : (!video || processingState === 'processing' || !processedVideo)}
                        className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        {editData?.isEditMode ? 'Preview Changes' : 'Preview Reel'}
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={handlePreview}
                disabled={editData?.isEditMode ? false : (!video || processingState === 'processing' || !processedVideo)}
                className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/20 text-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <EyeIcon />
                {processingState === 'processing' ? 'Processing...' : (editData?.isEditMode ? 'Preview Changes' : 'Preview Reel')}
            </button>
        );
    };

    const renderThumbnailSection = () => {
        if (editData?.isEditMode) {
            return (
                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Thumbnail
                    </label>

                    {/* Current Thumbnail Display */}
                    {editData.thumbnailUrl && thumbnailAction !== 'remove' && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">Current Thumbnail:</p>
                            <div className="relative w-full max-w-sm">
                                <img
                                    src={editData.thumbnailUrl}
                                    alt="Current thumbnail"
                                    className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                />
                            </div>
                        </div>
                    )}

                    {/* New Thumbnail Preview */}
                    {thumbnailPreview && thumbnailAction === 'replace' && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">New Thumbnail:</p>
                            <div className="relative w-full max-w-sm">
                                <img
                                    src={thumbnailPreview}
                                    alt="New thumbnail"
                                    className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {thumbnail ? `${(thumbnail.size / 1024).toFixed(0)}KB` : ''}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Thumbnail Action Buttons */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        {editData.thumbnailUrl && (
                            <button
                                type="button"
                                onClick={() => handleThumbnailAction('keep')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailAction === 'keep'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                            >
                                Keep Current
                            </button>
                        )}

                        {editData.thumbnailUrl && (
                            <button
                                type="button"
                                onClick={() => handleThumbnailAction('remove')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailAction === 'remove'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                            >
                                Remove Thumbnail
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => handleThumbnailAction('replace')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailAction === 'replace'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                        >
                            Replace Thumbnail
                        </button>
                    </div>

                    {/* File input for replacement */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        id="thumbnail-upload"
                        className="hidden"
                    />

                    {/* Status message */}
                    {thumbnailAction === 'remove' && (
                        <p className="text-amber-400 text-sm">Thumbnail will be removed</p>
                    )}
                    {thumbnailAction === 'keep' && editData.thumbnailUrl && (
                        <p className="text-green-400 text-sm">Current thumbnail will be kept</p>
                    )}
                    {thumbnailAction === 'replace' && !thumbnailPreview && (
                        <p className="text-blue-400 text-sm">Select a new thumbnail image</p>
                    )}
                </div>
            );
        }

        // Original thumbnail upload for new reels
        return (
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thumbnail
                    <span className="text-xs text-gray-400 ml-2">
                        (Optional - auto-generated if not provided)
                    </span>
                </label>

                {thumbnailPreview ? (
                    <div className="relative w-full max-w-sm mx-auto">
                        <img src={thumbnailPreview} alt="Thumbnail preview" className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md" />
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {thumbnail ? `${(thumbnail.size / 1024).toFixed(0)}KB` : 'Current Thumbnail'}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setThumbnail(null);
                                setThumbnailPreview(null);
                                if (thumbnailObjectUrl.current) URL.revokeObjectURL(thumbnailObjectUrl.current);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                ) : (
                    <label htmlFor="thumbnail-upload" className="block cursor-pointer w-full max-w-sm mx-auto p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 text-center transition-all flex items-center justify-center gap-2">
                        <ImageIcon />
                        <span className="text-gray-200 font-medium">
                            Upload Custom Thumbnail
                        </span>
                        <span className="text-xs text-gray-400 block mt-1">(Max 1MB)</span>
                    </label>
                )}

                <input type="file" accept="image/*" onChange={handleThumbnailChange} id="thumbnail-upload" className="hidden" />
            </div>
        );
    };

    if (previewMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
                <div className="max-w-4xl mx-auto relative">
                    <button
                        onClick={() => setPreviewMode(false)}
                        className="absolute -top-2 -right-2 z-10 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all"
                    >
                        <CloseIcon />
                    </button>

                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-blue-500/10">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                        <div className="p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                        {editData?.isEditMode ? 'Preview Changes' : 'Preview Reel'}
                                    </h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${visibility === "public"
                                        ? "bg-green-900/30 text-green-400 border border-green-700/30"
                                        : "bg-purple-900/30 text-purple-400 border border-purple-700/30"
                                        }`}>
                                        {visibility === "public" ? "🌍 Public" : "🔒 Protected"}
                                    </span>
                                </div>
                            </div>

                            {/* Video Preview */}
                            {(processedVideoUrl.current || editData?.videoUrl) && (
                                <div className="relative mb-6 group">
                                    <div className="rounded-xl w-full h-48 bg-gray-900 flex items-center justify-center shadow-md">
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">🎬</div>
                                            <p className="text-gray-400">
                                                {editData?.isEditMode ? 'Existing Reel Video' : 'Reel Video'}
                                            </p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                {editData?.isEditMode
                                                    ? 'Video cannot be changed in edit mode'
                                                    : 'Ready for upload'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Caption</h3>
                                    <p className="text-gray-200 break-words whitespace-pre-wrap bg-gray-800/30 p-3 rounded-lg w-full">
                                        {caption || <span className="text-gray-500 italic">No caption provided</span>}
                                    </p>
                                </div>

                                {tags && (
                                    <div className="p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.split(",").map((tag, index) => (
                                                tag.trim() && (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-blue-200 rounded-full text-xs font-medium shadow-sm border border-blue-700/30"
                                                    >
                                                        #{tag.trim()}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Preview */}
                            <div className="mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Thumbnail</h3>

                                {editData?.isEditMode && thumbnailAction === 'remove' ? (
                                    <div className="flex items-center justify-center h-32 bg-gray-800/30 rounded-lg border border-gray-600 border-dashed">
                                        <span className="text-gray-500">Thumbnail will be removed</span>
                                    </div>
                                ) : thumbnailPreview ? (
                                    <div className="relative">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {thumbnail ? `${(thumbnail.size / 1024).toFixed(0)}KB` : 'Current Thumbnail'}
                                        </div>
                                    </div>
                                ) : editData?.thumbnailUrl && thumbnailAction === 'keep' ? (
                                    <div className="relative">
                                        <img
                                            src={editData.thumbnailUrl}
                                            alt="Current thumbnail"
                                            className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            Current Thumbnail
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-32 bg-gray-800/30 rounded-lg border border-gray-600 border-dashed">
                                        <span className="text-gray-500">No thumbnail</span>
                                    </div>
                                )}
                            </div>

                            {!editData?.isEditMode && video && (
                                <div className="mb-6 p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                    <h3 className="text-sm font-medium text-gray-400 mb-3">Video Details</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="text-gray-400">Duration:</div>
                                        <div className="text-gray-200">{formatTime(videoDuration)}</div>
                                        <div className="text-gray-400">Size:</div>
                                        <div className="text-gray-200">{video && formatBytes(video.size)}</div>
                                        {processingResult && processingResult.processedSize !== processingResult.originalSize && (
                                            <>
                                                <div className="text-gray-400">Compressed Size:</div>
                                                <div className="text-green-400">
                                                    {VideoCompressionUtility.formatBytes(processingResult.processedSize)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-8 pt-4 border-t border-gray-700">
                                <button
                                    onClick={() => setPreviewMode(false)}
                                    className="flex items-center gap-2 px-5 py-2.5 border border-purple-600 bg-purple-700 text-white rounded-xl hover:bg-purple-800 hover:border-purple-500 transition-colors"
                                >
                                    <EditIcon />
                                    Edit Reel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 min-w-[140px] justify-center"
                                >
                                    {isSubmitting ? (
                                        editData?.isEditMode ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                {uploadState === 'saving_metadata' && 'Updating...'}
                                                {uploadState === 'completed' && '✓ Updated!'}
                                                {uploadState === 'error' && 'Failed!'}
                                            </>
                                        ) : (
                                            <>
                                                {uploadState === 'getting_url' && 'Preparing...'}
                                                {uploadState === 'uploading_video' && `Uploading ${Math.round(uploadProgress)}%`}
                                                {uploadState === 'uploading_thumbnail' && 'Uploading Thumbnail...'}
                                                {uploadState === 'saving_metadata' && 'Finalizing...'}
                                                {uploadState === 'completed' && 'Success!'}
                                                {uploadState === 'error' && 'Failed!'}
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <SendIcon />
                                            {editData?.isEditMode ? 'Update Reel' : 'Post Reel'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={isModal ? "" : "min-h-screen bg-gradient-to-br from-gray-900 to-black"}>
            <div className={isModal ? "" : "max-w-4xl mx-auto"}>
                <div className={`bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-blue-500/10 ${isModal ? 'rounded-t-xl sm:rounded-xl' : ''}`}>
                    {!isModal && <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>}
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {editData?.isEditMode ? 'Edit Reel' : 'Upload Reel'}
                        </h2>

                        {editData?.isEditMode && (
                            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-300">
                                    <span>ℹ️</span>
                                    <span className="text-sm">Editing reel metadata. Video cannot be changed.</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            {!editData?.isEditMode && (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        id="video-upload"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="video-upload"
                                        className={`block p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:bg-gray-700/30 ${errors.video ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-blue-500'}`}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className={`p-3 rounded-full ${errors.video ? 'bg-red-800/50' : 'bg-gray-700'}`}>
                                                <VideoIcon />
                                            </div>
                                            <span className={`font-medium ${errors.video ? 'text-red-300' : 'text-blue-300'}`}>
                                                {video ? "Change Video" : "Upload Video"}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                MP4, MOV up to {MAX_SIZE_MB}MB
                                            </span>
                                        </div>
                                    </label>

                                    {errors.video && (
                                        <p className="text-red-400 text-sm mt-2 flex items-center">
                                            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                                            {errors.video}
                                        </p>
                                    )}

                                    {video && (
                                        <div className="mt-4 p-4 bg-gray-700 rounded-xl shadow-sm flex items-center justify-between border border-gray-600">
                                            <div className="flex items-center gap-3">
                                                <VideoIcon />
                                                <div>
                                                    <span className="text-sm font-medium text-gray-200 truncate max-w-xs block">
                                                        {video.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {`${formatBytes(video.size)} • ${formatTime(videoDuration)}`}
                                                    </span>
                                                    {processingState === 'completed' && (
                                                        <span className="text-xs text-green-400">
                                                            ✓ Optimized for delivery
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={removeVideo} className="p-1 text-gray-400 hover:text-red-400 transition-colors" disabled={processingState === 'processing'}>
                                                <CloseIcon />
                                            </button>
                                        </div>
                                    )}

                                    {processingState === 'processing' && (
                                        <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg mt-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-blue-300 font-medium">Optimizing Video</span>
                                                <span className="text-blue-400 text-sm">{Math.round(processingProgress)}%</span>
                                            </div>
                                            <div className="w-full bg-blue-900/30 rounded-full h-2">
                                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${processingProgress}%` }}></div>
                                            </div>
                                            <p className="text-blue-200 text-xs mt-2">Trimming and compressing for optimal delivery</p>
                                        </div>
                                    )}

                                    {processingState === 'completed' && processingResult && (
                                        <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg mt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-green-300 font-medium">✓ Optimization Complete</span>
                                                <span className="text-green-400 text-sm">
                                                    {VideoCompressionUtility.formatBytes(processingResult.processedSize)}
                                                </span>
                                            </div>
                                            <div className="text-green-200 text-xs mt-1">
                                                {videoDuration > 30 && (
                                                    <span className="text-amber-300">✂️ Trimmed to 30 seconds</span>
                                                )}
                                                {!videoDuration || videoDuration <= 30 && (
                                                    <span>✅ Ready for upload</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Caption <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={handleCaptionChange}
                                    placeholder="Write a caption for your reel..."
                                    className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${errors.caption ? "border-red-500" : "border-gray-600"} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                    rows={3}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span className={errors.caption ? "text-red-400" : "text-gray-400"}>{errors.caption || ""}</span>
                                    <span className="text-gray-400">{caption.length}/{MAX_CAPTION_LENGTH}</span>
                                </div>
                            </div>

                            {renderThumbnailSection()}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tags <span className="text-red-400">*</span>
                                    <span className="text-xs text-gray-400 ml-2">(comma separated)</span>
                                </label>
                                <p className="text-xs text-gray-400 mb-2">Each tag ≤ {MAX_TAG_LENGTH} chars, max {MAX_TAGS_COUNT} tags</p>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={handleTagsChange}
                                    placeholder="Enter tags separated by commas (e.g., funny, meme, viral)"
                                    className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${errors.tags ? "border-red-500" : "border-gray-600"} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.split(",").map((tag, i) => {
                                        const cleanTag = tag.trim();
                                        if (!cleanTag) return null;
                                        const tooLong = cleanTag.length > MAX_TAG_LENGTH;
                                        return (
                                            <span key={i} className={`px-3 py-1 rounded-full text-sm ${tooLong ? "bg-red-800 text-red-200 border border-red-500" : "bg-blue-900 text-blue-200 border border-blue-700/30"}`}>
                                                #{cleanTag}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className={errors.tags ? "text-red-400" : "text-gray-400"}>{errors.tags || ""}</span>
                                    <span className="text-gray-400">{tags.split(",").filter(t => t.trim()).length}/{MAX_TAGS_COUNT} tags</span>
                                </div>
                            </div>
                        </div>
                        <VisibilityToggle />
                        {renderActions()}

                        {!video && !editData?.isEditMode && !errors.video && (
                            <p className="text-center text-sm text-amber-400 mt-3">Please upload a video to continue</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}