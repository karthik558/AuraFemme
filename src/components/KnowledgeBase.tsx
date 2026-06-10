import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ArrowLeft } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { KNOWLEDGE_TOPICS } from '../data/knowledgeBaseData';
import './KnowledgeBase.css';

export function KnowledgeBase() {
  const [openTopic, setOpenTopic] = useState<string | null>('pregnancy');
  const [activeArticle, setActiveArticle] = useState<string | null>(null);

  const toggleTopic = (id: string) => {
    setOpenTopic(openTopic === id ? null : id);
  };

  const activeTopicData = KNOWLEDGE_TOPICS.find(t => t.id === activeArticle);

  // Generate generic educational graph data
  const mockEducationalData = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    const probability = Math.max(0, 100 * Math.exp(-Math.pow(day - 14, 2) / 10));
    const basalTemp = 97.2 + (day >= 14 ? 0.6 : 0) + (Math.random() * 0.2);
    return {
      day,
      ConceptionProbability: Math.round(probability),
      BasalTemp: parseFloat(basalTemp.toFixed(2))
    };
  });

  if (activeTopicData) {
    return (
      <motion.div 
        className="article-view"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button className="article-back-btn" onClick={() => setActiveArticle(null)}>
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>

        <div className="article-hero">
          <div className="article-hero-icon">
            {activeTopicData.icon}
          </div>
          <h2 className="article-hero-title">{activeTopicData.title}</h2>
        </div>

        <div className="article-body">
          <p className="lead-text" style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-strong)', marginBottom: '2rem' }}>
            {activeTopicData.articleContent?.intro || activeTopicData.content}
          </p>

          {activeTopicData.articleContent?.body?.map((section: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--text-strong)' }}>{section.title}</h3>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
          
          {activeTopicData.articleContent?.showGraph && (
            <>
              <h3>{activeTopicData.articleContent.graphTitle}</h3>
              <p>
                {activeTopicData.articleContent.graphDesc}
              </p>

              <div className="article-graph-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEducationalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-strong)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ConceptionProbability" name="Metric A (%)" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorProb)" />
                    <Line type="stepAfter" dataKey="BasalTemp" name="Metric B (°F)" stroke="#06b6d4" strokeWidth={2} dot={false} yAxisId={1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <h3>Evidence-based Action Items</h3>
          <ul>
            {activeTopicData.articleContent?.actionItems.map((item, idx) => {
              const splitItem = item.split(':');
              const hasColon = splitItem.length > 1;
              return (
                <li key={idx} style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                  {hasColon ? (
                    <>
                      <strong style={{ color: 'var(--text-strong)' }}>{splitItem[0]}:</strong>
                      {splitItem.slice(1).join(':')}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>{item}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="knowledge-base-container">
      <div className="phase-summary highlight">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <BookOpen className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="panel-title" style={{ fontSize: '1.5rem', margin: 0 }}>Reference Library</h2>
        </div>
        <p className="metric-helper" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
          Explore our clinical knowledge base. This repository provides foundational insights into fertility, prenatal care, and reproductive health designed to support the Aura Femme tracking models.
        </p>
      </div>

      <div className="accordion-wrapper" style={{ marginTop: '2rem' }}>
        {KNOWLEDGE_TOPICS.map((topic) => (
          <div 
            key={topic.id} 
            className={`accordion-item ${openTopic === topic.id ? 'open' : ''}`}
          >
            <button 
              className="accordion-header" 
              onClick={() => toggleTopic(topic.id)}
              aria-expanded={openTopic === topic.id}
            >
              <div className="accordion-title-group">
                <div className="accordion-icon" style={{ color: openTopic === topic.id ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {topic.icon}
                </div>
                <h3 className="accordion-title">{topic.title}</h3>
              </div>
              <ChevronDown 
                className={`accordion-chevron ${openTopic === topic.id ? 'rotated' : ''}`} 
              />
            </button>
            <AnimatePresence initial={false}>
              {openTopic === topic.id && (
                <motion.div
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto', marginTop: '0.5rem' },
                    collapsed: { opacity: 0, height: 0, marginTop: 0 }
                  }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <div className="accordion-content">
                    <p>{topic.content}</p>
                    <button 
                      className="theme-btn" 
                      onClick={() => setActiveArticle(topic.id)}
                      style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Read full article
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
