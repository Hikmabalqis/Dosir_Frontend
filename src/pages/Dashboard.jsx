import { useState, useEffect } from "react";
import lokerService from "../services/lokerService";
import boxService from "../services/boxService";
import dokumenService from "../services/dokumenService";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLoker: 0,
    totalBox: 0,
    totalDokumen: 0,
    lokerPenuh: 0,
    boxPenuh: 0,
    boxKosong: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [lokers, boxes, dokumen] = await Promise.all([
        lokerService.getAllLoker(),
        boxService.getAllBoxes(),
        dokumenService.getAllDokumen(),
      ]);

      const lokerPenuh = lokers.filter((loker) => loker.jumlahBox >= 50).length;
      const boxPenuh = boxes.filter((box) => box.jumlahDokumen >= 40).length;
      const boxKosong = boxes.filter((box) => box.jumlahDokumen === 0).length;

      setStats({
        totalLoker: lokers.length,
        totalBox: boxes.length,
        totalDokumen: dokumen.length,
        lokerPenuh,
        boxPenuh,
        boxKosong,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Ringkasan data arsip dokumen</p>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, ...styles.purpleCard }}>
          <div style={styles.statIcon}>🗄️</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{stats.totalLoker}</div>
            <div style={styles.statLabel}>Total Loker</div>
            {stats.lokerPenuh > 0 && (
              <div style={styles.statSubtext}>{stats.lokerPenuh} penuh</div>
            )}
          </div>
        </div>

        <div style={{ ...styles.statCard, ...styles.blueCard }}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{stats.totalBox}</div>
            <div style={styles.statLabel}>Total Box</div>
            {stats.boxPenuh > 0 && (
              <div style={styles.statSubtext}>{stats.boxPenuh} penuh</div>
            )}
          </div>
        </div>

        <div style={{ ...styles.statCard, ...styles.greenCard }}>
          <div style={styles.statIcon}>📄</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{stats.totalDokumen}</div>
            <div style={styles.statLabel}>Total Dokumen</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, ...styles.yellowCard }}>
          <div style={styles.statIcon}>⚪</div>
          <div style={styles.statContent}>
            <div style={styles.statNumber}>{stats.boxKosong}</div>
            <div style={styles.statLabel}>Box Kosong</div>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div style={styles.infoSection}>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}></h3>
          <div style={styles.hierarchy}>
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyIcon}></span>
              <div>
                <div style={styles.hierarchyLabel}></div>
                <div style={styles.hierarchyDesc}></div>
              </div>
            </div>
            <div style={styles.hierarchyArrow}></div>
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyIcon}></span>
              <div>
                <div style={styles.hierarchyLabel}></div>
                <div style={styles.hierarchyDesc}></div>
              </div>
            </div>
            <div style={styles.hierarchyArrow}></div>
            <div style={styles.hierarchyItem}>
              <span style={styles.hierarchyIcon}></span>
              <div>
                <div style={styles.hierarchyLabel}></div>
                <div style={styles.hierarchyDesc}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "clamp(1rem, 3vw, 2rem)",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    color: "#2c3e50",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#7f8c8d",
    marginBottom: "2rem",
    fontSize: "clamp(0.9rem, 2vw, 1rem)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "clamp(1rem, 2vw, 1.5rem)",
    marginBottom: "2rem",
  },
  statCard: {
    padding: "clamp(1rem, 3vw, 1.5rem)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "clamp(1rem, 2vw, 1.5rem)",
    color: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    flexDirection: "row",
  },
  purpleCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  blueCard: {
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  greenCard: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  yellowCard: {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  statIcon: {
    fontSize: "3rem",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statNumber: {
    fontSize: "2.5rem",
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: "1rem",
    opacity: 0.9,
  },
  statSubtext: {
    fontSize: "0.85rem",
    opacity: 0.8,
  },
  infoSection: {
    marginTop: "2rem",
  },
  infoCard: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  infoTitle: {
    fontSize: "1.25rem",
    color: "#2c3e50",
    marginBottom: "1.5rem",
  },
  hierarchy: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    alignItems: "center",
  },
  hierarchyItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "400px",
  },
  hierarchyIcon: {
    fontSize: "2rem",
  },
  hierarchyLabel: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
  hierarchyDesc: {
    fontSize: "0.9rem",
    color: "#7f8c8d",
  },
  hierarchyArrow: {
    fontSize: "1.5rem",
    color: "#3498db",
    fontWeight: "bold",
  },
  loading: {
    padding: "2rem",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#7f8c8d",
  },
};

export default Dashboard;
