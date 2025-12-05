

interface VisibilityToggleProps {
    visibility: "public" | "private";
    onToggle: (newVisibility: "public" | "private") => void;
}

export const VisibilityToggle = ({ visibility, onToggle }: VisibilityToggleProps) => {
    const isPublic = visibility === "public";
    const handleToggle = () => onToggle(isPublic ? "private" : "public");

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
