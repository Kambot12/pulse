import { AssistantChat } from "@/components/student/AssistantChat";

export default function AssistantPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-3">
        <h1 className="text-2xl font-bold tracking-tight">Health assistant</h1>
        <p className="text-sm text-muted">Ask health questions and get clear, educational answers.</p>
      </div>
      <AssistantChat />
    </div>
  );
}
