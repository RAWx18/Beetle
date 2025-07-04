"use client";

import React, { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import ProjectRoadmap from '@/components/ProjectRoadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/types';
import { Mail, Save, X, Plus, ExternalLink } from 'lucide-react';

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
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(initialProfile);
  const [tempLink, setTempLink] = useState({ title: '', url: '' });
  
  const handleEditProfile = () => {
    setTempProfile({...profile});
    setIsEditing(true);
  };
  
  const handleSaveProfile = () => {
    setProfile({...tempProfile});
    setIsEditing(false);
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
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="mb-8">
          {!isEditing ? (
            <Card className="w-full mb-8">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-light">{profile.name.charAt(0)}</span>
                </div>
                
                <div>
                  <CardTitle>{profile.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-1" />
                    {profile.email}
                  </CardDescription>
                </div>
                
                <div className="ml-auto flex gap-2">
                  {profile.links?.map((link, index) => (
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
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditProfile}
                  className="ml-2"
                >
                  Edit Profile
                </Button>
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
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
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
      </AnimatedTransition>
    </div>
  );
};

export default Profile;
