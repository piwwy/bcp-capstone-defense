// src/components/DashboardAdmin.tsx
import React from "react";
import { Users, Briefcase, Calendar, BarChart2 } from "lucide-react";

const DashboardAdmin: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Officer
          </span>{" "}
          👋
        </h1>
        <p className="text-gray-600 mt-2">
          Manage alumni records, job postings, and upcoming events from your control panel.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { title: "Verified Alumni", value: "1,284", icon: Users },
          { title: "Active Job Posts", value: "47", icon: Briefcase },
          { title: "Upcoming Events", value: "6", icon: Calendar },
          { title: "Reports Generated", value: "12", icon: BarChart2 },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl border shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <h3 className="text-2xl font-bold">{item.value}</h3>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Icon className="text-white w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardAdmin;
