"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticsCard } from "@/components/hub/AnalyticsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HubAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    if (token) {
      fetch("/api/v1/hub/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setAnalytics(data);
        });

      fetch("/api/v1/analytics/ai-insights", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setAiInsights(data.insights);
        });
    }
  }, [token]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <HubHeader
        title="Analytics"
        subtitle="Deep dive into your project analytics."
      />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analytics && (
          <>
            <AnalyticsCard title="Total Commits" value={analytics.totalCommits} />
            <AnalyticsCard title="Lines of Code" value={analytics.linesOfCode} />
            <AnalyticsCard title="Active Projects" value={analytics.activeProjects} />
          </>
        )}
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {aiInsights && (
              <ul className="space-y-2">
                {Object.entries(aiInsights).map(([key, value]) => (
                  <li key={key} className="text-sm">
                    <span className="font-semibold">{key.replace(/_/g, ' ')}: </span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}