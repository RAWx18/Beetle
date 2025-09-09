'use client';

import { useAuth } from '@/contexts/AuthContext';
import GitHubAPI from '@/lib/github-api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Code, 
  Github, 
  Star, 
  GitBranch, 
  Calendar, 
  User, 
  Lock, 
  Globe, 
  ExternalLink, 
  Heart, 
  GitFork, 
  Globe2, 
  Users, 
  Zap, 
  Clock 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Repository } from '@/types/hub';

// Custom CSS for animations
const customStyles = `
  @keyframes slide-up {
    from { 
      opacity: 0; 
      transform: translateY(30px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scale-in {
    from { 
      opacity: 0; 
      transform: scale(0.8); 
    }
    to { 
      opacity: 1; 
      transform: scale(1); 
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px hsl(var(--primary) / 0.3); }
    50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.6); }
  }
  
  .animate-slide-up {
    animation: slide-up 0.6s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scale-in 0.5s ease-out forwards;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .language-bar {
    position: relative;
    overflow: hidden;
  }
  
  .language-bar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.3), transparent);
    width: 100%;
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

interface RepositoryCardProps {
  repository: any; // TODO: Replace with proper Repository type from hub.ts
  className?: string;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  repository,
  className = '',
  onError,
  onLoading
}) => {
  const { token } = useAuth();
  const [contributors, setContributors] = useState<any[]>([]);
  const [languages, setLanguages] = useState<{ [key: string]: number }>({});
  const [stargazers, setStargazers] = useState<any[]>([]);
  const [forks, setForks] = useState<any[]>([]);
  const [watchers, setWatchers] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !repository?.owner?.login || !repository?.name) return;
    
    const githubAPI = new GitHubAPI(token);
    setLoading(true);
    onLoading?.(true);
    
    // Fetch all repository data
    Promise.all([
      githubAPI.getRepositoryContributors(repository.owner.login, repository.name),
      githubAPI.getRepositoryLanguages(repository.owner.login, repository.name),
      // Note: These endpoints might not exist in the current API, so we'll handle gracefully
      Promise.resolve([]), // stargazers
      Promise.resolve([]), // forks
      Promise.resolve([]), // watchers
      Promise.resolve([]), // releases
      Promise.resolve([]), // packages
      Promise.resolve([]), // deployments
    ])
      .then(([contributors, languages, stargazers, forks, watchers, releases, packages, deployments]) => {
        setContributors(contributors || []);
        setLanguages(languages || {});
        setStargazers(stargazers || []);
        setForks(forks || []);
        setWatchers(watchers || []);
        setReleases(releases || []);
        setPackages(packages || []);
        setDeployments(deployments || []);
      })
      .catch((error) => {
        console.error('Error fetching repository data:', error);
        onError?.(error);
      })
      .finally(() => {
        setLoading(false);
        onLoading?.(false);
      });
  }, [token, repository, onError, onLoading]);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C#': '#178600',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
      'Scala': '#c22d40',
      'R': '#198ce7',
      'Dart': '#00B4AB',
      'Elixir': '#6e4a7e',
      'Clojure': '#db5855',
      'Haskell': '#5e5086',
      'OCaml': '#3be133',
      'F#': '#b845fc',
      'Crystal': '#000100',
      'Nim': '#37775b',
      'Zig': '#ec915c',
      'V': '#4f87c4',
      'Lua': '#000080',
      'Perl': '#0298c3',
      'Shell': '#89e051',
      'PowerShell': '#012456',
      'Batchfile': '#C1F12E',
      'Makefile': '#427819',
      'Dockerfile': '#384d54',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'SCSS': '#c6538c',
      'Sass': '#a53b70',
      'Less': '#1d365d',
      'Vue': '#2c3e50',
      'React': '#61dafb',
      'Angular': '#dd0031',
      'Svelte': '#ff3e00',
      'Solidity': '#363636',
      'Assembly': '#6E4C13',
      'C': '#555555',
      'Objective-C': '#438eff',
      'Objective-C++': '#6866fb',
      'CoffeeScript': '#244776',
      'TeX': '#3D6117',
      'Markdown': '#083fa1',
      'YAML': '#cb171e',
      'JSON': '#292b36',
      'XML': '#f0db4f',
      'SVG': '#ff9900',
      'GraphQL': '#e10098',
      'Protocol Buffer': '#e10098',
      'Thrift': '#e10098',
      'WebAssembly': '#654ff0',
    };
    return colors[language] || '#6e7681';
  };

  const totalBytes = Object.values(languages).reduce((sum: number, bytes: number) => sum + bytes, 0);

  if (!repository) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-muted-foreground">No repository data available</p>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className={`max-w-6xl mx-auto space-y-12 bg-black-900 h-full overflow-y-auto p-8 ${className}`}>
        {/* Hero Section with Owner Profile */}
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Owner Profile */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-scale-in">
                <img
                  src={repository.owner?.avatar_url || 'https://github.com/github.png'}
                  alt={repository.owner?.login}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-3 border-white animate-pulse-glow"></div>
            </div>
            
            {/* Repository Info */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white animate-slide-up">
                {repository.name}
              </h1>
              <p className="text-xl text-black-300 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {repository.description || "No description available"}
              </p>
              
              {/* Owner Info */}
              <div className="flex items-center justify-center gap-2 text-black-400 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <span>by</span>
                <a 
                  href={`https://github.com/${repository.owner?.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {repository.owner?.login}
                </a>
              </div>
            </div>
          </div>

          {/* Website Link */}
          {repository.homepage && (
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <a
                href={repository.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all duration-300 font-medium"
              >
                <Globe2 className="w-4 h-4" />
                Visit Website
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Topics */}
          {repository.topics && repository.topics.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              {repository.topics.map((topic: string) => (
                <span
                  key={topic}
                  className="px-3 py-1 bg-black-800 text-black-300 rounded-full text-sm font-medium hover:bg-black-700 transition-all duration-300 cursor-pointer"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-black-800 rounded-2xl shadow-sm border border-black-700 hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-3xl font-bold text-white mb-2">{repository.stargazers_count}</div>
            <div className="text-sm text-black-400 font-medium">Stars</div>
          </div>
          <div className="text-center p-6 bg-black-800 rounded-2xl shadow-sm border border-black-700 hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-3xl font-bold text-white mb-2">{repository.forks_count}</div>
            <div className="text-sm text-black-400 font-medium">Forks</div>
          </div>
          <div className="text-center p-6 bg-black-800 rounded-2xl shadow-sm border border-black-700 hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-3xl font-bold text-white mb-2">{repository.language || "N/A"}</div>
            <div className="text-sm text-black-400 font-medium">Language</div>
          </div>
          <div className="text-center p-6 bg-black-800 rounded-2xl shadow-sm border border-black-700 hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl font-bold text-white mb-2">{repository.default_branch}</div>
            <div className="text-sm text-black-400 font-medium">Branch</div>
          </div>
        </div>

        {/* Languages with Modern Animation */}
        {Object.keys(languages).length > 0 && (
          <Card className="bg-black-800 border border-black-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Code className="w-5 h-5 text-orange-500" />
                Languages
              </CardTitle>
              <CardDescription className="text-black-400">
                Programming languages used in this repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(languages).map(([lang, bytes], index) => {
                  const percentage = ((bytes / totalBytes) * 100).toFixed(1);
                  return (
                    <div key={lang} className="space-y-3 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getLanguageColor(lang) }}
                          ></div>
                          <span className="font-semibold text-white">{lang}</span>
                        </div>
                        <span className="text-sm text-black-400">{percentage}%</span>
                      </div>
                      <div className="w-full bg-black-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="language-bar h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getLanguageColor(lang),
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-black-500 text-right">
                        {bytes.toLocaleString()} bytes
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contributors */}
        {contributors.length > 0 && (
          <Card className="bg-black-800 border border-black-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <Users className="w-5 h-5 text-orange-500" />
                Contributors
              </CardTitle>
              <CardDescription className="text-black-400">
                People who have contributed to this repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {contributors.slice(0, 12).map((contributor: any, index: number) => (
                  <a
                    key={contributor.id}
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center p-4 rounded-xl bg-black-700 hover:bg-black-600 transition-all duration-300 transform hover:scale-105"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative mb-3">
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        className="w-16 h-16 rounded-full border-3 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <span className="text-sm font-medium text-center text-white group-hover:text-orange-400 transition-colors duration-300">
                      {contributor.login}
                    </span>
                    <span className="text-xs text-black-400">
                      {contributor.contributions} contributions
                    </span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stargazers with Profile Photos */}
        <Card className="bg-black-800 border border-black-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <Star className="w-5 h-5 text-orange-500" />
              Stargazers
            </CardTitle>
            <CardDescription className="text-black-400">
              People who have starred this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: Math.min(repository.stargazers_count, 30) }, (_, i) => (
                <div
                  key={i}
                  className="relative group animate-float"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-black-800 animate-pulse"></div>
                </div>
              ))}
              {repository.stargazers_count > 30 && (
                <div className="w-12 h-12 bg-black-700 rounded-full flex items-center justify-center text-xs font-bold text-black-400 border-2 border-dashed border-black-600">
                  +{repository.stargazers_count - 30}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Forks with Profile Photos */}
        <Card className="bg-black-800 border border-black-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <GitFork className="w-5 h-5 text-orange-500" />
              Forks
            </CardTitle>
            <CardDescription className="text-black-400">
              People who have forked this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: Math.min(repository.forks_count, 20) }, (_, i) => (
                <div
                  key={i}
                  className="relative group animate-float"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <GitFork className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-black-800 animate-pulse"></div>
                </div>
              ))}
              {repository.forks_count > 20 && (
                <div className="w-12 h-12 bg-black-700 rounded-full flex items-center justify-center text-xs font-bold text-black-400 border-2 border-dashed border-black-600">
                  +{repository.forks_count - 20}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Repository Details */}
        <Card className="bg-black-800 border border-black-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <Github className="w-5 h-5 text-black-400" />
              Repository Details
            </CardTitle>
            <CardDescription className="text-black-400">
              Detailed information about this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                  <User className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-sm text-black-400">Owner:</span>
                    <span className="ml-2 font-medium text-white">{repository.owner?.login}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-sm text-black-400">Created:</span>
                    <span className="ml-2 font-medium text-white">{new Date(repository.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-sm text-black-400">Last Updated:</span>
                    <span className="ml-2 font-medium text-white">{getRelativeTime(repository.updated_at)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                  {repository.private ? (
                    <Lock className="w-5 h-5 text-red-400" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-400" />
                  )}
                  <div>
                    <span className="text-sm text-black-400">Visibility:</span>
                    <Badge variant={repository.private ? "destructive" : "default"} className="ml-2">
                      {repository.private ? "Private" : "Public"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                  <GitBranch className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-sm text-black-400">Type:</span>
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {repository.type}
                    </Badge>
                  </div>
                </div>
                {repository.fork && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-black-700">
                    <GitFork className="w-5 h-5 text-orange-500" />
                    <div>
                      <span className="text-sm text-black-400">Forked from:</span>
                      <span className="ml-2 font-medium text-white">Original Repository</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repository Actions */}
        <Card className="bg-black-800 border border-black-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <Zap className="w-5 h-5 text-orange-500" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-black-400">
              Quick actions for this repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href={repository.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-6 rounded-xl bg-black-700 hover:bg-black-600 transition-all duration-300 border border-black-600"
              >
                <Github className="w-6 h-6 text-black-400 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="font-semibold text-lg text-white">View on GitHub</div>
                  <div className="text-sm text-black-400">Open repository page</div>
                </div>
              </a>
              <button className="group flex items-center gap-4 p-6 rounded-xl bg-black-700 hover:bg-black-600 transition-all duration-300 border border-black-600">
                <GitBranch className="w-6 h-6 text-black-400 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="font-semibold text-lg text-white">Clone Repository</div>
                  <div className="text-sm text-black-400">Copy clone URL</div>
                </div>
              </button>
              <button className="group flex items-center gap-4 p-6 rounded-xl bg-black-700 hover:bg-black-600 transition-all duration-300 border border-black-600">
                <Star className="w-6 h-6 text-black-400 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="font-semibold text-lg text-white">Star Repository</div>
                  <div className="text-sm text-black-400">Show your support</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sponsor Button */}
        <div className="text-center">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Heart className="w-5 h-5 mr-2" />
            Sponsor this project
          </Button>
        </div>
      </div>
    </>
  );
};

export default RepositoryCard;