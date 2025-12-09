import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function Registry() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/registry")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Registry Viewer</h1>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height={20} />
          <LoadingSkeleton height={20} />
          <LoadingSkeleton height={20} />
          <LoadingSkeleton height={20} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow divide-y dark:divide-gray-700">
          {data.map((item) => (
            <div key={item.name} className="py-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {item.name}
              </p>
              <p className="text-lg dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
