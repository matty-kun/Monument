"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../../components/ConfirmModal';

interface Result {
  id: string;
  event_id: string;
  department_id: string;
  medal_type: string;
  points: number;
  events: { name: string }; // Joined from events table
  departments: { name: string }; // Joined from departments table
}

export default function ManageResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultToDeleteId, setResultToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    setLoading(true);
    const { data, error } = await supabase
      .from("results")
      .select(`
        id,
        event_id,
        department_id,
        medal_type,
        points,
        events!fk_results_event (name),
        departments!fk_results_department (name)
      `)
      .order("id", { ascending: false }); // Order by ID for consistent display

    if (error) {
      console.error("Error fetching results:", JSON.stringify(error, null, 2));
      setMessage("Error fetching results.");
    } else {
      setResults(data as Result[]);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setResultToDeleteId(id);
    setShowConfirmModal(true);
  }

  async function handleConfirmDelete() {
    if (!resultToDeleteId) return;

    const { error } = await supabase.from("results").delete().eq("id", resultToDeleteId);

    if (error) {
      toast.error("Error deleting result.");
    } else {
      toast.success("Result deleted successfully!");
      fetchResults(); // Refresh the list
    }
    setShowConfirmModal(false);
    setResultToDeleteId(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 text-center">
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-monument-green">📊 Manage Results</h1>
        <Link href="/admin/results" className="btn btn-primary">
          ➕ Add New Result
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-center ${
          message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <p className="text-gray-500 text-lg">No results recorded yet.</p>
          <Link href="/admin/results" className="mt-4 inline-block btn btn-primary">
            Add your first result
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Medal</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.events.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.departments.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.medal_type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      result.medal_type === 'silver' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {result.medal_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/results/edit/${result.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(result.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this result entry? This action cannot be undone."
      />
    <Toaster />
    </div>
  );
}