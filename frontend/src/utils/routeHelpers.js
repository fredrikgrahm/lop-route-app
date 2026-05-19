import L from "leaflet";

const WALKING_MINUTES_PER_KILOMETER = 12;

export function createNumberedIcon(number, type = "default") {
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

export function createDirectionArrowIcon(angle) {
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

export function getBearing(from, to) {
  const [lat1, lon1] = from.map((deg) => (deg * Math.PI) / 180);
  const [lat2, lon2] = to.map((deg) => (deg * Math.PI) / 180);
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function formatDuration(durationMin) {
  return durationMin >= 60
    ? `${Math.floor(durationMin / 60)} h ${Math.round(durationMin % 60)} min`
    : `${Math.round(durationMin)} min`;
}

export function serializePoints(points) {
  return points.map((point) => `${point[0]},${point[1]}`).join(";");
}

export function parsePointsFromUrl(search) {
  const urlParams = new URLSearchParams(search);
  const pointsParam = urlParams.get("points");

  if (!pointsParam) {
    return null;
  }

  const points = [];
  for (const coord of pointsParam.split(";")) {
    const [lat, lng] = coord.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    points.push([lat, lng]);
  }

  return points.length >= 2 ? points : null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Network error: ${response.status}`);
  }

  return response.json();
}

export async function fetchRouteForPoints(nextPoints) {
  if (nextPoints.length < 2) {
    return { routeCoordinates: [], distanceKm: 0, durationMin: 0 };
  }

  const coordinates = nextPoints.map((point) => `${point[1]},${point[0]}`).join(";");
  const footUrl = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson&steps=true`;

  let data = await fetchJson(footUrl);
  let totalDuration = 0;

  if (!data.routes || data.routes.length === 0) {
    const routeSegments = [];
    let totalDistance = 0;

    for (let i = 0; i < nextPoints.length - 1; i += 1) {
      const segmentCoords = [nextPoints[i], nextPoints[i + 1]]
        .map((point) => `${point[1]},${point[0]}`)
        .join(";");
      const segmentUrl = `https://router.project-osrm.org/route/v1/foot/${segmentCoords}?overview=full&geometries=geojson`;
      const segmentData = await fetchJson(segmentUrl);

      if (segmentData.routes && segmentData.routes.length > 0) {
        const segmentGeometry = segmentData.routes[0].geometry.coordinates;
        if (i === 0) {
          routeSegments.push(...segmentGeometry);
        } else {
          routeSegments.push(...segmentGeometry.slice(1));
        }

        totalDistance += segmentData.routes[0].distance;
        const segmentDistanceKm = segmentData.routes[0].distance / 1000;
        totalDuration += segmentDistanceKm * WALKING_MINUTES_PER_KILOMETER;
      } else {
        throw new Error(`Could not route between points ${i + 1} and ${i + 2}`);
      }
    }

    data = {
      routes: [
        {
          geometry: {
            coordinates: routeSegments,
          },
          distance: totalDistance,
        },
      ],
    };
  }

  if (!data.routes || data.routes.length === 0) {
    throw new Error("Ingen rutt hittades");
  }

  const routeCoordinates = data.routes[0].geometry.coordinates.map((coord) => [coord[1], coord[0]]);
  const distanceKm = data.routes[0].distance / 1000;
  const durationMin =
    totalDuration > 0
      ? totalDuration
      : data.routes[0].duration
      ? data.routes[0].duration / 60
      : 0;

  return { routeCoordinates, distanceKm, durationMin };
}
