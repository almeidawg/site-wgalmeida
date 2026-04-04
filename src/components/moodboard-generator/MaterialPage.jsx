// Material page template for moodboard
import React from 'react';

export default function MaterialPage({
  title,
  description,
  images = [],
  pageNumber
}) {
  return (
    <div className="moodboard-page material-page" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#ffffff',
      display: 'flex'
    }}>
      {/* Left Side - Material Images Grid (60%) */}
      <div style={{
        width: '60%',
        height: '100%',
        position: 'relative',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: images.length <= 2 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem',
        backgroundColor: '#f8f8f8'
      }}>
        {images.slice(0, 4).map((imageUrl, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <img
              src={imageUrl}
              alt={`${title} - ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>

      {/* Right Side - Content (40%) */}
      <div style={{
        width: '40%',
        height: '100%',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        {/* Title */}
        <h2 style={{
          fontFamily: '"Dancing Script", cursive',
          fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
          color: '#F25C26',
          marginBottom: '2rem',
          lineHeight: 1.2,
          fontWeight: 400
        }}>
          {title}
        </h2>

        {/* Description */}
        <p style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
          color: '#666666',
          lineHeight: 1.8,
          marginBottom: '2rem'
        }}>
          {description}
        </p>

        {/* Footer */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e5e5'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: '#333333',
              fontWeight: 500
            }}>
              www.wgalmeida.com.br
            </span>
            <span style={{
              fontSize: '0.85rem',
              color: '#666666'
            }}>
              Page | {pageNumber.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
