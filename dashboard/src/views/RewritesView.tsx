import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";

interface SentenceRewrite {
  id: string;
  userSessionId: string;
  original: string;
  improved: string;
  reason: string;
  createdAt: string;
}

const reasonColors: Record<string, "success" | "info" | "warning" | "default" | "error"> = {
  grammar: "warning",
  word_choice: "info",
  fluency: "success",
  formality: "default",
};

const reasonLabels: Record<string, string> = {
  grammar: "Grammar",
  word_choice: "Word Choice",
  fluency: "Fluency",
  formality: "Formality",
};

export function RewritesView() {
  const { trackId } = useParams({ strict: false });
  const [rewrites, setRewrites] = useState<SentenceRewrite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sentence-rewrites/${trackId}`)
      .then((res) => res.json())
      .then((data: SentenceRewrite[]) => {
        setRewrites(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch sentence rewrites:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  return (
    <DetailViewContainer title="Sentence Improvements" icon="✨">
      <div className="space-y-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : rewrites.length === 0 ? (
          <p className="text-stone-400">No sentence improvements found</p>
        ) : (
          rewrites.map((rewrite, index) => (
            <div
              key={rewrite.id}
            >
              <Card variant="elevated" hoverable>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <Badge variant={reasonColors[rewrite.reason] || "default"} size="md">
                      {reasonLabels[rewrite.reason] || rewrite.reason}
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-semibold text-stone-500 mb-2">
                        Original:
                      </div>
                      <p className="text-stone-700 bg-stone-50 p-4 rounded-lg border-l-4 border-red-400 leading-relaxed">
                        {rewrite.original}
                      </p>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-emerald-600 text-xl">↓</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-stone-500 mb-2">
                        Improved:
                      </div>
                      <p className="text-stone-900 bg-stone-50 p-4 rounded-lg border-l-4 border-emerald-400 leading-relaxed font-medium">
                        {rewrite.improved}
                      </p>
                    </div>
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
