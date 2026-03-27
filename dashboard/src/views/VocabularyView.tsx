import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DetailViewContainer } from "../components/DetailViewContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { SkeletonCard } from "../components/ui/Skeleton";

interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  example: string;
  usageCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export function VocabularyView() {
  const { trackId } = useParams({ strict: false });
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`/api/vocabulary/${trackId}`)
      .then((res) => res.json())
      .then((data: VocabularyItem[]) => {
        setVocabulary(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch vocabulary:", error);
        setIsLoading(false);
      });
  }, [trackId]);

  const filteredVocabulary = vocabulary.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxUsage = Math.max(...vocabulary.map((v) => v.usageCount), 1);

  return (
    <DetailViewContainer
      title="Vocabulary"
      icon="📚"
      action={
        <Input
          placeholder="Search words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      }
    >
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-stone-600">
          Word Cloud
        </h2>
        <Card variant="elevated">
          <CardContent className="p-12">
            <div className="flex flex-wrap gap-4 items-center justify-center min-h-[300px]">
              {isLoading ? (
                <p className="text-stone-400">Loading...</p>
              ) : filteredVocabulary.length === 0 ? (
                <p className="text-stone-400">No vocabulary found</p>
              ) : (
                filteredVocabulary.slice(0, 50).map((item, index) => {
                  const scale = 0.7 + (item.usageCount / maxUsage) * 1.3;
                  return (
                    <span
                      key={item.id}
                      className="cursor-pointer text-emerald-600 hover:text-amber-600 transition-all hover:scale-110 font-medium animate-fade-in"
                      style={{
                        fontSize: `${scale}rem`,
                        animationDelay: `${index * 15}ms`,
                      }}
                    >
                      {item.word}
                    </span>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6 text-stone-600">
          All Words ({filteredVocabulary.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredVocabulary.length === 0 ? (
            <p className="text-stone-400 col-span-full">No words found</p>
          ) : (
            filteredVocabulary.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <Card variant="default" hoverable>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-semibold text-stone-900">
                        {item.word}
                      </h3>
                      <Badge variant="default" size="sm">
                        {item.usageCount}x
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-600 mb-3 leading-relaxed">
                      {item.meaning}
                    </p>
                    <p className="text-sm text-stone-500 italic leading-relaxed">
                      "{item.example}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </DetailViewContainer>
  );
}
