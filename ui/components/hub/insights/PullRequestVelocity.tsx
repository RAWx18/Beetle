
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PullRequestVelocityProps {
  data: any[];
}

export const PullRequestVelocity: React.FC<PullRequestVelocityProps> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>Pull Request Velocity</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="opened" stroke="#8884d8" />
          <Line type="monotone" dataKey="closed" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
