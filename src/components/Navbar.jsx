import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { admin, logout } = useAuth();
  const { isMobile, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          {/* Toggle button hanya muncul di mobile */}
          {isMobile && (
            <button onClick={toggleSidebar} style={styles.menuBtn}>
              ☰
            </button>
          )}
          <h2 style={styles.brandContainer}>
            <img
              src="/assets/logoasabri.png"
              alt="Logo Arsip Dokumen"
              style={styles.logo}
            />
            Arsip Dokumen ASABRI KC Yogyakarta
          </h2>
        </div>
        <div style={styles.rightSection}>
          <span style={styles.adminName}>👤 {admin?.nama}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#03315ed7",
    padding: "1rem 0",
    boxShadow: "0 2px 4px rgba(255, 255, 255, 0.1)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  menuBtn: {
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "white",
    margin: 0,
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    fontWeight: 600,
  },
  logo: {
    height: "50px",
    width: "auto",
    display: "block",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  adminName: {
    color: "white",
    fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
  },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
};

export default Navbar;
