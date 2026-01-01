import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeInput } from "@/components/TypeInput";
import { IdlType } from "@coral-xyz/anchor/dist/cjs/idl";
import { motion } from "framer-motion";

interface ArgumentInputProps {
  name: string;
  type: IdlType;
  value: unknown;
  onChange: (value: unknown) => void;
  resolvedType: unknown;
  index: number;
}

export const ArgumentInput: React.FC<ArgumentInputProps> = ({
  name,
  type,
  value,
  onChange,
  resolvedType,
  index,
}) => {
  const isEnum =
    typeof resolvedType === "object" &&
    resolvedType !== null &&
    "kind" in resolvedType &&
    resolvedType.kind === "enum";

  const getSelectedEnumVariant = (value: unknown): string => {
    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);
      if (keys.length > 0) {
        const variant = keys[0];
        return variant.charAt(0).toUpperCase() + variant.slice(1);
      }
    }
    return "";
  };

  const getTypeLabel = (): string => {
    if (isEnum) return "enum";
    if (typeof type === "object" && "option" in type) {
      return `optional ${typeof type.option === "string" ? type.option : "type"
        }`;
    }
    if (typeof type === "string") return type;
    return JSON.stringify(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      className="space-y-2.5 bg-muted/40 p-4 rounded-lg"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor={`arg-${name}`} className="font-medium">
          {name}
        </Label>
        <Badge variant="outline" className="font-mono text-xs">
          {getTypeLabel()}
        </Badge>
      </div>

      {isEnum ? (
        <Select
          value={getSelectedEnumVariant(value)}
          onValueChange={(val) => {
            const camelCaseVariant =
              val.charAt(0).toLowerCase() + val.slice(1);
            onChange({ [camelCaseVariant]: {} });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${name}`} />
          </SelectTrigger>
          <SelectContent>
            {(typeof resolvedType === "object" &&
              resolvedType !== null &&
              "variants" in resolvedType &&
              Array.isArray(resolvedType.variants)
              ? resolvedType.variants
              : []
            ).map((variant: { name: string; fields?: unknown[] }) => (
              <SelectItem key={variant.name} value={variant.name}>
                {variant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <TypeInput
          type={type}
          value={value as string | number | readonly string[] | undefined}
          onChange={onChange}
          placeholder={`Enter ${name}`}
          className="mt-1.5 h-11 transition-all duration-200 focus-within:shadow-sm"
        />
      )}
    </motion.div>
  );
};