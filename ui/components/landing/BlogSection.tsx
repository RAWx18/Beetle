
import { Newspaper, ArrowRight, Sparkles } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogSectionProps {
  show: boolean;
}

export const BlogSection = ({ show }: BlogSectionProps) => {
  const articles = [
    {
      title: "Building a Second Brain: The Ultimate Guide",
      description: "Learn the fundamentals of creating a functional digital second brain to enhance your productivity and creativity.",
      author: "Dr. James Wilson",
      date: "May 15, 2023",
      readTime: "8 min read",
      category: "Methodology",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&auto=format"
    },
    {
      title: "How to Create Effective Knowledge Maps",
      description: "Discover techniques for visualizing and connecting your ideas in a way that promotes insight and discovery.",
      author: "Emma Chen",
      date: "June 3, 2023",
      readTime: "6 min read",
      category: "Tutorials",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=400&auto=format"
    },
    {
      title: "The Science of Neural Connections",
      description: "Explore how our brain creates connections between ideas and how Cortex mirrors this natural process.",
      author: "Dr. Michael Rhodes",
      date: "April 22, 2023",
      readTime: "10 min read",
      category: "Science",
      image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format"
    }
  ];
  
  const resources = [
    {
      title: "Getting Started Guide",
      description: "Everything you need to know to set up your digital second brain",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
      </svg>
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step walkthroughs of key features and workflows",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
      </svg>
    },
    {
      title: "Template Library",
      description: "Pre-built structures for different use cases and workflows",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
    },
    {
      title: "Integration Guides",
      description: "How to connect Cortex with your existing tools and workflows",
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
        <line x1="9" y1="9" x2="9.01" y2="9"></line>
        <line x1="15" y1="9" x2="15.01" y2="9"></line>
      </svg>
    }
  ];

  return (
    <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="mt-24 mb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-1.5 bg-muted rounded-xl mb-4">
            <div className="bg-background px-4 py-2 rounded-lg shadow-sm">
              <Newspaper size={22} className="inline-block mr-2 text-primary" />
              <span className="font-semibold">Resources & Blog</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Expand your knowledge management skills</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Discover strategies, tips, and insights to get the most out of your digital second brain.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {articles.map((article, idx) => (
            <Card key={idx} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  {article.category}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <CardDescription className="line-clamp-2">{article.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground mt-auto">
                <div>{article.author}</div>
                <div className="flex items-center gap-2">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="glass-panel rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center">
              <Sparkles size={20} className="text-primary mr-2" />
              Essential Resources
            </h3>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View All Resources <ArrowRight className="ml-2" size={16} />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {resources.map((resource, idx) => (
              <div key={idx} className="bg-background rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="text-primary mb-3">
                  {resource.icon}
                </div>
                <h4 className="font-semibold mb-2">{resource.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                <div className="mt-auto text-sm text-primary font-medium flex items-center hover:underline cursor-pointer">
                  Explore <ArrowRight className="ml-1" size={14} />
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" size="sm" className="mt-6 sm:hidden w-full">
            View All Resources
          </Button>
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Subscribe to our newsletter for the latest articles, resources, and updates on Cortex.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary flex-grow"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
};
