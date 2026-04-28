import { ref } from 'vue';
import api from '@/axios/api';

export interface BookingDoc {
  id: number;
  fileName: string;
  contentType: string;
  documentType: 'PASSPORT' | 'DRIVERS_LICENSE';
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  previewUrl?: string;
}

export function useBookingDocuments(bookingId: () => number | null) {
  const documents = ref<BookingDoc[]>([]);
  const uploading = ref(false);
  const loading = ref(false);

  async function fetchDocuments() {
    const id = bookingId();
    if (!id) return;
    loading.value = true;
    try {
      const { data } = await api.get(`/api/v1/bookings/${id}/documents`);
      documents.value = data;
    } finally {
      loading.value = false;
    }
  }

  async function uploadDocument(file: File, type: 'PASSPORT' | 'DRIVERS_LICENSE', uploadedBy = 'client') {
    const id = bookingId();
    if (!id) return;
    uploading.value = true;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      form.append('uploadedBy', uploadedBy);
      const { data } = await api.post(`/api/v1/bookings/${id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      documents.value.push(data);
      return data;
    } finally {
      uploading.value = false;
    }
  }

  async function deleteDocument(docId: number) {
    const id = bookingId();
    if (!id) return;
    await api.delete(`/api/v1/bookings/${id}/documents/${docId}`);
    documents.value = documents.value.filter(d => d.id !== docId);
  }

  function getDownloadUrl(docId: number): string {
    const id = bookingId();
    return `/api/v1/bookings/${id}/documents/${docId}/download`;
  }

  return { documents, uploading, loading, fetchDocuments, uploadDocument, deleteDocument, getDownloadUrl };
}
