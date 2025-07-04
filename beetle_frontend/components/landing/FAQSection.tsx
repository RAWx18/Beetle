import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
interface FAQSectionProps {
  showFAQs?: boolean;
}
export const FAQSection = ({
  showFAQs = true
}: FAQSectionProps) => {
  const [openItem, setOpenItem] = useState<string | null>("item-1");
  const faqs = [{
    id: "item-1",
    question: "What is a Digital Second Brain?",
    answer: "A Digital Second Brain is an AI-powered knowledge repository that acts as an extension of your mind. It helps you organize, connect, and retrieve information efficiently, enabling better thinking and creativity."
  }, {
    id: "item-2",
    question: "How does Cortex differ from regular note-taking apps?",
    answer: "Unlike traditional note-taking apps, Cortex uses AI to automatically connect related concepts, visualize knowledge networks, and surface relevant information when you need it. It's designed to mimic how your brain naturally connects ideas."
  }, {
    id: "item-3",
    question: "Is my data secure and private?",
    answer: "Yes, we take data security and privacy very seriously. All your information is encrypted, and we never share your personal data with third parties. You maintain full ownership of your content."
  }, {
    id: "item-4",
    question: "Can I import data from other tools?",
    answer: "Absolutely! Cortex supports importing from popular tools like Notion, Evernote, Roam Research, and more. Our import process preserves your existing structure while enhancing it with AI-powered connections."
  }, {
    id: "item-5",
    question: "Is there a mobile app available?",
    answer: "Yes, we offer mobile apps for both iOS and Android, allowing you to access and update your digital brain on the go. All changes sync seamlessly across your devices."
  }];
  return <AnimatedTransition show={showFAQs} animation="slide-up" duration={600}>
      
    </AnimatedTransition>;
};