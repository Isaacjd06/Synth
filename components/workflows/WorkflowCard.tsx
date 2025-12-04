import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface WorkflowCardProps {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export default function WorkflowCard({
  id,
  name,
  description,
  active,
}: WorkflowCardProps) {
  // Truncate description if too long
  const truncatedDescription = description
    ? description.length > 100
      ? `${description.substring(0, 100)}...`
      : description
    : "No description";

  return (
    <Link href={`/workflows/${id}`}>
      <Card className="hover:border-[#194c92] transition-colors cursor-pointer h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex-1 pr-2">
              {name}
            </h3>
            <Badge variant={active ? "active" : "inactive"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 flex-1 line-clamp-3">
            {truncatedDescription}
          </p>
        </div>
      </Card>
    </Link>
  );
}

