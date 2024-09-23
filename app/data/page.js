"use client";
import { useState, useEffect } from 'react';

export default function DataPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/applications'); // Fetch data from the API route
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data: {error}</div>;

  return (
    <div>
      <h1>Approved Arrangements from Supabase</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
