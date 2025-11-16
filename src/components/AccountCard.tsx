"use client";

import { useState } from "react";
import {
  Search,
  Copy,
  Check,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdlField, IdlTypeDef } from "@coral-xyz/anchor/dist/cjs/idl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useMemo } from "react";

// Copy button component
const CopyButton = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
        copied && "text-green-600",
        className
      )}
      onClick={copyToClipboard}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  );
};

// Helper function to format enum values
const formatEnumValue = (value: unknown): string => {
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const enumKey = keys[0];
      const enumValue = (value as Record<string, unknown>)[enumKey];
      
      if (typeof enumValue === "object" && enumValue !== null && Object.keys(enumValue).length === 0) {
        return enumKey;
      }
      
      return `${enumKey}: ${JSON.stringify(enumValue)}`;
    }
  }
  return String(value);
};

export type AccountData = {
  publicKey: string;
  account: Record<string, unknown>;
};

interface AccountViewProps {
  data: AccountData[];
  accountType?: IdlTypeDef;
}

function isIdlField(field: unknown): field is IdlField {
  const possibleField = field as { name?: unknown; type?: unknown } | null;
  return (
    typeof possibleField === "object" &&
    possibleField !== null &&
    typeof possibleField.name === "string" &&
    "type" in possibleField
  );
}

export function AccountView({ data, accountType }: AccountViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sorting, setSorting] = useState<SortingState>([]);

  const accountFields: IdlField[] = useMemo(() => {
    if (!accountType ||
      !accountType.type ||
      accountType.type.kind !== "struct" ||
      !Array.isArray(accountType.type.fields)) {
      return [];
    }
    return (accountType.type.fields as unknown[]).filter(isIdlField);
  }, [accountType]);

  // Filter data based on search
  const filteredData = data.filter((item) => {
    if (!globalFilter) return true;
    const search = globalFilter.toLowerCase();
    
    if (item.publicKey.toLowerCase().includes(search)) return true;
    
    return Object.entries(item.account).some(([key, value]) => {
      const valueStr = String(value).toLowerCase();
      return key.toLowerCase().includes(search) || valueStr.includes(search);
    });
  });

  const getFieldTypeColor = (fieldType: string) => {
    if (fieldType === "pubkey") return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    if (fieldType === "bool") return "bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    if (fieldType.startsWith("u") || fieldType.startsWith("i")) return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  };

  const formatFieldValue = useMemo(() => {
    return (field: IdlField, value: unknown) => {
      const fieldType = typeof field.type === "string" ? field.type : "";
      
      switch (fieldType) {
        case "pubkey":
          return value?.toString() || "";
        case "u64":
        case "u32":
        case "u16":
        case "u8":
        case "i64":
        case "i32":
        case "i16":
        case "i8":
          return value ? value.toString() : "0";
        case "bool":
          return value ? "Yes" : "No";
        default:
          if (typeof value === "object" && value !== null) {
            const keys = Object.keys(value);
            if (keys.length === 1) {
              return formatEnumValue(value);
            }
            return JSON.stringify(value, null, 2);
          }
          return String(value ?? "");
      }
    };
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<AccountData>[]>(() => {
    const baseColumns: ColumnDef<AccountData>[] = [
      {
        id: "publicKey",
        header: "Public Key",
        accessorKey: "publicKey",
        cell: ({ row }) => {
          const value = row.getValue("publicKey") as string;
          const shortValue = `${value.slice(0, 4)}...${value.slice(-4)}`;
          return (
            <div className="flex items-center gap-2 group">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-sm font-medium cursor-help">
                      {shortValue}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                    {value}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CopyButton text={value} />
            </div>
          );
        },
      },
    ];

    const dynamicColumns: ColumnDef<AccountData>[] = accountFields.map(
      (field) => {
        const fieldType = typeof field.type === "string" ? field.type : "";
        return {
          id: field.name,
          header: field.name.charAt(0).toUpperCase() + field.name.slice(1),
          accessorFn: (row) => formatFieldValue(field, row.account[field.name]),
          cell: ({ getValue }) => {
            const value = getValue() as string;
            const displayValue = typeof value === "object" && value !== null
              ? JSON.stringify(value, null, 2)
              : String(value ?? "");

            if (fieldType === "pubkey") {
              const shortValue = displayValue.length > 16
                ? `${displayValue.slice(0, 6)}...${displayValue.slice(-6)}`
                : displayValue;
              return (
                <div className="flex items-center gap-2 group">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-sm cursor-help">
                          {shortValue}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                        {displayValue}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <CopyButton text={displayValue} />
                </div>
              );
            }

            if (displayValue.length > 50) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="max-w-[200px] truncate cursor-pointer hover:text-foreground transition-colors">
                        {displayValue}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      className="border-none bg-transparent p-0 shadow-none"
                      side="bottom"
                      align="start"
                    >
                      <div className="relative max-w-sm rounded-lg border bg-popover text-popover-foreground shadow-lg">
                        <div className="absolute top-2 right-2 z-10">
                          <CopyButton
                            text={displayValue}
                            className="hover:bg-muted/80"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-4 pr-12">
                          <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                            {displayValue}
                          </pre>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return (
              <div className="max-w-[200px] truncate">
                {displayValue}
              </div>
            );
          },
        };
      }
    );

    return [...baseColumns, ...dynamicColumns];
  }, [accountFields, formatFieldValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: currentPage,
        pageSize: viewMode === "table" ? 10 : pageSize,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === "function"
        ? updater({ pageIndex: currentPage, pageSize: viewMode === "table" ? 10 : pageSize })
        : updater;
      setCurrentPage(newPagination.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  if (!accountType) {
    return <div>No account type specified</div>;
  }

  const totalPages = viewMode === "table" 
    ? table.getPageCount() 
    : Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-6"
    >
      {/* Header with search, stats, and view toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${accountType?.name || "accounts"}...`}
              className="pl-10 h-10 bg-background border-input shadow-sm focus-visible:ring-2 transition-shadow duration-200"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 px-4 py-2">
            <span className="font-semibold text-primary">{filteredData.length}</span>
            <span className="text-muted-foreground ml-1.5">
              {filteredData.length === 1 ? "account" : "accounts"}
            </span>
          </div>
          <div className="flex items-center rounded-lg border bg-background p-1">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => {
                setViewMode("card");
                setCurrentPage(0);
              }}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => {
                setViewMode("table");
                setCurrentPage(0);
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === "card" ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {paginatedData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paginatedData.map((item, index) => (
                  <motion.div
                    key={item.publicKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.2),
                    }}
                    className="group bg-card border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="px-5 py-4 bg-gradient-to-br from-muted/50 to-muted/20 border-b">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            Public Key
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="font-mono text-sm font-bold truncate cursor-help text-foreground">
                                  {item.publicKey}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="font-mono text-xs max-w-xs break-all">
                                {item.publicKey}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <CopyButton text={item.publicKey} className="opacity-60 group-hover:opacity-100" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      <div className="grid grid-cols-1 gap-4">
                        {accountFields.map((field) => {
                          const value = item.account[field.name];
                          const displayValue = formatFieldValue(field, value);
                          const fullValue = value?.toString() || "";
                          const fieldType = typeof field.type === "string" ? field.type : "";

                          return (
                            <div key={field.name} className="group/field">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {field.name}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold rounded-md border",
                                  getFieldTypeColor(fieldType)
                                )}>
                                  {fieldType}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  {displayValue.length > 200 ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <p className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-lg break-all line-clamp-3 cursor-pointer hover:bg-muted transition-colors">
                                            {displayValue}
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="max-w-lg"
                                          side="left"
                                          align="start"
                                        >
                                          <pre className="text-xs whitespace-pre-wrap break-all font-mono max-h-96 overflow-y-auto p-2">
                                            {displayValue}
                                          </pre>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <p className="text-sm font-mono bg-muted/50 px-3 py-2 rounded-lg break-all">
                                      {displayValue}
                                    </p>
                                  )}
                                </div>
                                {(fieldType === "pubkey" || displayValue.length > 20) && (
                                  <CopyButton 
                                    text={fullValue} 
                                    className="opacity-0 group-hover/field:opacity-100 flex-shrink-0 mt-1"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground"
              >
                <FileText className="h-12 w-12 opacity-50" />
                <div className="text-center">
                  <p className="text-lg font-medium">No accounts found</p>
                  {globalFilter && (
                    <p className="text-sm mt-1">Try adjusting your search</p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border shadow-sm bg-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="border-b bg-muted/20 hover:bg-muted/20"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <div
                              className={cn(
                                "flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors group"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <div className="flex flex-col">
                                {{
                                  asc: (
                                    <ChevronUpIcon
                                      className="h-4 w-4 text-foreground"
                                    />
                                  ),
                                  desc: (
                                    <ChevronDownIcon
                                      className="h-4 w-4 text-foreground"
                                    />
                                  ),
                                }[header.column.getIsSorted() as string] ?? (
                                  <div className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity">
                                    <ChevronUpIcon className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-6 py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <FileText className="h-8 w-8 opacity-50" />
                          <p className="text-sm font-medium">No accounts found</p>
                          {globalFilter && (
                            <p className="text-xs">Try adjusting your search</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage + 1}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>
            {viewMode === "card" && (
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 24, 36, 48].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} cards
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}