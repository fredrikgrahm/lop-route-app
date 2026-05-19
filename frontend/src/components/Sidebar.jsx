import { formatDuration } from "../utils/routeHelpers";
import SavedRoutesList from "./SavedRoutesList";
import PointList from "./PointList";

export default function Sidebar({
  points,
  distanceKm,
  durationMin,
  isLoading,
  routeName,
  onRouteNameChange,
  onSaveRoute,
  onToggleSavedRoutes,
  onShare,
  onUndo,
  onClear,
  onRemovePoint,
  savedRoutes,
  showSavedRoutesOnly,
  onLoadSavedRoute,
  onDeleteSavedRoute,
  onRenameSavedRoute,
}) {
  return (
    <>
      <div>
        <p className="eyebrow">Löp</p>

        <h1>Planera din runda</h1>

        <p className="muted">
          Klicka ut punkter på kartan. Appen använder gångvägar för löpning.
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
          <strong>{formatDuration(durationMin)}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>{isLoading ? "Hämtar" : "Klar"}</strong>
        </div>
      </div>

      <PointList points={points} onRemovePoint={onRemovePoint} />

      <div className="actions">
        {!showSavedRoutesOnly ? (
          <>
            <input
              type="text"
              value={routeName}
              onChange={(e) => onRouteNameChange(e.target.value)}
              placeholder="Namn på rutten"
              className="route-name-input"
            />

            <button className="primary" onClick={onSaveRoute} disabled={points.length < 2}>
              Spara rutt
            </button>

            <button onClick={onToggleSavedRoutes} disabled={savedRoutes.length === 0}>
              Visa sparade rundor
            </button>

            <button onClick={onShare} disabled={points.length < 2}>
              Dela
            </button>

            <button onClick={onUndo} disabled={points.length === 0}>
              Ångra senaste punkt
            </button>

            <button onClick={onClear} disabled={points.length === 0}>
              Rensa
            </button>
          </>
        ) : (
          <button onClick={onToggleSavedRoutes}>Stäng sparade rundor</button>
        )}
      </div>

      {showSavedRoutesOnly ? (
        <SavedRoutesList
          savedRoutes={savedRoutes}
          onLoadSavedRoute={onLoadSavedRoute}
          onDeleteSavedRoute={onDeleteSavedRoute}
          onRenameSavedRoute={onRenameSavedRoute}
        />
      ) : (
        <div className="hint">
          Tips: sätt ut flera punkter för att styra rutten mer exakt. Dra en punkt för att justera vägen.
        </div>
      )}
    </>
  );
}
