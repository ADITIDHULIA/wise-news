'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/custom/navbar';
import { useAuth } from '@/lib/auth-context';
import { useToast, ToastContainer } from '@/components/custom/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingButton } from '@/components/custom/loading-button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface AnalysisResult {
  score: number;
  credibility: 'real' | 'fake' | 'biased';
  tags: string[];
  details: string;
}

export default function NewsAnalyzerPage() {
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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState({
    headline: '',
    url: '',
    body: '',
  });

  const handleAnalyze = async (e: React.FormEvent) => {
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

    // Mock analysis result
    const mockResult: AnalysisResult = {
      score: Math.floor(Math.random() * 40) + 60, // 60-100%
      credibility: ['real', 'fake', 'biased'][Math.floor(Math.random() * 3)] as 'real' | 'fake' | 'biased',
      tags: generateMockTags(),
      details: 'Analysis complete. This article contains reliable sources and verified facts.',
    };

    setResult(mockResult);
    setShowResult(true);
    setIsLoading(false);
    toast('Analysis complete!', 'success');
  };

  const generateMockTags = () => {
    const tags = ['Verified Sources', 'Neutral Tone', 'Recent Data'];
    return tags.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const getCredibilityColor = (type: string) => {
    switch (type) {
      case 'real':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'fake':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'biased':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ToastContainer toasts={toasts} />
        <div className="animate-fadeIn space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-5xl font-serif font-bold text-foreground">News Analyzer</h1>
            <p className="text-lg text-muted-foreground">
              Paste an article or URL to analyze the credibility
            </p>
            <div className="h-1 w-20 bg-accent rounded"></div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card p-6 sm:p-8">
                <form onSubmit={handleAnalyze} className="space-y-6">
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

                  {/* Analyze Button */}
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    className="w-full h-11"
                  >
                    Analyze Article
                  </LoadingButton>
                </form>
              </Card>
            </div>

            {/* Info Card */}
            <div className="space-y-4">
              <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <h3 className="font-semibold text-foreground mb-4">How It Works</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Paste Content</p>
                      <p className="text-xs">Add headline and article text</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">AI Analysis</p>
                      <p className="text-xs">Machine learning checks facts</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Get Results</p>
                      <p className="text-xs">View credibility score</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-blue-50 dark:bg-blue-950/30 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">Pro Tip</p>
                    <p>Longer articles with verified sources tend to have higher credibility scores.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          {showResult && result && (
            <div className="animate-fadeInUp">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Credibility Score Card */}
                  <Card className="border-border bg-card p-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Credibility Score
                        </p>
                        <div className="flex items-end gap-4">
                          <div className="text-5xl font-bold text-primary">{result.score}%</div>
                          <TrendingUp className="h-8 w-8 text-green-500 mb-1" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress value={result.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {result.score >= 80
                            ? 'Highly credible'
                            : result.score >= 60
                              ? 'Moderately credible'
                              : 'Low credibility'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-border">
                        {result.credibility === 'real' && (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">Appears to be Real</span>
                          </>
                        )}
                        {result.credibility === 'fake' && (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">Potentially Fake</span>
                          </>
                        )}
                        {result.credibility === 'biased' && (
                          <>
                            <TrendingUp className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-600">Potentially Biased</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Details Card */}
                  <Card className="border-border bg-card p-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Key Findings</h3>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Classification</p>
                          <Badge className={`capitalize ${getCredibilityColor(result.credibility)}`}>
                            {result.credibility}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Quality Indicators</p>
                          <div className="flex flex-wrap gap-2">
                            {result.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="border-primary/30 text-foreground">
                                ✓ {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                          <p className="text-sm text-foreground leading-relaxed">{result.details}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Detailed Analysis */}
                <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 p-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Analysis</h3>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Source Reliability</p>
                      <p className="text-2xl font-bold text-primary">92%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Fact Verification</p>
                      <p className="text-2xl font-bold text-primary">87%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Language Neutrality</p>
                      <p className="text-2xl font-bold text-primary">85%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Citation Count</p>
                      <p className="text-2xl font-bold text-primary">12</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
