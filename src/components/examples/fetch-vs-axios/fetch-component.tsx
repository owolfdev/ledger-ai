"use client";
import { useEffect, useState } from "react";

const FetchComponent = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state added

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/posts"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setPosts(data);
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

    fetchPosts();
  }, []);

  return (
    <div className="mb-4 p-4 border rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Fetch Demo</h2>
      <p className="text-gray-600 mb-4">
        <strong>Key Features:</strong>
        <ul className="list-disc ml-6">
          <li>Built-in JavaScript function, no external library required.</li>
          <li>Manual JSON parsing and error handling needed.</li>
          <li>Limited advanced features without custom implementations.</li>
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

export default FetchComponent;
