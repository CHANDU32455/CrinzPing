import { useState, useEffect, type ChangeEvent } from "react";
import { useAuth } from "react-oidc-context";
import PostCompressionUtility from "../../utils/postsCompressionUtil";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export const useCreatePost = () => {
    const auth = useAuth();
    const access_token = auth.user?.access_token;

    // State
    const [images, setImages] = useState<File[]>([]);
    const [audio, setAudio] = useState<File | null>(null);
    const [processedAudio, setProcessedAudio] = useState<File | null>(null);
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

    // Audio preview cleanup
    useEffect(() => {
        let objectUrl: string | null = null;
        if (processedAudio) {
            objectUrl = URL.createObjectURL(processedAudio);
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [processedAudio]);

    // Validation
    const validateForm = () => {
        const newErrors = {
            images: images.length === 0 ? "At least one image is required" : "",
            caption: caption.trim().length === 0 ? "Caption is required" : "",
            tags: tags.trim().length === 0 ? "At least one tag is required" : ""
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== "");
    };

    // Handlers
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

            try {
                const trimmedAudio = await PostCompressionUtility.trimAudio(file);
                setProcessedAudio(trimmedAudio);
            } catch (error) {
                console.error('Audio processing failed:', error);
                setProcessedAudio(file);
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

    const resetForm = () => {
        setImages([]);
        setAudio(null);
        setProcessedAudio(null);
        setCaption("");
        setTags("");
        setPreviewMode(false);
        setErrors({ images: "", caption: "", tags: "" });
    };

    // Helper
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const compressionStats = await PostCompressionUtility.compressImages(images);

            // Clean log for prod
            // PostCompressionUtility.logCompressionStats(compressionStats);

            const files = [];

            for (const result of compressionStats.files) {
                const base64Content = await fileToBase64(result.file);
                files.push({
                    name: result.file.name,
                    contentBase64: base64Content,
                    type: result.file.type
                });
            }

            if (processedAudio) {
                const compressedAudio = await PostCompressionUtility.compressAudio(processedAudio);
                const base64Content = await fileToBase64(compressedAudio);
                files.push({
                    name: compressedAudio.name,
                    contentBase64: base64Content,
                    type: compressedAudio.type
                });
            }

            const metadata = {
                caption: caption,
                tags: tags,
                from: "crinzpostsmeme",
                visibility: visibility,
                userId: auth.user?.profile?.sub
            };

            const payload = {
                action: "POSTCREATE",
                files: files,
                metadata: metadata
            };

            const res = await fetch(`${BASE_API_URL}${API_ENDPOINTS.CREATE_POST}`, {
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

            resetForm();

        } catch (error) {
            console.error("❌ Error submitting post:", error);
            alert('Failed to submit post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        // State
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

        // Actions
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
        handleSubmit,
        validateForm
    };
};
