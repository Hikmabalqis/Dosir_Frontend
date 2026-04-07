const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonGroup}>
          <button onClick={onCancel} style={styles.cancelBtn}>
            Batal
          </button>
          <button onClick={onConfirm} style={styles.confirmBtn}>
            Musnahkan
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  message: {
    margin: '0 0 1.5rem 0',
    color: '#555',
    lineHeight: '1.5',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '0.5rem 1.5rem',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  confirmBtn: {
    padding: '0.5rem 1.5rem',
    border: 'none',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
};

export default ConfirmDialog;