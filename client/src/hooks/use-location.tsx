import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationUpdate } from "@shared/schema";

interface UseLocationOptions {
  trackingInterval?: number; // in milliseconds
  enableHighAccuracy?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { trackingInterval = 60000, enableHighAccuracy = true } = options;
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const { toast } = useToast();

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: LocationUpdate) => {
      const res = await apiRequest("POST", "/api/location/update", locationData);
      return res.json();
    },
    onSuccess: (data) => {
      // If the server returns the updated distance, set it
      if (data.totalDistance) {
        setDistance(data.totalDistance);
      }
    },
    onError: (error) => {
      toast({
        title: "Location update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocation is not supported by your browser",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        updateLocationMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setError(error);
        toast({
          title: "Location error",
          description: getLocationErrorMessage(error),
          variant: "destructive",
        });
      },
      { enableHighAccuracy }
    );
  };

  const startTracking = () => {
    if (watchId !== null) {
      stopTracking();
    }

    setIsTracking(true);
    
    // Get initial position
    getCurrentPosition();
    
    // Set up interval for regular updates
    const intervalId = window.setInterval(() => {
      getCurrentPosition();
    }, trackingInterval);
    
    // Also watch for position changes (will be more frequent than the interval)
    const geoWatchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position);
        // We don't update the server on every watch update to avoid too many requests
      },
      (error) => {
        setError(error);
      },
      { enableHighAccuracy }
    );
    
    setWatchId(geoWatchId);
    
    return () => {
      window.clearInterval(intervalId);
      stopTracking();
    };
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const updateLocation = () => {
    getCurrentPosition();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Helper to get human-readable error messages
  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied. Please enable location services.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "Location request timed out.";
      default:
        return "An unknown error occurred.";
    }
  };

  return {
    currentLocation,
    error,
    isTracking,
    distance,
    updateLocation,
    startTracking,
    stopTracking,
    isUpdating: updateLocationMutation.isPending,
  };
}
