import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatUtcDateLabel, toUtcIso, parseUtcIso } from '../utils/calculator';
import './DateTriplet.css';

interface DateTripletProps {
  value: string;
  onChange: (nextIso: string) => void;
  label?: string;
  helper?: string;
}

export function DateTriplet({ value, onChange, label = "Date", helper }: DateTripletProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value ? parseUtcIso(value) : new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });

  const nextMonth = () => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)));
  const prevMonth = () => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)));

  const handleDaySelect = (dateIso: string) => {
    onChange(dateIso);
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupHeight = 340;
      let top = rect.bottom + 8;
      
      if (top + popupHeight > window.innerHeight) {
        top = rect.top - popupHeight - 8;
      }
      
      setCoords({
        top,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close on scroll to prevent detached popup
  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => setIsOpen(false);
      window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scrolls
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen]);

  const year = currentMonth.getUTCFullYear();
  const month = currentMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startingDayOfWeek = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(<div key={`pad-start-${i}`} className="dp-cell padding" />);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dateIso = toUtcIso(new Date(Date.UTC(year, month, i)));
    const isSelected = dateIso === value;
    const isToday = dateIso === toUtcIso(new Date());
    
    cells.push(
      <button
        key={dateIso}
        type="button"
        className={`dp-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => handleDaySelect(dateIso)}
      >
        {i}
      </button>
    );
  }

  const monthLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(currentMonth);
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="field-group date-picker-container">
      <div className="field-header" style={{ justifyContent: 'flex-start' }}>
        <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
        <span className="field-label">{label}</span>
      </div>
      
      <button 
        ref={buttonRef}
        type="button" 
        className={`date-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <span className="date-picker-value">{value ? formatUtcDateLabel(value) : "Select date"}</span>
      </button>

      {helper && <p className="field-helper">{helper}</p>}

      {isOpen && createPortal(
        <div className="date-picker-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="date-picker-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: `${coords.top}px`, left: `${coords.left}px` }}
          >
            <div className="dp-header">
              <button type="button" className="dp-nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
              <span className="dp-month-label">{monthLabel}</span>
              <button type="button" className="dp-nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
            </div>
            <div className="dp-grid">
              {weekdays.map(d => <div key={d} className="dp-weekday">{d}</div>)}
              {cells}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
