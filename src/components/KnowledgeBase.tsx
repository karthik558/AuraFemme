import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { KNOWLEDGE_TOPICS } from '../data/knowledgeBaseData';
import reportsData from '../data/reports.json';
import './KnowledgeBase.css';

export function KnowledgeBase() {
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeTopicData = KNOWLEDGE_TOPICS.find(t => t.id === activeArticle);
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
        {/* Sticky Header with Progress */}
        <div className="article-sticky-header">
          <div className="article-progress-track">
            <div className="article-progress-bar" style={{ width: `${scrollProgress}%` }} />
          </div>
          <div className="article-sticky-nav">
            <button className="article-glass-back-btn" onClick={() => setActiveArticle(null)}>
              <ArrowLeft className="w-4 h-4" />
              <span>Library</span>
            </button>
            <span className="article-sticky-title hide-on-mobile">{activeTopicData.title}</span>
          </div>
        </div>

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
      <div className="panel-header" style={{ alignItems: 'center', display: 'flex', paddingBottom: '1.5rem', marginBottom: '-0.5rem' }}>
        <div>
          <h2 className="panel-title" style={{ fontSize: '2rem' }}>Clinical Library</h2>
          <p className="metric-helper" style={{ maxWidth: '42rem', fontSize: '1rem', marginTop: '0.25rem' }}>Evidence-based protocols, peer-reviewed deep dives, and extended health literature.</p>
        </div>
      </div>
      <div className="reference-grid" ref={topicRef}>
          {KNOWLEDGE_TOPICS.map((topic, i) => (
            <button 
              key={topic.id}
              className="reference-card-premium"
              onClick={() => setActiveArticle(topic.id)}
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
