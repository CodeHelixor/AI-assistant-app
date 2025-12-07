// Offline storage utility for caching essential information

const CACHE_KEY = 'guest_app_cache';
const CACHE_VERSION = 1;

export const saveToCache = (key, data) => {
  try {
    const cache = getCache();
    cache[key] = {
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

export const getFromCache = (key) => {
  try {
    const cache = getCache();
    const cached = cache[key];
    if (cached && cached.data) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const getCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    return {};
  }
};

export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const cachePropertyInfo = async (propertyId, apiCall) => {
  const cacheKey = `property_${propertyId}`;
  const cached = getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const data = await apiCall();
    saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    // Return cached data even if API fails
    return cached;
  }
};

export const cacheEssentialData = (propertyData, emergencyContacts, equipmentInstructions) => {
  saveToCache('property_essential', {
    property: propertyData,
    emergency: emergencyContacts,
    equipment: equipmentInstructions,
    cached_at: new Date().toISOString(),
  });
};

export const getEssentialData = () => {
  return getFromCache('property_essential');
};



