import Breadcrumbs from "./Breadcrumbs";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 animate-pulse">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "📊 Dashboard" },
          { label: "Manage Users" },
        ]}
      />
      <div className="mb-8">
        <div className="h-10 bg-gray-300 rounded-md dark:bg-gray-600 w-72 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-96"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-monument-green to-green-600 dark:from-green-700 dark:to-green-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-full dark:bg-gray-700 w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-10 bg-gray-200 rounded-md dark:bg-gray-700 w-full"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}