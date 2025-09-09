"use client";

import { useState, useEffect, useRef } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { 
  Brain, 
  Lightbulb, 
  Search, 
  Upload, 
  Database, 
  Zap,
  CheckCircle,
  Code,
  PenTool,
  BookOpen,
  Save,
  Shield,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedTransition from '@/components/AnimatedTransition';
import { BranchHow } from '@/components/branch-content/BranchHow';

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  color = 'primary'
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  color?: string
}) => {
  return (
    <div className="flex flex-col items-start p-6 glass-panel rounded-lg h-full">
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-primary">{title}</h3>
      <p className="text-foreground/80">{description}</p>
    </div>
  );
};

const WorkflowStep = ({ 
  number, 
  title, 
  description,
  color = "primary" 
}: { 
  number: number, 
  title: string, 
  description: string,
  color?: string 
}) => {
  return (
    <div className="relative">
      <div className={`absolute top-0 left-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg z-10`}>
        {number}
      </div>
      <div className="pl-16">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-foreground/80">{description}</p>
      </div>
    </div>
  );
};

const FeatureShowcase = ({
  title,
  description,
  image,
  features,
  reversed = false
}: {
  title: string,
  description: string,
  image: string,
  features: { icon: React.ReactNode, text: string }[],
  reversed?: boolean
}) => {
  return (
    <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 my-16`}>
      <div className="w-full md:w-1/2">
        <div className="glass-panel rounded-lg overflow-hidden h-full">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        <h3 className="text-2xl font-bold mb-3 text-primary">{title}</h3>
        <p className="text-foreground/80 mb-6">{description}</p>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 mt-1 flex-shrink-0 text-primary">
                {feature.icon}
              </div>
              <p className="text-foreground/80">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ValueProp = ({
  icon,
  title,
  description
}: {
  icon: React.ReactNode,
  title: string,
  description: string
}) => {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-foreground/80">{description}</p>
    </div>
  );
};

const HowPage = () => {
  const [loading, setLoading] = useState(true);
  const showContent = useAnimateIn(false, 300);
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollPosition = window.scrollY;
        const parallaxFactor = 0.4;
        heroRef.current.style.transform = `translateY(${scrollPosition * parallaxFactor}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 h-screen">
        <AnimatedTransition show={showContent} animation="fade" duration={800}>
          <div className="h-full overflow-y-auto">
            <BranchHow />
          </div>
        </AnimatedTransition>
      </div>
    </div>
  );
};

export default HowPage;
