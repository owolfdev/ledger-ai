"use client";
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { BiLoaderAlt } from "react-icons/bi";
import {
  countLikes,
  addLike,
  removeLike,
  isPostLikedByUser,
} from "@/app/actions/like-actions";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  postId: string;
}

function LikeButton({ postId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [likeActionInProgress, setLikeActionInProgress] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const fetchUserId = async () => {
      let storedUserId = localStorage.getItem("userIdForOWolf");
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem("userIdForOWolf", storedUserId);
      }
      setUserId(storedUserId);
    };

    fetchUserId();
    fetchTotalLikes();
  }, [postId]);

  useEffect(() => {
    if (userId) {
      checkIfLikedByUser();
    }
  }, [userId]);

  async function fetchTotalLikes() {
    try {
      const response = await countLikes(postId);
      setTotalLikes(
        response.success && typeof response.count === "number"
          ? response.count
          : 0
      );
    } catch (error) {
      console.error("Failed to fetch likes:", error);
      setTotalLikes(0);
    } finally {
      setLoading(false);
    }
  }

  async function checkIfLikedByUser() {
    try {
      const response = await isPostLikedByUser(postId, userId as string);
      if (response.success) {
        setLiked(response.liked);
      }
    } catch (error) {
      console.error("Failed to check if post is liked by user:", error);
    }
  }

  async function handleLikeAction() {
    if (userId && !likeActionInProgress) {
      setLikeActionInProgress(true);
      try {
        const response = await addLike(postId, userId);
        if (response.success) {
          setLiked(true);
          setTotalLikes((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Error liking the post:", error);
      }
      setLikeActionInProgress(false);
    }
  }

  async function handleUnlikeAction() {
    if (userId && !likeActionInProgress) {
      setLikeActionInProgress(true);
      try {
        const response = await removeLike(postId, userId);
        if (response.success) {
          setLiked(false);
          setTotalLikes((prev) => prev - 1);
        }
      } catch (error) {
        console.error("Error unliking the post:", error);
      }
      setLikeActionInProgress(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div className="py-8 relative flex flex-col gap-2">
      <hr className="pb-8" />
      <div>Total Likes: {totalLikes}</div>
      <div className="relative">
        <Button
          onClick={() => {
            if (liked) {
              handleUnlikeAction();
            } else {
              handleLikeAction();
            }
          }}
          className={`bg-primary text-primary-foreground font-bold py-2 px-4 rounded flex items-center gap-2 relative overflow-hidden ${
            liked ? "liked" : "unliked"
          } hover:bg-primary/80 active:scale-95 disabled:opacity-50`}
          disabled={likeActionInProgress}
          aria-label={liked ? "Unlike this post" : "Like this post"}
        >
          <div
            className={`like-icon ${liked ? "animate-like" : "animate-unlike"}`}
          >
            {liked ? (
              <AiFillLike className="text-4xl" />
            ) : (
              <AiOutlineLike className="text-4xl" />
            )}
          </div>
          {likeActionInProgress ? (
            <BiLoaderAlt className="animate-spin text-lg" /> // Spinner for both liking and unliking
          ) : liked ? (
            "Liked"
          ) : (
            "Like"
          )}
        </Button>
        {/* <div>{postId}</div> */}
      </div>
    </div>
  );
}

export default LikeButton;
