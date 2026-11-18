import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_HEADERS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export default function DatePicker({
  value,
  onChange,
  label = 'READY DATE',
  minDate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date or default to today + 3 days
  const parseDate = (str) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const selectedDate = parseDate(value);

  // Month navigation view state
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Update view month when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Handle outside click to close
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
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMinDate = minDate ? new Date(minDate) : today;
  effectiveMinDate.setHours(0, 0, 0, 0);

  // Navigation handlers
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Format date helper: YYYY-MM-DD
  const formatIsoDate = (year, month, day) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSelectDay = (day) => {
    const iso = formatIsoDate(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const now = new Date();
    const iso = formatIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    const now = new Date();
    const iso = formatIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(iso);
    setIsOpen(false);
  };

  // Days calculations for current month view
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun

  // Display strings for the card face
  const displayFormattedDate = () => {
    const day = selectedDate.getDate();
    const month = SHORT_MONTHS[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const displayWeekday = () => {
    return WEEKDAY_NAMES[selectedDate.getDay()];
  };

  // Check if viewing current or future months for prev-month button
  const isPrevMonthDisabled = () => {
    const firstOfCurrentView = new Date(viewYear, viewMonth, 1);
    const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstOfCurrentView <= firstOfCurrentMonth;
  };

  return (
    <div
      className={`skytech-datepicker-wrapper ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Date Field Face Card */}
      <div
        className={`skytech-datepicker-card ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Select Ready Date"
      >
        <div className="skytech-field-header">
          <div className="skytech-field-label-row">
            <CalendarIcon size={14} className="skytech-field-icon-blue" />
            <span className="skytech-field-label-text">{label}</span>
          </div>
        </div>

        <div className="skytech-date-content-row">
          <div className="skytech-date-text-block">
            <span className="skytech-date-primary-text">{displayFormattedDate()}</span>
            <span className="skytech-date-secondary-text">{displayWeekday()}</span>
          </div>
          <CalendarIcon size={18} className="skytech-calendar-inline-icon" />
        </div>
      </div>

      {/* SkyTech Calendar Dropdown Popup */}
      {isOpen && (
        <div
          className="skytech-calendar-popup"
          role="dialog"
          aria-label="Shipment Ready Date Calendar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Calendar Header with Month/Year & Navigation */}
          <div className="skytech-cal-header">
            <button
              type="button"
              className="skytech-cal-nav-btn"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled()}
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeftIcon size={15} />
            </button>

            <div className="skytech-cal-month-year">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              className="skytech-cal-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRightIcon size={15} />
            </button>
          </div>

          {/* Weekday Column Headers */}
          <div className="skytech-cal-weekdays">
            {WEEKDAY_HEADERS.map((dayName) => (
              <span key={dayName} className="skytech-cal-weekday-cell">
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="skytech-cal-days-grid">
            {/* Empty cells before 1st day of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="skytech-cal-day-cell empty"></div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(viewYear, viewMonth, dayNum);
              cellDate.setHours(0, 0, 0, 0);

              const isPast = cellDate < effectiveMinDate;
              const isSelected =
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === dayNum;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === dayNum;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  className={`skytech-cal-day-cell ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'is-today' : ''} ${isPast ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!isPast) handleSelectDay(dayNum);
                  }}
                  disabled={isPast}
                  title={isPast ? 'Past date cannot be selected' : `${dayNum} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                >
                  <span className="skytech-cal-day-num">{dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions Bar */}
          <div className="skytech-cal-footer">
            <button
              type="button"
              className="skytech-cal-clear-btn"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="skytech-cal-today-btn"
              onClick={handleSelectToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
