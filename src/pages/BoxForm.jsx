import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import boxService from '../services/boxService';
import lokerService from '../services/lokerService';

const BoxForm = () => {
  const [nomorBox, setNomorBox] = useState('');
  const [lokerId, setLokerId] = useState('');
  const [lokers, setLokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  useEffect(() => {
    fetchLokers();
    if (isEdit) {
      fetchBox();
    }
  }, [id]);

  const fetchLokers = async () => {
    try {
      const data = await lokerService.getAllLoker();
      setLokers(data);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat daftar loker');
    }
  };

  const fetchBox = async () => {
    try {
      const data = await boxService.getBoxById(id);
      setNomorBox(data.nomorBox || '');
      setLokerId(data.lokerId?._id || '');
    } catch (error) {
      alert('Gagal memuat data box');
      navigate('/boxes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        // Update box (nomor dan/atau loker)
        await boxService.updateBox(id, {
          nomorBox: nomorBox.trim().toUpperCase(),
          lokerId: lokerId || null
        });
        alert('Box berhasil diupdate');
      } else {
        setError('Untuk menambah box, silakan buka halaman Detail Loker dan tambahkan box dari sana.');
        setLoading(false);
        return;
      }

      navigate('/boxes');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>{isEdit ? 'Edit Box' : 'Tambah Box Baru'}</h1>

        {error && <div style={styles.error}>{error}</div>}

        {!isEdit && (
          <div style={styles.infoBox}>
            <div style={styles.infoIcon}>ℹ️</div>
            <div>
              <div style={styles.infoTitle}>Cara Menambah Box</div>
              <p style={styles.infoText}>
                Box harus ditambahkan melalui <strong>Loker</strong>. 
                Silakan buka menu <strong>Manajemen Loker</strong>, 
                pilih loker yang diinginkan, lalu tambahkan box di halaman detail loker.
              </p>
              <button
                onClick={() => navigate('/loker')}
                style={styles.goToLokerBtn}
              >
                Buka Manajemen Loker
              </button>
            </div>
          </div>
        )}

        {isEdit && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Nomor Box <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={nomorBox}
                onChange={(e) => setNomorBox(e.target.value.toUpperCase())}
                required
                style={styles.input}
                placeholder="Contoh: A1, A2, B1"
              />
              <small style={styles.hint}>Format: Huruf + angka (contoh: A1, B2)</small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Loker <span style={styles.required}>*</span>
              </label>
              <select
                value={lokerId}
                onChange={(e) => setLokerId(e.target.value)}
                required
                style={styles.select}
              >
                <option value="">-- Pilih Loker --</option>
                {lokers.map((loker) => (
                  <option 
                    key={loker._id} 
                    value={loker._id}
                    disabled={loker.jumlahBox >= 10}
                  >
                    Loker {loker.nomorLoker} ({loker.jumlahBox}/10 box)
                    {loker.jumlahBox >= 10 ? ' - PENUH' : ''}
                  </option>
                ))}
              </select>
              <small style={styles.hint}>
                Pilih loker tempat box ini disimpan (maksimal 10 box per loker)
              </small>
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => navigate('/boxes')}
                style={styles.cancelBtn}
              >
                Batal
              </button>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Loading...' : 'Update Box'}
              </button>
            </div>
          </form>
        )}

        {!isEdit && (
          <div style={styles.buttonGroup}>
            <button
              onClick={() => navigate('/boxes')}
              style={styles.cancelBtn}
            >
              Kembali ke Daftar Box
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 'clamp(1rem, 3vw, 2rem)',
    maxWidth: '720px',
    margin: '0 auto',
  },
  formCard: {
    backgroundColor: 'white',
    padding: 'clamp(1.5rem, 4vw, 2rem)',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
    color: '#2c3e50',
    marginBottom: '1.5rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  infoBox: {
    display: 'flex',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    border: '1px solid #90caf9',
    marginBottom: '1.5rem',
  },
  infoIcon: {
    fontSize: '2rem',
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1565c0',
    marginBottom: '0.75rem',
    fontSize: '1.1rem',
  },
  infoText: {
    color: '#0d47a1',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  goToLokerBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
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
  required: {
    color: '#e74c3c',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    outline: 'none',
    backgroundColor: 'white',
  },
  hint: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default BoxForm;