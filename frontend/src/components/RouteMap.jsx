import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import MapClickHandler from "./MapClickHandler";
import {
  createDirectionArrowIcon,
  createNumberedIcon,
  getBearing,
} from "../utils/routeHelpers";

export default function RouteMap({ points, route, onMapClick, onPointDrag }) {
  return (
    <MapContainer center={[58.3478, 11.9424]} zoom={13} className="map">
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onMapClick={onMapClick} />

      {points.map((point, index) => {
        const type =
          index === 0 ? "start" : index === points.length - 1 ? "end" : "default";

        return (
          <Marker
            key={index}
            position={point}
            draggable
            eventHandlers={{
              dragend: (e) => onPointDrag(index, e),
            }}
            icon={createNumberedIcon(index + 1, type)}
          />
        );
      })}

      {route.length > 1 && (
        <>
          {route
            .slice(0, -1)
            .map((point, index) => ({ point, index }))
            .filter(({ index }) => {
              const step = Math.max(1, Math.floor(route.length / 10));
              return index % step === 0;
            })
            .map(({ point, index }) => {
              const nextPoint = route[index + 1];
              const midpoint = [
                (point[0] + nextPoint[0]) / 2,
                (point[1] + nextPoint[1]) / 2,
              ];
              const bearing = getBearing(point, nextPoint);

              return (
                <Marker
                  key={`arrow-${index}`}
                  position={midpoint}
                  icon={createDirectionArrowIcon(bearing)}
                  interactive={false}
                />
              );
            })}

          <Polyline
            positions={route}
            pathOptions={{
              color: "#38bdf8",
              weight: 5,
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
