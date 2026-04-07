import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import dokumenService from "../services/dokumenService";
import boxService from "../services/boxService";
import { formatDateForInput } from "../utils/formatDate";
import jenisDokumenService from "../services/jenisDokumenService";
import SearchableSelect from "../components/SearchableSelect";

const DokumenForm = () => {
  const [formData, setFormData] = useState({
    nrp: "",
    ktpa: "",
    nomorPensiun: "",
    namaPengaju: "",
    nama: "",
    jenisDokumen: "",
    tanggalSuratPemrosesan: "",
    boxId: "",
  });
  const [jenisDokumenList, setJenisDokumenList] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;
  // ========== HAPUS STATE MODAL (TIDAK DIPAKAI LAGI) ==========
  // const [showJenisModal, setShowJenisModal] = useState(false);
  // const [newJenis, setNewJenis] = useState('');
  // ===========================================================

  const [isFromBoxDetail, setIsFromBoxDetail] = useState(false);
  const [selectedBoxInfo, setSelectedBoxInfo] = useState(null);

  useEffect(() => {
    fetchBoxes();
    fetchJenisDokumen();

    const params = new URLSearchParams(location.search);
    const boxIdFromUrl = params.get("boxId");

    if (boxIdFromUrl && !isEdit) {
      setFormData((prev) => ({
        ...prev,
        boxId: boxIdFromUrl,
      }));
      setIsFromBoxDetail(true);
    }

    if (isEdit) {
      fetchDokumen();
    }
  }, [id, location.search, isEdit]);

  useEffect(() => {
    if (formData.boxId && boxes.length > 0) {
      const box = boxes.find((b) => b._id === formData.boxId);
      setSelectedBoxInfo(box);
    } else {
      setSelectedBoxInfo(null);
    }
  }, [formData.boxId, boxes]);

  const fetchBoxes = async () => {
    try {
      const data = await boxService.getAllBoxes();
      setBoxes(data);
    } catch (error) {
      alert("Gagal memuat data box");
    }
  };

  const fetchJenisDokumen = async () => {
    try {
      const res = await jenisDokumenService.getAll();
      setJenisDokumenList(res.data);
    } catch (err) {
      console.error("Error fetching jenis berkas:", err);
      alert(
        "Gagal memuat jenis berkas: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const fetchDokumen = async () => {
    try {
      const data = await dokumenService.getDokumenById(id);
      setFormData({
        nrp: data.nrp || "",
        ktpa: data.ktpa || "",
        nomorPensiun: data.nomorPensiun || "",
        namaPengaju: data.namaPengaju || "",
        nama: data.nama || "",
        jenisDokumen: data.jenisDokumen || "",
        tanggalSuratPemrosesan: formatDateForInput(data.tanggalSuratPemrosesan),
        boxId: data.boxId?._id || "",
      });
    } catch (error) {
      alert("Gagal memuat data dokumen");
      navigate("/dokumen");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setDuplicateWarning(null);
  };

  // ========== HAPUS FUNGSI INI (TIDAK DIPAKAI LAGI) ==========
  // const handleAddJenisDokumen = async () => { ... }
  // ===========================================================

  // ========== FUNGSI BARU: NAVIGATE KE JENIS DOKUMEN PAGE ==========
  const handleNavigateToJenisDokumen = () => {
    // Simpan current state form ke sessionStorage agar tidak hilang
    sessionStorage.setItem("dokumenFormData", JSON.stringify(formData));

    // Navigate ke halaman Jenis Dokumen
    navigate("/jenis-dokumen");
  };
  // ================================================================

  // ========== RESTORE FORM DATA SAAT KEMBALI ==========
  useEffect(() => {
    const savedFormData = sessionStorage.getItem("dokumenFormData");
    if (savedFormData && !isEdit) {
      const parsed = JSON.parse(savedFormData);
      setFormData(parsed);
      sessionStorage.removeItem("dokumenFormData"); // Clear setelah restore
    }
  }, [isEdit]);
  // ===================================================

  const checkForDuplicates = async () => {
    try {
      const checkData = {
        nrp: formData.nrp,
        namaPengaju: formData.namaPengaju,
        ktpa: formData.ktpa,
        nomorPensiun: formData.nomorPensiun,
        nama: formData.nama,
        excludeId: isEdit ? id : null,
      };

      const result = await dokumenService.checkDuplicate(checkData);
      return result;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return { hasDuplicate: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const duplicateCheck = await checkForDuplicates();

    if (duplicateCheck.hasDuplicate) {
      const duplicateFields = [];

      if (duplicateCheck.duplicates.nrp) duplicateFields.push("NRP");
      if (duplicateCheck.duplicates.ktpa) duplicateFields.push("KTPA");
      if (duplicateCheck.duplicates.nomorPensiun)
        duplicateFields.push("Nomor Pensiun");
      if (duplicateCheck.duplicates.nama) duplicateFields.push("Nama");

      setDuplicateWarning({
        fields: duplicateFields,
        message: `Data berikut sudah ada di database: ${duplicateFields.join(", ")}`,
      });
      setShowConfirmDialog(true);
      return;
    }

    await submitForm();
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      if (isEdit) {
        await dokumenService.updateDokumen(id, formData);
        alert("Dokumen berhasil diupdate");
      } else {
        await dokumenService.createDokumen(formData);
        alert("Dokumen berhasil ditambahkan");
      }

      if (isFromBoxDetail && formData.boxId) {
        navigate(`/boxes/detail/${formData.boxId}`);
      } else {
        navigate("/dokumen");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    submitForm();
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
    setDuplicateWarning(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>
          {isEdit ? "Edit Dokumen" : "Tambah Dokumen Baru"}
        </h1>

        {isFromBoxDetail && selectedBoxInfo && (
          <div style={styles.boxNotice}>
            <div style={styles.boxNoticeIcon}>🗄️</div>
            <div style={styles.boxNoticeContent}>
              <strong>Dokumen akan ditambahkan ke:</strong>
              <div style={styles.boxNoticeDetail}>
                Box {selectedBoxInfo.nomorBox}
                <span style={styles.boxCapacity}>
                  ({selectedBoxInfo.jumlahDokumen}/40 terisi)
                </span>
              </div>
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {duplicateWarning && !showConfirmDialog && (
          <div style={styles.warning}>⚠️ {duplicateWarning.message}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              NRP (Nomor Register Peserta){" "}
              <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="nrp"
              value={formData.nrp}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Masukkan NRP"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                KTPA <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="ktpa"
                value={formData.ktpa}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Masukkan KTPA"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Nomor Pensiun <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="nomorPensiun"
                value={formData.nomorPensiun}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Masukkan nomor pensiun"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Nama Pengaju <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="namaPengaju"
              value={formData.namaPengaju}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Masukkan nama pengaju"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Nama Peserta <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Masukkan nama peserta"
            />
          </div>

          {/* ========== UPDATE SECTION JENIS DOKUMEN ========== */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Jenis Berkas Klaim<span style={styles.required}>*</span>
            </label>

            <div style={styles.jenisRow}>
              <div style={{ flex: 1, width: "100%" }}>
                <SearchableSelect
                  name="jenisDokumen"
                  value={formData.jenisDokumen}
                  onChange={handleChange}
                  options={jenisDokumenList.map((item) => ({
                    label: item.nama,
                    value: item.nama,
                  }))}
                  placeholder="Cari atau pilih jenis berkas..."
                  required={true}
                  style={{ width: "100%" }}
                />
              </div>

              {/* ========== TOMBOL NAVIGATE KE JENIS DOKUMEN PAGE ========== */}
              <button
                type="button"
                onClick={handleNavigateToJenisDokumen}
                style={styles.addJenisBtn}
                title="Kelola Jenis Berkas Klaim"
              >
                ⚙️ Kelola
              </button>
              {/* ========================================================== */}
            </div>

            <small style={styles.hint}>
              Klik "Kelola" untuk menambah atau menghapus jenis berkas
            </small>
          </div>
          {/* ================================================ */}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Tanggal Surat Pemrosesan <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="tanggalSuratPemrosesan"
              value={formData.tanggalSuratPemrosesan}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Box Penyimpanan{" "}
              {isFromBoxDetail && <span style={styles.required}>*</span>}
              {!isFromBoxDetail && " (Opsional)"}
            </label>

            <SearchableSelect
              name="boxId"
              value={formData.boxId}
              onChange={handleChange}
              options={boxes.map((box) => ({
                label: `Box ${box.nomorBox} (${box.jumlahDokumen}/40 terisi)${box.jumlahDokumen >= 40 ? " - PENUH" : ""}`,
                value: box._id,
                disabled: box.jumlahDokumen >= 40,
              }))}
              placeholder={
                isFromBoxDetail
                  ? "Box sudah dipilih"
                  : "Cari atau pilih box (opsional)..."
              }
              disabled={isFromBoxDetail}
              required={isFromBoxDetail}
            />

            {!isFromBoxDetail && (
              <small style={styles.hint}>
                Box bersifat opsional. Dokumen dapat ditambahkan ke box nanti.
              </small>
            )}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => {
                if (isFromBoxDetail && formData.boxId) {
                  navigate(`/boxes/detail/${formData.boxId}`);
                } else {
                  navigate("/dokumen");
                }
              }}
              style={styles.cancelBtn}
            >
              Batal
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading
                ? "Menyimpan..."
                : isEdit
                  ? "Update Dokumen"
                  : "Simpan Dokumen"}
            </button>
          </div>
        </form>
      </div>

      {/* ========== HAPUS MODAL TAMBAH JENIS (TIDAK DIPAKAI LAGI) ========== */}
      {/* Modal sudah dihapus karena sekarang navigate ke page terpisah */}
      {/* ================================================================== */}

      {showConfirmDialog && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>⚠️ Data Duplikat Terdeteksi</h3>
            <p style={styles.dialogMessage}>{duplicateWarning?.message}</p>
            <p style={styles.dialogQuestion}>
              Apakah Anda yakin ingin tetap menyimpan data ini?
            </p>
            <div style={styles.dialogButtons}>
              <button
                onClick={handleCancelSubmit}
                style={styles.dialogCancelBtn}
              >
                Tidak, Periksa Kembali
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={styles.dialogConfirmBtn}
              >
                Ya, Tetap Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "clamp(1rem, 3vw, 2rem)",
    maxWidth: "900px",
    margin: "0 auto",
    position: "relative",
    width: "100%",
  },
  formCard: {
    backgroundColor: "white",
    padding: "clamp(1.5rem, 4vw, 2rem)",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "clamp(1.4rem, 4vw, 1.75rem)",
    color: "#2c3e50",
    marginBottom: "1.5rem",
  },
  boxNotice: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    padding: "1rem 1.25rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "2px solid #90caf9",
  },
  boxNoticeIcon: {
    fontSize: "2rem",
  },
  boxNoticeContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  boxNoticeDetail: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginTop: "0.25rem",
  },
  boxCapacity: {
    fontSize: "0.9rem",
    fontWeight: "normal",
    color: "#1976d2",
  },
  error: {
    backgroundColor: "#fee",
    color: "#c33",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  warning: {
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "0.75rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    border: "1px solid #ffeaa7",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    width: "100%",
  },
  label: {
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#2c3e50",
  },
  required: {
    color: "#e74c3c",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  jenisRow: {
    display: "flex",
    gap: "0.5rem",
    width: "100%",
    flexWrap: "wrap",
  },

  jenisSelect: {
    flex: "1 1 250px",
    minWidth: "0",
  },

  addJenisBtn: {
    padding: "10px 16px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  hint: {
    fontSize: "0.85rem",
    color: "#7f8c8d",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    marginTop: "1rem",
  },
  cancelBtn: {
    flex: 1,
    padding: "0.75rem",
    border: "1px solid #ddd",
    backgroundColor: "white",
    borderRadius: "4px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  submitBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
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
    margin: "0 0 1rem 0",
    fontSize: "1.25rem",
    color: "#2c3e50",
  },
  dialogMessage: {
    margin: "0 0 1rem 0",
    color: "#555",
    lineHeight: "1.5",
  },
  dialogQuestion: {
    margin: "0 0 1.5rem 0",
    color: "#2c3e50",
    fontWeight: "500",
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
    backgroundColor: "#3498db",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
  },
};

export default DokumenForm;
