import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/axios/api';

export interface VehicleAdmin {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  pricePerDay: number;
  minPricePerDay: number | null;
  image: string;
  status: string;
  carClass: string;
  pricingTemplateName: string | null;
  pricingTemplateId: number | null;
  locationId: number | null;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  licensePlate: string;
  pricePerDay: number;
  minPricePerDay: number | null;
  image: string;
  carClass: string;
  status: string;
  locationId: number | null;
  pricingTemplateId: number | null;
  attributes?: Record<string, string>;
}

export interface LocationItem {
  id: number;
  name: string;
  city: string;
  country: string;
}

export interface BlockedPeriod {
  id: number;
  vehicleId: number;
  vehicleName: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
}

export interface CreateBlockedPeriodData {
  vehicleId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface VehicleImage {
  id: number;
  vehicleId: number;
  filename: string;
  mimeType: string;
  main: boolean;
  sortOrder: number;
  url: string; // относительный путь, используй BASE_URL + url
}

export const useVehiclesAdminStore = defineStore('vehicles-admin', () => {
  const vehicles = ref<VehicleAdmin[]>([]);
  const vehicleImages = ref<Record<number, VehicleImage[]>>({});
  const locations = ref<LocationItem[]>([]);
  const blockedPeriods = ref<BlockedPeriod[]>([]);
  const loading = ref(false);

  async function fetchAllVehicles() {
    loading.value = true;
    try {
      vehicles.value = await api.get<VehicleAdmin[]>('/api/v1/vehicles/all');
    } catch (e) {
      console.error('fetchAllVehicles error:', e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchImages(vehicleId: number) {
    try {
      const images = await api.get<VehicleImage[]>(`/api/v1/vehicle-images/vehicle/${vehicleId}`);
      vehicleImages.value[vehicleId] = images;
    } catch (e) {
      console.error('fetchImages error:', e);
    }
  }

  async function fetchLocations() {
    try {
      locations.value = await api.get<LocationItem[]>(`/api/v1/locations`);
    } catch (e) {
      console.error('fetchLocations error:', e);
    }
  }

  async function createVehicle(data: VehicleFormData): Promise<VehicleAdmin | null> {
    try {
      const created = await api.post<VehicleAdmin>('/api/v1/vehicles', data);
      await fetchAllVehicles();
      return created;
    } catch (e) {
      console.error('createVehicle error:', e);
      return null;
    }
  }

  async function updateVehicle(id: number, data: VehicleFormData): Promise<VehicleAdmin | null> {
    try {
      const updated = await api.put<VehicleAdmin>(`/api/v1/vehicles/${id}`, data);
      await fetchAllVehicles();
      return updated;
    } catch (e) {
      console.error('updateVehicle error:', e);
      return null;
    }
  }

  async function deleteVehicle(id: number): Promise<boolean> {
    try {
      await api.delete(`/api/v1/vehicles/${id}`);
      await fetchAllVehicles();
      return true;
    } catch (e) {
      console.error('deleteVehicle error:', e);
      return false;
    }
  }

  async function uploadImage(vehicleId: number, file: File, isMain = false): Promise<VehicleImage | null> {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('isMain', String(isMain));
      const image = await api.post<VehicleImage>(
        `/api/v1/vehicle-images/vehicle/${vehicleId}`, form
      );
      await fetchImages(vehicleId);
      return image;
    } catch (e) {
      console.error('uploadImage error:', e);
      return null;
    }
  }

  async function setMainImage(imageId: number, vehicleId: number) {
    try {
      await api.patch(`/api/v1/vehicle-images/${imageId}/set-main`);
      await fetchImages(vehicleId);
    } catch (e) {
      console.error('setMainImage error:', e);
    }
  }

  async function deleteImage(imageId: number, vehicleId: number) {
    try {
      await api.delete(`/api/v1/vehicle-images/${imageId}`);
      await fetchImages(vehicleId);
    } catch (e) {
      console.error('deleteImage error:', e);
    }
  }

  // ===== Blocked Periods =====

  async function fetchBlockedPeriods() {
    try {
      blockedPeriods.value = await api.get<BlockedPeriod[]>('/api/v1/vehicles/blocked-periods');
    } catch (e) {
      console.error('fetchBlockedPeriods error:', e);
    }
  }

  async function fetchBlockedPeriodsByVehicle(vehicleId: number) {
    try {
      return await api.get<BlockedPeriod[]>(`/api/v1/vehicles/blocked-periods/vehicle/${vehicleId}`);
    } catch (e) {
      console.error('fetchBlockedPeriodsByVehicle error:', e);
      return [];
    }
  }

  async function createBlockedPeriod(data: CreateBlockedPeriodData): Promise<BlockedPeriod | null> {
    try {
      const created = await api.post<BlockedPeriod>('/api/v1/vehicles/blocked-periods', data);
      await fetchBlockedPeriods();
      return created;
    } catch (e: any) {
      console.error('createBlockedPeriod error:', e);
      throw e;
    }
  }

  async function updateBlockedPeriod(id: number, data: CreateBlockedPeriodData): Promise<BlockedPeriod | null> {
    try {
      const updated = await api.put<BlockedPeriod>(`/api/v1/vehicles/blocked-periods/${id}`, data);
      await fetchBlockedPeriods();
      return updated;
    } catch (e: any) {
      console.error('updateBlockedPeriod error:', e);
      throw e;
    }
  }

  async function deleteBlockedPeriod(id: number): Promise<boolean> {
    try {
      await api.delete(`/api/v1/vehicles/blocked-periods/${id}`);
      await fetchBlockedPeriods();
      return true;
    } catch (e) {
      console.error('deleteBlockedPeriod error:', e);
      return false;
    }
  }

  return {
    vehicles,
    vehicleImages,
    locations,
    blockedPeriods,
    loading,
    fetchAllVehicles,
    fetchLocations,
    fetchImages,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    uploadImage,
    setMainImage,
    deleteImage,
    fetchBlockedPeriods,
    fetchBlockedPeriodsByVehicle,
    createBlockedPeriod,
    updateBlockedPeriod,
    deleteBlockedPeriod,
  };
});

