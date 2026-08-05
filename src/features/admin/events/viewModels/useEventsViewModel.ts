import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { uploadImageAction, deleteImageAction } from "@/app/admin/actions";
import toast from "react-hot-toast";
import { AdminEvent } from "../models/eventTypes";
import { Category } from "../../categories/models/categoryTypes";
import { Tournament } from "@/components/AdminTournamentProvider";

interface UseEventsViewModelProps {
  selectedTournament: Tournament | null;
}

export const useEventsViewModel = ({ selectedTournament }: UseEventsViewModelProps) => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventName, setEventName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [division, setDivision] = useState<string | null>(null);
  const [icon, setIcon] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [visualType, setVisualType] = useState<'emoji' | 'photo'>('emoji');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    if (!selectedTournament) return;
    const { data, error } = await supabase.from("events").select("id, name, icon, category, gender, division").eq("tournament_id", selectedTournament.id).order("name");
    if (!error) setEvents(data as AdminEvent[]);
  }, [supabase, selectedTournament]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name");
    if (!error) setCategories(data as Category[]);
  }, [supabase]);

  useEffect(() => {
    if (selectedTournament) {
      fetchEvents();
      fetchCategories();
      const channel = supabase.channel('events-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchEvents, fetchCategories, supabase, selectedTournament]);

  useEffect(() => {
     document.title = `Manage Events | ${selectedTournament?.name || "Admin"}`;
  }, [selectedTournament]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(null);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { if (reader.result) setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImageAction(formData, 'event-images', 'events');
    if (!result.success) {
      toast.error(`Upload failed: ${result.error}`);
      return null;
    }
    return result.publicUrl || null;
  };

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim() || !selectedCategory) {
      toast.error("Event name and category are required.");
      return;
    }

    try {
      setUploading(true);
      let finalIcon = visualType === 'emoji' ? (icon || null) : (imagePreview || null);

      if (visualType === 'photo' && selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) finalIcon = uploadedUrl;
        else { toast.error("Failed to upload image."); setUploading(false); return; }
      }

      const eventData = {
        name: eventName,
        category: selectedCategory,
        gender: gender === "N/A" ? null : gender,
        division: division === "N/A" ? null : division,
        icon: finalIcon,
        tournament_id: selectedTournament?.id,
      };

      if (editingId) {
        const { error } = await supabase.from("events").update(eventData).eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert([eventData]);
        if (error) throw error;
        toast.success("Event added successfully!");
      }
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEventName("");
    setSelectedCategory("");
    setGender(null);
    setDivision(null);
    setIcon("");
    setVisualType('emoji');
    setShowEmojiPicker(false);
    setImagePreview(null);
    setSelectedImage(null);
    setEditingId(null);
  }

  async function handleConfirmDelete() {
    if (!eventToDeleteId) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting event...");
    try {
      const eventToDel = events.find(e => e.id === eventToDeleteId);
      if (eventToDel?.icon?.startsWith('http')) {
        const urlParts = eventToDel.icon.split('/');
        const filePath = `events/${urlParts[urlParts.length - 1]}`;
        await deleteImageAction('event-images', filePath);
      }
      const { error } = await supabase.from("events").delete().eq("id", eventToDeleteId);
      if (error) throw error;
      toast.success("Event deleted!", { id: toastId });
      fetchEvents();
    } catch (error: any) {
      toast.error(`Deletion failed: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
    setShowConfirmModal(false);
    setEventToDeleteId(null);
  }

  async function handleImportEvents(sourceTournamentId: string) {
    if (!selectedTournament) return;
    
    const { data: sourceEvents, error: sourceError } = await supabase
      .from("events")
      .select("name, icon, category, gender, division")
      .eq("tournament_id", sourceTournamentId);
      
    if (sourceError || !sourceEvents) {
      toast.error("Failed to fetch events from source tournament.");
      return;
    }
    
    if (sourceEvents.length === 0) {
      toast.error("No events found in the selected tournament.");
      return;
    }

    const { data: currentEvents } = await supabase
      .from("events")
      .select("name, category, gender, division")
      .eq("tournament_id", selectedTournament.id);
      
    const makeKey = (e: any) => `${e.name}-${e.category}-${e.gender || 'NA'}-${e.division || 'NA'}`.toLowerCase();
    const currentKeys = new Set(currentEvents?.map(makeKey) || []);
    
    const newEventsToInsert = sourceEvents
      .filter(evt => !currentKeys.has(makeKey(evt)))
      .map(evt => ({
        ...evt,
        tournament_id: selectedTournament.id
      }));
      
    if (newEventsToInsert.length === 0) {
      toast.error("All events from that tournament already exist here.");
      return;
    }
    
    const { error: insertError } = await supabase
      .from("events")
      .insert(newEventsToInsert);
      
    if (insertError) {
      toast.error(`Error importing events: ${insertError.message}`);
    } else {
      toast.success(`Successfully imported ${newEventsToInsert.length} events!`);
      fetchEvents();
    }
    setShowImportModal(false);
  }

  const formatEventName = useCallback((event: AdminEvent) => {
    const parts = [event.name];
    if (event.division && event.division !== "N/A") parts.push(`(${event.division})`);
    if (event.gender && event.gender !== "N/A") parts.push(`- ${event.gender}`);
    return parts.join(" ");
  }, []);

  const genderOptions = useMemo(() => [
    { id: "N/A", name: "N/A (Not Applicable)" },
    { id: "Men", name: "Men" },
    { id: "Women", name: "Women" },
    { id: "Mixed", name: "Mixed" },
  ], []);

  const divisionOptions = useMemo(() => [
    { id: "N/A", name: "N/A (Not Applicable)" },
    { id: "Individual", name: "Individual" },
    { id: "Duo", name: "Duo" },
    { id: "Singles", name: "Singles" },
    { id: "Doubles", name: "Doubles" },
    { id: "Team", name: "Team" },
  ], []);

  const getCategoryName = useCallback((id: string) => categories.find((c) => c.id === id)?.name || "N/A", [categories]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) => formatEventName(e).toLowerCase().includes(q) || getCategoryName(e.category).toLowerCase().includes(q));
  }, [events, searchQuery, formatEventName, getCategoryName]);

  return {
    events,
    categories,
    eventName,
    setEventName,
    selectedCategory,
    setSelectedCategory,
    gender,
    setGender,
    division,
    setDivision,
    icon,
    setIcon,
    showEmojiPicker,
    setShowEmojiPicker,
    editingId,
    setEditingId,
    showConfirmModal,
    setShowConfirmModal,
    eventToDeleteId,
    setEventToDeleteId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showImportModal,
    setShowImportModal,
    visualType,
    setVisualType,
    selectedImage,
    setSelectedImage,
    imagePreview,
    setImagePreview,
    uploading,
    setUploading,
    isDeleting,
    setIsDeleting,
    handleImageSelect,
    handleAddOrUpdate,
    resetForm,
    handleConfirmDelete,
    handleImportEvents,
    formatEventName,
    genderOptions,
    divisionOptions,
    getCategoryName,
    filteredEvents,
  };
};
