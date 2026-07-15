import { Badge } from "@/components/ui/badge";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`${center ? "mx-auto max-w-3xl text-center" : ""}`}>
      {eyebrow && (
        <div className={`mb-4 ${center ? "flex justify-center" : ""}`}>
          <Badge
            variant="outline"
            className="border-totten bg-card-totten text-xs font-medium text-zinc-soft"
          >
            {eyebrow}
          </Badge>
        </div>
      )}
      <h2 className="text-balance bg-linear-to-b from-white to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl pb-1">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-zinc-soft sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
