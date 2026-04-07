import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminService from '../services/adminService';
import { useAuth } from '../context/AuthContext';

const AdminForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/dashboard');
      return;
    }

    if (isEditMode) {
      fetchAdmin();
    }
  }, [id, isEditMode]);

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdminById(id);
      setFormData({
        username: data.username,
        password: '',
        nama: data.nama,
        role: data.role,
      });
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.response?.data?.message || 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    setFieldErrors({
      ...fieldErrors,
      [name]: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    // ========== CRITICAL: PREVENT DEFAULT FIRST ==========
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 Form submitted');
    
    setError('');
    setFieldErrors({});

    // Validasi
    if (!formData.username || !formData.nama) {
      setError('Username dan nama harus diisi');
      return;
    }

    if (formData.username.length < 3) {
      setFieldErrors({ username: 'Username minimal 3 karakter' });
      return;
    }

    // Validasi dengan check undefined dulu
    if (!formData.username) {
      setFieldErrors({ username: 'Username harus diisi' });
      return;
    }

    if (formData.username !== formData.username.toLowerCase()) {
      setFieldErrors({ username: 'Username harus huruf kecil semua' });
      return;
    }

    if (!isEditMode && !formData.password) {
      setError('Password harus diisi');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setFieldErrors({ password: 'Password minimal 6 karakter' });
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Submitting data...');
      
      const dataToSend = {
        username: formData.username?.toLowerCase() || '',
        nama: formData.nama || '',
        role: formData.role || 'admin',
    };  

      if (formData.password) {
        dataToSend.password = formData.password;
      }

      if (isEditMode) {
        await adminService.updateAdmin(id, dataToSend);
        console.log('✅ Update success');
      } else {
        await adminService.createAdmin(dataToSend);
        console.log('✅ Create success');
      }

      navigate('/admin');
    } catch (err) {
      console.error('❌ Submit error:', err);
      const errorMessage = err.response?.data?.message || 'Gagal menyimpan data admin';
      const errorField = err.response?.data?.field;
      
      if (errorField) {
        setFieldErrors({ [errorField]: errorMessage });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Memuat data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          type="button"
          onClick={() => navigate('/admin')} 
          style={styles.backButton}
        >
          ← Kembali
        </button>
        <h1 style={styles.title}>
          {isEditMode ? 'Edit Admin' : 'Tambah Admin Baru'}
        </h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Username <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: fieldErrors.username ? '#ef4444' : '#e2e8f0'
              }}
              placeholder="Contoh: admin123"
              required
            />
            {fieldErrors.username ? (
              <small style={styles.errorHint}>⚠️ {fieldErrors.username}</small>
            ) : (
              <small style={styles.hint}>
                ✓ Username harus huruf kecil semua (minimal 3 karakter)
              </small>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Password {isEditMode && '(Kosongkan jika tidak ingin mengubah)'} 
              {!isEditMode && <span style={styles.required}> *</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                borderColor: fieldErrors.password ? '#ef4444' : '#e2e8f0'
              }}
              placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
              required={!isEditMode}
            />
            {fieldErrors.password ? (
              <small style={styles.errorHint}>⚠️ {fieldErrors.password}</small>
            ) : (
              <small style={styles.hint}>
                ✓ Password harus berisi minimal 6 karakter
              </small>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Nama Lengkap <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <small style={styles.hint}>
              Super Admin dapat mengelola akun admin lainnya
            </small>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={styles.cancelButton}
            >
              Batal
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (isEditMode ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#334155',
    fontWeight: '500',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    marginTop: '0.25rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  errorHint: {
    display: 'block',
    marginTop: '0.25rem',
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
};

export default AdminForm;