export default function MediaPlayer({ media }) {
  if (!media?.length) return null
  return (
    <section className="media-player">
      {media.map(m => (
        <figure key={m.path} className="media-player-item">
          <figcaption>{m.name.replace(/\.[^.]+$/, '')}</figcaption>
          {m.kind === 'video' ? (
            <video src={m.url} controls preload="metadata" playsInline />
          ) : (
            <audio src={m.url} controls preload="none" />
          )}
        </figure>
      ))}
    </section>
  )
}
