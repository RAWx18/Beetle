"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import ProjectRoadmap from '@/components/ProjectRoadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/types';
import { Mail, Save, X, Plus, ExternalLink, GitBranch, Loader2, MapPin, Building, Globe, Twitter } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useAuth } from '@/contexts/AuthContext';
import GitHubAPI from '@/lib/github-api';
import { toast } from 'sonner';

const initialProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  description: 'AI researcher and knowledge management enthusiast. Building a digital second brain to enhance creativity and productivity.',
  links: [
    { title: 'Personal Website', url: 'https://example.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Twitter', url: 'https://twitter.com' },
  ],
};

const Profile = () => {
  const showContent = useAnimateIn(false, 300);
  const { selectedBranch, getBranchInfo } = useBranch();
  const { repository } = useRepository();
  const { user, token, isAuthenticated } = useAuth();
  const branchInfo = getBranchInfo();
  const projectName = repository?.name || 'Project';
  
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(initialProfile);
  const [tempLink, setTempLink] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user profile from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const githubAPI = new GitHubAPI(token);
        const userData = await githubAPI.getCurrentUserProfile();
        
        // Convert backend user data to UserProfile format
        const userProfile: UserProfile = {
          name: userData.name || userData.login || 'Unknown User',
          email: userData.email || '',
          avatar: userData.avatar_url,
          description: userData.bio || '',
          links: []
        };

        // Add social links if available
        if (userData.blog) {
          userProfile.links?.push({ title: 'Website', url: userData.blog });
        }
        if (userData.twitter_username) {
          userProfile.links?.push({ title: 'Twitter', url: `https://twitter.com/${userData.twitter_username}` });
        }
        if (userData.login) {
          userProfile.links?.push({ title: 'GitHub', url: `https://github.com/${userData.login}` });
        }

        setProfile(userProfile);
        setTempProfile(userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
        
        // Fallback to user data from AuthContext
        if (user) {
          const fallbackProfile: UserProfile = {
            name: user.name || user.login || 'Unknown User',
            email: user.email || '',
            avatar: user.avatar_url,
            description: user.bio || '',
            links: []
          };

          if (user.blog) {
            fallbackProfile.links?.push({ title: 'Website', url: user.blog });
          }
          if (user.twitter_username) {
            fallbackProfile.links?.push({ title: 'Twitter', url: `https://twitter.com/${user.twitter_username}` });
          }
          if (user.login) {
            fallbackProfile.links?.push({ title: 'GitHub', url: `https://github.com/${user.login}` });
          }

          setProfile(fallbackProfile);
          setTempProfile(fallbackProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, token, user]);
  
  const handleEditProfile = () => {
    setTempProfile({...profile});
    setIsEditing(true);
  };
  
  const handleSaveProfile = async () => {
    if (!isAuthenticated || !token) {
      toast.error('You must be logged in to save your profile');
      return;
    }

    try {
      setSaving(true);
      const githubAPI = new GitHubAPI(token);
      
      // Prepare data for backend update
      const updateData: any = {};
      if (tempProfile.name !== profile.name) updateData.name = tempProfile.name;
      if (tempProfile.description !== profile.description) updateData.bio = tempProfile.description;
      
      // Update profile on backend
      await githubAPI.updateCurrentUserProfile(updateData);

      setProfile({...tempProfile});
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleAddLink = () => {
    if (tempLink.title && tempLink.url) {
      setTempProfile({
        ...tempProfile,
        links: [...(tempProfile.links || []), tempLink]
      });
      setTempLink({ title: '', url: '' });
    }
  };
  
  const handleRemoveLink = (index: number) => {
    const newLinks = [...(tempProfile.links || [])];
    newLinks.splice(index, 1);
    setTempProfile({
      ...tempProfile,
      links: newLinks
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-10 pb-16 h-screen">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="h-full overflow-y-auto">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile and contributions for {projectName}
            </p>
          </div>
          
          {loading ? (
            <Card className="w-full mb-8">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ) : !isEditing ? (
            <Card className="w-full mb-8">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-light">{profile.name.charAt(0)}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {profile.name}
                    {user?.login && (
                      <span className="text-sm text-muted-foreground font-normal">
                        @{user.login}
                      </span>
                    )}
                  </CardTitle>
                  
                  {profile.description && (
                    <CardDescription className="mt-2">
                      {profile.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {user?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </div>
                    )}
                    {user?.company && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {user.company}
                      </div>
                    )}
                    {user?.public_repos && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {user.public_repos} repos
                      </div>
                    )}
                  </div>
                  
                  {profile.email && (
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      {profile.email}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  {profile.links && profile.links.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {profile.links.map((link, index) => (
                        <a 
                          key={index} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          {link.title}
                          <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditProfile}
                    className="self-end"
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Card className="w-full mb-8">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={tempProfile.description || ''}
                    onChange={(e) => setTempProfile({...tempProfile, description: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Links</Label>
                  <div className="rounded-md border">
                    <div className="space-y-2 p-4">
                      {tempProfile.links?.map((link, index) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                          <div className="flex-1 truncate">
                            <span className="font-medium">{link.title}</span>: {link.url}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="linkTitle">Link Title</Label>
                    <Input 
                      id="linkTitle" 
                      value={tempLink.title}
                      onChange={(e) => setTempLink({...tempLink, title: e.target.value})}
                      placeholder="GitHub"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="linkUrl">URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="linkUrl" 
                        value={tempLink.url}
                        onChange={(e) => setTempLink({...tempLink, url: e.target.value})}
                        placeholder="https://github.com/username"
                      />
                      <Button onClick={handleAddLink}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* User Statistics */}
          {user?.analytics && (
            <Card className="w-full mb-8">
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
                <CardDescription>
                  Overview of your GitHub activity and contributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{user.analytics.totalCommits}</div>
                    <div className="text-sm text-muted-foreground">Total Commits</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{user.analytics.totalPRs}</div>
                    <div className="text-sm text-muted-foreground">Pull Requests</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{user.analytics.totalIssues}</div>
                    <div className="text-sm text-muted-foreground">Issues</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{user.analytics.activeRepositories}</div>
                    <div className="text-sm text-muted-foreground">Active Repos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Project Roadmap</h1>
            <p className="text-muted-foreground mt-2">
              Track your project journey from start to completion and collect reviews
            </p>
          </div>
          
          <ProjectRoadmap />
        </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Profile;
