"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  Table,
  ChevronDown,
  ChevronUp,
  RefreshCw,
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
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { IdlField, IdlTypeDef } from "@coral-xyz/anchor/dist/cjs/idl";

// Copy button component
const CopyButton = ({ text, className }: { text: string; className?: string }) => {
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
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
};

// Helper to format enum values
const formatEnumValue = (value: unknown): string => {
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const enumKey = keys[0];
      const enumValue = (value as Record<string, unknown>)[enumKey];
      if (
        typeof enumValue === "object" &&
        enumValue !== null &&
        Object.keys(enumValue).length === 0
      ) {
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
  onRefresh?: () => void;
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

export function AccountView({ data, accountType, onRefresh }: AccountViewProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
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

  // Filter data
  const filteredData = data.filter((item) => {
    if (!globalFilter) return true;
    const search = globalFilter.toLowerCase();
    if (item.publicKey.toLowerCase().includes(search)) return true;
    return Object.entries(item.account).some(([key, value]) => {
      const valueStr = String(value).toLowerCase();
      return key.toLowerCase().includes(search) || valueStr.includes(search);
    });
  });

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

  const getFieldTypeColor = (fieldType: string) => {
    if (fieldType === "pubkey") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    if (fieldType === "bool") return "bg-green-500/10 text-green-700 dark:text-green-300";
    if (fieldType.startsWith("u") || fieldType.startsWith("i"))
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
    return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
  };

  // Table columns
  const columns = useMemo<ColumnDef<AccountData>[]>(() => {
    const baseColumns: ColumnDef<AccountData>[] = [
      {
        id: "publicKey",
        header: "Public Key",
        accessorKey: "publicKey",
        cell: ({ row }) => {
          const value = row.getValue("publicKey") as string;
          const shortValue = `${value.slice(0, 6)}...${value.slice(-6)}`;
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
              <CopyButton text={value} className="opacity-0 group-hover:opacity-100" />
            </div>
          );
        },
      },
    ];

    const dynamicColumns: ColumnDef<AccountData>[] = accountFields.map((field) => {
      const fieldType = typeof field.type === "string" ? field.type : "";
      return {
        id: field.name,
        header: field.name.charAt(0).toUpperCase() + field.name.slice(1),
        accessorFn: (row) => formatFieldValue(field, row.account[field.name]),
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const displayValue =
            typeof value === "object" && value !== null
              ? JSON.stringify(value, null, 2)
              : String(value ?? "");

          if (fieldType === "pubkey") {
            const shortValue =
              displayValue.length > 16
                ? `${displayValue.slice(0, 8)}...${displayValue.slice(-8)}`
                : displayValue;
            return (
              <div className="flex items-center gap-2 group">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-sm cursor-help">{shortValue}</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                      {displayValue}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <CopyButton text={displayValue} className="opacity-0 group-hover:opacity-100" />
              </div>
            );
          }

          // Check if value is empty
          const isEmpty = !displayValue || displayValue === "" || displayValue === "null" || displayValue === "undefined";
          
          if (isEmpty) {
            return <span className="text-muted-foreground">-</span>;
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
                  <TooltipContent className="max-w-md" side="bottom" align="start">
                    <div className="flex items-start justify-between gap-2">
                      <pre className="text-xs whitespace-pre-wrap break-all font-mono max-h-60 overflow-y-auto">
                        {displayValue}
                      </pre>
                      <CopyButton text={displayValue} />
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <div className="max-w-[200px] truncate font-mono text-sm">{displayValue}</div>;
        },
      };
    });

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
      const newPagination =
        typeof updater === "function"
          ? updater({
              pageIndex: currentPage,
              pageSize: viewMode === "table" ? 10 : pageSize,
            })
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

  const totalPages =
    viewMode === "table" ? table.getPageCount() : Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  return (
    <div className="flex flex-col space-y-4">
      {/* Simplified header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${accountType?.name || "accounts"}...`}
              className="pl-10 h-11 bg-card/95 backdrop-blur-sm border-2 border-primary/10 focus:border-primary/20 shadow-sm"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            disabled={!onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2">
            <span className="font-bold text-primary">{filteredData.length}</span>
            <span className="text-muted-foreground ml-1.5 text-sm">
              {filteredData.length === 1 ? "account" : "accounts"}
            </span>
          </div>
          <div className="flex items-center rounded-lg border-2 border-primary/10 bg-card/95 backdrop-blur-sm p-1">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              className="h-9 px-3 gap-2"
              onClick={() => {
                setViewMode("card");
                setCurrentPage(0);
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-9 px-3 gap-2"
              onClick={() => {
                setViewMode("table");
                setCurrentPage(0);
              }}
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "card" ? (
        paginatedData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedData.map((item, index) => (
              <motion.div
                key={item.publicKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                whileHover={{ y: -4 }}
                className="group bg-card/95 backdrop-blur-sm border-2 border-primary/10 rounded-xl shadow-lg hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                {/* Card Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Public Key</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-mono text-sm font-bold text-foreground truncate cursor-help break-all">
                              {item.publicKey}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="font-mono text-xs max-w-xs break-all">
                            {item.publicKey}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <CopyButton
                      text={item.publicKey}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                  {accountFields.map((field) => {
                    const value = item.account[field.name];
                    const displayValue = formatFieldValue(field, value);
                    const fullValue = value?.toString() || "";
                    const fieldType = typeof field.type === "string" ? field.type : "";

                    // Check if value is empty/null/undefined
                    const isEmpty = value === null || value === undefined || displayValue === "" || displayValue === "0" && fieldType !== "u64" && fieldType !== "u32" && fieldType !== "u16" && fieldType !== "u8" && fieldType !== "i64" && fieldType !== "i32" && fieldType !== "i16" && fieldType !== "i8";
                    const showValue = isEmpty ? "-" : displayValue;

                    return (
                      <div key={field.name} className="space-y-2.5 group/field">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-foreground">
                              {field.name}
                            </span>
                            {fieldType && (
                              <span
                                className={cn(
                                  "px-2.5 py-1 text-[11px] font-semibold rounded-md border-2",
                                  getFieldTypeColor(fieldType)
                                )}
                              >
                                {fieldType}
                              </span>
                            )}
                          </div>
                          {!isEmpty && (fieldType === "pubkey" || displayValue.length > 20) && (
                            <CopyButton
                              text={fullValue}
                              className="opacity-0 group-hover/field:opacity-100 h-7 w-7"
                            />
                          )}
                        </div>
                        <div>
                          {isEmpty ? (
                            <p className="text-sm font-mono bg-muted/40 px-4 py-3 rounded-lg text-muted-foreground border-2 border-dashed border-muted-foreground/20">
                              -
                            </p>
                          ) : showValue.length > 100 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-sm font-mono bg-muted/40 px-4 py-3 rounded-lg break-all line-clamp-3 cursor-pointer hover:bg-muted/60 transition-colors border-2 border-primary/10">
                                    {showValue}
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md" side="left" align="start">
                                  <pre className="text-xs whitespace-pre-wrap break-all font-mono max-h-60 overflow-y-auto">
                                    {showValue}
                                  </pre>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <p className="text-sm font-mono bg-muted/40 px-4 py-3 rounded-lg break-all border-2 border-primary/10 text-foreground">
                              {showValue}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed border-primary/20 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-lg font-semibold">No accounts found</p>
              {globalFilter && <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-xl border-2 border-primary/10 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <TableComponent>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gradient-to-r from-primary/10 to-primary/5 hover:bg-primary/10 border-b-2 border-primary/20">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="h-14 px-6 font-bold text-xs uppercase tracking-wider text-foreground">
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground group"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <div className="flex flex-col">
                              {{
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronUp className="h-4 w-4 opacity-0 group-hover:opacity-30" />
                              )}
                            </div>
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/60 border-b border-primary/5 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-5 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-50" />
                        <p className="text-sm font-medium">No accounts found</p>
                        {globalFilter && <p className="text-xs">Try adjusting your search</p>}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </TableComponent>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-primary/5">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{currentPage + 1}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </div>
            {viewMode === "card" && (
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-[120px] bg-card/95 backdrop-blur-sm border-2 border-primary/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 12, 18, 24].map((size) => (
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
        </div>
      )}
    </div>
  );
}