import React, { useState } from "react";
import { Input } from "antd";

const YouTubeSearchRedirect = () => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query);
    window.open(`https://www.youtube.com/results?search_query=${encoded}`, "_blank");
  };

  return (
    <Input.Search
      placeholder="Buscar no YouTube"
      enterButton="Buscar"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onSearch={handleSearch}
      style={{ marginBottom: 16 }}
    />
  );
};

export default YouTubeSearchRedirect;