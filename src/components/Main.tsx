// src/components/Main.tsx

'use client';

// src/components/Main.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ipfsService } from '../services/ipfs';

export interface Post {
  id: number;
  content: string;
  author: string;
  tipAmount: string | number;
  likeCount: number;
  imageHash?: string | null;
}

interface MainProps {
  posts: Post[];
  createPost: (content: string, imageHash?: string) => void;
  tipPost: (id: number, tipAmount: string) => void;
  likePost: (id: number) => void;
  addComment: (postId: number, content: string) => Promise<void>;
}

// Улучшенный компонент AddressAvatar с градиентом
const AddressAvatar = ({ address, size = 44 }: { address: string; size?: number }) => {
  const normalizeAddress = (addr: string): string => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') {
      return '0x0000000000000000000000000000000000000000';
    }
    if (typeof addr !== 'string') {
      return '0x0000000000000000000000000000000000000000';
    }
    if (!addr.startsWith('0x') && addr.length === 40) {
      return `0x${addr}`;
    }
    return addr;
  };

  const cleanAddress = normalizeAddress(address);
  
  const getGradientFromAddress = (addr: string): string => {
    if (addr === '0x0000000000000000000000000000000000000000') {
      return 'linear-gradient(135deg, #6c757d, #495057)';
    }
    const hash1 = addr.slice(2, 8);
    const hash2 = addr.slice(8, 14);
    const color1 = `#${hash1}`;
    const color2 = `#${hash2.padEnd(6, '0')}`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
  };

  const getInitials = (addr: string): string => {
    if (addr === '0x0000000000000000000000000000000000000000') {
      return '??';
    }
    const initials = addr.slice(2, 4);
    return initials.toUpperCase() || '??';
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: getGradientFromAddress(cleanAddress),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: Math.max(size * 0.35, 12),
        textTransform: 'uppercase',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '2px solid white',
      }}
    >
      {getInitials(cleanAddress)}
    </div>
  );
};

// Форматирование адреса
const formatDisplayAddress = (address: string): string => {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return 'Unknown';
  }
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Компонент комментария
const CommentItem = ({ comment }: { comment: { id: number; content: string; author?: string } }) => {
  return (
    <div className="comment-item">
      <div className="comment-avatar">
        <span>{comment.author && comment.author !== 'pending...' ? comment.author.slice(2, 4).toUpperCase() : '👤'}</span>
      </div>
      <div className="comment-content">
        <div className="comment-author">
          {comment.author && comment.author !== 'pending...' ? formatDisplayAddress(comment.author) : 'You'}
        </div>
        <div className="comment-text">{comment.content}</div>
      </div>
    </div>
  );
};

export default function Main({ posts, createPost, tipPost, likePost, addComment }: MainProps) {
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<{ [key: number]: boolean }>({});
  const [localComments, setLocalComments] = useState<{ [postId: number]: { id: number; content: string; author?: string }[] }>({});
  const [optimisticLikes, setOptimisticLikes] = useState<{ [postId: number]: boolean }>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("0xC48E3fc74f7fCec688A19589E0F36b8f121eDfce"); // Временно для теста

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
    if (!postContent.trim() && !postImage) {
      alert("Please add content or an image");
      return;
    }
    
    setIsUploading(true);
    
    try {
      let imageHash: string | undefined;
      
      if (postImage) {
        console.log("Starting upload to IPFS...", postImage.name);
        const result = await ipfsService.uploadFileToIPFS(postImage);
        imageHash = result.hash;
        console.log("Image uploaded successfully:", result.url);
      }
      
      createPost(postContent, imageHash);
      setPostContent("");
      setPostImage(null);
      setImagePreview(null);
      
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(errorMessage);
      alert(`Failed to upload: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large! Maximum 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }
      
      setPostImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setUploadError(null);
    }
  };

  const handleOptimisticLike = useCallback((postId: number) => {
    if (optimisticLikes[postId]) return;
    setOptimisticLikes(prev => ({ ...prev, [postId]: true }));
    likePost(postId);
    setTimeout(() => {
      setOptimisticLikes(prev => ({ ...prev, [postId]: false }));
    }, 2000);
  }, [likePost, optimisticLikes]);

  const handleAddComment = async (postId: number, content: string) => {
    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Отправляем комментарий в блокчейн
      await addComment(postId, content);
      
      // Добавляем комментарий локально с автором
      const newComment = {
        id: Date.now(),
        content: content.trim(),
        author: currentUser // Используем текущего пользователя
      };
      
      setLocalComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      
      console.log(`Comment added to post ${postId}:`, content);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const getDisplayComments = (postId: number) => {
    return localComments[postId] || [];
  };

  return (
    <div className="social-container">
      {/* Форма создания поста */}
      <div className="post-form-card">
        <div className="post-form-header">
          <h3>Create Post</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="post-input"
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={3}
            disabled={isUploading}
          />
          
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => {
                  setPostImage(null);
                  setImagePreview(null);
                  setUploadError(null);
                }}
                disabled={isUploading}
              >
                ✕ Remove image
              </button>
            </div>
          )}
          
          {uploadError && (
            <div className="error-message">
              <strong>Upload failed:</strong> {uploadError}
              <button onClick={() => setUploadError(null)}>Dismiss</button>
            </div>
          )}
          
          <div className="post-form-actions">
            <label className="image-upload-btn">
              📷 Upload Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                disabled={isUploading}
                hidden
              />
            </label>
            <button 
              type="submit" 
              className="submit-post-btn"
              disabled={isUploading || (!postContent.trim() && !postImage)}
            >
              {isUploading ? 'Uploading...' : 'Share Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Список постов */}
      {posts.length === 0 ? (
        <div className="empty-state">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post: Post) => (
          <div className="post-card" key={post.id}>
            {/* Шапка поста */}
            <div className="post-header">
              <AddressAvatar address={post.author} size={44} />
              <div className="post-author-info">
                <div className="author-name">{formatDisplayAddress(post.author)}</div>
                <div className="post-time">Posted just now</div>
              </div>
            </div>
            
            {/* Содержание поста */}
            <div className="post-content">
              <p className="post-text">{post.content}</p>
              
              {post.imageHash && (
                <div className="post-image-wrapper" onClick={() => setSelectedImage(`https://gateway.pinata.cloud/ipfs/${post.imageHash}`)}>
                  <img 
                    src={`https://gateway.pinata.cloud/ipfs/${post.imageHash}`}
                    className="post-image-display" 
                    alt="Post"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="image-zoom-overlay">
                    <span>🔍 Click to enlarge</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Статистика */}
            <div className="post-stats">
              <span>❤️ {post.likeCount + (optimisticLikes[post.id] ? 1 : 0)} likes</span>
              <span>💬 {getDisplayComments(post.id).length} comments</span>
              <span>💰 {(Number(post.tipAmount) / 1e18).toFixed(4)} ETH</span>
            </div>
            
            {/* Кнопки действий */}
            <div className="post-actions">
              <button 
                className={`action-btn like-btn ${optimisticLikes[post.id] ? 'liked' : ''}`}
                onClick={() => handleOptimisticLike(post.id)}
                disabled={optimisticLikes[post.id]}
              >
                ❤️ Like
              </button>
              <button
                className="action-btn tip-btn"
                onClick={() => tipPost(post.id, "0.1")}
              >
                💸 Tip 0.1 ETH
              </button>
            </div>
            
            {/* Комментарии */}
            <div className="comments-section">
              <h4>Comments ({getDisplayComments(post.id).length})</h4>
              
              {/* Список комментариев */}
              <div className="comments-list">
                {getDisplayComments(post.id).length === 0 ? (
                  <div className="no-comments">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  getDisplayComments(post.id).map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))
                )}
              </div>
              
              {/* Форма добавления комментария */}
              <form
                className="comment-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem("comment") as HTMLInputElement;
                  const commentText = input.value.trim();
                  if (commentText && !isSubmittingComment[post.id]) {
                    await handleAddComment(post.id, commentText);
                    input.value = "";
                  }
                }}
              >
                <input 
                  name="comment" 
                  type="text" 
                  placeholder="Write a comment..." 
                  className="comment-input"
                  disabled={isSubmittingComment[post.id]}
                />
                <button 
                  type="submit" 
                  className="comment-submit"
                  disabled={isSubmittingComment[post.id]}
                >
                  {isSubmittingComment[post.id] ? 'Sending...' : 'Post'}
                </button>
              </form>
            </div>
          </div>
        ))
      )}
      
      {/* Модальное окно для изображения */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setSelectedImage(null)}>&times;</span>
            <img src={selectedImage} alt="Full size" className="modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}