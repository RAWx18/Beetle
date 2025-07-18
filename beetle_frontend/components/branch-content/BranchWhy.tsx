import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Zap, Users, Database, GitBranch, Star, Link2, BookOpen, MessageCircle, Code, Edit2, Save, X } from 'lucide-react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ContentAPI, PageContent } from '@/lib/content-api';

const defaultBranchContent = {
  dev: {
    color: 'text-blue-600',
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
  },
  agents: {
    color: 'text-emerald-600',
    gradient: 'from-emerald-600 via-emerald-500 to-blue-400',
  },
  snowflake: {
    color: 'text-cyan-600',
    gradient: 'from-cyan-600 via-blue-400 to-emerald-400',
  }
};

const iconMap = {
  Shield: Shield,
  Zap: Zap,
  Users: Users,
  Database: Database,
  GitBranch: GitBranch,
  Star: Star,
  Link2: Link2,
  BookOpen: BookOpen,
  MessageCircle: MessageCircle,
  Code: Code,
};

const getIconComponent = (iconName: string) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || Code;
  return IconComponent;
};

export const BranchWhy = () => {
  const { selectedBranch } = useBranch();
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

  // Get branch styling
  const getBranchStyle = (branch: string) => {
    if (defaultBranchContent[branch as keyof typeof defaultBranchContent]) {
      return defaultBranchContent[branch as keyof typeof defaultBranchContent];
    }
    return {
      color: 'text-gray-600',
      gradient: 'from-gray-600 via-gray-500 to-gray-400',
    };
  };

  const branchStyle = getBranchStyle(selectedBranch);

  // Load content and check ownership
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const [contentResponse, ownershipCheck] = await Promise.all([
          ContentAPI.getPageContent(projectId, 'why'),
          user ? ContentAPI.isProjectOwner(projectId) : Promise.resolve(false)
        ]);
        
        setContent(contentResponse.content);
        setIsOwner(ownershipCheck);
      } catch (error) {
        console.error('Error loading content:', error);
        // Set default content if loading fails
        setContent({
          title: `Why ${projectName} ${selectedBranch} Branch?`,
          description: `The ${selectedBranch} branch focuses on specific features and improvements for ${projectName}.`,
          sections: [
            {
              title: 'Innovation',
              content: 'We embrace new technologies and methodologies to deliver excellence.',
              icon: 'Zap'
            },
            {
              title: 'Quality',
              content: 'Maintains high code quality and follows best practices.',
              icon: 'Shield'
            },
            {
              title: 'Collaboration',
              content: 'Team collaboration and code review processes.',
              icon: 'Users'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId !== 'unknown') {
      loadContent();
    }
  }, [projectId, selectedBranch, projectName, user]);

  const handleEdit = () => {
    setEditContent(JSON.parse(JSON.stringify(content)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editContent) return;
    
    try {
      setSaving(true);
      await ContentAPI.updatePageContent(projectId, 'why', editContent);
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

  const updateSection = (index: number, field: string, value: string) => {
    if (!editContent || !editContent.sections) return;
    const newSections = [...editContent.sections];
    newSections[index] = {
      ...newSections[index],
      [field]: value
    };
    setEditContent({
      ...editContent,
      sections: newSections
    });
  };

  const addSection = () => {
    if (!editContent) return;
    const newSections = [...(editContent.sections || [])];
    newSections.push({
      title: 'New Section',
      content: 'Description of this section.',
      icon: 'Code'
    });
    setEditContent({
      ...editContent,
      sections: newSections
    });
  };

  const removeSection = (index: number) => {
    if (!editContent || !editContent.sections) return;
    const newSections = editContent.sections.filter((_, i) => i !== index);
    setEditContent({
      ...editContent,
      sections: newSections
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  if (!content) {
    return <div className="text-center py-8">Failed to load content</div>;
  }

  return (
    <div className="space-y-12">
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

      {/* Hero Section */}
      <div className="text-center py-8">
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
              rows={3}
            />
          </div>
        ) : (
          <>
            <h1 className={`text-4xl md:text-6xl font-bold bg-gradient-to-r ${branchStyle.gradient} bg-clip-text text-transparent mb-4`}>
              {content.title}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {content.description}
            </p>
          </>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {content.sections?.map((section, i) => {
          const IconComponent = getIconComponent(section.icon || 'Code');
          return (
            <Card key={i} className="glass-panel relative">
              {isEditing && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeSection(i)}
                    className="w-6 h-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <IconComponent className={`w-6 h-6 ${branchStyle.color}`} />
                  <CardTitle className={branchStyle.color}>
                    {isEditing ? (
                      <Input
                        value={editContent?.sections?.[i]?.title || ''}
                        onChange={(e) => updateSection(i, 'title', e.target.value)}
                        className="font-bold"
                        placeholder="Section title"
                      />
                    ) : (
                      section.title
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent?.sections?.[i]?.content || ''}
                        onChange={(e) => updateSection(i, 'content', e.target.value)}
                        placeholder="Section content"
                        rows={3}
                      />
                      <select
                        value={editContent?.sections?.[i]?.icon || 'Code'}
                        onChange={(e) => updateSection(i, 'icon', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        {Object.keys(iconMap).map(iconName => (
                          <option key={iconName} value={iconName}>{iconName}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    section.content
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Section Button */}
      {isEditing && (
        <div className="text-center">
          <Button onClick={addSection} variant="outline">
            Add Section
          </Button>
        </div>
      )}
    </div>
  );
};