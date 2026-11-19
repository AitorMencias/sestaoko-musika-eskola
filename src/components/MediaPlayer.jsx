const isDrive = url => url?.startsWith('https://drive.google.com/')

export default function MediaPlayer({ media }) {
  if (!media?.length) return null
  return (
    <section className="media-player">
      {media.map(m => {
        const title = m.name.replace(/\.[^.]+$/, '')
        return (
          <figure key={m.path} className="media-player-item">
            <figcaption>{title}</figcaption>
            {isDrive(m.url) ? (
              <iframe
                src={m.url}
                title={title}
                className={m.kind === 'video' ? 'drive-video' : 'drive-audio'}
                allow="autoplay; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            ) : m.kind === 'video' ? (
              <video src={m.url} controls preload="metadata" playsInline />
            ) : (
              <audio src={m.url} controls preload="none" />
            )}
          </figure>
        )
      })}
    </section>
  )
}
