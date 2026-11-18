import React, { useState, useRef, useEffect } from 'react';
import { PinIcon, CloseIcon, SearchIcon, ChevronDownIcon } from './Icons';

export default function PortSelect({
  label = "SELECT PORT",
  placeholder = "Search port, country, code...",
  value,
  onChange,
  ports = [],
  disabledPort = null,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedPort = ports.find(
    p => p.name.toLowerCase() === (value || '').toLowerCase()
  );

  // Filter ports based on query: matching name, country, or UN/LOCODE
  const filteredPorts = ports.filter(port => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      port.name.toLowerCase().includes(q) ||
      port.country.toLowerCase().includes(q) ||
      (port.code && port.code.toLowerCase().includes(q))
    );
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredPorts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPorts[highlightedIndex]) {
        selectPort(filteredPorts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectPort = (port) => {
    onChange(port.name);
    setQuery('');
    setIsOpen(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className={`port-select-wrapper ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <div 
        className={`port-select-card ${isOpen ? 'active' : ''} ${error ? 'has-error' : ''}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="port-select-header">
          <div className="port-label-row">
            <PinIcon className="w-3 h-3 port-pin-icon" />
            <span className="port-label-text">{label}</span>
          </div>
          {selectedPort && (
            <button 
              type="button" 
              className="port-clear-btn" 
              onClick={clearSelection}
              title="Clear selection"
            >
              <CloseIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="port-select-content">
          {isOpen ? (
            <div className="port-search-input-box">
              <SearchIcon className="w-3.5 h-3.5 search-icon-inner" />
              <input
                ref={inputRef}
                type="text"
                className="port-search-input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                autoFocus
              />
            </div>
          ) : selectedPort ? (
            <div className="port-selected-display">
              <div className="port-title-line">
                <span className="port-name">{selectedPort.name}</span>
                {selectedPort.code && (
                  <span className="port-locode-badge">{selectedPort.code}</span>
                )}
              </div>
              <div className="port-sub-text">
                {selectedPort.country} • {selectedPort.region || 'Deepwater Port'}
              </div>
            </div>
          ) : (
            <div className="port-placeholder-text">
              <span>{placeholder}</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-muted ml-auto" />
            </div>
          )}
        </div>
      </div>

      {error && <div className="port-error-msg">{error}</div>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="port-dropdown-menu">
          <div className="port-dropdown-list">
            {filteredPorts.length === 0 ? (
              <div className="port-no-results">
                No matching ports found for "{query}".
              </div>
            ) : (
              filteredPorts.map((port, index) => {
                const isSelected = selectedPort?.name === port.name;
                const isHighlighted = index === highlightedIndex;
                const isDisabled = disabledPort && disabledPort.toLowerCase() === port.name.toLowerCase();

                return (
                  <div
                    key={port.id || port.code || port.name}
                    className={`port-dropdown-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!isDisabled) selectPort(port);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="port-item-info">
                      <div className="port-item-title">
                        <span className="port-item-name">{port.name}</span>
                        {port.code && (
                          <span className="port-locode-pill">{port.code}</span>
                        )}
                      </div>
                      <div className="port-item-subtitle">
                        {port.country} {port.region ? `• ${port.region}` : ''}
                      </div>
                    </div>
                    {isDisabled && (
                      <span className="port-disabled-badge">Already Selected</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
