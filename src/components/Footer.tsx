"use client";

export default function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '60px 24px 24px',
      marginTop: '64px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative wave at top */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        left: 0,
        right: 0,
        height: '100px',
        background: 'white',
        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)',
      }} />

      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '50px',
        right: '-100px',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        bottom: '-50px',
        left: '-50px',
        filter: 'blur(60px)',
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '48px',
          textAlign: 'center',
        }}>
          
          {/* BRAND */}
          <div>
            <div style={{
              display: 'inline-block',
              background: 'white',
              padding: '16px 32px',
              borderRadius: '20px',
              marginBottom: '16px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '900',
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                🛒 VIT MART
              </h2>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '15px',
              lineHeight: '1.7',
              fontWeight: '500',
            }}>
              Your trusted online store for quality products,
              delivered with care and convenience.
            </p>
          </div>

          {/* LINKS */}
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '24px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px',
                color: 'white',
              }}>
                ⚡ Quick Links
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                {['Home', 'Products', 'Categories', 'Cart'].map((link, index) => (
                  <li key={index} className="footer-link" style={{
                    padding: '8px 0',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    → {link}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '24px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '16px',
                color: 'white',
              }}>
                📞 Contact Info
              </h3>
              <div style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                padding: '12px 20px',
                borderRadius: '50px',
                marginBottom: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: 0,
                }}>
                  📱 +91 9630741753
                </p>
              </div>
              
              {/* Social Icons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '16px',
              }}>
                {['📘', '📸', '🐦'].map((icon, index) => (
                  <div key={index} className="social-icon" style={{
                    width: '45px',
                    height: '45px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}>
                    {icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div style={{
          borderTop: '2px solid rgba(255, 255, 255, 0.2)',
          marginTop: '48px',
          paddingTop: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '12px 32px',
            borderRadius: '50px',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '14px',
              fontWeight: '600',
              margin: 0,
            }}>
              © 2025 VIT MART. All rights reserved. ❤️
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-link:hover {
          color: white !important;
          transform: translateX(5px);
        }
        
        .social-icon:hover {
          transform: translateY(-5px) scale(1.1);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>
    </footer>
  );
}