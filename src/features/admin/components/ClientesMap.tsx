import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { formatCurrency, formatDate } from "@/lib/format";
import { ZONE_LABELS } from "@/lib/api/types";
import type { Sale } from "@/lib/api/types";

// Fix del ícono default de Leaflet (rutas de assets rotas con bundlers como Vite).
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CENTER: [number, number] = [-37.11, -56.86];

export default function ClientesMap({ sales }: { sales: Sale[] }) {
  const withGeo = sales.filter((s) => s.geo && s.geo.status !== "pending");

  return (
    <MapContainer center={CENTER} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withGeo.map((s) => (
        <Marker key={s.id} position={[s.geo!.lat, s.geo!.lng]} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{s.customer.nombre}</p>
              <p>{ZONE_LABELS[s.customer.zona] ?? s.customer.zona}</p>
              <p>{formatCurrency(s.total)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
