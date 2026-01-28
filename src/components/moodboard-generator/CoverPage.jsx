// Cover page template for moodboard
import React from 'react';

export default function CoverPage({
  clientName,
  colorPalette = [],
  backgroundImage,
  pageNumber = 1
}) {
  const defaultBg = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200';

  return (
    <div className="moodboard-page cover-page" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Background Image */}
      <div
        className="cover-background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backgroundImage || defaultBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)'
        }}
      />

      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: '#ffffff'
      }}>
        {/* Greeting */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontFamily: '"Dancing Script", cursive',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: '#F25C26',
            marginBottom: '0.5rem',
            fontWeight: 400,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            olá, {clientName},
          </h1>
          <h2 style={{
            fontFamily: '"Dancing Script", cursive',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: '#F25C26',
            fontWeight: 400,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Sejam bem-vindos!
          </h2>
        </div>

        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 'clamp(1.2rem, 3vw, 2rem)',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '3rem',
          textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
        }}>
          ao moodboard de vocês
        </p>

        {/* Color Palette */}
        {colorPalette && colorPalette.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '2rem'
          }}>
            {colorPalette.slice(0, 4).map((color, index) => (
              <div
                key={index}
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: '3px solid white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* WG Almeida Branding */}
        <div style={{
          marginTop: 'auto',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: '#ffffff',
            marginBottom: '0.5rem',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            arquitetura engenharia marcenaria
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '1.5rem 2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20
      }}>
        <span style={{
          fontSize: '0.9rem',
          color: '#333333',
          fontWeight: 500
        }}>
          www.wgalmeida.com.br
        </span>
        <span style={{
          fontSize: '0.9rem',
          color: '#666666'
        }}>
          Page | {pageNumber.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
