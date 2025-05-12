import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { useLocation } from "@/hooks/use-location";
import { Card } from "@/components/ui/card";
import { User } from "@shared/schema";

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { currentLocation } = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  // Get technicians and helpers
  const { data: technicians = [] } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/technician'],
  });
  
  const { data: helpers = [] } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/helper'],
  });
  
  // Get locations for field staff
  const fieldStaff = [...technicians, ...helpers];
  
  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !initialized) {
      // Create map centered on a default location (can be updated later)
      mapRef.current = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 11); // Default to Delhi, India
      
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
  }, [initialized]);
  
  // Update map view if we have current location
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      const { latitude, longitude } = currentLocation.coords;
      mapRef.current.setView([latitude, longitude], 13);
      
      // Add marker for current location
      const marker = L.marker([latitude, longitude]).addTo(mapRef.current);
      marker.bindPopup("Your current location").openPopup();
      
      // Add circle to show accuracy
      const radius = currentLocation.coords.accuracy;
      L.circle([latitude, longitude], {
        radius,
        color: "#2563EB",
        fillColor: "#93C5FD",
        fillOpacity: 0.2,
      }).addTo(mapRef.current);
      
      return () => {
        marker.remove();
      };
    }
  }, [currentLocation]);
  
  // Add markers for field staff (simulated locations)
  useEffect(() => {
    if (!mapRef.current || fieldStaff.length === 0) return;
    
    // Simulate random locations around Delhi for demo purposes
    const markers = fieldStaff.map(staff => {
      // Generate a random offset from the center
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      // Create marker with simulated position
      const marker = L.marker([28.6139 + latOffset, 77.2090 + lngOffset]).addTo(mapRef.current!);
      
      // Add popup with staff info
      marker.bindPopup(`
        <strong>${staff.name}</strong><br>
        ${staff.role} - ${staff.specialization || 'General'}<br>
        <small>Last update: Just now</small>
      `);
      
      return marker;
    });
    
    // Cleanup
    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [fieldStaff, initialized]);
  
  return (
    <Card className="overflow-hidden">
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
              if (currentLocation) {
                const { latitude, longitude } = currentLocation.coords;
                mapRef.current?.setView([latitude, longitude], 13);
              }
            }}
          >
            <span className="material-icons">my_location</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
