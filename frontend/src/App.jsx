import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import RouteMap from "./components/RouteMap";
import Sidebar from "./components/Sidebar";
import {
  fetchRouteForPoints,
  parsePointsFromUrl,
  serializePoints,
} from "./utils/routeHelpers";

function getInitialPoints() {
  return parsePointsFromUrl(window.location.search) || [];
}

function getInitialSavedRoutes() {
  const saved = localStorage.getItem("lopRouteSavedRoutes");

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.warn("Failed to parse saved routes:", error);
    return [];
  }
}

function App() {
  const [points, setPoints] = useState(getInitialPoints);
  const [route, setRoute] = useState([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState(getInitialSavedRoutes);
  const [routeName, setRouteName] = useState("");
  const [showSavedRoutesOnly, setShowSavedRoutesOnly] = useState(false);

  useEffect(() => {
    const loadedPoints = getInitialPoints();
    if (loadedPoints.length >= 2) {
      void getRoute(loadedPoints);
    }
  }, []);

  function persistSavedRoutes(routes) {
    localStorage.setItem("lopRouteSavedRoutes", JSON.stringify(routes));
  }

  function saveRoute() {
    if (points.length < 2) {
      alert("Lägg till minst två punkter innan du sparar rutten.");
      return;
    }

    const name = routeName.trim() || `Rutt ${savedRoutes.length + 1}`;
    const newRoute = {
      id: Date.now(),
      name,
      points,
      distanceKm,
      durationMin,
      createdAt: new Date().toISOString(),
    };

    const nextSavedRoutes = [newRoute, ...savedRoutes];
    setSavedRoutes(nextSavedRoutes);
    persistSavedRoutes(nextSavedRoutes);
    setRouteName("");
  }

  function loadSavedRoute(savedRoute) {
    setPoints(savedRoute.points);
    getRoute(savedRoute.points);
  }

  function deleteSavedRoute(id) {
    const nextSavedRoutes = savedRoutes.filter((route) => route.id !== id);
    setSavedRoutes(nextSavedRoutes);
    persistSavedRoutes(nextSavedRoutes);
  }

  function renameSavedRoute(id) {
    const routeToRename = savedRoutes.find((route) => route.id === id);
    if (!routeToRename) return;

    const name = window.prompt("Skriv nytt namn för rutten:", routeToRename.name);
    if (name === null) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    const nextSavedRoutes = savedRoutes.map((route) =>
      route.id === id ? { ...route, name: trimmed } : route
    );

    setSavedRoutes(nextSavedRoutes);
    persistSavedRoutes(nextSavedRoutes);
  }

  function removePoint(index) {
    const nextPoints = points.filter((_, pointIndex) => pointIndex !== index);
    setPoints(nextPoints);
    getRoute(nextPoints);
  }

  function shareRoute() {
    if (points.length < 2) {
      alert("Lägg till minst två punkter innan du delar rutten.");
      return;
    }

    const pointsParam = serializePoints(points);
    const shareUrl = `${window.location.origin}${window.location.pathname}?points=${encodeURIComponent(pointsParam)}`;

    if (navigator.share) {
      navigator.share({
        title: "Min löprunda",
        text: `Kolla min löprunda: ${distanceKm.toFixed(2)} km, ${Math.round(durationMin)} min`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert("Länken till rutten har kopierats till urklipp!");
        })
        .catch(() => {
          alert(`Kopiera denna länk: ${shareUrl}`);
        });
    }
  }

  async function getRoute(nextPoints) {
    if (nextPoints.length < 2) {
      setRoute([]);
      setDistanceKm(0);
      setDurationMin(0);
      return;
    }

    setIsLoading(true);

    try {
      const { routeCoordinates, distanceKm, durationMin } = await fetchRouteForPoints(
        nextPoints
      );

      setRoute(routeCoordinates);
      setDistanceKm(distanceKm);
      setDurationMin(durationMin);
    } catch (error) {
      console.error("Fel vid hämtning av rutt:", error);
      setRoute([]);
      setDistanceKm(0);
      setDurationMin(0);
      alert("Kunde inte skapa rutt. Kontrollera nätverksanslutningen.");
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
        <Sidebar
          points={points}
          distanceKm={distanceKm}
          durationMin={durationMin}
          isLoading={isLoading}
          routeName={routeName}
          onRouteNameChange={setRouteName}
          onSaveRoute={saveRoute}
          onToggleSavedRoutes={() => setShowSavedRoutesOnly((state) => !state)}
          onShare={shareRoute}
          onUndo={undoLastPoint}
          onClear={clearRoute}
          onRemovePoint={removePoint}
          savedRoutes={savedRoutes}
          showSavedRoutesOnly={showSavedRoutesOnly}
          onLoadSavedRoute={loadSavedRoute}
          onDeleteSavedRoute={deleteSavedRoute}
          onRenameSavedRoute={renameSavedRoute}
        />
      </aside>

      <main className="mapArea">
        <RouteMap
          points={points}
          route={route}
          onMapClick={handleMapClick}
          onPointDrag={handlePointDrag}
        />
      </main>
    </div>
  );
}

export default App;
