import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false); // State untuk toggle password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [accountDisabled, setAccountDisabled] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
    setErrorType('');
    setAccountDisabled(false);
  };

  // Fungsi untuk toggle show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ========== TEST: SUBMIT TANPA FORM ==========
  const handleClick = async () => {
    console.log('🔍 Button clicked (not form submit)');
    
    setError('');
    setErrorType('');
    setAccountDisabled(false);

    if (!credentials.username || !credentials.password) {
      setError('Username dan password harus diisi');
      return;
    }

    setLoading(true);
    console.log('📤 Attempting login...');

    try {
      const result = await login(credentials);
      console.log('📥 Login result:', result);
      
      if (result.success) {
        console.log('✅ Login success, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('❌ Login failed:', result);
        if (result.accountDisabled) {
          setAccountDisabled(true);
        }
        if (result.errorType) {
          setErrorType(result.errorType);
        }
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Catch error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  // ============================================

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <h1 style={styles.title}>🗂️ Arsip Dokumen</h1>
          <p style={styles.subtitle}>Sistem Manajemen Arsip Digital</p>
        </div>

        {/* ========== TIDAK PAKAI FORM, PAKAI DIV ========== */}
        <div style={styles.form}>
          {accountDisabled && (
            <div style={styles.disabledAlert}>
              <div style={styles.disabledIcon}>🚫</div>
              <div style={styles.disabledContent}>
                <div style={styles.disabledTitle}>Akun Dinonaktifkan</div>
                <div style={styles.disabledMessage}>{error}</div>
              </div>
            </div>
          )}

          {!accountDisabled && errorType === 'USERNAME_NOT_FOUND' && (
            <div style={styles.errorAlert}>
              <div style={styles.errorIcon}>❌</div>
              <div>
                <div style={styles.errorTitle}>Username Tidak Terdaftar</div>
                <div style={styles.errorMessage}>
                  Username yang Anda masukkan tidak ditemukan dalam sistem.
                </div>
              </div>
            </div>
          )}

          {!accountDisabled && errorType === 'INVALID_PASSWORD' && (
            <div style={styles.errorAlert}>
              <div style={styles.errorIcon}>🔒</div>
              <div>
                <div style={styles.errorTitle}>Password Salah</div>
                <div style={styles.errorMessage}>
                  Password yang Anda masukkan tidak sesuai. Silakan coba lagi.
                  Jika lupa password, segera hubungi Super Admin!
                </div>
              </div>
            </div>
          )}

          {!accountDisabled && error && !errorType && (
            <div style={styles.errorAlert}>
              ⚠️ {error}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: errorType === 'USERNAME_NOT_FOUND' ? '#ef4444' : '#e2e8f0'
              }}
              placeholder="Masukkan username"
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"} // Toggle type berdasarkan state
                name="password"
                value={credentials.password}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleClick();
                  }
                }}
                style={{
                  ...styles.input,
                  ...styles.passwordInput,
                  borderColor: errorType === 'INVALID_PASSWORD' ? '#ef4444' : '#e2e8f0'
                }}
                placeholder="Masukkan password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={styles.eyeButton}
                disabled={loading}
              >
                {showPassword ? (
                  <span style={styles.eyeIcon}>👁️</span> // Mata terbuka
                ) : (
                  <span style={styles.eyeIcon}>🔒</span> // Mata tertutup/kunci
                )}
              </button>
            </div>
          </div>

          {/* ========== BUTTON BIASA (BUKAN TYPE SUBMIT) ========== */}
          <button
            type="button"
            onClick={handleClick}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : '🔐 Login'}
          </button>
          {/* ==================================================== */}
        </div>

        <div style={styles.footer}>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: 'clamp(2rem, 5vw, 3rem)',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
    color: '#2c3e50',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    color: '#7f8c8d',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    border: '2px solid #fca5a5',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  errorIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '0.25rem',
  },
  errorMessage: {
    fontSize: '0.9rem',
    color: '#dc2626',
    lineHeight: '1.4',
  },
  disabledAlert: {
    backgroundColor: '#fff4e6',
    border: '2px solid #ff9800',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  disabledIcon: {
    fontSize: '2rem',
    flexShrink: 0,
  },
  disabledContent: {
    flex: 1,
  },
  disabledTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#e65100',
    marginBottom: '0.5rem',
  },
  disabledMessage: {
    fontSize: '0.95rem',
    color: '#e65100',
    lineHeight: '1.5',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  // Container untuk input password dan mata
  passwordContainer: {
    position: 'relative',
    display: 'flex',
  },
  input: {
    padding: '0.875rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none',
    width: '100%',
  },
  passwordInput: {
    paddingRight: '3rem', // Memberi ruang untuk tombol mata
  },
  // Tombol mata
  eyeButton: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: '1.25rem',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  submitButton: {
    padding: '1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.05rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
};

export default Login;