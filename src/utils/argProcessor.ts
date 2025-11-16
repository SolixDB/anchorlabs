import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { IdlType, IdlInstruction } from "@coral-xyz/anchor/dist/cjs/idl";

export const resolveType = (
  type: IdlType,
  programTypes?: Array<{ name: string; type: unknown }>
): IdlType | { 
  kind: "struct" | "enum"; 
  fields?: Array<{ name: string; type: unknown }>; 
  variants?: Array<{ name: string; fields?: unknown[] }> 
} => {
  if (typeof type === "object" && "option" in type) {
    type = type.option;
  }
  
  if (typeof type === "object" && "defined" in type) {
    let typeName: string;
    if (typeof type.defined === "string") {
      typeName = type.defined;
    } else if (typeof type.defined === "object" && "name" in type.defined) {
      typeName = type.defined.name;
    } else {
      return type;
    }
    
    const definedType = programTypes?.find(
      (t) => t.name.toLowerCase() === typeName.toLowerCase()
    );
    return (definedType?.type as IdlType) || type;
  }
  
  return type;
};

export const processInstructionArgs = (
  instruction: IdlInstruction,
  args: Record<string, unknown>,
  programTypes?: Array<{ name: string; type: unknown }>
) => {
  return instruction.args.map((arg) => {
    const value = args[arg.name];
    console.log(`Processing arg: ${arg.name}`, { value, type: arg.type });

    const resolvedType = resolveType(arg.type, programTypes);
    const isEnum = 
      typeof resolvedType === "object" && 
      "kind" in resolvedType && 
      resolvedType.kind === "enum";

    // Handle enum types
    if (isEnum) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 1) {
          const variantName = keys[0];
          const variantValue = value[variantName as keyof typeof value];
          const result = {
            [variantName]: 
              typeof variantValue === 'object' && variantValue !== null 
                ? variantValue 
                : {}
          };
          console.log(`Enum ${arg.name} formatted:`, result);
          return result;
        }
      }
      throw new Error(
        `Invalid enum value for ${arg.name}. Expected format: { VariantName: {} }`
      );
    }

    // Handle option types
    if (typeof arg.type === "object" && "option" in arg.type) {
      if (!value || value === "") return null;
      
      const innerType = arg.type.option;
      if (typeof innerType === "string") {
        return processNumericOrPublicKeyType(innerType, value);
      }
      return value;
    }

    // Handle primitive types
    if (typeof arg.type === "string") {
      return processNumericOrPublicKeyType(arg.type, value);
    }

    // Handle vec types
    if (typeof arg.type === "object" && "vec" in arg.type) {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    }

    return value;
  });
};

const processNumericOrPublicKeyType = (type: string, value: unknown) => {
  switch (type) {
    case "u8":
    case "i8":
    case "u16":
    case "i16":
    case "u32":
    case "i32":
    case "u64":
    case "i64":
    case "u128":
    case "i128":
    case "u256":
    case "i256":
      return value ? new BN(value) : new BN(0);
    case "pubkey":
      return value ? new PublicKey(value as string) : null;
    case "bool":
      return Boolean(value);
    case "string":
      return value || "";
    default:
      return value;
  }
};

export const initializeArgsForInstruction = (
  instruction: IdlInstruction,
  programTypes?: Array<{ name: string; type: unknown }>
): Record<string, unknown> => {
  const initialArgs: Record<string, unknown> = {};
  
  instruction.args.forEach((arg) => {
    const resolvedType = resolveType(arg.type, programTypes);
    const isEnum = 
      typeof resolvedType === "object" && 
      "kind" in resolvedType && 
      resolvedType.kind === "enum";
    
    if (isEnum && resolvedType.variants && resolvedType.variants.length > 0) {
      const firstVariant = resolvedType.variants[0].name;
      const camelCaseVariant = 
        firstVariant.charAt(0).toLowerCase() + firstVariant.slice(1);
      initialArgs[arg.name] = { [camelCaseVariant]: {} };
    } else {
      initialArgs[arg.name] = "";
    }
  });
  
  return initialArgs;
};