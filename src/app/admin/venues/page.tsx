"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../components/ConfirmModal';
import Breadcrumbs from "../../../components/Breadcrumbs";

interface Venue {
  id: string;
  name: string;
}

export default function VenuesPage() {
  const supabase = createClient();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVenueName, setNewVenueName] = useState("");
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [venueToDeleteId, setVenueToDeleteId] = useState<string | null>(null);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("venues")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Error fetching venues.");
      console.error("Error fetching venues:", error);
    } else {
      setVenues(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nameToSubmit = editingVenue ? editingVenue.name : newVenueName;

    if (!nameToSubmit.trim()) {
      toast.error("Venue name cannot be empty.");
      return;
    }

    if (editingVenue) {
      // Update existing venue
      const { error } = await supabase
        .from("venues")
        .update({ name: nameToSubmit.trim() })
        .eq("id", editingVenue.id);

      if (error) {
        if (error.code === '23505') { // Handle unique constraint violation
          toast.error("A venue with this name already exists.");
        } else {
          toast.error(`Error updating venue: ${error.message}`);
        }
      } else {
        toast.success("Venue updated successfully!");
        setEditingVenue(null);
        fetchVenues();
      }
    } else {
      // Add new venue
      const { error } = await supabase
        .from("venues")
        .insert([{ name: nameToSubmit.trim() }]);

      if (error) {
        if (error.code === '23505') { // Handle unique constraint violation
          toast.error("A venue with this name already exists.");
        } else {
          toast.error(`Error adding venue: ${error.message}`);
        }
      } else {
        toast.success("Venue added successfully!");
        setNewVenueName("");
        fetchVenues();
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setVenueToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDeleteId) return;

    const { error } = await supabase.from("venues").delete().eq("id", venueToDeleteId);

    if (error) {
      toast.error("Error deleting venue. It might be in use in a schedule.");
    } else {
      toast.success("Venue deleted successfully!");
      fetchVenues();
    }
    setShowConfirmModal(false);
    setVenueToDeleteId(null);
  };

  return (
    <div className="max-w-4xl mx-auto dark:text-gray-200">
      <Toaster position="top-center" />
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Venues' }]} />
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-monument-green mb-2 dark:text-green-400">📍 Manage Venues</h1>
        <p className="text-gray-600 dark:text-gray-400">Add, edit, or delete event venues.</p>
      </div>

      <div className="card mb-8 dark:bg-gray-800">
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label htmlFor="venue-name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {editingVenue ? "Edit Venue Name" : "New Venue Name"}
            </label>
            <input
              id="venue-name"
              type="text"
              placeholder="e.g., University Gym"
              className="input dark:bg-gray-700 dark:border-gray-600"
              value={editingVenue ? editingVenue.name : newVenueName}
              onChange={(e) =>
                editingVenue
                  ? setEditingVenue({ ...editingVenue, name: e.target.value })
                  : setNewVenueName(e.target.value)
              }
              required
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {editingVenue && (
              <button type="button" onClick={() => setEditingVenue(null)} className="btn btn-secondary w-1/2 sm:w-auto">
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              {editingVenue ? "💾 Save" : "➕ Add"}
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
                <th className="table-cell text-left text-xs font-medium uppercase tracking-wider dark:text-gray-300">Venue Name</th>
                <th className="table-cell text-center text-xs font-medium uppercase tracking-wider dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {venues.map((venue) => (
                <tr key={venue.id} className="table-row dark:hover:bg-gray-700/50">
                  <td className="table-cell font-medium text-gray-900 dark:text-gray-100">{venue.name}</td>                  
                  <td className="table-cell text-center text-sm font-medium">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => setEditingVenue(venue)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm transition-colors">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteClick(venue.id)} className="btn-danger py-1 px-3 text-sm rounded">
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {venues.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No venues found. Add one using the form above.
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
        message="Are you sure you want to delete this venue? This action cannot be undone."
      />
    </div>
  );
}
