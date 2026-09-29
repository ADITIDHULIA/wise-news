'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { NewsCard } from '@/components/custom/news-card';
import { Navbar } from '@/components/custom/navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const breakingNews = [
  {
    id: 1,
    title: 'Major Climate Summit Reaches Historic Agreement',
    description:
      'Global leaders have agreed on a new framework to address climate change, marking a significant step in international cooperation.',
    source: 'Global Times',
    timestamp: '2 hours ago',
    category: 'Environment',
    isLive: true,
  },
  {
    id: 2,
    title: 'Tech Company Announces Revolutionary AI Breakthrough',
    description:
      'A new artificial intelligence model demonstrates unprecedented capabilities in natural language processing and reasoning.',
    source: 'Tech Daily',
    timestamp: '4 hours ago',
    category: 'Technology',
    isLive: true,
  },
  {
    id: 3,
    title: 'Stock Markets Rally on Economic Optimism',
    description:
      'Global markets surge as economic indicators suggest stronger-than-expected growth for the coming quarter.',
    source: 'Market Watch',
    timestamp: '6 hours ago',
    category: 'Finance',
    isLive: false,
  },
];

const trendingNews = [
  {
    title: 'Space Agency Launches New Mission to Mars',
    source: 'Space News',
    timestamp: '1 hour ago',
  },
  {
    title: 'Healthcare Innovation Extends Patient Lifespans',
    source: 'Medical Today',
    timestamp: '3 hours ago',
  },
  {
    title: 'Education Reform Bill Passes Congress',
    source: 'Policy Brief',
    timestamp: '5 hours ago',
  },
  {
    title: 'Sports Legend Announces Retirement',
    source: 'Sports Central',
    timestamp: '7 hours ago',
  },
  {
    title: 'New Renewable Energy Record Set',
    source: 'Green Energy',
    timestamp: '8 hours ago',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [isLoggedIn, router]);

  if (!isReady) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-fadeIn space-y-8">
          {/* Search Bar */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search news articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-full border-border bg-card text-foreground placeholder:text-muted-foreground shadow-sm"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Section - Breaking News */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-accent" />
                  <h2 className="text-4xl font-serif font-bold text-foreground">Breaking News</h2>
                </div>
                <div className="h-1 w-20 bg-accent rounded"></div>
              </div>

              <div className="space-y-4">
                {breakingNews.map((news) => (
                  <NewsCard
                    key={news.id}
                    title={news.title}
                    description={news.description}
                    source={news.source}
                    timestamp={news.timestamp}
                    category={news.category}
                    isLive={news.isLive}
                  />
                ))}
              </div>
            </div>

            {/* Right Sidebar - Trending News */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-foreground">Top Stories</h2>
                <div className="h-0.5 w-12 bg-accent rounded"></div>
              </div>

              <div className="space-y-3">
                {trendingNews.map((news, idx) => (
                  <Card
                    key={idx}
                    className="group cursor-pointer overflow-hidden border-border bg-card p-4 transition-all hover:shadow-md hover:bg-secondary"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {news.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{news.source}</span>
                      <span>{news.timestamp}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Stats Card */}
              <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Articles Analyzed</span>
                      <span className="font-bold text-primary">1,234</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credibility Score</span>
                      <span className="font-bold text-primary">92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Summaries Created</span>
                      <span className="font-bold text-primary">567</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
