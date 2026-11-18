import React, { useState, useRef, useEffect } from 'react';
import { ContainerIcon, ChevronDownIcon } from './Icons';

export const CARGO_OPTIONS = [
  { id: 'Standard Dry', label: 'Standard Dry (20ft / 40ft GP)' },
  { id: 'High Cube', label: 'High Cube (40ft HC)' },
  { id: 'Refrigerated / Reefer', label: 'Refrigerated / Reefer' },
  { id: 'Dangerous Goods', label: 'Dangerous Goods (IMO)' },
  { id: 'Flat Rack', label: 'Flat Rack (OOG)' },
];

export default function CargoSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = CARGO_OPTIONS.find((c) => c.id === value) || CARGO_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const idx = CARGO_OPTIONS.findIndex((c) => c.id === value);
        if (idx < CARGO_OPTIONS.length - 1) {
          onChange(CARGO_OPTIONS[idx + 1].id);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        const idx = CARGO_OPTIONS.findIndex((c) => c.id === value);
        if (idx > 0) {
          onChange(CARGO_OPTIONS[idx - 1].id);
        }
      }
    }
  };

  return (
    <div className={`cargo-select-wrapper ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <div
        className={`cargo-select-card ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="input-field-label">
          <ContainerIcon size={14} className="field-icon-svg" />
          <span>CARGO TYPE</span>
        </div>
        <div className="cargo-select-display">
          <span className="cargo-selected-text">{selectedOption.label}</span>
          <ChevronDownIcon size={14} className={`cargo-chevron ${isOpen ? 'open' : ''}`} />
        </div>
        <div className="input-field-sub">ISO Container Freight</div>
      </div>

      {isOpen && (
        <div className="cargo-dropdown-menu" role="listbox">
          {CARGO_OPTIONS.map((opt) => {
            const isSelected = value === opt.id;
            return (
              <div
                key={opt.id}
                className={`cargo-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={isSelected}
              >
                <span className="cargo-item-label">{opt.label}</span>
                {isSelected && <span className="cargo-check-mark">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
