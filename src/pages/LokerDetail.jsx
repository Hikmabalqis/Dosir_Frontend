import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import lokerService from "../services/lokerService";
import boxService from "../services/boxService";
import ActivityLogTimeline from "../components/ActivityLogTimeline"; // ← IMPORT BARU

const LokerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loker, setLoker] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBoxDialog, setShowAddBoxDialog] = useState(false);
  const [jumlahBox, setJumlahBox] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    boxIds: null,
    message: null,
  });

  useEffect(() => {
    fetchLokerDetail();
  }, [id]);

  const fetchLokerDetail = async () => {
    try {
      // Cek apakah ID valid
      if (!id) {
        console.error("❌ ID loker tidak ditemukan");
        alert("ID loker tidak valid");
        navigate("/loker");
        return;
      }

      console.log("🔄 Fetching loker detail for ID:", id);
      const data = await lokerService.getBoxesByLoker(id);
      console.log("✅ Loker data:", data);

      setLoker(data.loker);
      setBoxes(data.boxes);
      setSelectedIds([]);
    } catch (error) {
      console.error("❌ Error fetching loker:", error);
      console.error("Error response:", error.response?.data);
      alert(error.response?.data?.message || "Gagal memuat data loker");
      navigate("/loker");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectOne = (boxId) => {
    setSelectedIds((prev) =>
      prev.includes(boxId) ? prev.filter((x) => x !== boxId) : [...prev, boxId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === boxes.length && boxes.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(boxes.map((b) => b._id));
    }
  };

  const handleDeleteBoxes = async () => {
    try {
      setLoading(true);

      if (Array.isArray(deleteDialog.boxIds)) {
        await Promise.all(
          deleteDialog.boxIds.map((boxId) => boxService.deleteBox(boxId))
        );
        alert(`${deleteDialog.boxIds.length} box berhasil dimusnahkan`);
        setSelectedIds([]);
      } else {
        await boxService.deleteBox(deleteDialog.boxIds);
        alert("Box berhasil dimusnahkan");
      }

      await fetchLokerDetail();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memusnahkan box");
    } finally {
      setDeleteDialog({ isOpen: false, boxIds: null, message: null });
      setLoading(false);
    }
  };

  const handleAddBoxes = async () => {
    try {
      const availableSlots = 50 - (loker?.jumlahBox || 0);

      if (jumlahBox > availableSlots) {
        alert(`Hanya bisa menambah ${availableSlots} box lagi`);
        return;
      }

      await boxService.createBox({
        lokerId: id,
        jumlah: parseInt(jumlahBox),
      });

      alert(`${jumlahBox} box berhasil ditambahkan`);
      setShowAddBoxDialog(false);
      setJumlahBox(1);
      fetchLokerDetail();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menambah box");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  const availableSlots = 50 - (loker?.jumlahBox || 0);

  return (
    <div style={styles.container}>
      <button onClick={() => navigate("/loker")} style={styles.backBtn}>
        ← Kembali ke Daftar Loker
      </button>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Loker {loker?.nomorLoker}</h1>
          <p style={styles.subtitle}>
            Berisi {boxes.length} dari 50 box maksimal
          </p>
        </div>
        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Kapasitas Box</div>
          <div style={styles.statusValue}>{loker?.jumlahBox || 0} / 50</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((loker?.jumlahBox || 0) / 50) * 100}%`,
                backgroundColor:
                  (loker?.jumlahBox || 0) >= 50 ? "#e74c3c" : "#27ae60",
              }}
            />
          </div>
        </div>
      </div>

      {boxes.length === 0 ? (
        <div style={styles.emptyBox}>
          <div style={styles.emptyIcon}>🗄️</div>
          <h3 style={styles.emptyTitle}>Loker Kosong</h3>
          <p style={styles.emptyText}>Belum ada box dalam loker ini</p>
          <button
            onClick={() => setShowAddBoxDialog(true)}
            style={styles.addBtn}
          >
            + Tambah Box ke Loker Ini
          </button>
        </div>
      ) : (
        <>
          <div style={styles.actionBar}>
            <button
              onClick={() => setShowAddBoxDialog(true)}
              style={styles.addBtn}
              disabled={availableSlots === 0}
            >
              + Tambah Box ({availableSlots} slot tersisa)
            </button>

            <button
              style={styles.bulkDeleteBtn}
              disabled={selectedIds.length === 0}
              onClick={() =>
                setDeleteDialog({
                  isOpen: true,
                  boxIds: selectedIds,
                  message: `Apakah Anda yakin ingin memusnahkan ${selectedIds.length} box yang dipilih? Box yang masih berisi dokumen tidak dapat dimusnahkan.`,
                })
              }
            >
              Musnahkan ({selectedIds.length})
            </button>
          </div>

          <div style={styles.selectAllBar}>
            <label style={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={
                  selectedIds.length === boxes.length && boxes.length > 0
                }
                onChange={toggleSelectAll}
                style={{
                  width: 18,
                  height: 18,
                  cursor: "pointer",
                  marginRight: 8,
                }}
              />
              Pilih Semua ({boxes.length} box)
            </label>
          </div>

          <div style={styles.boxGrid}>
            {boxes.map((box) => {
              const isChecked = selectedIds.includes(box._id);

              return (
                <div key={box._id} style={styles.boxCard}>
                  <div style={styles.boxCheckbox}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectOne(box._id)}
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                  </div>

                  <div style={styles.boxHeader}>
                    <div style={styles.boxNumber}>{box.nomorBox}</div>
                    <span
                      style={{
                        ...styles.boxBadge,
                        ...(box.jumlahDokumen >= 40
                          ? styles.badgeFull
                          : box.jumlahDokumen === 0
                          ? styles.badgeEmpty
                          : styles.badgePartial),
                      }}
                    >
                      {box.jumlahDokumen >= 40
                        ? "Penuh"
                        : box.jumlahDokumen === 0
                        ? "Kosong"
                        : "Terisi"}
                    </span>
                  </div>
                  <div style={styles.boxContent}>
                    <div style={styles.boxInfo}>
                      <span style={styles.boxLabel}>Dokumen:</span>
                      <span style={styles.boxValue}>
                        {box.jumlahDokumen} / 40
                      </span>
                    </div>
                    <div style={styles.boxProgressBar}>
                      <div
                        style={{
                          ...styles.boxProgressFill,
                          width: `${(box.jumlahDokumen / 40) * 100}%`,
                          backgroundColor:
                            box.jumlahDokumen >= 25 ? "#e74c3c" : "#3498db",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/boxes/detail/${box._id}`)}
                    style={styles.viewBoxBtn}
                  >
                    Lihat Detail Box
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showAddBoxDialog && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>
              Tambah Box ke Loker {loker?.nomorLoker}
            </h3>

            <div style={styles.dialogContent}>
              <p style={styles.dialogInfo}>
                Slot tersedia: <strong>{availableSlots} box</strong>
              </p>

              <div style={styles.formGroup}>
                <label style={styles.label}>Jumlah Box yang Ditambahkan</label>
                <input
                  type="number"
                  min="1"
                  max={availableSlots}
                  value={jumlahBox}
                  onChange={(e) => setJumlahBox(e.target.value)}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Box akan diberi nama: {loker?.nomorLoker}1,{" "}
                  {loker?.nomorLoker}2, dst
                </small>
              </div>
            </div>

            <div style={styles.dialogButtons}>
              <button
                onClick={() => {
                  setShowAddBoxDialog(false);
                  setJumlahBox(1);
                }}
                style={styles.dialogCancelBtn}
              >
                Batal
              </button>
              <button onClick={handleAddBoxes} style={styles.dialogConfirmBtn}>
                Tambah Box
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDialog.isOpen && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>🗑️ Konfirmasi Musnahkan</h3>
            <p style={styles.dialogMessage}>{deleteDialog.message}</p>

            <div style={styles.dialogButtons}>
              <button
                onClick={() =>
                  setDeleteDialog({
                    isOpen: false,
                    boxIds: null,
                    message: null,
                  })
                }
                style={styles.dialogCancelBtn}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteBoxes}
                style={styles.dialogDeleteBtn}
              >
                Musnahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ACTIVITY LOG TIMELINE (TAMBAHAN BARU) ========== */}
      {loker && <ActivityLogTimeline entity="Loker" entityId={id} />}
      {/* ============================================================= */}
    </div>
  );
};

const styles = {
  container: {
    padding: "clamp(1rem, 3vw, 2rem)",
  },
  backBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "2rem",
  },
  title: {
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#7f8c8d",
    fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
  },
  statusCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    minWidth: "200px",
  },
  statusLabel: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  statusValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#ecf0f1",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  actionBar: {
    marginBottom: "1.5rem",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  bulkDeleteBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  selectAllBar: {
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  selectAllLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#2c3e50",
    cursor: "pointer",
    userSelect: "none",
  },
  addBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  emptyBox: {
    backgroundColor: "white",
    padding: "4rem 2rem",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  emptyIcon: {
    fontSize: "5rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.5rem",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  emptyText: {
    color: "#7f8c8d",
    marginBottom: "2rem",
  },
  boxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  boxCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    position: "relative",
  },
  boxCheckbox: {
    position: "absolute",
    top: "1rem",
    left: "1rem",
  },
  boxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boxNumber: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  boxBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  badgeFull: {
    backgroundColor: "#fee",
    color: "#c33",
  },
  badgeEmpty: {
    backgroundColor: "#ffe",
    color: "#cc3",
  },
  badgePartial: {
    backgroundColor: "#efe",
    color: "#3c3",
  },
  boxContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  boxInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
  },
  boxLabel: {
    color: "#7f8c8d",
  },
  boxValue: {
    fontWeight: "600",
    color: "#2c3e50",
  },
  boxProgressBar: {
    width: "100%",
    height: "6px",
    backgroundColor: "#ecf0f1",
    borderRadius: "3px",
    overflow: "hidden",
  },
  boxProgressFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  viewBoxBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  dialogTitle: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.25rem",
    color: "#2c3e50",
  },
  dialogContent: {
    marginBottom: "1.5rem",
  },
  dialogInfo: {
    margin: "0 0 1rem 0",
    color: "#555",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#2c3e50",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.95rem",
  },
  hint: {
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  dialogMessage: {
    margin: "0 0 1.5rem 0",
    color: "#555",
  },
  dialogButtons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  dialogCancelBtn: {
    padding: "0.5rem 1.5rem",
    border: "1px solid #ddd",
    backgroundColor: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  dialogConfirmBtn: {
    padding: "0.5rem 1.5rem",
    border: "none",
    backgroundColor: "#27ae60",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  dialogDeleteBtn: {
    padding: "0.5rem 1.5rem",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
};

export default LokerDetail;
