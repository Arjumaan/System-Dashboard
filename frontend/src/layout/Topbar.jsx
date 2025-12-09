import DarkModeToggle from "../components/DarkModeToggle";

export default function Topbar() {
  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow px-10 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold dark:text-white">System Analytics Overview</h2>
      <DarkModeToggle />
    </div>
  );
}
