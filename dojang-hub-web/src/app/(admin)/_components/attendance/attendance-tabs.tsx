"use client";

import { useState } from "react";
import AcademyAttendanceOverviewManager from "../academy-attendance-overview-manager";
import TodayClasses from "../sessions/today-classes";

type AttendanceTab = "today" | "history";

const TABS: Array<{ id: AttendanceTab; label: string }> = [
  { id: "today", label: "Kelas Hari Ini" },
  { id: "history", label: "Kalender & Riwayat" },
];

export default function AttendanceTabs() {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("today");

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Tampilan absensi" className="grid grid-cols-2 border-2 border-border bg-white">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`attendance-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`attendance-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 px-3 text-sm font-bold uppercase tracking-wide transition ${
                isActive ? "bg-primary text-white" : "bg-white text-primary hover:bg-surface-container-low"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div id={`attendance-panel-${activeTab}`} role="tabpanel" aria-labelledby={`attendance-tab-${activeTab}`}>
        {activeTab === "today" ? <TodayClasses /> : <AcademyAttendanceOverviewManager />}
      </div>
    </div>
  );
}
