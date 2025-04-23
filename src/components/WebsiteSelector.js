// src/components/WebsiteSelector.js
import React from 'react';

const WebsiteSelector = ({ selectedWebsite, setSelectedWebsite, websites }) => {
  return (
    <div className="ml-4">
      <select
        value={selectedWebsite}
        onChange={(e) => setSelectedWebsite(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {websites.map(website => (
          <option key={website.id} value={website.id}>
            {website.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WebsiteSelector;