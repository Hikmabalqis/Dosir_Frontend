import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import lokerService from '../services/lokerService';
import ConfirmDialog from '../components/ConfirmDialog';

const LokerList = () => {
  const [lokers, setLokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    lokerId: null, 
    lokerNumber: null 
  });
  const [selectedIds, setSelectedIds] = useState([]); // ✅ state untuk bulk select
  const navigate = useNavigate();

  useEffect(() => {
    fetchLokers();
  }, []);

  const fetchLokers = async () => {
    try {
      const data = await lokerService.getAllLoker();
      setLokers(data);
    } catch (error) {
      alert('Gagal memuat data loker');
    } finally {
      setLoading(false);
    }
  };

  // ✅ toggle select satu loker
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ toggle select semua loker
  const toggleSelectAll = () => {
    if (selectedIds.length === lokers.length && lokers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lokers.map((l) => l._id));
    }
  };

  // ✅ handle delete single & bulk
  const handleDelete = async () => {
    try {
      if (Array.isArray(deleteDialog.lokerId)) {
        await Promise.all(
          deleteDialog.lokerId.map((id) => lokerService.deleteLoker(id))
        );
        alert(`${deleteDialog.lokerId.length} loker berhasil dimusnahkan`);
        setSelectedIds([]);
      } else {
        await lokerService.deleteLoker(deleteDialog.lokerId);
        alert('Loker berhasil dimusnahkan');
      }
      fetchLokers();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal memusnahkan loker');
    } finally {
      setDeleteDialog({ isOpen: false, lokerId: null, lokerNumber: null });
    }
  };

  const openDeleteDialog = (lokerId, lokerNumber) => {
    setDeleteDialog({ isOpen: true, lokerId, lokerNumber });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, lokerId: null, lokerNumber: null });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen Loker</h1>
          <p style={styles.subtitle}>Kelola loker penyimpanan box dokumen</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/loker/add')} 
            style={styles.addBtn}
          >
            + Tambah Loker
          </button>
          {/* ✅ tombol bulk delete */}
          <button
            style={styles.bulkDeleteBtn}
            disabled={selectedIds.length === 0}
            onClick={() =>
              setDeleteDialog({
                isOpen: true,
                lokerId: selectedIds,
                lokerNumber: `${selectedIds.length} loker terpilih`,
              })
            }
          >
            Musnahkan ({selectedIds.length})
          </button>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === lokers.length && lokers.length > 0}
                  onChange={toggleSelectAll}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </th>
              <th style={styles.th}>No</th>
              <th style={styles.th}>Nomor Loker</th>
              <th style={styles.th}>Jumlah Box</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {lokers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  Belum ada loker. Klik "Tambah Loker" untuk membuat loker baru.
                </td>
              </tr>
            ) : (
              lokers.map((loker, index) => {
                const isChecked = selectedIds.includes(loker._id);
                return (
                  <tr key={loker._id} style={styles.tr}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(loker._id)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </td>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong style={styles.lokerName}>Loker {loker.nomorLoker}</strong>
                    </td>
                    <td style={styles.td}>{loker.jumlahBox} / 50</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(loker.jumlahBox >= 50
                            ? styles.badgeFull
                            : loker.jumlahBox === 0
                            ? styles.badgeEmpty
                            : styles.badgePartial),
                        }}
                      >
                        {loker.jumlahBox >= 50
                          ? 'Penuh'
                          : loker.jumlahBox === 0
                          ? 'Kosong'
                          : 'Terisi'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/loker/detail/${loker._id}`)}
                        style={styles.viewBtn}
                      >
                        Lihat Isi
                      </button>
                      <button
                        onClick={() => navigate(`/loker/edit/${loker._id}`)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteDialog(loker._id, loker.nomorLoker)}
                        style={styles.deleteBtn}
                      >
                        Musnahkan
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Musnahkan Loker"
        message={
          Array.isArray(deleteDialog.lokerId)
            ? `Apakah Anda yakin ingin memusnahkan ${deleteDialog.lokerNumber}?`
            : `Apakah Anda yakin ingin memusnahkan Loker ${deleteDialog.lokerNumber}? Loker yang masih berisi box tidak dapat dimusnahkan.`
        }
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
};

const styles = {
  container: { padding: 'clamp(1rem, 3vw, 2rem)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#2c3e50', marginBottom: '0.5rem' },
  subtitle: { color: '#7f8c8d', fontSize: 'clamp(0.85rem, 2vw, 1rem)' },
  addBtn: { padding: '0.6rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer' },
  bulkDeleteBtn: { padding: '0.6rem 1rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.95rem', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' },
  tableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '0.75rem', textAlign: 'left', backgroundColor: '#34495e', color: 'white', fontWeight: '500', fontSize: '0.9rem' },
    tr: { borderBottom: '1px solid #ecf0f1' },
  td: { padding: '0.75rem', fontSize: '0.9rem' },
  lokerName: { fontSize: '1.1rem', color: '#2c3e50' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500' },
  badgeFull: { backgroundColor: '#fee', color: '#c33' },
  badgeEmpty: { backgroundColor: '#ffe', color: '#cc3' },
  badgePartial: { backgroundColor: '#efe', color: '#3c3' },
  viewBtn: { padding: '0.4rem 0.75rem', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' },
  editBtn: { padding: '0.4rem 0.75rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.85rem' },
  deleteBtn: { padding: '0.4rem 0.75rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' },
  emptyState: { padding: '2rem', textAlign: 'center', color: '#7f8c8d' },
  loading: { padding: '2rem', textAlign: 'center', fontSize: '1.2rem', color: '#7f8c8d' },
};

export default LokerList;
