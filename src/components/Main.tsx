'use client';

import React, { useState } from "react";

interface Post {
  id: number;
  content: string;
  author: string;
  tipAmount: string | number;
  likeCount?: number;
}

interface MainProps {
  posts: Post[];
  createPost: (content: string) => void;
  tipPost: (id: number, tipAmount: string) => void;
  likePost: (id: number) => void;
}

const AddressAvatar = ({ address, size = 30 }: { address: string; size?: number }) => {
  const getColorFromAddress = (addr: string) => {
    const hash = addr.slice(2, 8);
    return `#${hash}`;
  };

  const getInitials = (addr: string) => {
    return addr.slice(2, 4).toUpperCase();
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: getColorFromAddress(address),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
      }}
    >
      {getInitials(address)}
    </div>
  );
};

export default function Main({ posts, createPost, tipPost, likePost }: MainProps) {
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Для предпросмотра
  const [localImages, setLocalImages] = useState<{ [id: number]: string }>({});
  const [comments, setComments] = useState<{ [postId: number]: { id: number; content: string }[] }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Создаем пост
    createPost(postContent);
    
    // Если есть изображение, сохраняем его URL для предпросмотра
    // Но обратите внимание: реальное изображение должно сохраняться в IPFS или другом хранилище
    if (postImage) {
      const url = URL.createObjectURL(postImage);
      // Здесь нужно сохранить изображение в постоянное хранилище
      // Например, загрузить на IPFS и получить хеш
      console.log("Image to upload:", postImage.name);
      setImagePreview(url);
    }
    
    // Очищаем форму
    setPostContent("");
    setPostImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostImage(file);
      
      // Создаем превью
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const addComment = (postId: number, content: string) => {
    const newComment = { id: Date.now(), content };
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));
  };

  return (
    <div className="container mt-5">
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className="form-control mb-2"
          placeholder="What's on your mind?"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          rows={3}
          required
        />
        
        {/* Превью изображения */}
        {imagePreview && (
          <div className="mb-2">
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxHeight: '200px', maxWidth: '100%' }}
              className="img-fluid rounded"
            />
            <button
              type="button"
              className="btn btn-sm btn-danger mt-1"
              onClick={() => {
                setPostImage(null);
                setImagePreview(null);
              }}
            >
              Remove image
            </button>
          </div>
        )}
        
        <div className="d-flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="form-control"
            onChange={handleImageChange}
          />
          <button type="submit" className="btn btn-primary">
            Share Post
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <div className="text-center mt-5">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post: Post) => (
          <div className="card my-4" key={post.id}>
            <div className="card-header d-flex align-items-center">
              <AddressAvatar address={post.author} size={30} />
              <small className="text-muted ms-2">
                {post.author.slice(0, 6)}...{post.author.slice(-4)}
              </small>
            </div>
            <div className="card-body">
              <p className="card-text">{post.content}</p>

              {/* Отображение изображения поста */}
              {localImages[post.id] && (
                <img 
                  src={localImages[post.id]} 
                  className="img-fluid mt-2 rounded" 
                  alt="post"
                />
              )}

              <div className="mt-3">
                <h6>Comments:</h6>
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} className="border p-2 mb-2 rounded bg-light">
                    {c.content}
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem("comment") as HTMLInputElement;
                    if (input.value.trim()) {
                      addComment(post.id, input.value);
                      input.value = "";
                    }
                  }}
                >
                  <div className="input-group">
                    <input 
                      name="comment" 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="form-control" 
                      required 
                    />
                    <button type="submit" className="btn btn-outline-secondary">
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div>
                <button 
                  className="btn btn-sm btn-outline-primary me-2" 
                  onClick={() => likePost(post.id)}
                >
                  ❤️ Like ({post.likeCount || 0})
                </button>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => tipPost(post.id, "0.1")}
                >
                  💸 Tip 0.1 ETH
                </button>
              </div>
              <small className="text-muted">
                TIPS: {Number(post.tipAmount) / 1e18} ETH
              </small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}