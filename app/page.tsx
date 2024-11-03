"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function Home() {
  const tasks = useQuery(api.tasks.getAllTasks);

  return (
    <div className="p-8">
      <h1 className="text-4xl underline">Todo List</h1>
      {tasks?.map((task) => (
        <div key={task.id} className="flex flex-row">
          <h2 className="text-3xl">
            {task.text} - {task.isCompleted ? "Completed" : "Not Completed"}
          </h2>
        </div>
      ))}
    </div>
  );
}
