// components/EditPostModal.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import type { CrinzMessage } from "../hooks/UserInfo";

interface EditPostModalProps {
  post: CrinzMessage;
  onClose: () => void;
  onSave: (updatedPost: CrinzMessage) => void;
  loading?: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, onSave, loading = false }) => {
  const [message, setMessage] = useState(post.message);
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...post,
      message,
      tags: tags.length > 0 ? tags : undefined
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e1e',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid #333'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, color: '#fff', fontWeight: '600' }}>Edit Post</h3>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#888',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="message" style={{ marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              style={{
                padding: '12px',
                border: '1px solid #444',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '14px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                resize: 'vertical',
                minHeight: '100px'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="tags" style={{ marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
              Tags (optional)
            </label>

            {/* Tags display */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {tags.map((tag, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '16px',
                    fontSize: '14px'
                  }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Tag input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="tags"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag and press Enter"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#2a2a2a',
                  color: '#fff'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={addTag}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#059669')}
                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                disabled={loading || !newTag.trim()}
              >
                Add
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
              Add relevant tags to help others discover your post
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #555',
                borderRadius: '8px',
                background: '#2a2a2a',
                color: '#ccc',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditPostModal;