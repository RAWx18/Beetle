
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ContributorSpotlightProps {
  data: any[];
}

export const ContributorSpotlight: React.FC<ContributorSpotlightProps> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>Contributor Spotlight</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="login" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="contributions" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
