import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Enter Shipment Details",
      desc: "Select origin and destination ports from 47 global hubs, designate cargo classification, and specify container volume.",
    },
    {
      step: "02",
      title: "Discover Available Routes",
      desc: "Our routing engine parses the 500+ corridor network to identify viable direct voyages and hub transshipment schedules.",
    },
    {
      step: "03",
      title: "Compare Route Recommendations",
      desc: "Review weighted composite scores, transit time trade-offs, nautical distance, and base container freight estimates.",
    },
    {
      step: "04",
      title: "Make Informed Decisions",
      desc: "Bookmark optimal routing in your workspace, request carrier allocation, and quote clients with high confidence.",
    },
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-container">
        <div className="section-header-center">
          <div className="section-badge-pill">
            <span>OPERATIONAL WORKFLOW</span>
          </div>
          <h2 className="section-title">Your Voyage, Simplified</h2>
          <p className="section-subtitle">
            A transparent four-step progression from port inquiry to optimized maritime freight decision.
          </p>
        </div>

        <div className="process-timeline-wrapper">
          <div className="process-steps-grid">
            {steps.map((st, index) => (
              <div key={st.step} className="process-step-box">
                <div className="step-badge-circle">{st.step}</div>
                <h3 className="process-step-title">{st.title}</h3>
                <p className="process-step-desc">{st.desc}</p>
                {index < steps.length - 1 && (
                  <div className="process-step-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
