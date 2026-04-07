import { useState, useEffect } from "react";
import jenisDokumenService from "../services/jenisDokumenService";
import { useAuth } from "../context/AuthContext";

const JenisDokumenPage = () => {
  const [list, setList] = useState([]);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  // ========== GET AUTH CONTEXT ==========
  const { isSuperAdmin } = useAuth();
  const canDelete = isSuperAdmin();
  // ======================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError("");
      const res = await jenisDokumenService.getAll();
      setList(res.data);
    } catch (err) {
      console.error("Error loading jenis berkas:", err);
      setError(
        "Gagal memuat data: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nama.trim()) {
      setError("Nama jenis berkas tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await jenisDokumenService.create({ nama: nama.trim() });
      setNama("");
      alert("Jenis berkas klaim berhasil ditambahkan");
      await loadData();
    } catch (err) {
      console.error("Error creating jenis berkas:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Gagal menambahkan jenis berkas";
      setError(errorMsg);
      alert("Gagal menambahkan: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ========== FUNGSI BARU: HANDLE DELETE ==========
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus jenis berkas "${item.nama}"?\n\nPeringatan: Jenis berkas yang masih digunakan tidak dapat dihapus.`
    );

    if (!confirmed) return;

    setDeleteLoading(item._id);
    setError("");

    try {
      const response = await jenisDokumenService.delete(item._id);
      alert(response.data.message || "Jenis berkas berhasil dihapus");
      await loadData();
    } catch (err) {
      console.error("Error deleting jenis berkas:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Gagal menghapus jenis berkas";
      setError(errorMsg);
      alert("Gagal menghapus: " + errorMsg);
    } finally {
      setDeleteLoading(null);
    }
  };
  // ================================================

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Kelola Jenis Berkas</h2>

        {/* INFO BOX UNTUK NON-SUPERADMIN */}
        {!canDelete && (
          <div style={styles.infoBox}>
            ℹ️ Hanya Super Admin yang dapat menghapus jenis berkas
          </div>
        )}

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan jenis berkas klaim baru"
            style={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            style={styles.button}
            disabled={loading || !nama.trim()}
          >
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </form>

        <div style={styles.listContainer}>
          <h3 style={styles.listTitle}>
            Daftar Jenis Berkas Klaim ({list.length})
          </h3>
          {list.length === 0 ? (
            <p style={styles.emptyState}>Belum ada jenis berkas</p>
          ) : (
            <ul style={styles.list}>
              {list.map((item, index) => (
                <li key={item._id} style={styles.listItem}>
                  <div style={styles.listContent}>
                    <span style={styles.listNumber}>{index + 1}.</span>
                    <span style={styles.listText}>{item.nama}</span>
                  </div>

                  {/* ========== TOMBOL DELETE (SUPER ADMIN ONLY) ========== */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deleteLoading === item._id}
                      style={{
                        ...styles.deleteButton,
                        opacity: deleteLoading === item._id ? 0.5 : 1,
                        cursor: deleteLoading === item._id ? 'not-allowed' : 'pointer'
                      }}
                      title="Hapus jenis berkas (Super Admin only)"
                    >
                      {deleteLoading === item._id ? '⏳' : '🗑️'}
                    </button>
                  )}
                  {/* ===================================================== */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "700px",
    margin: "2rem auto",
    padding: "0 1rem",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "1.75rem",
    color: "#2c3e50",
    marginBottom: "1.5rem",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    border: "1px solid #90caf9",
  },
  errorBox: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "2rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.95rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  listContainer: {
    marginTop: "2rem",
    borderTop: "2px solid #ecf0f1",
    paddingTop: "1.5rem",
  },
  listTitle: {
    fontSize: "1.25rem",
    color: "#2c3e50",
    marginBottom: "1rem",
  },
  emptyState: {
    color: "#7f8c8d",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem",
    borderBottom: "1px solid #ecf0f1",
    transition: "background-color 0.2s",
  },
  listContent: {
    display: "flex",
    alignItems: "center",
    flex: 1,
  },
  listNumber: {
    minWidth: "30px",
    color: "#7f8c8d",
    fontWeight: "500",
  },
  listText: {
    color: "#2c3e50",
    fontSize: "0.95rem",
  },
  deleteButton: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginLeft: "1rem",
  },
};

export default JenisDokumenPage;