import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";

interface Session {
  id: string;
  topicId: string | null;
  transcriptText: string | null;
  audioDurationMs: number;
  wordCount: number | null;
  feedbackStatus: string;
  feedbackConfidenceScore: number | null;
  createdAt: number;
}

export function SessionsView() {
  const { trackId } = useParams({ strict: false });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${trackId}`)
      .then((res) => res.json())
      .then((data: Session[]) => {
        setSessions(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch sessions:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = new Date(session.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const sortedDates = Object.keys(sessionsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getConfidenceBadge = (score: number | null) => {
    if (score === null) return null;
    if (score >= 80) return <Badge variant="success">{score}%</Badge>;
    if (score >= 60) return <Badge variant="info">{score}%</Badge>;
    return <Badge variant="warning">{score}%</Badge>;
  };

  return (
    <DetailViewContainer title="Practice Sessions" icon="🎙️">
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-1">
                {sessions.length}
              </div>
              <div className="text-sm text-stone-500">
                Total Sessions
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-amber-600 mb-1">
                {Math.round(
                  sessions.reduce((sum, s) => sum + s.audioDurationMs, 0) / 60000
                )}m
              </div>
              <div className="text-sm text-stone-500">
                Total Time
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {sessions.filter((s) => s.feedbackStatus === "completed").length}
              </div>
              <div className="text-sm text-stone-500">
                Completed
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-1">
                {Math.round(
                  sessions
                    .filter((s) => s.feedbackConfidenceScore !== null)
                    .reduce((sum, s) => sum + (s.feedbackConfidenceScore || 0), 0) /
                    Math.max(sessions.filter((s) => s.feedbackConfidenceScore !== null).length, 1)
                )}%
              </div>
              <div className="text-sm text-stone-500">
                Avg. Confidence
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6 text-stone-600">
          Session History
        </h2>
        {isLoading ? (
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-stone-400">No sessions found</p>
        ) : (
          <div className="space-y-10">
            {sortedDates.map((date, dateIndex) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-4 text-stone-700">
                  {date}
                </h3>
                <div className="space-y-4">
                  {(sessionsByDate[date] || []).map((session, index) => (
                    <div
                      key={session.id}
                    >
                      <Card variant="default" hoverable>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm text-stone-500 font-medium">
                                  {Math.round(session.audioDurationMs / 1000)}s
                                </span>
                                {session.wordCount && (
                                  <span className="text-sm text-stone-500">
                                    {session.wordCount} words
                                  </span>
                                )}
                                {getConfidenceBadge(session.feedbackConfidenceScore)}
                              </div>
                              {session.transcriptText && (
                                <p className="text-stone-700 leading-relaxed line-clamp-2">
                                  {session.transcriptText}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailViewContainer>
  );
}
