import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (row: TData) => void
  filterComponent?: React.ReactNode
  actions?: React.ReactNode
  enableSelection?: boolean
  onSelectionChange?: (rows: TData[]) => void
  rowId?: (row: TData) => string
  initialSorting?: SortingState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Zoeken...",
  pageSize = 25,
  emptyMessage = "Geen resultaten.",
  onRowClick,
  filterComponent,
  actions,
  enableSelection = false,
  onSelectionChange,
  rowId,
  initialSorting,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    initialSorting ?? []
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const onSelectionChangeRef = React.useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange

  // Reset selection when data identity changes (after delete/reload)
  const dataIdsKey = React.useMemo(
    () => (rowId ? data.map((d) => rowId(d)).join(",") : data.length.toString()),
    [data, rowId]
  )
  React.useEffect(() => {
    setRowSelection({})
  }, [dataIdsKey])

  const allColumns = React.useMemo(() => {
    if (!enableSelection) return columns

    const selectionColumn: ColumnDef<TData, unknown> = {
      id: "_select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Selecteer alles"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecteer rij"
          />
        </div>
      ),
      enableSorting: false,
    }

    return [selectionColumn, ...columns]
  }, [columns, enableSelection])

  const getRowId = React.useCallback(
    (row: TData, index: number) => (rowId ? rowId(row) : String(index)),
    [rowId]
  )

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getRowId,
    state: { sorting, columnFilters, rowSelection },
    initialState: { pagination: { pageSize } },
  })

  // Notify parent of selection changes
  React.useEffect(() => {
    if (!enableSelection) return
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
    onSelectionChangeRef.current?.(selectedRows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, enableSelection])

  return (
    <div data-slot="data-table" className="space-y-4">
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}

      {(searchKey || filterComponent) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn(searchKey)?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
          )}
          {filterComponent}
        </div>
      )}

      {enableSelection &&
        table.getIsAllPageRowsSelected() &&
        table.getFilteredRowModel().rows.length >
          table.getRowModel().rows.length && (
          <div className="rounded-lg border bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
            {table.getIsAllRowsSelected() ? (
              <span>
                Alle {table.getFilteredRowModel().rows.length} rijen
                geselecteerd.{" "}
                <button
                  onClick={() => table.toggleAllRowsSelected(false)}
                  className="font-medium underline hover:text-foreground"
                >
                  Selectie opheffen
                </button>
              </span>
            ) : (
              <span>
                Alle {table.getRowModel().rows.length} rijen op deze pagina
                geselecteerd.{" "}
                <button
                  onClick={() => table.toggleAllRowsSelected(true)}
                  className="font-medium underline hover:text-foreground"
                >
                  Selecteer alle {table.getFilteredRowModel().rows.length} rijen
                </button>
              </span>
            )}
          </div>
        )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 transition-colors hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <ArrowUpDown className="size-3.5 text-muted-foreground" />
                      </button>
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={allColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {table.getState().pagination.pageIndex + 1} van{" "}
            {table.getPageCount()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Vorige
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Volgende
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
