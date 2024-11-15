// src/components/LogHistory.jsx
import React, { useState } from 'react';

const LogHistory = ({ logs }) => {
  return (
    <div className="max-h-64 flex-1 overflow-y-auto border border-gray-300 rounded-md p-4 bg-gray-50">
      {logs.length > 0 ? (
        logs.map((log, index) => <LogItem key={index} log={log} />)
      ) : (
        <p className="text-gray-500">No updates yet</p>
      )}
    </div>
  );
};

const LogItem = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="mb-2 border-b border-gray-300 pb-2">
      <div
        onClick={toggleExpand}
        className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded"
      >
        <span className="text-sm text-gray-500">
          {log.timestamp.toLocaleString()}
        </span>
        <pre className="text-sm text-blue-600 ml-4 overflow-hidden">
          {JSON.stringify(log.update)}
        </pre>
      </div>
      {expanded && (
        <div className="bg-gray-100 p-2 mt-2 rounded">
          <pre className="text-sm text-gray-700">
            {JSON.stringify(log.update, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default LogHistory;
