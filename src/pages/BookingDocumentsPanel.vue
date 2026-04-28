<template>
  <v-card elevation="0" rounded="xl" class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <h4 class="text-subtitle-1 font-weight-bold d-flex align-center ga-2">
        <v-icon color="primary">mdi-file-document-multiple</v-icon>
        Documents
      </h4>
      <v-btn size="small" variant="tonal" color="primary" @click="showUpload = true">
        <v-icon start size="16">mdi-upload</v-icon> Upload
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

    <div v-if="documents.length === 0 && !loading" class="text-center pa-4">
      <v-icon size="48" color="grey-lighten-2">mdi-file-hidden</v-icon>
      <p class="text-body-2 text-medium-emphasis mt-2">No documents uploaded</p>
    </div>

    <div v-for="doc in documents" :key="doc.id" class="d-flex align-center ga-3 pa-3 mb-2 rounded-lg" style="background: rgba(0,0,0,0.03)">
      <v-icon :color="doc.contentType === 'application/pdf' ? 'red' : 'blue'">
        {{ doc.contentType === 'application/pdf' ? 'mdi-file-pdf-box' : 'mdi-file-image' }}
      </v-icon>
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium">{{ doc.fileName }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ doc.documentType === 'PASSPORT' ? 'Passport' : "Driver's License" }}
          · {{ (doc.fileSize / 1024).toFixed(0) }}KB
          · by {{ doc.uploadedBy }}
        </div>
      </div>
      <v-btn icon size="small" variant="text" @click="viewDoc(doc)">
        <v-icon>mdi-eye</v-icon>
      </v-btn>
      <v-btn icon size="small" variant="text" color="error" @click="handleDelete(doc.id)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </div>

    <!-- Upload dialog -->
    <v-dialog v-model="showUpload" max-width="500">
      <v-card rounded="xl" class="pa-4">
        <v-card-title>Upload Document</v-card-title>
        <v-card-text>
          <v-select
            v-model="uploadType"
            :items="[{ title: 'Passport', value: 'PASSPORT' }, { title: `Driver's License`, value: 'DRIVERS_LICENSE' }]"
            label="Document Type"
            variant="outlined" density="comfortable" rounded="lg"
          />
          <v-file-input
            v-model="uploadFile"
            label="Select file"
            accept="image/*,.pdf"
            variant="outlined" density="comfortable" rounded="lg"
            prepend-icon="mdi-paperclip"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUpload = false">Cancel</v-btn>
          <v-btn color="primary" :loading="uploading" :disabled="!uploadFile" @click="handleUpload">Upload</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Preview dialog -->
    <v-dialog v-model="previewDialog" max-width="900">
      <v-card rounded="xl">
        <v-card-title class="d-flex justify-space-between">
          {{ previewDoc?.fileName }}
          <v-btn icon variant="text" @click="previewDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <iframe v-if="previewDoc?.contentType === 'application/pdf'" :src="previewSrc" width="100%" height="700" style="border:none" />
          <v-img v-else :src="previewSrc" max-height="700" contain />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api, { BASE_URL } from '@/axios/api';

const props = defineProps<{ bookingId: number }>();

interface Doc {
  id: number; fileName: string; contentType: string;
  documentType: string; fileSize: number; uploadedBy: string;
}

const documents = ref<Doc[]>([]);
const loading = ref(false);
const uploading = ref(false);
const showUpload = ref(false);
const uploadType = ref('PASSPORT');
const uploadFile = ref<File[] | null>(null);
const previewDialog = ref(false);
const previewDoc = ref<Doc | null>(null);
const previewSrc = ref('');

async function fetchDocs() {
  loading.value = true;
  try {
    const { data } = await api.get(`/api/v1/bookings/${props.bookingId}/documents`);
    documents.value = data;
  } finally { loading.value = false; }
}

async function handleUpload() {
  if (!uploadFile.value?.length) return;
  uploading.value = true;
  try {
    const form = new FormData();
    form.append('file', uploadFile.value[0]);
    form.append('type', uploadType.value);
    form.append('uploadedBy', 'admin');
    await api.post(`/api/v1/bookings/${props.bookingId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    showUpload.value = false;
    uploadFile.value = null;
    await fetchDocs();
  } finally { uploading.value = false; }
}

async function handleDelete(docId: number) {
  await api.delete(`/api/v1/bookings/${props.bookingId}/documents/${docId}`);
  await fetchDocs();
}

function viewDoc(doc: Doc) {
  previewDoc.value = doc;
  previewSrc.value = `${BASE_URL}/api/v1/bookings/${props.bookingId}/documents/${doc.id}/download`;
  previewDialog.value = true;
}

onMounted(fetchDocs);
watch(() => props.bookingId, fetchDocs);
</script>
