import { useCreateReel, type EditData, type ThumbnailAction } from "../../feed/hooks/useCreateReel";

import { VideoIcon, EditIcon, SendIcon, EyeIcon, CloseIcon, ImageIcon } from "../shared/Icons";
import { VisibilityToggle } from "../shared/VisibilityToggle";

interface CreateReelProps {
    editData?: EditData;
    onSave?: (data: {
        postId?: string;
        reelId?: string;
        caption: string;
        tags: string[];
        visibility: "public" | "private";
        thumbnail?: File | null;
        thumbnailAction: ThumbnailAction;
    }) => void;
    onCancel?: () => void;
    isModal?: boolean;
}

export default function CreateReel({ editData, onSave, onCancel, isModal = false }: CreateReelProps) {
    const {
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
        setPreviewMode,
        setVisibility,
        handleVideoChange,
        handleThumbnailChange,
        handleThumbnailAction,
        handleCaptionChange,
        handleTagsChange,
        removeVideo,
        handleSubmit,
        formatBytes,
        formatTime
    } = useCreateReel(editData, onSave);

    const handlePreview = () => {
        setPreviewMode(true);
    };

    const renderActions = () => {
        if (isModal) {
            return (
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 pt-4 pb-6 -mx-6 px-6 -mb-6 mt-6 z-10 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePreview}
                        disabled={editData?.isEditMode ? false : (!video || processingState === 'processing' || !processedVideo)}
                        className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 text-white"
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
                <EyeIcon className="flex-shrink-0" />
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

                    {/* Actions */}
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            id="thumbnail-upload"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => handleThumbnailAction('replace')}
                            className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                        >
                            Change Thumbnail
                        </button>
                        {editData.thumbnailUrl && thumbnailAction !== 'remove' && (
                            <button
                                type="button"
                                onClick={() => handleThumbnailAction('remove')}
                                className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                            >
                                Remove Thumbnail
                            </button>
                        )}
                        {thumbnailAction !== 'keep' && (
                            <button
                                type="button"
                                onClick={() => handleThumbnailAction('keep')}
                                className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors text-sm"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Thumbnail (Optional)
                </label>
                <div className="flex items-start gap-4">
                    <div className="relative w-32 h-48 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
                        {thumbnailPreview ? (
                            <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs text-gray-500 p-2 text-center">
                                Generated from video
                            </span>
                        )}
                        {thumbnail && (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                Custom
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            id="thumbnail-upload"
                            className="hidden"
                        />
                        <label
                            htmlFor="thumbnail-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors text-sm font-medium mb-2"
                        >
                            <ImageIcon className="flex-shrink-0" />
                            Upload Custom
                        </label>
                        <p className="text-xs text-gray-400">
                            Upload a custom cover image or we'll generate one from your video.
                            Max 1MB.
                        </p>
                        {thumbnail && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-blue-300">
                                    {thumbnail.name} ({(thumbnail.size / 1024).toFixed(0)}KB)
                                </span>
                                <button
                                    onClick={() => handleThumbnailAction('remove')}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (previewMode) {
        return (
            <div className={`${isModal ? 'bg-transparent w-full' : 'min-h-screen bg-gray-900 py-8 px-4'}`}>
                <div className={`${isModal ? 'w-full' : 'max-w-2xl mx-auto'}`}>
                    <div className={`bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden ${isModal ? 'border-none shadow-none bg-transparent' : ''}`}>
                        {!isModal && <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>}
                        <div className={`${isModal ? 'p-6' : 'p-6'}`}>
                            {!isModal && (
                                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    Preview Reel
                                </h2>
                            )}

                            {(processedVideo || editData?.isEditMode) && (
                                <div className="relative mb-6 bg-black rounded-xl overflow-hidden aspect-[9/16] max-h-[70vh] mx-auto">
                                    <video
                                        controls
                                        className="w-full h-full object-contain"
                                        src={editData?.isEditMode && !video ? editData.videoUrl : (processedVideoUrl.current || undefined)}
                                        poster={thumbnailPreview || undefined}
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">Caption</h3>
                                    <p className="text-gray-200">{caption}</p>
                                </div>

                                {tags && (
                                    <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
                                        <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.split(",").map((tag, index) => (
                                                tag.trim() && (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-blue-900/40 text-blue-200 rounded-full text-sm border border-blue-500/30"
                                                    >
                                                        #{tag.trim()}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600/50">
                                    <h3 className="text-sm font-medium text-gray-400 mb-1">Visibility</h3>
                                    <p className="text-gray-200 flex items-center gap-2">
                                        {visibility === "public" ? "🌍 Public" : "🔒 Protected"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setPreviewMode(false)}
                                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                                >
                                    <EditIcon className="flex-shrink-0" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            {editData?.isEditMode ? 'Saving...' : 'Posting...'}
                                        </>
                                    ) : (
                                        <>
                                            <SendIcon className="flex-shrink-0" />
                                            {editData?.isEditMode ? 'Save Changes' : 'Post Reel'}
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
        <div className={`${isModal ? 'bg-transparent w-full' : 'min-h-screen bg-gray-900 py-8 px-4'}`}>
            <div className={`${isModal ? 'w-full' : 'max-w-2xl mx-auto'}`}>
                <div className={`bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 ${isModal ? 'border-none shadow-none bg-transparent' : 'hover:shadow-blue-500/10'}`}>
                    {!isModal && <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>}
                    <div className={`${isModal ? 'p-6' : 'p-6'}`}>
                        {!isModal && (
                            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Create New Reel
                            </h2>
                        )}

                        <div className="space-y-6">
                            {/* Video Upload Section */}
                            {!editData?.isEditMode && (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        id="video-upload"
                                        className="hidden"
                                    />
                                    {video ? (
                                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-900/50 rounded-lg">
                                                        <VideoIcon className="flex-shrink-0" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-200 truncate max-w-[200px]">
                                                            {video.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {formatBytes(video.size)} • {formatTime(videoDuration)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={removeVideo}
                                                    className="p-2 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <CloseIcon className="flex-shrink-0" />
                                                </button>
                                            </div>

                                            {/* Processing Status */}
                                            {processingState !== 'idle' && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-gray-400">
                                                        <span>
                                                            {processingState === 'processing' ? 'Compressing video...' :
                                                                processingState === 'completed' ? 'Ready to upload' : 'Processing failed'}
                                                        </span>
                                                        <span>{Math.round(processingProgress)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${processingState === 'error' ? 'bg-red-500' :
                                                                processingState === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                                                }`}
                                                            style={{ width: `${processingProgress}%` }}
                                                        />
                                                    </div>
                                                    {processingResult && (
                                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                            <span>Orig: {formatBytes(processingResult.originalSize)}</span>
                                                            <span className="text-green-400">New: {formatBytes(processingResult.processedSize)}</span>
                                                            <span>Saved: {formatBytes(processingResult.originalSize - processingResult.processedSize)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Preview Player */}
                                            {(processedVideo || video) && (
                                                <div className="mt-4 relative aspect-video bg-black rounded-lg overflow-hidden">
                                                    <video
                                                        controls
                                                        className="w-full h-full object-contain"
                                                        src={videoObjectUrl.current || undefined}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="video-upload"
                                            className={`block p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:bg-gray-700/30 ${errors.video ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-blue-500'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className={`p-4 rounded-full ${errors.video ? 'bg-red-800/50' : 'bg-gray-700'}`}>
                                                    <VideoIcon className="flex-shrink-0" />
                                                </div>
                                                <div>
                                                    <span className={`text-lg font-medium block ${errors.video ? 'text-red-300' : 'text-blue-300'}`}>
                                                        Upload Video
                                                    </span>
                                                    <span className="text-sm text-gray-400 mt-1 block">
                                                        Drag and drop or click to browse
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    MP4, MOV up to 100MB
                                                </span>
                                            </div>
                                        </label>
                                    )}

                                    {errors.video && (
                                        <p className="text-red-400 text-sm mt-2 flex items-center">
                                            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                                            {errors.video}
                                        </p>
                                    )}
                                </div>
                            )}

                            {renderThumbnailSection()}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Caption <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={handleCaptionChange}
                                    placeholder="Write a catchy caption..."
                                    rows={3}
                                    className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500 bg-gray-700 text-gray-200 ${errors.caption ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                />
                                <div className="flex justify-between mt-1">
                                    {errors.caption ? (
                                        <span className="text-red-400 text-xs">{errors.caption}</span>
                                    ) : <span></span>}
                                    <span className={`text-xs ${caption.length > 180 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        {caption.length}/{200}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tags <span className="text-red-400">*</span>
                                </label>
                                <input
                                    value={tags}
                                    onChange={handleTagsChange}
                                    placeholder="viral, comedy, dance (comma separated)"
                                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500 bg-gray-700 text-gray-200 ${errors.tags ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                />
                                {errors.tags && (
                                    <p className="text-red-400 text-sm mt-1">{errors.tags}</p>
                                )}
                            </div>

                            <VisibilityToggle visibility={visibility} onToggle={setVisibility} />

                            {isSubmitting && uploadState !== 'completed' && (
                                <div className="mt-4 p-4 bg-gray-900/80 rounded-xl border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-300">
                                            {uploadState === 'getting_url' && 'Initializing upload...'}
                                            {uploadState === 'uploading_video' && 'Uploading video...'}
                                            {uploadState === 'uploading_thumbnail' && 'Uploading thumbnail...'}
                                            {uploadState === 'saving_metadata' && 'Finishing up...'}
                                        </span>
                                        <span className="text-xs text-gray-400">{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {renderActions()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}