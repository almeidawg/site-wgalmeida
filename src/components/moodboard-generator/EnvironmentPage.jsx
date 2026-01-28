// Environment page template for moodboard (60% image / 40% text layout)
import React from 'react';

export default function EnvironmentPage({
  title,
  description,
  imageUrl,
  pageNumber
}) {
  return (
    <div className="moodboard-page environment-page" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#ffffff',
      display: 'flex'
    }}>
      {/* Left Side - Image (60%) */}
      <div style={{
        width: '60%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          crossOrigin="anonymous"
        />
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
