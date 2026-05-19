export default function SavedRoutesList({
  savedRoutes,
  onLoadSavedRoute,
  onDeleteSavedRoute,
  onRenameSavedRoute,
}) {
  return (
    <div className="saved-routes">
      <h2>Sparade rundor</h2>
      <ul>
        {savedRoutes.map((savedRoute) => (
          <li key={savedRoute.id} className="saved-route-item">
            <div>
              <strong>{savedRoute.name}</strong>
              <div className="saved-route-meta">
                {savedRoute.distanceKm.toFixed(2)} km · {Math.round(savedRoute.durationMin)} min
              </div>
            </div>
            <div className="saved-route-actions">
              <button className="small" onClick={() => onLoadSavedRoute(savedRoute)}>
                Ladda
              </button>
              <button className="small" onClick={() => onRenameSavedRoute(savedRoute.id)}>
                Byt namn
              </button>
              <button
                className="small"
                onClick={() => {
                  if (window.confirm(`Ta bort rutten “${savedRoute.name}”?`)) {
                    onDeleteSavedRoute(savedRoute.id);
                  }
                }}
              >
                Ta bort
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
