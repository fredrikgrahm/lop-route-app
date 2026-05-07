import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

function createNumberedIcon(number, type = "default") {
  const background =
    type === "start"
      ? "#22c55e"
      : type === "end"
      ? "#ef4444"
      : "#38bdf8";
  const color = type === "default" ? "#082f49" : "#ffffff";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:${background};
        width:32px;
        height:32px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:${color};
        font-weight:800;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createDirectionArrowIcon(angle) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        transform: rotate(${angle}deg);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #111;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });
}

function getBearing(from, to) {
  const [lat1, lon1] = from.map((deg) => (deg * Math.PI) / 180);
  const [lat2, lon2] = to.map((deg) => (deg * Math.PI) / 180);
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function App() {
  const [points, setPoints] = useState([]);
  const [route, setRoute] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function getRoute(nextPoints) {
    if (nextPoints.length < 2) {
      setRoute([]);
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    setIsLoading(true);

    try {
      const coordinates = nextPoints
        .map((point) => `${point[1]},${point[0]}`)
        .join(";");

      const footUrl = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`;

      const drivingUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

      let response = await fetch(footUrl);
      let data = await response.json();

      // fallback till bilvägar om gångväg misslyckas
      if (!data.routes || data.routes.length === 0) {
        response = await fetch(drivingUrl);
        data = await response.json();
      }

      if (!data.routes || data.routes.length === 0) {
        throw new Error("Ingen rutt hittades");
      }

      const routeCoordinates = data.routes[0].geometry.coordinates.map(
        (coord) => [coord[1], coord[0]]
      );

      setRoute(routeCoordinates);

      const distanceInKm = data.routes[0].distance / 1000;

      setDistanceKm(distanceInKm);

      // löptempo
      const runningPaceMinPerKm = 6;

      setDurationMin(distanceInKm * runningPaceMinPerKm);
    } catch (error) {
      console.error("Fel vid hämtning av rutt:", error);

      setRoute([]);
      setDistanceKm(0);
      setDurationMin(0);

      alert("Kunde inte skapa rutt.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleMapClick(point) {
    const nextPoints = [...points, point];

    setPoints(nextPoints);

    getRoute(nextPoints);
  }

  function handlePointDrag(index, e) {
    const nextPoints = [...points];
    const { lat, lng } = e.target.getLatLng();

    nextPoints[index] = [lat, lng];
    setPoints(nextPoints);
    getRoute(nextPoints);
  }

  function undoLastPoint() {
    const nextPoints = points.slice(0, -1);

    setPoints(nextPoints);

    getRoute(nextPoints);
  }

  function clearRoute() {
    setPoints([]);
    setRoute([]);
    setDistanceKm(0);
    setDurationMin(0);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Löp</p>

          <h1>Planera din runda</h1>

          <p className="muted">
            Klicka ut punkter på kartan. Appen försöker använda gång- och
            cykelvägar först.
          </p>
        </div>

        <div className="stats">
          <div>
            <span>Punkter</span>
            <strong>{points.length}</strong>
          </div>

          <div>
            <span>Distans</span>
            <strong>{distanceKm.toFixed(2)} km</strong>
          </div>

          <div>
            <span>Tid</span>

            <strong>
              {durationMin >= 60
                ? `${Math.floor(durationMin / 60)} h ${Math.round(
                    durationMin % 60
                  )} min`
                : `${Math.round(durationMin)} min`}
            </strong>
          </div>

          <div>
            <span>Status</span>

            <strong>{isLoading ? "Hämtar" : "Klar"}</strong>
          </div>
        </div>

        <div className="actions">
          <button className="primary">Spara rutt</button>

          <button>Dela</button>

          <button onClick={undoLastPoint} disabled={points.length === 0}>
            Ångra senaste punkt
          </button>

          <button onClick={clearRoute} disabled={points.length === 0}>
            Rensa
          </button>
        </div>

        <div className="hint">
          Tips: sätt ut flera punkter för att styra rutten mer exakt. Dra en punkt för att justera vägen.
        </div>
      </aside>

      <main className="mapArea">
        <MapContainer
          center={[58.3478, 11.9424]}
          zoom={13}
          className="map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {points.map((point, index) => {
            const type =
              index === 0 ? "start" : index === points.length - 1 ? "end" : "default";

            return (
              <Marker
                key={index}
                position={point}
                draggable
                eventHandlers={{
                  dragend: (e) => handlePointDrag(index, e),
                }}
                icon={createNumberedIcon(index + 1, type)}
              />
            );
          })}

          {route.length > 1 && (
            <>
              {route.slice(0, -1)
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
      </main>
    </div>
  );
}

export default App;