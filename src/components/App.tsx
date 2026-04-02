// src/components/App.tsx - исправленная версия

'use client';

import React, { useState, useEffect } from "react";
import Main from "./Main";
import SocialNetwork from "../abis/SocialNetwork.json";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || "0xbC149F3E0dA2Ea347aE95A117ad7D11FC0318811";

interface AppPost {
  id: number;
  content: string;
  author: string;
  tipAmount: string;
  likeCount: number;
  imageHash?: string | null;
}

// Создаем публичный клиент
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

export default function App() {
  const { address } = useAccount();
  const [posts, setPosts] = useState<AppPost[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: postCount, refetch: refetchPostCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SocialNetwork.abi,
    functionName: "postCount",
  });

  const { 
    data: createPostHash, 
    writeContract: createPost, 
    isPending: isCreatePending,
    error: createError 
  } = useWriteContract();
  
  const { 
    data: tipPostHash, 
    writeContract: tipPost, 
    isPending: isTipPending,
    error: tipError 
  } = useWriteContract();
  
  const { 
    data: likePostHash, 
    writeContract: likePost, 
    isPending: isLikePending,
    error: likeError 
  } = useWriteContract();

  const {
    data: addCommentHash,
    writeContract: addComment,
    isPending: isCommentPending,
    error: commentError
  } = useWriteContract();

  const { isLoading: isConfirmingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createPostHash,
  });
  
  const { isLoading: isConfirmingTip, isSuccess: isTipSuccess } = useWaitForTransactionReceipt({
    hash: tipPostHash,
  });
  
  const { isLoading: isConfirmingLike, isSuccess: isLikeSuccess } = useWaitForTransactionReceipt({
    hash: likePostHash,
  });

  const { isLoading: isConfirmingComment, isSuccess: isCommentSuccess } = useWaitForTransactionReceipt({
    hash: addCommentHash,
  });

  // ✅ ИСПРАВЛЕННАЯ функция нормализации данных поста
  const normalizePostData = (data: any) => {
    // Логируем полученные данные для отладки
    console.log('Raw post data:', data);
    
    // Проверяем, что данные - это объект или массив
    if (!data) return null;
    
    // Если данные пришли как массив
    if (Array.isArray(data)) {
      // Определяем структуру по порядку полей в контракте
      // Структура Post: id, content, imageHash?, tipAmount, author, likeCount
      // Или: id, content, tipAmount, author, likeCount (без imageHash)
      
      // Пытаемся определить, есть ли imageHash в данных
      // Если строка во 2-м индексе выглядит как IPFS хеш (начинается с bafy или Qm)
      const secondField = data[1];
      const thirdField = data[2];
      
      let id, content, imageHash, tipAmount, author, likeCount;
      
      // Проверяем, является ли второй или третий параметр IPFS хешем
      const isIpfsHash = (str: string) => 
        typeof str === 'string' && (str.startsWith('bafy') || str.startsWith('Qm') || str.includes('ipfs'));
      
      if (isIpfsHash(thirdField)) {
        // Формат: [id, content, imageHash, tipAmount, author, likeCount]
        id = data[0];
        content = data[1];
        imageHash = data[2];
        tipAmount = data[3];
        author = data[4];
        likeCount = data[5];
      } else if (isIpfsHash(secondField)) {
        // Формат: [id, imageHash, tipAmount, author, likeCount] (без content?)
        id = data[0];
        imageHash = data[1];
        tipAmount = data[2];
        author = data[3];
        likeCount = data[4];
        content = "";
      } else {
        // Формат: [id, content, tipAmount, author, likeCount] (без imageHash)
        id = data[0];
        content = data[1];
        tipAmount = data[2];
        author = data[3];
        likeCount = data[4];
        imageHash = null;
      }
      
      return {
        id,
        content: content || "",
        imageHash: imageHash || null,
        tipAmount,
        author,
        likeCount,
      };
    }
    
    // Если данные пришли как объект
    if (typeof data === 'object') {
      return {
        id: data.id,
        content: data.content || "",
        imageHash: data.imageHash || null,
        tipAmount: data.tipAmount,
        author: data.author,
        likeCount: data.likeCount,
      };
    }
    
    return null;
  };

  // Загрузка постов из контракта
  const loadPosts = async () => {
    if (!postCount || Number(postCount) === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const postPromises = [];
      for (let i = 1; i <= Number(postCount); i++) {
        postPromises.push(
          publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: SocialNetwork.abi,
            functionName: 'posts',
            args: [BigInt(i)],
          })
        );
      }
      
      const results = await Promise.all(postPromises);
      const loadedPosts: AppPost[] = [];
      
      for (const result of results) {
        if (!result) continue;
        
        try {
          const rawPost = normalizePostData(result);
          if (!rawPost) continue;
          
          // Преобразуем author в строку
          let authorAddress = '0x0000000000000000000000000000000000000000';
          if (rawPost.author) {
            authorAddress = typeof rawPost.author === 'string' 
              ? rawPost.author 
              : String(rawPost.author);
          }
          
          // Извлекаем IPFS хеш, если он есть в контенте
          let imageHash = rawPost.imageHash;
          let cleanContent = rawPost.content || "";
          
          // Если imageHash не найден, ищем в контенте
          if (!imageHash && cleanContent) {
            const ipfsMatch = cleanContent.match(/\[Image: ipfs:\/\/([a-zA-Z0-9]+)\]/);
            if (ipfsMatch) {
              imageHash = ipfsMatch[1];
              cleanContent = cleanContent.replace(/\[Image: ipfs:\/\/[a-zA-Z0-9]+\]/, '').trim();
            }
          }
          
          // ✅ Безопасное преобразование tipAmount
          let tipAmountValue = "0";
          if (rawPost.tipAmount) {
            if (typeof rawPost.tipAmount === 'bigint') {
              tipAmountValue = rawPost.tipAmount.toString();
            } else if (typeof rawPost.tipAmount === 'string' && !rawPost.tipAmount.startsWith('bafy')) {
              tipAmountValue = rawPost.tipAmount;
            } else if (typeof rawPost.tipAmount === 'number') {
              tipAmountValue = rawPost.tipAmount.toString();
            }
          }
          
          // ✅ Безопасное преобразование likeCount
          let likeCountNum = 0;
          if (rawPost.likeCount) {
            if (typeof rawPost.likeCount === 'bigint') {
              likeCountNum = Number(rawPost.likeCount);
            } else if (typeof rawPost.likeCount === 'number') {
              likeCountNum = rawPost.likeCount;
            } else if (typeof rawPost.likeCount === 'string') {
              likeCountNum = parseInt(rawPost.likeCount) || 0;
            }
          }
          
          loadedPosts.push({
            id: Number(rawPost.id),
            content: cleanContent || "(No content)",
            author: authorAddress,
            tipAmount: tipAmountValue,
            likeCount: likeCountNum,
            imageHash: imageHash,
          });
        } catch (error) {
          console.error('Error processing post:', error);
        }
      }
      
      // ✅ Безопасная сортировка - проверяем, что tipAmount - это число
      loadedPosts.sort((a, b) => {
        const tipA = parseFloat(a.tipAmount) || 0;
        const tipB = parseFloat(b.tipAmount) || 0;
        return tipB - tipA;
      });
      
      setPosts(loadedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [postCount]);

  useEffect(() => {
    if (isCreateSuccess || isTipSuccess || isLikeSuccess || isCommentSuccess) {
      refetchPostCount();
      loadPosts();
    }
  }, [isCreateSuccess, isTipSuccess, isLikeSuccess, isCommentSuccess]);

  const handleCreatePost = async (content: string, imageHash?: string) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    if (!content || content.trim() === "") {
      console.error("The content of the post cannot be empty");
      return;
    }
    
    const imageHashValue = imageHash || "";
    
    createPost({
      address: CONTRACT_ADDRESS,
      abi: SocialNetwork.abi,
      functionName: "createPost",
      args: [content, imageHashValue],
    });
  };

  const handleTipPost = async (id: number, tipAmount: string) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      console.error("The tip amount must be more than 0");
      return;
    }
    
    tipPost({
      address: CONTRACT_ADDRESS,
      abi: SocialNetwork.abi,
      functionName: "tipPost",
      args: [id],
      value: parseEther(tipAmount),
    });
  };

  const handleLikePost = async (id: number) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    likePost({
      address: CONTRACT_ADDRESS,
      abi: SocialNetwork.abi,
      functionName: "likePost",
      args: [id],
    });
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    if (!content || content.trim() === "") {
      console.error("Comment cannot be empty");
      return;
    }
    
    addComment({
      address: CONTRACT_ADDRESS,
      abi: SocialNetwork.abi,
      functionName: "addComment",
      args: [postId, content],
    });
  };

  const isAnyPending = isCreatePending || isTipPending || isLikePending || isCommentPending;
  const isAnyConfirming = isConfirmingCreate || isConfirmingTip || isConfirmingLike || isConfirmingComment;
  const showLoading = loading || isAnyPending || isAnyConfirming;

  return (
    <div>
      {(createError || tipError || likeError || commentError) && (
        <div className="alert alert-danger m-3">
          Error: {createError?.message || tipError?.message || likeError?.message || commentError?.message}
        </div>
      )}
      
      {showLoading ? (
        <div className="text-center mt-5">
          <p>Loading/Waiting for a transaction...</p>
        </div>
      ) : (
        <Main
          posts={posts}
          createPost={handleCreatePost}
          tipPost={handleTipPost}
          likePost={handleLikePost}
          addComment={handleAddComment}
        />
      )}
    </div>
  );
}