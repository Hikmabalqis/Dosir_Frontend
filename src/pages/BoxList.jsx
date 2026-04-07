import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import boxService from "../services/boxService";
import lokerService from "../services/lokerService";
import ConfirmDialog from "../components/ConfirmDialog";

const BoxList = () => {
  const [boxes, setBoxes] = useState([]);
  const [lokers, setLokers] = useState([]);
  const [filterLokerId, setFilterLokerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    boxId: null,
    boxNumber: null,
  });
  const [printDialog, setPrintDialog] = useState({
    isOpen: false,
    boxId: null,
    boxNumber: null,
    boxData: null,
  });
  const navigate = useNavigate();
  const [lokersUpdated, setLokersUpdated] = useState(0);
  const [fixingCount, setFixingCount] = useState(false);
  const [boxesWithRealCount, setBoxesWithRealCount] = useState([]);

  useEffect(() => {
    fetchLokers();
    fetchBoxes();
  }, []);

  useEffect(() => {
    fetchBoxes();
  }, [filterLokerId, lokersUpdated]);

  const fetchLokers = async () => {
    try {
      const data = await lokerService.getAllLoker();
      setLokers(data);
    } catch (error) {
      console.error("Gagal memuat data loker:", error);
    }
  };

  const fetchBoxes = async () => {
    try {
      const data = await boxService.getAllBoxes(filterLokerId || null);
      setBoxes(data);
      setSelectedIds([]);

      const boxesWithCounts = await Promise.all(
        data.map(async (box) => {
          try {
            const response = await fetch(`/api/dokumen/box/${box._id}`);
            const dokumen = await response.json();
            return {
              ...box,
              realCount: dokumen.length,
              countMismatch: dokumen.length !== box.jumlahDokumen,
            };
          } catch (error) {
            console.error(
              `Error fetching dokumen for box ${box.nomorBox}:`,
              error
            );
            return { ...box, realCount: null, countMismatch: false };
          }
        })
      );

      setBoxesWithRealCount(boxesWithCounts);
    } catch (error) {
      alert("Gagal memuat data box");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === boxes.length && boxes.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(boxes.map((b) => b._id));
    }
  };

  const handleDelete = async () => {
    try {
      if (Array.isArray(deleteDialog.boxId)) {
        await Promise.all(
          deleteDialog.boxId.map((id) => boxService.deleteBox(id))
        );
        alert(`${deleteDialog.boxId.length} box berhasil dimusnahkan`);
        setSelectedIds([]);
      } else {
        await boxService.deleteBox(deleteDialog.boxId);
        alert("Box berhasil dimusnahkan");
      }

      fetchBoxes();
      fetchLokers();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal memusnahkan box");
    } finally {
      setDeleteDialog({ isOpen: false, boxId: null, boxNumber: null });
    }
  };

  const fixBoxCount = async (boxId, boxNumber) => {
    if (!window.confirm(`Perbaiki jumlah dokumen untuk Box ${boxNumber}?`))
      return;

    try {
      setFixingCount(true);

      const response = await fetch(`/api/boxes/${boxId}/fix-count`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `✅ ${result.message}\nDari ${result.oldCount} menjadi ${result.newCount}`
        );
        fetchBoxes();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setFixingCount(false);
    }
  };

  const handlePrintClick = async (boxId, boxNumber) => {
    try {
      const data = await boxService.exportBox(boxId);
      setPrintDialog({
        isOpen: true,
        boxId,
        boxNumber,
        boxData: data,
      });
    } catch (error) {
      alert(
        "Gagal memuat data box: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handlePrintFull = () => {
    if (printDialog.boxData) {
      generatePDFLabelFull(printDialog.boxData);
      alert(`Export Print Label Box ${printDialog.boxNumber} berhasil!`);
      closePrintDialog();
    }
  };

  const handlePrintRightOnly = () => {
    if (printDialog.boxData) {
      generatePDFLabelRightOnly(printDialog.boxData);
      alert(
        `Export Print Label (Sisi Kanan) Box ${printDialog.boxNumber} berhasil!`
      );
      closePrintDialog();
    }
  };

  const closePrintDialog = () => {
    setPrintDialog({
      isOpen: false,
      boxId: null,
      boxNumber: null,
      boxData: null,
    });
  };

  const generatePDFLabelFull = (data) => {
    import("jspdf").then((module) => {
      const jsPDF = module.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a5",
      });

      const pageWidth = 210;
      const pageHeight = 148;
      const margin = 10;

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      const leftSectionWidth = pageWidth * 0.6;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 73, 94);
      doc.text("DAFTAR DOKUMEN", margin, 20);

      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, 24, leftSectionWidth - 5, 24);

      const sortedDokumen = [...data.dokumen].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      let yPosition = 35;
      const lineSpacing = 3.2;
      const itemSpacing = 10;
      const col1X = margin + 5;
      const col2X = margin + 5 + leftSectionWidth / 3;
      const col3X = margin + 5 + (2 * leftSectionWidth) / 3;
      const maxItemsPerColumn = 9;
      const colWidth = leftSectionWidth / 3 - 8;

      sortedDokumen.forEach((dok, index) => {
        if (index >= 40) return;

        const nopens = dok.nomorPensiun || "N/A";
        const nama = dok.nama || "N/A";

        let xPos, itemIndex;
        if (index < maxItemsPerColumn) {
          xPos = col1X;
          itemIndex = index;
        } else if (index < maxItemsPerColumn * 2) {
          xPos = col2X;
          itemIndex = index - maxItemsPerColumn;
        } else {
          xPos = col3X;
          itemIndex = index - maxItemsPerColumn * 2;
        }

        const yPos = yPosition + itemIndex * itemSpacing;

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 62, 80);
        doc.text(`${index + 1}. ${nopens}`, xPos, yPos, { maxWidth: colWidth });

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(95, 95, 95);
        const indent = doc.getTextWidth(`${index + 1}. `);
        doc.text(nama, xPos + indent, yPos + lineSpacing, {
          maxWidth: colWidth - indent,
        });
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(127, 140, 141);
      doc.text(
        `Total: ${sortedDokumen.length} dokumen`,
        col1X,
        pageHeight - 10
      );

      const rightSectionX = leftSectionWidth + 10;
      const rightSectionWidth = pageWidth - rightSectionX - margin;

      let tahun = new Date().getFullYear();
      if (sortedDokumen.length > 0 && sortedDokumen[0].tanggalSuratPemrosesan) {
        tahun = new Date(sortedDokumen[0].tanggalSuratPemrosesan).getFullYear();
      }

      doc.setFontSize(72);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 62, 80);

      const boxNumberWidth = doc.getTextWidth(data.box.nomorBox);
      const boxNumberX =
        rightSectionX + rightSectionWidth / 2 - boxNumberWidth / 2;
      doc.text(data.box.nomorBox, boxNumberX, 55);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 73, 94);
      const tahunLabelX =
        rightSectionX + rightSectionWidth / 2 - doc.getTextWidth("Tahun:") / 2;
      doc.text("Tahun:", tahunLabelX, 80);

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 62, 80);
      const tahunWidth = doc.getTextWidth(String(tahun));
      const tahunX = rightSectionX + rightSectionWidth / 2 - tahunWidth / 2;
      doc.text(String(tahun), tahunX, 95);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(127, 140, 141);
      const dateStr = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.text(`Dicetak: ${dateStr}`, rightSectionX, pageHeight - 10);

      const fileName = `Label_Full_${data.box.nomorBox}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    });
  };

  const generatePDFLabelRightOnly = (data) => {
    import("jspdf").then((module) => {
      const jsPDF = module.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [74, 148],
      });

      const pageWidth = 74;
      const pageHeight = 148;

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      const sortedDokumen = [...data.dokumen].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      let tahun = new Date().getFullYear();
      if (sortedDokumen.length > 0 && sortedDokumen[0].tanggalSuratPemrosesan) {
        tahun = new Date(sortedDokumen[0].tanggalSuratPemrosesan).getFullYear();
      }

      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 62, 80);
      const boxNumberWidth = doc.getTextWidth(data.box.nomorBox);
      const boxNumberX = pageWidth / 2 - boxNumberWidth / 2;
      doc.text(data.box.nomorBox, boxNumberX, 50);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 73, 94);
      const tahunLabelX = pageWidth / 2 - doc.getTextWidth("Tahun:") / 2;
      doc.text("Tahun:", tahunLabelX, 75);

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(44, 62, 80);
      const tahunWidth = doc.getTextWidth(String(tahun));
      const tahunX = pageWidth / 2 - tahunWidth / 2;
      doc.text(String(tahun), tahunX, 90);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(127, 140, 141);
      const dateStr = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const dateStrWidth = doc.getTextWidth(`Dicetak: ${dateStr}`);
      doc.text(
        `Dicetak: ${dateStr}`,
        pageWidth / 2 - dateStrWidth / 2,
        pageHeight - 10
      );

      const fileName = `Label_Right_${data.box.nomorBox}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    });
  };

  const openDeleteDialog = (boxId, boxNumber) => {
    setDeleteDialog({ isOpen: true, boxId, boxNumber });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, boxId: null, boxNumber: null });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen Box</h1>
          <p style={styles.subtitle}>Kelola box penyimpanan dokumen</p>
        </div>
      </div>

      <div style={styles.filterSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Filter by Loker:</label>
          <select
            value={filterLokerId}
            onChange={(e) => setFilterLokerId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Semua Loker</option>
            {lokers.map((loker) => (
              <option key={loker._id} value={loker._id}>
                Loker {loker.nomorLoker} ({loker.jumlahBox} box)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => navigate("/loker")}
          style={styles.manageLokerBtn}
        >
          🗄️ Kelola Loker
        </button>

        <button
          style={styles.bulkDeleteBtn}
          disabled={selectedIds.length === 0}
          onClick={() =>
            setDeleteDialog({
              isOpen: true,
              boxId: selectedIds,
              boxNumber: `${selectedIds.length} box terpilih`,
            })
          }
        >
          🗑️ Musnahkan ({selectedIds.length})
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === boxes.length && boxes.length > 0
                  }
                  onChange={toggleSelectAll}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
              </th>
              <th style={styles.th}>No</th>
              <th style={styles.th}>Nomor Box</th>
              <th style={styles.th}>Loker</th>
              <th style={styles.th}>Jumlah Dokumen</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {boxes.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>
                  {filterLokerId
                    ? "Tidak ada box di loker ini. Tambahkan box melalui halaman detail loker."
                    : "Belum ada box. Buat loker terlebih dahulu, lalu tambahkan box ke loker."}
                </td>
              </tr>
            ) : (
              boxesWithRealCount.map((box, index) => {
                const isChecked = selectedIds.includes(box._id);

                return (
                  <tr key={box._id} style={styles.tr}>
                    <td style={styles.tdCenter}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(box._id)}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                    </td>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      <strong>{box.nomorBox}</strong>
                    </td>
                    <td style={styles.td}>
                      {box.lokerId ? (
                        <span
                          style={styles.lokerBadge}
                          onClick={() =>
                            navigate(`/loker/detail/${box.lokerId._id}`)
                          }
                        >
                          Loker {box.lokerId.nomorLoker}
                        </span>
                      ) : (
                        <span style={styles.noLokerBadge}>Tanpa Loker</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div>{box.jumlahDokumen} / 40</div>
                        {box.countMismatch && box.realCount !== null && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#e74c3c",
                              fontStyle: "italic",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>Sebenarnya: {box.realCount}</span>
                            <button
                              onClick={() => fixBoxCount(box._id, box.nomorBox)}
                              style={{
                                padding: "2px 6px",
                                backgroundColor: "#f39c12",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.7rem",
                                cursor: "pointer",
                              }}
                              disabled={fixingCount}
                              title="Perbaiki jumlah dokumen"
                            >
                              🔧 Fix
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
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
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/boxes/detail/${box._id}`)}
                        style={styles.viewBtn}
                      >
                        Lihat Isi
                      </button>
                      <button
                        onClick={() => handlePrintClick(box._id, box.nomorBox)}
                        style={styles.exportBtn}
                        disabled={box.jumlahDokumen === 0}
                      >
                        Print Label
                      </button>
                      <button
                        onClick={() => openDeleteDialog(box._id, box.nomorBox)}
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
        title="Musnahkan Box"
        message={`Apakah Anda yakin ingin memusnahkan ${deleteDialog.boxNumber}? Box yang masih berisi dokumen tidak dapat dimusnahkan.`}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />

      {printDialog.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Pilih Format Print Label</h2>
            <p style={styles.modalMessage}>
              Pilih format label untuk Box {printDialog.boxNumber}:
            </p>
            <div style={styles.modalButtons}>
              <button onClick={handlePrintFull} style={styles.printFullBtn}>
                📄 Label Lengkap
                <span style={styles.btnSubtext}>(Daftar + Nomor Box)</span>
              </button>
              <button
                onClick={handlePrintRightOnly}
                style={styles.printRightBtn}
              >
                🏷️ Label Sisi Kanan
                <span style={styles.btnSubtext}>(Nomor Box Saja)</span>
              </button>
              <button onClick={closePrintDialog} style={styles.cancelBtn}>
                Batal
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
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#7f8c8d",
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
  },
  filterSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
    flexWrap: "wrap",
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  filterLabel: {
    fontSize: "0.95rem",
    color: "#2c3e50",
    fontWeight: "500",
  },
  filterSelect: {
    padding: "0.5rem 1rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.95rem",
    minWidth: "200px",
  },
  manageLokerBtn: {
    padding: "0.6rem 1.25rem",
    backgroundColor: "#9b59b6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  bulkDeleteBtn: {
    padding: "0.6rem 1.25rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  tdCenter: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    textAlign: "center",
    fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },
  th: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    textAlign: "left",
    backgroundColor: "#34495e",
    color: "white",
    fontWeight: "500",
    fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
  },
  tr: {
    borderBottom: "1px solid #ecf0f1",
  },
  td: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
  },
  lokerBadge: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  noLokerBadge: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#fafafa",
    color: "#9e9e9e",
    borderRadius: "12px",
    fontSize: "0.85rem",
  },
  badge: {
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
  viewBtn: {
    padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
    backgroundColor: "#9b59b6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
  },
  exportBtn: {
    padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
    backgroundColor: "#16a085",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
  },
  editBtn: {
    padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
    fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
  },
  deleteBtn: {
    padding: "clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    color: "#7f8c8d",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#2c3e50",
    marginBottom: "1rem",
    textAlign: "center",
  },
  modalMessage: {
    color: "#7f8c8d",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  modalButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  printFullBtn: {
    padding: "1rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  printRightBtn: {
    padding: "1rem",
    backgroundColor: "#16a085",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  btnSubtext: {
    fontSize: "0.8rem",
    fontWeight: "normal",
    opacity: 0.9,
  },
  cancelBtn: {
    padding: "0.75rem",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
};

export default BoxList;
