import { type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/Button";

interface DetailViewContainerProps {
  title: string;
  icon: string;
  children: ReactNode;
  action?: ReactNode;
}

export function DetailViewContainer({ title, icon, children, action }: DetailViewContainerProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen detail-view-bg animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate({ to: "/" })}
            >
              ← Back
            </Button>
            <span className="text-4xl">{icon}</span>
            <h1 className="text-4xl font-bold text-stone-900">
              {title}
            </h1>
          </div>
          {action && <div>{action}</div>}
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
