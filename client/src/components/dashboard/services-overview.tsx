import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@shared/schema";

interface ServicesOverviewProps {
  services: Service[];
}

// Define service images (using public CDN images as placeholders)
const serviceImages: Record<string, string> = {
  ac_repair: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
  refrigerator: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
  washing_machine: "https://images.pexels.com/photos/5816364/pexels-photo-5816364.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
  microwave: "https://images.pexels.com/photos/5202919/pexels-photo-5202919.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
  dishwasher: "https://images.pexels.com/photos/5824881/pexels-photo-5824881.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
  other: "https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=500&h=300"
};

export default function ServicesOverview({ services }: ServicesOverviewProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Our Services</h2>
        <Button variant="link" className="text-primary text-sm p-0">View All Services</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.length === 0 ? (
          <div className="col-span-full text-center py-8 text-neutral-medium">
            No services available
          </div>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <img 
                src={serviceImages[service.serviceType] || serviceImages.other}
                alt={`${service.name} service`}
                className="w-full h-40 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold">{service.name}</h3>
                <p className="text-sm text-neutral-medium mt-1">{service.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium">{service.techniciansCount} Technicians</span>
                  <span className={`px-2 py-1 ${
                    service.popularity === 'most_requested' 
                      ? 'bg-green-100 text-green-800' 
                      : service.popularity === 'popular' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                  } text-xs rounded-md`}>
                    {service.popularity === 'most_requested' 
                      ? 'Most Requested' 
                      : service.popularity === 'popular' 
                        ? 'Popular' 
                        : 'Regular'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
