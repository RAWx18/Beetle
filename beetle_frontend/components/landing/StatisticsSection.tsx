"use client";
import { useEffect, useState, useRef } from 'react';
import { Activity, Sparkles } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
interface StatisticsSectionProps {
  show: boolean;
}
interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  color: string;
}
export const StatisticsSection = ({
  show
}: StatisticsSectionProps) => {
  const [animatedStats, setAnimatedStats] = useState<Stat[]>([{
    value: 0,
    label: "Active Users",
    suffix: "+",
    color: "from-blue-500 to-indigo-600"
  }, {
    value: 0,
    label: "Notes Created",
    suffix: "K",
    color: "from-amber-500 to-orange-600"
  }, {
    value: 0,
    label: "Connections",
    suffix: "M",
    color: "from-emerald-500 to-green-600"
  }, {
    value: 0,
    label: "Ideas Captured",
    prefix: "~",
    suffix: "K",
    color: "from-purple-500 to-pink-600"
  }]);
  const targetStats: Stat[] = [{
    value: 250000,
    label: "Active Users",
    suffix: "+",
    color: "from-blue-500 to-indigo-600"
  }, {
    value: 780,
    label: "Notes Created",
    suffix: "K",
    color: "from-amber-500 to-orange-600"
  }, {
    value: 12.5,
    label: "Connections",
    suffix: "M",
    color: "from-green-500 to-emerald-600"
  }, {
    value: 2300,
    label: "Ideas Captured",
    prefix: "~",
    suffix: "K",
    color: "from-purple-500 to-pink-600"
  }];
  const animationTriggered = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!show || animationTriggered.current) return;
    observer.current = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting && !animationTriggered.current) {
        animateStats();
        animationTriggered.current = true;
      }
    }, {
      threshold: 0.1
    });
    if (sectionRef.current) {
      observer.current.observe(sectionRef.current);
    }
    return () => {
      if (observer.current && sectionRef.current) {
        observer.current.unobserve(sectionRef.current);
      }
    };
  }, [show]);
  const animateStats = () => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      setAnimatedStats(prev => prev.map((stat, index) => ({
        ...stat,
        value: progress >= 1 ? targetStats[index].value : Number((targetStats[index].value * easeOutProgress).toFixed(1))
      })));
      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);
  };
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div ref={sectionRef} className="mt-24 mb-16">
        <div className="text-center mb-12">
          
          
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Join thousands of knowledge workers who are transforming the way they think and create.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {animatedStats.map((stat, index) => <div key={index} className="glass-panel rounded-xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
              <div className="mt-2 mb-2 text-4xl md:text-5xl font-bold tracking-tight">
                {stat.prefix && <span>{stat.prefix}</span>}
                {stat.value % 1 === 0 ? stat.value.toLocaleString() : stat.value.toLocaleString()}
                {stat.suffix && <span>{stat.suffix}</span>}
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
              
              <div className={`absolute -right-12 -bottom-12 w-40 h-40 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
            </div>)}
        </div>
        
        
      </div>
    </AnimatedTransition>;
};