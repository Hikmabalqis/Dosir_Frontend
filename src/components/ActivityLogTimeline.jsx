import { useState, useEffect } from 'react';
import activityLogService from '../services/activityLogService';
import { formatDate } from '../utils/formatDate';

const ActivityLogTimeline = ({ entity, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [entity, entityId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogService.getLogsByEntity(entity, entityId);
      setLogs(data);
      setError('');
    } catch (err) {
      setError('Gagal memuat riwayat aktivitas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return '#27ae60';
      case 'UPDATE': return '#3498db';
      case 'DELETE': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return null;
    }

    return (
      <ul style={styles.changesList}>
        {Object.entries(changes).map(([key, value]) => (
          <li key={key} style={styles.changeItem}>
            <strong>{key}:</strong>{' '}
            {value.old && (
              <>
                <span style={styles.oldValue}>"{value.old}"</span>
                {' → '}
              </>
            )}
            <span style={styles.newValue}>"{value.new || '-'}"</span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Memuat riwayat...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>Belum ada riwayat aktivitas</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📜 Riwayat Aktivitas</h3>
      
      <div style={styles.timeline}>
        {logs.map((log, index) => (
          <div key={log._id} style={styles.timelineItem}>
            <div 
              style={{
                ...styles.timelineIcon,
                backgroundColor: getActionColor(log.action)
              }}
            >
              {getActionIcon(log.action)}
            </div>
            
            <div style={styles.timelineContent}>
              <div style={styles.timelineHeader}>
                <span style={styles.actionBadge}>
                  {log.action === 'CREATE' && 'Dibuat'}
                  {log.action === 'UPDATE' && 'Diubah'}
                  {log.action === 'DELETE' && 'Dimusnahkan'}
                </span>
                <span style={styles.timestamp}>
                  {formatDate(log.timestamp)}
                </span>
              </div>

              <div style={styles.timelineBody}>
                <div style={styles.performer}>
                  Oleh: <strong>{log.performedByName}</strong>
                </div>
                
                {log.action === 'UPDATE' && formatChanges(log.changes)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '2rem',
  },
  title: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #ecf0f1',
    paddingBottom: '0.5rem',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '2.5rem',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #ecf0f1',
  },
  timelineIcon: {
    position: 'absolute',
    left: '-2.5rem',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  actionBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#ecf0f1',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  timestamp: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
  },
  timelineBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  performer: {
    fontSize: '0.95rem',
    color: '#555',
  },
  changesList: {
    margin: '0.5rem 0 0 0',
    padding: '0 0 0 1.5rem',
    listStyle: 'none',
  },
  changeItem: {
    fontSize: '0.9rem',
    color: '#555',
    marginBottom: '0.25rem',
    padding: '0.25rem 0',
  },
  oldValue: {
    color: '#e74c3c',
    textDecoration: 'line-through',
  },
  newValue: {
    color: '#27ae60',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginTop: '2rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '8px',
    margin: '1rem 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginTop: '2rem',
  },
};

export default ActivityLogTimeline;