import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import ConfirmDialog from '../components/ConfirmDialogg';
import { useAuth } from '../context/AuthContext';

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, nama: '' });
  const navigate = useNavigate();
  const { admin: currentAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    // Redirect jika bukan superadmin
    if (!isSuperAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchAdmins();
  }, [isSuperAdmin, navigate]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllAdmins();
      setAdmins(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('🗑️ Attempting to delete admin:', deleteDialog.id);
      console.log('Current user:', currentAdmin);
      
      await adminService.deleteAdmin(deleteDialog.id);
      
      console.log('✅ Delete successful');
      setAdmins(admins.filter(admin => admin._id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: null, nama: '' });
      
      alert('Admin berhasil dimusnahkan');
    } catch (err) {
      console.error('❌ Delete failed:', err);
      console.error('Response:', err.response?.data);
      alert(err.response?.data?.message || 'Gagal memusnahkan admin');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const updatedAdmin = await adminService.toggleAdminStatus(id);
      setAdmins(admins.map(admin => 
        admin._id === id ? updatedAdmin : admin
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status admin');
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'superadmin') {
      return <span style={styles.badgeSuperAdmin}>Super Admin</span>;
    }
    return <span style={styles.badgeAdmin}>Admin</span>;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span style={styles.badgeActive}>Aktif</span>;
    }
    return <span style={styles.badgeInactive}>Nonaktif</span>;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Memuat data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Kelola Admin</h1>
          <p style={styles.subtitle}>Manajemen akun administrator sistem</p>
        </div>
        <button
          onClick={() => navigate('/admin/create')}
          style={styles.addButton}
        >
          ➕ Tambah Admin
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Nama</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Dibuat</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} style={styles.tr}>
                <td style={styles.td}>
                  {admin.username}
                  {admin._id === currentAdmin._id && (
                    <span style={styles.youBadge}>(Anda)</span>
                  )}
                  {!admin.isActive && (
                    <span style={styles.disabledBadge}>🚫 Nonaktif</span>
                  )}
                </td>
                <td style={styles.td}>{admin.nama}</td>
                <td style={styles.td}>{getRoleBadge(admin.role)}</td>
                <td style={styles.td}>{getStatusBadge(admin.isActive)}</td>
                <td style={styles.td}>
                  {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => navigate(`/admin/edit/${admin._id}`)}
                      style={styles.editButton}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    
                    {admin._id !== currentAdmin._id && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(admin._id)}
                          style={admin.isActive ? styles.deactivateButton : styles.activateButton}
                          title={admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {admin.isActive ? '🔒' : '🔓'}
                        </button>
                        
                        <button
                          onClick={() => setDeleteDialog({ 
                            open: true, 
                            id: admin._id, 
                            nama: admin.nama 
                          })}
                          style={styles.deleteButton}
                          title="Musnah"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admins.length === 0 && (
          <div style={styles.emptyState}>
            <p>Belum ada data admin</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Musnahkan Admin"
        message={`Apakah Anda yakin ingin memusnahkan admin "${deleteDialog.nama}"?`}
        onConfirm={() => {
          console.log('🔥 onConfirm called from AdminList');
          handleDelete();
        }}
        onCancel={() => {
          console.log('🚫 onCancel called from AdminList');
          setDeleteDialog({ open: false, id: null, nama: '' });
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    color: '#64748b',
    marginTop: '0.5rem',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
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
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: '600',
    borderBottom: '2px solid #e2e8f0',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '1rem',
    color: '#334155',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  activateButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  deactivateButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  deleteButton: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  badgeSuperAdmin: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#a855f7',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  badgeAdmin: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  badgeActive: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  badgeInactive: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  youBadge: {
    marginLeft: '0.5rem',
    color: '#3b82f6',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  disabledBadge: {
    marginLeft: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#94a3b8',
  },
};

export default AdminList;