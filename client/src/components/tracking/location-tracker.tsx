import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@shared/schema";

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationTrackerProps {
  fieldStaff?: User[];
  personalMode?: boolean;
  currentLocation?: GeolocationPosition | null;
  distance?: number;
}

export default function LocationTracker({
  fieldStaff = [],
  personalMode = false,
  currentLocation = null,
  distance = 0,
}: LocationTrackerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const [initialized, setInitialized] = useState(false);
  const pathRef = useRef<L.Polyline | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Default to Delhi, India
  
  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !initialized) {
      // Create map centered on a default location (can be updated later)
      mapRef.current = L.map(mapContainerRef.current).setView(mapCenter, 12);
      
      // Add tile layer (OpenStreetMap)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
      
      setInitialized(true);
    }
    
    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialized, mapCenter]);
  
  // Handle current location updates for personal mode
  useEffect(() => {
    if (!mapRef.current || !initialized || !personalMode || !currentLocation) return;
    
    const { latitude, longitude } = currentLocation.coords;
    
    // Remove previous marker and circle
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    
    // Update map view
    mapRef.current.setView([latitude, longitude], 15);
    
    // Add marker for current location
    const marker = L.marker([latitude, longitude]).addTo(mapRef.current);
    marker.bindPopup("Your current location").openPopup();
    markersRef.current.push(marker);
    
    // Add circle to show accuracy
    const radius = currentLocation.coords.accuracy;
    circleRef.current = L.circle([latitude, longitude], {
      radius,
      color: "#2563EB",
      fillColor: "#93C5FD",
      fillOpacity: 0.2,
    }).addTo(mapRef.current);
    
    // If we don't have a path yet, create one
    if (!pathRef.current) {
      pathRef.current = L.polyline([], {
        color: "#2563EB",
        weight: 3,
        opacity: 0.7,
        lineJoin: "round",
      }).addTo(mapRef.current);
    }
    
    // Add current position to the path
    const currentPath = pathRef.current.getLatLngs() as L.LatLng[];
    currentPath.push(L.latLng(latitude, longitude));
    pathRef.current.setLatLngs(currentPath);
    
    // If we have enough points, show the distance on the map
    if (currentPath.length > 1 && distance > 0) {
      const midpoint = currentPath[Math.floor(currentPath.length / 2)];
      L.marker([midpoint.lat, midpoint.lng], {
        icon: L.divIcon({
          className: 'distance-marker',
          html: `<div class="bg-white px-2 py-1 rounded shadow text-xs">${distance.toFixed(2)} km</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        })
      }).addTo(mapRef.current);
    }
    
  }, [currentLocation, personaMode, initialized, distance]);
  
  // Handle field staff markers for admin/management view
  useEffect(() => {
    if (!mapRef.current || !initialized || personalMode || fieldStaff.length === 0) return;
    
    // Remove previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add a marker for each field staff member with a simulated location
    const markers = fieldStaff.map(staff => {
      // Generate a random offset from the center for demo purposes
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      // Create a custom icon based on staff role
      const roleIcon = L.divIcon({
        className: 'staff-marker',
        html: `<div class="${
          staff.role === 'technician' 
            ? 'bg-blue-600' 
            : 'bg-green-600'
        } text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
          <span class="material-icons text-sm">${
            staff.role === 'technician' ? 'engineering' : 'handyman'
          }</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      
      // Create marker with simulated position and custom icon
      const marker = L.marker([mapCenter[0] + latOffset, mapCenter[1] + lngOffset], {
        icon: roleIcon
      }).addTo(mapRef.current!);
      
      // Add popup with staff info
      marker.bindPopup(`
        <strong>${staff.name}</strong><br>
        ${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)} - ${staff.specialization || 'General'}<br>
        <small>Last update: Just now</small>
      `);
      
      // Also add simulated paths for some staff members
      if (Math.random() > 0.5) {
        // Create a random path
        const pathPoints = [];
        const numPoints = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numPoints; i++) {
          const randomLat = mapCenter[0] + latOffset + (Math.random() - 0.5) * 0.05;
          const randomLng = mapCenter[1] + lngOffset + (Math.random() - 0.5) * 0.05;
          pathPoints.push([randomLat, randomLng]);
        }
        
        // Add the current position as the last point
        pathPoints.push([mapCenter[0] + latOffset, mapCenter[1] + lngOffset]);
        
        // Create the path
        L.polyline(pathPoints as L.LatLngExpression[], {
          color: staff.role === 'technician' ? '#2563EB' : '#10B981',
          weight: 3,
          opacity: 0.7,
          dashArray: staff.role === 'helper' ? '5, 5' : '',
        }).addTo(mapRef.current!);
      }
      
      return marker;
    });
    
    markersRef.current = markers;
    
  }, [fieldStaff, initialized, personalMode, mapCenter]);
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative" style={{ height: "500px" }}>
          <div ref={mapContainerRef} className="w-full h-full" />
          
          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button 
              className="p-2 bg-white rounded-md shadow-md"
              onClick={() => mapRef.current?.zoomIn()}
            >
              <span className="material-icons">add</span>
            </button>
            <button 
              className="p-2 bg-white rounded-md shadow-md"
              onClick={() => mapRef.current?.zoomOut()}
            >
              <span className="material-icons">remove</span>
            </button>
            <button className="p-2 bg-white rounded-md shadow-md">
              <span className="material-icons">layers</span>
            </button>
            <button 
              className="p-2 bg-white rounded-md shadow-md"
              onClick={() => {
                if (personalMode && currentLocation) {
                  const { latitude, longitude } = currentLocation.coords;
                  mapRef.current?.setView([latitude, longitude], 15);
                } else {
                  mapRef.current?.setView(mapCenter, 12);
                }
              }}
            >
              <span className="material-icons">my_location</span>
            </button>
          </div>
          
          {/* Distance info overlay for personal mode */}
          {personalMode && (
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md">
              <h3 className="font-medium text-sm mb-1">Tracking Summary</h3>
              <div className="text-sm text-neutral-dark">
                <div className="flex items-center mb-1">
                  <span className="material-icons text-sm mr-1">straighten</span>
                  <span>Distance: <strong>{distance.toFixed(2)} km</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-sm mr-1">update</span>
                  <span>Last Update: <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
