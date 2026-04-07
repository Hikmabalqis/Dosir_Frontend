import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import lokerService from '../services/lokerService';

const LokerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    nomorLoker: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchLoker();
    }
  }, [id, isEditMode]);

  const fetchLoker = async () => {
    try {
      setLoading(true);
      const data = await lokerService.getLokerById(id);
      setFormData({
        nomorLoker: data.nomorLoker,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data loker');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.toUpperCase(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (!formData.nomorLoker) {
      setError('Nomor loker harus diisi');
      return;
    }

    if (!/^[A-Z]{1,2}$/.test(formData.nomorLoker)) {
      setError('Nomor loker harus 1-2 huruf kapital (contoh: A, B, AA)');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        await lokerService.updateLoker(id, formData);
        alert('Loker berhasil diupdate');
      } else {
        await lokerService.createLoker(formData);
        alert('Loker berhasil dibuat');
      }

      // ✅ REDIRECT KE LIST, BUKAN DETAIL
      navigate('/loker');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan loker');
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
        <button onClick={() => navigate('/loker')} style={styles.backButton}>
          ← Kembali
        </button>
        <h1 style={styles.title}>
          {isEditMode ? 'Edit Loker' : 'Tambah Loker Baru'}
        </h1>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nomor Loker *</label>
            <input
              type="text"
              name="nomorLoker"
              value={formData.nomorLoker}
              onChange={handleChange}
              style={styles.input}
              placeholder="Contoh: A, B, AA, AB"
              maxLength={2}
              required
            />
            <small style={styles.hint}>
              1-2 huruf kapital. Contoh: A, B, C, AA, AB, AC
            </small>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => navigate('/loker')}
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
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    textTransform: 'uppercase',
  },
  hint: {
    display: 'block',
    marginTop: '0.25rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
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

export default LokerForm;