"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';
import ConfirmModal from '../../../../components/ConfirmModal';
import Breadcrumbs from "../../../../components/Breadcrumbs";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";

interface Result {
  id: string;
  event_id: string;
  department_id: string;
  medal_type: string;
  points: number;
  events: { name: string; icon: string | null } | null; // Joined from events table
  departments: { name: string; image_url: string | null; abbreviation: string | null } | null; // Joined from departments table
}

export default function ManageResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultToDeleteId, setResultToDeleteId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("results")
      .select(`
        id,
        event_id,
        department_id,
        medal_type,
        points,
        events!fk_results_event (name, icon),
        departments!fk_results_department (name, image_url, abbreviation)
      `)
      .order("id", { ascending: false }); // Order by ID for consistent display

    if (error) {
      console.error("Error fetching results:", JSON.stringify(error, null, 2));
      setMessage("Error fetching results.");
    } else {
      // Supabase returns joined tables as single objects if the relationship is one-to-one.
      // We cast to `any` first then to `Result[]` to satisfy TypeScript.
      // This is safe because we know the shape of the data from the query.
      setResults(data as unknown as Result[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

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

  return (
    <div className="max-w-4xl mx-auto mt-10 dark:text-gray-200">
      <Breadcrumbs items={[{ href: '/admin/dashboard', label: 'Dashboard' }, { label: 'Manage Results' }]} />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-monument-green dark:text-green-400">📊 Manage Results</h1>
        <Link href="/admin/results" className="btn btn-primary dark:text-white">
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

      {loading ? (
        <div className="flex flex-col justify-center items-center p-10">
          <BouncingBallsLoader />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Fetching results...</p>
        </div>
      ) : results.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg dark:bg-gray-800">
            <p className="text-gray-500 text-lg">No results recorded yet.</p>
            <Link href="/admin/results" className="mt-4 inline-block btn btn-primary dark:text-white">
              Add your first result
            </Link>
          </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto dark:bg-gray-800">
          <table className="min-w-full">
            <thead className="table-header dark:bg-gray-700">
              <tr>
                <th className="table-cell text-left dark:text-gray-300">Event</th>
                <th className="table-cell text-left dark:text-gray-300">Department</th>

                <th className="table-cell text-left dark:text-gray-300">Medal</th>
                <th className="table-cell text-left dark:text-gray-300">Points</th>
                <th className="table-cell text-center dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{result.events?.icon || '🏅'}</span>
                      <span>{result.events?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      {result.departments?.image_url ? (
                        <Image
                          src={result.departments.image_url}
                          alt={result.departments.name || 'Department'}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 dark:bg-gray-600 dark:text-gray-300">{result.departments?.name?.substring(0, 2) || '??'}</div>
                      )}
                      <span title={result.departments?.name || ''}>{result.departments?.abbreviation || result.departments?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.medal_type === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      result.medal_type === 'silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                    }`}>
                      {result.medal_type.charAt(0).toUpperCase() + result.medal_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{result.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex gap-2 justify-center">
                      <Link href={`/admin/results/edit/${result.id}`} className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-1 px-3 rounded text-sm no-underline transition-colors">
                        ✏️ Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(result.id)}
                        className="btn-danger py-1 px-3 text-sm rounded"
                      >
                        🗑️ Delete
                      </button>
                    </div>
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