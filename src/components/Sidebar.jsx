import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { isOpen, isMobile, closeSidebar } = useSidebar();
  const { isSuperAdmin } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Menu items dinamis berdasarkan role
  const getMenuItems = () => {
    const baseMenuItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊', usage: 0.8 },
      { path: '/loker', label: 'Manajemen Loker', icon: '🗄️', usage: 0.6 },
      { path: '/boxes', label: 'Manajemen Box', icon: '📦', usage: 0.4 },
      { path: '/dokumen', label: 'Manajemen Dokumen', icon: '📄', usage: 0.7 },
    ];

    // Tambahkan menu Kelola Admin hanya untuk superadmin
    if (isSuperAdmin()) {
      baseMenuItems.push({
        path: '/admin',
        label: 'Kelola Admin',
        icon: '👥',
        usage: 0.5,
        badge: 'Super'
      });
    }

    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  // AI Context Simulation: Deteksi aktivitas pengguna
  useEffect(() => {
    const index = menuItems.findIndex(item => 
      location.pathname.startsWith(item.path)
    );
    if (index !== -1) setActiveIndex(index);
  }, [location.pathname, menuItems]);

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Overlay dengan efek ambient */}
      {isMobile && isOpen && (
        <div 
          style={styles.overlay} 
          onClick={closeSidebar}
          className="ambient-overlay"
        ></div>
      )}

      {/* Sidebar dengan efek Neumorphism 3.0 */}
      <aside 
        style={{
          ...styles.sidebar,
          ...(isMobile ? styles.sidebarMobile : {}),
          ...(isMobile && isOpen ? styles.sidebarMobileOpen : {}),
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <nav style={styles.nav}>
          <ul style={styles.menuList}>
            {menuItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <li key={item.path} style={styles.menuItem}>
                  {/* AI Usage Indicator (Proaktif) */}
                  <div style={styles.aiIndicator}>
                    <div 
                      style={{
                        ...styles.aiUsageBar,
                        width: `${item.usage * 100}%`,
                        opacity: isHovering ? 0.3 : 0,
                      }}
                    />
                  </div>

                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    style={{
                      ...styles.menuLink,
                      ...(isActive ? styles.activeLink : {}),
                      transform: isActive ? 'translateX(8px)' : 'translateX(0)',
                    }}
                  >
                    {/* Icon dengan animasi */}
                    <span 
                      style={{
                        ...styles.icon,
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(52, 152, 219, 0.4))' : 'none',
                      }}
                    >
                      {item.icon}
                    </span>
                    
                    <div style={styles.labelContainer}>
                      <span style={styles.label}>{item.label}</span>
                      
                      {/* Badge untuk menu khusus superadmin */}
                      {item.badge && (
                        <span style={styles.contextBadge}>{item.badge}</span>
                      )}
                    </div>

                    {/* Haptic Feedback Indicator */}
                    {isActive && (
                      <div style={styles.hapticIndicator}>
                        <div style={styles.hapticPulse} />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Ambient UI Elements */}
        <div style={styles.ambientGlow} />
      </aside>
    </>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(16, 24, 39, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)',
    backdropFilter: 'blur(10px)',
    zIndex: 999,
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards',
  },
  
  sidebar: {
    width: '280px',
    height: 'calc(100vh - 64px)',
    background: 'linear-gradient(165deg, rgba(33, 67, 101, 1) 0%, rgba(15, 23, 42, 0.98) 100%)',
    padding: '1.5rem 0',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: `
      20px 0 40px rgba(113, 95, 95, 0.3),
      inset 1px 0 0 rgba(255, 255, 255, 0.05)
    `,
  },
  
  sidebarMobile: {
    position: 'fixed',
    top: '160px',
    left: 0,
    zIndex: 1000,
    backdropFilter: 'blur(20px)',
    background: 'rgba(15, 23, 42, 0.85)',
    transform: 'translateX(-100%)',
    boxShadow: '40px 0 80px rgba(0, 0, 0, 0.4)',
  },
  
  sidebarMobileOpen: {
    transform: 'translateX(0)',
  },
  
  nav: {
    position: 'relative',
    zIndex: 1,
  },
  
  menuList: {
    listStyle: 'none',
    padding: '0 0.75rem',
    margin: 0,
  },
  
  menuItem: {
    margin: '0.5rem 0',
    position: 'relative',
  },
  
  aiIndicator: {
    position: 'absolute',
    left: '0.75rem',
    right: '0.75rem',
    height: '2px',
    bottom: 0,
    overflow: 'hidden',
  },
  
  aiUsageBar: {
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.3), transparent)',
    transition: 'opacity 0.3s ease',
  },
  
  menuLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    color: 'rgba(226, 232, 240, 0.9)',
    textDecoration: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '0.95rem',
    borderRadius: '14px',
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid transparent',
  },
  
  activeLink: {
    background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.15) 0%, rgba(29, 78, 216, 0.1) 100%)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    boxShadow: `
      inset 0 2px 4px rgba(255, 255, 255, 0.05),
      0 4px 12px rgba(29, 78, 216, 0.15)
    `,
    color: '#ffffff',
  },
  
  icon: {
    fontSize: '1.4rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
    minWidth: '32px',
    textAlign: 'center',
  },
  
  labelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  
  label: {
    fontWeight: '500',
    letterSpacing: '0.025em',
  },
  
  contextBadge: {
    fontSize: '0.7rem',
    background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
    color: 'rgb(168, 85, 247)',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    fontWeight: '600',
  },
  
  hapticIndicator: {
    position: 'absolute',
    right: '1rem',
    width: '8px',
    height: '8px',
  },
  
  hapticPulse: {
    width: '100%',
    height: '100%',
    background: 'rgba(59, 130, 246, 0.8)',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  
  ambientGlow: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
    filter: 'blur(1px)',
  },
};

export default Sidebar;