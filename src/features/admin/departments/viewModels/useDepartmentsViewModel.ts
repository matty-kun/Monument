import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { uploadImageAction, deleteImageAction } from "@/app/admin/actions";
import toast from 'react-hot-toast';
import { Department } from "../models/departmentTypes";
import { Tournament } from "@/components/AdminTournamentProvider";

interface UseDepartmentsViewModelProps {
  selectedTournament: Tournament | null;
}

export const useDepartmentsViewModel = ({ selectedTournament }: UseDepartmentsViewModelProps) => {
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [courses, setCourses] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logos, setLogos] = useState<{ url: string | null; file: File | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [departmentToDeleteId, setDepartmentToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchDepartments = useCallback(async () => {
    if (!selectedTournament) return;
    const { data, error } = await supabase
      .from("tournament_departments")
      .select("id, department_id, name, courses:abbreviation, image_url")
      .eq("tournament_id", selectedTournament.id)
      .order("name");
    if (!error && data) setDepartments(data);
  }, [supabase, selectedTournament]);

  useEffect(() => {
    if (selectedTournament) {
      fetchDepartments();
      document.title = `Manage Teams | ${selectedTournament.name}`;
    }
  }, [fetchDepartments, selectedTournament]);

  function handleAddLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogos(prev => [...prev, { url: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleUpdateLogoUrl(index: number, url: string) {
    setLogos(prev => prev.map((logo, i) => i === index ? { ...logo, url, file: null } : logo));
  }

  function handleRemoveLogo(index: number) {
    setLogos(prev => prev.filter((_, i) => i !== index));
  }

  function handleAddEmptyLogo() {
    setLogos(prev => [...prev, { url: '', file: null }]);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadImageAction(formData, 'department-images', 'departments');
    if (!result.success) {
      toast.error(`Upload failed: ${result.error}`);
      return null;
    }
    return result.publicUrl || null;
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    
    let finalUrls: string[] = [];
    
    for (const logo of logos) {
      if (logo.file) {
        const uploadedUrl = await uploadImage(logo.file);
        if (uploadedUrl) finalUrls.push(uploadedUrl);
      } else if (logo.url && logo.url.trim() !== '') {
        finalUrls.push(logo.url.trim());
      }
    }

    try {
      const payload: any = { name, abbreviation: courses };
      payload.image_url = finalUrls.length > 0 ? finalUrls.join(',') : null;

      if (editingId) {
        const { error } = await supabase.from("tournament_departments").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Team updated for this tournament!");
      } else {
        const { data: globalDept, error: globalError } = await supabase
          .from("departments")
          .upsert([{ name: payload.name, abbreviation: payload.abbreviation, image_url: payload.image_url }], { onConflict: 'name' })
          .select()
          .single();
          
        if (globalError) throw globalError;

        const { error } = await supabase.from("tournament_departments").insert([{
          ...payload,
          tournament_id: selectedTournament?.id,
          department_id: globalDept.id
        }]);
        if (error) throw error;
        toast.success("Team added to tournament!");
      }
      resetForm();
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCourses("");
    setLogos([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleConfirmDelete() {
    if (!departmentToDeleteId) return;
    try {
      const dept = departments.find(d => d.id === departmentToDeleteId);
      if (dept?.image_url) {
        const urlParts = dept.image_url.split('/');
        await deleteImageAction('department-images', `departments/${urlParts[urlParts.length - 1]}`);
      }
      const { error } = await supabase.from("tournament_departments").delete().eq("id", departmentToDeleteId);
      if (error) throw error;
      toast.success("Team removed from tournament!");
      fetchDepartments();
    } catch (error: any) { toast.error(error.message); }
    setShowConfirmModal(false);
    setDepartmentToDeleteId(null);
  }

  async function handleImportTeams(sourceTournamentId: string) {
    if (!selectedTournament) return;
    
    const { data: sourceTeams, error: sourceError } = await supabase
      .from("tournament_departments")
      .select("department_id, name, abbreviation, image_url")
      .eq("tournament_id", sourceTournamentId);
      
    if (sourceError || !sourceTeams) {
      toast.error("Failed to fetch teams from source tournament.");
      return;
    }
    
    if (sourceTeams.length === 0) {
      toast.error("No teams found in the selected tournament.");
      return;
    }

    const { data: currentTeams } = await supabase
      .from("tournament_departments")
      .select("department_id")
      .eq("tournament_id", selectedTournament.id);
      
    const currentDeptIds = new Set(currentTeams?.map(t => t.department_id) || []);
    
    const newTeamsToInsert = sourceTeams
      .filter(team => !currentDeptIds.has(team.department_id))
      .map(team => ({
        ...team,
        tournament_id: selectedTournament.id
      }));
      
    if (newTeamsToInsert.length === 0) {
      toast.error("All teams from that tournament already exist here.");
      return;
    }
    
    const { error: insertError } = await supabase
      .from("tournament_departments")
      .insert(newTeamsToInsert);
      
    if (insertError) {
      toast.error(`Error importing teams: ${insertError.message}`);
    } else {
      toast.success(`Successfully imported ${newTeamsToInsert.length} teams!`);
      fetchDepartments();
    }
    setShowImportModal(false);
  }

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q) || d.courses?.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  return {
    departments,
    name,
    setName,
    courses,
    setCourses,
    editingId,
    setEditingId,
    logos,
    setLogos,
    uploading,
    showConfirmModal,
    setShowConfirmModal,
    departmentToDeleteId,
    setDepartmentToDeleteId,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    showImportModal,
    setShowImportModal,
    handleAddLogo,
    handleUpdateLogoUrl,
    handleRemoveLogo,
    handleAddEmptyLogo,
    handleAddOrUpdate,
    resetForm,
    handleConfirmDelete,
    handleImportTeams,
    filteredDepartments,
  };
};
