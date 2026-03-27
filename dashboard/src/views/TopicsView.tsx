import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";

interface Topic {
  id: string;
  title: string;
  description: string;
  proficiency: number;
  hints: string[];
}

export function TopicsView() {
  const { trackId } = useParams({ strict: false });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/topics/${trackId}?limit=20`)
      .then((res) => res.json())
      .then((data: Topic[]) => {
        setTopics(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch topics:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  const getProficiencyBadge = (level: number) => {
    if (level <= 3) return <Badge variant="success">Beginner</Badge>;
    if (level <= 6) return <Badge variant="info">Intermediate</Badge>;
    return <Badge variant="warning">Advanced</Badge>;
  };

  return (
    <DetailViewContainer title="Suggested Topics" icon="💡">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : topics.length === 0 ? (
          <p className="text-stone-400 col-span-full">No topics available</p>
        ) : (
          topics.map((topic, index) => (
            <div
              key={topic.id}
            >
              <Card variant="elevated" hoverable>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-stone-900 flex-1">
                      {topic.title}
                    </h3>
                    {getProficiencyBadge(topic.proficiency)}
                  </div>
                  <p className="text-stone-600 leading-relaxed">{topic.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-stone-500">
                      Hints:
                    </h4>
                    <ul className="space-y-1.5">
                      {topic.hints.slice(0, 3).map((hint, hintIndex) => (
                        <li
                          key={hintIndex}
                          className="text-sm text-stone-600 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </DetailViewContainer>
  );
}
