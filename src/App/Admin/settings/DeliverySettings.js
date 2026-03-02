import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../Sidebar";
import { ADMIN_API_BASE_URL } from "../adminApi";
import { getCookie } from "../../../utils/cookies";

const FALLBACK_SETTINGS = {
  free_delivery_state: "Lagos",
  free_delivery_areas: ["Ikeja", "Yaba", "Lekki Phase 1"],
  home_delivery_fee: 3000,
  transport_stations: ["Ojota", "Berger", "Jibowu"],
};

const getAuthHeaders = () => {
  const token = getCookie("merchant_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const normalizeSettings = (data = {}) => ({
  free_delivery_state:
    data.free_delivery_state || FALLBACK_SETTINGS.free_delivery_state,
  free_delivery_areas:
    Array.isArray(data.free_delivery_areas) && data.free_delivery_areas.length > 0
      ? data.free_delivery_areas
      : FALLBACK_SETTINGS.free_delivery_areas,
  home_delivery_fee:
    data.home_delivery_fee !== undefined
      ? data.home_delivery_fee
      : FALLBACK_SETTINGS.home_delivery_fee,
  transport_stations:
    Array.isArray(data.transport_stations) && data.transport_stations.length > 0
      ? data.transport_stations
      : FALLBACK_SETTINGS.transport_stations,
});

const applySettingsToForm = (setForm, data) => {
  const normalized = normalizeSettings(data);
  setForm({
    free_delivery_state: normalized.free_delivery_state,
    free_delivery_areas: normalized.free_delivery_areas.join(", "),
    home_delivery_fee: String(normalized.home_delivery_fee),
    transport_stations: normalized.transport_stations.join(", "),
  });
};

const DeliverySettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    free_delivery_state: "",
    free_delivery_areas: "",
    home_delivery_fee: "",
    transport_stations: "",
  });

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1000);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Use public settings for read so admin page still works when admin route is not deployed yet.
      const publicResponse = await fetch(`${ADMIN_API_BASE_URL}/api/delivery-settings`, {
        credentials: "include",
      });

      if (publicResponse.ok) {
        const publicBody = await publicResponse.json();
        applySettingsToForm(setForm, publicBody?.data || {});
        return;
      }

      const adminResponse = await fetch(`${ADMIN_API_BASE_URL}/api/admin/delivery-settings`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (adminResponse.ok) {
        const adminBody = await adminResponse.json();
        applySettingsToForm(setForm, adminBody?.data || {});
        return;
      }

      applySettingsToForm(setForm, FALLBACK_SETTINGS);
      toast.warning("Delivery settings endpoint not found. Using defaults.");
    } catch (error) {
      applySettingsToForm(setForm, FALLBACK_SETTINGS);
      toast.error(error.message || "Failed to fetch delivery settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fee = Number(form.home_delivery_fee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Home delivery fee must be zero or more.");
      return;
    }

    const payload = {
      free_delivery_state: form.free_delivery_state.trim(),
      free_delivery_areas: parseList(form.free_delivery_areas),
      home_delivery_fee: fee,
      transport_stations: parseList(form.transport_stations),
    };

    try {
      setSaving(true);
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/delivery-settings`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Save endpoint not available yet on server. Please redeploy backend with delivery settings routes."
          );
        }
        throw new Error(body.message || "Failed to update delivery settings");
      }

      toast.success("Delivery settings updated");
      await loadSettings();
    } catch (error) {
      toast.error(error.message || "Failed to update delivery settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <ToastContainer />
      <div
        className={`fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 xl:relative xl:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-black via-[#101010] to-black p-6 md:p-8">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mb-6 rounded-lg border border-[#c9a93b]/30 px-3 py-2 text-xs text-[#c9a93b] xl:hidden"
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        <div className="mb-6 rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          <h2 className="text-2xl font-semibold text-[#c9a93b]">Delivery Settings</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Configure free-delivery areas, home delivery fee, and pickup stations.
          </p>
        </div>

        <div className="rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          {loading ? (
            <p className="text-zinc-300">Loading settings...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-zinc-300">Free Delivery State</label>
                <input
                  type="text"
                  name="free_delivery_state"
                  value={form.free_delivery_state}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white outline-none focus:ring-1 focus:ring-[#c9a93b]"
                  placeholder="e.g. Lagos"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300">
                  Free Delivery Areas (comma separated)
                </label>
                <textarea
                  rows={3}
                  name="free_delivery_areas"
                  value={form.free_delivery_areas}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white outline-none focus:ring-1 focus:ring-[#c9a93b]"
                  placeholder="Ikeja, Yaba, Lekki Phase 1"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300">Home Delivery Fee</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="home_delivery_fee"
                  value={form.home_delivery_fee}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white outline-none focus:ring-1 focus:ring-[#c9a93b]"
                  placeholder="3000"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300">
                  Transport Stations (comma separated)
                </label>
                <textarea
                  rows={3}
                  name="transport_stations"
                  value={form.transport_stations}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white outline-none focus:ring-1 focus:ring-[#c9a93b]"
                  placeholder="Ojota, Berger, Jibowu"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#c9a93b] px-4 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Delivery Settings"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliverySettings;
