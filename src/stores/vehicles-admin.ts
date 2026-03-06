import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface VehicleAdmin {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  bodyType: string;
  drivetrain: string;
  fuelType: string;
  transmission: string;
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
  bodyType: string;
  drivetrain: string;
  fuelType: string;
  transmission: string;
  pricePerDay: number;
  minPricePerDay: number | null;
  image: string;
  carClass: string;
  status: string;
  locationId: number | null;
  pricingTemplateId: number | null;
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

const API_BASE = 'http://localhost:8081';

export const useVehiclesAdminStore = defineStore('vehicles-admin', () => {
  const vehicles = ref<VehicleAdmin[]>([]);
  const locations = ref<LocationItem[]>([]);
  const blockedPeriods = ref<BlockedPeriod[]>([]);
  const loading = ref(false);

  async function fetchAllVehicles() {
    loading.value = true;
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/all`);
      if (!res.ok) throw new Error('Ошибка загрузки автомобилей');
      vehicles.value = await res.json();
    } catch (e) {
      console.error('fetchAllVehicles error:', e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations`);
      if (res.ok) {
        locations.value = await res.json();
      }
    } catch (e) {
      console.error('fetchLocations error:', e);
    }
  }

  async function createVehicle(data: VehicleFormData): Promise<VehicleAdmin | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Ошибка создания автомобиля');
      const created = await res.json();
      await fetchAllVehicles();
      return created;
    } catch (e) {
      console.error('createVehicle error:', e);
      return null;
    }
  }

  async function updateVehicle(id: number, data: VehicleFormData): Promise<VehicleAdmin | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Ошибка обновления автомобиля');
      const updated = await res.json();
      await fetchAllVehicles();
      return updated;
    } catch (e) {
      console.error('updateVehicle error:', e);
      return null;
    }
  }

  async function deleteVehicle(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка удаления автомобиля');
      await fetchAllVehicles();
      return true;
    } catch (e) {
      console.error('deleteVehicle error:', e);
      return false;
    }
  }

  // ===== Blocked Periods =====

  async function fetchBlockedPeriods() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/blocked-periods`);
      if (res.ok) blockedPeriods.value = await res.json();
    } catch (e) {
      console.error('fetchBlockedPeriods error:', e);
    }
  }

  async function fetchBlockedPeriodsByVehicle(vehicleId: number) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/blocked-periods/vehicle/${vehicleId}`);
      if (res.ok) return await res.json() as BlockedPeriod[];
      return [];
    } catch (e) {
      console.error('fetchBlockedPeriodsByVehicle error:', e);
      return [];
    }
  }

  async function createBlockedPeriod(data: CreateBlockedPeriodData): Promise<BlockedPeriod | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/blocked-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка создания блокировки');
      }
      const created = await res.json();
      await fetchBlockedPeriods();
      return created;
    } catch (e: any) {
      console.error('createBlockedPeriod error:', e);
      throw e;
    }
  }

  async function updateBlockedPeriod(id: number, data: CreateBlockedPeriodData): Promise<BlockedPeriod | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/blocked-periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка обновления блокировки');
      }
      const updated = await res.json();
      await fetchBlockedPeriods();
      return updated;
    } catch (e: any) {
      console.error('updateBlockedPeriod error:', e);
      throw e;
    }
  }

  async function deleteBlockedPeriod(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/blocked-periods/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка удаления блокировки');
      await fetchBlockedPeriods();
      return true;
    } catch (e) {
      console.error('deleteBlockedPeriod error:', e);
      return false;
    }
  }

  return {
    vehicles,
    locations,
    blockedPeriods,
    loading,
    fetchAllVehicles,
    fetchLocations,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    fetchBlockedPeriods,
    fetchBlockedPeriodsByVehicle,
    createBlockedPeriod,
    updateBlockedPeriod,
    deleteBlockedPeriod,
  };
});

