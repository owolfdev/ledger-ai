// pages/axios-demo.js
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const AxiosComponent = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state added

  useEffect(() => {
    const fetchPostsWithAxios = async () => {
      try {
        const response = await axios.get(
          "https://jsonplaceholder.typicode.com/posts"
        );
        setPosts(response.data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false); // Stop loading once the request is complete
      }
    };

    fetchPostsWithAxios();
  }, []);

  return (
    <div className="mb-4 p-4 border rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Axios Demo</h2>
      <p className="text-gray-600 mb-4">
        <strong>Key Features:</strong>
        <ul className="list-disc ml-6">
          <li>Automatic JSON parsing—data is ready to use.</li>
          <li>Built-in error handling for non-2xx status codes.</li>
          <li>Supports advanced features like timeouts and interceptors.</li>
        </ul>
      </p>
      {loading ? (
        <p>Loading posts...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <ul className="list-disc ml-6">
          {posts.map((post: { id: number; title: string }) => (
            <li key={post.id}>{JSON.stringify(post)}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AxiosComponent;
