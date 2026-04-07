import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dokumenService from '../services/dokumenService';
import boxService from '../services/boxService';
import { formatDate } from '../utils/formatDate';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import ActivityLogTimeline from '../components/ActivityLogTimeline';

const BoxDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [box, setBox] = useState(null);
  const [allDokumen, setAllDokumen] = useState([]);
  const [filteredDokumen, setFilteredDokumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    dokumenId: null, 
    dokumenNama: null 
  });
  
  const [peminjamanDialog, setPeminjamanDialog] = useState({ 
    isOpen: false, 
    dokumenId: null, 
    type: null,
    dokumenNama: null
  });

  useEffect(() => {
    fetchBoxDetail();
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, allDokumen]);

  const fetchBoxDetail = async () => {
    try {
      const [boxData, dokumenData] = await Promise.all([
        boxService.getBoxById(id),
        dokumenService.getDokumenByBox(id)
      ]);
      setBox(boxData);
      setAllDokumen(dokumenData);
    } catch (error) {
      alert('Gagal memuat data box');
      navigate('/boxes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const data = await boxService.exportBox(id);
      generatePDFLabel(data);
      alert(`Label Box ${box?.nomorBox} berhasil di-export!`);
    } catch (error) {
      alert('Gagal export: ' + (error.response?.data?.message || error.message));
    }
  };

  const generatePDFLabel = (data) => {
    import('jspdf').then((module) => {
      const jsPDF = module.default;
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
      });

      const pageWidth = 210;
      const pageHeight = 148;
      const margin = 10;

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      const leftSectionWidth = (pageWidth * 0.6);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('DAFTAR NOMOR PENSIUN', margin, 20);

      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, 24, leftSectionWidth - 5, 24);

      const sortedDokumen = [...data.dokumen].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      // ========== REVISI: FONT SIZE LEBIH KECIL KARENA ADA NAMA ==========
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(44, 62, 80);
      
      let yPosition = 35;
      const lineHeight = 6; // Dikurangi dari 7 ke 6
      const col1X = margin + 5;
      const col2X = leftSectionWidth / 2 + 5;
      const maxItemsPerColumn = 13; // Dikurangi dari 15 ke 13

      sortedDokumen.forEach((dok, index) => {
        if (index >= 26) return; // Max 26 items (13 per column)

        const nopens = dok.nomorPensiun || 'N/A';
        const nama = dok.nama || 'N/A';
        
        // ========== REVISI: TAMBAH NAMA DI SAMPING NOMOR PENSIUN ==========
        const text = `${index + 1}. ${nopens} - ${nama}`;
        // ================================================================
        
        if (index < maxItemsPerColumn) {
          doc.text(text, col1X, yPosition + (index * lineHeight), { maxWidth: (leftSectionWidth / 2) - 10 });
        } else {
          const secondColIndex = index - maxItemsPerColumn;
          doc.text(text, col2X, yPosition + (secondColIndex * lineHeight), { maxWidth: (leftSectionWidth / 2) - 10 });
        }
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(127, 140, 141);
      doc.text(`Total: ${sortedDokumen.length} dokumen`, col1X, pageHeight - 10);

      const rightSectionX = leftSectionWidth + 10;

      let tahun = new Date().getFullYear();
      if (sortedDokumen.length > 0 && sortedDokumen[0].tanggalSuratPemrosesan) {
        tahun = new Date(sortedDokumen[0].tanggalSuratPemrosesan).getFullYear();
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('Box:', rightSectionX, 30);

      // ========== REVISI: PERBESAR FONT NOMOR BOX ==========
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text(data.box.nomorBox, rightSectionX + 15, 32);
      // ====================================================

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 73, 94);
      doc.text('Tahun:', rightSectionX, 50);

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text(String(tahun), rightSectionX + 20, 52);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(127, 140, 141);
      const dateStr = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      doc.text(`Dicetak: ${dateStr}`, rightSectionX, pageHeight - 10);

      const fileName = `Label_${data.box.nomorBox}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    });
  };

  const applyFilters = () => {
  let filtered = [...allDokumen];

  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(doc => 
      (doc.nrp?.toLowerCase() || '').includes(search) ||
      (doc.ktpa?.toLowerCase() || '').includes(search) ||
      (doc.nomorPensiun?.toLowerCase() || '').includes(search) ||
      (doc.nama?.toLowerCase() || '').includes(search) ||
      (doc.jenisDokumen?.toLowerCase() || '').includes(search)
    );
  }

  if (filterStatus) {
    filtered = filtered.filter(doc => doc.statusPeminjaman === filterStatus);
  }

  setFilteredDokumen(filtered);
  setSelectedIds([]);
};

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDokumen.length && filteredDokumen.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDokumen.map((d) => d._id));
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      if (Array.isArray(deleteDialog.dokumenId)) {
        await Promise.all(
          deleteDialog.dokumenId.map((id) => dokumenService.deleteDokumen(id))
        );
        alert(`${deleteDialog.dokumenId.length} dokumen berhasil dihapus`);
        setSelectedIds([]);
      } else {
        await dokumenService.deleteDokumen(deleteDialog.dokumenId);
        alert('Dokumen berhasil dihapus');
      }

      await fetchBoxDetail();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus dokumen');
    } finally {
      setDeleteDialog({ isOpen: false, dokumenId: null, dokumenNama: null });
      setLoading(false);
    }
  };

  const openPeminjamanDialog = (dokumenId, type, dokumenNama) => {
    setPeminjamanDialog({ 
      isOpen: true, 
      dokumenId, 
      type,
      dokumenNama 
    });
  };

  const handlePeminjamanSubmit = async () => {
    try {
      setLoading(true);
      const { dokumenId, type } = peminjamanDialog;

      if (type === 'pinjam') {
        await dokumenService.updatePeminjaman(dokumenId, {
          statusPeminjaman: 'Dipinjam'
        });
        alert('Dokumen berhasil dipinjamkan');
      } else {
        await dokumenService.updatePeminjaman(dokumenId, {
          statusPeminjaman: 'Tersedia',
          peminjam: null,
        });
        alert('Dokumen berhasil dikembalikan');
      }

      await fetchBoxDetail();
      setPeminjamanDialog({ isOpen: false, dokumenId: null, type: null, dokumenNama: null });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Gagal mengupdate peminjaman');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !box) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/boxes')} style={styles.backBtn}>
        ← Kembali ke Daftar Box
      </button>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Box {box?.nomorBox}</h1>
          {box?.lokerId && (
            <div 
              style={styles.lokerInfo}
              onClick={() => navigate(`/loker/detail/${box.lokerId._id}`)}
            >
              🗄️ Loker {box.lokerId.nomorLoker}
            </div>
          )}
          <p style={styles.subtitle}>
            Berisi {allDokumen.length} dari 40 dokumen maksimal
          </p>
        </div>
        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Kapasitas</div>
          <div style={styles.statusValue}>
            {allDokumen.length} / 40
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${(allDokumen.length / 40) * 100}%`,
                backgroundColor: allDokumen.length >= 40 ? '#e74c3c' : '#3498db'
              }}
            />
          </div>
        </div>
      </div>

      {allDokumen.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIcon}>📄</div>
          <h3 style={styles.emptyTitle}>Box Kosong</h3>
          <p style={styles.emptyText}>
            Belum ada dokumen dalam box ini
          </p>
          <button 
            onClick={() => navigate(`/dokumen/add?boxId=${id}`)}
            style={styles.addBtn}
          >
            + Tambah Dokumen ke Box Ini
          </button>
        </div>
      ) : (
        <>
          {/* ========== TOMBOL TAMBAH DOKUMEN (BARU) ========== */}
          <div style={styles.headerActions}>
            <button 
              onClick={() => navigate(`/dokumen/add?boxId=${id}`)}
              style={{
                ...styles.addDokumenBtn,
                ...(allDokumen.length >= 40 ? styles.disabledBtn : {})
              }}
              disabled={allDokumen.length >= 40}
            >
              {allDokumen.length >= 40 
                ? '🗄️ Box Penuh (40/40)' 
                : '+ Tambah Dokumen ke Box Ini'}
            </button>
          </div>
          {/* ================================================== */}

          <div style={styles.filterSection}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Cari NRP, KTPA, nomor pensiun, nama..."
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Dipinjam">Dipinjam</option>
            </select>

            <button
              style={styles.bulkDeleteBtn}
              disabled={selectedIds.length === 0}
              onClick={() =>
                setDeleteDialog({
                  isOpen: true,
                  dokumenId: selectedIds,
                  dokumenNama: `${selectedIds.length} dokumen terpilih`,
                })
              }
            >
              🗑️ Hapus ({selectedIds.length})
            </button>

            <div style={styles.resultInfo}>
              Menampilkan {filteredDokumen.length} dari {allDokumen.length} dokumen
            </div>
          </div>

          {filteredDokumen.length === 0 ? (
            <div style={styles.noResults}>
              Tidak ada dokumen yang sesuai dengan filter
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredDokumen.length && filteredDokumen.length > 0}
                        onChange={toggleSelectAll}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </th>
                    <th style={styles.th}>No</th>
                    <th style={styles.th}>NRP</th>
                    <th style={styles.th}>KTPA</th>
                    <th style={styles.th}>Nomor Pensiun</th>
                    <th style={styles.th}>Nama Pengaju</th>
                    <th style={styles.th}>Nama Peserta</th>
                    <th style={styles.th}>Jenis Berkas</th>
                    <th style={styles.th}>Tgl Surat</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Peminjam</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDokumen.map((doc, index) => {
                    const isDipinjam = doc.statusPeminjaman === 'Dipinjam';
                    const isChecked = selectedIds.includes(doc._id);
                    
                    return (
                      <tr key={doc._id} style={styles.tr}>
                        <td style={styles.tdCenter}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(doc._id)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                        </td>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}>{doc.nrp || '-'}</td>
                        <td style={styles.td}>{doc.ktpa}</td>
                        <td style={styles.td}>{doc.nomorPensiun}</td>
                        <td style={styles.td}><strong>{doc.namaPengaju || '-'}</strong></td>
                        <td style={styles.td}><strong>{doc.nama}</strong></td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{doc.jenisDokumen}</span>
                        </td>
                        <td style={styles.td}>{formatDate(doc.tanggalSuratPemrosesan)}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            ...(isDipinjam ? styles.statusDipinjam : styles.statusTersedia)
                          }}>
                            {doc.statusPeminjaman}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {isDipinjam ? (
                            <div style={styles.peminjamInfo}>
                              <div><strong>{doc.peminjam?.nama || '-'}</strong></div>
                              <small>{formatDate(doc.peminjam?.tanggalPinjam)}</small>
                            </div>
                          ) : '-'}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtons}>
                            {isDipinjam ? (
                              <button
                                style={{ ...styles.btn, ...styles.successBtn }}
                                onClick={() => openPeminjamanDialog(doc._id, 'kembali', doc.nama)}
                              >
                                Kembalikan
                              </button>
                            ) : (
                              <button
                                style={{ ...styles.btn, ...styles.warnBtn }}
                                onClick={() => openPeminjamanDialog(doc._id, 'pinjam', doc.nama)}
                              >
                                Pinjamkan
                              </button>
                            )}

                            <button
                              onClick={() => navigate(`/dokumen/edit/${doc._id}`)}
                              style={{ ...styles.btn, ...styles.editBtn }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => setDeleteDialog({
                                isOpen: true,
                                dokumenId: doc._id,
                                dokumenNama: doc.nama
                              })}
                              style={{ ...styles.btn, ...styles.deleteBtn }}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus dokumen atas nama "${deleteDialog.dokumenNama}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, dokumenId: null, dokumenNama: null })}
      />

      {peminjamanDialog.isOpen && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>
              {peminjamanDialog.type === 'pinjam'
                ? '📤 Pinjamkan Dokumen'
                : '📥 Kembalikan Dokumen'}
            </h3>

            <p style={styles.dialogMessage}>
              {peminjamanDialog.type === 'pinjam' ? (
                <>
                  Apakah Anda yakin ingin meminjam dokumen <strong>"{peminjamanDialog.dokumenNama}"</strong>?
                  <br /><br />
                  <span style={{ color: '#3498db', fontSize: '0.9rem' }}>
                    ℹ️ Dokumen akan tercatat dipinjam oleh Anda
                  </span>
                </>
              ) : (
                <>
                  Apakah Anda yakin dokumen <strong>"{peminjamanDialog.dokumenNama}"</strong> sudah dikembalikan?
                </>
              )}
            </p>

            <div style={styles.dialogButtons}>
              <button
                onClick={() => {
                  setPeminjamanDialog({
                    isOpen: false,
                    dokumenId: null,
                    type: null,
                    dokumenNama: null
                  });
                }}
                style={styles.dialogCancelBtn}
              >
                Batal
              </button>

              <button
                onClick={handlePeminjamanSubmit}
                style={styles.dialogConfirmBtn}
              >
                {peminjamanDialog.type === 'pinjam' ? 'Ya, Pinjamkan' : 'Ya, Kembalikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {box && <ActivityLogTimeline entity="Box" entityId={id} />}
    </div>
  );
};

const styles = {
  container: {
    padding: 'clamp(1rem, 3vw, 2rem)',
  },
  backBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  title: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  lokerInfo: {
    display: 'inline-block',
    padding: '0.35rem 0.75rem',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '16px',
    fontSize: '0.95rem',
    fontWeight: '500',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minWidth: '200px',
  },
  statusLabel: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
  },
  statusValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  // ========== STYLE BARU ==========
  headerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  addDokumenBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  disabledBtn: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  // ================================
  filterSection: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterSelect: {
    padding: '0.6rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    minWidth: '160px',
  },
  resultInfo: {
    marginLeft: 'auto',
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  bulkDeleteBtn: {
    padding: '0.6rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  tdCenter: {
    padding: 'clamp(0.75rem, 2vw, 1rem)',
    textAlign: 'center',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
  },
  noResults: {
    backgroundColor: 'white',
    padding: '2rem',
    textAlign: 'center',
    borderRadius: '8px',
    color: '#7f8c8d',
    fontSize: '1rem',
  },
  emptyBox: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '5rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  emptyText: {
    color: '#7f8c8d',
    marginBottom: '2rem',
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1200px',
  },
  th: {
    padding: 'clamp(0.75rem, 2vw, 1rem)',
    textAlign: 'left',
    backgroundColor: '#34495e',
    color: 'white',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
  },
  tr: {
    borderBottom: '1px solid #ecf0f1',
  },
  td: {
    padding: 'clamp(0.75rem, 2vw, 1rem)',
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
    verticalAlign: 'top',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  statusTersedia: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusDipinjam: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  peminjamInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '0.4rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
  },
  successBtn: {
    backgroundColor: '#27ae60',
    color: 'white',
  },
  warnBtn: {
    backgroundColor: '#f39c12',
    color: 'white',
  },
  editBtn: {
    backgroundColor: '#3498db',
    color: 'white',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  dialogTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  dialogMessage: {
    margin: '0 0 1.5rem 0',
    color: '#555',
  },
  dialogButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  dialogCancelBtn: {
    padding: '0.5rem 1.5rem',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  dialogConfirmBtn: {
    padding: '0.5rem 1.5rem',
    border: 'none',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#7f8c8d',
  },
};

export default BoxDetail;