import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import { Venue } from "../models/venueTypes";

export const useVenuesViewModel = () => {
  const supabase = createClient();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [venueToDeleteId, setVenueToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("venues").select("id, name").order("name", { ascending: true });
    if (!error) setVenues(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchVenues();
    document.title = "Manage Venues | CITE FEST 2026";
  }, [fetchVenues]);

  const resetForm = () => {
    setVenueName("");
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!venueName.trim()) { toast.error("Name is required."); return; }

    try {
      if (editingId) {
        const { error } = await supabase.from("venues").update({ name: venueName.trim() }).eq("id", editingId);
        if (error) throw error;
        toast.success("Venue updated!");
      } else {
        const { error } = await supabase.from("venues").insert([{ name: venueName.trim() }]);
        if (error) throw error;
        toast.success("Venue added!");
      }
      resetForm();
      setShowFormModal(false);
      fetchVenues();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!venueToDeleteId) return;
    const { error } = await supabase.from("venues").delete().eq("id", venueToDeleteId);
    if (error) {
      toast.error("Error deleting venue. It might be in use.");
    } else { 
      toast.success("Venue deleted!"); 
      fetchVenues(); 
    }
    setShowConfirmModal(false); 
    setVenueToDeleteId(null);
  };

  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues;
    return venues.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [venues, searchQuery]);

  return {
    loading,
    filteredVenues,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showFormModal,
    setShowFormModal,
    venueName,
    setVenueName,
    editingId,
    setEditingId,
    showConfirmModal,
    setShowConfirmModal,
    setVenueToDeleteId,
    resetForm,
    handleAddOrUpdate,
    handleDelete,
  };
};
