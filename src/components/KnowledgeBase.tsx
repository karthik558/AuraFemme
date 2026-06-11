import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { KNOWLEDGE_TOPICS } from '../data/knowledgeBaseData';
import { extendedPregnancyData } from '../data/extendedPregnancyData';
import './KnowledgeBase.css';

export function KnowledgeBase() {
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [activeExtendedArticle, setActiveExtendedArticle] = useState<{ url: string; title: string } | null>(null);

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

  if (activeExtendedArticle) {
    const markdownContent = extendedPregnancyData[activeExtendedArticle.url];
    return (
      <motion.div 
        className="article-view"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <button className="article-back-btn" onClick={() => setActiveExtendedArticle(null)}>
          <ArrowLeft className="w-4 h-4" />
          Back to {activeTopicData?.title || 'Library'}
        </button>

        <div className="article-hero" style={{ paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h2 className="article-hero-title">{activeExtendedArticle.title}</h2>
        </div>

        <div className="article-body extended-markdown">
          {markdownContent ? (
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          ) : (
            <p>Content not available offline. <a href={activeExtendedArticle.url} target="_blank" rel="noopener noreferrer">Read on womenshealth.gov</a></p>
          )}
        </div>
      </motion.div>
    );
  }

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

        <div className="article-hero-premium">
          <div className="article-hero-icon-large">
            {activeTopicData.icon}
          </div>
          <h2 className="article-hero-title-premium">{activeTopicData.title}</h2>
        </div>

        <div className="article-body-premium">
          <p className="lead-text-premium">
            {activeTopicData.articleContent?.intro || activeTopicData.content}
          </p>

          {activeTopicData.articleContent?.body?.map((section: any, idx: number) => (
            <div key={idx}>
              <h3 className="article-subsection-title">{section.title}</h3>
              <p>{section.text}</p>
            </div>
          ))}
          
          {activeTopicData.articleContent?.showGraph && (
            <>
              <h3 className="article-section-title">{activeTopicData.articleContent.graphTitle}</h3>
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
                      contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-subtle)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--text-strong)', fontWeight: 600 }}
                      labelStyle={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ConceptionProbability" name="Probability (%)" stroke="var(--accent-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorProb)" />
                    <Line type="stepAfter" dataKey="BasalTemp" name="BBT (°F)" stroke="#a78bfa" strokeWidth={3} dot={false} yAxisId={1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <h3 className="article-section-title">Evidence-based Action Items</h3>
          <div className="action-items-list">
            {activeTopicData.articleContent?.actionItems.map((item: string, idx: number) => {
              const splitItem = item.split(':');
              const hasColon = splitItem.length > 1;
              return (
                <div className="action-item-card" key={idx}>
                  {hasColon ? (
                    <>
                      <span className="action-item-strong">{splitItem[0]}</span>
                      <span className="action-item-text">{splitItem.slice(1).join(':').trim()}</span>
                    </>
                  ) : (
                    <span className="action-item-text">{item}</span>
                  )}
                </div>
              );
            })}
          </div>

          {activeTopicData.articleContent?.externalLinks && (
            <>
              <h3 className="article-section-title" style={{ marginTop: '3rem' }}>Deep Dive Reading</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeTopicData.articleContent.externalLinks.map((link: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveExtendedArticle(link)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: 'var(--accent-primary)',
                      background: 'transparent',
                      border: 'none',
                      padding: '0.5rem 0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: '1rem'
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="knowledge-base-container">
      <div className="reference-grid">
        <AnimatePresence>
          {KNOWLEDGE_TOPICS.map((topic) => (
            <motion.button 
              key={topic.id}
              className="reference-card"
              onClick={() => setActiveArticle(topic.id)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <div className="card-icon-wrapper">
                {topic.icon}
              </div>
              <h3 className="card-title">{topic.title}</h3>
              <p className="card-excerpt">{topic.content}</p>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
