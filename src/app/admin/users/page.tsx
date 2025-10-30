import ManageUsersClient from "./ManageUsersClient";
import Breadcrumbs from "../../../components/Breadcrumbs";

export default function ManageUsersPage() {
  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <Breadcrumbs
        items={[
          { href: "/admin/dashboard", label: "Dashboard" },
          { label: "Manage Users" },
        ]}
      />

      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-bold text-monument-green mb-2 dark:text-green-400">
          👥 Manage Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create new accounts and assign roles securely.
        </p>
      </div>
      <ManageUsersClient />
    </div>
  );
}
