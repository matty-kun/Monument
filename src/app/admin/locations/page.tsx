"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";

interface Location {
  id: string;
  name: string;
}

export default function LocationsPage() {
  const supabase = createClient();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [locationToDeleteId, setLocationToDeleteId] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Error fetching locations.");
      console.error("Error fetching locations:", error);
    } else {
      setLocations(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nameToSubmit = editingLocation ? editingLocation.name : newLocationName;

    if (!nameToSubmit.trim()) {
      toast.error("Location name cannot be empty.");
      return;
    }

    if (editingLocation) {
      // Update existing location
      const { error } = await supabase
        .from("locations")
        .update({ name: nameToSubmit.trim() })
        .eq("id", editingLocation.id);

      if (error) {
        if (error.code === '23505') { // Handle unique constraint violation
          toast.error("A location with this name already exists.");
        } else {
          toast.error(`Error updating location: ${error.message}`);
        }
      } else {
        toast.success("Location updated successfully!");
        setEditingLocation(null);
        fetchLocations();
      }
    } else {
      // Add new location
      const { error } = await supabase
        .from("locations")
        .insert([{ name: nameToSubmit.trim() }]);

      if (error) {
        if (error.code === '23505') { // Handle unique constraint violation
          toast.error("A location with this name already exists.");
        } else {
          toast.error(`Error adding location: ${error.message}`);
        }
      } else {
        toast.success("Location added successfully!");
        setNewLocationName("");
        fetchLocations();
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setLocationToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!locationToDeleteId) return;

    const { error } = await supabase.from("locations").delete().eq("id", locationToDeleteId);

    if (error) {
      toast.error("Error deleting location. It might be in use in a schedule.");
    } else {
      toast.success("Location deleted successfully!");
      fetchLocations();
    }
    setShowConfirmModal(false);
    setLocationToDeleteId(null);
  };

  return (
    <div className="max-w-4xl mx-auto dark:text-gray-200">
      <Toaster position="top-center" />
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Locations' }]} />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">📍 Manage Locations</h1>
        <p className="text-gray-600 dark:text-gray-400">Add, edit, or delete event locations.</p>
      </div>

      <div className="card mb-8 dark:bg-gray-800">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="location-name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {editingLocation ? "Edit Location Name" : "New Location Name"}
            </label>
            <input
              id="location-name"
              type="text"
              placeholder="e.g., University Gym"
              className="input dark:bg-gray-700 dark:border-gray-600"
              value={editingLocation ? editingLocation.name : newLocationName}
              onChange={(e) =>
                editingLocation
                  ? setEditingLocation({ ...editingLocation, name: e.target.value })
                  : setNewLocationName(e.target.value)
              }
              required
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingLocation && (
              <button type="button" onClick={() => setEditingLocation(null)} className="btn btn-secondary w-1/2 sm:w-auto">
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              {editingLocation ? "💾 Save" : "➕ Add"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center p-10"><div className="spinner mx-auto"></div></div>
      ) : (
        <div className="table-container bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="table-cell text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300">Location Name</th>
                <th className="table-cell text-center text-xs font-medium uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {locations.map((location) => (
                <tr key={location.id} className="table-row dark:hover:bg-gray-700/50">
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100">{location.name}</td>                  
                  <td className="table-cell text-center text-sm font-medium">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => setEditingLocation(location)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteClick(location.id)} className="btn-danger py-1 px-3 text-sm rounded">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No locations found. Add one using the form above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this location? This action cannot be undone."
      />
    </div>
  );
}