const SearchBar = ({ value, onChange, placeholder = "Cari..." }) => {
  return (
    <div style={styles.searchContainer}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.searchInput}
      />
      <span style={styles.searchIcon}>🔍</span>
    </div>
  );
};

const styles = {
  searchContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchIcon: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem',
  },
};

export default SearchBar;