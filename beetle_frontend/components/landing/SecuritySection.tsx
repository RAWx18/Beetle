import { ShieldCheck, Lock, KeyRound, Eye, Sparkles } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
interface SecuritySectionProps {
  show: boolean;
}
export const SecuritySection = ({
  show
}: SecuritySectionProps) => {
  const securityFeatures = [{
    icon: <Lock size={24} />,
    title: "End-to-End Encryption",
    description: "Your data is encrypted at rest and in transit, ensuring that only you can access your knowledge."
  }, {
    icon: <KeyRound size={24} />,
    title: "Two-Factor Authentication",
    description: "Add an extra layer of security to your account with our robust two-factor authentication system."
  }, {
    icon: <Eye size={24} />,
    title: "Privacy Controls",
    description: "Fine-grained privacy settings that give you complete control over what you share and who you share it with."
  }];
  const securityFAQs = [{
    question: "How is my data encrypted?",
    answer: "We use industry-standard AES-256 encryption for all data at rest, and TLS 1.3 for all data in transit. Your encryption keys are derived from your password using PBKDF2 with a high iteration count, ensuring that only you can decrypt your data."
  }, {
    question: "Where is my data stored?",
    answer: "Your data is stored in secure, SOC 2 compliant data centers. We use a distributed architecture with redundancy across multiple geographic regions to ensure high availability and disaster recovery capabilities."
  }, {
    question: "Can the Cortex team access my notes?",
    answer: "No. We employ a zero-knowledge architecture, which means that your data is encrypted before it leaves your device. The encryption keys are derived from your password, which we never store. This means that even Cortex employees cannot access your unencrypted data."
  }, {
    question: "How do you handle data deletion?",
    answer: "When you delete data in Cortex, it is immediately marked for deletion and removed from your view. The data is then permanently purged from our systems within 30 days. You can also request a complete account deletion, which will remove all your data from our systems."
  }];
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="mt-24 mb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-1.5 bg-muted rounded-xl mb-4">
            <div className="bg-background px-4 py-2 rounded-lg shadow-sm">
              <ShieldCheck size={22} className="inline-block mr-2 text-primary" />
              <span className="font-semibold">Security & Privacy</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your second brain deserves the best protection</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            We've built Cortex with security and privacy as core principles, not afterthoughts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {securityFeatures.map((feature, idx) => <div key={idx} className="glass-panel rounded-xl p-6 md:p-8 relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-primary rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 shadow-md text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>)}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <Sparkles size={22} className="text-primary mr-2" />
              Your data, your control
            </h3>
            <p className="text-muted-foreground mb-6">
              We believe that your thoughts and ideas belong to you and only you. That's why we've designed Cortex with privacy as a fundamental principle.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium mb-1">SOC 2 Type II Certified</h4>
                  <p className="text-sm text-muted-foreground">Our infrastructure and processes meet rigorous security standards</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium mb-1">GDPR & CCPA Compliant</h4>
                  <p className="text-sm text-muted-foreground">We respect your rights and comply with global privacy regulations</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Regular Security Audits</h4>
                  <p className="text-sm text-muted-foreground">We conduct regular penetration testing and security reviews</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 text-primary flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Data Export & Portability</h4>
                  <p className="text-sm text-muted-foreground">Download your data at any time in standard formats</p>
                </div>
              </div>
            </div>
            
            
          </div>
          
          <div className="glass-panel rounded-xl p-6 md:p-8">
            <h3 className="text-xl font-bold mb-6">Security FAQ</h3>
            
            <Accordion type="single" collapsible className="w-full">
              {securityFAQs.map((faq, idx) => <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </div>
        
        
      </div>
    </AnimatedTransition>;
};