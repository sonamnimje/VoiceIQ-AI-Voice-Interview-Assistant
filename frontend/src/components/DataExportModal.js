import React, { useState, useEffect } from 'react';
import { showToast } from './Toast';
import config from '../config';
import '../components/ModernUI.css';
import './DataExportModal.css';

const DataExportModal = ({ isOpen, onClose }) => {
  const [selectedData, setSelectedData] = useState({
    profile: true,
    interviewHistory: true,
    feedback: true,
    transcripts: true,
    analytics: true
  });
  const [exportFormat, setExportFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [dataPreview, setDataPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDataPreview();
    }
  }, [isOpen]);

  const loadDataPreview = async () => {
    try {
      const email = localStorage.getItem('user_email');
      const response = await fetch(`${config.BACKEND_URL}/api/export/preview?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDataPreview(data);
      }
    } catch (error) {
      console.error('Error loading data preview:', error);
    }
  };

  const handleDataToggle = (dataType) => {
    setSelectedData(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };

  const handleExport = async () => {
    const selectedTypes = Object.keys(selectedData).filter(key => selectedData[key]);
    
    if (selectedTypes.length === 0) {
      showToast('Please select at least one data type to export', 'error');
      return;
    }

    setLoading(true);
    try {
      const email = localStorage.getItem('user_email');
      const response = await fetch(`${config.BACKEND_URL}/api/export/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          dataTypes: selectedTypes,
          format: exportFormat
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voiceiq-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Data exported successfully!', 'success');
        onClose();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to export data', 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Error exporting data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedData({
      profile: true,
      interviewHistory: true,
      feedback: true,
      transcripts: true,
      analytics: true
    });
    setExportFormat('json');
    onClose();
  };

  const getDataSize = (dataType) => {
    if (!dataPreview) return '0 KB';
    
    const sizes = {
      profile: dataPreview.profileSize || '2 KB',
      interviewHistory: dataPreview.interviewHistorySize || '15 KB',
      feedback: dataPreview.feedbackSize || '8 KB',
      transcripts: dataPreview.transcriptsSize || '25 KB',
      analytics: dataPreview.analyticsSize || '12 KB'
    };
    
    return sizes[dataType] || '0 KB';
  };

  const getDataCount = (dataType) => {
    if (!dataPreview) return 0;
    
    const counts = {
      profile: 1,
      interviewHistory: dataPreview.interviewCount || 0,
      feedback: dataPreview.feedbackCount || 0,
      transcripts: dataPreview.transcriptCount || 0,
      analytics: dataPreview.analyticsCount || 0
    };
    
    return counts[dataType] || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="data-export-modal-overlay">
      <div className="glass-card data-export-modal-container">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="data-export-modal-close-btn"
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="data-export-modal-header-icon">
            📥
          </div>
          <h2 className="data-export-modal-title">
            Export Your Data
          </h2>
          <p className="data-export-modal-subtitle">
            Select the data you want to export and choose your preferred format
          </p>
        </div>

        {/* Data Selection */}
        <div className="data-export-section">
          <h3 className="data-export-section-title">Select Data to Export</h3>
          <div className="data-export-options">
            {Object.entries(selectedData).map(([dataType, isSelected]) => (
              <div key={dataType} className="data-export-option">
                <label className="data-export-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDataToggle(dataType)}
                  />
                  <span className="data-export-checkmark"></span>
                </label>
                <div className="data-export-option-content">
                  <div className="data-export-option-title">
                    {dataType === 'profile' && '👤 Profile Information'}
                    {dataType === 'interviewHistory' && '📋 Interview History'}
                    {dataType === 'feedback' && '💬 Feedback & Evaluations'}
                    {dataType === 'transcripts' && '📝 Interview Transcripts'}
                    {dataType === 'analytics' && '📊 Analytics & Insights'}
                  </div>
                  <div className="data-export-option-details">
                    {getDataCount(dataType)} items • {getDataSize(dataType)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Format */}
        <div className="data-export-section">
          <h3 className="data-export-section-title">Export Format</h3>
          <div className="data-export-format-options">
            <label className="data-export-format-option">
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="data-export-format-checkmark"></span>
              <div className="data-export-format-content">
                <div className="data-export-format-title">JSON</div>
                <div className="data-export-format-description">Structured data format, best for developers</div>
              </div>
            </label>
            <label className="data-export-format-option">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="data-export-format-checkmark"></span>
              <div className="data-export-format-content">
                <div className="data-export-format-title">CSV</div>
                <div className="data-export-format-description">Spreadsheet format, best for analysis</div>
              </div>
            </label>
            <label className="data-export-format-option">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <span className="data-export-format-checkmark"></span>
              <div className="data-export-format-content">
                <div className="data-export-format-title">PDF</div>
                <div className="data-export-format-description">Printable format, best for sharing</div>
              </div>
            </label>
          </div>
        </div>

        {/* Data Preview */}
        {dataPreview && (
          <div className="data-export-section">
            <h3 className="data-export-section-title">Data Summary</h3>
            <div className="data-export-summary">
              <div className="data-export-summary-item">
                <span className="data-export-summary-label">Total Interviews:</span>
                <span className="data-export-summary-value">{dataPreview.interviewCount || 0}</span>
              </div>
              <div className="data-export-summary-item">
                <span className="data-export-summary-label">Feedback Sessions:</span>
                <span className="data-export-summary-value">{dataPreview.feedbackCount || 0}</span>
              </div>
              <div className="data-export-summary-item">
                <span className="data-export-summary-label">Transcripts:</span>
                <span className="data-export-summary-value">{dataPreview.transcriptCount || 0}</span>
              </div>
              <div className="data-export-summary-item">
                <span className="data-export-summary-label">Estimated Size:</span>
                <span className="data-export-summary-value">{dataPreview.totalSize || '50 KB'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="data-export-modal-actions">
          <button
            type="button"
            onClick={handleClose}
            className="data-export-modal-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="data-export-modal-submit-btn"
          >
            {loading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExportModal; 