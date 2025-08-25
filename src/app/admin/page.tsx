"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Announcement {
  id: string;
  message: string;
  image_url?: string;
  active: boolean;
  start_time?: string;
  end_time?: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState("announcements");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  }

  async function uploadImage(file: File) {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("announcements").upload(fileName, file);
    if (error) throw error;

    const { data: publicUrl } = supabase.storage.from("announcements").getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }

  async function addAnnouncement() {
    let imageUrl = null;
    if (newImage) {
      imageUrl = await uploadImage(newImage);
    }

    await supabase.from("announcements").insert([
      {
        message: newMessage,
        image_url: imageUrl,
        active: true,
        start_time: newStart || new Date().toISOString(),
        end_time: newEnd || null,
      },
    ]);

    setNewMessage("");
    setNewImage(null);
    setNewStart("");
    setNewEnd("");
    fetchAnnouncements();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("announcements").update({ active: !current }).eq("id", id);
    fetchAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📢 Manage Announcements</h1>

      {/* Create New Announcement */}
      <div className="bg-gray-100 p-6 rounded-xl mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Announcement</h2>
        <input
          type="text"
          placeholder="Message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input type="file" onChange={(e) => setNewImage(e.target.files?.[0] || null)} className="mb-2" />
        <input
          type="datetime-local"
          value={newStart}
          onChange={(e) => setNewStart(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="datetime-local"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
        />
        <button 
          onClick={addAnnouncement}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Announcement
        </button>
      </div>

      {/* List of Announcements */}
      <h2 className="text-xl font-semibold mb-4">Current Announcements</h2>
      {announcements.map((a) => (
        <div key={a.id} className="flex items-center justify-between bg-white shadow p-4 rounded-lg mb-4">
          <div>
            <p className="font-bold">{a.message}</p>
            {a.image_url && <img src={a.image_url} alt="banner" className="h-16 mt-2 rounded" />}
            <p className="text-sm text-gray-500">
              {a.start_time} → {a.end_time || "No end"}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toggleActive(a.id, a.active)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              {a.active ? "Deactivate" : "Activate"}
            </button>
            <button 
              onClick={() => deleteAnnouncement(a.id)}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}