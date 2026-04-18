import React from 'react';

export default function MaterialPage({
  title,
  description,
  images = [],
  pageNumber,
  rationale = '',
}) {
  return (
    <div
      className="moodboard-page material-page"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#fcfbf8',
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
      }}
    >
      <div
        style={{
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: images.length <= 1 ? '1fr' : 'repeat(2, 1fr)',
          gridAutoRows: 'minmax(0, 1fr)',
          gap: '1.2rem',
          background: '#f2ede7',
        }}
      >
        {images.slice(0, 4).map((imageUrl, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '22px',
              boxShadow: '0 16px 38px rgba(23,24,25,0.08)',
              minHeight: 0,
            }}
          >
            <img
              src={imageUrl}
              alt={`${title} - ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '2.5rem 2.3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
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
            Materiais e acabamentos
          </p>
          <h2
            style={{
              margin: '1rem 0 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '2.15rem',
              lineHeight: 1.08,
              color: '#171819',
              fontWeight: 500,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: '1.1rem 0 0',
              fontSize: '1rem',
              lineHeight: 1.72,
              color: '#5d5850',
            }}
          >
            {description}
          </p>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div
            style={{
              borderRadius: '24px',
              background: '#171819',
              padding: '1.35rem 1.4rem',
              color: '#f6f0e8',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(246,240,232,0.56)',
              }}
            >
              Direcionamento
            </p>
            <p style={{ margin: '0.65rem 0 0', fontSize: '0.94rem', lineHeight: 1.7 }}>
              {rationale || 'Priorizar textura, leitura tatil e combinacao coerente com a atmosfera escolhida.'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(23,24,25,0.08)',
            paddingTop: '1.35rem',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: '#3f3a33', fontWeight: 500 }}>www.wgalmeida.com.br</span>
          <span style={{ fontSize: '0.82rem', color: '#7b756d' }}>Pag. {pageNumber.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
