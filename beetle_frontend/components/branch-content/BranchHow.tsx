import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, Code, Database, ExternalLink, Edit2, Save, X, Plus, Minus } from 'lucide-react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ContentAPI, PageContent } from '@/lib/content-api';

export const BranchHow = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();
  const { repository } = useRepository();
  const { user } = useAuth();
  const projectName = repository?.name || 'Project';
  const projectId = repository?.full_name || 'unknown';
  
  const [content, setContent] = useState<PageContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<PageContent | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load content and check ownership
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        
        // If no repository/project, show default content immediately
        if (projectId === 'unknown' || !repository) {
          setContent({
            title: `How ${projectName} Works`,
            description: 'Learn about the technical implementation and architecture.',
            setup: [
              'Clone the repository',
              'Install dependencies',
              'Configure environment variables',
              'Run the development server'
            ],
            workflow: [
              'Create feature branches',
              'Implement changes',
              'Write tests',
              'Submit pull requests'
            ]
          });
          setLoading(false);
          return;
        }
        
        const [contentResponse, ownershipCheck] = await Promise.all([
          ContentAPI.getPageContent(projectId, 'how'),
          user ? ContentAPI.isProjectOwner(projectId) : Promise.resolve(false)
        ]);
        
        setContent(contentResponse.content);
        setIsOwner(ownershipCheck);
      } catch (error) {
        console.error('Error loading content:', error);
        // Set default content if loading fails
        setContent({
          title: `How ${projectName} Works`,
          description: 'Learn about the technical implementation and architecture.',
          setup: [
            'Clone the repository',
            'Install dependencies',
            'Configure environment variables',
            'Run the development server'
          ],
          workflow: [
            'Create feature branches',
            'Implement changes',
            'Write tests',
            'Submit pull requests'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [projectId, selectedBranch, projectName, user, repository]);

  const handleEdit = () => {
    setEditContent(JSON.parse(JSON.stringify(content)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editContent) return;
    
    try {
      setSaving(true);
      await ContentAPI.updatePageContent(projectId, 'how', editContent);
      setContent(editContent);
      setIsEditing(false);
      setEditContent(null);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(null);
  };

  const updateEditContent = (field: string, value: any) => {
    if (!editContent) return;
    setEditContent({
      ...editContent,
      [field]: value
    });
  };

  const updateListItem = (listType: 'setup' | 'workflow', index: number, value: string) => {
    if (!editContent) return;
    const newList = [...(editContent[listType] || [])];
    newList[index] = value;
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  const addListItem = (listType: 'setup' | 'workflow') => {
    if (!editContent) return;
    const newList = [...(editContent[listType] || [])];
    newList.push('New step');
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  const removeListItem = (listType: 'setup' | 'workflow', index: number) => {
    if (!editContent) return;
    const newList = (editContent[listType] || []).filter((_, i) => i !== index);
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  if (!content) {
    return <div className="text-center py-8">Failed to load content</div>;
  }

  return (
    <div className="space-y-8">
      {/* Edit Controls */}
      {isOwner && (
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editContent?.title || ''}
              onChange={(e) => updateEditContent('title', e.target.value)}
              className="text-2xl font-bold text-center"
              placeholder="Page title"
            />
            <Textarea
              value={editContent?.description || ''}
              onChange={(e) => updateEditContent('description', e.target.value)}
              className="text-center"
              placeholder="Page description"
              rows={2}
            />
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            <p className="text-xl text-muted-foreground">{content.description}</p>
          </>
        )}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to get started with {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(content.setup || []).map((step, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editContent?.setup?.[index] || ''}
                        onChange={(e) => updateListItem('setup', index, e.target.value)}
                        placeholder="Setup step"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeListItem('setup', index)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">{step}</p>
                  )}
                </div>
              </div>
            ))}
            {isEditing && (
              <div className="flex justify-center">
                <Button
                  onClick={() => addListItem('setup')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Development Workflow
          </CardTitle>
          <CardDescription>
            How to contribute to {projectName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(content.workflow || []).map((step, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editContent?.workflow?.[index] || ''}
                        onChange={(e) => updateListItem('workflow', index, e.target.value)}
                        placeholder="Workflow step"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeListItem('workflow', index)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">{step}</p>
                  )}
                </div>
              </div>
            ))}
            {isEditing && (
              <div className="flex justify-center">
                <Button
                  onClick={() => addListItem('workflow')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Documentation
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              GitHub Repository
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};