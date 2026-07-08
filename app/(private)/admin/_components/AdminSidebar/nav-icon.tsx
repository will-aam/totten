import type { BoxIconProps } from "@boxicons/react";
import { cn } from "@/lib/utils";

export type BoxIcon = React.ForwardRefExoticComponent<
  BoxIconProps & React.RefAttributes<SVGSVGElement>
>;

export function NavIcon({
  icon: Icon,
  isActive,
  size = "sm",
  className,
}: {
  icon: BoxIcon;
  isActive: boolean;
  size?: BoxIconProps["size"];
  className?: string;
}) {
  return (
    <span className="relative flex items-center justify-center transition-all duration-300">
      <Icon
        size={size}
        pack="basic"
        className={cn(
          "absolute transition-all duration-300",
          isActive ? "opacity-0 scale-75" : "opacity-100 scale-100",
          className,
        )}
      />
      <Icon
        size={size}
        pack="filled"
        className={cn(
          "transition-all duration-300",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-75",
          className,
        )}
      />
    </span>
  );
}
