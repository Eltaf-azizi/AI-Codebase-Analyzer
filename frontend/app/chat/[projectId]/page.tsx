"use client";

import { useParams } from "next/navigation";
import { ChatPanel } from "../../../components/ChatPanel";

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <main className="container">
      <h1>Project Chat</h1>
      <ChatPanel projectId={projectId} />
    </main>
  );
}
