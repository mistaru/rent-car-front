<template>
  <div>
    <div v-for="docType in docTypes" :key="docType.value" class="mb-4">
      <div class="d-flex align-center ga-2 mb-2">
        <v-icon size="20" :color="getStatusColor(docType.value)">{{ docType.icon }}</v-icon>
        <span class="text-subtitle-2 font-weight-bold">{{ docType.label }}</span>
        <v-chip
          v-if="getFiles(docType.value).length > 0"
          size="x-small" color="success" variant="tonal"
        >
          Uploaded
        </v-chip>
      </div>

      <!-- Uploaded files -->
      <div v-for="doc in getFiles(docType.value)" :key="doc.id" class="d-flex align-center ga-2 mb-2 pa-2 rounded-lg" style="background: rgba(0,0,0,0.03)">
        <v-icon size="20" :color="doc.contentType === 'application/pdf' ? 'red' : 'blue'">
          {{ doc.contentType === 'application/pdf' ? 'mdi-file-pdf-box' : 'mdi-file-image' }}
        </v-icon>
        <span class="text-body-2 flex-grow-1 text-truncate">{{ doc.fileName }}</span>
        <v-btn icon size="x-small" variant="text" @click="preview(doc)">
          <v-icon size="16">mdi-eye</v-icon>
        </v-btn>
        <v-btn icon size="x-small" variant="text" color="error" @click="$emit('delete', doc.id)">
          <v-icon size="16">mdi-delete</v-icon>
        </v-btn>
      </div>

      <!-- Upload area -->
      <div
        v-if="getFiles(docType.value).length === 0"
        class="upload-zone pa-6 text-center rounded-xl"
        @dragover.prevent="dragOver = docType.value"
        @dragleave="dragOver = null"
        @drop.prevent="onDrop($event, docType.value)"
        :class="{ 'upload-zone--active': dragOver === docType.value }"
      >
        <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-cloud-upload-outline</v-icon>
        <p class="text-body-2 text-medium-emphasis mb-2">Drag & drop or click to upload</p>
        <v-btn
          size="small" variant="tonal" color="primary" rounded="lg"
          :loading="uploading"
          @click="openFilePicker(docType.value)"
        >
          Choose File
        </v-btn>
        <p class="text-caption text-medium-emphasis mt-2">JPG, PNG, PDF — max 10MB</p>
      </div>
    </div><input ref="fileInput" type="file" accept="image/*,.pdf" hidden @change="onFileSelected" />

    <!-- Preview dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ previewDoc?.fileName }}</span>
          <v-btn icon variant="text" @click="previewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <iframe
            v-if="previewDoc?.contentType === 'application/pdf'"
            :src="previewUrl"
            width="100%" height="600" style="border: none"
          />
          <v-img v-else :src="previewUrl" max-height="600" contain />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { BookingDoc } from '@/composables/useBookingDocuments';
import { BASE_URL } from '@/axios/api';

const props = defineProps<{
  documents: BookingDoc[];
  uploading: boolean;
  getDownloadUrl: (id: number) => string;
}>();

const emit = defineEmits<{
  upload: [file: File, type: 'PASSPORT' | 'DRIVERS_LICENSE'];
  delete: [docId: number];
}>();

const docTypes = [
  { value: 'PASSPORT' as const, label: 'Passport', icon: 'mdi-passport' },
  { value: 'DRIVERS_LICENSE' as const, label: "Driver's License", icon: 'mdi-card-account-details' },
];

const fileInput = ref<HTMLInputElement>();
const currentType = ref<'PASSPORT' | 'DRIVERS_LICENSE'>('PASSPORT');
const dragOver = ref<string | null>(null);
const previewDialog = ref(false);
const previewDoc = ref<BookingDoc | null>(null);
const previewUrl = ref('');

function getFiles(type: string) {
  return props.documents.filter(d => d.documentType === type);
}

function getStatusColor(type: string) {
  return getFiles(type).length > 0 ? 'success' : 'grey';
}

function openFilePicker(type: 'PASSPORT' | 'DRIVERS_LICENSE') {
  currentType.value = type;
  fileInput.value?.click();
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) emit('upload', file, currentType.value);
  if (fileInput.value) fileInput.value.value = '';
}

function onDrop(e: DragEvent, type: 'PASSPORT' | 'DRIVERS_LICENSE') {
  dragOver.value = null;
  const file = e.dataTransfer?.files?.[0];
  if (file) emit('upload', file, type);
}

function preview(doc: BookingDoc) {
  previewDoc.value = doc;
  previewUrl.value = BASE_URL + props.getDownloadUrl(doc.id);
  previewDialog.value = true;
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}
.upload-zone:hover,
.upload-zone--active {
  border-color: #673ab7;
  background: rgba(103, 58, 183, 0.04);
}
</style>
