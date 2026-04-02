// src/services/ipfs.ts - исправленная версия (ваш файл + небольшие улучшения)

class IPFSService {
  private jwt: string;
  private gateway: string = 'https://gateway.pinata.cloud';

  constructor() {
    // ✅ Добавлена проверка на window для SSR
    this.jwt = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PINATA_JWT || process.env.PINATA_JWT || ''
      : process.env.PINATA_JWT || '';
    
    if (!this.jwt) {
      console.warn('⚠️ PINATA_JWT is not configured. Image upload will not work.');
    } else {
      console.log('✅ IPFS Service initialized with Pinata JWT');
    }
  }

  async uploadFileToIPFS(file: File): Promise<{ hash: string; url: string }> {
    if (!this.jwt) {
      throw new Error('Pinata JWT is not configured. Please add NEXT_PUBLIC_PINATA_JWT to .env.local');
    }

    // Проверка размера файла
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Добавляем метаданные
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'social-network',
        timestamp: Date.now().toString(),
        type: file.type
      }
    }));

    // Настройки пинования
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    }));

    console.log('Uploading to Pinata...', { fileName: file.name, fileSize: file.size });

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinata error response:', errorText);
        
        let errorMessage = `Upload failed: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.reason || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      console.log('Upload successful:', { hash: data.IpfsHash });
      
      return {
        hash: data.IpfsHash,
        url: `${this.gateway}/ipfs/${data.IpfsHash}`,
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error;
    }
  }

  // Метод для получения URL изображения по хешу
  getImageUrl(hash: string): string {
    return `${this.gateway}/ipfs/${hash}`;
  }

  // Проверка статуса пина
  async checkPinStatus(hash: string): Promise<boolean> {
    if (!this.jwt) return false;

    try {
      const response = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${hash}`, {
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
        },
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.count > 0;
    } catch {
      return false;
    }
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
export const ipfsService = new IPFSService();