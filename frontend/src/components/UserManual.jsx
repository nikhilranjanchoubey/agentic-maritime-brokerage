import React from 'react';

export default function UserManual({ onBackToHome, onOpenAuth }) {
  return (
    <div className="manual-page">
      <div className="manual-container">
        {/* Header */}
        <div className="manual-header">
          <div>
            <h1 className="manual-title">How It Works</h1>
            <p className="manual-subtitle">
              A straightforward guide to finding maritime corridors, booking cargo consignments, and tracking delivery milestones.
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onBackToHome}>
            ← Back to Home
          </button>
        </div>

        {/* Quick Nav / Table of Contents */}
        <div className="manual-toc-card">
          <span className="toc-title">Table of Contents</span>
          <div className="toc-links">
            <a href="#section-a">A. Getting Started</a>
            <a href="#section-b">B. Finding Routes & Rates</a>
            <a href="#section-c">C. Booking a Consignment</a>
            <a href="#section-d">D. Tracking Your Consignment</a>
            <a href="#section-e">E. Frequently Asked Questions (FAQ)</a>
          </div>
        </div>

        {/* SECTION A: Getting Started */}
        <section className="manual-section-card" id="section-a">
          <h2 className="section-title">A. Getting Started</h2>
          <div className="section-body">
            <div className="manual-substep">
              <h3 className="substep-title">1. How to Register an Account</h3>
              <p>
                Click the <strong>Register</strong> button in the top navigation bar. Enter your first name, surname, 10-digit mobile number, email address, physical address or port facility, and a secure password (minimum 6 characters). Upon submission, your personal shipper account will be created immediately.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">2. How to Sign In</h3>
              <p>
                Click the <strong>Sign In</strong> button on the navbar. Enter your registered email address and password to access your consignments and book freight.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION B: Finding Routes & Rates */}
        <section className="manual-section-card" id="section-b">
          <h2 className="section-title">B. Finding Routes & Rates</h2>
          <div className="section-body">
            <div className="manual-substep">
              <h3 className="substep-title">1. Select Ports & Cargo Parameters</h3>
              <p>
                On the homepage, navigate to the <strong>Maritime Freight Quotation & Booking</strong> form. Select your <strong>Origin Port (Departure)</strong> (e.g., Chennai, Shanghai, Singapore) and <strong>Destination Port (Discharge)</strong> (e.g., Rotterdam, Hamburg, Los Angeles). Choose your cargo type and container count.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">2. Click "Analyze Optimal Route"</h3>
              <p>
                Click the blue <strong>Analyze Optimal Route</strong> button. SeaRoute evaluates active ocean shipping corridors and calculates transit times, voyage distance in nautical miles, transshipment hubs, and transparent freight benchmarks.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">3. Explore Recommended Route & Alternative Corridors</h3>
              <p>
                The <strong>Recommended Route</strong> card highlights the fastest and most reliable corridor. Alternative corridors are listed in the comparison table below, allowing you to compare transit days, voyage distance, transshipments, and freight costs. You can choose and book any available route.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION C: Booking a Consignment */}
        <section className="manual-section-card" id="section-c">
          <h2 className="section-title">C. Booking a Consignment</h2>
          <div className="section-body">
            <div className="manual-substep">
              <h3 className="substep-title">1. Request Booking on Your Chosen Route</h3>
              <p>
                Click <strong>Request Shipment Booking on this Route</strong> on the recommended corridor card, or click <strong>Book Route</strong> next to any corridor in the Available Route Comparison table.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">2. Complete Booking Details</h3>
              <p>
                The selected Route ID, Origin Port, and Destination Port will automatically populate. Complete the required cargo and logistics information:
              </p>
              <ul className="manual-bullet-list">
                <li><strong>Cargo Description:</strong> e.g., Electronics, Textile, Industrial Machinery.</li>
                <li><strong>Cargo Type:</strong> Standard Dry Container, Reefer, Hazardous, or Breakbulk.</li>
                <li><strong>Container Count:</strong> Total TEU quantity to be booked.</li>
                <li><strong>Shipper Contact & Phone:</strong> Contact information for booking confirmation.</li>
                <li><strong>Origin Pickup & Destination Delivery Addresses:</strong> Facility details for port intake and final delivery.</li>
                <li><strong>Expected Handover Date:</strong> Scheduled date for cargo delivery to port.</li>
              </ul>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">3. Confirm & Save Your Booking ID</h3>
              <p>
                Click <strong>Confirm & Submit Booking</strong>. Your consignment is scheduled immediately with initial status <code>Order Placed</code> and a unique tracking reference (e.g. <code>BK-2026-960964</code>).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION D: Tracking Your Consignment */}
        <section className="manual-section-card" id="section-d">
          <h2 className="section-title">D. Tracking Your Consignment</h2>
          <div className="section-body">
            <div className="manual-substep">
              <h3 className="substep-title">1. Open "My Consignment"</h3>
              <p>
                When signed in, click the <strong>My Consignment</strong> tab in the top navigation bar to view all bookings registered under your account.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">2. Click "Track Shipment"</h3>
              <p>
                Click the <strong>Track Shipment</strong> button on any active booking record to view its live milestone timeline.
              </p>
            </div>
            <div className="manual-substep">
              <h3 className="substep-title">3. Understand Milestone Progress</h3>
              <p>
                The shipment timeline displays 7 clear operational milestones:
              </p>
              <ul className="manual-bullet-list">
                <li><strong>Completed Milestones:</strong> Display a green checkmark, completion timestamp, and official port administrator verification notes.</li>
                <li><strong>Current Status:</strong> Marked with an active blue status badge indicating the current operational checkpoint.</li>
                <li><strong>Upcoming Milestones:</strong> Clearly listed in chronological sequence toward final destination delivery.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION E: Frequently Asked Questions (FAQ) */}
        <section className="manual-section-card" id="section-e">
          <h2 className="section-title">E. Frequently Asked Questions (FAQ)</h2>
          <div className="section-body faq-body">
            <div className="faq-item">
              <h4 className="faq-q">Q: How do I find an optimal shipping route?</h4>
              <p className="faq-a">
                Select your Origin Port (POL) and Destination Port (POD) in the homepage quotation form and click "Analyze Optimal Route". SeaRoute evaluates transit days, voyage distance, and transshipment stops to present the best options.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-q">Q: Do I need to sign in to check shipping rates?</h4>
              <p className="faq-a">
                No. You can freely search corridors, compare routes, and view freight estimates as a guest. Signing in is only required when you are ready to book a consignment or view your booked consignments.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-q">Q: Where can I find my Booking ID?</h4>
              <p className="faq-a">
                Your Booking ID appears immediately upon booking confirmation and is permanently listed under the "My Consignment" tab in the top navigation bar.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-q">Q: How do I track my consignment progress?</h4>
              <p className="faq-a">
                Go to "My Consignment" in the top navigation bar and click "Track Shipment" on any booking to view its timeline, completed milestones, and remarks.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-q">Q: Who updates consignment milestones?</h4>
              <p className="faq-a">
                Authorized port administrators and logistics officers update operational milestones (e.g. Cargo Received at Port, Loaded onto Vessel, In Transit, Discharged, Delivered) as your shipment progresses through physical checkpoints.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Action */}
        <div className="manual-footer-action">
          <button type="button" className="btn-primary" onClick={onBackToHome}>
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
