import React from 'react';
import { normalizeUnsplashImageUrl } from '@/lib/unsplash';

const chipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.55rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(255,255,255,0.08)',
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.78)',
};

export default function CoverPage({
  clientName,
  colorPalette = [],
  backgroundImage,
  pageNumber = 1,
  styleTitle = 'Direcao estetica',
  styleDescription = '',
}) {
  const defaultBg = normalizeUnsplashImageUrl('https://images.unsplash.com/photo-1524758631624-e2822e304c36', {
    width: 1600,
    height: 1200,
    quality: 80,
  });
  const resolvedBackgroundImage = normalizeUnsplashImageUrl(backgroundImage || defaultBg, {
    width: 1600,
    height: 1200,
    quality: 80,
  });

  return (
    <div
      className="moodboard-page cover-page"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0d1014',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(140deg, rgba(8,9,10,0.82) 0%, rgba(8,9,10,0.58) 42%, rgba(8,9,10,0.2) 100%), url(${resolvedBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '3rem',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={chipStyle}>WG Almeida</div>
          <div style={chipStyle}>Guia de estilo</div>
        </div>

        <div style={{ maxWidth: '72%' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.8rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#f2b13a',
            }}
          >
            Direcao visual personalizada
          </p>
          <h1
            style={{
              margin: '1.25rem 0 0',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.4rem)',
              lineHeight: 1.02,
              fontWeight: 500,
            }}
          >
            {clientName || 'Cliente WG Almeida'}
          </h1>
          <h2
            style={{
              margin: '0.9rem 0 0',
              fontSize: 'clamp(1.1rem, 2.3vw, 1.6rem)',
              lineHeight: 1.4,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            {styleTitle}
          </h2>
          {styleDescription ? (
            <p
              style={{
                margin: '1.25rem 0 0',
                maxWidth: '34rem',
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.74)',
              }}
            >
              {styleDescription}
            </p>
          ) : null}

          {colorPalette.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginTop: '2.1rem' }}>
              {colorPalette.slice(0, 5).map((color) => (
                <div key={color} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '18px',
                      backgroundColor: color,
                      border: '1px solid rgba(255,255,255,0.42)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
                    }}
                  />
                  <span
                    style={{
                      display: 'block',
                      marginTop: '0.55rem',
                      fontSize: '0.65rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.76)',
                    }}
                  >
                    {color}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '1rem',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.72rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.54)',
              }}
            >
              Arquitetura + interiores + marcenaria
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: 'rgba(255,255,255,0.78)' }}>
              www.wgalmeida.com.br
            </p>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
            Pag. {pageNumber.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  );
}
