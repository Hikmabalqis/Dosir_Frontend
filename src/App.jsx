import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Loker
import LokerList from "./pages/LokerList";
import LokerForm from "./pages/LokerForm";
import LokerDetail from "./pages/LokerDetail";

// Box
import BoxList from "./pages/BoxList";
import BoxForm from "./pages/BoxForm";
import BoxDetail from "./pages/BoxDetail";

// Dokumen
import DokumenList from "./pages/DokumenList";
import DokumenForm from "./pages/DokumenForm";

// Admin Management
import AdminList from "./pages/AdminList";
import AdminForm from "./pages/AdminForm";

// Jenis Berkas
import JenisDokumenPage from "./pages/JenisDokumenPage";

import "./App.css";

// Protected Route Component dengan Debug
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  <h1>TEST UPDATE DOSIR</h1>;

  // Debug log
  console.log("🔐 ProtectedRoute:", { isAuthenticated, loading });

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!isAuthenticated) {
    console.log("❌ Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto", backgroundColor: "#f8fafc" }}>
          {children}
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== LOKER ROUTES ==================== */}
      <Route
        path="/loker"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerList />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ⚠️ PENTING: Route spesifik HARUS di ATAS route dengan :id */}
      <Route
        path="/loker/create"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loker/add"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loker/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/loker/detail/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ⚠️ Route dengan :id HARUS paling BAWAH */}
      <Route
        path="/loker/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <LokerDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== BOX ROUTES ==================== */}
      <Route
        path="/boxes"
        element={
          <ProtectedRoute>
            <Layout>
              <BoxList />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ⚠️ Route spesifik HARUS di ATAS */}
      <Route
        path="/boxes/create"
        element={
          <ProtectedRoute>
            <Layout>
              <BoxForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/boxes/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <BoxForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/boxes/detail/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <BoxDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ⚠️ Route dengan :id HARUS paling BAWAH */}
      <Route
        path="/boxes/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <BoxDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== DOKUMEN ROUTES ==================== */}
      <Route
        path="/dokumen"
        element={
          <ProtectedRoute>
            <Layout>
              <DokumenList />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* ⚠️ Route spesifik /dokumen/add dan /dokumen/create HARUS di ATAS /dokumen/edit/:id */}
      <Route
        path="/dokumen/add"
        element={
          <ProtectedRoute>
            <Layout>
              <DokumenForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dokumen/create"
        element={
          <ProtectedRoute>
            <Layout>
              <DokumenForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dokumen/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <DokumenForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== JENIS BERKAS ROUTE ==================== */}
      <Route
        path="/jenis-dokumen"
        element={
          <ProtectedRoute>
            <Layout>
              <JenisDokumenPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN MANAGEMENT ROUTES ==================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/edit/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 Not Found - Redirect to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
