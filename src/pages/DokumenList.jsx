import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import dokumenService from "../services/dokumenService";
import SearchBar from "../components/SearchBar";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDate } from "../utils/formatDate";
import ActivityLogTimeline from "../components/ActivityLogTimeline";

const DokumenList = () => {
  const [dokumen, setDokumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    dokumenId: null,
    dokumenNama: null,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedIds, setSelectedIds] = useState([]);
  const [logModal, setLogModal] = useState({
    isOpen: false,
    dokumenId: null,
    dokumenName: null,
  });

  // State untuk Export CSV Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilter, setExportFilter] = useState({
    type: "all",
    startDate: "",
    endDate: "",
    month: "",
    year: "",
  });

  const navigate = useNavigate();
  const mountedRef = useRef(false);

  // Fungsi filter dokumen berdasarkan tanggal
  const filterDokumenByDate = (docs) => {
    const activeDokumen = docs.filter((doc) => !doc.isDeleted);

    if (exportFilter.type === "all") {
      return activeDokumen;
    }

    if (exportFilter.type === "dateRange") {
      if (!exportFilter.startDate || !exportFilter.endDate)
        return activeDokumen;

      const start = new Date(exportFilter.startDate);
      const end = new Date(exportFilter.endDate);
      end.setHours(23, 59, 59, 999);

      return activeDokumen.filter((doc) => {
        const docDate = new Date(doc.tanggalSuratPemrosesan || doc.createdAt);
        return docDate >= start && docDate <= end;
      });
    }

    if (exportFilter.type === "month" && exportFilter.month) {
      const [year, month] = exportFilter.month.split("-").map(Number);

      return activeDokumen.filter((doc) => {
        const docDate = new Date(doc.tanggalSuratPemrosesan || doc.createdAt);
        return (
          docDate.getFullYear() === year && docDate.getMonth() === month - 1
        );
      });
    }

    if (exportFilter.type === "year" && exportFilter.year) {
      const selectedYear = parseInt(exportFilter.year);

      return activeDokumen.filter((doc) => {
        const docDate = new Date(doc.tanggalSuratPemrosesan || doc.createdAt);
        return docDate.getFullYear() === selectedYear;
      });
    }

    return activeDokumen;
  };

  // Hitung preview data yang akan di-export
  const getExportPreviewCount = () => {
    return filterDokumenByDate(dokumen).length;
  };

  // Fungsi export CSV dengan filter
  const handleExportCSV = () => {
  try {
    // Validasi filter tanggal
    if (
      exportFilter.type === "dateRange" &&
      exportFilter.startDate &&
      exportFilter.endDate
    ) {
      const start = new Date(exportFilter.startDate);
      const end = new Date(exportFilter.endDate);
      if (start > end) {
        alert("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
        return;
      }
    }

    const filteredDokumen = filterDokumenByDate(dokumen);

    if (filteredDokumen.length === 0) {
      alert("Tidak ada dokumen yang sesuai dengan filter untuk diekspor");
      return;
    }

    // ========== FIX 1: HEADER TAMBAH KOLOM "NO" ==========
    const headers = [
      "No",          
      "NRP",
      "KTPA",
      "Nomor Pensiun",
      "Nama Pengaju",
      "Nama Peserta",
      "Jenis Berkas",
      "Tanggal Dokumen",
      "Tanggal Input",
      "Box",
      "Status",
      "Peminjam",
      "Tanggal Pinjam",
      "Dimusnahkan",
    ];

    // ========== FIX 2: ESCAPE CSV DENGAN QUOTE UNTUK NOMOR PENSIUN ==========
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      
      const stringValue = String(value);
      
      // Always quote untuk preserve format (especially for nomor pensiun)
      // Escape internal quotes
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    };

    // Data rows dengan escaping yang proper
    const rows = filteredDokumen.map((doc, index) => [
      index + 1,                                              // No
      doc.nrp || "-",                                         // NRP
      doc.ktpa || "-",                                        // KTPA
      doc.nomorPensiun || "-",                                // ← FIX: Nomor Pensiun
      doc.namaPengaju || "-",                                 // Nama Pengaju
      doc.nama || "-",                                        // Nama Peserta
      doc.jenisDokumen || "-",                                // Jenis Berkas
      formatDate(doc.tanggalSuratPemrosesan) || "-",         // Tanggal Dokumen
      formatDate(doc.createdAt) || "-",                      // Tanggal Input
      doc.boxId?.nomorBox ? `Box ${doc.boxId.nomorBox}` : "-", // Box
      doc.statusPeminjaman || "Tersedia",                    // Status
      doc.peminjam?.nama || "-",                             // Peminjam
      doc.peminjam?.tanggalPinjam 
        ? formatDate(doc.peminjam.tanggalPinjam) 
        : "-",                                                // Tanggal Pinjam
      doc.isDeleted ? "Ya" : "Tidak",                        // Dimusnahkan
    ]);

    // Buat konten CSV dengan proper escaping
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Tambah BOM untuk encoding UTF-8 (Excel compatibility)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Generate filename
    let filename = "Dokumen_Arsip";
    if (
      exportFilter.type === "dateRange" &&
      exportFilter.startDate &&
      exportFilter.endDate
    ) {
      filename += `_${exportFilter.startDate.replace(
        /-/g,
        ""
      )}_sd_${exportFilter.endDate.replace(/-/g, "")}`;
    } else if (exportFilter.type === "month" && exportFilter.month) {
      filename += `_${exportFilter.month.replace("-", "_")}`;
    } else if (exportFilter.type === "year" && exportFilter.year) {
      filename += `_${exportFilter.year}`;
    } else {
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      filename += `_${today}`;
    }
    filename += ".csv";

    // Download file
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Reset dan tutup modal
    setShowExportModal(false);
    setExportFilter({
      type: "all",
      startDate: "",
      endDate: "",
      month: "",
      year: "",
    });

    alert(
      `✅ Berhasil mengekspor ${filteredDokumen.length} dokumen ke ${filename}`
    );
  } catch (error) {
    console.error("Error exporting CSV:", error);
    alert(
      "❌ Gagal mengekspor CSV: " + (error.message || "Terjadi kesalahan")
    );
  }
};

  const getLoggedAdmin = () => {
    try {
      const possibleKeys = [
        "admin",
        "user",
        "currentUser",
        "currentAdmin",
        "authUser",
      ];
      for (const key of possibleKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              (parsed._id || parsed.id) &&
              (parsed.nama || parsed.name || parsed.username)
            ) {
              return {
                _id: parsed._id || parsed.id,
                nama:
                  parsed.nama ||
                  parsed.name ||
                  parsed.fullname ||
                  parsed.username,
                username:
                  parsed.username ||
                  parsed.user ||
                  parsed.email ||
                  parsed.nama ||
                  "",
              };
            }
          } catch (e) {}
        }
      }

      const tokenKeys = ["token", "accessToken", "authToken"];
      for (const tkey of tokenKeys) {
        const token = localStorage.getItem(tkey);
        if (token) {
          const parts = token.split(".");
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(atob(parts[1]));
              if (
                payload &&
                (payload._id || payload.id) &&
                (payload.nama || payload.name || payload.username)
              ) {
                return {
                  _id: payload._id || payload.id,
                  nama: payload.nama || payload.name || payload.username,
                  username: payload.username || payload.user || "",
                };
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {}
    return null;
  };

  const handlePinjam = async (dokumenId, dokumenNama) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin meminjam dokumen "${dokumenNama}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const admin = getLoggedAdmin();

      if (!admin) {
        alert("Anda harus login sebagai admin untuk meminjam dokumen");
        return;
      }

      const peminjamPayload = {
        adminId: admin._id,
        nama: admin.nama,
        username: admin.username,
        tanggalPinjam: new Date().toISOString(),
      };

      await dokumenService.updatePeminjaman(dokumenId, {
        statusPeminjaman: "Dipinjam",
        peminjam: peminjamPayload,
      });

      alert(
        `Dokumen "${dokumenNama}" berhasil dipinjamkan atas nama ${admin.nama}`
      );

      await fetchDokumen({ showLoading: false });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal meminjamkan dokumen");
    } finally {
      setLoading(false);
    }
  };

  const handleKembali = async (dokumenId, dokumenNama) => {
    if (
      !window.confirm(
        `Apakah Anda yakin dokumen "${dokumenNama}" sudah dikembalikan?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await dokumenService.updatePeminjaman(dokumenId, {
        statusPeminjaman: "Tersedia",
        peminjam: null,
      });

      alert("Dokumen berhasil dikembalikan");
      await fetchDokumen({ showLoading: false });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Gagal mengembalikan dokumen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchDokumen({ showLoading: true });
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (mountedRef.current) {
      fetchDokumen({
        showLoading: false,
        search: debouncedSearch,
        status: filterStatus,
      });
    }
  }, [debouncedSearch, filterStatus, showDeleted]);

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === dokumen.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dokumen.map((d) => d._id));
    }
  };

  const fetchDokumen = async ({
    showLoading = false,
    search = null,
    status = null,
  } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const params = {};
      const q = search !== null ? search : debouncedSearch;
      const s = status !== null ? status : filterStatus;

      if (q) params.search = q;
      if (showDeleted) params.includeDeleted = "true";

      const data = await dokumenService.getAllDokumen(params);
      const filtered = s ? data.filter((d) => d.statusPeminjaman === s) : data;

      setDokumen(filtered || []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data dokumen");
      setDokumen([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      if (Array.isArray(deleteDialog.dokumenId)) {
        await Promise.all(
          deleteDialog.dokumenId.map((id) => dokumenService.deleteDokumen(id))
        );
        alert(`${deleteDialog.dokumenId.length} dokumen berhasil dimusnahkan`);
        setSelectedIds([]);
      } else {
        await dokumenService.deleteDokumen(deleteDialog.dokumenId);
        alert("Dokumen berhasil dimusnahkan");
      }

      await fetchDokumen({ showLoading: true });
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Gagal memusnahkan dokumen");
    } finally {
      setDeleteDialog({ isOpen: false, dokumenId: null, dokumenNama: null });
      setLoading(false);
    }
  };

  const COLORS = {
    muted: "#7f8c8d",
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  const renderCard = (doc, index) => {
    const isDipinjam = doc.statusPeminjaman === "Dipinjam";
    const isDeleted = doc.isDeleted;
    const checked = selectedIds.includes(doc._id);

    return (
      <div key={doc._id} style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleSelectOne(doc._id)}
            style={{ width: 18, height: 18, marginRight: 8 }}
          />
          <span style={{ fontSize: 13, color: COLORS.muted }}>Pilih</span>
        </div>

        <div style={styles.cardHeader}>
          <div>
            <div style={styles.cardTitle}>{doc.nama || "-"}</div>
            <div style={styles.cardSub}>
              <span style={{ marginRight: 12 }}>
                No. Pensiun: <strong>{doc.nomorPensiun || "-"}</strong>
              </span>
              <span>
                KTPA: <strong>{doc.ktpa || "-"}</strong>
              </span>
            </div>
          </div>
          <div style={styles.cardRight}>
            <div
              style={{
                ...styles.badge,
                ...(isDipinjam ? styles.statusDipinjam : styles.statusTersedia),
              }}
            >
              {doc.statusPeminjaman || "-"}
            </div>
            <div style={styles.cardIndex}>{index + 1}</div>
          </div>
        </div>

        <div style={styles.cardBody}>
          <div style={styles.cardRow}>
            <div style={styles.cardLabel}>Pengaju</div>
            <div style={styles.cardValue}>{doc.namaPengaju || "-"}</div>
          </div>
          <div style={styles.cardRow}>
            <div style={styles.cardLabel}>Jenis</div>
            <div style={styles.cardValue}>{doc.jenisDokumen || "-"}</div>
          </div>
          <div style={styles.cardRow}>
            <div style={styles.cardLabel}>Tgl Surat Pemrosesan</div>
            <div style={styles.cardValue}>
              {formatDate(doc.tanggalSuratPemrosesan) || "-"}
            </div>
          </div>
          <div style={styles.cardRow}>
            <div style={styles.cardLabel}>Box</div>
            <div style={styles.cardValue}>
              {doc.boxId?.nomorBox ? `Box ${doc.boxId?.nomorBox}` : "-"}
            </div>
          </div>

          {isDipinjam && (
            <div style={styles.cardRow}>
              <div style={styles.cardLabel}>Peminjam</div>
              <div style={styles.cardValue}>
                <strong>{doc.peminjam?.nama || "-"}</strong>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {formatDate(doc.peminjam?.tanggalPinjam)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.cardActions}>
          {isDipinjam ? (
            <button
              style={{ ...styles.btn, ...styles.successBtn }}
              onClick={() => handleKembali(doc._id, doc.nama)}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Kembalikan"}
            </button>
          ) : (
            <button
              style={{ ...styles.btn, ...styles.warnBtn }}
              onClick={() => handlePinjam(doc._id, doc.nama)}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Pinjamkan"}
            </button>
          )}

          <button
            style={{
              ...styles.btn,
              backgroundColor: "#9b59b6",
              color: "white",
            }}
            onClick={() =>
              setLogModal({
                isOpen: true,
                dokumenId: doc._id,
                dokumenName: doc.nama,
              })
            }
          >
            📜 Riwayat
          </button>

          <button
            style={{ ...styles.btn, ...styles.primaryBtn }}
            onClick={() => navigate(`/dokumen/edit/${doc._id}`)}
          >
            Edit
          </button>

          <button
            style={{ ...styles.btn, ...styles.dangerBtn }}
            onClick={() =>
              setDeleteDialog({
                isOpen: true,
                dokumenId: doc._id,
                dokumenNama: doc.nama,
              })
            }
          >
            Musnahkan
          </button>
        </div>

        {isDeleted && (
          <div style={styles.deletedInfo}>
            <strong>Dimusnahkan pada:</strong> {formatDate(doc.deletedAt)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen Dokumen</h1>
          <p style={styles.subtitle}>Kelola dokumen arsip</p>
        </div>

        <div style={styles.headerRight}>
          <button
            style={styles.addBtn}
            onClick={() => navigate("/dokumen/add")}
          >
            + Tambah Dokumen
          </button>

          <button
            style={{ ...styles.addBtn, backgroundColor: "#16a085" }}
            onClick={() => setShowExportModal(true)}
            disabled={dokumen.filter((d) => !d.isDeleted).length === 0}
          >
            📊 Export CSV
          </button>

          <button
            style={{ ...styles.addBtn, backgroundColor: "#e74c3c" }}
            disabled={selectedIds.length === 0}
            onClick={() =>
              setDeleteDialog({
                isOpen: true,
                dokumenId: selectedIds,
                dokumenNama: `${selectedIds.length} dokumen terpilih`,
              })
            }
          >
            Musnahkan ({selectedIds.length})
          </button>
        </div>
      </div>

      <div style={styles.filterSection}>
        <SearchBar
          value={searchTerm}
          onChange={(v) => setSearchTerm(v)}
          placeholder="Cari nomor pensiun, nama, KTPA, jenis berkas..."
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

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            style={styles.checkbox}
          />
          Tampilkan dokumen yang dimusnahkan
        </label>
      </div>

      {isMobile ? (
        <div style={styles.cardList}>
          {dokumen.length === 0 ? (
            <div style={styles.emptyState}>
              {searchTerm || filterStatus
                ? "Tidak ada dokumen yang sesuai dengan pencarian"
                : "Belum ada dokumen."}
            </div>
          ) : (
            dokumen.map((doc, idx) => renderCard(doc, idx))
          )}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === dokumen.length &&
                      dokumen.length > 0
                    }
                    onChange={toggleSelectAll}
                    style={{ width: 18, height: 18 }}
                  />
                </th>
                <th style={styles.th}>No</th>
                <th style={styles.th}>NRP</th>
                <th style={styles.th}>Nomor Pensiun</th>
                <th style={styles.th}>KTPA</th>
                <th style={styles.th}>Nama Pengaju</th>
                <th style={styles.th}>Nama Peserta</th>
                <th style={styles.th}>Jenis Berkas</th>
                <th style={styles.th}>Tanggal Dokumen</th>
                <th style={styles.th}>Tanggal Input</th>
                <th style={styles.th}>Box</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Peminjam</th>
                <th style={styles.th}>Tanggal Dimusnahkan</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {dokumen.length === 0 ? (
                <tr>
                  <td colSpan="15" style={styles.emptyState}>
                    Tidak ada dokumen.
                  </td>
                </tr>
              ) : (
                dokumen.map((doc, index) => {
                  const isDipinjam = doc.statusPeminjaman === "Dipinjam";
                  const isDeleted = doc.isDeleted;

                  return (
                    <tr
                      key={doc._id}
                      style={{
                        ...styles.tr,
                        ...(isDeleted ? styles.deletedRow : {}),
                      }}
                    >
                      <td style={styles.tdCenter}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(doc._id)}
                          onChange={() => toggleSelectOne(doc._id)}
                          style={{ width: 18, height: 18 }}
                        />
                      </td>

                      <td style={styles.tdCenter}>{index + 1}</td>
                      <td style={styles.td}>{doc.nrp || "-"}</td>
                      <td style={styles.td}>
                        {doc.nomorPensiun || "-"}
                        {isDeleted && (
                          <span style={styles.deletedBadge}> DIMUSNAHKAN</span>
                        )}
                      </td>
                      <td style={styles.td}>{doc.ktpa || "-"}</td>

                      <td style={{ ...styles.td, ...styles.nameCell }}>
                        <strong>{doc.namaPengaju || "-"}</strong>
                      </td>
                      <td style={{ ...styles.td, ...styles.nameCell }}>
                        <strong>{doc.nama || "-"}</strong>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.smallBadge}>
                          {doc.jenisDokumen || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {formatDate(doc.tanggalSuratPemrosesan) || "-"}
                      </td>
                      <td style={styles.td}>
                        {formatDate(doc.createdAt) || "-"}
                      </td>
                      <td style={styles.td}>
                        {doc.boxId?.nomorBox
                          ? `Box ${doc.boxId.nomorBox}`
                          : "-"}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(isDipinjam
                              ? styles.statusDipinjam
                              : styles.statusTersedia),
                          }}
                        >
                          {doc.statusPeminjaman}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {isDipinjam ? (
                          <div style={styles.peminjamInfo}>
                            <div style={{ fontWeight: 600 }}>
                              {doc.peminjam?.nama || "-"}
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.muted }}>
                              {formatDate(doc.peminjam?.tanggalPinjam)}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td style={styles.td}>
                        {isDeleted ? formatDate(doc.deletedAt) : "-"}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          {isDipinjam ? (
                            <button
                              style={{ ...styles.btn, ...styles.successBtn }}
                              onClick={() => handleKembali(doc._id, doc.nama)}
                              disabled={loading}
                            >
                              {loading ? "..." : "Kembali"}
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.btn, ...styles.warnBtn }}
                              onClick={() => handlePinjam(doc._id, doc.nama)}
                              disabled={loading}
                            >
                              {loading ? "..." : "Pinjam"}
                            </button>
                          )}

                          <button
                            style={{
                              ...styles.btn,
                              backgroundColor: "#9b59b6",
                              color: "white",
                            }}
                            onClick={() =>
                              setLogModal({
                                isOpen: true,
                                dokumenId: doc._id,
                                dokumenName: doc.nama,
                              })
                            }
                          >
                            📜Riwayat Aktifitas
                          </button>

                          <button
                            style={{ ...styles.btn, ...styles.primaryBtn }}
                            onClick={() => navigate(`/dokumen/edit/${doc._id}`)}
                          >
                            Edit
                          </button>

                          <button
                            style={{ ...styles.btn, ...styles.dangerBtn }}
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                dokumenId: doc._id,
                                dokumenNama: doc.nama,
                              })
                            }
                          >
                            Musnahkan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Musnahkan Dokumen"
        message={`Apakah Anda yakin ingin memusnahkan dokumen atas nama "${deleteDialog.dokumenNama}"?`}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, dokumenId: null, dokumenNama: null })
        }
      />

      {/* Modal Export CSV */}
      {showExportModal && (
        <div style={styles.overlay}>
          <div
            style={{
              ...styles.dialog,
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "2px solid #ecf0f1",
                paddingBottom: "1rem",
              }}
            >
              <h3 style={styles.dialogTitle}>📊 Export Dokumen ke CSV</h3>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportFilter({
                    type: "all",
                    startDate: "",
                    endDate: "",
                    month: "",
                    year: "",
                  });
                }}
                style={{
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#555",
                  marginBottom: "0.5rem",
                }}
              >
                Total dokumen aktif:{" "}
                <strong>{dokumen.filter((d) => !d.isDeleted).length}</strong>
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#27ae60",
                  marginBottom: "1rem",
                }}
              >
                Akan diekspor: <strong>{getExportPreviewCount()}</strong>{" "}
                dokumen
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "600",
                }}
              >
                Filter Export:
              </label>

              <select
                value={exportFilter.type}
                onChange={(e) =>
                  setExportFilter({ ...exportFilter, type: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  fontSize: "0.95rem",
                }}
              >
                <option value="all">Semua Dokumen (Aktif)</option>
                <option value="dateRange">Rentang Tanggal</option>
                <option value="month">Bulan Tertentu</option>
                <option value="year">Tahun Tertentu</option>
              </select>

              {exportFilter.type === "dateRange" && (
                <div
                  style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      value={exportFilter.startDate}
                      onChange={(e) =>
                        setExportFilter({
                          ...exportFilter,
                          startDate: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Sampai Tanggal
                    </label>
                    <input
                      type="date"
                      value={exportFilter.endDate}
                      onChange={(e) =>
                        setExportFilter({
                          ...exportFilter,
                          endDate: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>
              )}

              {exportFilter.type === "month" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Pilih Bulan
                  </label>
                  <input
                    type="month"
                    value={exportFilter.month}
                    onChange={(e) =>
                      setExportFilter({
                        ...exportFilter,
                        month: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              )}

              {exportFilter.type === "year" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.25rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Pilih Tahun
                  </label>
                  <select
                    value={exportFilter.year}
                    onChange={(e) =>
                      setExportFilter({ ...exportFilter, year: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                    }}
                  >
                    <option value="">Pilih Tahun</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div style={styles.dialogButtons}>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportFilter({
                    type: "all",
                    startDate: "",
                    endDate: "",
                    month: "",
                    year: "",
                  });
                }}
                style={styles.dialogCancelBtn}
              >
                Batal
              </button>
              <button
                onClick={handleExportCSV}
                disabled={getExportPreviewCount() === 0}
                style={{
                  ...styles.dialogConfirmBtn,
                  backgroundColor: "#16a085",
                  opacity: getExportPreviewCount() === 0 ? 0.6 : 1,
                  cursor:
                    getExportPreviewCount() === 0 ? "not-allowed" : "pointer",
                }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {logModal.isOpen && (
        <div style={styles.overlay}>
          <div
            style={{
              ...styles.dialog,
              maxWidth: "700px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "2px solid #ecf0f1",
                paddingBottom: "1rem",
              }}
            >
              <h3 style={styles.dialogTitle}>📜 Riwayat Aktivitas</h3>
              <button
                onClick={() =>
                  setLogModal({
                    isOpen: false,
                    dokumenId: null,
                    dokumenName: null,
                  })
                }
                style={{
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "1.5rem",
                  lineHeight: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{ fontSize: "1rem", color: "#555", marginBottom: "1rem" }}
            >
              <strong>Dokumen:</strong> {logModal.dokumenName}
            </div>

            <ActivityLogTimeline
              entity="Dokumen"
              entityId={logModal.dokumenId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "clamp(1rem, 3vw, 2rem)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: "#2c3e50",
    backgroundColor: "#f7f9fb",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.25rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
    margin: 0,
    color: "#2c3e50",
  },
  subtitle: {
    margin: 0,
    color: "#7f8c8d",
    fontSize: "0.95rem",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  addBtn: {
    padding: "0.5rem 0.9rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    whiteSpace: "nowrap",
  },
  filterSection: {
    marginBottom: "1rem",
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterSelect: {
    padding: "0.55rem 0.6rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "0.95rem",
    backgroundColor: "white",
    minWidth: 160,
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(16,24,40,0.03)",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 900,
  },
  th: {
    padding: "0.8rem 1rem",
    textAlign: "left",
    backgroundColor: "#34495e",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f0f2f5",
    transition: "background-color 0.15s",
  },
  td: {
    padding: "0.75rem 1rem",
    fontSize: "0.95rem",
    verticalAlign: "top",
    color: "#2c3e50",
    whiteSpace: "normal",
  },
  tdCenter: {
    padding: "0.75rem 1rem",
    textAlign: "center",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  nameCell: {
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-block",
    padding: "0.28rem 0.6rem",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  },
  smallBadge: {
    display: "inline-block",
    padding: "0.2rem 0.5rem",
    borderRadius: 8,
    backgroundColor: "#eef6ff",
    color: "#1e6fb7",
    fontSize: 13,
    fontWeight: 600,
  },
  statusTersedia: {
    backgroundColor: "#e6ffed",
    color: "#137a2e",
  },
  statusDipinjam: {
    backgroundColor: "#fff7e6",
    color: "#b36b00",
  },
  peminjamInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.95rem",
    color: "#2c3e50",
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  deletedCard: {
    backgroundColor: "#fff5f5",
    border: "2px solid #feb2b2",
  },
  deletedRow: {
    backgroundColor: "#fff5f5",
  },
  deletedBadge: {
    display: "inline-block",
    padding: "0.2rem 0.5rem",
    backgroundColor: "#fc8181",
    color: "white",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    marginLeft: "0.5rem",
  },
  deletedInfo: {
    padding: "0.5rem",
    backgroundColor: "#fed7d7",
    borderRadius: "4px",
    fontSize: "0.85rem",
    color: "#742a2a",
    marginTop: "0.5rem",
  },
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  btn: {
    padding: "0.38rem 0.6rem",
    border: "none",
    borderRadius: 6,
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 1px rgba(0,0,0,0.02)",
  },
  primaryBtn: {
    backgroundColor: "#3498db",
    color: "white",
  },
  successBtn: {
    backgroundColor: "#27ae60",
    color: "white",
  },
  warnBtn: {
    backgroundColor: "#f39c12",
    color: "white",
  },
  dangerBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    color: "#7f8c8d",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.05rem",
    color: "#7f8c8d",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
  },
  dialog: {
    backgroundColor: "#fff",
    padding: "1.25rem",
    borderRadius: 10,
    maxWidth: 520,
    width: "92%",
    boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
  },
  dialogTitle: {
    margin: "0 0 0.75rem 0",
    fontSize: "1.05rem",
    color: "#1f2937",
  },
  dialogMessage: {
    margin: "0 0 1rem 0",
    color: "#475569",
  },
  dialogButtons: {
    display: "flex",
    gap: "0.6rem",
    justifyContent: "flex-end",
  },
  dialogCancelBtn: {
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid #e6e9ef",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  dialogConfirmBtn: {
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "none",
    background: "#3498db",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: "0.75rem",
    boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0f172a",
  },
  cardSub: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  cardIndex: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    marginTop: 4,
  },
  cardRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 13,
    color: "#7f8c8d",
    minWidth: 95,
  },
  cardValue: {
    fontSize: 14,
    color: "#0f172a",
    textAlign: "right",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: 8,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
};

export default DokumenList;
