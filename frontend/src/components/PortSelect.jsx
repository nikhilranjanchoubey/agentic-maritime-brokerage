import React, { useState, useRef, useEffect } from 'react';

export default function PortSelect({
  label = 'Port',
  value,
  onChange,
  ports = [],
  placeholder = 'Select a port...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedPort = ports.find(
    (p) => p.name.toLowerCase() === (value || '').toLowerCase()
  );

  const filteredPorts = ports.filter((port) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      port.name.toLowerCase().includes(q) ||
      port.country.toLowerCase().includes(q) ||
      (port.code && port.code.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (port) => {
    onChange(port.name);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="port-field-group" ref={dropdownRef}>
      <label className="field-label">{label}</label>
      <div
        className={`port-input-wrapper ${isOpen ? 'focused' : ''}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="port-text-input"
          placeholder={selectedPort ? `${selectedPort.name} (${selectedPort.country})` : placeholder}
          value={isOpen ? query : (selectedPort ? `${selectedPort.name} - ${selectedPort.code}` : '')}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {value && !isOpen && (
          <button
            type="button"
            className="port-clear-button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setQuery('');
            }}
            title="Clear selection"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="port-dropdown-list">
          {filteredPorts.length === 0 ? (
            <div className="port-dropdown-empty">No matching ports found</div>
          ) : (
            filteredPorts.map((port) => (
              <div
                key={port.code || port.name}
                className={`port-dropdown-item ${selectedPort?.name === port.name ? 'selected' : ''}`}
                onClick={() => handleSelect(port)}
              >
                <div className="port-item-main">
                  <span className="port-item-name">{port.name}</span>
                  <span className="port-item-code">{port.code}</span>
                </div>
                <div className="port-item-country">{port.country}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
