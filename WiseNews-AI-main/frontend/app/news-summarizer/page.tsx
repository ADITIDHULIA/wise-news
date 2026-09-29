'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/custom/navbar';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/custom/loading-button';
import { useToast, ToastContainer } from '@/components/custom/toast';
import { Lightbulb, FileText, Clock } from 'lucide-react';

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  timeToRead: string;
}

export default function NewsSummarizerPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { toasts, toast } = useToast();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setAuthReady(true);
    }
  }, [isLoggedIn, router]);

  if (!authReady) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [formData, setFormData] = useState({
    headline: '',
    url: '',
    body: '',
  });

  const mockSummaries: { [key: string]: SummaryResult } = {
    default: {
      summary:
        'The article discusses a significant development in the field. Key stakeholders have been engaged and are responding positively to the initiative. The impact is expected to be substantial across multiple sectors, with potential benefits for the broader community.',
      keyPoints: [
        'Major announcement regarding new developments',
        'Stakeholder engagement and positive feedback',
        'Potential industry-wide impact expected',
        'Implementation timeline spans several quarters',
        'Community and environmental considerations included',
      ],
      timeToRead: '8-10 minutes',
    },
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.headline.trim()) {
      toast('Please enter an article headline', 'error');
      return;
    }

    if (!formData.body.trim()) {
      toast('Please enter the article body', 'error');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResult(mockSummaries.default);
    setShowResult(true);
    setIsLoading(false);
    toast('Summary generated successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToastContainer toasts={toasts} />
        <div className="animate-fadeIn space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-5xl font-serif font-bold text-foreground">News Summarizer</h1>
            <p className="text-lg text-muted-foreground">
              Paste an article or URL to get a concise summary and key highlights
            </p>
            <div className="h-1 w-20 bg-accent rounded"></div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card p-6 sm:p-8">
                <form onSubmit={handleSummarize} className="space-y-6">
                  {/* Headline Input */}
                  <div className="space-y-2">
                    <label htmlFor="headline" className="block text-sm font-semibold text-foreground">
                      Article Headline
                    </label>
                    <Input
                      id="headline"
                      type="text"
                      placeholder="Enter the article headline..."
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      className="border-border"
                      required
                    />
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <label htmlFor="url" className="block text-sm font-semibold text-foreground">
                      Article URL <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="border-border"
                    />
                  </div>

                  {/* Article Body */}
                  <div className="space-y-2">
                    <label htmlFor="body" className="block text-sm font-semibold text-foreground">
                      Article Body
                    </label>
                    <Textarea
                      id="body"
                      placeholder="Paste the full article text here..."
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="min-h-48 border-border resize-none"
                      required
                    />
                  </div>

                  {/* Summarize Button */}
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-11"
                  >
                    Summarize Article
                  </LoadingButton>
                </form>
              </Card>
            </div>

            {/* Info Card */}
            <div className="space-y-4">
              <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <h3 className="font-semibold text-foreground mb-4">Benefits</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="h-4 w-4 text-primary mt-1" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Save Time</p>
                      <p className="text-xs">Get key points instantly</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <Lightbulb className="h-4 w-4 text-primary mt-1" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Quick Insights</p>
                      <p className="text-xs">Understand main ideas fast</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary mt-1" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Stay Informed</p>
                      <p className="text-xs">Cover more articles</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-purple-50 dark:bg-purple-950/30 p-4">
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="text-sm text-purple-900 dark:text-purple-200">
                    <p className="font-semibold mb-1">Feature Highlight</p>
                    <p>Our AI extracts the most important information, creating concise, readable summaries.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          {showResult && result && (
            <div className="animate-fadeInUp">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Summary Results</h2>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Main Summary */}
                  <Card className="border-border bg-card p-8 lg:col-span-2">
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                          Article Summary
                        </p>
                        <p className="text-lg leading-relaxed text-foreground">{result.summary}</p>
                      </div>

                      <div className="border-t border-border pt-6">
                        <p className="text-xs uppercase font-semibold text-muted-foreground mb-4">
                          Key Points
                        </p>
                        <div className="space-y-3">
                          {result.keyPoints.map((point, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                                  <span className="text-xs font-bold">{idx + 1}</span>
                                </div>
                              </div>
                              <p className="text-sm text-foreground">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Stats Card */}
                  <div className="space-y-4">
                    <Card className="border-border bg-gradient-to-br from-accent/20 to-primary/20 p-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase font-semibold text-muted-foreground mb-1">
                            Estimated Reading Time
                          </p>
                          <p className="text-3xl font-bold text-primary">{result.timeToRead}</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-border/20">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Compression Ratio</span>
                            <span className="font-semibold text-foreground">75%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Key Points Extracted</span>
                            <span className="font-semibold text-foreground">{result.keyPoints.length}</span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-border bg-card p-6">
                      <h3 className="font-semibold text-foreground mb-3">Summary Quality</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completeness</span>
                          <span className="font-medium text-primary">95%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }} />
                        </div>

                        <div className="flex justify-between text-sm pt-2">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="font-medium text-primary">98%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '98%' }} />
                        </div>
                      </div>
                    </Card>

                    <Card className="border-border bg-card p-6">
                      <h3 className="font-semibold text-foreground mb-3">Export Options</h3>
                      <div className="space-y-2">
                        <button className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                          Copy Text
                        </button>
                        <button className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                          Download PDF
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
