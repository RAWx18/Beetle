import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Github, Code, BookOpen, Users, Star, GitPullRequest, Edit2, Save, X, Plus, Minus } from 'lucide-react';
import { useRepository } from '@/contexts/RepositoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ContentAPI, PageContent } from '@/lib/content-api';

export const BranchContribute = () => {
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
            title: `How to Contribute to ${projectName}`,
            description: 'Join our community and help improve the project.',
            quickStart: [
              'Fork the repository',
              'Pick an issue to work on',
              'Follow our contribution guidelines',
              'Submit a pull request'
            ],
            areas: [
              {
                title: 'Development',
                description: 'Help build new features and fix bugs',
                skills: ['JavaScript', 'TypeScript', 'React']
              },
              {
                title: 'Documentation',
                description: 'Improve project documentation and guides',
                skills: ['Technical Writing', 'Markdown']
              },
              {
                title: 'Testing',
                description: 'Write tests and improve code quality',
                skills: ['Jest', 'Testing Library', 'Quality Assurance']
              }
            ]
          });
          setLoading(false);
          return;
        }
        
        const [contentResponse, ownershipCheck] = await Promise.all([
          ContentAPI.getPageContent(projectId, 'contribute'),
          user ? ContentAPI.isProjectOwner(projectId) : Promise.resolve(false)
        ]);
        
        setContent(contentResponse.content);
        setIsOwner(ownershipCheck);
      } catch (error) {
        console.error('Error loading content:', error);
        // Set default content if loading fails
        setContent({
          title: `How to Contribute to ${projectName}`,
          description: 'Join our community and help improve the project.',
          quickStart: [
            'Fork the repository',
            'Pick an issue to work on',
            'Follow our contribution guidelines',
            'Submit a pull request'
          ],
          areas: [
            {
              title: 'Development',
              description: 'Help build new features and fix bugs',
              skills: ['JavaScript', 'TypeScript', 'React']
            },
            {
              title: 'Documentation',
              description: 'Improve project documentation and guides',
              skills: ['Technical Writing', 'Markdown']
            },
            {
              title: 'Testing',
              description: 'Write tests and improve code quality',
              skills: ['Jest', 'Testing Library', 'Quality Assurance']
            }
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
      await ContentAPI.updatePageContent(projectId, 'contribute', editContent);
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

  const updateListItem = (listType: 'quickStart', index: number, value: string) => {
    if (!editContent) return;
    const newList = [...(editContent[listType] || [])];
    newList[index] = value;
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  const addListItem = (listType: 'quickStart') => {
    if (!editContent) return;
    const newList = [...(editContent[listType] || [])];
    newList.push('New step');
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  const removeListItem = (listType: 'quickStart', index: number) => {
    if (!editContent) return;
    const newList = (editContent[listType] || []).filter((_, i) => i !== index);
    setEditContent({
      ...editContent,
      [listType]: newList
    });
  };

  const updateArea = (index: number, field: string, value: any) => {
    if (!editContent || !editContent.areas) return;
    const newAreas = [...editContent.areas];
    newAreas[index] = {
      ...newAreas[index],
      [field]: value
    };
    setEditContent({
      ...editContent,
      areas: newAreas
    });
  };

  const addArea = () => {
    if (!editContent) return;
    const newAreas = [...(editContent.areas || [])];
    newAreas.push({
      title: 'New Area',
      description: 'Description of this contribution area.',
      skills: ['Skill 1', 'Skill 2']
    });
    setEditContent({
      ...editContent,
      areas: newAreas
    });
  };

  const removeArea = (index: number) => {
    if (!editContent || !editContent.areas) return;
    const newAreas = editContent.areas.filter((_, i) => i !== index);
    setEditContent({
      ...editContent,
      areas: newAreas
    });
  };

  const updateSkill = (areaIndex: number, skillIndex: number, value: string) => {
    if (!editContent || !editContent.areas) return;
    const newAreas = [...editContent.areas];
    const newSkills = [...(newAreas[areaIndex].skills || [])];
    newSkills[skillIndex] = value;
    newAreas[areaIndex] = {
      ...newAreas[areaIndex],
      skills: newSkills
    };
    setEditContent({
      ...editContent,
      areas: newAreas
    });
  };

  const addSkill = (areaIndex: number) => {
    if (!editContent || !editContent.areas) return;
    const newAreas = [...editContent.areas];
    const newSkills = [...(newAreas[areaIndex].skills || [])];
    newSkills.push('New Skill');
    newAreas[areaIndex] = {
      ...newAreas[areaIndex],
      skills: newSkills
    };
    setEditContent({
      ...editContent,
      areas: newAreas
    });
  };

  const removeSkill = (areaIndex: number, skillIndex: number) => {
    if (!editContent || !editContent.areas) return;
    const newAreas = [...editContent.areas];
    const newSkills = (newAreas[areaIndex].skills || []).filter((_, i) => i !== skillIndex);
    newAreas[areaIndex] = {
      ...newAreas[areaIndex],
      skills: newSkills
    };
    setEditContent({
      ...editContent,
      areas: newAreas
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

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started contributing to {projectName} in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(content.quickStart || []).map((step, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={editContent?.quickStart?.[index] || ''}
                        onChange={(e) => updateListItem('quickStart', index, e.target.value)}
                        placeholder="Quick start step"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeListItem('quickStart', index)}
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
                  onClick={() => addListItem('quickStart')}
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

      {/* Contribution Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(content.areas || []).map((area, index) => (
          <Card key={index} className="relative">
            {isEditing && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeArea(index)}
                  className="w-6 h-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">
                {isEditing ? (
                  <Input
                    value={editContent?.areas?.[index]?.title || ''}
                    onChange={(e) => updateArea(index, 'title', e.target.value)}
                    placeholder="Area title"
                    className="font-bold"
                  />
                ) : (
                  area.title
                )}
              </CardTitle>
              <CardDescription>
                {isEditing ? (
                  <Textarea
                    value={editContent?.areas?.[index]?.description || ''}
                    onChange={(e) => updateArea(index, 'description', e.target.value)}
                    placeholder="Area description"
                    rows={3}
                  />
                ) : (
                  area.description
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {(area.skills || []).map((skill, skillIndex) => (
                    <div key={skillIndex} className="flex items-center gap-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editContent?.areas?.[index]?.skills?.[skillIndex] || ''}
                            onChange={(e) => updateSkill(index, skillIndex, e.target.value)}
                            placeholder="Skill"
                            className="w-20 h-6 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSkill(index, skillIndex)}
                            className="w-4 h-4 p-0"
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                          {skill}
                        </span>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <Button
                      onClick={() => addSkill(index)}
                      variant="outline"
                      size="sm"
                      className="w-6 h-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Area Button */}
      {isEditing && (
        <div className="text-center">
          <Button onClick={addArea} variant="outline">
            Add Contribution Area
          </Button>
        </div>
      )}

      {/* Call to Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join Our Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Documentation
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Star Repository
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};