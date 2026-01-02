import { API_CONFIG } from '../config/api';
import { authStore } from '../store/authStore';

// ===================================
// I. TYPES & INTERFACES
// ===================================

export interface FaceVectorResponse {
  success: boolean;
  message?: string;
  data?: {
    vector: number[];
  };
}

// ===================================
// II. UTILS & MATH LOGIC
// ===================================

/**
 * Menghitung Cosine Similarity antara dua vektor.
 * Rumus: 
 * $$similarity = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  
  // Hindari pembagian dengan nol
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ===================================
// III. SERVICE LOGIC
// ===================================

const FACE_ENDPOINT = `${API_CONFIG.BASE_URL}/vektor-face`;

/**
 * Helper internal untuk mendapatkan auth header secara dinamis
 */
const getAuthHeaders = () => {
  const token = authStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

export const faceService = {
  /**
   * Mendaftarkan vektor wajah baru ke server
   */
  registerFaceVector: async (vector: number[]): Promise<FaceVectorResponse> => {
    try {
      console.log('📡 [FaceService] Registering face vector...');
      console.log('📍 Endpoint:', FACE_ENDPOINT);
      console.log('📊 Vector length:', vector.length);
      
      const headers = getAuthHeaders();
      console.log('🔑 Headers:', JSON.stringify(headers, null, 2));
      
      const body = JSON.stringify({ vector });
      console.log('📦 Body size:', body.length, 'bytes');
      
      const response = await fetch(FACE_ENDPOINT, {
        method: 'POST',
        headers,
        body,
      });

      console.log('✅ Response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📥 Response data:', JSON.stringify(result, null, 2));
      
      return {
        success: response.ok,
        message: result.message || (response.ok ? 'Wajah berhasil didaftarkan' : 'Gagal mendaftarkan wajah'),
        data: result.data,
      };
    } catch (error) {
      console.error('❌ [FaceService Register] Error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return { success: false, message: 'Terjadi kesalahan koneksi saat mendaftarkan wajah' };
    }
  },

  /**
   * Mengambil data vektor wajah user yang tersimpan
   */
  getUserFaceVector: async (): Promise<FaceVectorResponse> => {
    try {
      const response = await fetch(FACE_ENDPOINT, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message,
        data: result.data || result, // Handle jika data tidak di-wrap dalam properti data
      };
    } catch (error) {
      console.error('[FaceService Fetch]:', error);
      return { success: false, message: 'Gagal mengambil data vektor wajah' };
    }
  },
};