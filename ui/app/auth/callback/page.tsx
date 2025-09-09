"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUserFromCallback } = useAuth();

  useEffect(() => {
    const authToken = searchParams.get("auth_token");
    const authUser = searchParams.get("auth_user");

    if (authToken && authUser) {
      // For now, we'll just log the user data.
      // In a real app, you'd fetch the full user profile here.
      const user = {
        login: authUser,
        id: 0,
        name: "",
        email: "",
        avatar_url: "",
        bio: "",
        location: "",
        company: "",
        blog: "",
        twitter_username: "",
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: "",
        lastLogin: ""
      };
      setUserFromCallback(user, authToken);
      router.push("/hub/overview");
    }
  }, [searchParams, router, setUserFromCallback]);

  return <div>Loading...</div>;
}