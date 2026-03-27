import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { SkeletonCard } from "../components/ui/Skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface TrackStats {
  totalSessions: number;
  totalWords: number;
  totalGrammarPatterns: number;
  totalTimeMs: number;
  avgConfidence: number;
  completedSessions: number;
}

interface TrendDataPoint {
  date: string;
  confidence: number;
  wordCount: number;
  sessionCount: number;
}

export function StatsView() {
  const { trackId } = useParams({ strict: false });
  const [stats, setStats] = useState<TrackStats | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stats/${trackId}`).then((res) => res.json()),
      fetch(`/api/stats/${trackId}/trends`).then((res) => res.json()),
    ])
      .then(([statsData, trendsData]) => {
        setStats(statsData);
        setTrendData(trendsData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch stats:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  if (isLoading) {
    return (
      <DetailViewContainer title="Statistics & Progress" icon="📊">
        <div className="space-y-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DetailViewContainer>
    );
  }

  if (!stats) {
    return (
      <DetailViewContainer title="Statistics & Progress" icon="📊">
        <p className="text-stone-400">No statistics available</p>
      </DetailViewContainer>
    );
  }

  return (
    <DetailViewContainer title="Statistics & Progress" icon="📊">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-stone-600">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-1">
                    {stats.totalSessions}
                  </div>
                  <div className="text-sm text-stone-500">Total Sessions</div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-amber-600 mb-1">
                    {Math.round(stats.totalTimeMs / 60000)}m
                  </div>
                  <div className="text-sm text-stone-500">Total Time</div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {stats.completedSessions}
                  </div>
                  <div className="text-sm text-stone-500">Completed</div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-1">
                    {Math.round(stats.avgConfidence)}%
                  </div>
                  <div className="text-sm text-stone-500">Avg. Confidence</div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-amber-600 mb-1">
                    {stats.totalWords}
                  </div>
                  <div className="text-sm text-stone-500">Words Learned</div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {stats.totalGrammarPatterns}
                  </div>
                  <div className="text-sm text-stone-500">Grammar Patterns</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {trendData.length > 0 && (
          <>
            <div
            >
              <Card variant="elevated">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-stone-900">
                    Confidence Trend
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis
                          dataKey="date"
                          stroke="#78716c"
                          style={{ fontSize: 12 }}
                        />
                        <YAxis stroke="#78716c" style={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e7e5e4",
                            borderRadius: 8,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="confidence"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div
            >
              <Card variant="elevated">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-stone-900">
                    Practice Activity
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis
                          dataKey="date"
                          stroke="#78716c"
                          style={{ fontSize: 12 }}
                        />
                        <YAxis stroke="#78716c" style={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e7e5e4",
                            borderRadius: 8,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sessionCount"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          name="Sessions"
                        />
                        <Line
                          type="monotone"
                          dataKey="wordCount"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: "#f59e0b", r: 4 }}
                          name="Words"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DetailViewContainer>
  );
}
