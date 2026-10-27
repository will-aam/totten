import React from "react";
import { Sofa } from "lucide-react";

export function Couch({
  className,
  size = 20,
  ...props
}: {
  className?: string;
  size?: number | string;
} & React.ComponentProps<typeof Sofa>) {
  return <Sofa size={size} className={className} {...props} />;
}

export default Couch;
