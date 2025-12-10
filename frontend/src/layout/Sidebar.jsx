// frontend/src/layout/Sidebar.jsx
import {
  ChartBarIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  ServerIcon,
  DocumentTextIcon,
  Bars3Icon,
  ArrowPathIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline";
import classNames from "classnames";

export default function Sidebar({ selected, setSelected, collapsed, setCollapsed }) {
  
  const menu = [
    { name: "Dashboard", icon: ChartBarIcon },
    { name: "Task Manager", icon: ListBulletIcon },
    { name: "Process Tree", icon: ComputerDesktopIcon },
    { name: "Live Logs", icon: ArrowPathIcon },
    { name: "Registry", icon: Cog6ToothIcon },
    { name: "Event Viewer", icon: ServerIcon },
    { name: "Disk & Network", icon: DocumentTextIcon },
    { name: "Report", icon: DocumentTextIcon }
  ];

  return (
    <div
      className={classNames(
        "h-screen fixed top-0 left-0 p-4 bg-white dark:bg-gray-900 shadow-xl border-r dark:border-gray-800 transition-all duration-300",
        {
          "w-20": collapsed,
          "w-64": !collapsed
        }
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        {!collapsed && (
          <div className="text-xl font-bold whitespace-nowrap dark:text-white">
            System Dashboard
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Bars3Icon className="h-6 w-6 dark:text-gray-200" />
        </button>
      </div>

      {/* Menu Items */}
      <div className="mt-8 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = selected === item.name;

          return (
            <button
              key={item.name}
              onClick={() => setSelected(item.name)}
              className={classNames(
                "flex items-center w-full p-3 rounded-lg transition",
                {
                  "bg-blue-600 text-white shadow-md": active,
                  "hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200":
                    !active
                }
              )}
            >
              <Icon
                className={classNames("h-5 w-5", {
                  "mr-0": collapsed,
                  "mr-3": !collapsed
                })}
              />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
