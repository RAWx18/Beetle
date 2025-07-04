
import React from 'react';
import { Upload, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ImportBranch = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Upload className="h-5 w-5 text-teal-500" />
        <h3 className="text-lg font-semibold">Import Branch</h3>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Import External Branch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Repository URL</label>
            <Input placeholder="https://github.com/user/repo.git" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Branch Name</label>
            <Input placeholder="feature/new-feature" className="mt-1" />
          </div>
          <Button className="w-full">
            Import Branch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportBranch;
