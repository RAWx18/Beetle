"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Star,
  GitBranch,
  Users,
  Calendar,
  ExternalLink,
  FolderOpen,
  FileText,
  AlertCircle
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'repository' | 'project' | 'issue' | 'pull_request';
  title: string;
  description: string;
  url: string;
  repository?: {
    name: string;
    full_name: string;
    owner: {
      login: string;
      avatar_url: string;
    };
  };
  metadata: {
    stars?: number;
    forks?: number;
    language?: string;
    updated_at?: string;
    status?: string;
    labels?: string[];
  };
}

const resultTypeConfig = {
  repository: { icon: FolderOpen, color: 'text-blue-500', bg: 'bg-blue-100' },
  project: { icon: FileText, color: 'text-green-500', bg: 'bg-green-100' },
  issue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
  pull_request: { icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-100' }
};

export default function HubSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);

    try {
      if (!token || token === 'demo-token') {
        // Demo mode - show sample search results
        const demoResults: SearchResult[] = [
          {
            id: '1',
            type: 'repository',
            title: 'beetle-app',
            description: 'A demo repository for testing Beetle features with TypeScript and React',
            url: '/contribution?repo=demo-user/beetle-app',
            repository: {
              name: 'beetle-app',
              full_name: 'demo-user/beetle-app',
              owner: {
                login: 'demo-user',
                avatar_url: 'https://github.com/github.png'
              }
            },
            metadata: {
              stars: 42,
              forks: 8,
              language: 'TypeScript',
              updated_at: '2024-02-20T00:00:00Z'
            }
          },
          {
            id: '2',
            type: 'project',
            title: 'Authentication System',
            description: 'Implement OAuth and JWT authentication for the application',
            url: '/contribution?project=auth-system',
            repository: {
              name: 'beetle-app',
              full_name: 'demo-user/beetle-app',
              owner: {
                login: 'demo-user',
                avatar_url: 'https://github.com/github.png'
              }
            },
            metadata: {
              status: 'active',
              updated_at: '2024-02-18T00:00:00Z'
            }
          },
          {
            id: '3',
            type: 'issue',
            title: 'Improve mobile responsiveness',
            description: 'Navigation menu not working properly on mobile devices, needs responsive design improvements',
            url: 'https://github.com/demo-user/beetle-app/issues/15',
            repository: {
              name: 'beetle-app',
              full_name: 'demo-user/beetle-app',
              owner: {
                login: 'demo-user',
                avatar_url: 'https://github.com/github.png'
              }
            },
            metadata: {
              labels: ['bug', 'mobile', 'ui'],
              updated_at: '2024-02-15T00:00:00Z'
            }
          }
        ].filter(result => 
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase())
        );
        
        setResults(demoResults);
        setLoading(false);
        return;
      }

      // TODO: Replace with real API call
      // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${selectedType}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const searchResults = await response.json();
      
      // For now, show empty results until API is connected
      setResults([]);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/hub/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'repository' || result.type === 'project') {
      // Navigate to contribution page
      router.push(result.url);
    } else {
      // Open external link for issues/PRs
      window.open(result.url, '_blank');
    }
  };

  const filteredResults = selectedType === 'all' 
    ? results 
    : results.filter(result => result.type === selectedType);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find repositories, projects, issues, and pull requests
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search repositories, projects, issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {/* Filters */}
      {hasSearched && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All ({results.length})
          </Button>
          <Button
            variant={selectedType === 'repository' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('repository')}
          >
            Repositories ({results.filter(r => r.type === 'repository').length})
          </Button>
          <Button
            variant={selectedType === 'project' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('project')}
          >
            Projects ({results.filter(r => r.type === 'project').length})
          </Button>
          <Button
            variant={selectedType === 'issue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('issue')}
          >
            Issues ({results.filter(r => r.type === 'issue').length})
          </Button>
          <Button
            variant={selectedType === 'pull_request' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('pull_request')}
          >
            Pull Requests ({results.filter(r => r.type === 'pull_request').length})
          </Button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const TypeIcon = resultTypeConfig[result.type].icon;
              
              return (
                <Card 
                  key={result.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${resultTypeConfig[result.type].color} ${resultTypeConfig[result.type].bg}`}
                          >
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {result.type.replace('_', ' ')}
                          </Badge>
                          {result.repository && (
                            <span className="text-sm text-muted-foreground">
                              in {result.repository.full_name}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 truncate">
                          {result.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {result.metadata.language && (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span>{result.metadata.language}</span>
                            </div>
                          )}
                          
                          {result.metadata.stars !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              <span>{result.metadata.stars}</span>
                            </div>
                          )}
                          
                          {result.metadata.forks !== undefined && (
                            <div className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              <span>{result.metadata.forks}</span>
                            </div>
                          )}
                          
                          {result.metadata.updated_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Updated {formatDate(result.metadata.updated_at)}</span>
                            </div>
                          )}
                        </div>
                        
                        {result.metadata.labels && result.metadata.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {result.metadata.labels.slice(0, 3).map((label) => (
                              <Badge key={label} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                            {result.metadata.labels.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.metadata.labels.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter a search term to find repositories, projects, and more
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}