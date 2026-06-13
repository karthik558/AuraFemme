import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, Clock, Globe, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { KNOWLEDGE_TOPICS } from '../data/knowledgeBaseData';

import reportsDataEn from '../data/reports.json';
import reportsDataMl from '../data/reports-ml.json';
import reportsDataTa from '../data/reports-ta.json';
import reportsDataHi from '../data/reports-hi.json';
import reportsDataEs from '../data/reports-es.json';
import reportsDataAr from '../data/reports-ar.json';

import topicsMl from '../data/topics-ml.json';
import topicsTa from '../data/topics-ta.json';
import topicsHi from '../data/topics-hi.json';
import topicsEs from '../data/topics-es.json';
import topicsAr from '../data/topics-ar.json';

const REPORTS_MAP: Record<string, any[]> = {
  en: reportsDataEn,
  ml: reportsDataMl,
  ta: reportsDataTa,
  hi: reportsDataHi,
  es: reportsDataEs,
  ar: reportsDataAr
};

const TOPICS_MAP: Record<string, any[]> = {
  ml: topicsMl,
  ta: topicsTa,
  hi: topicsHi,
  es: topicsEs,
  ar: topicsAr
};
import './KnowledgeBase.css';

type SupportedLanguage = 'en' | 'ml' | 'ta' | 'hi' | 'es' | 'ar';

export function KnowledgeBase({ onArticleChange }: { onArticleChange?: (isOpen: boolean) => void }) {
  const [activeArticle, setActiveArticle] = useState<string | null>(null);

  const handleSetArticle = (id: string | null) => {
    setActiveArticle(id);
    onArticleChange?.(!!id);
  };
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lang, setLang] = useState<SupportedLanguage>('en');

  const reportsData = REPORTS_MAP[lang] || REPORTS_MAP['en'];
  
  const localizedTopics = KNOWLEDGE_TOPICS.map(baseTopic => {
    if (lang === 'en' || !TOPICS_MAP[lang]) return baseTopic;
    const localized = TOPICS_MAP[lang].find((t: any) => t.id === baseTopic.id);
    return localized ? { ...baseTopic, title: localized.title, content: localized.content } : baseTopic;
  });

  const activeTopicData = localizedTopics.find(t => t.id === activeArticle);
  const rawMarkdown = reportsData.find((r: any) => r.id === activeArticle)?.markdown_content;
  const markdownContent = rawMarkdown?.replace(/^#\s+.*?(?:\r?\n)+/, '');

  const topicRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (activeTopicData) {
      gsap.fromTo(topicRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
      // Reset scroll on load
      setScrollProgress(0);
      document.querySelector('.main-content')?.scrollTo({ top: 0 });
    }
  }, [activeTopicData]);

  // Scroll Progress Tracking
  useEffect(() => {
    if (!activeTopicData) return;
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // We are looking for the main scrolling container
      if (!target.scrollHeight || target.scrollHeight <= target.clientHeight) return;
      
      const progress = target.scrollTop / (target.scrollHeight - target.clientHeight);
      if (progress >= 0 && progress <= 1) {
         setScrollProgress(progress * 100);
      }
    };
    
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeTopicData]);

  const getReadingTime = (id: string) => {
    const md = reportsData.find((r: any) => r.id === id)?.markdown_content || '';
    const words = md.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 225);
    return minutes > 0 ? `${minutes} min read` : '1 min read';
  };

  if (activeTopicData) {
    return (
      <div 
        ref={topicRef}
        className="article-view-wrapper"
      >
        {/* Fixed Progress Bar at the very top of window */}
        <div className="article-global-progress">
          <div className="article-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Simple Back Button */}
        <button className="article-simple-back-btn" onClick={() => handleSetArticle(null)} aria-label="Back to Library">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="article-reading-container">
          <div className="article-hero-premium">
            <h1 className="article-hero-title-premium">{activeTopicData.title}</h1>
            <div className="article-hero-meta">
              <span className="meta-badge"><Clock className="w-3 h-3" /> {getReadingTime(activeTopicData.id)}</span>
              <span className="meta-badge">Peer-reviewed</span>
            </div>
          </div>

          <div className="article-body-premium extended-markdown">
            {markdownContent ? (
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            ) : (
              <p>Content currently unavailable.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-base-container">
      <div className="panel-header" style={{ alignItems: 'center', display: 'flex', paddingBottom: '1.5rem', marginBottom: '1.5rem', marginTop: '-1.5rem', justifyContent: 'space-between' }}>
        <div>
          <h2 className="panel-title">Clinical Library</h2>
          <p className="metric-helper" style={{ maxWidth: '42rem' }}>Evidence-based protocols, peer-reviewed deep dives, and extended health literature.</p>
        </div>
        <div className="premium-lang-switcher">
          <Globe className="w-4 h-4 icon-glow" />
          <select 
            className="lang-select-hidden"
            value={lang} 
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
          >
            <option value="en">English</option>
            <option value="ml">മലയാളം</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
            <option value="ar">العربية</option>
          </select>
          <ChevronDown className="w-4 h-4 icon-muted" />
        </div>
      </div>
      <div className="reference-grid" ref={topicRef}>
          {localizedTopics.map((topic, i) => (
            <button 
              key={topic.id}
              className="reference-card-premium"
              onClick={() => handleSetArticle(topic.id)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="card-top-row">
                <div className="card-icon-wrapper-premium">
                  {topic.icon}
                </div>
                <div className="card-reading-time">
                  <Clock className="w-3 h-3" />
                  <span>{getReadingTime(topic.id)}</span>
                </div>
              </div>
              <h3 className="card-title-premium">{topic.title}</h3>
              <p className="card-excerpt-premium">{topic.content}</p>
            </button>
          ))}
      </div>
    </div>
  );
}
