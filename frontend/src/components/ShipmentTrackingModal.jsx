import React, { useState, useEffect, useRef } from 'react';
import { fetchShipmentDetails } from '../services/api';

const DISPATCH_MILESTONES = [
  'Booking Confirmed',
  'Cargo Received at Origin Port',
  'Loaded onto Vessel',
  'In Transit',
  'Arrived at Destination Port',
  'Delivered'
];

function formatMilestoneTimestamp(dateStr) {
  if (!dateStr || dateStr === '—') return '—';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function normalizeStatusName(status, remarks = '', bookingStatus = '') {
  const s = (status || '').trim();
  if (s === 'Order Placed') {
    if (remarks.toLowerCase().includes('approved') || bookingStatus === 'Approved') {
      return 'Booking Confirmed';
    }
    return 'Booking Request Submitted';
  }
  if (s === 'Booking Approved') {
    return 'Booking Confirmed';
  }
  if (s === 'Cargo Received at Port') {
    return 'Cargo Received at Origin Port';
  }
  if (s === 'Cancelled') {
    return 'Booking Cancelled';
  }
  if (s === 'Rejected') {
    return 'Booking Rejected';
  }
  return s;
}

export default function ShipmentTrackingModal({
  isOpen,
  bookingId,
  onClose,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const modalScrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    let mounted = true;
    async function loadShipment() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchShipmentDetails(bookingId);
        if (mounted) {
          setData(res);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve shipment tracking records.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadShipment();
    return () => {
      mounted = false;
    };
  }, [isOpen, bookingId]);

  // Always reset scroll position to top whenever modal opens or new booking loads
  useEffect(() => {
    if (isOpen) {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = 0;
      }
      requestAnimationFrame(() => {
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTop = 0;
        }
      });
    }
  }, [isOpen, bookingId, data]);

  if (!isOpen) return null;

  const booking = data?.booking;
  const timeline = data?.timeline || [];

  const bStatus = (booking?.booking_status || '').trim();
  const dStatus = (booking?.dispatch_status || '').trim();
  const isPending = bStatus === 'Pending';
  const isApproved = bStatus === 'Approved';
  const isRejected = bStatus === 'Rejected' || timeline.some((e) => e.status.toLowerCase().includes('reject'));
  const isCancelled =
    bStatus === 'Cancelled' ||
    dStatus.toLowerCase().includes('cancelled') ||
    timeline.some((e) => e.status.toLowerCase().includes('cancel'));
  const isDelivered = dStatus === 'Delivered';

  // Normalize current dispatch milestone name
  let currentMilestone = normalizeStatusName(dStatus, '', bStatus);
  if (!currentMilestone || currentMilestone === 'Pending Approval') {
    currentMilestone = isApproved ? 'Booking Confirmed' : 'Booking Request Submitted';
  }

  // Find rejection / cancellation reason from timeline
  const cancelEvent = timeline.find((e) => e.status.toLowerCase().includes('cancel'));
  const rejectEvent = timeline.find((e) => e.status.toLowerCase().includes('reject'));

  // Build unique completed milestones list
  const completedStages = [];
  const seenStageNames = new Set();

  timeline.forEach((evt) => {
    const normName = normalizeStatusName(evt.status, evt.remarks, bStatus);
    if (!seenStageNames.has(normName)) {
      seenStageNames.add(normName);

      // Determine whether remark is from Administrator Note or System Update
      const isSystem =
        evt.remark_type === 'system' ||
        evt.updated_by === 'System' ||
        (evt.remarks && evt.remarks.includes('System')) ||
        normName === 'Booking Request Submitted' ||
        (normName === 'Booking Confirmed' && !evt.remarks?.includes('Admin:')) ||
        (evt.remarks && (
          evt.remarks.toLowerCase().includes('shipment booking request submitted') ||
          evt.remarks.toLowerCase().includes('awaiting port administrator review') ||
          evt.remarks.toLowerCase().includes('awaiting administrator review') ||
          evt.remarks.toLowerCase().includes('booking approved by the port administrator') ||
          evt.remarks.toLowerCase().includes('cargo physically received') ||
          evt.remarks.toLowerCase().includes('safely stowed and secured') ||
          evt.remarks.toLowerCase().includes('vessel departed origin port') ||
          evt.remarks.toLowerCase().includes('vessel berthed at destination') ||
          evt.remarks.toLowerCase().includes('consignment discharged from vessel') ||
          evt.remarks.toLowerCase().includes('shipment status transitioned to') ||
          evt.remarks.toLowerCase().includes('system update')
        ));

      // Remove all system-generated boilerplate remarks
      let rawRemarks = evt.remarks && evt.remarks.trim() ? evt.remarks.trim() : null;
      if (isSystem) {
        rawRemarks = null;
      }

      completedStages.push({
        name: normName,
        timestamp: formatMilestoneTimestamp(evt.timestamp || evt.created_at),
        remarks: rawRemarks,
        isSystemRemark: isSystem,
        updatedBy: evt.updated_by || (isSystem ? 'System' : 'Administrator'),
        intermediatePort: evt.intermediate_port || null,
        isCurrent: false,
      });
    }
  });

  // If approved and 'Booking Confirmed' event wasn't in timeline yet, add it
  if (isApproved && !seenStageNames.has('Booking Confirmed')) {
    seenStageNames.add('Booking Confirmed');
    completedStages.push({
      name: 'Booking Confirmed',
      timestamp: formatMilestoneTimestamp(booking?.updated_at || booking?.created_at),
      remarks: null,
      isSystemRemark: true,
      updatedBy: 'Administrator',
      intermediatePort: null,
      isCurrent: false,
    });
  }

  // Ensure milestone sequence up to current milestone is satisfied
  if (isApproved && !isCancelled && !isRejected) {
    const currIdx = DISPATCH_MILESTONES.indexOf(currentMilestone);
    if (currIdx !== -1) {
      for (let i = 0; i <= currIdx; i++) {
        const stageName = DISPATCH_MILESTONES[i];
        if (!seenStageNames.has(stageName)) {
          seenStageNames.add(stageName);
          completedStages.push({
            name: stageName,
            timestamp: formatMilestoneTimestamp(booking?.updated_at || booking?.created_at),
            remarks: null,
            isSystemRemark: true,
            updatedBy: 'System',
            intermediatePort: null,
            isCurrent: false,
          });
        }
      }
    }
  }

  // Mark latest non-cancelled stage as current
  if (completedStages.length > 0 && !isDelivered && !isCancelled && !isRejected) {
    completedStages[completedStages.length - 1].isCurrent = true;
  }

  // Build Upcoming Stages: strictly remaining dispatch milestones after current stage
  let pendingStages = [];
  if (!isCancelled && !isRejected && !isDelivered) {
    if (isPending) {
      // Pending: all 6 dispatch milestones are upcoming
      pendingStages = DISPATCH_MILESTONES.map((name) => ({ name }));
    } else {
      const currIdx = DISPATCH_MILESTONES.indexOf(currentMilestone);
      if (currIdx !== -1 && currIdx < DISPATCH_MILESTONES.length - 1) {
        pendingStages = DISPATCH_MILESTONES.slice(currIdx + 1).map((name) => ({ name }));
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) onClose(); }}>
      <div className="modal-card tracking-modal-card">
        {/* Fixed Non-Clipping Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Shipment Tracking & Timeline</h3>
            <span className="tracking-booking-code">{bookingId}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Scrollable Container with scrollTop = 0 on open */}
        <div className="tracking-modal-scroll-body" ref={modalScrollRef}>
          {loading ? (
            <div className="loading-state">Retrieving live tracking records from database...</div>
          ) : error ? (
            <div className="alert-banner alert-danger">{error}</div>
          ) : !booking ? (
            <div className="empty-state-notice">Shipment records could not be found.</div>
          ) : (
            <div className="tracking-modal-body">
              {/* Shipment Overview Header */}
              <div className="tracking-summary-card">
                <div className="tracking-corridor-row">
                  <div className="t-port">
                    <span className="t-label">Origin Port</span>
                    <span className="t-val">{booking.origin}</span>
                  </div>
                  <div className="t-arrow">➔</div>
                  <div className="t-port">
                    <span className="t-label">Destination Port</span>
                    <span className="t-val">{booking.destination}</span>
                  </div>
                </div>

                <div className="tracking-meta-grid">
                  <div className="t-meta-item">
                    <span className="t-meta-label">Shipper</span>
                    <span className="t-meta-val">
                      {booking.shipper_name || 'Shipper'}
                      <div className="text-muted text-xs font-normal">{booking.user_email}</div>
                    </span>
                  </div>

                  <div className="t-meta-item">
                    <span className="t-meta-label">Cargo Details</span>
                    <span className="t-meta-val">
                      {booking.containers} TEU • {booking.cargo_type}
                      {booking.cargo_desc ? <div className="text-muted text-xs font-normal">{booking.cargo_desc}</div> : null}
                    </span>
                  </div>

                  <div className="t-meta-item">
                    <span className="t-meta-label">Booking Status</span>
                    <span className={`tracking-status-text ${
                      isPending ? 'status-color-pending' :
                      isApproved ? 'status-color-approved' :
                      isCancelled ? 'status-color-cancelled' :
                      isRejected ? 'status-color-rejected' : 'status-color-info'
                    }`}>
                      {isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : isApproved ? 'Approved' : bStatus || 'Pending'}
                    </span>
                  </div>

                  <div className="t-meta-item">
                    <span className="t-meta-label">Dispatch Status</span>
                    <span className={`tracking-status-text ${
                      isCancelled ? 'status-color-cancelled' :
                      isDelivered ? 'status-color-approved' :
                      'status-color-dispatch'
                    }`}>
                      {isCancelled ? 'Cancelled' : isRejected ? 'Rejected' : dStatus || (isApproved ? 'Booking Confirmed' : 'Pending Approval')}
                    </span>
                  </div>

                  <div className="t-meta-item">
                    <span className="t-meta-label">Route Reference</span>
                    <span className="t-meta-val font-mono">{booking.route_id || 'R-DIR'} ({booking.transit_days} Days)</span>
                  </div>

                  <div className="t-meta-item">
                    <span className="t-meta-label">Total Freight</span>
                    <span className="t-meta-val font-bold text-navy">${Number(booking.freight_usd || 0).toLocaleString()}</span>
                  </div>

                  {booking.intermediate_port && (
                    <div className="t-meta-item full-span">
                      <span className="t-meta-label">Intermediate Transshipment Hub</span>
                      <span className="t-meta-val highlight-port">{booking.intermediate_port}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation or Rejection Notice */}
              {isCancelled && (
                <div className="alert-banner alert-danger">
                  <strong>Consignment Cancelled:</strong> {cancelEvent?.remarks || 'This shipment booking has been cancelled.'}
                  <div className="text-xs text-muted mt-1">Recorded: {formatMilestoneTimestamp(cancelEvent?.timestamp || booking.updated_at)}</div>
                </div>
              )}
              {isRejected && (
                <div className="alert-banner alert-danger">
                  <strong>Booking Rejected:</strong> {rejectEvent?.remarks || 'This shipment request was rejected by the Port Administrator.'}
                  <div className="text-xs text-muted mt-1">Recorded: {formatMilestoneTimestamp(rejectEvent?.timestamp || booking.updated_at)}</div>
                </div>
              )}

              {/* Completed Milestones Section */}
              <div className="timeline-section">
                <h4 className="timeline-section-title">
                  Completed Milestones ({completedStages.length})
                </h4>
                <div className="timeline-stepper">
                  {completedStages.map((stage, idx) => (
                    <div
                      key={`${stage.name}-${idx}`}
                      className={`timeline-step completed ${stage.isCurrent ? 'is-current-stage' : ''}`}
                    >
                      <div className="step-marker">
                        <span className="marker-icon">✓</span>
                        {idx < completedStages.length - 1 && <span className="step-connector completed"></span>}
                      </div>
                      <div className="step-content">
                        <div className="step-header">
                          <span className="step-name">{stage.name}</span>
                          {stage.isCurrent && !isCancelled && !isRejected && (
                            <span className="current-pulse-badge">Current Status</span>
                          )}
                        </div>
                        <div className="step-timestamp">
                          {stage.timestamp}
                        </div>
                        {stage.remarks && !stage.isSystemRemark && (
                          <div className="step-remarks admin-note">
                            <span className="remark-tag admin-tag">
                              Remark
                            </span>
                            <span className="remark-text">
                              {stage.remarks.replace(' (Admin)', '').replace(/Reason: /g, '')}
                            </span>
                          </div>
                        )}
                        {stage.intermediatePort && (
                          <div className="step-transshipment-info">
                            <strong>Transshipment Hub:</strong> {stage.intermediatePort}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Stages Section (Strictly milestones after current milestone; none if Delivered) */}
              {pendingStages.length > 0 && !isCancelled && !isRejected && (
                <div className="timeline-section pending-section">
                  <h4 className="timeline-section-title pending-title">
                    Upcoming Stages ({pendingStages.length})
                  </h4>
                  <div className="timeline-stepper pending-stepper">
                    {pendingStages.map((stage, idx) => (
                      <div key={stage.name} className="timeline-step pending">
                        <div className="step-marker pending">
                          <span className="marker-number">{completedStages.length + idx + 1}</span>
                          {idx < pendingStages.length - 1 && <span className="step-connector pending"></span>}
                        </div>
                        <div className="step-content">
                          <div className="step-header">
                            <span className="step-name pending">{stage.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
