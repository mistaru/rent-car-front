<script setup lang="ts">
import { useUsersStore } from '@/stores/permissions';
import { VDataTable } from 'vuetify/components';

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Название', key: 'name.description' },
];
const loading = ref(false);
const usersStore = useUsersStore();
const fetchPermissions = () => {
  loading.value = true;
  usersStore.fetchPermissions()
    .finally(() => loading.value = false);
};
fetchPermissions();

</script>

<template>
  <v-container fluid class="admin-page pa-6">
    <!-- Page header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
        <v-icon size="22">mdi-key-outline</v-icon>
      </v-avatar>
      <div>
        <h1 class="text-h5 font-weight-bold">Доступы</h1>
        <p class="text-caption text-medium-emphasis">Список системных разрешений</p>
      </div>
    </div>

    <v-card elevation="0" rounded="xl" class="admin-card">
      <v-data-table
        :headers="headers"
        :items="usersStore.permissions"
        :loading="loading"
        item-value="id"
        hover
        class="admin-table"
      />
    </v-card>
  </v-container>
</template>

<style scoped>
.admin-page {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.admin-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.admin-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}
</style>
