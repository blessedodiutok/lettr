// // File: apps/web/src/components/MapView.tsx
// // Google Maps component — loads the Maps JS API and renders listing pins

// "use client";

// import { Loader } from "@googlemaps/js-api-loader";
// import type {} from "@types/google.maps"; // ensures google.maps globals are in scope
// import { useEffect, useRef, useState } from "react";
// import { cn, formatNaira } from "../lib/utils";

// interface MapPin {
//   id: string;
//   latitude: number;
//   longitude: number;
//   annualRent: number;
//   title?: string;
// }

// interface MapViewProps {
//   pins: MapPin[];
//   center?: { lat: number; lng: number };
//   zoom?: number;
//   onPinClick?: (id: string) => void;
//   className?: string;
// }

// const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 }; // Lagos

// export function MapView({
//   pins,
//   center = DEFAULT_CENTER,
//   zoom = 12,
//   onPinClick,
//   className,
// }: MapViewProps) {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<google.maps.Map | null>(null);
//   const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
//       setError("Google Maps API key is not configured.");
//       setIsLoading(false);
//       return;
//     }

//     const loader = new Loader({
//       apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
//       version: "weekly",
//       libraries: ["marker"],
//     });

//     // Use importLibrary directly — loader.load() was removed in newer
//     // versions of @googlemaps/js-api-loader.
//     loader
//       .importLibrary("maps")
//       .then(({ Map }) => {
//         if (!mapRef.current) return;

//         mapInstanceRef.current = new Map(mapRef.current, {
//           center,
//           zoom,
//           mapId: "lettr-listings-map",
//           disableDefaultUI: false,
//           zoomControl: true,
//           mapTypeControl: false,
//           streetViewControl: false,
//           fullscreenControl: true,
//           styles: [
//             {
//               featureType: "poi",
//               elementType: "labels",
//               stylers: [{ visibility: "off" }],
//             },
//           ],
//         });

//         setIsLoading(false);
//       })
//       .catch(() => {
//         setError("Failed to load Google Maps.");
//         setIsLoading(false);
//       });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Add/update markers when pins change
//   useEffect(() => {
//     if (!mapInstanceRef.current || isLoading) return;

//     // Clear old markers
//     markersRef.current.forEach((m) => {
//       m.map = null;
//     });
//     markersRef.current = [];

//     pins.forEach(async (pin) => {
//       if (!pin.latitude || !pin.longitude) return;

//       const { AdvancedMarkerElement } = (await google.maps.importLibrary(
//         "marker",
//       )) as google.maps.MarkerLibrary;

//       // Price label as custom marker
//       const el = document.createElement("div");
//       el.className = [
//         "px-2 py-1 rounded-full text-xs font-bold cursor-pointer",
//         "bg-[#1A3C5E] text-white shadow-md",
//         "border-2 border-white",
//         "hover:scale-110 transition-transform duration-150",
//         "whitespace-nowrap",
//       ].join(" ");
//       el.textContent = formatNaira(pin.annualRent);
//       if (onPinClick) {
//         el.addEventListener("click", () => onPinClick(pin.id));
//       }

//       const marker = new AdvancedMarkerElement({
//         map: mapInstanceRef.current!,
//         position: { lat: pin.latitude, lng: pin.longitude },
//         content: el,
//         title: pin.title,
//       });

//       markersRef.current.push(marker);
//     });
//   }, [pins, isLoading, onPinClick]);

//   if (error) {
//     return (
//       <div
//         className={cn(
//           "flex items-center justify-center rounded-xl bg-muted",
//           "text-sm text-muted-foreground border border-border",
//           className,
//         )}
//       >
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={cn(
//         "relative rounded-xl overflow-hidden border border-border",
//         className,
//       )}
//     >
//       <div ref={mapRef} className="w-full h-full" />
//       {isLoading && (
//         <div className="absolute inset-0 flex items-center justify-center bg-muted">
//           <div className="flex flex-col items-center gap-3">
//             <div className="w-8 h-8 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
//             <p className="text-xs text-muted-foreground">Loading map…</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
