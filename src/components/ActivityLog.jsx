const ICONS = {
  call: "📞",
  create: "✓",
  update: "✎",
  delete: "🗑",
  error: "!",
  info: "•",
};

export default function ActivityLog({ entries }) {
  // return (
  //   <aside className="activity-log">
  //     <h3>Live activity</h3>
  //     {entries.length === 0 && <p className="agenda-empty">No activity yet.</p>}
  //     <ul>
  //       {entries.map((e) => (
  //         <li key={e.id} className={`log-entry log-${e.kind}`}>
  //           <span className="log-icon">{ICONS[e.kind] || ICONS.info}</span>
  //           <div className="log-body">
  //             <span className="log-text">{e.text}</span>
  //             <span className="log-time">{e.time}</span>
  //           </div>
  //         </li>
  //       ))}
  //     </ul>
  //   </aside>
  // );
}
