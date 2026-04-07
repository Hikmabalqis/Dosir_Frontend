// src/components/BoxLabelPrint.jsx
import { useEffect } from "react";

const BoxLabelPrint = ({ box, dokumen, onClose }) => {
  useEffect(() => {
    setTimeout(() => {
      window.print();
      onClose();
    }, 500);
  }, []);

  return (
    <div style={styles.printArea}>
      <div style={styles.card}>
        <h1 style={styles.boxNumber}>{box.namaBox}/{box.tahun}</h1>

        <h3 style={styles.title}>DAFTAR NOPENS</h3>

        <ul style={styles.list}>
          {dokumen.map((d) => (
            <li key={d._id} style={styles.item}>{d.nopen}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const styles = {
  printArea: {
    width: "74mm",
    height: "105mm",
    padding: "6mm",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    height: "100%",
    border: "2px solid black",
    padding: "8px",
    boxSizing: "border-box",
  },
  boxNumber: {
    textAlign: "center",
    fontSize: "22px",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  title: {
    borderBottom: "1px solid black",
    paddingBottom: "4px",
    marginBottom: "8px",
    fontSize: "14px",
    textAlign: "center",
  },
  list: {
    fontSize: "12px",
    margin: 0,
    paddingLeft: "16px"
  },
  item: {
    marginBottom: "2px",
  }
};

export default BoxLabelPrint;
