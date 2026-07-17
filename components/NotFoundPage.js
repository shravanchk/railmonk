import React from 'react';
import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0'
      }}
    >
      <h1 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>404</h1>
      <p style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: '#94a3b8' }}>
        This page does not exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.7rem 1.2rem',
          borderRadius: '0.75rem',
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #fb923c, #ea580c)'
        }}
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
