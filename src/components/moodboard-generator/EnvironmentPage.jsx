import React from 'react';

export default function EnvironmentPage({
  title,
  description,
  imageUrl,
  pageNumber,
  caption = 'Ambiente de referencia',
  rationale = '',
}) {
  return (
    <div
      className="moodboard-page environment-page"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#f8f4ee',
        display: 'grid',
        gridTemplateColumns: '1.18fr 0.82fr',
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          crossOrigin="anonymous"
        />
      </div>

      <div
        style={{
          height: '100%',
          padding: '2.6rem 2.4rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,244,238,1) 100%)',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '0.72rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#8b7760',
            }}
          >
            {caption}
          </p>
          <h2
            style={{
              margin: '1rem 0 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '2.1rem',
              lineHeight: 1.08,
              fontWeight: 500,
              color: '#171819',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: '1.1rem 0 0',
              fontSize: '1rem',
              lineHeight: 1.75,
              color: '#5d5850',
            }}
          >
            {description}
          </p>
        </div>

        <div style={{ marginTop: '1.8rem', borderTop: '1px solid rgba(23,24,25,0.08)', paddingTop: '1.4rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8b7760',
            }}
          >
            Leitura recomendada
          </p>
          <p
            style={{
              margin: '0.65rem 0 0',
              fontSize: '0.96rem',
              lineHeight: 1.7,
              color: '#3f3a33',
            }}
          >
            {rationale || 'Usar como referencia de composicao, atmosfera e proporcao visual.'}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#3f3a33', fontWeight: 500 }}>www.wgalmeida.com.br</span>
          <span style={{ fontSize: '0.82rem', color: '#7b756d' }}>Pag. {pageNumber.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
