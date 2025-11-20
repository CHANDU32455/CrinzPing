import { useState, type ChangeEvent, type ReactNode, useEffect } from "react";
import PostCompressionUtility from "../utils/postsCompressionUtil";
import { useAuth } from "react-oidc-context";

export default function CreatePost() {
  const auth = useAuth();
  const access_token = auth.user?.access_token;
  const [images, setImages] = useState<File[]>([]);
  const [audio, setAudio] = useState<File | null>(null);
  const [processedAudio, setProcessedAudio] = useState<File | null>(null); // Add this
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [errors, setErrors] = useState({
    images: "",
    caption: "",
    tags: ""
  });

  useEffect(() => {
    let objectUrl: string | null = null;
    if (processedAudio) {
      objectUrl = URL.createObjectURL(processedAudio);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [processedAudio]);


  // SVG Icons as components - Custom implementation
  const ImageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const MusicIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
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

  const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const ChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ChevronRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

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

  // Custom Button component
  const Button = ({
    children,
    className = "",
    onClick,
    disabled = false,
    type = "button"
  }: {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }) => {
    return (
      <button
        type={type}
        className={`px-4 py-2 rounded-full font-medium transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  const validateForm = () => {
    const newErrors = {
      images: images.length === 0 ? "At least one image is required" : "",
      caption: caption.trim().length === 0 ? "Caption is required" : "",
      tags: tags.trim().length === 0 ? "At least one tag is required" : ""
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      if (images.length + newImages.length <= 5) {
        setImages([...images, ...newImages]);
        setErrors({ ...errors, images: "" });
      } else {
        alert("Maximum 5 images allowed");
      }
    }
  };

  const handleAudioChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudio(file);

      // Process audio immediately to get trimmed version for preview
      try {
        const trimmedAudio = await PostCompressionUtility.trimAudio(file);
        setProcessedAudio(trimmedAudio);
      } catch (error) {
        console.error('Audio processing failed:', error);
        setProcessedAudio(file); // Fallback to original
      }
    }
  };

  const handleCaptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
    if (e.target.value.trim().length > 0) {
      setErrors({ ...errors, caption: "" });
    }
  };

  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
    if (e.target.value.trim().length > 0) {
      setErrors({ ...errors, tags: "" });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeAudio = () => {
    setAudio(null);
    setProcessedAudio(null);
  };


  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handlePreview = () => {
    if (validateForm()) {
      setPreviewMode(true);
      setCurrentImageIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Compress images on submit
      const compressionStats = await PostCompressionUtility.compressImages(images);

      // Log compression results
      PostCompressionUtility.logCompressionStats(compressionStats);

      // Prepare files array with base64 encoding
      const files = [];

      // Add compressed images
      for (const result of compressionStats.files) {
        const base64Content = await fileToBase64(result.file);
        files.push({
          name: result.file.name,
          contentBase64: base64Content,
          type: result.file.type
        });
      }

      // Add audio if exists
      if (processedAudio) {
        const compressedAudio = await PostCompressionUtility.compressAudio(processedAudio);
        const base64Content = await fileToBase64(compressedAudio);
        files.push({
          name: compressedAudio.name,
          contentBase64: base64Content,
          type: compressedAudio.type
        });
      }

      // Prepare metadata
      const metadata = {
        caption: caption,
        tags: tags,
        from: "crinzpostsmeme", // or determine based on your logic
        visibility: "public",
        userId: auth.user?.profile?.sub // or wherever you store user ID
      };

      // Create the payload that matches Lambda expectations
      const payload = {
        action: "POSTCREATE",
        files: files,
        metadata: metadata
      };

      const res = await fetch(`${import.meta.env.VITE_BASE_API_URL}/addCrinzMemePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log("response:", responseData);

      // Reset form after successful submission
      setImages([]);
      setAudio(null);
      setProcessedAudio(null);
      setCaption("");
      setTags("");
      setPreviewMode(false);
      setErrors({ images: "", caption: "", tags: "" });

    } catch (error) {
      console.error("❌ Error submitting post:", error);
      alert('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/...;base64, prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

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
            <VisibilityToggle />

            <Button
              className="w-full mt-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/20 text-lg font-medium flex items-center justify-center gap-2 transition-all"
              onClick={handlePreview}
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