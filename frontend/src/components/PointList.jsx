export default function PointList({ points, onRemovePoint }) {
  if (points.length === 0) {
    return null;
  }

  return (
    <div className="point-list">
      <h2>Ruttpunkter</h2>
      <ul>
        {points.map((point, index) => (
          <li key={index} className="point-list-item">
            <span>
              {index + 1}. {point[0].toFixed(5)}, {point[1].toFixed(5)}
            </span>
            <button className="small" onClick={() => onRemovePoint(index)}>
              Ta bort
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
