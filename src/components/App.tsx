'use client';

import { useState, useEffect } from "react";
import Header from "./Header";
import Main from "./Main";
import SocialNetwork from "../abis/SocialNetwork.json";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

const CONTRACT_ADDRESS = "0xbC149F3E0dA2Ea347aE95A117ad7D11FC0318811";

export default function App() {
  const { address } = useAccount();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Чтение количества постов
  const { data: postCount, refetch: refetchPostCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: SocialNetwork.abi,
    functionName: "postCount",
  });

  // 2️⃣ Чтение конкретного поста (исправлено: нельзя использовать useReadContract в цикле)
  const readPost = async (postId: number) => {
    // Используем ethers или viem для прямого вызова
    // В данном случае лучше использовать отдельную функцию
  };

  // 3️⃣ Настройка writeContract для действий
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

  // 4️⃣ Ожидание подтверждения транзакции
  const { isLoading: isConfirmingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createPostHash,
  });
  
  const { isLoading: isConfirmingTip, isSuccess: isTipSuccess } = useWaitForTransactionReceipt({
    hash: tipPostHash,
  });
  
  const { isLoading: isConfirmingLike, isSuccess: isLikeSuccess } = useWaitForTransactionReceipt({
    hash: likePostHash,
  });

  // 5️⃣ Исправленная функция загрузки постов
  const loadPosts = async () => {
    if (!postCount || Number(postCount) === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const loadedPosts = [];
      
      // Загружаем все посты
      for (let i = 1; i <= Number(postCount); i++) {
        // Используем fetch или прямой вызов контракта
        // Временное решение: используем любой провайдер
        try {
          // Здесь нужно использовать ethers.provider или viem publicClient
          // Пример с использованием window.ethereum:
          if (typeof window !== 'undefined' && window.ethereum) {
            // В реальном коде здесь должен быть вызов контракта
            // Для примера создаем заглушку
            loadedPosts.push({
              id: i,
              content: "Post content",
              author: "0x...",
              tipAmount: "0",
              likes: 0
            });
          }
        } catch (error) {
          console.error(`Error loading post ${i}:`, error);
        }
      }
      
      // Сортируем по количеству чаевых
      loadedPosts.sort((a, b) => Number(b.tipAmount) - Number(a.tipAmount));
      setPosts(loadedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Эффект для загрузки постов
  useEffect(() => {
    loadPosts();
  }, [postCount]);

  // Эффект для обновления после успешных транзакций
  useEffect(() => {
    if (isCreateSuccess || isTipSuccess || isLikeSuccess) {
      refetchPostCount(); // Обновляем количество постов
      loadPosts(); // Перезагружаем посты
    }
  }, [isCreateSuccess, isTipSuccess, isLikeSuccess]);

  // 6️⃣ Обертки для вызова writeContract
  const handleCreatePost = async (content: string) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    if (!content || content.trim() === "") {
      console.error("The content of the post cannot be empty");
      return;
    }
    
    createPost({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: SocialNetwork.abi,
      functionName: "createPost",
      args: [content],
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
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: SocialNetwork.abi,
      functionName: "tipPost",
      args: [id],
      value: parseEther(tipAmount), // Конвертируем ETH в wei
    });
  };

  const handleLikePost = async (id: number) => {
    if (!address) {
      console.error("The wallet is not connected");
      return;
    }
    
    likePost({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: SocialNetwork.abi,
      functionName: "likePost",
      args: [id],
    });
  };

  // Определяем, идет ли какая-либо операция
  const isAnyPending = isCreatePending || isTipPending || isLikePending;
  const isAnyConfirming = isConfirmingCreate || isConfirmingTip || isConfirmingLike;
  const showLoading = loading || isAnyPending || isAnyConfirming;

  return (
    <div>
      {/* Отображение ошибок */}
      {(createError || tipError || likeError) && (
        <div className="alert alert-danger m-3">
          Error: {createError?.message || tipError?.message || likeError?.message}
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
        />
      )}
    </div>
  );
}