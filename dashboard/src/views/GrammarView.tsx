import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";

interface GrammarPattern {
  id: string;
  patternType: string;
  explanation: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export function GrammarView() {
  const { trackId } = useParams({ strict: false });
  const [patterns, setPatterns] = useState<GrammarPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/grammar/${trackId}`)
      .then((res) => res.json())
      .then((data: GrammarPattern[]) => {
        setPatterns(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch grammar patterns:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  return (
    <DetailViewContainer title="Grammar Patterns" icon="📝">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : patterns.length === 0 ? (
          <p className="text-stone-400 col-span-full">No grammar patterns found</p>
        ) : (
          patterns.map((pattern, index) => (
            <div
              key={pattern.id}
            >
              <Card variant="default" hoverable>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-900 capitalize flex-1">
                      {pattern.patternType.replace(/_/g, " ")}
                    </h3>
                    <Badge variant="info" size="sm">
                      {pattern.occurrences}x
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600 leading-relaxed">{pattern.explanation}</p>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </DetailViewContainer>
  );
}
