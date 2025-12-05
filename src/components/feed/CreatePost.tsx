import { useCreatePost } from "../../feed/hooks/useCreatePost";
import {
  ImageIcon, MusicIcon, EditIcon, SendIcon, EyeIcon,
  CloseIcon, PlusIcon, ChevronLeft, ChevronRight
} from "../shared/Icons";
import { Button } from "../shared/Button";
import { VisibilityToggle } from "../shared/VisibilityToggle";

export default function CreatePost() {
  const {
    images,
    audio,
    processedAudio,
    caption,
    tags,
    previewMode,
    isSubmitting,
    currentImageIndex,
    visibility,
    errors,
    setPreviewMode,
    setVisibility,
    setCurrentImageIndex,
    handleImageChange,
    handleAudioChange,
    handleCaptionChange,
    handleTagsChange,
    removeImage,
    removeAudio,
    nextImage,
    prevImage,
    handleSubmit
  } = useCreatePost();



  if (previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-purple-500/10">
            <div className="h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Preview Post
              </h2>

              {images.length > 0 && (
                <div className="relative mb-4 group">
                  <img
                    src={URL.createObjectURL(images[currentImageIndex])}
                    alt={`preview-${currentImageIndex}`}
                    className="rounded-xl w-full h-64 object-contain shadow-md transition-all duration-300 bg-black"
                  />

                  {/* Navigation controls */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all backdrop-blur-sm"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all backdrop-blur-sm"
                      >
                        <ChevronRight />
                      </button>

                      {/* Image indicator dots */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentImageIndex
                              ? 'bg-purple-400 scale-125'
                              : 'bg-gray-400 hover:bg-gray-300'
                              }`}
                          />
                        ))}
                      </div>

                      {/* Image counter */}
                      <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {processedAudio && (
                <div className="mb-4 p-4 bg-gray-700 rounded-xl shadow-sm border border-gray-600">
                  <div className="flex items-center mb-2">
                    <div className="p-2 bg-purple-900 rounded-full">
                      <MusicIcon />
                    </div>
                    <span className="font-medium text-purple-300 ml-2">
                      Audio Attachment (Will be compressed)
                    </span>
                  </div>
                  <audio controls className="w-full mt-2 rounded-lg">
                    <source src={URL.createObjectURL(processedAudio)} />
                  </audio>
                </div>
              )}

              <div className="mb-4 p-4 bg-gray-700 rounded-xl shadow-sm border border-gray-600">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Caption</h3>
                <p className="text-gray-200 whitespace-pre-line">{caption}</p>
              </div>

              {tags && (
                <div className="mb-6 p-4 bg-gray-700 rounded-xl shadow-sm border border-gray-600">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.split(",").map((tag, index) => (
                      tag.trim() && (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-purple-900 to-pink-900 text-purple-200 rounded-full text-sm font-medium shadow-sm border border-purple-700/30"
                        >
                          #{tag.trim()}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4 p-4 bg-gray-700 rounded-xl shadow-sm border border-gray-600">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Visibility</h3>
                <span className="text-gray-200 font-medium">
                  {visibility === "public" ? "🌍 Public (Visible to everyone)" : "🔒 Protected (Visible only to friends)"}
                </span>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center gap-2 px-6 bg-gradient-to-r from-teal-400 to-blue-500 text-white hover:from-teal-500 hover:to-blue-600 rounded-2xl shadow-md"
                >
                  <EditIcon />
                  Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      Submit Post
                    </>
                  )}
                </Button>
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
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-purple-500/10">
          <div className="h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Create New Post
            </h2>

            <div className="space-y-5">
              {/* Image Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                  className="hidden"
                  multiple
                />
                <label
                  htmlFor="image-upload"
                  className={`block p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:bg-gray-700/30 ${errors.images ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:border-purple-500'
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className={`p-3 rounded-full ${errors.images ? 'bg-red-800/50' : 'bg-gray-700'}`}>
                      <ImageIcon />
                    </div>
                    <span className={`font-medium ${errors.images ? 'text-red-300' : 'text-purple-300'}`}>
                      {images.length > 0 ? `Add More Images (${images.length}/5)` : "Upload Images"}
                    </span>
                    <span className="text-sm text-gray-400">
                      PNG, JPG, GIF up to 10MB each • Max 5 images
                    </span>
                  </div>
                </label>

                {errors.images && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                    {errors.images}
                  </p>
                )}

                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`preview-${index}`}
                            className="rounded-lg w-full h-24 object-cover shadow-md transition-transform group-hover:scale-105"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors shadow-lg"
                          >
                            <CloseIcon />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center truncate">
                            {image.name.length > 15 ? image.name.substring(0, 12) + '...' : image.name}
                          </div>
                        </div>
                      ))}
                      {images.length < 5 && (
                        <label
                          htmlFor="image-upload"
                          className="flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-gray-700/30 transition-all"
                        >
                          <div className="p-4 text-center">
                            <PlusIcon />
                            <span className="text-sm text-gray-400 mt-1 block">Add more</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Upload (Optional) */}
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  id="audio-upload"
                  className="hidden"
                />
                <label
                  htmlFor="audio-upload"
                  className="block p-6 border-2 border-dashed border-gray-600 rounded-2xl text-center cursor-pointer transition-all hover:border-pink-500 hover:bg-gray-700/50"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-2 bg-gray-700 rounded-full">
                      <MusicIcon />
                    </div>
                    <span className="font-medium text-pink-300">
                      {audio ? "Change Audio" : "Attach Audio (optional)"}
                    </span>
                    <span className="text-xs text-gray-400">
                      MP3, WAV up to 20MB • Max 30 seconds
                    </span>
                  </div>
                </label>
                {audio && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-xl shadow-sm flex items-center justify-between border border-gray-600">
                    <div className="flex items-center gap-3">
                      <MusicIcon />
                      <span className="text-sm font-medium text-gray-200 truncate max-w-xs">
                        {audio.name}
                      </span>
                    </div>
                    <button
                      onClick={removeAudio}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <CloseIcon />
                    </button>
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
                  placeholder="Share what's on your mind..."
                  className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all min-h-[120px] placeholder-gray-500 ${errors.caption ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-700'
                    } text-gray-200`}
                />
                {errors.caption && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                    {errors.caption}
                  </p>
                )}
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags <span className="text-red-400">*</span>
                  <span className="text-xs text-gray-400 ml-2">(comma separated)</span>
                </label>
                <input
                  value={tags}
                  onChange={handleTagsChange}
                  placeholder="funny, roast, friendship"
                  className={`w-full p-3 border rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500 ${errors.tags ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-700'
                    } text-gray-200`}
                />
                {errors.tags && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs mr-1">!</span>
                    {errors.tags}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Add relevant tags to help others discover your post
                </p>
              </div>
            </div>
            <VisibilityToggle visibility={visibility} onToggle={setVisibility} />

            <Button
              className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20 text-lg font-medium flex items-center justify-center gap-2 transition-all"
              onClick={() => setPreviewMode(true)}
              disabled={images.length === 0}
            >
              <EyeIcon />
              Preview Post
            </Button>

            {images.length === 0 && !errors.images && (
              <p className="text-center text-sm text-amber-400 mt-3">
                Please upload at least one image to continue
              </p>
            )}

            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-1 flex items-center">
                <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-xs mr-2">i</span>
                Post Requirements
              </h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• At least one image is required</li>
                <li>• Caption is required</li>
                <li>• At least one tag is required</li>
                <li>• Audio is optional</li>
                <li>• Maximum 5 images per post</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}