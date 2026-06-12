import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

import { KNOWLEDGE_TOPICS } from '../data/knowledgeBaseData';
import './KnowledgeBase.css';

export function KnowledgeBase() {
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
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


  const topicRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (activeTopicData) {
      gsap.fromTo(topicRef.current,
        { opacity: 0, x: window.innerWidth < 768 ? 0 : 20, y: window.innerWidth < 768 ? 20 : 0 },
        { opacity: 1, x: 0, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTopicData]);

  if (activeTopicData) {
    return (
      <div 
        ref={topicRef}
        className="article-view"
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
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-base-container">
      <div className="reference-grid" ref={topicRef}>
          {KNOWLEDGE_TOPICS.map((topic) => (
            <button 
              key={topic.id}
              className="reference-card"
              onClick={() => setActiveArticle(topic.id)}
            >
              <div className="card-icon-wrapper">
                {topic.icon}
              </div>
              <h3 className="card-title">{topic.title}</h3>
              <p className="card-excerpt">{topic.content}</p>
            </button>
          ))}
      </div>
    </div>
  );
}
