import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  bodyType: string;
  drivetrain: 'AWD' | '2WD' | '4WD';
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  transmission: 'Automatic' | 'Manual';
  pricePerDay: number;
  minPricePerDay: number | null;
  image: string;
  status: 'available' | 'booked' | 'unavailable';
  carClass: string;
  pricingTemplateName: string | null;
  pricingTemplateId: number | null;
}

export interface SearchParams {
  pickupLocation: number | null;
  pickupDate: string | null;
  pickupTime: string | null;
  dropoffDate: string | null;
  dropoffTime: string | null;
}

export interface Filters {
  carClass: string;
  drivetrain: string;
  fuelType: string;
  [key: string]: string; // dynamic attribute filters
}

export interface DynamicFilter {
  code: string;
  name: string;
  valueType: string;
  filterType: string; // 'radio' | 'select' | 'checkbox' | 'none'
  usedValues: string[];
  possibleValues: string[];
}

export interface LocationItem {
  id: number;
  name: string;
  city: string;
  country: string;
}

const API_BASE = 'http://localhost:8081';

export const useVehicleStore = defineStore('vehicles', () => {
  // Состояния
  const vehicles = ref<Vehicle[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const totalCount = ref(0);
  const totalPages = ref(0);
  const page = ref(0);
  const pageSize = ref(8);

  // Локации для выпадающих списков
  const locations = ref<LocationItem[]>([]);

  // Фильтры и параметры поиска
  const searchParams = ref<SearchParams>({
    pickupLocation: null,
    pickupDate: null,
    pickupTime: null,
    dropoffDate: null,
    dropoffTime: null,
  });

  const filters = ref<Filters>({
    carClass: '',
    drivetrain: 'all',
    fuelType: 'all',
  });

  // Для фильтров (можно получать из API, если появится)
  const carClasses = ref<string[]>([]);

  // Динамические фильтры из API
  const dynamicFilters = ref<DynamicFilter[]>([]);

  async function fetchDynamicFilters() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicle-attributes/filters`);
      if (res.ok) {
        dynamicFilters.value = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch dynamic filters', e);
    }
  }

  // Получение списка авто с фильтрами и пагинацией
  async function fetchVehicles() {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (filters.value.carClass) params.append('carClass', filters.value.carClass);
      if (filters.value.drivetrain && filters.value.drivetrain !== 'all') params.append('drivetrain', filters.value.drivetrain);
      if (filters.value.fuelType && filters.value.fuelType !== 'all') params.append('fuelType', filters.value.fuelType);
      // Send dynamic attribute filters as attr_CODE=value
      for (const df of dynamicFilters.value) {
        const val = filters.value[df.code];
        if (val && val !== 'all' && val !== '') {
          params.append(`attr_${df.code}`, val);
        }
      }
      if (searchParams.value.pickupLocation !== null) params.append('locationId', String(searchParams.value.pickupLocation));
      if (searchParams.value.pickupDate) params.append('pickupDate', searchParams.value.pickupDate);
      if (searchParams.value.dropoffDate) params.append('dropoffDate', searchParams.value.dropoffDate);
      params.append('page', String(page.value));
      params.append('size', String(pageSize.value));
      const res = await fetch(`${API_BASE}/api/v1/vehicles?${params.toString()}`);
      if (!res.ok) throw new Error('Ошибка загрузки автомобилей');
      const data = await res.json();
      vehicles.value = data.content;
      totalCount.value = data.totalElements;
      totalPages.value = data.totalPages;
      carClasses.value = [...new Set(data.content.map((v: Vehicle) => v.carClass))] as string[];
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
    } finally {
      loading.value = false;
    }
  }

  // Получить одно авто по id
  async function fetchVehicleById(id: number): Promise<Vehicle | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/v1/vehicles/${id}`);
      if (!res.ok) throw new Error('Автомобиль не найден');
      return await res.json();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Пагинация
  function nextPage() {
    if (page.value < totalPages.value - 1) {
      page.value++;
      fetchVehicles();
    }
  }
  function prevPage() {
    if (page.value > 0) {
      page.value--;
      fetchVehicles();
    }
  }
  function setPage(newPage: number) {
    if (newPage >= 0 && newPage < totalPages.value) {
      page.value = newPage;
      fetchVehicles();
    }
  }

  // Применить фильтры
  function applyFilters() {
    page.value = 0;
    fetchVehicles();
  }

  function resetFilters() {
    const reset: Filters = {
      carClass: '',
      drivetrain: 'all',
      fuelType: 'all',
    };
    // Clear dynamic attribute filters
    for (const df of dynamicFilters.value) {
      reset[df.code] = '';
    }
    filters.value = reset;
    page.value = 0;
    fetchVehicles();
  }

  function updateSearch(params: Partial<SearchParams>) {
    searchParams.value = { ...searchParams.value, ...params };
    page.value = 0;
    fetchVehicles();
  }

  async function fetchLocations() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/locations`);
      if (res.ok) {
        locations.value = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch locations', e);
    }
  }

  return {
    vehicles,
    loading,
    error,
    totalCount,
    totalPages,
    page,
    pageSize,
    searchParams,
    filters,
    carClasses,
    locations,
    dynamicFilters,
    fetchVehicles,
    fetchVehicleById,
    fetchLocations,
    fetchDynamicFilters,
    nextPage,
    prevPage,
    setPage,
    applyFilters,
    resetFilters,
    updateSearch,
  };
});
