export default function MedicinePage() {
  const whatsappNumber = "919630741753";
  const message =
    "Hello Vit Mart, I want to order medicine. Please find my prescription attached.";

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <section 
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        top: '-100px',
        left: '-100px',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        bottom: '-50px',
        right: '-50px',
        filter: 'blur(60px)',
      }} />

      <div style={{
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '32px',
          padding: '48px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative top gradient bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #11998e 0%, #38ef7d 50%, #667eea 100%)',
          }} />

          {/* Discount Badge */}
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '12px 32px',
            borderRadius: '50px',
            marginBottom: '24px',
            boxShadow: '0 8px 20px rgba(245, 87, 108, 0.3)',
            animation: 'pulse 2s infinite',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'white',
              margin: 0,
              letterSpacing: '1px',
            }}>
              🎉 GET UPTO 10% OFF
            </h2>
          </div>

          {/* Trust Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
            padding: '10px 24px',
            borderRadius: '50px',
            marginBottom: '32px',
            border: '2px solid #00acc1',
          }}>
            <span style={{ fontSize: '20px' }}>🩺</span>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '700',
              color: '#00838f',
            }}>
              Verified Medicines | Doctor's Prescription Mandatory
            </p>
          </div>

          {/* Main Heading with gradient */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}>
              💊 Order Medicines Easily
            </h1>
          </div>

          {/* Description with icons */}
          <div style={{
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '32px',
            border: '2px solid #f39c12',
          }}>
            <p style={{
              color: '#2d3436',
              fontSize: '18px',
              lineHeight: '1.8',
              margin: 0,
              fontWeight: '600',
            }}>
              📋 Please send your doctor's prescription directly on WhatsApp.
              <br />
              ✅ Our team will verify it and deliver your medicines safely.
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d3436' }}>
                Fast Delivery
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d3436' }}>
                Verified Quality
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#2d3436' }}>
                Best Price
              </div>
            </div>
          </div>

          {/* WhatsApp Button */}
          <div style={{ paddingTop: '16px' }}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                padding: '18px 48px',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: '800',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(37, 211, 102, 0.4)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <span style={{ fontSize: '28px' }}>📲</span>
              Send Prescription on WhatsApp
            </a>
          </div>

          {/* Trust indicators at bottom */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '2px dashed #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>
                Secure & Private
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📦</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>
                Safe Packaging
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>⭐</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#636e72' }}>
                Licensed Pharmacy
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .whatsapp-button:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 35px rgba(37, 211, 102, 0.5) !important;
        }
      `}</style>
    </section>
  );
}