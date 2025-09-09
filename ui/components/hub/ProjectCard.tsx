
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  name: string;
  description: string;
  lastActivity: string;
  language: string;
}

export function ProjectCard({ name, description, lastActivity, language }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
          {language}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {lastActivity}
        </div>
        <Button variant="outline" size="sm">View</Button>
      </CardFooter>
    </Card>
  );
}
