import { useState, type ChangeEvent, useRef, useEffect } from "react";
import VideoCompressionUtility from "../utils/reelsCompressionUtil";
import type { CompressionResult } from "../utils/reelsCompressionUtil";
import { useAuth } from "react-oidc-context";

// Define types for our states
// Update your UploadState type to include the new states
type UploadState = 'idle' | 'getting_url' | 'getting_video_url' | 'uploading'| 'uploading_video' | 'uploading_thumbnail' | 'saving_metadata' | 'completed' | 'error';
type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';
type ThumbnailState = 'idle' | 'generating' | 'ready' | 'error';

// Validation constants
const MAX_DURATION = 60; // 60 seconds maximum
const MAX_SIZE_MB = 20; // 20MB maximum
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_CAPTION_LENGTH = 200;  // max caption characters
const MAX_TAG_LENGTH = 100;      // max characters per tag
const MAX_TAGS_COUNT = 30;       // optional limit for number of tags

export default function CreateReel() {
    const auth = useAuth();
    const access_token = auth.user?.access_token;
    const [video, setVideo] = useState<File | null>(null);
    const [processedVideo, setProcessedVideo] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState("");
    const [previewMode, setPreviewMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingState, setProcessingState] = useState<ProcessingState>('idle');
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingResult, setProcessingResult] = useState<CompressionResult | null>(null);
    const [visibility, setVisibility] = useState<"public" | "private">("public");
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
    const [thumbnailState, setThumbnailState] = useState<ThumbnailState>('idle');
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Add this to your cleanup useEffect
    useEffect(() => {
        return () => {
            if (videoObjectUrl.current) {
                URL.revokeObjectURL(videoObjectUrl.current);
            }
            if (processedVideoUrl.current) {
                URL.revokeObjectURL(processedVideoUrl.current);
            }
            if (thumbnailObjectUrl.current) {
                URL.revokeObjectURL(thumbnailObjectUrl.current);
            }
        };
    }, []);

    // Custom SVG Icons
    const VideoIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="23,7 16,12 23,17 23,7" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    const EditIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const SendIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );

    const EyeIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    const CloseIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const InfoIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline mr-1">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const ImageIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
                // Seek to the specified time
                videoElement.currentTime = Math.min(timeInSeconds, videoElement.duration);
            });

            videoElement.addEventListener('seeked', () => {
                // Create canvas to capture frame with optimized dimensions
                const canvas = document.createElement('canvas');
                const maxDimension = 800; // Maximum width/height to ensure reasonable size

                // Calculate dimensions while maintaining aspect ratio
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

                    // Convert to blob with quality that ensures < 1MB file size
                    const targetMaxSize = 500 * 1024; // 500KB target (well under 1MB)
                    let quality = 0.85; // Start with good quality

                    const tryConvert = (q: number) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                if (blob.size > targetMaxSize && q > 0.5) {
                                    // Reduce quality if still too large
                                    tryConvert(q - 0.1);
                                } else {
                                    const fileName = `thumbnail-${Date.now()}.jpg`;
                                    const file = new File([blob], fileName, { type: 'image/jpeg' });
                                    URL.revokeObjectURL(objectUrl);

                                    console.log(`Thumbnail generated: ${(blob.size / 1024).toFixed(2)}KB, Quality: ${q}`);
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

        const handleToggle = () => {
            setVisibility(isPublic ? "private" : "public");
        };

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
            video: !video ? "A video is required" : "",
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
        return !Object.values(newErrors).some(error => error !== "");
    };

    const validateVideo = (file: File, _duration: number): string => {
        if (file.size > MAX_SIZE_BYTES) {
            return `Video is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_SIZE_MB}MB. Please compress the video externally and try again.`;
        }
        if (file.size === 0) {
            return "Video file is empty (0 KB)";
        }
        return "";
    };

    const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Create a temporary video element to check duration
            const videoElement = document.createElement('video');
            const objectUrl = URL.createObjectURL(file);
            videoElement.src = objectUrl;

            videoElement.addEventListener('loadedmetadata', async () => {
                const duration = videoElement.duration;

                // Validate video before processing
                const validationError = validateVideo(file, duration);
                if (validationError) {
                    setErrors({ ...errors, video: validationError });
                    URL.revokeObjectURL(objectUrl);
                    return;
                }

                // Set state
                setVideo(file);
                setProcessedVideo(null);
                setProcessingState('idle');
                setProcessingProgress(0);
                setProcessingResult(null);
                setErrors({ ...errors, video: "" });

                if (videoObjectUrl.current) {
                    URL.revokeObjectURL(videoObjectUrl.current);
                }
                videoObjectUrl.current = objectUrl;
                setVideoDuration(duration);

                console.log(`📹 Original video: ${file.name}`);
                console.log(`📏 Size: ${formatBytes(file.size)}`);
                console.log(`⏱️ Duration: ${duration.toFixed(2)} seconds`);

                // Generate thumbnail
                setThumbnailState('generating');
                const thumb = await generateThumbnail(file);
                if (thumb) {
                    setThumbnail(thumb);
                    if (thumbnailObjectUrl.current) {
                        URL.revokeObjectURL(thumbnailObjectUrl.current);
                    }
                    thumbnailObjectUrl.current = URL.createObjectURL(thumb);
                    setThumbnailPreview(thumbnailObjectUrl.current);
                    setThumbnailState('ready');
                } else {
                    setThumbnailState('error');
                }

                // Process (trim) the video if needed
                if (duration > MAX_DURATION) {
                    setProcessingState('processing');
                    setProcessingProgress(0);

                    try {
                        const result = await VideoCompressionUtility.trimVideo(
                            file,
                            (progress) => setProcessingProgress(progress)
                        );

                        setProcessedVideo(result.file);
                        setProcessingResult(result);

                        if (processedVideoUrl.current) {
                            URL.revokeObjectURL(processedVideoUrl.current);
                        }
                        processedVideoUrl.current = URL.createObjectURL(result.file);

                        setProcessingState('completed');
                        setProcessingProgress(100);

                        console.log('✅ Video processed successfully');
                        console.log(`📏 Original size: ${VideoCompressionUtility.formatBytes(file.size)}`);
                        console.log(`📏 Processed size: ${VideoCompressionUtility.formatBytes(result.processedSize)}`);

                    } catch (error) {
                        console.error('Video processing failed:', error);
                        setProcessedVideo(file);
                        setProcessingResult({
                            file,
                            originalSize: file.size,
                            processedSize: file.size,
                            timeTaken: 0
                        });

                        if (processedVideoUrl.current) {
                            URL.revokeObjectURL(processedVideoUrl.current);
                        }
                        processedVideoUrl.current = objectUrl;

                        setProcessingState('completed');
                        setProcessingProgress(100);
                    }
                } else {
                    // No trimming needed
                    setProcessedVideo(file);
                    setProcessingResult({
                        file,
                        originalSize: file.size,
                        processedSize: file.size,
                        timeTaken: 0
                    });
                    processedVideoUrl.current = objectUrl;
                    setProcessingState('completed');
                    setProcessingProgress(100);
                }
            });

            videoElement.addEventListener('error', () => {
                URL.revokeObjectURL(objectUrl);
                setErrors({ ...errors, video: "Failed to load video. Please try another file." });
            });
        }
    };

    const compressImage = async (file: File, maxSizeKB: number = 500): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                // Calculate new dimensions (max 800px on the longest side)
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

                // Progressive quality reduction to meet size target
                const tryCompress = (quality: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to create blob'));
                            return;
                        }

                        const sizeKB = blob.size / 1024;

                        if (sizeKB > maxSizeKB && quality > 0.5) {
                            // Reduce quality and try again
                            tryCompress(quality - 0.1);
                        } else {
                            const fileName = file.name.replace(/\.[^/.]+$/, "") || 'thumbnail';
                            const newFile = new File(
                                [blob],
                                `${fileName}-compressed.jpg`,
                                { type: 'image/jpeg' }
                            );

                            console.log(`Image compressed: ${(blob.size / 1024).toFixed(2)}KB, Quality: ${quality.toFixed(1)}`);
                            resolve(newFile);
                        }
                    }, 'image/jpeg', quality);
                };

                // Start with 0.8 quality
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

            // Validate it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file for thumbnail');
                return;
            }

            // Check file size first
            const maxSizeBytes = 1024 * 1024; // 1MB
            if (file.size > maxSizeBytes) {
                // Compress the image
                setThumbnailState('generating');

                try {
                    const compressedFile = await compressImage(file);
                    setThumbnail(compressedFile);

                    if (thumbnailObjectUrl.current) {
                        URL.revokeObjectURL(thumbnailObjectUrl.current);
                    }
                    thumbnailObjectUrl.current = URL.createObjectURL(compressedFile);
                    setThumbnailPreview(thumbnailObjectUrl.current);
                    setThumbnailState('ready');

                    console.log(`Thumbnail compressed from ${(file.size / 1024).toFixed(2)}KB to ${(compressedFile.size / 1024).toFixed(2)}KB`);
                } catch (error) {
                    console.error('Error compressing thumbnail:', error);
                    setThumbnailState('error');
                    alert('Failed to process thumbnail. Please try another image.');
                }
            } else {
                // File is already under 1MB, use as-is
                setThumbnail(file);
                if (thumbnailObjectUrl.current) {
                    URL.revokeObjectURL(thumbnailObjectUrl.current);
                }
                thumbnailObjectUrl.current = URL.createObjectURL(file);
                setThumbnailPreview(thumbnailObjectUrl.current);
                setThumbnailState('ready');
            }
        }
    };

    // Add this function to remove thumbnail
    const removeThumbnail = () => {
        setThumbnail(null);
        setThumbnailPreview(null);
        setThumbnailState('idle');
        if (thumbnailObjectUrl.current) {
            URL.revokeObjectURL(thumbnailObjectUrl.current);
            thumbnailObjectUrl.current = null;
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
        setThumbnailState('idle');

        if (videoObjectUrl.current) {
            URL.revokeObjectURL(videoObjectUrl.current);
            videoObjectUrl.current = null;
        }
        if (processedVideoUrl.current) {
            URL.revokeObjectURL(processedVideoUrl.current);
            processedVideoUrl.current = null;
        }
        if (thumbnailObjectUrl.current) {
            URL.revokeObjectURL(thumbnailObjectUrl.current);
            thumbnailObjectUrl.current = null;
        }
    };

    const handlePreview = () => {
        if (validateForm()) {
            setPreviewMode(true);
        }
    };

    const handleSubmit = async () => {
        if (!processedVideo) return alert("No video selected");
        if (!access_token) return alert("Not authenticated");

        setIsSubmitting(true);
        setUploadState('getting_url');

        try {
            console.log("1. Requesting presigned URL for video...");
            setUploadState('getting_video_url');

            const safeVideoFilename = encodeURIComponent(processedVideo.name);

            // Request presigned URL for video
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

            console.log("2. Uploading video to S3...");
            setUploadState('uploading_video');

            // Upload video
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

            // Upload thumbnail if available
            if (thumbnail) {
                console.log("3. Uploading thumbnail...");
                setUploadState('uploading_thumbnail');

                const safeThumbnailFilename = encodeURIComponent(thumbnail.name);

                const thumbnailPresignRes = await fetch(import.meta.env.VITE_GETPRESIGNEDURLFORUPLOADING, {
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

            console.log("4. Saving metadata...");
            setUploadState('saving_metadata');

            const metadataPayload = {
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

            const metadataRes = await fetch(import.meta.env.VITE_ADDCRINZMEMEPOST, {
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
                // Reset form
                setVideo(null);
                setProcessedVideo(null);
                setThumbnail(null);
                setThumbnailPreview(null);
                setCaption("");
                setTags("");
                setIsSubmitting(false);
                setPreviewMode(false);
                setUploadState('idle');
                setUploadProgress(0);
            }, 1000);

        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadState('error');
            setIsSubmitting(false);
            alert(`Failed to submit reel: ${err.message}`);
        }
    };

    if (previewMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-8 px-4">
                <div className="max-w-2xl mx-auto relative">
                    {/* Close Button */}
                    <button
                        onClick={() => setPreviewMode(false)}
                        className="absolute -top-2 -right-2 z-10 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all"
                    >
                        <CloseIcon />
                    </button>

                    <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-blue-500/10">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    Preview Reel
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${visibility === "public"
                                    ? "bg-green-900/30 text-green-400 border border-green-700/30"
                                    : "bg-purple-900/30 text-purple-400 border border-purple-700/30"
                                    }`}>
                                    {visibility === "public" ? "🌍 Public" : "🔒 Protected"}
                                </span>
                            </div>

                            {/* Video Preview */}
                            {(processedVideoUrl.current) && (
                                <div className="relative mb-6 group">
                                    <video
                                        controls
                                        className="rounded-xl w-full h-96 object-contain shadow-md transition-all duration-300 bg-black"
                                        src={processedVideoUrl.current}
                                        poster={thumbnailPreview || undefined}
                                    />
                                    {(processingState === 'processing') && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                                            <p className="text-white text-sm">
                                                Processing... {Math.round(processingProgress)}%
                                            </p>
                                        </div>
                                    )}
                                    {processingState === 'completed' && (
                                        <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                                            Ready
                                        </div>
                                    )}
                                    {processingState === 'error' && (
                                        <div className="absolute top-3 right-3 bg-amber-600 text-white text-xs px-2 py-1 rounded-full shadow-md">
                                            ⚠️ Original
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Caption Section */}
                                <div className="p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                    <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                        </svg>
                                        Caption
                                    </h3>
                                    <p className="text-gray-200 break-words whitespace-pre-wrap bg-gray-800/30 p-3 rounded-lg w-full">
                                        {caption || <span className="text-gray-500 italic">No caption provided</span>}
                                    </p>
                                </div>

                                {/* Tags Section */}
                                {tags && (
                                    <div className="p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Tags
                                        </h3>
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

                            {/* Thumbnail Section */}
                            {
                                thumbnailState !== 'idle' && (
                                    <div className="mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Thumbnail
                                            <span className="text-xs text-gray-500 ml-2">
                                                (Optional)
                                            </span>
                                        </h3>

                                        {thumbnailPreview ? (
                                            <div className="relative mb-3">
                                                <img
                                                    src={thumbnailPreview}
                                                    alt="Thumbnail preview"
                                                    className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                                />
                                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {thumbnail ? `${(thumbnail.size / 1024).toFixed(0)}KB` : ''}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeThumbnail}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-colors"
                                                    title="Remove thumbnail"
                                                >
                                                    <CloseIcon />
                                                </button>
                                            </div>
                                        ) : thumbnailState === 'generating' ? (
                                            <div className="flex items-center justify-center h-32 bg-gray-800/30 rounded-lg border border-gray-600">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                                                <span className="text-gray-300">Generating thumbnail...</span>
                                            </div>
                                        ) : null}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                            id="thumbnail-upload"
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className="block p-3 text-center bg-gray-800/30 rounded-lg border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-center gap-2 text-sm">
                                                <ImageIcon />
                                                <span>Upload Custom Thumbnail</span>
                                            </div>
                                        </label>
                                    </div>
                                )
                            }

                            {/* Video Info Section */}
                            <div className="mb-6 p-4 bg-gray-700/50 rounded-xl shadow-sm border border-gray-600">
                                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Video Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-gray-400">Duration:</div>
                                    <div className="text-gray-200">{formatTime(videoDuration)}</div>

                                    <div className="text-gray-400">Original Size:</div>
                                    <div className="text-gray-200">{video && VideoCompressionUtility.formatBytes(video.size)}</div>

                                    {processingResult && processingResult.processedSize !== processingResult.originalSize && (
                                        <>
                                            <div className="text-gray-400">Compressed Size:</div>
                                            <div className="text-green-400">
                                                {VideoCompressionUtility.formatBytes(processingResult.processedSize)}
                                                <span className="text-xs text-gray-500 ml-1">
                                                    ({(100 - (processingResult.processedSize / processingResult.originalSize * 100)).toFixed(1)}% reduction)
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {processingState === 'error' && (
                                        <div className="col-span-2 text-amber-300 text-xs bg-amber-900/20 p-2 rounded-lg mt-2">
                                            ⚠️ Using original video due to processing error
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
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
                                        uploadState === 'getting_url' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Preparing...
                                            </>
                                        ) : uploadState === 'uploading' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Uploading {Math.round(uploadProgress)}%
                                            </>
                                        ) : uploadState === 'saving_metadata' ? (
                                            <>
                                                <div className="animate-pulse">✓</div>
                                                Finalizing...
                                            </>
                                        ) : uploadState === 'completed' ? (
                                            <>
                                                <div className="text-green-300">✓</div>
                                                Success!
                                            </>
                                        ) : (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <SendIcon />
                                            Post Reel
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-blue-500/10">
                    <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            Upload Reel
                        </h2>

                        <div className="space-y-5">
                            {/* Video Upload */}
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
                                            MP4, MOV up to {MAX_SIZE_MB}MB, max {MAX_DURATION}s
                                        </span>
                                        <div className="text-xs text-gray-500 mt-2">
                                            <InfoIcon />
                                            Videos larger than {MAX_SIZE_MB}MB will be rejected - 480p suggested
                                        </div>
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
                                                    {formatBytes(video.size)} • {formatTime(videoDuration)}
                                                </span>
                                                {processingState === 'processing' && (
                                                    <span className="text-xs text-blue-400">
                                                        Processing... {Math.round(processingProgress)}%
                                                    </span>
                                                )}
                                                {processingState === 'completed' && (
                                                    <span className="text-xs text-green-400">
                                                        ✓ Processed
                                                    </span>
                                                )}
                                                {processingState === 'error' && (
                                                    <span className="text-xs text-amber-400">
                                                        ⚠️ Using original video
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={removeVideo}
                                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                            disabled={processingState === 'processing'}
                                        >
                                            <CloseIcon />
                                        </button>
                                    </div>
                                )}

                                {(processingState === 'processing') && (
                                    <div className="w-full bg-gray-600 rounded-full h-1.5 mt-3">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${processingProgress}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            {/* Caption Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Caption <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={handleCaptionChange}
                                    placeholder="Write a caption..."
                                    className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${errors.caption ? "border-red-500" : "border-gray-600"}`}
                                    rows={3}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span className={errors.caption ? "text-red-400" : "text-gray-400"}>
                                        {errors.caption || ""}
                                    </span>
                                    <span className="text-gray-400">
                                        {caption.length}/{MAX_CAPTION_LENGTH}
                                    </span>
                                </div>
                                {errors.caption && (
                                    <p className="text-red-400 text-sm mt-2 flex items-center">
                                        <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                                        {errors.caption}
                                    </p>
                                )}
                            </div>

                            {/* Thumbnail Section */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Thumbnail
                                    <span className="text-xs text-gray-400 ml-2">(Optional - auto-generated if not provided)</span>
                                </label>

                                {thumbnailPreview ? (
                                    <div className="relative w-full max-w-sm mx-auto">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            className="rounded-lg w-full h-40 object-cover border border-gray-600 shadow-md"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {thumbnail ? `${(thumbnail.size / 1024).toFixed(0)}KB` : ''}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeThumbnail}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="thumbnail-upload"
                                        className="block cursor-pointer w-full max-w-sm mx-auto p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 text-center transition-all flex items-center justify-center gap-2"
                                    >
                                        <ImageIcon />
                                        <span className="text-gray-200 font-medium">Upload Custom Thumbnail</span>
                                        <span className="text-xs text-gray-400 block mt-1">(Max 1MB)</span>
                                    </label>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    id="thumbnail-upload"
                                    className="hidden"
                                />
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tags <span className="text-red-400">*</span>
                                    <span className="text-xs text-gray-400 ml-2">(comma separated)</span>
                                </label>
                                <p className="text-xs text-gray-400">
                                    Each tag ≤ {MAX_TAG_LENGTH} chars, max {MAX_TAGS_COUNT} tags
                                </p>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={handleTagsChange}
                                    placeholder="Enter tags separated by commas"
                                    className={`w-full p-3 rounded-lg bg-gray-700 text-white border ${errors.tags ? "border-red-500" : "border-gray-600"}`}
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.split(",").map((tag, i) => {
                                        const cleanTag = tag.trim();
                                        if (!cleanTag) return null;
                                        const tooLong = cleanTag.length > MAX_TAG_LENGTH;
                                        return (
                                            <span
                                                key={i}
                                                className={`px-3 py-1 rounded-full text-sm ${tooLong
                                                    ? "bg-red-800 text-red-200 border border-red-500"
                                                    : "bg-blue-900 text-blue-200 border border-blue-700/30"
                                                    }`}
                                            >
                                                #{cleanTag}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className={errors.tags ? "text-red-400" : "text-gray-400"}>
                                        {errors.tags || ""}
                                    </span>
                                    <span className="text-gray-400">
                                        {tags.split(",").filter(t => t.trim()).length}/{MAX_TAGS_COUNT} tags
                                    </span>
                                </div>

                                {errors.tags && (
                                    <p className="text-red-400 text-sm mt-2 flex items-center">
                                        <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                                        {errors.tags}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                    Add relevant tags to help others discover your reel
                                </p>
                            </div>
                        </div>
                        <VisibilityToggle />

                        <button
                            onClick={handlePreview}
                            disabled={!video || processingState === 'processing' || !processedVideo}
                            className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/20 text-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <EyeIcon />
                            {processingState === 'processing' ? 'Processing...' : 'Preview Reel'}
                        </button>

                        {!video && !errors.video && (
                            <p className="text-center text-sm text-amber-400 mt-3">
                                Please upload a video to continue
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}