import { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Cari atau pilih...",
  disabled = false,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  required = false,
  name = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter options berdasarkan search term
  const filteredOptions = (options || []).filter(option => {
  try {
    const label = getOptionLabel(option);
    const term = searchTerm || '';
    
    if (!label || !term) return true; // Show all if no search term
    
    return label.toLowerCase().includes(term.toLowerCase());
  } catch (error) {
    console.warn('Filter error:', error);
    return false;
  }
});

  // Get selected option label
  const selectedOption = options.find(opt => getOptionValue(opt) === value);
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : '';

  // Close dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionClick = (option) => {
    onChange({ target: { name, value: getOptionValue(option) } });
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <div 
        style={{
          ...styles.inputContainer,
          ...(disabled ? styles.inputDisabled : {}),
          ...(isOpen ? styles.inputFocused : {})
        }}
        onClick={handleInputClick}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={styles.input}
          autoComplete="off"
          required={required && !value}
        />
        <div style={styles.icons}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearBtn}
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          <span style={styles.arrow}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={styles.dropdown}>
          {filteredOptions.length === 0 ? (
            <div style={styles.noResults}>
              Tidak ada hasil untuk "{searchTerm}"
            </div>
          ) : (
            <ul style={styles.list} ref={listRef}>
              {filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const isSelected = optionValue === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={optionValue}
                    style={{
                      ...styles.option,
                      ...(isSelected ? styles.optionSelected : {}),
                      ...(isHighlighted ? styles.optionHighlighted : {})
                    }}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {isSelected && <span style={styles.checkmark}>✓</span>}
                    <span>{optionLabel}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  inputFocused: {
    borderColor: '#3498db',
    boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    backgroundColor: 'transparent',
    cursor: 'inherit',
    width: '100%',
  },
  icons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    fontSize: '1rem',
    color: '#95a5a6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    transition: 'all 0.2s',
  },
  arrow: {
    fontSize: '0.7rem',
    color: '#7f8c8d',
    pointerEvents: 'none',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '300px',
    overflow: 'auto',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  option: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
  },
  optionHighlighted: {
    backgroundColor: '#f0f8ff',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    fontWeight: '500',
  },
  checkmark: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  noResults: {
    padding: '1rem',
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
};

export default SearchableSelect;