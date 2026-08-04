import * as Location from "expo-location";

async function reverseGeocodeCoords(latitude, longitude) {
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (Array.isArray(addresses) && addresses.length > 0) {
      const item = addresses[0];
      const locality = item.city || item.district || item.name;
      const subregion = item.subregion;
      const region = item.region;
      const postalCode = item.postalCode;
      const country = item.country;

      const townOrDistrict = (locality && subregion && locality.toLowerCase() !== subregion.toLowerCase())
        ? `${locality}, ${subregion}`
        : locality || subregion;

      const parts = [
        item.street && item.street !== locality ? item.street : null,
        townOrDistrict,
        region,
        postalCode,
        country,
      ].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch {
    // Fallback to OSM Nominatim
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          "User-Agent": "ServiceHubMobile/1.0",
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // Ignore and fallback
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function getCurrentReadableLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Enable location permission and try again.");
  }

  let position = null;
  try {
    position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 12000,
    });
  } catch (err) {
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 8000,
      });
    } catch (fallbackErr) {
      position = null;
    }
  }

  if (!position?.coords) {
    throw new Error("Could not determine current location. Please check your GPS settings and try again.");
  }

  const { latitude, longitude } = position.coords;
  let city = "";
  let state = "";
  let postalCode = "";

  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (Array.isArray(addresses) && addresses.length > 0) {
      const item = addresses[0];
      city = item.city || item.district || item.name || item.subregion || "";
      state = item.region || "";
      postalCode = item.postalCode || "";
    }
  } catch {
    // Ignore
  }

  const readableAddress = await reverseGeocodeCoords(latitude, longitude);

  return {
    latitude,
    longitude,
    address: readableAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    city,
    state,
    postalCode,
    timestamp: new Date().toISOString(),
  };
}

export async function watchProviderLocation(onLocation, onError) {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Tracking starts only after provider consent.");
  }

  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
    },
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const readableAddress = await reverseGeocodeCoords(latitude, longitude);

        onLocation({
          latitude,
          longitude,
          address: readableAddress,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        onError?.(error);
      }
    }
  );
}

