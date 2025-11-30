"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Settings,
} from "lucide-react";

const ProfileAdmin = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const name = localStorage.getItem("user_name") || "";
    const email = localStorage.getItem("user_email") || "";
    setUser({ name, email });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>

          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="absolute -top-16 left-8">
              <div className="h-32 w-32 rounded-full bg-white p-2 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200">
                <Settings className="h-4 w-4" />
                Edit Profile
              </button>
            </div>

            {/* Name and Title */}
            <div className="ml-40 mt-8">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {user.name}
                </h1>
                <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              </div>
              <p className="text-lg text-slate-600">System Administrator</p>
              <p className="mt-2 text-slate-500">
                Managing and maintaining the platform with passion for clean
                code and user experience.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Information */}
          <div className="rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm lg:col-span-2">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">
              Contact Information
            </h2>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email Address</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Joined Date</p>
                  <p className="font-medium text-slate-900">
                    January 15, 2022 (Dummy)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Quick Stats (Dummy data)
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Users</span>
                  <span className="font-semibold text-slate-900">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Active Sessions</span>
                  <span className="font-semibold text-slate-900">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">System Uptime</span>
                  <span className="font-semibold text-emerald-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Last Login</span>
                  <span className="font-semibold text-slate-900">
                    2 hours ago
                  </span>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Permissions
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700">
                    Full System Access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700">
                    User Management
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700">
                    Content Moderation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700">
                    Analytics Access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700">
                    System Configuration
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileAdmin;
