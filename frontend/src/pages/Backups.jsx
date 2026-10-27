import { useEffect } from "react";
import Topbar from "../components/Topbar";
import { useApp } from "../context/AppContext";

export default function Backups() {
  const {
    backups,
    loadBackups,
    createBackup,
    downloadBackup,
    deleteBackup,
    restoreBackup,
  } = useApp();

  useEffect(() => {
    loadBackups();
  }, []);

  async function handleCreate() {
    try {
      await createBackup();

      alert("Backup Created Successfully");
    } catch (err) {
      console.error(err);

      alert("Backup Failed");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this backup?")) return;

    try {
      await deleteBackup(id);
    } catch (err) {
      console.error(err);

      alert("Delete failed");
    }
  }

  async function handleRestore(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!window.confirm("Current data will be replaced.\nContinue?")) {
      return;
    }

    try {
      const fd = new FormData();

      fd.append("backup", file);

      await restoreBackup(fd);

      alert("Backup Restored Successfully");
    } catch (err) {
      console.error(err);

      alert("Restore Failed");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <input
        id="restoreFile"
        type="file"
        accept=".zip"
        hidden
        onChange={handleRestore}
      />

      <Topbar
        title="Backup & Restore"
        action={
          <>
            <button
              onClick={() => document.getElementById("restoreFile").click()}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg mr-3"
            >
              Restore Backup
            </button>

            <button
              onClick={handleCreate}
              className="bg-[#1e3a8a] hover:bg-[#7b73ff] text-white px-5 py-2 rounded-lg"
            >
              + Create Backup
            </button>
          </>
        }
      />
      <div className="p-6">
        <div className="bg-white border border-[#e2e8f0] rounded-xl">
          <div className="p-5 border-b border-[#e2e8f0]">
            <h2 className="text-[#1e293b] text-xl font-semibold">
              Available Backups
            </h2>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left text-[#64748b] border-b border-[#e2e8f0]">
                <th className="p-4">Filename</th>

                <th>Size</th>

                <th>Date</th>

                <th>Status</th>

                <th className="text-right pr-5">Actions</th>
              </tr>
            </thead>

            <tbody>
              {backups.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#64748b]">
                    No Backup Found
                  </td>
                </tr>
              )}

              {backups.map((backup) => (
                <tr
                  key={backup.id}
                  className="border-b border-[#e2e8f0] hover:bg-[#f1f5f9]"
                >
                  <td className="p-4 text-[#1e293b]">{backup.filename}</td>

                  <td className="text-[#1e293b] font-medium">
                    {(backup.file_size / 1024 / 1024).toFixed(2)} MB
                  </td>

                  <td className="text-[#1e293b] font-medium">
                    {new Date(backup.created_at).toLocaleString()}
                  </td>

                  <td>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      {backup.status}
                    </span>
                  </td>

                  <td className="text-right pr-5">
                    <button
                      onClick={() => downloadBackup(backup.id)}
                      className="mr-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    >
                      Download
                    </button>

                    <button
                      onClick={() => handleDelete(backup.id)}
                      className="px-3 py-1 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium transition-colors"
                    >
                      Delete
                    </button>
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
